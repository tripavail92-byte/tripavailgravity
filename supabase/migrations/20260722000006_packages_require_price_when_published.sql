-- ============================================================================
-- Packages: cannot be published without a price
--
-- REPORTED SYMPTOM: /packages/... shows "Price on request" with a live CONFIRM BOOKING button.
-- Clicking it raises
--
--     P0001: Package has no base price set
--
-- from create_package_booking_atomic (20260326000013:34), because packages.base_price_per_night is
-- NULL.
--
-- HOW A NULL EVER SHIPPED. Two independent failures:
--   * The publish wizard collects a per-room `packagePrice` and stores it in room_configuration,
--     but never writes base_price_per_night — the field is declared on the type
--     (packages/web/src/features/package-creation/types/index.ts:66) and never assigned.
--     publishPackage therefore inserts `base_price_per_night: packageData.basePricePerNight ||
--     null` (packageService.ts:151), which is NULL for every listing the wizard produced.
--   * The schema does not forbid it. 20260210000004:9 added the column as
--     NUMERIC(10,2) CHECK (base_price_per_night >= 0) — nullable, not `NOT NULL`. A CHECK on a
--     nullable column treats NULL as UNKNOWN, so NULL passes.
--
-- LIVE IMPACT MEASURED FROM PRODUCTION on 2026-07-22: 5 of 16 published packages carry a NULL price
-- (31%). Every one of them offered a Confirm Booking button that could only fail.
--
-- THE GUARD BELOW: a partial CHECK that fires only when a row is `is_published = true`. Existing
-- drafts and unpublished rows are untouched; nobody is retroactively locked out of anything. Adding
-- a plain `NOT NULL` would break drafts saved with no price yet, which is the point of a draft.
--
-- The client is fixed separately: the booking button no longer renders when the price is missing,
-- and handleRequestToBook returns a readable message. That was the immediate blast-radius fix; this
-- migration is the defence in depth that stops the whole class from recurring.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — PREVIEW. Read the row list before doing anything.
-- ──────────────────────────────────────────────────────────────────────────

SELECT p.id, p.name, p.owner_id, p.currency, p.is_published
FROM public.packages p
WHERE p.is_published = TRUE
  AND (p.base_price_per_night IS NULL OR p.base_price_per_night = 0)
ORDER BY p.created_at DESC;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — Take the priceless rows offline. Idempotent; each row is only touched if it still fits
-- the "published without a price" shape. The traveller's Confirm Booking would call the atomic
-- booking RPC against these rows and be rejected with P0001; unpublishing removes that failure
-- from search and the details page in the same statement.
-- ──────────────────────────────────────────────────────────────────────────

BEGIN;

UPDATE public.packages
SET is_published = FALSE,
    updated_at   = NOW()
WHERE is_published = TRUE
  AND (base_price_per_night IS NULL OR base_price_per_night = 0);

-- Must read 0 before commit. If not, the guard below will still reject the transaction, so this
-- is here as an early sanity check rather than the real gate.
SELECT count(*) AS priceless_still_published
FROM public.packages
WHERE is_published = TRUE
  AND (base_price_per_night IS NULL OR base_price_per_night = 0);

COMMIT;


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2 — Add the guard. A published package must carry a positive base price. Partial rather
-- than NOT NULL, because drafts must still be storable with no price yet.
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE public.packages
  ADD CONSTRAINT packages_published_requires_price
  CHECK (is_published = FALSE OR base_price_per_night IS NOT NULL AND base_price_per_night > 0);


-- ──────────────────────────────────────────────────────────────────────────
-- AFTERWARDS
--
-- If any operator complains that their listing "disappeared", they are one of the five above. The
-- ask is to set a price in the wizard's pricing step and republish. Once the client code is
-- deployed alongside this migration (packageService.ts writing basePricePerNight from the pricing
-- step), that path will actually persist.
--
-- Verify from outside as a visitor would see it:
--   POST /rest/v1/rpc/search_listings_unified {"p_types":["package"], "p_limit":50}
-- and confirm no package advertises a card with no price.
-- ============================================================================
