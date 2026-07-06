-- Phase 4a slice 2 — multi-currency commercial. Denominate a foreign operator's
-- membership tier / fee in their own currency (a UAE operator is billed in AED, not PKR).
--
-- Commission is a PERCENTAGE of the booking total, so it is already in the booking's
-- currency — NOT touched here. The only currency-specific amount is the monthly membership
-- fee (a subscription, not yet charged via Stripe), so this is low money-risk.
--
-- operator_commercial_profiles.currency was added in Phase 0 (default 'PKR'). The
-- commercial bootstrap trigger only fires on tour_operator_profiles INSERT, but country_code
-- is captured on a later onboarding UPDATE — so we add a dedicated country→currency sync.

-- ── Country → one of our supported currencies (PKR/USD/AED/SAR/EUR/GBP) ──────────
CREATE OR REPLACE FUNCTION public.commercial_currency_for_country(cc text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE upper(coalesce(cc, ''))
    WHEN 'PK' THEN 'PKR'
    WHEN ''   THEN 'PKR'   -- unknown / legacy → Pakistan
    WHEN 'AE' THEN 'AED'
    WHEN 'SA' THEN 'SAR'
    WHEN 'GB' THEN 'GBP'
    ELSE CASE
      WHEN upper(cc) IN ('DE','FR','ES','IT','NL','BE','AT','PT','GR','IE','FI','LU',
                         'SK','SI','EE','LV','LT','CY','MT','HR')
        THEN 'EUR'
      ELSE 'USD'   -- everything else settles in USD (a rate we hold)
    END
  END
$$;

-- ── Sync an operator's commercial currency + fee from their profile country ──────
CREATE OR REPLACE FUNCTION public.sync_operator_commercial_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_currency  text;
  v_tier_fee  numeric;
  v_converted numeric;
BEGIN
  -- Make sure the commercial profile exists (idempotent — returns the existing row).
  PERFORM public.provision_operator_commercial_profile(NEW.user_id);

  v_currency := public.commercial_currency_for_country(NEW.country_code);

  -- Canonical (PKR) monthly fee for the operator's current tier.
  SELECT t.monthly_fee
    INTO v_tier_fee
    FROM public.operator_commercial_profiles p
    JOIN public.commercial_membership_tiers t ON t.code = p.membership_tier_code
   WHERE p.operator_user_id = NEW.user_id;

  -- Convert the fee into the operator's currency, rounded to a clean number.
  v_converted := public.fx_convert(COALESCE(v_tier_fee, 0), 'PKR', v_currency);
  IF v_converted IS NOT NULL THEN
    v_converted := ROUND(v_converted / 10.0) * 10;
  END IF;

  UPDATE public.operator_commercial_profiles
     SET currency = v_currency,
         monthly_membership_fee = CASE
           WHEN v_currency = 'PKR'      THEN COALESCE(v_tier_fee, monthly_membership_fee)
           WHEN v_converted IS NOT NULL THEN v_converted
           ELSE monthly_membership_fee   -- no FX rate → leave as-is
         END,
         updated_at = TIMEZONE('UTC', NOW())
   WHERE operator_user_id = NEW.user_id
     AND currency IS DISTINCT FROM v_currency;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tour_operator_profile_currency_sync ON public.tour_operator_profiles;
CREATE TRIGGER tour_operator_profile_currency_sync
AFTER INSERT OR UPDATE OF country_code ON public.tour_operator_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_commercial_currency();

-- ── Backfill existing operators' commercial currency from their country ─────────
UPDATE public.operator_commercial_profiles p
   SET currency = public.commercial_currency_for_country(top.country_code),
       updated_at = TIMEZONE('UTC', NOW())
  FROM public.tour_operator_profiles top
 WHERE top.user_id = p.operator_user_id
   AND p.currency IS DISTINCT FROM public.commercial_currency_for_country(top.country_code);

GRANT EXECUTE ON FUNCTION public.commercial_currency_for_country(text) TO anon, authenticated, service_role;
