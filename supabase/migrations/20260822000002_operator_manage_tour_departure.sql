-- Sprint 3 / operator supply — manage tour departures after publish.
--
-- Before this, departures could only be set through the create/edit wizard's first schedule row, and
-- the wizard's autosave hardcodes is_published=false + workflow_status='in_progress' — so editing a
-- live tour's departures unpublished it. Every tour was effectively locked to one date and went
-- permanently unbookable once it passed.
--
-- This RPC mutates tour_schedules DIRECTLY (add/update/cancel/delete) and re-derives the tours.schedules
-- JSON in the SAME transaction (so the wizard's JSON->table sync stays a no-op), and NEVER touches
-- is_published/workflow_status — so the live tour stays live. Cancelling never deletes a departure with
-- history (FK is ON DELETE RESTRICT); it just drops it from sale via the scheduled+future filter.

CREATE OR REPLACE FUNCTION public.operator_manage_tour_departure(
  p_tour_id        uuid,
  p_action         text,
  p_schedule_id    uuid DEFAULT NULL,
  p_start_time     timestamptz DEFAULT NULL,
  p_end_time       timestamptz DEFAULT NULL,
  p_capacity       int DEFAULT NULL,
  p_price_override numeric DEFAULT NULL,
  p_status         text DEFAULT NULL
)
RETURNS public.tour_schedules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row    public.tour_schedules;
  v_booked int;
BEGIN
  -- Ownership: only the tour's operator may manage its departures.
  IF NOT EXISTS (SELECT 1 FROM public.tours WHERE id = p_tour_id AND operator_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to manage this tour''s departures' USING ERRCODE = '42501';
  END IF;

  IF p_action = 'add' THEN
    IF p_start_time IS NULL THEN
      RAISE EXCEPTION 'A departure date/time is required';
    END IF;
    IF p_start_time <= now() THEN
      RAISE EXCEPTION 'A departure must be in the future' USING ERRCODE = '23514';
    END IF;
    IF COALESCE(p_capacity, 0) <= 0 THEN
      RAISE EXCEPTION 'Capacity must be at least 1' USING ERRCODE = '23514';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.tour_schedules
      WHERE tour_id = p_tour_id AND start_time = p_start_time AND status <> 'cancelled'
    ) THEN
      RAISE EXCEPTION 'A departure already exists at that date and time' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.tour_schedules (tour_id, start_time, end_time, capacity, price_override, status)
    VALUES (p_tour_id, p_start_time, COALESCE(p_end_time, p_start_time), p_capacity, p_price_override, 'scheduled')
    RETURNING * INTO v_row;

  ELSIF p_action IN ('update', 'cancel', 'delete') THEN
    IF p_schedule_id IS NULL THEN
      RAISE EXCEPTION 'A departure id is required';
    END IF;
    SELECT * INTO v_row FROM public.tour_schedules
      WHERE id = p_schedule_id AND tour_id = p_tour_id
      FOR UPDATE;
    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'Departure not found';
    END IF;
    v_booked := COALESCE(v_row.booked_count, 0);

    IF p_action = 'update' THEN
      IF p_capacity IS NOT NULL AND p_capacity < v_booked THEN
        RAISE EXCEPTION 'Capacity (%) is below the % seat(s) already booked', p_capacity, v_booked
          USING ERRCODE = '23514';
      END IF;
      IF p_start_time IS NOT NULL AND p_start_time <> v_row.start_time AND v_booked > 0 THEN
        RAISE EXCEPTION 'Cannot move a departure that already has bookings' USING ERRCODE = '23514';
      END IF;
      UPDATE public.tour_schedules
      SET start_time     = COALESCE(p_start_time, start_time),
          end_time       = COALESCE(p_end_time, end_time),
          capacity       = COALESCE(p_capacity, capacity),
          price_override = CASE WHEN p_price_override IS NULL THEN price_override ELSE p_price_override END,
          status         = COALESCE(p_status, status)
      WHERE id = p_schedule_id
      RETURNING * INTO v_row;

    ELSIF p_action = 'cancel' THEN
      UPDATE public.tour_schedules SET status = 'cancelled'
      WHERE id = p_schedule_id
      RETURNING * INTO v_row;

    ELSIF p_action = 'delete' THEN
      IF v_booked > 0 OR EXISTS (SELECT 1 FROM public.tour_bookings WHERE schedule_id = p_schedule_id) THEN
        RAISE EXCEPTION 'Cannot delete a departure that has bookings — cancel it instead'
          USING ERRCODE = '23514';
      END IF;
      DELETE FROM public.tour_schedules WHERE id = p_schedule_id;
      -- v_row already holds the pre-delete row for the return value.
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown action: %', p_action;
  END IF;

  -- Re-derive tours.schedules JSON from the table so the wizard's JSON->table sync stays a no-op.
  -- JSON mirrors the table exactly (cancelled rows included) so nothing is silently re-added/removed.
  UPDATE public.tours
  SET schedules = (
        SELECT COALESCE(
          jsonb_agg(jsonb_build_object(
            'start_time', start_time,
            'end_time', end_time,
            'capacity', capacity,
            'status', status,
            'price_override', price_override
          ) ORDER BY start_time),
          '[]'::jsonb)
        FROM public.tour_schedules
        WHERE tour_id = p_tour_id
      ),
      updated_at = now()
  WHERE id = p_tour_id;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.operator_manage_tour_departure(
  uuid, text, uuid, timestamptz, timestamptz, int, numeric, text
) TO authenticated, service_role;
