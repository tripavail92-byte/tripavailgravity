-- Diagnostic query to check tour and schedule data
-- Run this to see what's in the database

-- Check tours
SELECT 
    id, 
    title, 
    is_active, 
    is_published, 
    max_participants,
    created_at
FROM public.tours
ORDER BY created_at DESC
LIMIT 10;

-- Check schedules
SELECT 
    ts.id,
    ts.tour_id,
    t.title as tour_name,
    ts.start_time,
    ts.capacity,
    ts.booked_count,
    ts.status
FROM public.tour_schedules ts
JOIN public.tours t ON t.id = ts.tour_id
ORDER BY ts.start_time
LIMIT 20;

-- Check available seats for each tour
SELECT 
    t.id as tour_id,
    t.title,
    COUNT(ts.id) as total_schedules,
    MAX(ts.capacity) as capacity_per_schedule,
    MIN(ts.start_time) as earliest_departure
FROM public.tours t
LEFT JOIN public.tour_schedules ts ON ts.tour_id = t.id AND ts.status = 'scheduled'
WHERE t.is_published = true
GROUP BY t.id, t.title;
