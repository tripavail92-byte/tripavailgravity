-- Phase 11: Tour review replies + operator review notification
-- Allows tour operators to reply once to each traveler review.
-- Sends an in-app notification to the traveler when a reply is posted.

-- ─────────────────────────────────────────────────────────────────
-- 1. tour_review_replies table
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tour_review_replies (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID          NOT NULL REFERENCES public.tour_booking_reviews(id) ON DELETE CASCADE,
  operator_id UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body        TEXT          NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- One reply per review
  CONSTRAINT uq_tour_review_reply_per_review UNIQUE (review_id)
);

ALTER TABLE public.tour_review_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can read replies (public marketplace transparency)
CREATE POLICY "read_tour_review_replies"
  ON public.tour_review_replies
  FOR SELECT
  USING (true);

-- Operator can insert a reply only for a review on a tour they own
CREATE POLICY "operator_insert_review_reply"
  ON public.tour_review_replies
  FOR INSERT
  WITH CHECK (
    operator_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.tour_booking_reviews tbr
      JOIN public.tours t ON t.id = tbr.tour_id
      WHERE tbr.id = review_id
        AND t.operator_id = auth.uid()
    )
  );

-- Operator can update their own reply
CREATE POLICY "operator_update_review_reply"
  ON public.tour_review_replies
  FOR UPDATE
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- 2. updated_at auto-bump trigger
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_tour_review_reply_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tour_review_reply_updated_at ON public.tour_review_replies;
CREATE TRIGGER trg_tour_review_reply_updated_at
  BEFORE UPDATE ON public.tour_review_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tour_review_reply_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- 3. Notify traveler when operator posts a reply
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_review_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_traveler_id   UUID;
  v_tour_title    TEXT;
  v_operator_name TEXT;
BEGIN
  -- Look up the traveler and tour details for the review being replied to
  SELECT
    tbr.traveler_id,
    t.title,
    COALESCE(top.business_name, top.contact_name, 'The operator') AS op_name
  INTO v_traveler_id, v_tour_title, v_operator_name
  FROM public.tour_booking_reviews tbr
  JOIN public.tours t ON t.id = tbr.tour_id
  LEFT JOIN public.tour_operator_profiles top ON top.user_id = NEW.operator_id
  WHERE tbr.id = NEW.review_id;

  -- Fire notification to the traveler
  IF v_traveler_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      read
    )
    VALUES (
      v_traveler_id,
      'review_reply_received',
      v_operator_name || ' replied to your review',
      'Your review of "' || COALESCE(v_tour_title, 'a tour') || '" received a response.',
      jsonb_build_object(
        'review_id',   NEW.review_id,
        'reply_id',    NEW.id,
        'operator_id', NEW.operator_id
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_review_reply ON public.tour_review_replies;
CREATE TRIGGER trg_notify_review_reply
  AFTER INSERT ON public.tour_review_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_review_reply();

-- ─────────────────────────────────────────────────────────────────
-- 4. Notify operator when a new review is posted on their tour
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_operator_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID;
  v_tour_title  TEXT;
BEGIN
  -- Only fire for published reviews
  IF NEW.status <> 'published' THEN
    RETURN NEW;
  END IF;

  SELECT t.operator_id, t.title
  INTO v_operator_id, v_tour_title
  FROM public.tours t
  WHERE t.id = NEW.tour_id;

  IF v_operator_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      read
    )
    VALUES (
      v_operator_id,
      'review_received',
      'New ' || NEW.rating::TEXT || '-star review',
      'You received a review on "' || COALESCE(v_tour_title, 'your tour') || '".',
      jsonb_build_object(
        'review_id', NEW.id,
        'tour_id',   NEW.tour_id,
        'rating',    NEW.rating
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_operator_new_review ON public.tour_booking_reviews;
CREATE TRIGGER trg_notify_operator_new_review
  AFTER INSERT ON public.tour_booking_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_operator_new_review();

-- ─────────────────────────────────────────────────────────────────
-- 5. RPC: get all reviews (with reply) for an operator's tours
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_operator_tour_reviews(p_operator_id UUID)
RETURNS TABLE (
  review_id        UUID,
  tour_id          UUID,
  tour_title       TEXT,
  booking_id       UUID,
  traveler_id      UUID,
  rating           SMALLINT,
  title            TEXT,
  body             TEXT,
  status           TEXT,
  created_at       TIMESTAMPTZ,
  reply_id         UUID,
  reply_body       TEXT,
  reply_created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tbr.id            AS review_id,
    tbr.tour_id,
    t.title           AS tour_title,
    tbr.booking_id,
    tbr.traveler_id,
    tbr.rating,
    tbr.title,
    tbr.body,
    tbr.status,
    tbr.created_at,
    trr.id            AS reply_id,
    trr.body          AS reply_body,
    trr.created_at    AS reply_created_at
  FROM public.tour_booking_reviews tbr
  JOIN public.tours t ON t.id = tbr.tour_id AND t.operator_id = p_operator_id
  LEFT JOIN public.tour_review_replies trr ON trr.review_id = tbr.id
  ORDER BY tbr.created_at DESC;
$$;
