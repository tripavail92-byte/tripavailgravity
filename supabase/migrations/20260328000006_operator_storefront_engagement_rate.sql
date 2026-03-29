-- Phase 17: Bounded storefront engagement metrics
-- Defines engagement as the share of unique storefront visitors who clicked a CTA or tour.

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
  engagement_rate NUMERIC(5,2),
  last_viewed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester UUID := auth.uid();
BEGIN
  IF v_requester IS NULL OR (v_requester <> p_operator_id AND NOT public.is_admin(v_requester)) THEN
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
  )
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'profile_view') AS profile_views,
    (SELECT COUNT(*) FROM viewer_sessions) AS unique_visitors,
    (SELECT COUNT(*) FROM engaged_sessions) AS engaged_visitors,
    COUNT(*) FILTER (WHERE event_type = 'cta_click') AS cta_clicks,
    COUNT(*) FILTER (WHERE event_type = 'tour_click') AS tour_clicks,
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
    MAX(created_at) FILTER (WHERE event_type = 'profile_view') AS last_viewed_at
  FROM scoped;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_operator_storefront_analytics(UUID, INT) TO authenticated;