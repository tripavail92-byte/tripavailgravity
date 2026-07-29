-- ============================================================================
-- DELETE PRE-TODAY CONTENT — keep today's work (authorized 2026-07-29)
--
-- Decision: WIPE ALL HOTELS (every hotel predates today; the 4 unfinished
-- "Untitled Package" drafts and my auto Room-Only stays go with them). Tours:
-- delete everything posted before today, KEEP the 3 created today
-- (Margalla Mists, Mushkpuri's relaxing adventure, Chakwal's One day Adventure).
-- KEEP all 29 accounts, partner profiles, and config.
--
-- METHOD.
--  * Hotel side — TRUNCATE public.hotels CASCADE. Every hotel is going, so this
--    is the clean tool: Postgres computes the full FK closure (rooms, packages,
--    package_bookings, and everything hanging off them) and empties it atomically.
--  * Tour side — a SELECTIVE delete can't use TRUNCATE, so DELETE ... WHERE
--    created_at < cutoff. Verified every tour-child FK (schedules, bookings,
--    media, pickups, reviews, replies, finance ledgers, commission entries) is
--    ON DELETE CASCADE, so deleting the old tour row removes its whole subtree.
--
-- CUTOFF = 2026-07-29 00:00 Asia/Karachi. Whole thing is one transaction: if
-- anything is off, ROLLBACK and nothing happened.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — PREVIEW (read-only).
-- ──────────────────────────────────────────────────────────────────────────

-- 0a — every table the hotel-side TRUNCATE will empty (the FK closure).
WITH RECURSIVE closure AS (
  SELECT 'public.hotels'::regclass AS tbl
  UNION
  SELECT con.conrelid::regclass
  FROM pg_constraint con
  JOIN closure c ON con.confrelid = c.tbl
  WHERE con.contype = 'f'
)
SELECT DISTINCT tbl::text AS hotel_side_will_be_emptied
FROM closure
ORDER BY 1;

-- 0b — tours: how many go, how many stay, and which stay.
WITH cutoff AS (SELECT (timestamp '2026-07-29 00:00:00' AT TIME ZONE 'Asia/Karachi') AS ts)
SELECT
  count(*) FILTER (WHERE created_at <  (SELECT ts FROM cutoff)) AS tours_to_delete,
  count(*) FILTER (WHERE created_at >= (SELECT ts FROM cutoff)) AS tours_to_keep
FROM public.tours;

WITH cutoff AS (SELECT (timestamp '2026-07-29 00:00:00' AT TIME ZONE 'Asia/Karachi') AS ts)
SELECT title, (created_at AT TIME ZONE 'Asia/Karachi')::text AS created_pkt
FROM public.tours
WHERE created_at >= (SELECT ts FROM cutoff)
ORDER BY created_at;   -- expect the 3 new tours


BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — Hotel side: wipe everything. Watch the NOTICE lines for the cascade.
-- ──────────────────────────────────────────────────────────────────────────
TRUNCATE public.hotels CASCADE;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2 — Tour side: delete pre-today, keep today's 3.
-- ──────────────────────────────────────────────────────────────────────────
DELETE FROM public.tours
WHERE created_at < (timestamp '2026-07-29 00:00:00' AT TIME ZONE 'Asia/Karachi');

-- ──────────────────────────────────────────────────────────────────────────
-- SANITY — read before COMMIT.
-- ──────────────────────────────────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM public.hotels)           AS hotels,             -- 0
  (SELECT count(*) FROM public.rooms)            AS rooms,              -- 0
  (SELECT count(*) FROM public.packages)         AS packages,           -- 0
  (SELECT count(*) FROM public.package_bookings) AS package_bookings,   -- 0
  (SELECT count(*) FROM public.tours)            AS tours_kept,         -- 3
  (SELECT count(*) FROM public.tour_bookings)    AS tour_bookings_left, -- only for kept tours
  (SELECT count(*) FROM auth.users)              AS accounts_kept;      -- unchanged

COMMIT;
-- ROLLBACK;  -- swap for COMMIT if tours_kept <> 3, any content count <> 0,
--               accounts dropped, or a NOTICE named a table you wanted to keep.


-- ──────────────────────────────────────────────────────────────────────────
-- VERIFY FROM OUTSIDE — packages gone, the 3 new tours remain.
-- ──────────────────────────────────────────────────────────────────────────
SELECT count(*) AS live_packages
FROM public.search_listings_unified(p_types := ARRAY['package'], p_limit := 50);   -- 0

SELECT title
FROM public.search_listings_unified(p_types := ARRAY['tour'], p_limit := 50)
ORDER BY title;   -- the 3 new tours (those that are is_active/published show here)
