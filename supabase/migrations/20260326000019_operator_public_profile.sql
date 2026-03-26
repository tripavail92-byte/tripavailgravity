-- Phase 11: Operator public profile foundation
-- Adds slug, business_name, contact_name, is_public to tour_operator_profiles
-- Creates operator_public_metrics snapshot table
-- Adds public RLS + auto-slug trigger + metrics refresh trigger

-- ─────────────────────────────────────────────────────────────────
-- 1. Extend tour_operator_profiles with public-profile fields
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.tour_operator_profiles
  ADD COLUMN IF NOT EXISTS slug          TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_name  TEXT,
  ADD COLUMN IF NOT EXISTS is_public     BOOLEAN NOT NULL DEFAULT true;

-- ─────────────────────────────────────────────────────────────────
-- 2. Backfill slugs for existing operators
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  r      RECORD;
  v_base TEXT;
  v_slug TEXT;
  v_cnt  INT;
BEGIN
  FOR r IN
    SELECT user_id,
           COALESCE(NULLIF(trim(company_name), ''), 'operator') AS nm
    FROM   public.tour_operator_profiles
    WHERE  slug IS NULL
  LOOP
    v_base := lower(regexp_replace(trim(r.nm), '[^a-z0-9]+', '-', 'g'));
    v_base := regexp_replace(v_base, '-+', '-', 'g');
    v_base := trim(both '-' from v_base);
    IF v_base = '' THEN v_base := 'operator'; END IF;

    v_slug := v_base;
    v_cnt  := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.tour_operator_profiles
      WHERE  slug = v_slug AND user_id <> r.user_id
    ) LOOP
      v_slug := v_base || '-' || v_cnt;
      v_cnt  := v_cnt + 1;
    END LOOP;

    UPDATE public.tour_operator_profiles SET slug = v_slug WHERE user_id = r.user_id;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 3. Auto-assign slug on INSERT or when name changes
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.assign_operator_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_base TEXT;
  v_slug TEXT;
  v_cnt  INT;
BEGIN
  IF NEW.slug IS NULL THEN
    v_base := lower(regexp_replace(
      trim(COALESCE(
        NULLIF(trim(NEW.business_name), ''),
        NULLIF(trim(NEW.company_name), ''),
        'operator'
      )),
      '[^a-z0-9]+', '-', 'g'
    ));
    v_base := regexp_replace(v_base, '-+', '-', 'g');
    v_base := trim(both '-' from v_base);
    IF v_base = '' THEN v_base := 'operator'; END IF;

    v_slug := v_base;
    v_cnt  := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.tour_operator_profiles
      WHERE  slug = v_slug AND user_id <> NEW.user_id
    ) LOOP
      v_slug := v_base || '-' || v_cnt;
      v_cnt  := v_cnt + 1;
    END LOOP;
    NEW.slug := v_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_operator_slug ON public.tour_operator_profiles;
CREATE TRIGGER trg_assign_operator_slug
  BEFORE INSERT OR UPDATE OF business_name, company_name
  ON public.tour_operator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_operator_slug();

-- ─────────────────────────────────────────────────────────────────
-- 4. Public RLS: anyone can view public operator profiles
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_operator_profiles" ON public.tour_operator_profiles;
CREATE POLICY "public_read_operator_profiles"
  ON public.tour_operator_profiles
  FOR SELECT
  USING (is_public = true);

-- ─────────────────────────────────────────────────────────────────
-- 5. operator_public_metrics snapshot table
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.operator_public_metrics (
  operator_id              UUID        PRIMARY KEY
                                       REFERENCES public.tour_operator_profiles(user_id)
                                       ON DELETE CASCADE,
  avg_rating               NUMERIC(3,2),
  total_reviews            INT         NOT NULL DEFAULT 0,
  total_completed_bookings INT         NOT NULL DEFAULT 0,
  total_travelers_served   INT         NOT NULL DEFAULT 0,
  cancellation_rate        NUMERIC(5,2),
  verified_badge_count     INT         NOT NULL DEFAULT 0,
  last_calculated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_public_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_operator_metrics"
  ON public.operator_public_metrics FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────
-- 6. refresh_operator_public_metrics() helper
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
BEGIN
  -- Reviews aggregated across all operator tours
  SELECT ROUND(AVG(tbr.rating)::NUMERIC, 2), COUNT(*)::INT
  INTO   v_avg_rating, v_total_reviews
  FROM   public.tour_booking_reviews tbr
  JOIN   public.tours t ON t.id = tbr.tour_id
  WHERE  t.operator_id = p_operator_id
    AND  tbr.status = 'published';

  -- Completed bookings
  SELECT COUNT(*)::INT
  INTO   v_total_completed
  FROM   public.tour_bookings tb
  JOIN   public.tours t ON t.id = tb.tour_id
  WHERE  t.operator_id = p_operator_id
    AND  tb.status = 'completed';

  -- Distinct travelers (confirmed or completed bookings)
  SELECT COUNT(DISTINCT tb.traveler_id)::INT
  INTO   v_total_travelers
  FROM   public.tour_bookings tb
  JOIN   public.tours t ON t.id = tb.tour_id
  WHERE  t.operator_id = p_operator_id
    AND  tb.status IN ('confirmed', 'completed');

  -- Cancellation rate
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

  INSERT INTO public.operator_public_metrics (
    operator_id, avg_rating, total_reviews,
    total_completed_bookings, total_travelers_served,
    cancellation_rate, last_calculated_at
  )
  VALUES (
    p_operator_id,
    v_avg_rating,
    COALESCE(v_total_reviews,   0),
    COALESCE(v_total_completed, 0),
    COALESCE(v_total_travelers, 0),
    v_cancellation_rate,
    now()
  )
  ON CONFLICT (operator_id) DO UPDATE SET
    avg_rating               = EXCLUDED.avg_rating,
    total_reviews            = EXCLUDED.total_reviews,
    total_completed_bookings = EXCLUDED.total_completed_bookings,
    total_travelers_served   = EXCLUDED.total_travelers_served,
    cancellation_rate        = EXCLUDED.cancellation_rate,
    last_calculated_at       = now();
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 7. Auto-refresh metrics when a review changes
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_fn_refresh_op_metrics_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID;
BEGIN
  SELECT t.operator_id INTO v_operator_id
  FROM   public.tours t
  WHERE  t.id = COALESCE(NEW.tour_id, OLD.tour_id);

  IF v_operator_id IS NOT NULL THEN
    PERFORM public.refresh_operator_public_metrics(v_operator_id);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_op_metrics_review ON public.tour_booking_reviews;
CREATE TRIGGER trg_refresh_op_metrics_review
  AFTER INSERT OR UPDATE OR DELETE
  ON public.tour_booking_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_refresh_op_metrics_on_review();

-- ─────────────────────────────────────────────────────────────────
-- 8. Seed metrics for all existing operators
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT user_id FROM public.tour_operator_profiles LOOP
    PERFORM public.refresh_operator_public_metrics(r.user_id);
  END LOOP;
END;
$$;
