-- ============================================================================
-- hotels.currency — one currency per listing
--
-- The listing wizard picked a currency PER ROOM. Nothing converted it (correct — a partner's price
-- should be stored exactly as they type it), but it meant two rooms in the same property could
-- disagree, and hotelService computed the listing's "from" price with
--
--     Math.min(...rooms.map(r => r.pricing.basePrice))
--
-- across mixed currencies. A 120,000 PKR room and a 400 USD room were compared as bare numbers, so
-- the PKR room "won" and the property advertised a from-price of 400 while actually being the
-- dearer of the two. Guests browsing saw a number with no reliable unit behind it.
--
-- The wizard now sets the currency once on the property details step. This column is where it
-- lands, so the value survives independently of the rooms.
--
-- NOT NULL DEFAULT 'USD' rather than a backfill from the rooms: every existing row predates the
-- per-listing picker, so there is no single correct historical answer, and USD matches the wizard's
-- old per-room default ('USD' at RoomWizardModal, pre-change). Rows whose rooms were actually
-- priced in something else are listed below so they can be corrected deliberately rather than
-- guessed at here.
-- ============================================================================

BEGIN;

ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD'
    REFERENCES public.currencies(code);

COMMENT ON COLUMN public.hotels.currency IS
  'ISO-4217 currency for every room price on this listing. Amounts are stored as the partner typed them and are never converted at rest; conversion happens at display time from public.fx_rates.';

CREATE INDEX IF NOT EXISTS hotels_currency_idx ON public.hotels (currency);

COMMIT;

-- ============================================================================
-- AFTER APPLYING — find listings whose rooms disagree with the new default.
-- Read-only; run it and correct anything it returns by hand.
--
--   SELECT h.id,
--          h.name,
--          h.currency                    AS listing_currency,
--          array_agg(DISTINCT r.currency) AS room_currencies
--   FROM public.hotels h
--   JOIN public.rooms r ON r.hotel_id = h.id
--   WHERE r.currency IS NOT NULL
--   GROUP BY h.id, h.name, h.currency
--   HAVING count(DISTINCT r.currency) > 1
--       OR min(r.currency) <> h.currency;
--
-- For a listing that is genuinely priced in one non-USD currency, align it with:
--
--   UPDATE public.hotels h
--   SET currency = sub.only_currency
--   FROM (
--     SELECT hotel_id, min(currency) AS only_currency
--     FROM public.rooms
--     WHERE currency IS NOT NULL
--     GROUP BY hotel_id
--     HAVING count(DISTINCT currency) = 1
--   ) sub
--   WHERE h.id = sub.hotel_id
--     AND h.currency <> sub.only_currency;
--
-- Listings whose rooms use SEVERAL currencies need a human decision — there is no safe automatic
-- answer, since picking one silently restates every other room's price.
-- ============================================================================
