-- Phase 13: Operator public profile capability layer
-- Adds fleet, guide, and public policy fields to the operator profile.
-- Extends operator_public_metrics badge counting and refreshes metrics when
-- a public profile changes so storefront trust signals stay in sync.

ALTER TABLE public.tour_operator_profiles
  ADD COLUMN IF NOT EXISTS fleet_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS guide_profiles JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS public_policies JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.refresh_operator_public_metrics(p_operator_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_rating               NUMERIC(3,2);
  v_total_reviews            INT;
  v_total_completed          INT;
  v_total_travelers          INT;
  v_cancellation_rate        NUMERIC(5,2);
  v_avg_communication        NUMERIC(3,2);
  v_avg_punctuality          NUMERIC(3,2);
  v_avg_transport            NUMERIC(3,2);
  v_avg_guide                NUMERIC(3,2);
  v_avg_safety               NUMERIC(3,2);
  v_avg_cleanliness          NUMERIC(3,2);
  v_avg_value                NUMERIC(3,2);
  v_avg_itinerary            NUMERIC(3,2);
  v_verified_badge_count     INT := 0;
  v_verification_documents   JSONB := '{}'::jsonb;
BEGIN
  SELECT
    ROUND(AVG(tbr.rating)::NUMERIC,               2),
    COUNT(*)::INT,
    ROUND(AVG(tbr.rating_communication)::NUMERIC, 2),
    ROUND(AVG(tbr.rating_punctuality)::NUMERIC,   2),
    ROUND(AVG(tbr.rating_transport)::NUMERIC,     2),
    ROUND(AVG(tbr.rating_guide)::NUMERIC,         2),
    ROUND(AVG(tbr.rating_safety)::NUMERIC,        2),
    ROUND(AVG(tbr.rating_cleanliness)::NUMERIC,   2),
    ROUND(AVG(tbr.rating_value)::NUMERIC,         2),
    ROUND(AVG(tbr.rating_itinerary)::NUMERIC,     2)
  INTO
    v_avg_rating, v_total_reviews,
    v_avg_communication, v_avg_punctuality, v_avg_transport,
    v_avg_guide, v_avg_safety, v_avg_cleanliness,
    v_avg_value, v_avg_itinerary
  FROM public.tour_booking_reviews tbr
  JOIN public.tours t ON t.id = tbr.tour_id
  WHERE t.operator_id = p_operator_id
    AND tbr.status = 'published';

  SELECT COUNT(*)::INT
  INTO v_total_completed
  FROM public.tour_bookings tb
  JOIN public.tours t ON t.id = tb.tour_id
  WHERE t.operator_id = p_operator_id
    AND tb.status = 'completed';

  SELECT COUNT(DISTINCT tb.traveler_id)::INT
  INTO v_total_travelers
  FROM public.tour_bookings tb
  JOIN public.tours t ON t.id = tb.tour_id
  WHERE t.operator_id = p_operator_id
    AND tb.status IN ('confirmed', 'completed');

  SELECT CASE
    WHEN COUNT(*) = 0 THEN NULL
    ELSE ROUND(
      COUNT(*) FILTER (WHERE tb.status = 'cancelled')::NUMERIC / COUNT(*) * 100,
      2
    )
  END
  INTO v_cancellation_rate
  FROM public.tour_bookings tb
  JOIN public.tours t ON t.id = tb.tour_id
  WHERE t.operator_id = p_operator_id;

  SELECT COALESCE(verification_documents, '{}'::jsonb)
  INTO v_verification_documents
  FROM public.tour_operator_profiles
  WHERE user_id = p_operator_id;

  v_verified_badge_count :=
    CASE WHEN EXISTS (
      SELECT 1
      FROM public.tour_operator_profiles p
      WHERE p.user_id = p_operator_id
        AND (
          COALESCE(p.kyc_verified_at IS NOT NULL, false)
          OR COALESCE(p.verification_documents->>'kycStatus', '') = 'approved'
        )
    ) THEN 1 ELSE 0 END
    + CASE WHEN EXISTS (
      SELECT 1
      FROM public.tour_operator_profiles p
      WHERE p.user_id = p_operator_id
        AND COALESCE(NULLIF(p.kyc_verified_cnic, ''), NULLIF(p.verification_documents->>'cnicNumber', '')) IS NOT NULL
        AND (
          COALESCE(p.kyc_verified_at IS NOT NULL, false)
          OR COALESCE(p.verification_documents->>'kycStatus', '') = 'approved'
        )
    ) THEN 1 ELSE 0 END
    + CASE WHEN COALESCE(v_verification_documents->>'phoneVerified', 'false') = 'true' THEN 1 ELSE 0 END
    + CASE WHEN COALESCE(v_verification_documents->>'emailVerified', 'false') = 'true' THEN 1 ELSE 0 END
    + CASE WHEN COALESCE(v_verification_documents->>'addressVerified', 'false') = 'true' THEN 1 ELSE 0 END
    + CASE WHEN COALESCE(v_verification_documents->>'bankVerified', 'false') = 'true' THEN 1 ELSE 0 END
    + CASE WHEN COALESCE(v_verification_documents->>'businessRegistrationVerified', 'false') = 'true' THEN 1 ELSE 0 END
    + CASE WHEN COALESCE(v_verification_documents->>'vehicleDocsVerified', 'false') = 'true' THEN 1 ELSE 0 END
    + CASE WHEN COALESCE(v_verification_documents->>'insuranceVerified', 'false') = 'true' THEN 1 ELSE 0 END
    + CASE WHEN COALESCE(v_verification_documents->>'guideLicenseVerified', 'false') = 'true' THEN 1 ELSE 0 END;

  INSERT INTO public.operator_public_metrics (
    operator_id,
    avg_rating, total_reviews,
    total_completed_bookings, total_travelers_served,
    cancellation_rate, verified_badge_count, last_calculated_at,
    avg_communication, avg_punctuality, avg_transport,
    avg_guide, avg_safety, avg_cleanliness,
    avg_value, avg_itinerary
  )
  VALUES (
    p_operator_id,
    v_avg_rating,
    COALESCE(v_total_reviews, 0),
    COALESCE(v_total_completed, 0),
    COALESCE(v_total_travelers, 0),
    v_cancellation_rate,
    v_verified_badge_count,
    now(),
    v_avg_communication, v_avg_punctuality, v_avg_transport,
    v_avg_guide, v_avg_safety, v_avg_cleanliness,
    v_avg_value, v_avg_itinerary
  )
  ON CONFLICT (operator_id) DO UPDATE SET
    avg_rating               = EXCLUDED.avg_rating,
    total_reviews            = EXCLUDED.total_reviews,
    total_completed_bookings = EXCLUDED.total_completed_bookings,
    total_travelers_served   = EXCLUDED.total_travelers_served,
    cancellation_rate        = EXCLUDED.cancellation_rate,
    verified_badge_count     = EXCLUDED.verified_badge_count,
    last_calculated_at       = EXCLUDED.last_calculated_at,
    avg_communication        = EXCLUDED.avg_communication,
    avg_punctuality          = EXCLUDED.avg_punctuality,
    avg_transport            = EXCLUDED.avg_transport,
    avg_guide                = EXCLUDED.avg_guide,
    avg_safety               = EXCLUDED.avg_safety,
    avg_cleanliness          = EXCLUDED.avg_cleanliness,
    avg_value                = EXCLUDED.avg_value,
    avg_itinerary            = EXCLUDED.avg_itinerary;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_fn_refresh_op_metrics_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_operator_public_metrics(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_op_metrics_profile ON public.tour_operator_profiles;
CREATE TRIGGER trg_refresh_op_metrics_profile
  AFTER INSERT OR UPDATE OF verification_documents, verification_urls, fleet_assets, guide_profiles, public_policies, business_name, company_name, is_public
  ON public.tour_operator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_refresh_op_metrics_on_profile();

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT user_id FROM public.tour_operator_profiles LOOP
    PERFORM public.refresh_operator_public_metrics(r.user_id);
  END LOOP;
END;
$$;
