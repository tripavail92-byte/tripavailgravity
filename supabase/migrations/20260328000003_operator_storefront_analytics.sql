-- Phase 15: Operator storefront analytics
-- Tracks public operator profile views, CTA interactions, and tour click-throughs.

CREATE TABLE IF NOT EXISTS public.operator_storefront_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES public.tour_operator_profiles(user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('profile_view', 'cta_click', 'tour_click')),
  slug TEXT NULL,
  tour_id UUID NULL REFERENCES public.tours(id) ON DELETE SET NULL,
  visitor_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operator_storefront_events_operator_created_idx
  ON public.operator_storefront_events(operator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operator_storefront_events_operator_type_created_idx
  ON public.operator_storefront_events(operator_id, event_type, created_at DESC);

ALTER TABLE public.operator_storefront_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Operators can read own storefront events" ON public.operator_storefront_events;
CREATE POLICY "Operators can read own storefront events"
  ON public.operator_storefront_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = operator_id OR public.is_admin(auth.uid()));

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

  IF p_event_type NOT IN ('profile_view', 'cta_click', 'tour_click') THEN
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

CREATE OR REPLACE FUNCTION public.get_operator_storefront_analytics(
  p_operator_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  profile_views BIGINT,
  unique_visitors BIGINT,
  cta_clicks BIGINT,
  tour_clicks BIGINT,
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
    SELECT *
    FROM public.operator_storefront_events
    WHERE operator_id = p_operator_id
      AND created_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1))
  )
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'profile_view') AS profile_views,
    COUNT(DISTINCT COALESCE(NULLIF(session_id, ''), id::TEXT)) FILTER (WHERE event_type = 'profile_view') AS unique_visitors,
    COUNT(*) FILTER (WHERE event_type = 'cta_click') AS cta_clicks,
    COUNT(*) FILTER (WHERE event_type = 'tour_click') AS tour_clicks,
    MAX(created_at) FILTER (WHERE event_type = 'profile_view') AS last_viewed_at
  FROM scoped;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_operator_storefront_event(UUID, TEXT, TEXT, UUID, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_operator_storefront_analytics(UUID, INT) TO authenticated;
