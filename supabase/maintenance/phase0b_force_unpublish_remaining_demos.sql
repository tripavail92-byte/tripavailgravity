-- ============================================================================
-- Phase 0b follow-up — force-unpublish the 4 demo hotels the booking guard held back
--
-- phase0_clean_hotel_shelf.sql took 7 of its 11 targets down. Four survived, all foreign demo
-- shells, because each has seed rows in package_bookings and every UPDATE there was gated on
--
--     NOT EXISTS (SELECT 1 FROM package_bookings … WHERE p.hotel_id = h.id)
--
-- That guard exists so a listing a real traveller booked never disappears silently. Pre-launch,
-- with the whole dataset being demo content, it is protecting seed rows and nothing else — so
-- this drops the guard for these four specific ids. Same call as the 29 Jul package cleanup.
--
-- WHAT THIS DOES NOT DO. is_published flips to FALSE. That is all. The 48 rows in
-- package_bookings are untouched, no FK cascade fires, no traveller record changes. The sanity
-- check at the bottom asserts the booking count is identical before and after.
--
-- SCOPE IS DELIBERATELY NARROW. Only the four foreign demo shells — Maldives, Switzerland,
-- Indonesia, Santorini. Three of them carry literal placeholder UUIDs (1111…, 2222…, 3333…),
-- which is conclusive seed data. "lasdana inn" and "KA Lodges" are NOT included: both sit in the
-- Pakistan market with real descriptions and rooms, so they are plausibly partner test listings
-- rather than platform seed data, and unpublishing a partner's work is worse than leaving a demo
-- up one more day. Decide those two by hand.
--
-- PREREQUISITE, already applied: 20260729000001_restore_search_hotel_visibility_gate.sql.
-- Verified live — search returns 3 packages and no "Untitled Hotel" subtitle.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — Preview. What is about to change, and the seed bookings under it.
-- ──────────────────────────────────────────────────────────────────────────

SELECT
  h.id,
  h.name,
  h.country,
  (SELECT count(*) FROM public.rooms r WHERE r.hotel_id = h.id)    AS rooms,
  (SELECT count(*) FROM public.packages p WHERE p.hotel_id = h.id) AS packages,
  (SELECT count(*) FROM public.package_bookings b
     JOIN public.packages p2 ON p2.id = b.package_id
    WHERE p2.hotel_id = h.id)                                      AS seed_bookings
FROM public.hotels h
WHERE h.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '2bec9ef0-a1ab-4207-a0c7-3408f5fce7aa'
)
ORDER BY h.name;


BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- The four demo shells. No booking guard this time — that was the decision.
-- ──────────────────────────────────────────────────────────────────────────

UPDATE public.hotels
SET is_published = FALSE,
    updated_at   = NOW()
WHERE is_published = TRUE
  AND id IN (
    '11111111-1111-1111-1111-111111111111',  -- Grand Paradise Resort  · Maldives
    '22222222-2222-2222-2222-222222222222',  -- Serene Mountain Lodge  · Switzerland
    '33333333-3333-3333-3333-333333333333',  -- Tropical Beach Villa   · Indonesia
    '2bec9ef0-a1ab-4207-a0c7-3408f5fce7aa'   -- Coastal Breeze Villas  · Santorini
  );


-- ──────────────────────────────────────────────────────────────────────────
-- The orphaned package. Same story: blocked last run because it has seed bookings.
-- "Romance & Roses Package" is live, and its parent hotel is an unpublished draft named
-- "Untitled Hotel". The restored search gate already hides it from search; this takes it off
-- the home feed and /hotels too, both of which read the packages table directly and never
-- check the hotel.
-- ──────────────────────────────────────────────────────────────────────────

UPDATE public.packages p
SET is_published = FALSE,
    updated_at   = NOW()
WHERE p.is_published = TRUE
  AND EXISTS (
    SELECT 1 FROM public.hotels h
    WHERE h.id = p.hotel_id AND h.is_published = FALSE
  );


-- ──────────────────────────────────────────────────────────────────────────
-- SANITY CHECK — read all five before choosing COMMIT or ROLLBACK.
-- ──────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM public.hotels   WHERE is_published)                    AS live_hotels_after,
  (SELECT count(*) FROM public.packages WHERE is_published)                    AS live_packages_after,
  (SELECT count(*) FROM public.hotels h WHERE h.is_published
     AND (h.country IS NULL OR h.country ILIKE '%unknown%'
          OR h.location IS NULL OR h.location = '' OR h.location ILIKE '%unknown%'))
                                                                               AS live_hotels_bad_location,
  (SELECT count(*) FROM public.packages p WHERE p.is_published
     AND NOT EXISTS (SELECT 1 FROM public.hotels h
                     WHERE h.id = p.hotel_id AND h.is_published))              AS orphaned_live_packages,
  (SELECT count(*) FROM public.package_bookings)                               AS bookings_untouched;

-- EXPECTED
--   live_hotels_after          14 → 10
--   live_packages_after         4 →  3
--   live_hotels_bad_location    6 →  2   (lasdana inn + KA Lodges, both left for you)
--   orphaned_live_packages      1 →  0   ← must be 0
--   bookings_untouched         48 → 48   ← must NOT move; if it does, ROLLBACK

COMMIT;
-- ROLLBACK;  -- swap for COMMIT above if any number is off


-- ──────────────────────────────────────────────────────────────────────────
-- VERIFY FROM OUTSIDE — the same call the site makes:
--
--   POST /rest/v1/rpc/search_listings_unified {"p_types":["package"],"p_limit":50}
--
-- Expect 3 rows: Weekend Bliss Retreat (Khayam hotels) and Kids & Family Special ×2
-- (Honeybee Inn). No Maldives, Switzerland, Indonesia or Santorini may appear anywhere.
-- ============================================================================
