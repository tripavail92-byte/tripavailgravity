-- Phase 12: Structured Category Ratings
-- Adds 8 category rating columns to tour_booking_reviews
-- Adds matching avg category columns to operator_public_metrics
-- Auto-refresh operator_public_metrics trigger on every review change

-- ─────────────────────────────────────────────────────────────────
-- 1. Category rating columns on tour_booking_reviews
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.tour_booking_reviews
  ADD COLUMN IF NOT EXISTS rating_communication   SMALLINT CHECK (rating_communication   BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_punctuality     SMALLINT CHECK (rating_punctuality     BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_transport       SMALLINT CHECK (rating_transport       BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_guide           SMALLINT CHECK (rating_guide           BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_safety          SMALLINT CHECK (rating_safety          BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_cleanliness     SMALLINT CHECK (rating_cleanliness     BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_value           SMALLINT CHECK (rating_value           BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_itinerary       SMALLINT CHECK (rating_itinerary       BETWEEN 1 AND 5);

-- ─────────────────────────────────────────────────────────────────
-- 2. Category avg columns on operator_public_metrics
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.operator_public_metrics
  ADD COLUMN IF NOT EXISTS avg_communication   NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_punctuality     NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_transport       NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_guide           NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_safety          NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_cleanliness     NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_value           NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_itinerary       NUMERIC(3,2);

-- ─────────────────────────────────────────────────────────────────
-- 3. Replace refresh_operator_public_metrics to include categories
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.refresh_operator_public_metrics(p_operator_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_rating         NUMERIC(3,2);
  v_total_reviews      INT;
  v_total_completed    INT;
  v_total_travelers    INT;
  v_cancellation_rate  NUMERIC(5,2);
  v_avg_communication  NUMERIC(3,2);
  v_avg_punctuality    NUMERIC(3,2);
  v_avg_transport      NUMERIC(3,2);
  v_avg_guide          NUMERIC(3,2);
  v_avg_safety         NUMERIC(3,2);
  v_avg_cleanliness    NUMERIC(3,2);
  v_avg_value          NUMERIC(3,2);
  v_avg_itinerary      NUMERIC(3,2);
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
  FROM   public.tour_booking_reviews tbr
  JOIN   public.tours t ON t.id = tbr.tour_id
  WHERE  t.operator_id = p_operator_id
    AND  tbr.status = 'published';

  SELECT COUNT(*)::INT
  INTO   v_total_completed
  FROM   public.tour_bookings tb
  JOIN   public.tours t ON t.id = tb.tour_id
  WHERE  t.operator_id = p_operator_id
    AND  tb.status = 'completed';

  SELECT COUNT(DISTINCT tb.traveler_id)::INT
  INTO   v_total_travelers
  FROM   public.tour_bookings tb
  JOIN   public.tours t ON t.id = tb.tour_id
  WHERE  t.operator_id = p_operator_id
    AND  tb.status IN ('confirmed', 'completed');

  SELECT CASE
    WHEN COUNT(*) = 0 THEN NULL
    ELSE ROUND(
      COUNT(*) FILTER (WHERE tb.status = 'cancelled')::NUMERIC / COUNT(*) * 100, 2
    )
  END
  INTO v_cancellation_rate
  FROM public.tour_bookings tb
  JOIN public.tours t ON t.id = tb.tour_id
  WHERE t.operator_id = p_operator_id;

  INSERT INTO public.operator_public_metrics (
    operator_id,
    avg_rating, total_reviews,
    total_completed_bookings, total_travelers_served,
    cancellation_rate, last_calculated_at,
    avg_communication, avg_punctuality, avg_transport,
    avg_guide, avg_safety, avg_cleanliness,
    avg_value, avg_itinerary
  )
  VALUES (
    p_operator_id,
    v_avg_rating,
    COALESCE(v_total_reviews,   0),
    COALESCE(v_total_completed, 0),
    COALESCE(v_total_travelers, 0),
    v_cancellation_rate,
    now(),
    v_avg_communication, v_avg_punctuality, v_avg_transport,
    v_avg_guide,         v_avg_safety,      v_avg_cleanliness,
    v_avg_value,         v_avg_itinerary
  )
  ON CONFLICT (operator_id) DO UPDATE SET
    avg_rating               = EXCLUDED.avg_rating,
    total_reviews            = EXCLUDED.total_reviews,
    total_completed_bookings = EXCLUDED.total_completed_bookings,
    total_travelers_served   = EXCLUDED.total_travelers_served,
    cancellation_rate        = EXCLUDED.cancellation_rate,
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

-- ─────────────────────────────────────────────────────────────────
-- 4. Trigger: auto-refresh metrics whenever a review is added/changed
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_refresh_operator_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID;
BEGIN
  SELECT t.operator_id
  INTO   v_operator_id
  FROM   public.tours t
  WHERE  t.id = COALESCE(NEW.tour_id, OLD.tour_id);

  IF v_operator_id IS NOT NULL THEN
    PERFORM public.refresh_operator_public_metrics(v_operator_id);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_refresh_operator_metrics ON public.tour_booking_reviews;
CREATE TRIGGER trg_auto_refresh_operator_metrics
  AFTER INSERT OR UPDATE OR DELETE
  ON public.tour_booking_reviews
  FOR EACH ROW EXECUTE FUNCTION public.auto_refresh_operator_metrics();
