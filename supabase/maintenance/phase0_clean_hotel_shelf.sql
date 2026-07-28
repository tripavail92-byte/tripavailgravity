-- ============================================================================
-- Phase 0 — Clean the hotel shelf: 21 published rows → 9 genuine properties
--
-- Nothing is deleted. is_published flips to FALSE and every row stays recoverable from the
-- partner dashboard. No FK cascade fires because no row is removed.
--
-- MEASURED AGAINST PRODUCTION with the public anon key immediately before this file was written.
-- Every id below was read from the live `hotels` table, not carried over from a fixture.
--
-- ONE THING I COULD NOT SEE. `package_bookings` is not readable by anon — the same query that
-- returned 44 rows to `postgres` during the 29 Jul package cleanup returns 0 to the anon key. So
-- the booking counts I used to rank these rows are NOT trustworthy, and the guards below live in
-- the SQL (where they run as postgres and can see everything) rather than in my choice of which
-- row to keep. If a guard blocks a row you expected to come down, that row has a real booking
-- against it and is a support case, not a cleanup target.
--
-- ORDER MATTERS: apply 20260729000001_restore_search_hotel_visibility_gate.sql FIRST. Once the
-- INNER JOIN is restored, packages hanging off unpublished hotels leave search on their own, and
-- Section E below becomes a tidy-up rather than a fix.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — Preview. Read this before running anything below.
-- ──────────────────────────────────────────────────────────────────────────

SELECT
  h.id,
  h.name,
  h.location,
  h.country,
  h.created_at::date AS created,
  (SELECT count(*) FROM public.rooms r WHERE r.hotel_id = h.id)                        AS rooms,
  (SELECT count(*) FROM public.packages p WHERE p.hotel_id = h.id)                     AS packages,
  (SELECT count(*) FROM public.packages p
     WHERE p.hotel_id = h.id AND p.is_published) AS live_packages,
  (SELECT count(*) FROM public.package_bookings b
     JOIN public.packages p2 ON p2.id = b.package_id
    WHERE p2.hotel_id = h.id)                                                          AS bookings
FROM public.hotels h
WHERE h.is_published = TRUE
ORDER BY bookings DESC, rooms DESC, h.name;


BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- SECTION A — 7 foreign demo shells
--
-- February seed batch. Every one has zero rooms and zero images, so none can take a booking
-- even in principle. Three carry literal placeholder UUIDs (1111…, 2222…, 3333…), which is
-- conclusive: nobody generates those by accident. These are the properties behind the ten
-- foreign demo PACKAGES unpublished on 29 Jul — the packages came down, the hotels did not.
-- ──────────────────────────────────────────────────────────────────────────

UPDATE public.hotels h
SET is_published = FALSE,
    updated_at   = NOW()
WHERE h.is_published = TRUE
  AND h.id IN (
    'e2ba29b0-838e-4680-b485-8fa2f4b60425',  -- Grand Paradise Resort   · Maldives
    '11111111-1111-1111-1111-111111111111',  -- Grand Paradise Resort   · Maldives  (dup)
    '22222222-2222-2222-2222-222222222222',  -- Serene Mountain Lodge   · Switzerland
    '33333333-3333-3333-3333-333333333333',  -- Tropical Beach Villa    · Indonesia
    'e32019bb-b59c-4da6-a4e0-3000b0986b17',  -- Aurora Grand Hotel      · Paris
    '94fb0622-bfb0-4158-8a40-619fb79ef2cc',  -- Palm Cove Resort        · Maldives
    '2bec9ef0-a1ab-4207-a0c7-3408f5fce7aa'   -- Coastal Breeze Villas   · Santorini
  )
  -- A demo shell that somehow took a real booking is a support problem, not a cleanup target.
  AND NOT EXISTS (
    SELECT 1 FROM public.package_bookings b
    JOIN public.packages p ON p.id = b.package_id
    WHERE p.hotel_id = h.id
  );


-- ──────────────────────────────────────────────────────────────────────────
-- SECTION B — junk listing
--
-- "asdasd", nine-character description, empty location string. Live since 7 Feb.
-- ──────────────────────────────────────────────────────────────────────────

UPDATE public.hotels h
SET is_published = FALSE,
    updated_at   = NOW()
WHERE h.is_published = TRUE
  AND h.id = '4b1a6207-5cc6-4944-bf8f-b3f17aec7f62'
  AND NOT EXISTS (
    SELECT 1 FROM public.package_bookings b
    JOIN public.packages p ON p.id = b.package_id
    WHERE p.hotel_id = h.id
  );


-- ──────────────────────────────────────────────────────────────────────────
-- SECTION C — duplicates
--
-- Same property published more than once, identical data on every copy.
--
--   Khayam hotels ×3 — all created 2026-07-16 16:49, all 2 rooms. KEEPING
--   409c4264… because it is the only one carrying a live package; unpublishing it would take
--   "Weekend Bliss Retreat" off the shelf with it.
--
--   the marriot ×2 — created 21:26 and 21:27 on 2026-07-02, identical. Keeping the older.
--
-- The NOT EXISTS guard matters most here: if a copy I ranked as droppable turns out to hold
-- the bookings, it survives and you resolve it by hand rather than losing the booking's listing.
-- ──────────────────────────────────────────────────────────────────────────

UPDATE public.hotels h
SET is_published = FALSE,
    updated_at   = NOW()
WHERE h.is_published = TRUE
  AND h.id IN (
    '135b6c02-468d-4d37-99e4-6a15279b6453',  -- Khayam hotels  (dup — keep 409c4264…)
    '858b1416-40c1-459d-bbba-3ba1e4cc940d',  -- Khayam hotels  (dup — keep 409c4264…)
    'b4bcdf52-1da8-4ddc-9a3a-fa307126581b'   -- the marriot    (dup — keep 94fd6ee0…)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.package_bookings b
    JOIN public.packages p ON p.id = b.package_id
    WHERE p.hotel_id = h.id
  );


-- ──────────────────────────────────────────────────────────────────────────
-- SECTION D — placeholder locations on REAL listings
--
-- These stay published. They are genuine, well-filled properties whose country field says
-- "Unknown Country", which makes them unplaceable in geo search and reads as broken to a
-- traveller. Honeybee Inn is the more urgent of the two: it carries 2 live packages, so it is
-- one of only two properties on the platform that can currently be booked at all.
-- ──────────────────────────────────────────────────────────────────────────

UPDATE public.hotels
SET country    = 'Pakistan',
    location   = 'Hunza Nagar, Pakistan',
    city       = COALESCE(NULLIF(city, ''), 'Hunza Nagar'),
    updated_at = NOW()
WHERE id = '9a5235da-5189-44ab-a330-5e373a8bc138'   -- Honeybee Inn
  AND country IS DISTINCT FROM 'Pakistan';

-- KA Lodges — 32 amenities, 2 rooms, a real 258-character description, and no city anywhere in
-- the row to infer from. Left for you: replace <CITY> and uncomment. I am not guessing a
-- location onto a live listing.
--
-- UPDATE public.hotels
-- SET country    = 'Pakistan',
--     city       = '<CITY>',
--     location   = '<CITY>, Pakistan',
--     updated_at = NOW()
-- WHERE id = '3c36b11c-875c-4cba-b54a-135ac44a5a79';


-- ──────────────────────────────────────────────────────────────────────────
-- SECTION E — the orphaned package
--
-- "Romance & Roses Package" is published and bookable, but its parent hotel is an unpublished
-- draft literally named "Untitled Hotel". With the search gate restored it already vanishes from
-- search; this unpublishes the package itself so it also leaves the home feed and /hotels, both
-- of which read the packages table directly and never check the hotel.
-- ──────────────────────────────────────────────────────────────────────────

UPDATE public.packages p
SET is_published = FALSE,
    updated_at   = NOW()
WHERE p.is_published = TRUE
  AND EXISTS (
    SELECT 1 FROM public.hotels h
    WHERE h.id = p.hotel_id AND h.is_published = FALSE
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.package_bookings b WHERE b.package_id = p.id
  );


-- ──────────────────────────────────────────────────────────────────────────
-- SANITY CHECK — read all five numbers before deciding COMMIT vs ROLLBACK.
-- ──────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM public.hotels WHERE is_published)                      AS live_hotels_after,
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
--   live_hotels_after         21 → 10   (7 demos + 1 junk + 3 dups removed)
--   live_packages_after        4 →  3   (Romance & Roses unpublished)
--   live_hotels_bad_location   3 →  2   (Honeybee fixed; KA Lodges + lasdana inn remain)
--   orphaned_live_packages     1 →  0   ← must be 0
--   bookings_untouched         unchanged from before this ran ← must not move
--
-- live_hotels_after lands at 10, not the 9 in the plan, because "lasdana inn" is left published.
-- It has a real description and a room but an Unknown-Country location and a name I cannot
-- classify from data. Decide that one by hand.

COMMIT;
-- ROLLBACK;  -- swap for COMMIT above if any number is off


-- ============================================================================
-- OPTIONAL — only if 50df991b is your test account.
--
-- "the marriot" and "asdasd" share owner 50df991b and were created 14 minutes apart on 7 Feb.
-- Section B takes down asdasd either way. If that owner is a test account, the surviving
-- marriot row should come down too; if it is a real Islamabad partner, leave this alone.
-- Check first, then uncomment:
--
--   SELECT id, email, created_at FROM auth.users WHERE id = '50df991b-...';
--
-- UPDATE public.hotels h SET is_published = FALSE, updated_at = NOW()
-- WHERE h.id = '94fd6ee0-0d99-4639-8621-dd682bab59cb'
--   AND NOT EXISTS (SELECT 1 FROM public.package_bookings b
--                   JOIN public.packages p ON p.id = b.package_id
--                   WHERE p.hotel_id = h.id);
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- VERIFY FROM OUTSIDE — the same call the site makes:
--
--   POST /rest/v1/rpc/search_listings_unified {"p_types":["package"],"p_limit":50}
--
-- No result may carry "Untitled Hotel" as its subtitle, and no foreign demo may reappear.
-- If any do, the seed script reintroduced them and needs pruning at its source, not here.
-- ============================================================================
