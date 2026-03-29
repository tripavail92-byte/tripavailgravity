-- Release 4.5: trust completion, booking attribution, review safeguards, and admin quality scoring

-- ------------------------------------------------------------
-- 1. Storefront analytics: add booking-start attribution
-- ------------------------------------------------------------

ALTER TABLE public.operator_storefront_events
  DROP CONSTRAINT IF EXISTS operator_storefront_events_event_type_check;

ALTER TABLE public.operator_storefront_events
  ADD CONSTRAINT operator_storefront_events_event_type_check
  CHECK (event_type IN ('profile_view', 'cta_click', 'tour_click', 'booking_start'));

CREATE OR REPLACE FUNCTION public.record_operator_storefront_event(
  p_operator_id UUID,
  p_event_type TEXT,
  p_slug TEXT DEFAULT NULL,
  p_tour_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_operator_id IS NULL THEN
    RAISE EXCEPTION 'operator id is required';
  END IF;

  IF p_event_type NOT IN ('profile_view', 'cta_click', 'tour_click', 'booking_start') THEN
    RAISE EXCEPTION 'invalid storefront event type';
  END IF;

  INSERT INTO public.operator_storefront_events (
    operator_id,
    event_type,
    slug,
    tour_id,
    visitor_user_id,
    session_id,
    metadata
  )
  VALUES (
    p_operator_id,
    p_event_type,
    NULLIF(trim(COALESCE(p_slug, '')), ''),
    p_tour_id,
    auth.uid(),
    NULLIF(trim(COALESCE(p_session_id, '')), ''),
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

DROP FUNCTION IF EXISTS public.get_operator_storefront_analytics(UUID, INT);

CREATE OR REPLACE FUNCTION public.get_operator_storefront_analytics(
  p_operator_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  profile_views BIGINT,
  unique_visitors BIGINT,
  engaged_visitors BIGINT,
  cta_clicks BIGINT,
  tour_clicks BIGINT,
  booking_starts BIGINT,
  attributed_booking_starts BIGINT,
  engagement_rate NUMERIC(5,2),
  attributed_conversion_rate NUMERIC(5,2),
  last_viewed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester UUID := auth.uid();
BEGIN
  IF v_requester IS NOT NULL AND v_requester <> p_operator_id AND NOT public.is_admin(v_requester) THEN
    RAISE EXCEPTION 'not authorized to view storefront analytics';
  END IF;

  RETURN QUERY
  WITH scoped AS (
    SELECT
      *,
      COALESCE(NULLIF(session_id, ''), visitor_user_id::TEXT, id::TEXT) AS visitor_key
    FROM public.operator_storefront_events
    WHERE operator_id = p_operator_id
      AND created_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1))
  ),
  viewer_sessions AS (
    SELECT DISTINCT visitor_key
    FROM scoped
    WHERE event_type = 'profile_view'
  ),
  engaged_sessions AS (
    SELECT DISTINCT scoped.visitor_key
    FROM scoped
    INNER JOIN viewer_sessions ON viewer_sessions.visitor_key = scoped.visitor_key
    WHERE scoped.event_type IN ('cta_click', 'tour_click')
  ),
  attributed_booking_events AS (
    SELECT booking_event.id
    FROM scoped AS booking_event
    WHERE booking_event.event_type = 'booking_start'
      AND EXISTS (
        SELECT 1
        FROM scoped AS profile_event
        WHERE profile_event.visitor_key = booking_event.visitor_key
          AND profile_event.event_type = 'profile_view'
          AND profile_event.created_at <= booking_event.created_at
      )
  )
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'profile_view') AS profile_views,
    (SELECT COUNT(*) FROM viewer_sessions) AS unique_visitors,
    (SELECT COUNT(*) FROM engaged_sessions) AS engaged_visitors,
    COUNT(*) FILTER (WHERE event_type = 'cta_click') AS cta_clicks,
    COUNT(*) FILTER (WHERE event_type = 'tour_click') AS tour_clicks,
    COUNT(*) FILTER (WHERE event_type = 'booking_start') AS booking_starts,
    (SELECT COUNT(*) FROM attributed_booking_events) AS attributed_booking_starts,
    CASE
      WHEN (SELECT COUNT(*) FROM viewer_sessions) = 0 THEN 0::NUMERIC(5,2)
      ELSE LEAST(
        100::NUMERIC,
        ROUND(
          ((SELECT COUNT(*) FROM engaged_sessions)::NUMERIC / (SELECT COUNT(*) FROM viewer_sessions)::NUMERIC) * 100,
          2
        )
      )::NUMERIC(5,2)
    END AS engagement_rate,
    CASE
      WHEN (SELECT COUNT(*) FROM viewer_sessions) = 0 THEN 0::NUMERIC(5,2)
      ELSE LEAST(
        100::NUMERIC,
        ROUND(
          ((SELECT COUNT(*) FROM attributed_booking_events)::NUMERIC / (SELECT COUNT(*) FROM viewer_sessions)::NUMERIC) * 100,
          2
        )
      )::NUMERIC(5,2)
    END AS attributed_conversion_rate,
    MAX(created_at) FILTER (WHERE event_type = 'profile_view') AS last_viewed_at
  FROM scoped;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_operator_storefront_event(UUID, TEXT, TEXT, UUID, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_operator_storefront_analytics(UUID, INT) TO anon, authenticated;

-- ------------------------------------------------------------
-- 2. Public response metrics derived from booking messaging
-- ------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_operator_storefront_response_metrics(UUID, INT);

CREATE OR REPLACE FUNCTION public.get_operator_storefront_response_metrics(
  p_operator_id UUID,
  p_days INT DEFAULT 90
)
RETURNS TABLE (
  traveler_messages BIGINT,
  responded_messages BIGINT,
  response_rate NUMERIC(5,2),
  avg_response_minutes NUMERIC(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester UUID := auth.uid();
  v_is_public BOOLEAN := FALSE;
BEGIN
  SELECT COALESCE(is_public, FALSE)
  INTO v_is_public
  FROM public.tour_operator_profiles
  WHERE user_id = p_operator_id;

  IF NOT v_is_public AND (v_requester IS NULL OR (v_requester <> p_operator_id AND NOT public.is_admin(v_requester))) THEN
    RAISE EXCEPTION 'not authorized to view operator response metrics';
  END IF;

  RETURN QUERY
  WITH operator_conversations AS (
    SELECT conversation.id
    FROM public.booking_conversations AS conversation
    INNER JOIN LATERAL public.messaging_get_booking_parties(conversation.booking_scope, conversation.booking_id) AS booking_ctx
      ON TRUE
    WHERE conversation.booking_scope = 'tour_booking'
      AND booking_ctx.partner_id = p_operator_id
  ),
  traveler_messages_scoped AS (
    SELECT
      message.id,
      message.conversation_id,
      message.created_at,
      LEAD(message.created_at) OVER (
        PARTITION BY message.conversation_id
        ORDER BY message.created_at
      ) AS next_traveler_message_at
    FROM public.booking_conversation_messages AS message
    INNER JOIN operator_conversations AS conversation
      ON conversation.id = message.conversation_id
    WHERE message.sender_role = 'traveler'
      AND message.deleted_at IS NULL
      AND message.created_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 90), 1))
  ),
  response_pairs AS (
    SELECT
      traveler_message.id,
      traveler_message.created_at AS traveler_created_at,
      MIN(operator_message.created_at) AS operator_reply_at
    FROM traveler_messages_scoped AS traveler_message
    LEFT JOIN public.booking_conversation_messages AS operator_message
      ON operator_message.conversation_id = traveler_message.conversation_id
      AND operator_message.sender_role = 'operator'
      AND operator_message.deleted_at IS NULL
      AND operator_message.created_at > traveler_message.created_at
      AND (
        traveler_message.next_traveler_message_at IS NULL
        OR operator_message.created_at < traveler_message.next_traveler_message_at
      )
    GROUP BY traveler_message.id, traveler_message.created_at
  )
  SELECT
    COUNT(*) AS traveler_messages,
    COUNT(*) FILTER (WHERE operator_reply_at IS NOT NULL) AS responded_messages,
    CASE
      WHEN COUNT(*) = 0 THEN 0::NUMERIC(5,2)
      ELSE ROUND((COUNT(*) FILTER (WHERE operator_reply_at IS NOT NULL)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)::NUMERIC(5,2)
    END AS response_rate,
    COALESCE(
      ROUND(AVG(EXTRACT(EPOCH FROM (operator_reply_at - traveler_created_at)) / 60) FILTER (WHERE operator_reply_at IS NOT NULL), 2),
      0
    )::NUMERIC(10,2) AS avg_response_minutes
  FROM response_pairs;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_operator_storefront_response_metrics(UUID, INT) TO anon, authenticated;

-- ------------------------------------------------------------
-- 3. Review safeguards: flags + 48-hour edit window
-- ------------------------------------------------------------

ALTER TABLE public.tour_booking_reviews
  ADD COLUMN IF NOT EXISTS flagged_for_moderation BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS moderation_flags JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ NULL;

CREATE OR REPLACE FUNCTION public.compute_tour_review_moderation_flags(
  p_review_id UUID,
  p_traveler_id UUID,
  p_tour_id UUID,
  p_title TEXT,
  p_body TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flags JSONB := '[]'::JSONB;
  v_title TEXT := lower(trim(COALESCE(p_title, '')));
  v_body TEXT := lower(trim(COALESCE(p_body, '')));
  v_normalized_body TEXT := regexp_replace(lower(trim(COALESCE(p_body, ''))), '\s+', ' ', 'g');
BEGIN
  IF v_body ~ '(?:\m(?:damn|shit|fuck|bitch|asshole|bastard|scam|fraud)\M)' THEN
    v_flags := v_flags || jsonb_build_array('profanity_or_abuse');
  END IF;

  IF char_length(v_normalized_body) > 0 AND EXISTS (
    SELECT 1
    FROM public.tour_booking_reviews AS review
    WHERE review.id <> COALESCE(p_review_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND review.tour_id = p_tour_id
      AND review.status = 'published'
      AND regexp_replace(lower(trim(COALESCE(review.body, ''))), '\s+', ' ', 'g') = v_normalized_body
  ) THEN
    v_flags := v_flags || jsonb_build_array('duplicate_body_on_tour');
  END IF;

  IF char_length(v_normalized_body) > 0 AND EXISTS (
    SELECT 1
    FROM public.tour_booking_reviews AS review
    WHERE review.id <> COALESCE(p_review_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND review.traveler_id = p_traveler_id
      AND review.status = 'published'
      AND regexp_replace(lower(trim(COALESCE(review.body, ''))), '\s+', ' ', 'g') = v_normalized_body
  ) THEN
    v_flags := v_flags || jsonb_build_array('reused_review_text');
  END IF;

  IF char_length(v_body) > 0 AND char_length(v_body) < 20 THEN
    v_flags := v_flags || jsonb_build_array('very_short_body');
  END IF;

  IF char_length(v_title) > 0 AND char_length(v_title) < 4 THEN
    v_flags := v_flags || jsonb_build_array('very_short_title');
  END IF;

  RETURN v_flags;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_tour_review_safeguards()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flags JSONB;
  v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'UPDATE' AND v_actor IS NOT NULL AND v_actor = OLD.traveler_id THEN
    IF OLD.created_at < NOW() - INTERVAL '48 hours' AND (
      COALESCE(NEW.title, '') IS DISTINCT FROM COALESCE(OLD.title, '')
      OR COALESCE(NEW.body, '') IS DISTINCT FROM COALESCE(OLD.body, '')
    ) THEN
      RAISE EXCEPTION 'Review edits are only allowed within 48 hours of submission';
    END IF;

    IF NEW.rating IS DISTINCT FROM OLD.rating
      OR NEW.rating_communication IS DISTINCT FROM OLD.rating_communication
      OR NEW.rating_punctuality IS DISTINCT FROM OLD.rating_punctuality
      OR NEW.rating_transport IS DISTINCT FROM OLD.rating_transport
      OR NEW.rating_guide IS DISTINCT FROM OLD.rating_guide
      OR NEW.rating_safety IS DISTINCT FROM OLD.rating_safety
      OR NEW.rating_cleanliness IS DISTINCT FROM OLD.rating_cleanliness
      OR NEW.rating_value IS DISTINCT FROM OLD.rating_value
      OR NEW.rating_itinerary IS DISTINCT FROM OLD.rating_itinerary THEN
      RAISE EXCEPTION 'Review ratings cannot be changed after submission';
    END IF;
  END IF;

  v_flags := public.compute_tour_review_moderation_flags(
    COALESCE(NEW.id, OLD.id),
    NEW.traveler_id,
    NEW.tour_id,
    NEW.title,
    NEW.body
  );

  NEW.moderation_flags := COALESCE(v_flags, '[]'::JSONB);
  NEW.flagged_for_moderation := jsonb_array_length(NEW.moderation_flags) > 0;
  NEW.flagged_at := CASE
    WHEN NEW.flagged_for_moderation THEN COALESCE(OLD.flagged_at, NOW())
    ELSE NULL
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tour_review_safeguards ON public.tour_booking_reviews;
CREATE TRIGGER trg_tour_review_safeguards
  BEFORE INSERT OR UPDATE ON public.tour_booking_reviews
  FOR EACH ROW EXECUTE FUNCTION public.apply_tour_review_safeguards();

UPDATE public.tour_booking_reviews AS review
SET
  moderation_flags = public.compute_tour_review_moderation_flags(review.id, review.traveler_id, review.tour_id, review.title, review.body),
  flagged_for_moderation = jsonb_array_length(public.compute_tour_review_moderation_flags(review.id, review.traveler_id, review.tour_id, review.title, review.body)) > 0,
  flagged_at = CASE
    WHEN jsonb_array_length(public.compute_tour_review_moderation_flags(review.id, review.traveler_id, review.tour_id, review.title, review.body)) > 0 THEN COALESCE(review.flagged_at, NOW())
    ELSE NULL
  END;

DROP FUNCTION IF EXISTS public.admin_list_tour_reviews(INT);

CREATE OR REPLACE FUNCTION public.admin_list_tour_reviews(p_limit INT DEFAULT 100)
RETURNS TABLE (
  id UUID,
  booking_id UUID,
  traveler_id UUID,
  tour_id UUID,
  tour_title TEXT,
  rating SMALLINT,
  title TEXT,
  body TEXT,
  status TEXT,
  flagged_for_moderation BOOLEAN,
  moderation_flags JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    review.id,
    review.booking_id,
    review.traveler_id,
    review.tour_id,
    tour.title AS tour_title,
    review.rating,
    review.title,
    review.body,
    review.status,
    review.flagged_for_moderation,
    review.moderation_flags,
    review.created_at,
    review.updated_at
  FROM public.tour_booking_reviews AS review
  INNER JOIN public.tours AS tour
    ON tour.id = review.tour_id
  ORDER BY review.flagged_for_moderation DESC, review.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ------------------------------------------------------------
-- 4. Admin-only operator quality score
-- ------------------------------------------------------------

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
  attributed_booking_starts BIGINT
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
  )
  SELECT
    scored.operator_id,
    ROUND(
      scored.review_quality_score
      + scored.verification_score
      + scored.responsiveness_score
      + scored.reliability_score
      + scored.completeness_score
      + scored.performance_score,
      2
    )::NUMERIC(6,2) AS total_score,
    ROUND(scored.review_quality_score, 2)::NUMERIC(6,2),
    ROUND(scored.verification_score, 2)::NUMERIC(6,2),
    ROUND(scored.responsiveness_score, 2)::NUMERIC(6,2),
    ROUND(scored.reliability_score, 2)::NUMERIC(6,2),
    ROUND(scored.completeness_score, 2)::NUMERIC(6,2),
    ROUND(scored.performance_score, 2)::NUMERIC(6,2),
    scored.avg_rating,
    scored.total_reviews,
    scored.verified_badge_count,
    scored.response_rate,
    scored.avg_response_minutes,
    scored.cancellation_rate,
    scored.open_report_count,
    scored.total_report_count,
    scored.storefront_completion_rate,
    scored.engagement_rate,
    scored.attributed_conversion_rate,
    scored.booking_starts,
    scored.attributed_booking_starts
  FROM scored;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_operator_quality_score(UUID, INT) TO authenticated;