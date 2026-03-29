-- Phase 16: Richer operator awards, expirations, and admin overrides

ALTER TABLE public.operator_awards
  ADD COLUMN IF NOT EXISTS award_source TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS admin_note TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'operator_awards_source_check'
      AND conrelid = 'public.operator_awards'::regclass
  ) THEN
    ALTER TABLE public.operator_awards
      ADD CONSTRAINT operator_awards_source_check
      CHECK (award_source IN ('system', 'admin'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS operator_awards_operator_source_idx
  ON public.operator_awards(operator_id, award_source, awarded_at DESC);

CREATE TABLE IF NOT EXISTS public.operator_award_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES public.tour_operator_profiles(user_id) ON DELETE CASCADE,
  award_code TEXT NOT NULL,
  override_mode TEXT NOT NULL CHECK (override_mode IN ('grant', 'revoke')),
  award_name TEXT NULL,
  expires_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  admin_note TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT operator_award_overrides_unique UNIQUE (operator_id, award_code)
);

ALTER TABLE public.operator_award_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_operator_award_overrides" ON public.operator_award_overrides;
CREATE POLICY "admins_read_operator_award_overrides"
  ON public.operator_award_overrides
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.upsert_operator_award(
  p_operator_id UUID,
  p_award_code TEXT,
  p_award_name TEXT,
  p_award_source TEXT,
  p_expires_at TIMESTAMPTZ,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.operator_awards (
    operator_id,
    award_code,
    award_name,
    awarded_at,
    expires_at,
    metadata,
    award_source,
    admin_note
  )
  VALUES (
    p_operator_id,
    p_award_code,
    p_award_name,
    now(),
    p_expires_at,
    COALESCE(p_metadata, '{}'::jsonb),
    p_award_source,
    NULLIF(trim(COALESCE(p_admin_note, '')), '')
  )
  ON CONFLICT (operator_id, award_code) DO UPDATE SET
    award_name = EXCLUDED.award_name,
    awarded_at = EXCLUDED.awarded_at,
    expires_at = EXCLUDED.expires_at,
    metadata = EXCLUDED.metadata,
    award_source = EXCLUDED.award_source,
    admin_note = EXCLUDED.admin_note;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_operator_awards(p_operator_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metrics RECORD;
  v_profile RECORD;
  v_override RECORD;
  v_fleet_count INT := 0;
  v_guide_count INT := 0;
  v_gallery_count INT := 0;
  v_policy_count INT := 0;
  v_active_tours INT := 0;
  v_replied_reviews INT := 0;
  v_reply_rate NUMERIC(5,2) := 0;
BEGIN
  SELECT * INTO v_metrics
  FROM public.operator_public_metrics
  WHERE operator_id = p_operator_id;

  SELECT
    verification_documents,
    verification_urls,
    fleet_assets,
    guide_profiles,
    categories,
    gallery_media,
    public_policies,
    phone_number,
    email
  INTO v_profile
  FROM public.tour_operator_profiles
  WHERE user_id = p_operator_id;

  v_fleet_count := COALESCE(jsonb_array_length(COALESCE(v_profile.fleet_assets, '[]'::jsonb)), 0);
  v_guide_count := COALESCE(jsonb_array_length(COALESCE(v_profile.guide_profiles, '[]'::jsonb)), 0);
  v_gallery_count := COALESCE(jsonb_array_length(COALESCE(v_profile.gallery_media, '[]'::jsonb)), 0);

  v_policy_count :=
    CASE WHEN NULLIF(trim(COALESCE(v_profile.public_policies->>'cancellation', '')), '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NULLIF(trim(COALESCE(v_profile.public_policies->>'deposit', '')), '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NULLIF(trim(COALESCE(v_profile.public_policies->>'pickup', '')), '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NULLIF(trim(COALESCE(v_profile.public_policies->>'child', '')), '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NULLIF(trim(COALESCE(v_profile.public_policies->>'refund', '')), '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NULLIF(trim(COALESCE(v_profile.public_policies->>'weather', '')), '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NULLIF(trim(COALESCE(v_profile.public_policies->>'emergency', '')), '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NULLIF(trim(COALESCE(v_profile.public_policies->>'supportHours', '')), '') IS NOT NULL THEN 1 ELSE 0 END;

  SELECT COUNT(*)::INT
  INTO v_active_tours
  FROM public.tours
  WHERE operator_id = p_operator_id
    AND is_active = true;

  SELECT COUNT(DISTINCT tbr.id)::INT
  INTO v_replied_reviews
  FROM public.tour_booking_reviews tbr
  JOIN public.tours t ON t.id = tbr.tour_id
  JOIN public.tour_review_replies trr ON trr.review_id = tbr.id
  WHERE t.operator_id = p_operator_id
    AND tbr.status = 'published';

  IF COALESCE(v_metrics.total_reviews, 0) > 0 THEN
    v_reply_rate := ROUND((v_replied_reviews::NUMERIC / v_metrics.total_reviews::NUMERIC) * 100, 2);
  END IF;

  DELETE FROM public.operator_awards
  WHERE operator_id = p_operator_id
    AND award_source = 'system';

  IF COALESCE(v_metrics.avg_rating, 0) >= 4.7 AND COALESCE(v_metrics.total_reviews, 0) >= 5 THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'top_rated',
      'Top Rated Operator',
      'system',
      now() + interval '90 days',
      jsonb_build_object('avg_rating', v_metrics.avg_rating, 'total_reviews', v_metrics.total_reviews)
    );
  END IF;

  IF COALESCE(v_metrics.cancellation_rate, 100) <= 5 AND COALESCE(v_metrics.total_completed_bookings, 0) >= 5 THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'low_cancellation',
      'Low Cancellation',
      'system',
      now() + interval '120 days',
      jsonb_build_object('cancellation_rate', v_metrics.cancellation_rate)
    );
  END IF;

  IF COALESCE(v_metrics.verified_badge_count, 0) >= 4 THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'verified_premium',
      'Verified Premium',
      'system',
      now() + interval '180 days',
      jsonb_build_object('verified_badge_count', v_metrics.verified_badge_count)
    );
  END IF;

  IF v_fleet_count >= 1 AND COALESCE(v_profile.verification_documents->>'vehicleDocsVerified', 'false') = 'true' THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'trusted_fleet',
      'Trusted Fleet',
      'system',
      now() + interval '180 days',
      jsonb_build_object('fleet_count', v_fleet_count)
    );
  END IF;

  IF COALESCE(v_metrics.total_reviews, 0) >= 3 AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(v_profile.guide_profiles, '[]'::jsonb)) AS guide
    WHERE jsonb_array_length(COALESCE(guide->'certifications', '[]'::jsonb)) > 0
  ) THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'guide_qualified',
      'Guide Qualified',
      'system',
      now() + interval '120 days',
      jsonb_build_object('guide_count', v_guide_count, 'total_reviews', v_metrics.total_reviews)
    );
  END IF;

  IF v_gallery_count >= 4 THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'media_showcase',
      'Media Showcase',
      'system',
      now() + interval '180 days',
      jsonb_build_object('gallery_count', v_gallery_count)
    );
  END IF;

  IF NULLIF(trim(COALESCE(v_profile.public_policies->>'child', '')), '') IS NOT NULL
     AND (v_guide_count >= 1 OR COALESCE(v_metrics.avg_safety, 0) >= 4.5) THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'family_ready',
      'Family Ready',
      'system',
      now() + interval '120 days',
      jsonb_build_object('avg_safety', v_metrics.avg_safety, 'guide_count', v_guide_count)
    );
  END IF;

  IF v_policy_count >= 5 THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'policy_transparency',
      'Policy Transparency',
      'system',
      now() + interval '180 days',
      jsonb_build_object('policy_count', v_policy_count)
    );
  END IF;

  IF NULLIF(trim(COALESCE(v_profile.phone_number, '')), '') IS NOT NULL
     AND NULLIF(trim(COALESCE(v_profile.email, '')), '') IS NOT NULL
     AND NULLIF(trim(COALESCE(v_profile.public_policies->>'supportHours', '')), '') IS NOT NULL THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'responsive_support',
      'Responsive Support',
      'system',
      now() + interval '90 days',
      jsonb_build_object('has_phone', true, 'has_email', true)
    );
  END IF;

  IF v_gallery_count >= 4 AND v_fleet_count >= 1 AND v_guide_count >= 1 AND v_policy_count >= 4 AND v_active_tours >= 1 THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'complete_storefront',
      'Complete Storefront',
      'system',
      now() + interval '120 days',
      jsonb_build_object('gallery_count', v_gallery_count, 'fleet_count', v_fleet_count, 'guide_count', v_guide_count, 'policy_count', v_policy_count, 'active_tours', v_active_tours)
    );
  END IF;

  IF COALESCE(v_metrics.verified_badge_count, 0) >= 2 AND v_gallery_count >= 4 THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'verified_showcase',
      'Verified Showcase',
      'system',
      now() + interval '120 days',
      jsonb_build_object('verified_badge_count', v_metrics.verified_badge_count, 'gallery_count', v_gallery_count)
    );
  END IF;

  IF COALESCE(v_metrics.total_reviews, 0) >= 3 AND v_reply_rate >= 60 THEN
    PERFORM public.upsert_operator_award(
      p_operator_id,
      'reply_leader',
      'Reply Leader',
      'system',
      now() + interval '90 days',
      jsonb_build_object('reply_rate', v_reply_rate, 'replied_reviews', v_replied_reviews)
    );
  END IF;

  DELETE FROM public.operator_awards
  WHERE operator_id = p_operator_id
    AND award_source = 'admin';

  FOR v_override IN
    SELECT *
    FROM public.operator_award_overrides
    WHERE operator_id = p_operator_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  LOOP
    IF v_override.override_mode = 'grant' THEN
      PERFORM public.upsert_operator_award(
        p_operator_id,
        v_override.award_code,
        COALESCE(v_override.award_name, initcap(replace(v_override.award_code, '_', ' '))),
        'admin',
        v_override.expires_at,
        v_override.metadata,
        v_override.admin_note
      );
    ELSIF v_override.override_mode = 'revoke' THEN
      DELETE FROM public.operator_awards
      WHERE operator_id = p_operator_id
        AND award_code = v_override.award_code;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_operator_award_override(
  p_operator_id UUID,
  p_award_code TEXT,
  p_override_mode TEXT,
  p_award_name TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_admin_note TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'admin privileges required';
  END IF;

  IF p_award_code IS NULL OR trim(p_award_code) = '' THEN
    RAISE EXCEPTION 'award code is required';
  END IF;

  IF p_override_mode NOT IN ('grant', 'revoke') THEN
    RAISE EXCEPTION 'invalid override mode';
  END IF;

  IF p_override_mode = 'grant' AND (p_award_name IS NULL OR trim(p_award_name) = '') THEN
    RAISE EXCEPTION 'award name is required for grant overrides';
  END IF;

  INSERT INTO public.operator_award_overrides (
    operator_id,
    award_code,
    override_mode,
    award_name,
    expires_at,
    metadata,
    admin_note,
    is_active,
    created_by,
    updated_by,
    updated_at
  )
  VALUES (
    p_operator_id,
    trim(p_award_code),
    p_override_mode,
    NULLIF(trim(COALESCE(p_award_name, '')), ''),
    p_expires_at,
    COALESCE(p_metadata, '{}'::jsonb),
    NULLIF(trim(COALESCE(p_admin_note, '')), ''),
    p_is_active,
    v_admin_id,
    v_admin_id,
    now()
  )
  ON CONFLICT (operator_id, award_code) DO UPDATE SET
    override_mode = EXCLUDED.override_mode,
    award_name = EXCLUDED.award_name,
    expires_at = EXCLUDED.expires_at,
    metadata = EXCLUDED.metadata,
    admin_note = EXCLUDED.admin_note,
    is_active = EXCLUDED.is_active,
    updated_by = v_admin_id,
    updated_at = now();

  PERFORM public.refresh_operator_awards(p_operator_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_operator_award_override(
  p_operator_id UUID,
  p_award_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'admin privileges required';
  END IF;

  UPDATE public.operator_award_overrides
  SET is_active = false,
      updated_by = v_admin_id,
      updated_at = now()
  WHERE operator_id = p_operator_id
    AND award_code = trim(COALESCE(p_award_code, ''));

  PERFORM public.refresh_operator_awards(p_operator_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_operator_award_override(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_clear_operator_award_override(UUID, TEXT) TO authenticated;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT user_id FROM public.tour_operator_profiles LOOP
    PERFORM public.refresh_operator_awards(r.user_id);
  END LOOP;
END;
$$;
