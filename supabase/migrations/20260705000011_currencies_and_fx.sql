-- ============================================================================
-- Phase 0 · Layer 2 — Currency reference + FX rates
-- Date: 2026-07-05
--
-- Fixes the "multi-currency by schema, single-currency by convention" mess:
--  • A canonical `currencies` table (with minor_unit — fixes the Stripe *100
--    assumption for zero/three-decimal currencies).
--  • An `fx_rates` table for daily conversion. Base reporting currency = PKR
--    (per product decision); a scheduled job populates real cross-rates.
--  • Groundwork for Blocker 2: a `currency` column on the operator commercial
--    profile so payouts/commission can eventually be currency-aware.
--
-- Additive + idempotent. NOTE: we deliberately do NOT add FK constraints from the
-- existing tours/rooms/packages.currency columns to currencies(code) yet — legacy
-- rows may hold unlisted/typo values; that enforcement is a post-cleanup follow-up.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.currencies (
  code       text PRIMARY KEY,            -- ISO-4217, e.g. 'PKR','USD','AED'
  symbol     text NOT NULL,
  name       text NOT NULL,
  minor_unit int  NOT NULL DEFAULT 2,     -- decimal places for amounts / Stripe smallest unit
  is_active  boolean NOT NULL DEFAULT true
);

INSERT INTO public.currencies (code, symbol, name, minor_unit) VALUES
  ('PKR', '₨',   'Pakistani Rupee', 2),
  ('USD', '$',   'US Dollar',       2),
  ('AED', 'د.إ', 'UAE Dirham',      2),
  ('SAR', '﷼',   'Saudi Riyal',     2),
  ('EUR', '€',   'Euro',            2),
  ('GBP', '£',   'British Pound',   2)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.fx_rates (
  base   text NOT NULL REFERENCES public.currencies(code),
  quote  text NOT NULL REFERENCES public.currencies(code),
  rate   numeric(18,8) NOT NULL,          -- 1 unit of base = `rate` units of quote
  as_of  date NOT NULL,
  PRIMARY KEY (base, quote, as_of)
);
CREATE INDEX IF NOT EXISTS idx_fx_rates_quote_asof ON public.fx_rates (quote, as_of);

-- Seed identity rates for today so conversion never divides by a missing row.
INSERT INTO public.fx_rates (base, quote, rate, as_of)
SELECT c.code, c.code, 1, CURRENT_DATE FROM public.currencies c
ON CONFLICT DO NOTHING;

-- RLS: public read of active reference data; admin write.
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rates   ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='currencies' AND policyname='currencies_public_read') THEN
    CREATE POLICY currencies_public_read ON public.currencies FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='currencies' AND policyname='currencies_admin_write') THEN
    CREATE POLICY currencies_admin_write ON public.currencies FOR ALL
      USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fx_rates' AND policyname='fx_rates_public_read') THEN
    CREATE POLICY fx_rates_public_read ON public.fx_rates FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fx_rates' AND policyname='fx_rates_admin_write') THEN
    CREATE POLICY fx_rates_admin_write ON public.fx_rates FOR ALL
      USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Blocker-2 groundwork: give the operator commercial profile a currency
-- (defaults to the base 'PKR'; no FK yet, to avoid failing on legacy rows).
ALTER TABLE public.operator_commercial_profiles
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'PKR';

-- Helper: convert an amount between currencies using the most recent rate on/before a date.
CREATE OR REPLACE FUNCTION public.fx_convert(p_amount numeric, p_from text, p_to text, p_as_of date DEFAULT CURRENT_DATE)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_from = p_to THEN p_amount
    ELSE p_amount * (
      SELECT rate FROM public.fx_rates
      WHERE base = p_from AND quote = p_to AND as_of <= p_as_of
      ORDER BY as_of DESC LIMIT 1
    )
  END;
$$;
