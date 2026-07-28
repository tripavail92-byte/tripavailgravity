-- ============================================================================
-- Phase 0c — fix hotels whose currency contradicts their own rooms
--
-- WHY THIS BLOCKS PHASE 1. The plan was to generate a default "Room only" stay from
-- hotels.base_price_per_night + hotels.currency. Checked against production first, and that
-- would have published these:
--
--   salman inn           USD 120,000/night  →  price_base  PKR 33,343,091
--   Horizon Guest House  USD  14,997/night  →  price_base  PKR  4,167,053
--   khayam inn           GBP  10,000/night  →  price_base  PKR  3,695,392
--
-- (price_base is what 20260722000005 sorts and filters on, at today's rates:
--  USD 277.86, GBP 369.54.) Those listings would blow out every price filter and pin
-- themselves to the extremes of every sort.
--
-- THE TELL. The hotel row disagrees with its OWN rooms:
--
--   Horizon Guest House   hotels.currency = USD   rooms.currency = PKR   (both 14,997)
--   salman inn            hotels.currency = USD   rooms.currency = PKR   (both 120,000)
--
-- The amounts are identical; only the currency label differs. PKR 14,997 is about USD 54, which
-- is a real Lahore guest-house rate; USD 14,997 is not. The room-level value is the one a partner
-- typed per room, while hotels.currency is a wizard dropdown that defaults to USD. The rooms are
-- the trustworthy side.
--
-- THE RULE APPLIED BELOW, stated so it can be checked rather than trusted:
--   Update hotels.currency to the rooms' currency ONLY where
--     (a) the hotel has at least one room, AND
--     (b) every room on that hotel agrees on a single currency, AND
--     (c) that currency differs from the hotel's.
-- No amount is ever changed — only the label. A hotel whose rooms disagree with each other is
-- left alone, because there is no single answer to move it to.
--
-- NOT FIXED HERE — needs a human call, listed in STEP 2 below.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────
-- STEP 0 — Preview. Every hotel whose currency contradicts its rooms.
-- ──────────────────────────────────────────────────────────────────────────

WITH room_cur AS (
  SELECT r.hotel_id,
         min(r.currency) AS room_currency,
         count(DISTINCT r.currency) AS distinct_currencies,
         count(*) AS room_count,
         min(r.price_override) AS cheapest_room_price
  FROM public.rooms r
  WHERE r.currency IS NOT NULL
  GROUP BY r.hotel_id
)
SELECT
  h.id,
  h.name,
  h.location,
  h.currency            AS hotel_currency,
  rc.room_currency,
  rc.distinct_currencies,
  h.base_price_per_night,
  rc.cheapest_room_price,
  CASE
    WHEN rc.distinct_currencies > 1 THEN 'SKIP — rooms disagree with each other'
    WHEN h.currency IS DISTINCT FROM rc.room_currency THEN 'WILL FIX'
    ELSE 'ok'
  END AS verdict
FROM public.hotels h
JOIN room_cur rc ON rc.hotel_id = h.id
WHERE h.is_published = TRUE
ORDER BY verdict, h.name;


BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1 — Align the hotel label to its rooms. Amounts are never touched.
-- ──────────────────────────────────────────────────────────────────────────

WITH room_cur AS (
  SELECT r.hotel_id,
         min(r.currency) AS room_currency,
         count(DISTINCT r.currency) AS distinct_currencies
  FROM public.rooms r
  WHERE r.currency IS NOT NULL
  GROUP BY r.hotel_id
)
UPDATE public.hotels h
SET currency   = rc.room_currency,
    updated_at = NOW()
FROM room_cur rc
WHERE rc.hotel_id = h.id
  AND rc.distinct_currencies = 1                      -- rooms speak with one voice
  AND h.currency IS DISTINCT FROM rc.room_currency;   -- and the hotel disagrees with them

-- Expect 2 rows: Horizon Guest House and salman inn, both USD → PKR.


-- ──────────────────────────────────────────────────────────────────────────
-- SANITY CHECK
-- ──────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM public.hotels h
     JOIN (SELECT hotel_id, min(currency) c, count(DISTINCT currency) n
             FROM public.rooms WHERE currency IS NOT NULL GROUP BY hotel_id) rc
       ON rc.hotel_id = h.id
    WHERE h.is_published AND rc.n = 1 AND h.currency IS DISTINCT FROM rc.c)
                                                            AS contradictions_remaining,  -- expect 0
  (SELECT count(*) FROM public.hotels
    WHERE is_published
      AND COALESCE(base_price_per_night, 0) * COALESCE(
            (SELECT rate FROM public.fx_rates f
              WHERE f.base = hotels.currency AND f.quote = 'PKR' AND f.as_of <= CURRENT_DATE
              ORDER BY f.as_of DESC LIMIT 1), 1) > 2000000)
                                                            AS implausible_pkr_over_2m;   -- expect 1

-- implausible_pkr_over_2m should fall from 3 to 1. The survivor is khayam inn — see STEP 2.

COMMIT;
-- ROLLBACK;  -- swap for COMMIT above if either number is off


-- ============================================================================
-- STEP 2 — NOT fixed above. Your call, because the data cannot settle them.
--
-- (a) khayam inn — hotels.currency = GBP AND rooms.currency = GBP, amount 10,000.
--     Both sides agree, so the rule above correctly leaves it alone. But GBP 10,000/night
--     (PKR 3.7m) in Islamabad is not a real rate, and PKR 10,000 (about USD 36) is an
--     entirely ordinary one. Almost certainly GBP was picked in the dropdown by mistake on
--     both the hotel and its room. To correct BOTH sides, uncomment:
--
--     -- UPDATE public.rooms  SET currency = 'PKR'
--     --  WHERE hotel_id = (SELECT id FROM public.hotels WHERE name = 'khayam inn' LIMIT 1);
--     -- UPDATE public.hotels SET currency = 'PKR', updated_at = NOW()
--     --  WHERE name = 'khayam inn';
--
-- (b) The USD-100 group — lasdana inn, KA Lodges, Pine & Peak, Naeelah hostel all sit at
--     exactly USD 100 with rooms agreeing. That is either four real $100 rates or an untouched
--     wizard default. PKR 27,786/night is plausible for Islamabad, so nothing here is broken
--     enough to auto-correct — but "Naeelah hostel" charging USD 100 a night is worth a look,
--     since a hostel bed at that price is unusual.
--
-- (c) the marriot — USD 125 for a Presidential Suite in Islamabad is plausible as stated.
--     Left alone deliberately.
--
-- PHASE 1 DOES NOT DEPEND ON (a), (b) OR (c). The default-stay generator reads price and
-- currency from the cheapest ROOM rather than from hotels.base_price_per_night, so it inherits
-- whatever the rooms say and never re-derives a bad hotel-level label. Fixing khayam inn's rooms
-- fixes its generated stay automatically.
-- ============================================================================
