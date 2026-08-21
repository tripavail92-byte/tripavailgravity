-- Sprint 2 / booking integrity — atomic tour capacity guard.
--
-- Problem: tour holds were created by a plain client insert into tour_bookings after a lock-free
-- get_available_slots read (a check-then-act TOCTOU). N concurrent checkouts on the same departure
-- each read the same pre-insert availability, each pass, and each insert — overselling the schedule.
-- (The package flow already gates inserts through create_package_booking_atomic; tours did not.)
--
-- Fix: a BEFORE INSERT trigger that (1) locks the tour_schedules row so concurrent inserts on the
-- same departure serialize, then (2) re-checks availability via the SAME get_available_slots math the
-- app uses, and rejects an over-capacity hold. The happy-path INSERT is unchanged — a valid booking
-- passes straight through — so the tested create-booking path keeps its exact shape and return.

CREATE OR REPLACE FUNCTION public.enforce_tour_schedule_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INT;
  v_requested INT := COALESCE(NEW.pax_count, 0);
BEGIN
  -- Only seat-consuming holds/confirmations are guarded; nothing to enforce without a schedule.
  IF NEW.status NOT IN ('pending', 'confirmed') OR NEW.schedule_id IS NULL OR v_requested <= 0 THEN
    RETURN NEW;
  END IF;

  -- Serialize concurrent inserts on the same departure: take the schedule row lock FIRST, so the
  -- availability read below cannot race another in-flight hold on the same schedule.
  PERFORM 1 FROM public.tour_schedules WHERE id = NEW.schedule_id FOR UPDATE;

  -- Availability EXCLUDING this not-yet-inserted row (we are BEFORE INSERT), identical math to the
  -- app's get_available_slots (capacity − confirmed − active-unexpired-pending).
  v_available := public.get_available_slots(NEW.schedule_id);

  IF v_requested > v_available THEN
    RAISE EXCEPTION 'Schedule capacity exceeded: only % seat(s) available for this departure', v_available
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_tour_schedule_capacity ON public.tour_bookings;
CREATE TRIGGER trg_enforce_tour_schedule_capacity
  BEFORE INSERT ON public.tour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tour_schedule_capacity();
