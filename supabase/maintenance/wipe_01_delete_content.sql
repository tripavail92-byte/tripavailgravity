-- ============================================================================
-- CLEAN SLATE — wipe all marketplace content, keep accounts + config
--
-- AUTHORIZED 2026-07-29: all 29 content-owning accounts confirmed as team/test
-- (the team lists across many personal Gmail accounts). No recovery required.
--
-- WIPES: every listing and every trace of activity —
--   hotels, rooms, packages, tours, package_bookings, tour_bookings, and
--   everything that hangs off them (schedules, pickups, media, reviews,
--   wishlists, booking conversations/messages) via the FK cascade.
--
-- KEEPS: all auth.users (the 29 accounts), their partner profiles
--   (tour_operator_profiles / hotel_manager_profiles — so a re-list needs no
--   re-setup), and config (currencies, fx_rates, tiers, admin_users, roles).
--   None of those are downstream of hotels/tours, so the cascade never reaches
--   them.
--
-- METHOD: TRUNCATE ... CASCADE. Postgres computes the full dependency closure
-- itself and empties it in one atomic statement — no hand-ordered DELETE to get
-- wrong. Run inside the transaction below: it prints a NOTICE naming every table
-- it cascades into, and ROLLBACK undoes everything. Read the notices + the
-- after-counts, THEN choose COMMIT or ROLLBACK.
--
-- Not reachable from hotels/tours, so they SURVIVE (per-user, not per-listing):
-- notifications, user_payment_methods, kyc_sessions/kyc_documents. Say the word
-- and I'll add a step to clear those too; left alone here on purpose.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — PREVIEW (read-only). Two things: the exact set of tables that will
-- be emptied (the cascade closure), and the current row counts going in.
-- ──────────────────────────────────────────────────────────────────────────

-- 0a — every table TRUNCATE will empty (seeds + everything referencing them).
WITH RECURSIVE seeds(tbl) AS (
  VALUES ('public.hotels'::regclass), ('public.rooms'::regclass),
         ('public.packages'::regclass), ('public.package_bookings'::regclass),
         ('public.tours'::regclass), ('public.tour_bookings'::regclass)
),
closure AS (
  SELECT tbl FROM seeds
  UNION
  SELECT con.conrelid::regclass
  FROM pg_constraint con
  JOIN closure c ON con.confrelid = c.tbl
  WHERE con.contype = 'f'
)
SELECT DISTINCT tbl::text AS will_be_emptied
FROM closure
ORDER BY 1;

-- 0b — the "before" counts.
SELECT
  (SELECT count(*) FROM public.hotels)           AS hotels,
  (SELECT count(*) FROM public.rooms)            AS rooms,
  (SELECT count(*) FROM public.packages)         AS packages,
  (SELECT count(*) FROM public.tours)            AS tours,
  (SELECT count(*) FROM public.package_bookings) AS package_bookings,
  (SELECT count(*) FROM public.tour_bookings)    AS tour_bookings,
  (SELECT count(*) FROM auth.users)              AS accounts_kept;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — The wipe. Watch the NOTICE lines: each names a table the cascade
-- emptied. That is the live cascade map.
-- ──────────────────────────────────────────────────────────────────────────

BEGIN;

TRUNCATE
  public.hotels,
  public.rooms,
  public.packages,
  public.package_bookings,
  public.tours,
  public.tour_bookings
CASCADE;

-- ──────────────────────────────────────────────────────────────────────────
-- SANITY — content all zero, accounts untouched. Read before COMMIT.
-- ──────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM public.hotels)           AS hotels,           -- 0
  (SELECT count(*) FROM public.rooms)            AS rooms,            -- 0
  (SELECT count(*) FROM public.packages)         AS packages,         -- 0
  (SELECT count(*) FROM public.tours)            AS tours,            -- 0
  (SELECT count(*) FROM public.package_bookings) AS package_bookings, -- 0
  (SELECT count(*) FROM public.tour_bookings)    AS tour_bookings,    -- 0
  (SELECT count(*) FROM auth.users)              AS accounts_kept,    -- unchanged
  (SELECT count(*) FROM public.currencies)       AS currencies_kept;  -- unchanged

COMMIT;
-- ROLLBACK;  -- swap for COMMIT if a NOTICE named a table you wanted to keep,
--               or any content count above is not 0, or accounts_kept dropped.


-- ──────────────────────────────────────────────────────────────────────────
-- VERIFY FROM OUTSIDE — the shelf is empty. Both calls return 0 rows.
-- ──────────────────────────────────────────────────────────────────────────

SELECT count(*) AS live_packages
FROM public.search_listings_unified(p_types := ARRAY['package'], p_limit := 50);

SELECT count(*) AS live_tours
FROM public.search_listings_unified(p_types := ARRAY['tour'], p_limit := 50);
