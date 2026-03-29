-- Phase 16b: Public storefront read-access hardening

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.tour_operator_profiles TO anon, authenticated;
GRANT SELECT ON public.operator_public_metrics TO anon, authenticated;
GRANT SELECT ON public.operator_awards TO anon, authenticated;
GRANT SELECT ON public.tour_booking_reviews TO anon, authenticated;
GRANT SELECT ON public.tour_review_replies TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_operator_profiles" ON public.tour_operator_profiles;
CREATE POLICY "public_read_operator_profiles"
  ON public.tour_operator_profiles
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "public_read_operator_metrics" ON public.operator_public_metrics;
CREATE POLICY "public_read_operator_metrics"
  ON public.operator_public_metrics
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "public_read_operator_awards" ON public.operator_awards;
CREATE POLICY "public_read_operator_awards"
  ON public.operator_awards
  FOR SELECT
  USING (true);