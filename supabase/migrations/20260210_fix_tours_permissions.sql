-- Final fix for tour permissions
-- Ensuring newly created tables have explicit grants for Supabase roles

GRANT ALL ON public.tours TO authenticated, anon, service_role;
GRANT ALL ON public.tour_schedules TO authenticated, anon, service_role;
GRANT ALL ON public.tour_bookings TO authenticated, anon, service_role;

-- Also ensure future tables in public schema get these grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, anon, service_role;

-- Re-verify RLS status
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;
