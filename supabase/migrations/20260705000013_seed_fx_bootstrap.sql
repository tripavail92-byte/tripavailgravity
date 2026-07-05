-- ============================================================================
-- Phase 1 · Bootstrap FX cross-rates (so multi-currency DISPLAY works)
-- Date: 2026-07-05
--
-- Seeds approximate cross-rates among the active currencies for today's date, so
-- the traveller-facing currency switcher can show e.g. "≈ AED 1,200" while a
-- listing is priced in PKR. These are STATIC LAUNCH values — a daily FX job should
-- replace them. Charges/settlement always happen in the listing's OWN currency
-- (Stripe), so these rates only ever power a browsing-time DISPLAY estimate.
--
-- Idempotent: recomputes today's pairs on re-run.
-- ============================================================================

WITH usd_per(code, per) AS (
  VALUES
    ('USD', 1.0::numeric),
    ('PKR', 278.0),
    ('AED', 3.67),
    ('SAR', 3.75),
    ('EUR', 0.92),
    ('GBP', 0.79)
)
INSERT INTO public.fx_rates (base, quote, rate, as_of)
SELECT a.code, b.code, (b.per / a.per)::numeric(18, 8), CURRENT_DATE
FROM usd_per a
CROSS JOIN usd_per b
WHERE a.code <> b.code
ON CONFLICT (base, quote, as_of) DO UPDATE SET rate = EXCLUDED.rate;
