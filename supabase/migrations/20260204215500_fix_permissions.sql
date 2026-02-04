-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure RLS is enabled on all tables (sanity check)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traveller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_operator_profiles ENABLE ROW LEVEL SECURITY;
