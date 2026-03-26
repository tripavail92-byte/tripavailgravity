-- Phase 10: Tour booking reviews system
-- Creates tour_booking_reviews table, RLS, and aggregate rating trigger

-- ============================================================
-- 1. Create tour_booking_reviews table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tour_booking_reviews (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id         UUID         NOT NULL REFERENCES public.tour_bookings(id) ON DELETE CASCADE,
  traveler_id        UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id            UUID         NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  rating             SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title              TEXT         NULL CHECK (char_length(title) <= 120),
  body               TEXT         NULL CHECK (char_length(body) <= 2000),
  status             TEXT         NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'removed')),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- one review per booking
  CONSTRAINT tour_booking_reviews_booking_id_unique UNIQUE (booking_id)
);

-- Index for fast per-tour listing
CREATE INDEX IF NOT EXISTS idx_tour_booking_reviews_tour_id
  ON public.tour_booking_reviews (tour_id)
  WHERE status = 'published';

-- Index for traveler's own reviews
CREATE INDEX IF NOT EXISTS idx_tour_booking_reviews_traveler_id
  ON public.tour_booking_reviews (traveler_id);

-- ============================================================
-- 2. RLS
-- ============================================================
ALTER TABLE public.tour_booking_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read published reviews
CREATE POLICY "tour_booking_reviews_select_published"
  ON public.tour_booking_reviews FOR SELECT
  USING (status = 'published');

-- Travelers can insert a review only for their confirmed/completed booking
CREATE POLICY "tour_booking_reviews_insert_own"
  ON public.tour_booking_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = traveler_id
    AND EXISTS (
      SELECT 1 FROM public.tour_bookings tb
      WHERE tb.id = booking_id
        AND tb.traveler_id = auth.uid()
        AND tb.status IN ('confirmed', 'completed')
    )
  );

-- Travelers can update their own review body/title (not rating once set)
CREATE POLICY "tour_booking_reviews_update_own"
  ON public.tour_booking_reviews FOR UPDATE
  USING (auth.uid() = traveler_id)
  WITH CHECK (auth.uid() = traveler_id);

-- Admins can select/update (for moderation) via service role — no additional policy needed,
-- service role bypasses RLS by default.

-- ============================================================
-- 3. Trigger: maintain tours.rating and tours.review_count
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_tour_rating_aggregate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tour_id UUID;
BEGIN
  -- Determine which tour to re-aggregate
  IF TG_OP = 'DELETE' THEN
    v_tour_id := OLD.tour_id;
  ELSE
    v_tour_id := NEW.tour_id;
  END IF;

  UPDATE public.tours
  SET
    rating       = (
      SELECT ROUND(AVG(r.rating)::NUMERIC, 1)
      FROM public.tour_booking_reviews r
      WHERE r.tour_id = v_tour_id AND r.status = 'published'
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.tour_booking_reviews r
      WHERE r.tour_id = v_tour_id AND r.status = 'published'
    ),
    updated_at   = NOW()
  WHERE id = v_tour_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tour_rating ON public.tour_booking_reviews;

CREATE TRIGGER trg_sync_tour_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.tour_booking_reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_tour_rating_aggregate();

-- ============================================================
-- 4. updated_at auto-bump
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_tour_booking_review_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tour_booking_review_updated_at ON public.tour_booking_reviews;

CREATE TRIGGER trg_tour_booking_review_updated_at
  BEFORE UPDATE ON public.tour_booking_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_tour_booking_review_updated_at();

-- ============================================================
-- 5. Admin helper function: list reviews for moderation
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_tour_reviews(p_limit INT DEFAULT 100)
RETURNS TABLE (
  id            UUID,
  booking_id    UUID,
  traveler_id   UUID,
  tour_id       UUID,
  tour_title    TEXT,
  rating        SMALLINT,
  title         TEXT,
  body          TEXT,
  status        TEXT,
  created_at    TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.booking_id,
    r.traveler_id,
    r.tour_id,
    t.title AS tour_title,
    r.rating,
    r.title,
    r.body,
    r.status,
    r.created_at
  FROM public.tour_booking_reviews r
  JOIN public.tours t ON t.id = r.tour_id
  ORDER BY r.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- 6. Admin helper function: remove/restore a review
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_moderate_tour_review(
  p_review_id UUID,
  p_action    TEXT  -- 'remove' | 'restore'
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_action NOT IN ('remove', 'restore') THEN
    RAISE EXCEPTION 'invalid action: %', p_action;
  END IF;

  UPDATE public.tour_booking_reviews
  SET status = CASE p_action
    WHEN 'remove'   THEN 'removed'
    WHEN 'restore'  THEN 'published'
  END
  WHERE id = p_review_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'review % not found', p_review_id;
  END IF;
END;
$$;
