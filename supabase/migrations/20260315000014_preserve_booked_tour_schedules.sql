-- Preserve booked tour schedules when operators resync schedule JSON.
-- The previous implementation deleted every schedule for a tour and recreated them,
-- which cascaded and removed linked tour_bookings via schedule_id.

ALTER TABLE public.tour_bookings
  DROP CONSTRAINT IF EXISTS tour_bookings_schedule_id_fkey;

ALTER TABLE public.tour_bookings
  ADD CONSTRAINT tour_bookings_schedule_id_fkey
  FOREIGN KEY (schedule_id)
  REFERENCES public.tour_schedules(id)
  ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION public.sync_tour_schedules_from_json(
  p_tour_id UUID,
  p_schedules JSONB,
  p_default_capacity INT DEFAULT 10
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  schedule_item JSONB;
  start_ts TIMESTAMPTZ;
  end_ts TIMESTAMPTZ;
  seat_capacity INT;
  schedule_status TEXT;
BEGIN
  IF p_tour_id IS NULL THEN
    RAISE EXCEPTION 'p_tour_id is required';
  END IF;

  CREATE TEMP TABLE tmp_incoming_tour_schedules (
    start_time TIMESTAMPTZ PRIMARY KEY,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INT NOT NULL,
    status TEXT NOT NULL
  ) ON COMMIT DROP;

  IF p_schedules IS NOT NULL AND jsonb_typeof(p_schedules) = 'array' THEN
    FOR schedule_item IN
      SELECT value
      FROM jsonb_array_elements(p_schedules)
    LOOP
      IF COALESCE(schedule_item->>'start_time', '') <> '' THEN
        start_ts := (schedule_item->>'start_time')::timestamptz;
      ELSIF COALESCE(schedule_item->>'date', '') <> '' THEN
        start_ts := (
          (schedule_item->>'date') ||
          'T' ||
          COALESCE(NULLIF(schedule_item->>'time', ''), '09:00') ||
          ':00'
        )::timestamptz;
      ELSE
        CONTINUE;
      END IF;

      IF COALESCE(schedule_item->>'end_time', '') <> '' THEN
        end_ts := (schedule_item->>'end_time')::timestamptz;
      ELSE
        end_ts := start_ts + INTERVAL '2 hours';
      END IF;

      seat_capacity := GREATEST(
        1,
        COALESCE(NULLIF(schedule_item->>'capacity', '')::INT, p_default_capacity, 10)
      );

      schedule_status := COALESCE(NULLIF(schedule_item->>'status', ''), 'scheduled');
      IF schedule_status NOT IN ('scheduled', 'cancelled', 'completed') THEN
        schedule_status := 'scheduled';
      END IF;

      INSERT INTO tmp_incoming_tour_schedules (start_time, end_time, capacity, status)
      VALUES (start_ts, end_ts, seat_capacity, schedule_status)
      ON CONFLICT (start_time)
      DO UPDATE SET
        end_time = EXCLUDED.end_time,
        capacity = EXCLUDED.capacity,
        status = EXCLUDED.status;
    END LOOP;
  END IF;

  UPDATE public.tour_schedules AS existing
  SET
    end_time = incoming.end_time,
    capacity = incoming.capacity,
    status = incoming.status
  FROM tmp_incoming_tour_schedules AS incoming
  WHERE existing.tour_id = p_tour_id
    AND existing.start_time = incoming.start_time;

  INSERT INTO public.tour_schedules (
    tour_id,
    start_time,
    end_time,
    capacity,
    status
  )
  SELECT
    p_tour_id,
    incoming.start_time,
    incoming.end_time,
    incoming.capacity,
    incoming.status
  FROM tmp_incoming_tour_schedules AS incoming
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.tour_schedules AS existing
    WHERE existing.tour_id = p_tour_id
      AND existing.start_time = incoming.start_time
  );

  DELETE FROM public.tour_schedules AS existing
  WHERE existing.tour_id = p_tour_id
    AND NOT EXISTS (
      SELECT 1
      FROM tmp_incoming_tour_schedules AS incoming
      WHERE incoming.start_time = existing.start_time
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.tour_bookings AS booking
      WHERE booking.schedule_id = existing.id
        AND booking.status IN ('pending', 'confirmed', 'completed')
    );
END;
$$;