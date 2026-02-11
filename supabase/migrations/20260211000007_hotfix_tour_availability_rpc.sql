-- Hotfix: Ensure tour availability RPC works in production
-- Fixes cases where Seats Available shows 0 due to missing/broken get_available_slots()

-- 1) Ensure expires_at exists (used by hold system)
ALTER TABLE public.tour_bookings
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2) Recreate get_available_slots with safe logic + proper privileges
-- SECURITY DEFINER so it can read booking rows to compute availability
CREATE OR REPLACE FUNCTION public.get_available_slots(schedule_id_param UUID)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_cap INT;
    confirmed_count INT;
    active_pending_count INT;
BEGIN
    SELECT capacity INTO total_cap
    FROM public.tour_schedules
    WHERE id = schedule_id_param;

    IF total_cap IS NULL THEN
        RAISE EXCEPTION 'Schedule not found';
    END IF;

    SELECT COALESCE(SUM(pax_count), 0)
    INTO confirmed_count
    FROM public.tour_bookings
    WHERE schedule_id = schedule_id_param
      AND status = 'confirmed';

    SELECT COALESCE(SUM(pax_count), 0)
    INTO active_pending_count
    FROM public.tour_bookings
    WHERE schedule_id = schedule_id_param
      AND status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at > NOW();

    RETURN GREATEST(total_cap - confirmed_count - active_pending_count, 0);
END;
$$;

-- 3) Ensure roles can execute the function
GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID) TO authenticated, anon, service_role;
