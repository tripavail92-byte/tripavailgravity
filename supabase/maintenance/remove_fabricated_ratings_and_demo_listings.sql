-- ============================================================================
-- Remove fabricated ratings, and take the seeded foreign demo listings offline
--
-- MEASURED AGAINST PRODUCTION on 2026-07-22 via the public search RPC (the same call the website
-- makes), not inferred from the schema:
--
--   31 live listings — 16 tours, 15 packages
--   15 of them carry a rating and a review count
--   16 carry none
--
-- ALL 15 ARE FABRICATED. Three independent proofs:
--
--   1. Nothing in the codebase ever writes hotels.rating, hotels.review_count, or (absent a real
--      review) tours.rating. hotelService.publishListing writes only star_rating, which is the
--      manager's own self-declared star count. Both columns DEFAULT 0.
--   2. There are no reviews. tour_booking_reviews is the only guest-review table on the platform,
--      and the admin calibration note of 2026-03-28 recorded every one of the 8 live operators at
--      total_reviews = 0, including the top-ranked one.
--   3. The counts repeat: 366 appears on three listings, 512 on two, 842 on two. Genuine review
--      totals do not collide like that. This is seed data.
--
-- WHY THIS MATTERS MORE THAN "DEMO CONTENT IN SEARCH":
-- Five of the fabricated listings are Pakistan-themed and indistinguishable from real inventory:
--
--   Swat & Kalam Cultural Highlands      4.8 from 164 reviews
--   Naran Kaghan Waterfalls & Meadows    4.7 from 211 reviews
--   Fairy Meadows Basecamp Experience    4.9 from  97 reviews
--   Skardu Lakes & Desert Adventure      4.8 from 142 reviews
--   Hunza Valley Scenic Escape           4.9 from 186 reviews
--
-- A traveller reading "4.9 from 186 reviews" is reading an invented number. Publishing fabricated
-- review counts is a consumer-protection issue in most markets, not merely a trust one, and it is
-- the single most consequential thing found on the platform today.
--
-- NOTHING HERE DELETES. Section A zeroes counters; Section B flips a visibility flag. Both are
-- reversible, and no booking, schedule or partner record is touched.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — PREVIEW. Run this first and read it. Change nothing until you have.
-- ──────────────────────────────────────────────────────────────────────────

-- Every listing currently publishing a rating it did not earn.
SELECT 'tour' AS kind, t.id, t.title, t.rating, t.review_count, t.is_published
FROM public.tours t
WHERE t.is_published = TRUE AND COALESCE(t.review_count, 0) > 0
UNION ALL
SELECT 'hotel', h.id, h.name, h.rating, h.review_count, h.is_published
FROM public.hotels h
WHERE COALESCE(h.review_count, 0) > 0
ORDER BY review_count DESC;

-- Cross-check the premise before acting: this must return 0. If it returns anything, real reviews
-- exist and Section A must be narrowed to spare those listings.
SELECT count(*) AS real_reviews_on_platform FROM public.tour_booking_reviews;


-- ──────────────────────────────────────────────────────────────────────────
-- SECTION A — Stop publishing invented ratings.  ** DO THIS ONE **
--
-- Guarded on the tour actually having no reviews, so a listing that has since earned genuine ones
-- is left alone. tours.rating is maintained by a trigger over tour_booking_reviews, so a real
-- review will repopulate it correctly; zeroing here does not break that.
-- ──────────────────────────────────────────────────────────────────────────

BEGIN;

UPDATE public.tours t
SET rating = 0, review_count = 0
WHERE COALESCE(t.review_count, 0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.tour_booking_reviews r WHERE r.tour_id = t.id
  );

-- Hotels have no review table at all, so any non-zero value here is seeded by definition.
UPDATE public.hotels
SET rating = 0, review_count = 0
WHERE COALESCE(review_count, 0) > 0;

-- Expect 0 on both. Re-run inside the transaction before committing.
SELECT
  (SELECT count(*) FROM public.tours  WHERE COALESCE(review_count,0) > 0) AS tours_still_rated,
  (SELECT count(*) FROM public.hotels WHERE COALESCE(review_count,0) > 0) AS hotels_still_rated;

COMMIT;
-- ROLLBACK;  -- use this instead if the counts above are not what you expect


-- ──────────────────────────────────────────────────────────────────────────
-- SECTION B — Take the seeded FOREIGN demo listings offline.
--
-- Separate from Section A on purpose: this is a judgement call about what your catalogue should
-- contain, whereas Section A is a correction of false information. Do A regardless; do B when you
-- agree with the list.
--
-- These are packages for destinations TripAvail does not serve. They are matched by id, captured
-- from the preview, rather than by title — a title match would also hide a real listing that later
-- happened to share a name.
-- ──────────────────────────────────────────────────────────────────────────

-- B1. Confirm the set before touching it.
SELECT id, name, is_published, created_at
FROM public.packages
WHERE is_published = TRUE
  AND name IN (
    'Coastal New Arrival',
    'Family Sea & Sun',
    'Santorini Weekend Getaway',
    'Couples Sunset Retreat',
    'Family Island Escape',
    'Weekend Luxe Reset',
    'Romance in Paris',
    'Bali Wellness & Culture Journey',
    'Maldives Honeymoon Paradise',
    'Alpine Ski & Wellness Retreat'
  )
ORDER BY name;

-- B2. Unpublish them, but ONLY where no one has ever booked. A demo listing with a real booking
-- against it is a support problem, not a cleanup target, and should be handled by hand.
-- BEGIN;
-- UPDATE public.packages p
-- SET is_published = FALSE
-- WHERE p.is_published = TRUE
--   AND p.name IN (
--     'Coastal New Arrival', 'Family Sea & Sun', 'Santorini Weekend Getaway',
--     'Couples Sunset Retreat', 'Family Island Escape', 'Weekend Luxe Reset',
--     'Romance in Paris', 'Bali Wellness & Culture Journey',
--     'Maldives Honeymoon Paradise', 'Alpine Ski & Wellness Retreat'
--   )
--   AND NOT EXISTS (SELECT 1 FROM public.package_bookings b WHERE b.package_id = p.id);
-- COMMIT;

-- B3. The five Pakistan-themed seeded tours are deliberately NOT in any list above. Once Section A
-- has removed their invented ratings they are ordinary listings, and whether they are real
-- inventory someone intends to sell is a question only you can answer:
--
--   Swat & Kalam Cultural Highlands, Naran Kaghan Waterfalls & Meadows,
--   Fairy Meadows Basecamp Experience, Skardu Lakes & Desert Adventure,
--   Hunza Valley Scenic Escape
--
-- If they are placeholders, unpublish them the same way. If an operator genuinely runs them, they
-- can stay — they will simply show no reviews, which is true.


-- ──────────────────────────────────────────────────────────────────────────
-- AFTERWARDS — confirm from the outside, the way a visitor sees it:
--
--   Every live listing should now report review_count = 0.
--   POST /rest/v1/rpc/search_listings_unified  {"p_limit":50}
--   and check that no row has a rating.
--
-- TO UNDO Section B:
--   UPDATE public.packages SET is_published = TRUE WHERE name IN ( ...same list... );
--
-- Section A is not meant to be undone. The previous values were invented.
-- ──────────────────────────────────────────────────────────────────────────
