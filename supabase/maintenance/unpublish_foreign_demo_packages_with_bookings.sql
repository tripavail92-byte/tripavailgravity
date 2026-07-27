-- ============================================================================
-- Unpublish the 5 remaining foreign demo packages (booking-guard override)
--
-- Follow-up to unpublish_foreign_demo_packages.sql. That file's `NOT EXISTS` guard on
-- package_bookings held these 5 back — it was designed as a "don't silently withdraw a package a
-- real traveller booked" safety net. The bookings here are seed / pre-launch data (no real
-- traveller relationship), so the safety net is not doing useful work and the demos should come
-- down like the other 10 did.
--
-- WHAT THIS DOES NOT DO. is_published flips to FALSE. That's it. The rows in package_bookings are
-- not touched — no FK cascade fires, no traveller record is altered, no notification is sent.
-- Anyone who ever booked one of these keeps their booking record intact and, if it was ever
-- confirmed, their stay. The listing simply stops appearing in search and on the storefront.
--
-- WHY BY NAME, not id. The ids in production drift between environments; the names are stable and
-- unambiguous. is_published=TRUE keeps a re-run a no-op.
--
-- MEASURED AGAINST PRODUCTION on the browser's anon REST call right before this file was written:
-- these 5 names ARE the exact residual set from the prior run. Live count sits at 9, should land at
-- 4 after this commits. The 4 that remain are real user listings, not seeds:
--   Kids & Family Special (×2 — two distinct rows share the name)
--   Romance & Roses Package
--   Weekend Bliss Retreat
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — Preview. What's about to change and what bookings sit under it.
-- ──────────────────────────────────────────────────────────────────────────

SELECT
  p.id,
  p.name,
  p.owner_id,
  p.created_at,
  (SELECT count(*) FROM public.package_bookings b WHERE b.package_id = p.id) AS bookings
FROM public.packages p
WHERE p.is_published = TRUE
  AND p.name IN (
    'Alpine Ski & Wellness Retreat',
    'Bali Wellness & Culture Journey',
    'Coastal New Arrival',
    'Family Sea & Sun',
    'Maldives Honeymoon Paradise'
  )
ORDER BY name;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — Unpublish. No booking guard this time — that was the point of the
-- decision above. Wrapped in a transaction so the sanity check can gate COMMIT.
-- ──────────────────────────────────────────────────────────────────────────

BEGIN;

UPDATE public.packages p
SET is_published = FALSE,
    updated_at   = NOW()
WHERE p.is_published = TRUE
  AND p.name IN (
    'Alpine Ski & Wellness Retreat',
    'Bali Wellness & Culture Journey',
    'Coastal New Arrival',
    'Family Sea & Sun',
    'Maldives Honeymoon Paradise'
  );

-- Sanity check. Read the numbers and only then decide COMMIT vs ROLLBACK.
SELECT
  (SELECT count(*) FROM public.packages
     WHERE is_published = TRUE AND name IN (
       'Alpine Ski & Wellness Retreat','Bali Wellness & Culture Journey',
       'Coastal New Arrival','Family Sea & Sun','Maldives Honeymoon Paradise'
     )
  ) AS foreign_demos_still_published,   -- expect 0
  (SELECT count(*) FROM public.packages
     WHERE is_published = TRUE
  ) AS live_packages_after,             -- expect 4
  (SELECT count(*) FROM public.package_bookings
     WHERE package_id IN (
       SELECT id FROM public.packages WHERE name IN (
         'Alpine Ski & Wellness Retreat','Bali Wellness & Culture Journey',
         'Coastal New Arrival','Family Sea & Sun','Maldives Honeymoon Paradise'
       )
     )
  ) AS bookings_preserved;              -- expect: same as before, no rows removed

COMMIT;
-- ROLLBACK;  -- swap for COMMIT above if any of the counts look wrong


-- ──────────────────────────────────────────────────────────────────────────
-- Verify from OUTSIDE — same call the site makes:
--
--   POST /rest/v1/rpc/search_listings_unified {"p_types":["package"], "p_limit":50}
--
-- Every one of the 5 must be absent from the response. If any reappear later the fresh-seed
-- script reintroduced them and needs pruning at its source, not here.
-- ============================================================================
