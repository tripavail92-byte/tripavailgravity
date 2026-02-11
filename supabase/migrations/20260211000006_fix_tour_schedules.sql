-- Fix tour schedules - delete old ones and create fresh availability
-- This ensures all tours have 14 days of bookable schedules

DO $$
DECLARE
    v_tour_record RECORD;
BEGIN
    -- Delete all existing schedules for tours
    DELETE FROM public.tour_schedules
    WHERE tour_id IN (
        SELECT id FROM public.tours WHERE is_published = true
    );

    -- Create 14 days of schedules for each published tour
    FOR v_tour_record IN 
        SELECT id, duration, max_participants FROM public.tours WHERE is_published = true
    LOOP
        INSERT INTO public.tour_schedules (tour_id, start_time, end_time, capacity, booked_count, status)
        SELECT 
            v_tour_record.id,
            (CURRENT_DATE + day_num * interval '1 day' + time '09:00:00') AT TIME ZONE 'UTC',
            (CURRENT_DATE + day_num * interval '1 day' + time '09:00:00' + 
                (CASE 
                    WHEN v_tour_record.duration LIKE '%8 hour%' THEN interval '8 hours'
                    WHEN v_tour_record.duration LIKE '%6 hour%' THEN interval '6 hours'
                    WHEN v_tour_record.duration LIKE '%4 hour%' THEN interval '4 hours'
                    WHEN v_tour_record.duration LIKE '%3.5 hour%' THEN interval '3.5 hours'
                    ELSE interval '3 hours'
                END)
            ) AT TIME ZONE 'UTC',
            v_tour_record.max_participants,
            0,
            'scheduled'
        FROM generate_series(1, 14) AS day_num;
        
        RAISE NOTICE 'Created 14 schedules for tour %', v_tour_record.id;
    END LOOP;
    
    RAISE NOTICE 'Successfully refreshed schedules for all published tours';
END $$;
