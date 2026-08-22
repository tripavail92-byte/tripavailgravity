-- Self-serve reschedule: move a confirmed booking to another future departure of the SAME tour,
-- allowed up to the tour's cancellation-policy cutoff before the current departure (Option A —
-- reuse the cancellation window). Price is unchanged (stays out of the payment/refund path).
--
-- Correctness note: update_schedule_booked_count (20260210000001) only recomputes booked_count on
-- the TRANSITION to 'confirmed' — it does nothing on a plain schedule_id change — so this function
-- recomputes booked_count for BOTH the old and new departures itself. tour_bookings has no
-- updated_at column, so we do not touch one.

CREATE OR REPLACE FUNCTION public.traveler_reschedule_tour_booking(
  p_booking_id      uuid,
  p_new_schedule_id uuid
)
RETURNS public.tour_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking     public.tour_bookings;
  v_old_sched   uuid;
  v_cur_start   timestamptz;
  v_policy      text;
  v_cutoff_days int;
  v_new_sched   public.tour_schedules;
  v_available   int;
BEGIN
  -- Load + lock the booking; it must belong to the caller and be confirmed.
  SELECT * INTO v_booking FROM public.tour_bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  IF v_booking.traveler_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to change this booking' USING ERRCODE = '42501';
  END IF;
  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only a confirmed booking can be rescheduled' USING ERRCODE = '23514';
  END IF;

  v_old_sched := v_booking.schedule_id;
  IF v_old_sched = p_new_schedule_id THEN
    RAISE EXCEPTION 'Pick a different departure' USING ERRCODE = '23514';
  END IF;

  -- Cancellation policy of the tour → reschedule cutoff (days before the CURRENT departure).
  SELECT lower(coalesce(t.cancellation_policy, 'flexible')), s.start_time
    INTO v_policy, v_cur_start
    FROM public.tours t
    JOIN public.tour_schedules s ON s.id = v_old_sched
   WHERE t.id = v_booking.tour_id;

  v_cutoff_days := CASE v_policy
    WHEN 'flexible' THEN 2
    WHEN 'moderate' THEN 5
    WHEN 'strict'   THEN 14
    ELSE -1  -- non-refundable / unknown → rescheduling not offered
  END;
  IF v_cutoff_days < 0 THEN
    RAISE EXCEPTION 'This booking''s policy does not allow rescheduling' USING ERRCODE = '23514';
  END IF;
  IF now() >= v_cur_start - make_interval(days => v_cutoff_days) THEN
    RAISE EXCEPTION 'Too close to departure to reschedule (allowed up to % day(s) before)',
      v_cutoff_days USING ERRCODE = '23514';
  END IF;

  -- Load + lock the target departure; same tour, open for booking, in the future.
  SELECT * INTO v_new_sched FROM public.tour_schedules WHERE id = p_new_schedule_id FOR UPDATE;
  IF v_new_sched.id IS NULL THEN
    RAISE EXCEPTION 'Departure not found';
  END IF;
  IF v_new_sched.tour_id <> v_booking.tour_id THEN
    RAISE EXCEPTION 'That departure belongs to a different tour' USING ERRCODE = '23514';
  END IF;
  IF v_new_sched.status <> 'scheduled' THEN
    RAISE EXCEPTION 'That departure is not open for booking' USING ERRCODE = '23514';
  END IF;
  IF v_new_sched.start_time <= now() THEN
    RAISE EXCEPTION 'That departure is in the past' USING ERRCODE = '23514';
  END IF;

  -- Capacity on the target — excludes this booking, which is still on the old departure.
  v_available := public.get_available_slots(p_new_schedule_id);
  IF v_booking.pax_count > v_available THEN
    RAISE EXCEPTION 'Only % seat(s) left on that departure', v_available USING ERRCODE = '23514';
  END IF;

  -- Move it, recording where it came from.
  UPDATE public.tour_bookings
     SET schedule_id = p_new_schedule_id,
         metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
           'rescheduled_at', now(),
           'rescheduled_from_schedule', v_old_sched,
           'rescheduled_from_start', v_cur_start
         )
   WHERE id = p_booking_id
   RETURNING * INTO v_booking;

  -- Recompute booked_count for BOTH departures (the trigger won't, on a move).
  UPDATE public.tour_schedules s
     SET booked_count = COALESCE(
           (SELECT SUM(pax_count) FROM public.tour_bookings
             WHERE schedule_id = s.id AND status = 'confirmed'), 0)
   WHERE s.id IN (v_old_sched, p_new_schedule_id);

  RETURN v_booking;
END;
$$;

GRANT EXECUTE ON FUNCTION public.traveler_reschedule_tour_booking(uuid, uuid) TO authenticated;
