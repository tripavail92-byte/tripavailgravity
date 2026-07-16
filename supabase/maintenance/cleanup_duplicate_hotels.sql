-- =====================================================================
-- CLEANUP: duplicate hotels created by the publish bug.
--
-- CAUSE: ListHotelPage never passed onComplete, so publishing succeeded but the wizard just sat
-- there with a re-enabled button. Managers clicked Publish again — and hotelService.publishListing
-- ran a plain INSERT each time, creating a whole new hotel + its rooms per click. Fixed in the
-- client; this cleans up what the bug already produced.
--
-- STRATEGY: group by (owner_id, name) and keep the OLDEST row (the first publish, most likely to
-- be the one referenced elsewhere), delete the rest. Rooms cascade if the FK is ON DELETE CASCADE;
-- step 3 checks that before you commit.
--
-- RUN STEP 1 FIRST. Only run step 2 once you've read it.
-- =====================================================================


-- ── STEP 1 — PREVIEW (read-only) ────────────────────────────────────────────
-- Every duplicate group, with the keeper and the victims.
WITH ranked AS (
  SELECT
    h.id,
    h.owner_id,
    h.name,
    h.is_published,
    h.created_at,
    COUNT(*)      OVER (PARTITION BY h.owner_id, LOWER(TRIM(h.name))) AS copies,
    ROW_NUMBER()  OVER (PARTITION BY h.owner_id, LOWER(TRIM(h.name))
                        ORDER BY h.created_at, h.id)                  AS rn
  FROM public.hotels h
)
SELECT
  CASE WHEN rn = 1 THEN 'KEEP (oldest)' ELSE 'DELETE (duplicate #' || rn || ')' END AS action,
  copies AS copies_of_this_name,
  id,
  owner_id,
  name,
  is_published,
  created_at,
  (SELECT COUNT(*) FROM public.rooms r WHERE r.hotel_id = ranked.id) AS room_rows
FROM ranked
WHERE copies > 1
ORDER BY owner_id, LOWER(TRIM(name)), rn;

-- Sanity: how many rows would go?
-- SELECT COUNT(*) FROM (…the CTE above…) WHERE copies > 1 AND rn > 1;


-- ── STEP 2 — DELETE THE DUPLICATES (DESTRUCTIVE) ────────────────────────────
-- Run ONLY after reviewing step 1. Wrapped in a transaction: check, then COMMIT or ROLLBACK.
--
-- ⚠️ Check FIRST whether two DIFFERENT hotels legitimately share a name under one owner
-- (e.g. two branches both called "City Inn"). If so, narrow the partition — add city/address —
-- before running this, or you will delete a real listing.
/*
BEGIN;

-- If rooms.hotel_id is NOT ON DELETE CASCADE, uncomment to clear children first:
-- DELETE FROM public.rooms r
--  USING (
--    SELECT id FROM (
--      SELECT h.id, ROW_NUMBER() OVER (PARTITION BY h.owner_id, LOWER(TRIM(h.name))
--                                      ORDER BY h.created_at, h.id) AS rn
--      FROM public.hotels h
--    ) x WHERE x.rn > 1
--  ) dup
--  WHERE r.hotel_id = dup.id;

DELETE FROM public.hotels
WHERE id IN (
  SELECT id FROM (
    SELECT
      h.id,
      ROW_NUMBER() OVER (PARTITION BY h.owner_id, LOWER(TRIM(h.name))
                         ORDER BY h.created_at, h.id) AS rn
    FROM public.hotels h
  ) x
  WHERE x.rn > 1        -- keep rn = 1 (the oldest), drop every later copy
);

-- Verify: expect zero rows.
WITH ranked AS (
  SELECT COUNT(*) OVER (PARTITION BY owner_id, LOWER(TRIM(name))) AS copies
  FROM public.hotels
)
SELECT COUNT(*) AS remaining_duplicate_rows FROM ranked WHERE copies > 1;

-- Happy? COMMIT;   Not happy? ROLLBACK;
COMMIT;
*/


-- ── STEP 3 — check the rooms FK before step 2 (read-only) ───────────────────
-- If delete_rule is CASCADE, deleting a hotel removes its rooms automatically.
-- If it is NO ACTION / RESTRICT, uncomment the rooms delete inside step 2.
SELECT
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name   = 'rooms'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'hotel_id';
