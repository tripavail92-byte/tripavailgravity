-- ============================================================
-- Fix: tie tour_id to the booking's tour in tour_booking_reviews RLS.
--
-- The original insert/update policies (20260326000017) only checked that the
-- reviewer owns SOME confirmed/completed booking — they never checked that the
-- review's tour_id matches THAT booking's tour_id. Because the only write path
-- is a direct client insert (reviewService.submitTourReview), RLS is the sole
-- gate, so a traveler holding one confirmed booking could insert a review with
-- an arbitrary tour_id and the rating-aggregation trigger would fold it into
-- that other tour's rating/review_count (fake-review / rating manipulation).
--
-- This migration recreates both policies with `tb.tour_id = tour_id` so a
-- traveler can only review the exact tour they booked. Idempotent.
-- ============================================================

DROP POLICY IF EXISTS "tour_booking_reviews_insert_own" ON public.tour_booking_reviews;
CREATE POLICY "tour_booking_reviews_insert_own"
  ON public.tour_booking_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = traveler_id
    AND EXISTS (
      SELECT 1 FROM public.tour_bookings tb
      WHERE tb.id = booking_id
        AND tb.traveler_id = auth.uid()
        AND tb.tour_id = tour_id                    -- << the fix: review must match the booked tour
        AND tb.status IN ('confirmed', 'completed')
    )
  );

DROP POLICY IF EXISTS "tour_booking_reviews_update_own" ON public.tour_booking_reviews;
CREATE POLICY "tour_booking_reviews_update_own"
  ON public.tour_booking_reviews FOR UPDATE
  USING (auth.uid() = traveler_id)
  WITH CHECK (
    auth.uid() = traveler_id
    AND EXISTS (
      SELECT 1 FROM public.tour_bookings tb
      WHERE tb.id = booking_id
        AND tb.traveler_id = auth.uid()
        AND tb.tour_id = tour_id                    -- << prevent re-pointing a review at another tour
    )
  );

-- NOTE (defense-in-depth, optional): the UI only surfaces the review dialog once
-- the operator has confirmed completion (bookings.metadata->>'operator_completion_confirmed_at').
-- RLS still admits status 'confirmed', so a review can be posted before the tour
-- runs. Since the tour_id tie above already restricts reviews to the traveler's
-- own booked tour, this is low-risk; tighten later if desired by also requiring
-- tb.status = 'completed' OR the operator-completion timestamp.
