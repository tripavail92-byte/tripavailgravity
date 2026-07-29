-- ============================================================================
-- Unpublish duplicate published packages — same hotel, same name, live twice
--
-- Honeybee Inn's "Kids & Family Special" is published twice: two rows, identical
-- name, hotel, price and badge. A traveller sees the same stay listed twice, and
-- search returns it twice.
--
-- This keeps exactly ONE copy live per (hotel, name) and unpublishes the rest —
-- but only a copy that carries NO booking. The keeper is chosen as: the copy with
-- the most bookings, then the oldest. If a losing copy has a booking of its own it
-- is LEFT PUBLISHED (both stay live) rather than hide a listing someone booked
-- against — that is a support case, not a cleanup target. Same rule as phase 0.
--
-- Nothing is deleted. is_published flips to FALSE; the row stays recoverable from
-- the partner dashboard. No FK cascade fires because no row is removed.
--
-- The rule is stated generally (any hotel with two identically-named published
-- packages), but Honeybee Inn's pair is the only match in production today, so
-- that is all this touches.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — PREVIEW. Every published package that shares its (hotel, name) with
-- another. `action` shows what the transaction will do. Read before running.
-- ──────────────────────────────────────────────────────────────────────────

WITH ranked AS (
  SELECT
    p.id, p.name, p.hotel_id, p.slug, p.created_at, p.currency, p.base_price_per_night,
    (SELECT count(*) FROM public.package_bookings b WHERE b.package_id = p.id) AS bookings,
    count(*)     OVER (PARTITION BY p.hotel_id, lower(btrim(p.name)))            AS copies,
    row_number() OVER (PARTITION BY p.hotel_id, lower(btrim(p.name))
                       ORDER BY (SELECT count(*) FROM public.package_bookings b WHERE b.package_id = p.id) DESC,
                                p.created_at ASC, p.id ASC)                       AS rn
  FROM public.packages p
  WHERE p.is_published = TRUE
)
SELECT
  r.id, r.name, h.name AS hotel, r.created_at::date AS created, r.bookings,
  CASE
    WHEN r.rn = 1       THEN 'KEEP (primary)'
    WHEN r.bookings > 0 THEN 'KEEP (has bookings — resolve by hand)'
    ELSE                     'UNPUBLISH (duplicate)'
  END AS action
FROM ranked r
JOIN public.hotels h ON h.id = r.hotel_id
WHERE r.copies > 1
ORDER BY h.name, r.name, r.rn;


BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- Unpublish every non-primary copy that has no booking of its own.
-- ──────────────────────────────────────────────────────────────────────────

WITH ranked AS (
  SELECT
    p.id,
    (SELECT count(*) FROM public.package_bookings b WHERE b.package_id = p.id) AS bookings,
    row_number() OVER (PARTITION BY p.hotel_id, lower(btrim(p.name))
                       ORDER BY (SELECT count(*) FROM public.package_bookings b WHERE b.package_id = p.id) DESC,
                                p.created_at ASC, p.id ASC) AS rn
  FROM public.packages p
  WHERE p.is_published = TRUE
)
UPDATE public.packages p
SET is_published = FALSE,
    updated_at   = NOW()
FROM ranked r
WHERE r.id = p.id
  AND r.rn > 1          -- not the keeper
  AND r.bookings = 0;   -- and safe to hide


-- ──────────────────────────────────────────────────────────────────────────
-- SANITY — no (hotel, name) may have more than one published copy left, unless
-- every extra carries a booking (those are the support cases we deliberately keep).
-- ──────────────────────────────────────────────────────────────────────────

SELECT p.hotel_id, lower(btrim(p.name)) AS name_key, count(*) AS still_live
FROM public.packages p
WHERE p.is_published = TRUE
GROUP BY p.hotel_id, lower(btrim(p.name))
HAVING count(*) > 1;
-- Expect 0 rows. Any row here is a (hotel, name) whose duplicates all had bookings.

COMMIT;
-- ROLLBACK;  -- swap for COMMIT above if the preview or sanity looks wrong.


-- ──────────────────────────────────────────────────────────────────────────
-- VERIFY FROM OUTSIDE — the same call the site makes. "Kids & Family Special"
-- must now appear ONCE, not twice.
--
--   POST /rest/v1/rpc/search_listings_unified {"p_types":["package"],"p_limit":50}
-- ──────────────────────────────────────────────────────────────────────────

SELECT listing_type, title, subtitle, price, currency
FROM public.search_listings_unified(p_types := ARRAY['package'], p_limit := 50)
ORDER BY title;
