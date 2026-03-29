-- Phase 14: Operator gallery, awards, and admin verification workflow

ALTER TABLE public.tour_operator_profiles
  ADD COLUMN IF NOT EXISTS gallery_media JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.operator_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES public.tour_operator_profiles(user_id) ON DELETE CASCADE,
  award_code TEXT NOT NULL,
  award_name TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  metadata JSONB NULL DEFAULT '{}'::jsonb,
  CONSTRAINT operator_awards_unique UNIQUE (operator_id, award_code)
);

ALTER TABLE public.operator_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_operator_awards" ON public.operator_awards;
CREATE POLICY "public_read_operator_awards"
  ON public.operator_awards
  FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS public.operator_verification_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES public.tour_operator_profiles(user_id) ON DELETE CASCADE,
  verification_key TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('verified', 'rejected', 'cleared')),
  notes TEXT NULL,
  reviewed_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_verification_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_operator_verification_reviews" ON public.operator_verification_reviews;
CREATE POLICY "admins_read_operator_verification_reviews"
  ON public.operator_verification_reviews
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.refresh_operator_awards(p_operator_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metrics RECORD;
  v_profile RECORD;
  v_fleet_count INT := 0;
BEGIN
  SELECT * INTO v_metrics
  FROM public.operator_public_metrics
  WHERE operator_id = p_operator_id;

  SELECT
    verification_documents,
    fleet_assets,
    guide_profiles,
    categories,
    gallery_media
  INTO v_profile
  FROM public.tour_operator_profiles
  WHERE user_id = p_operator_id;

  v_fleet_count := COALESCE(jsonb_array_length(COALESCE(v_profile.fleet_assets, '[]'::jsonb)), 0);

  DELETE FROM public.operator_awards
  WHERE operator_id = p_operator_id
    AND award_code IN (
      'top_rated',
      'low_cancellation',
      'verified_premium',
      'trusted_fleet',
      'review_ready',
      'media_showcase'
    );

  IF COALESCE(v_metrics.avg_rating, 0) >= 4.7 AND COALESCE(v_metrics.total_reviews, 0) >= 5 THEN
    INSERT INTO public.operator_awards (operator_id, award_code, award_name, metadata)
    VALUES (p_operator_id, 'top_rated', 'Top Rated Operator', jsonb_build_object('avg_rating', v_metrics.avg_rating, 'total_reviews', v_metrics.total_reviews))
    ON CONFLICT (operator_id, award_code) DO NOTHING;
  END IF;

  IF COALESCE(v_metrics.cancellation_rate, 100) <= 5 AND COALESCE(v_metrics.total_completed_bookings, 0) >= 5 THEN
    INSERT INTO public.operator_awards (operator_id, award_code, award_name, metadata)
    VALUES (p_operator_id, 'low_cancellation', 'Low Cancellation', jsonb_build_object('cancellation_rate', v_metrics.cancellation_rate))
    ON CONFLICT (operator_id, award_code) DO NOTHING;
  END IF;

  IF COALESCE(v_metrics.verified_badge_count, 0) >= 4 THEN
    INSERT INTO public.operator_awards (operator_id, award_code, award_name, metadata)
    VALUES (p_operator_id, 'verified_premium', 'Verified Premium', jsonb_build_object('verified_badge_count', v_metrics.verified_badge_count))
    ON CONFLICT (operator_id, award_code) DO NOTHING;
  END IF;

  IF v_fleet_count >= 1 AND COALESCE(v_profile.verification_documents->>'vehicleDocsVerified', 'false') = 'true' THEN
    INSERT INTO public.operator_awards (operator_id, award_code, award_name, metadata)
    VALUES (p_operator_id, 'trusted_fleet', 'Trusted Fleet', jsonb_build_object('fleet_count', v_fleet_count))
    ON CONFLICT (operator_id, award_code) DO NOTHING;
  END IF;

  IF COALESCE(v_metrics.total_reviews, 0) >= 3 AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(v_profile.guide_profiles, '[]'::jsonb)) AS guide
    WHERE jsonb_array_length(COALESCE(guide->'certifications', '[]'::jsonb)) > 0
  ) THEN
    INSERT INTO public.operator_awards (operator_id, award_code, award_name, metadata)
    VALUES (p_operator_id, 'review_ready', 'Guide-Qualified', jsonb_build_object('total_reviews', v_metrics.total_reviews))
    ON CONFLICT (operator_id, award_code) DO NOTHING;
  END IF;

  IF COALESCE(jsonb_array_length(COALESCE(v_profile.gallery_media, '[]'::jsonb)), 0) >= 4 THEN
    INSERT INTO public.operator_awards (operator_id, award_code, award_name, metadata)
    VALUES (p_operator_id, 'media_showcase', 'Media Showcase', jsonb_build_object('gallery_count', jsonb_array_length(COALESCE(v_profile.gallery_media, '[]'::jsonb))))
    ON CONFLICT (operator_id, award_code) DO NOTHING;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_operator_verification_flag(
  p_operator_id UUID,
  p_verification_key TEXT,
  p_verified BOOLEAN,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_decision TEXT;
  v_value JSONB;
  v_notes_key TEXT;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'admin privileges required';
  END IF;

  IF p_verification_key IS NULL OR trim(p_verification_key) = '' THEN
    RAISE EXCEPTION 'verification key is required';
  END IF;

  v_decision := CASE WHEN p_verified THEN 'verified' ELSE 'cleared' END;
  v_value := to_jsonb(p_verified);
  v_notes_key := p_verification_key || 'Notes';

  UPDATE public.tour_operator_profiles
  SET verification_documents = COALESCE(verification_documents, '{}'::jsonb)
    || jsonb_build_object(p_verification_key, v_value)
    || jsonb_build_object(v_notes_key, to_jsonb(NULLIF(trim(COALESCE(p_notes, '')), '')))
    || jsonb_build_object('verificationLastReviewedAt', to_jsonb(now()))
    || jsonb_build_object('verificationLastReviewedBy', to_jsonb(v_admin_id::text))
  WHERE user_id = p_operator_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'operator profile not found';
  END IF;

  INSERT INTO public.operator_verification_reviews (
    operator_id,
    verification_key,
    decision,
    notes,
    reviewed_by
  )
  VALUES (
    p_operator_id,
    p_verification_key,
    v_decision,
    NULLIF(trim(COALESCE(p_notes, '')), ''),
    v_admin_id
  );

  PERFORM public.refresh_operator_public_metrics(p_operator_id);
  PERFORM public.refresh_operator_awards(p_operator_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_fn_refresh_operator_awards_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_operator_awards(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_fn_refresh_operator_awards_on_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_operator_awards(NEW.operator_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_operator_awards_profile ON public.tour_operator_profiles;
CREATE TRIGGER trg_refresh_operator_awards_profile
  AFTER INSERT OR UPDATE OF verification_documents, fleet_assets, guide_profiles, gallery_media, categories
  ON public.tour_operator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_refresh_operator_awards_on_profile();

DROP TRIGGER IF EXISTS trg_refresh_operator_awards_metrics ON public.operator_public_metrics;
CREATE TRIGGER trg_refresh_operator_awards_metrics
  AFTER INSERT OR UPDATE OF avg_rating, total_reviews, total_completed_bookings, cancellation_rate, verified_badge_count
  ON public.operator_public_metrics
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_refresh_operator_awards_on_metrics();

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT user_id FROM public.tour_operator_profiles LOOP
    PERFORM public.refresh_operator_awards(r.user_id);
  END LOOP;
END;
$$;