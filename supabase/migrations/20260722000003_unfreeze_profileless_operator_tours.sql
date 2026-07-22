-- ============================================================================
-- Fix: a tour whose operator has no profile row cannot be updated at all
--
-- SYMPTOM, hit while zeroing fabricated ratings:
--
--   ERROR 23503: insert or update on table "operator_commercial_profiles" violates foreign key
--   constraint "operator_commercial_profiles_operator_user_id_fkey"
--   DETAIL: Key (operator_user_id)=(a1cef695-...) is not present in table "tour_operator_profiles"
--
-- THE CHAIN:
--   UPDATE public.tours (ANY column)
--     -> trigger tours_sync_operator_publish_usage        [20260315000023:172]
--     -> sync_operator_publish_usage_trigger()
--     -> refresh_operator_publish_usage(NEW.operator_id)
--     -> provision_operator_commercial_profile(...)       [20260315000021]
--     -> INSERT INTO operator_commercial_profiles         -> FK violation
--
-- TWO THINGS COMBINED TO MAKE THIS FATAL:
--
--   1. 20260315000023 WIDENED the trigger. 20260315000022 declared it
--        AFTER INSERT OR UPDATE OF is_published, is_active, approved_at, operator_id OR DELETE
--      and the very next migration replaced it with a bare
--        AFTER INSERT OR UPDATE OR DELETE
--      so commercial provisioning now runs on every column change — a title edit, a price change,
--      a rating correction — not just on the publish-state changes it was written for.
--
--   2. provision_operator_commercial_profile has no guard. It checks for an existing commercial
--      profile and then INSERTs. It never checks that the operator has a tour_operator_profiles
--      row, which the FK requires.
--
-- CONSEQUENCE: any tour belonging to a profile-less operator is FROZEN. Every UPDATE on it fails,
-- for the operator, for an admin, and for a maintenance script. The row cannot be corrected,
-- unpublished, or repriced. Profile-less partners are a recurring shape on this platform — the
-- admin partner lists had to be rebuilt to enumerate from user_roles for the same reason — so this
-- is not a one-off.
--
-- THE FIX: make provisioning a no-op when the operator profile is absent, instead of raising. A
-- commercial profile genuinely cannot exist without one (that is what the FK says), so there is
-- nothing to create; the correct behaviour is to skip and let the tour update proceed. A WARNING is
-- raised so the underlying gap stays visible in the logs rather than being silently swallowed.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.provision_operator_commercial_profile(p_operator_user_id UUID)
RETURNS public.operator_commercial_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier public.commercial_membership_tiers;
  v_existing public.operator_commercial_profiles;
  v_today DATE := (TIMEZONE('UTC', NOW()))::DATE;
BEGIN
  SELECT * INTO v_existing
  FROM public.operator_commercial_profiles
  WHERE operator_user_id = p_operator_user_id;

  IF FOUND THEN
    RETURN v_existing;
  END IF;

  -- NEW GUARD. operator_commercial_profiles.operator_user_id references tour_operator_profiles,
  -- so without that row the INSERT below can only ever fail. Because this runs from an AFTER
  -- trigger on tours, that failure aborts the whole statement and makes the tour uneditable by
  -- anyone. Skipping is the only correct answer: there is no commercial profile to provision for
  -- an operator who does not exist yet, and a tour edit must not depend on one.
  IF NOT EXISTS (
    SELECT 1 FROM public.tour_operator_profiles top
    WHERE top.user_id = p_operator_user_id
  ) THEN
    RAISE WARNING 'provision_operator_commercial_profile: no tour_operator_profiles row for %, skipping provisioning', p_operator_user_id;
    RETURN NULL;
  END IF;

  SELECT * INTO v_tier
  FROM public.commercial_membership_tiers
  WHERE code = 'gold'::public.membership_tier_code_enum;

  INSERT INTO public.operator_commercial_profiles (
    operator_user_id,
    operational_status,
    kyc_status,
    membership_tier_code,
    membership_status,
    commission_rate,
    monthly_membership_fee,
    billing_cycle_anchor_day,
    current_cycle_start,
    current_cycle_end,
    next_billing_date
  )
  VALUES (
    p_operator_user_id,
    'pending'::public.operator_operational_status_enum,
    'not_submitted'::public.commercial_kyc_status_enum,
    'gold'::public.membership_tier_code_enum,
    'active'::public.membership_status_enum,
    COALESCE(v_tier.commission_rate, 20),
    COALESCE(v_tier.monthly_fee, 0),
    LEAST(28, EXTRACT(DAY FROM v_today)::INT),
    v_today,
    (v_today + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
    (v_today + INTERVAL '1 month')::DATE
  )
  RETURNING * INTO v_existing;

  RETURN v_existing;
END;
$$;

COMMIT;

-- ============================================================================
-- STEP 1 — Which tours were frozen, and who owns them?
--
--   SELECT t.id, t.title, t.operator_id, t.is_published,
--          (u.email IS NOT NULL) AS user_exists
--   FROM public.tours t
--   LEFT JOIN public.users u ON u.id = t.operator_id
--   WHERE NOT EXISTS (
--     SELECT 1 FROM public.tour_operator_profiles top WHERE top.user_id = t.operator_id
--   );
--
-- Read the result before doing anything else:
--   * user_exists = false  -> the tour points at an account that does not exist. Seeded data.
--     Unpublishing it is safe and probably right.
--   * user_exists = true   -> a REAL operator is missing their profile row. Their tours have been
--     uneditable and they cannot be provisioned commercially. Create the profile rather than
--     hiding the tour.
--
-- STEP 2 — Confirm the freeze is lifted. This should now succeed where it previously raised 23503:
--
--   UPDATE public.tours SET updated_at = updated_at
--   WHERE id = '<one of the ids from step 1>';
--
-- STEP 3 — Then re-run Section A of
--   supabase/maintenance/remove_fabricated_ratings_and_demo_listings.sql
--
-- SEPARATELY WORTH FIXING, not done here because it needs a decision:
-- 20260315000023 widened tours_sync_operator_publish_usage to fire on every column. Publish-usage
-- accounting only depends on is_published, is_active, approved_at and operator_id, so the narrower
-- form from 20260315000022 was correct and the widening looks accidental. Restoring it would stop
-- every unrelated tour edit doing commercial-profile work:
--
--   DROP TRIGGER IF EXISTS tours_sync_operator_publish_usage ON public.tours;
--   CREATE TRIGGER tours_sync_operator_publish_usage
--   AFTER INSERT OR UPDATE OF is_published, is_active, approved_at, operator_id OR DELETE
--   ON public.tours FOR EACH ROW
--   EXECUTE FUNCTION public.sync_operator_publish_usage_trigger();
--
-- I have left that alone: something later may rely on the wide form, and the guard above already
-- removes the failure.
-- ============================================================================
