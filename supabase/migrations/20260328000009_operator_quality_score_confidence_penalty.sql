-- Tightens ranking calibration by reducing score confidence when review and
-- booking-start signals are both sparse.

DROP FUNCTION IF EXISTS public.admin_get_operator_quality_score(UUID, INT);

CREATE OR REPLACE FUNCTION public.admin_get_operator_quality_score(
  p_operator_id UUID,
  p_days INT DEFAULT 90
)
RETURNS TABLE (
  operator_id UUID,
  total_score NUMERIC(6,2),
  review_quality_score NUMERIC(6,2),
  verification_score NUMERIC(6,2),
  responsiveness_score NUMERIC(6,2),
  reliability_score NUMERIC(6,2),
  completeness_score NUMERIC(6,2),
  performance_score NUMERIC(6,2),
  avg_rating NUMERIC(4,2),
  total_reviews BIGINT,
  verified_badge_count INT,
  response_rate NUMERIC(5,2),
  avg_response_minutes NUMERIC(10,2),
  cancellation_rate NUMERIC(5,2),
  open_report_count BIGINT,
  total_report_count BIGINT,
  storefront_completion_rate NUMERIC(5,2),
  engagement_rate NUMERIC(5,2),
  attributed_conversion_rate NUMERIC(5,2),
  booking_starts BIGINT,
  attributed_booking_starts BIGINT,
  score_policy_version TEXT,
  score_reason_codes JSONB,
  score_input_snapshot JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester UUID := auth.uid();
BEGIN
  IF v_requester IS NULL OR NOT public.is_admin(v_requester) THEN
    RAISE EXCEPTION 'admin privileges required';
  END IF;

  RETURN QUERY
  WITH profile AS (
    SELECT *
    FROM public.tour_operator_profiles
    WHERE user_id = p_operator_id
  ),
  metrics AS (
    SELECT *
    FROM public.operator_public_metrics AS metrics_row
    WHERE metrics_row.operator_id = p_operator_id
  ),
  analytics AS (
    SELECT *
    FROM public.get_operator_storefront_analytics(p_operator_id, p_days)
  ),
  response AS (
    SELECT *
    FROM public.get_operator_storefront_response_metrics(p_operator_id, p_days)
  ),
  reports AS (
    SELECT
      COUNT(*) FILTER (WHERE status IN ('open', 'in_review')) AS open_report_count,
      COUNT(*) AS total_report_count
    FROM public.reports
    WHERE target_entity_id = p_operator_id
      AND target_entity_type IN ('partner', 'user')
  ),
  completeness AS (
    SELECT
      ROUND((
        (
          CASE WHEN COALESCE(profile.slug, '') <> '' THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(profile.description, '') <> '' THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(profile.company_logo_url, '') <> '' THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(profile.primary_city, '') <> '' THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(profile.coverage_range, '') <> '' THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(array_length(profile.categories, 1), 0) > 0 THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(profile.years_experience, '') <> '' THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(profile.team_size, '') <> '' THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(profile.phone_number, '') <> '' THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(profile.email, '') <> '' THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(jsonb_array_length(COALESCE(profile.fleet_assets, '[]'::jsonb)), 0) > 0 THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(jsonb_array_length(COALESCE(profile.guide_profiles, '[]'::jsonb)), 0) > 0 THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(jsonb_array_length(COALESCE(profile.gallery_media, '[]'::jsonb)), 0) > 0 THEN 1 ELSE 0 END +
          CASE WHEN (
            NULLIF(trim(COALESCE(profile.public_policies->>'cancellation', '')), '') IS NOT NULL
            OR NULLIF(trim(COALESCE(profile.public_policies->>'deposit', '')), '') IS NOT NULL
            OR NULLIF(trim(COALESCE(profile.public_policies->>'pickup', '')), '') IS NOT NULL
            OR NULLIF(trim(COALESCE(profile.public_policies->>'child', '')), '') IS NOT NULL
            OR NULLIF(trim(COALESCE(profile.public_policies->>'refund', '')), '') IS NOT NULL
            OR NULLIF(trim(COALESCE(profile.public_policies->>'weather', '')), '') IS NOT NULL
            OR NULLIF(trim(COALESCE(profile.public_policies->>'emergency', '')), '') IS NOT NULL
            OR NULLIF(trim(COALESCE(profile.public_policies->>'supportHours', '')), '') IS NOT NULL
          ) THEN 1 ELSE 0 END +
          CASE WHEN COALESCE(profile.registration_number, '') <> '' THEN 1 ELSE 0 END
        )::NUMERIC / 15::NUMERIC
      ) * 100, 2) AS storefront_completion_rate
    FROM profile
  ),
  score_inputs AS (
    SELECT
      p_operator_id AS operator_id,
      COALESCE(metrics.avg_rating, 0)::NUMERIC(4,2) AS avg_rating,
      COALESCE(metrics.total_reviews, 0)::BIGINT AS total_reviews,
      COALESCE(metrics.verified_badge_count, 0)::INT AS verified_badge_count,
      COALESCE(response.response_rate, 0)::NUMERIC(5,2) AS response_rate,
      COALESCE(response.avg_response_minutes, 0)::NUMERIC(10,2) AS avg_response_minutes,
      COALESCE(metrics.cancellation_rate, 0)::NUMERIC(5,2) AS cancellation_rate,
      COALESCE(reports.open_report_count, 0)::BIGINT AS open_report_count,
      COALESCE(reports.total_report_count, 0)::BIGINT AS total_report_count,
      COALESCE(completeness.storefront_completion_rate, 0)::NUMERIC(5,2) AS storefront_completion_rate,
      COALESCE(analytics.engagement_rate, 0)::NUMERIC(5,2) AS engagement_rate,
      COALESCE(analytics.attributed_conversion_rate, 0)::NUMERIC(5,2) AS attributed_conversion_rate,
      COALESCE(analytics.booking_starts, 0)::BIGINT AS booking_starts,
      COALESCE(analytics.attributed_booking_starts, 0)::BIGINT AS attributed_booking_starts
    FROM profile
    LEFT JOIN metrics ON TRUE
    LEFT JOIN analytics ON TRUE
    LEFT JOIN response ON TRUE
    LEFT JOIN reports ON TRUE
    LEFT JOIN completeness ON TRUE
  ),
  scored AS (
    SELECT
      score_inputs.*,
      LEAST(20::NUMERIC, (score_inputs.avg_rating / 5::NUMERIC) * 20::NUMERIC)
        + LEAST(5::NUMERIC, (score_inputs.total_reviews::NUMERIC / 20::NUMERIC) * 5::NUMERIC)
        AS review_quality_score,
      LEAST(20::NUMERIC, score_inputs.verified_badge_count::NUMERIC * 5::NUMERIC) AS verification_score,
      LEAST(12::NUMERIC, (score_inputs.response_rate / 100::NUMERIC) * 12::NUMERIC)
        + CASE
            WHEN score_inputs.avg_response_minutes <= 0 THEN 0::NUMERIC
            WHEN score_inputs.avg_response_minutes <= 60 THEN 8::NUMERIC
            WHEN score_inputs.avg_response_minutes <= 720 THEN 6::NUMERIC
            WHEN score_inputs.avg_response_minutes <= 1440 THEN 4::NUMERIC
            WHEN score_inputs.avg_response_minutes <= 2880 THEN 2::NUMERIC
            ELSE 1::NUMERIC
          END AS responsiveness_score,
      GREATEST(
        0::NUMERIC,
        15::NUMERIC
          - LEAST(8::NUMERIC, score_inputs.cancellation_rate / 2::NUMERIC)
          - LEAST(7::NUMERIC, score_inputs.open_report_count::NUMERIC * 2::NUMERIC)
      ) AS reliability_score,
      LEAST(10::NUMERIC, (score_inputs.storefront_completion_rate / 100::NUMERIC) * 10::NUMERIC) AS completeness_score,
      LEAST(5::NUMERIC, (score_inputs.engagement_rate / 100::NUMERIC) * 5::NUMERIC)
        + LEAST(5::NUMERIC, (score_inputs.attributed_conversion_rate / 10::NUMERIC) * 5::NUMERIC)
        AS performance_score
    FROM score_inputs
  ),
  calibrated AS (
    SELECT
      scored.*,
      ROUND(
        scored.review_quality_score
        + scored.verification_score
        + scored.responsiveness_score
        + scored.reliability_score
        + scored.completeness_score
        + scored.performance_score,
        2
      )::NUMERIC(6,2) AS raw_total_score,
      CASE
        WHEN scored.total_reviews < 5 AND scored.booking_starts < 3 THEN 'low'
        WHEN scored.total_reviews >= 20 AND scored.booking_starts >= 10 THEN 'high'
        ELSE 'medium'
      END::TEXT AS ranking_confidence_band,
      CASE
        WHEN scored.total_reviews < 5 AND scored.booking_starts < 3 THEN 0.70::NUMERIC(4,2)
        WHEN scored.total_reviews < 5 OR scored.booking_starts < 3 THEN 0.85::NUMERIC(4,2)
        ELSE 1.00::NUMERIC(4,2)
      END AS ranking_confidence_multiplier
    FROM scored
  ),
  explained AS (
    SELECT
      calibrated.*,
      'operator_quality_v2'::TEXT AS score_policy_version,
      jsonb_build_object(
        'review_quality', to_jsonb(ARRAY_REMOVE(ARRAY[
          CASE WHEN calibrated.total_reviews = 0 THEN 'no_reviews_yet' END,
          CASE WHEN calibrated.total_reviews > 0 AND calibrated.total_reviews < 5 THEN 'low_review_volume' END,
          CASE WHEN calibrated.total_reviews >= 20 THEN 'established_review_volume' END,
          CASE WHEN calibrated.avg_rating >= 4.50 THEN 'strong_review_average' END,
          CASE WHEN calibrated.avg_rating > 0 AND calibrated.avg_rating < 4.00 THEN 'rating_needs_attention' END
        ], NULL)::TEXT[]),
        'verification', to_jsonb(ARRAY_REMOVE(ARRAY[
          CASE WHEN calibrated.verified_badge_count = 0 THEN 'no_verified_documents' END,
          CASE WHEN calibrated.verified_badge_count BETWEEN 1 AND 2 THEN 'partial_verification_coverage' END,
          CASE WHEN calibrated.verified_badge_count >= 3 THEN 'strong_verification_coverage' END
        ], NULL)::TEXT[]),
        'responsiveness', to_jsonb(ARRAY_REMOVE(ARRAY[
          CASE WHEN calibrated.response_rate = 0 THEN 'no_reply_data' END,
          CASE WHEN calibrated.response_rate >= 80 THEN 'high_reply_rate' END,
          CASE WHEN calibrated.response_rate > 0 AND calibrated.response_rate < 50 THEN 'low_reply_rate' END,
          CASE WHEN calibrated.avg_response_minutes > 0 AND calibrated.avg_response_minutes <= 60 THEN 'fast_response_time' END,
          CASE WHEN calibrated.avg_response_minutes > 1440 THEN 'slow_response_time' END
        ], NULL)::TEXT[]),
        'reliability', to_jsonb(ARRAY_REMOVE(ARRAY[
          CASE WHEN calibrated.cancellation_rate >= 10 THEN 'elevated_cancellation_risk' END,
          CASE WHEN calibrated.open_report_count > 0 THEN 'open_concerns_present' END,
          CASE WHEN calibrated.cancellation_rate < 5 AND calibrated.open_report_count = 0 THEN 'clean_operational_record' END
        ], NULL)::TEXT[]),
        'completeness', to_jsonb(ARRAY_REMOVE(ARRAY[
          CASE WHEN calibrated.storefront_completion_rate >= 90 THEN 'complete_storefront' END,
          CASE WHEN calibrated.storefront_completion_rate >= 60 AND calibrated.storefront_completion_rate < 90 THEN 'storefront_has_minor_gaps' END,
          CASE WHEN calibrated.storefront_completion_rate < 60 THEN 'storefront_needs_work' END
        ], NULL)::TEXT[]),
        'performance', to_jsonb(ARRAY_REMOVE(ARRAY[
          CASE WHEN calibrated.booking_starts = 0 THEN 'no_booking_start_data' END,
          CASE WHEN calibrated.booking_starts > 0 AND calibrated.booking_starts < 3 THEN 'sparse_funnel_data' END,
          CASE WHEN calibrated.booking_starts >= 3 THEN 'established_booking_intent_data' END,
          CASE WHEN calibrated.engagement_rate >= 40 THEN 'strong_profile_engagement' END,
          CASE WHEN calibrated.attributed_booking_starts > 0 THEN 'conversion_after_profile_view' END
        ], NULL)::TEXT[]),
        'calibration', to_jsonb(ARRAY_REMOVE(ARRAY[
          CASE WHEN calibrated.total_reviews < 5 AND calibrated.booking_starts < 3 THEN 'low_reviews_and_low_booking_starts' END,
          CASE WHEN calibrated.total_reviews < 5 OR calibrated.booking_starts < 3 THEN 'partial_signal_only' END,
          CASE WHEN calibrated.total_reviews >= 5 AND calibrated.booking_starts >= 3 THEN 'sufficient_signal_for_ranking' END
        ], NULL)::TEXT[])
      ) AS score_reason_codes,
      jsonb_build_object(
        'review_volume_confidence', CASE
          WHEN calibrated.total_reviews >= 20 THEN 'high'
          WHEN calibrated.total_reviews >= 5 THEN 'medium'
          ELSE 'low'
        END,
        'response_time_bucket', CASE
          WHEN calibrated.avg_response_minutes <= 0 THEN 'none'
          WHEN calibrated.avg_response_minutes <= 60 THEN 'within_1_hour'
          WHEN calibrated.avg_response_minutes <= 720 THEN 'same_day'
          WHEN calibrated.avg_response_minutes <= 1440 THEN 'within_24_hours'
          WHEN calibrated.avg_response_minutes <= 2880 THEN 'within_48_hours'
          ELSE 'over_48_hours'
        END,
        'reliability_pressure', CASE
          WHEN calibrated.open_report_count > 0 OR calibrated.cancellation_rate >= 10 THEN 'high'
          WHEN calibrated.cancellation_rate >= 5 THEN 'medium'
          ELSE 'low'
        END,
        'storefront_completeness_band', CASE
          WHEN calibrated.storefront_completion_rate >= 90 THEN 'strong'
          WHEN calibrated.storefront_completion_rate >= 60 THEN 'moderate'
          ELSE 'weak'
        END,
        'performance_data_band', CASE
          WHEN calibrated.booking_starts >= 5 THEN 'established'
          WHEN calibrated.booking_starts >= 1 THEN 'emerging'
          ELSE 'none'
        END,
        'minimum_data_warning', (calibrated.total_reviews < 5 OR calibrated.booking_starts < 3),
        'critical_sparse_data_warning', (calibrated.total_reviews < 5 AND calibrated.booking_starts < 3),
        'ranking_confidence_band', calibrated.ranking_confidence_band,
        'ranking_confidence_multiplier', calibrated.ranking_confidence_multiplier,
        'raw_total_score', calibrated.raw_total_score,
        'confidence_adjusted_total_score', ROUND(calibrated.raw_total_score * calibrated.ranking_confidence_multiplier, 2),
        'avg_rating_input', calibrated.avg_rating,
        'total_reviews_input', calibrated.total_reviews,
        'verified_badge_input', calibrated.verified_badge_count,
        'response_rate_input', calibrated.response_rate,
        'avg_response_minutes_input', calibrated.avg_response_minutes,
        'cancellation_rate_input', calibrated.cancellation_rate,
        'open_report_count_input', calibrated.open_report_count,
        'total_report_count_input', calibrated.total_report_count,
        'storefront_completion_rate_input', calibrated.storefront_completion_rate,
        'engagement_rate_input', calibrated.engagement_rate,
        'attributed_conversion_rate_input', calibrated.attributed_conversion_rate,
        'booking_starts_input', calibrated.booking_starts,
        'attributed_booking_starts_input', calibrated.attributed_booking_starts
      ) AS score_input_snapshot
    FROM calibrated
  )
  SELECT
    explained.operator_id,
    ROUND(explained.raw_total_score * explained.ranking_confidence_multiplier, 2)::NUMERIC(6,2) AS total_score,
    ROUND(explained.review_quality_score, 2)::NUMERIC(6,2),
    ROUND(explained.verification_score, 2)::NUMERIC(6,2),
    ROUND(explained.responsiveness_score, 2)::NUMERIC(6,2),
    ROUND(explained.reliability_score, 2)::NUMERIC(6,2),
    ROUND(explained.completeness_score, 2)::NUMERIC(6,2),
    ROUND(explained.performance_score, 2)::NUMERIC(6,2),
    explained.avg_rating,
    explained.total_reviews,
    explained.verified_badge_count,
    explained.response_rate,
    explained.avg_response_minutes,
    explained.cancellation_rate,
    explained.open_report_count,
    explained.total_report_count,
    explained.storefront_completion_rate,
    explained.engagement_rate,
    explained.attributed_conversion_rate,
    explained.booking_starts,
    explained.attributed_booking_starts,
    explained.score_policy_version,
    explained.score_reason_codes,
    explained.score_input_snapshot
  FROM explained;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_operator_quality_score(UUID, INT) TO authenticated;