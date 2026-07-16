-- =====================================================================
-- CLEANUP: duplicate hotels created by the publish bug.
--
-- CAUSE: ListHotelPage never passed onComplete, so publishing succeeded but the wizard just sat
-- there with a re-enabled button. Managers clicked Publish again — and hotelService.publishListing
-- ran a plain INSERT each time, creating a whole new hotel + its rooms per click. Fixed in the
-- client; this cleans up what the bug already produced.
--
-- ⚠️ READ THIS BEFORE RUNNING ANYTHING. An earlier version of this script was dangerous. The
-- corrections below are the whole point of the rewrite:
--
--   1. DELETING A HOTEL DESTROYS PAID BOOKINGS. The FK chain is:
--        hotels <-- packages.hotel_id       ON DELETE CASCADE
--        packages <-- package_bookings.package_id  ON DELETE CASCADE
--      So one DELETE silently removes packages AND their package_bookings — rows carrying
--      stripe_payment_intent_id, payment_status and paid_at. Postgres raises NO error and the
--      transaction commits cleanly. Nothing warns you. (rooms.hotel_id also cascades; that part
--      is fine and intended.)
--
--   2. DRAFTS LIVE IN THIS TABLE. hotelService.saveDraft INSERTs into public.hotels with
--      is_published = false, draft_data = <form state>, and name = hotelName || 'Untitled Hotel'.
--      So (a) every unnamed draft an owner ever started collides on the same name, and (b) a draft
--      is always OLDER than the published copy made from it. Any "keep the oldest" rule therefore
--      keeps the draft and deletes the live listing — the exact inverse of what you want.
--
--   3. "KEEP THE OLDEST" IS WRONG ANYWAY. HotelSelectionStep lists a manager's hotels
--      newest-first, so the duplicate they actually attached a package to is usually the NEWEST.
--
-- STRATEGY (safe by construction): only ever delete a duplicate that NOTHING depends on — no
-- packages, no bookings. Published rows only; drafts are out of scope. If every copy in a group
-- has dependents, this script refuses to choose and step 4 hands the group to you.
-- =====================================================================


-- ── STEP 1 — PREVIEW (read-only). Run this first and actually read it. ──────
-- Every duplicate group among PUBLISHED hotels, with the full dependency count per row.
-- 'DELETE' is only ever proposed for a row with zero packages and zero bookings.
WITH dupes AS (
  SELECT
    h.id,
    h.owner_id,
    h.name,
    h.created_at,
    COUNT(*)     OVER (PARTITION BY h.owner_id, LOWER(TRIM(h.name)))  AS copies,
    -- Keep the row with the most dependents; break ties toward the NEWEST (it carries the full
    -- publish payload — address/city/country/star_rating — that an early copy may lack).
    ROW_NUMBER() OVER (
      PARTITION BY h.owner_id, LOWER(TRIM(h.name))
      ORDER BY
        (SELECT COUNT(*) FROM public.packages p WHERE p.hotel_id = h.id) DESC,
        h.created_at DESC,
        h.id
    ) AS rank_keep
  FROM public.hotels h
  WHERE h.is_published = true          -- drafts are NOT duplicates of this bug
    AND h.draft_data IS NULL           -- belt and braces: a published row still holding form state
)                                      -- is a half-finished publish, not a duplicate
SELECT
  CASE
    WHEN rank_keep = 1                        THEN '1. KEEP'
    WHEN pkg.n > 0 OR bkg.n > 0               THEN '!! MANUAL — duplicate HAS DEPENDENTS, do not delete'
    ELSE                                           '2. safe to delete (no dependents)'
  END                                                    AS action,
  d.copies                                               AS copies_of_this_name,
  d.id,
  d.owner_id,
  d.name,
  d.created_at,
  (SELECT COUNT(*) FROM public.rooms r WHERE r.hotel_id = d.id) AS rooms,
  pkg.n                                                  AS packages,
  bkg.n                                                  AS package_bookings,
  bkg.paid                                               AS PAID_bookings
FROM dupes d
CROSS JOIN LATERAL (
  SELECT COUNT(*) AS n FROM public.packages p WHERE p.hotel_id = d.id
) pkg
CROSS JOIN LATERAL (
  SELECT
    COUNT(*)                                                     AS n,
    COUNT(*) FILTER (WHERE pb.payment_status = 'paid')           AS paid
  FROM public.package_bookings pb
  JOIN public.packages p ON p.id = pb.package_id
  WHERE p.hotel_id = d.id
) bkg
WHERE d.copies > 1
ORDER BY d.owner_id, LOWER(TRIM(d.name)), d.rank_keep;

-- HOW TO READ IT:
--   * No rows at all      -> there are no published duplicates. Stop; there is nothing to clean.
--   * Any '!! MANUAL' row -> STOP. That duplicate has real packages/bookings hanging off it.
--                            Deleting it destroys them. Re-point packages.hotel_id at the keeper
--                            first (step 3), then re-run this preview.
--   * Only KEEP + 'safe to delete' -> step 2 is safe to run.


-- ── STEP 2 — DELETE (DESTRUCTIVE). Only after step 1 shows zero '!! MANUAL' rows. ──
-- Deletes ONLY published duplicates with no packages and no bookings. The NOT EXISTS guards are
-- not decoration: they are what makes this safe even if the preview was misread.
/*
BEGIN;

DELETE FROM public.hotels h
WHERE h.id IN (
  SELECT id FROM (
    SELECT
      h2.id,
      ROW_NUMBER() OVER (
        PARTITION BY h2.owner_id, LOWER(TRIM(h2.name))
        ORDER BY
          (SELECT COUNT(*) FROM public.packages p WHERE p.hotel_id = h2.id) DESC,
          h2.created_at DESC,
          h2.id
      ) AS rank_keep
    FROM public.hotels h2
    WHERE h2.is_published = true
      AND h2.draft_data IS NULL
  ) x
  WHERE x.rank_keep > 1            -- never the keeper
)
-- Hard guards: refuse to touch anything with dependents, whatever the ranking said.
AND NOT EXISTS (SELECT 1 FROM public.packages p WHERE p.hotel_id = h.id)
AND NOT EXISTS (
  SELECT 1 FROM public.package_bookings pb
  JOIN public.packages p ON p.id = pb.package_id
  WHERE p.hotel_id = h.id
);

-- Verify BEFORE committing. Expect: 0 orphaned paid bookings, and duplicates only where a group
-- legitimately has dependents on more than one row.
SELECT COUNT(*) AS paid_bookings_still_intact
FROM public.package_bookings WHERE payment_status = 'paid';

-- Compare this number to what you recorded BEFORE running. If it dropped, ROLLBACK immediately.

-- Happy? COMMIT;   Anything unexpected? ROLLBACK;
ROLLBACK;   -- <- deliberately the default. Change to COMMIT only once the counts check out.
*/


-- ── STEP 3 — re-point a dependent package at the keeper (only if step 1 said MANUAL) ──
-- Moves packages off a doomed duplicate onto the row you are keeping, so the duplicate becomes
-- dependency-free and step 2 can then remove it. Fill in both ids from step 1 and run inside a
-- transaction.
/*
BEGIN;
UPDATE public.packages
SET hotel_id = '<KEEPER_HOTEL_ID>'
WHERE hotel_id = '<DUPLICATE_HOTEL_ID>';
-- Re-run STEP 1: the duplicate should now show 'safe to delete'.
COMMIT;
*/


-- ── STEP 4 — full FK map of hotels (read-only). Run if you want to see the blast radius. ──
-- Everything that references hotels, directly or one hop away, and its delete rule.
-- The earlier version of this script only checked `rooms` and that is precisely how the
-- packages -> package_bookings cascade stayed invisible.
SELECT
  tc.table_name      AS child_table,
  kcu.column_name    AS child_column,
  ccu.table_name     AS parent_table,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
JOIN information_schema.key_column_usage kcu       ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name IN ('hotels', 'packages')   -- both hops of the cascade chain
ORDER BY ccu.table_name, tc.table_name;
