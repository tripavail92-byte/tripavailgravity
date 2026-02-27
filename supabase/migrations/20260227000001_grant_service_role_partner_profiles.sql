-- Grant service_role access to partner profile tables
-- Some operational scripts (service role) need to inspect/update these tables.
-- This does NOT weaken public access because service_role keys are server-side only.

BEGIN;

GRANT ALL ON TABLE public.tour_operator_profiles TO service_role;
GRANT ALL ON TABLE public.hotel_manager_profiles TO service_role;

COMMIT;
