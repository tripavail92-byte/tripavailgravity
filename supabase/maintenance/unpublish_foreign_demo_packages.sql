-- ============================================================================
-- Unpublish the 10 foreign demo packages
--
-- Section B of remove_fabricated_ratings_and_demo_listings.sql, extracted into a self-contained
-- file so the whole block is runnable rather than needing partial uncommenting.
--
-- MEASURED AGAINST PRODUCTION on the browser's public search RPC just before this file was
-- written: exactly 10 published packages match, out of 14 live, so this leaves 4 real listings.
-- Names re-verified against the live set — every entry below IS present.
--
-- These are packages for destinations TripAvail does not serve (Bali, Maldives, Paris, Santorini,
-- an Alpine resort, and generic "Family Sea & Sun" / "Coastal New Arrival" seaside stays). They
-- are seed data from before the platform's Pakistan-first scope was set, and every one of them was
-- carrying a fabricated rating and review count until Section A zeroed those out earlier today.
--
-- Matching by NAME rather than id: the ids in production drift between environments and the
-- fabricated names are stable and unambiguous. Guarded by is_published=TRUE so a re-run is a no-op,
-- and by "no booking exists" so a demo that ever received a real booking is left alone as a
-- support case, not silently withdrawn. Nothing is deleted; is_published flips to FALSE and the
-- row is still resumable through the dashboard if anyone claims it as real.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — Preview. Read this before committing.
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


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — Unpublish. Wrapped in a transaction with an inline sanity check
-- so the COMMIT only happens when the row count matches expectation.
-- ──────────────────────────────────────────────────────────────────────────

BEGIN;

UPDATE public.packages p
SET is_published = FALSE,
    updated_at   = NOW()
WHERE p.is_published = TRUE
  AND p.name IN (
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
  -- A demo listing with a real booking against it is a support problem, not a cleanup target.
  AND NOT EXISTS (
    SELECT 1 FROM public.package_bookings b WHERE b.package_id = p.id
  );

-- Two counts that make the row-count math visible before committing.
SELECT
  (SELECT count(*) FROM public.packages
     WHERE is_published = TRUE AND name IN (
       'Coastal New Arrival','Family Sea & Sun','Santorini Weekend Getaway',
       'Couples Sunset Retreat','Family Island Escape','Weekend Luxe Reset',
       'Romance in Paris','Bali Wellness & Culture Journey',
       'Maldives Honeymoon Paradise','Alpine Ski & Wellness Retreat'
     )
  ) AS foreign_demos_still_published,
  (SELECT count(*) FROM public.packages
     WHERE is_published = TRUE
  ) AS live_packages_after;

-- Expect: foreign_demos_still_published = 0 (unless one had a booking, in which case investigate
-- and re-run this file without that name). live_packages_after should drop from 14 → 4.

COMMIT;
-- ROLLBACK;  -- swap for COMMIT above if the counts don't match


-- ──────────────────────────────────────────────────────────────────────────
-- Verify from OUTSIDE — same call the site makes:
--
--   POST /rest/v1/rpc/search_listings_unified {"p_types":["package"], "p_limit":50}
--
-- Foreign demos must be absent from the response. If any reappear later, the fresh-seed script
-- reintroduced them and needs pruning at its source, not here.
-- ============================================================================
