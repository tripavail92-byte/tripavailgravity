-- Migration: Add Booking Hold System (temporary reservations with expiration)
-- Purpose: Support 10-minute hold on slots during checkout process

CREATE OR REPLACE FUNCTION get_available_slots(schedule_id_param UUID)
RETURNS INT AS $$
DECLARE
    total_cap INT;
    confirmed_count INT;
    active_pending_count INT;
BEGIN
    -- Get total capacity
    SELECT capacity INTO total_cap FROM public.tour_schedules WHERE id = schedule_id_param;
    
    IF total_cap IS NULL THEN
        RAISE EXCEPTION 'Schedule not found';
    END IF;
    
    -- Count confirmed bookings
    SELECT COALESCE(SUM(pax_count), 0) INTO confirmed_count 
    FROM public.tour_bookings 
    WHERE schedule_id = schedule_id_param AND status = 'confirmed';
    
    -- Count active (non-expired) pending bookings
    SELECT COALESCE(SUM(pax_count), 0) INTO active_pending_count 
    FROM public.tour_bookings 
    WHERE schedule_id = schedule_id_param 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    RETURN total_cap - confirmed_count - active_pending_count;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION update_schedule_booked_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update when booking is confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        UPDATE public.tour_schedules
        SET booked_count = COALESCE(
            (SELECT SUM(pax_count) FROM public.tour_bookings 
             WHERE schedule_id = NEW.schedule_id AND status = 'confirmed'),
            0
        )
        WHERE id = NEW.schedule_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF to_regclass('public.tour_bookings') IS NULL OR to_regclass('public.tour_schedules') IS NULL THEN
        RAISE NOTICE 'Skipping booking hold bootstrap until tour tables exist';
        RETURN;
    END IF;

    ALTER TABLE public.tour_bookings
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_tour_bookings_schedule_status
    ON public.tour_bookings(schedule_id, status);

    CREATE INDEX IF NOT EXISTS idx_tour_bookings_expires_at
    ON public.tour_bookings(expires_at)
    WHERE status = 'pending';

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE policyname = 'Travelers can update own pending bookings'
          AND tablename = 'tour_bookings'
          AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Travelers can update own pending bookings" ON public.tour_bookings
            FOR UPDATE
            USING (auth.uid() = traveler_id AND status = 'pending')
            WITH CHECK (auth.uid() = traveler_id AND status IN ('pending', 'confirmed', 'cancelled'));
    END IF;

    DROP TRIGGER IF EXISTS trigger_update_schedule_booked_count ON public.tour_bookings;
    CREATE TRIGGER trigger_update_schedule_booked_count
    AFTER INSERT OR UPDATE ON public.tour_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_booked_count();
END $$;

-- 6. Grant function access
GRANT EXECUTE ON FUNCTION get_available_slots(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_schedule_booked_count() TO authenticated, service_role;
