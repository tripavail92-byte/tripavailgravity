-- ============================================================================
-- Fix (completing 20260722000003): usage accounting must also skip a missing profile
--
-- 20260722000003 made provision_operator_commercial_profile a no-op when the operator has no
-- tour_operator_profiles row. That removed the FIRST failure but not the second, because its
-- caller carries on regardless:
--
--   ERROR 23503: insert or update on operator_feature_usage_monthly violates foreign key
--   operator_feature_usage_monthly_operator_user_id_fkey
--   Key (operator_user_id)=(a1cef695-...) is not present in operator_commercial_profiles
--
-- refresh_operator_publish_usage does four things in sequence (20260315000023):
--   1. PERFORM provision_operator_commercial_profile(...)   -- now safely a no-op
--   2. SELECT the billing cycle from operator_commercial_profiles  -- returns NULL
--   3. FALL BACK to a cycle computed from the current month        -- masks the absence
--   4. INSERT INTO operator_feature_usage_monthly                  -- FK -> fails here
--
-- Step 3 is the design flaw: it invents a cycle rather than recognising that there is no profile,
-- so execution reaches an insert that cannot succeed. My previous migration fixed the link that
-- happened to fail first instead of reading the whole function — the same mistake in miniature.
--
-- THE FIX: return early when no commercial profile exists. Publish-usage accounting for an operator
-- who has no commercial profile is meaningless by definition — the FK on every table involved says
-- the rows cannot exist — so there is nothing to record and the tour update must proceed untouched.
--
-- The existing NULL-cycle fallback is KEPT for the case it was actually written for: a profile that
-- exists but whose cycle dates are null. Only the no-profile-at-all case returns early.
--
-- Chain re-read end to end this time. After this, an UPDATE on a tour owned by a profile-less
-- operator touches: provision (no-op) -> refresh (early return) -> trigger returns NEW. No insert
-- against any table with an FK into operator_commercial_profiles is attempted.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.refresh_operator_publish_usage(
  p_operator_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_start DATE;
  v_cycle_end DATE;
  v_published_count INTEGER := 0;
  v_has_profile BOOLEAN;
BEGIN
  IF p_operator_user_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM public.provision_operator_commercial_profile(p_operator_user_id);

  -- Provisioning above is a no-op for an operator with no tour_operator_profiles row, so a profile
  -- may still be absent here. Everything below writes to tables whose FKs require one, so there is
  -- nothing to do — and pressing on would abort the caller's statement and make the tour
  -- permanently uneditable.
  SELECT
    profile.current_cycle_start,
    profile.current_cycle_end,
    TRUE
  INTO v_cycle_start, v_cycle_end, v_has_profile
  FROM public.operator_commercial_profiles AS profile
  WHERE profile.operator_user_id = p_operator_user_id;

  IF NOT COALESCE(v_has_profile, FALSE) THEN
    RETURN;
  END IF;

  -- Profile exists but has no cycle dates: fall back to the current calendar month, as before.
  IF v_cycle_start IS NULL OR v_cycle_end IS NULL THEN
    v_cycle_start := DATE_TRUNC('month', TIMEZONE('UTC', NOW()))::DATE;
    v_cycle_end := (v_cycle_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  END IF;

  SELECT COUNT(*)
  INTO v_published_count
  FROM public.tours AS tour
  WHERE tour.operator_id = p_operator_user_id
    AND (COALESCE(tour.is_published, FALSE) = TRUE OR COALESCE(tour.is_active, FALSE) = TRUE)
    AND COALESCE(tour.approved_at, tour.created_at, TIMEZONE('UTC', NOW()))::DATE BETWEEN v_cycle_start AND v_cycle_end;

  INSERT INTO public.operator_feature_usage_monthly (
    operator_user_id,
    cycle_start,
    cycle_end,
    published_tours_count,
    updated_at
  )
  VALUES (
    p_operator_user_id,
    v_cycle_start,
    v_cycle_end,
    v_published_count,
    TIMEZONE('UTC', NOW())
  )
  ON CONFLICT (operator_user_id, cycle_start, cycle_end) DO UPDATE SET
    published_tours_count = EXCLUDED.published_tours_count,
    updated_at = TIMEZONE('UTC', NOW());

  UPDATE public.operator_commercial_profiles
  SET
    monthly_published_tours_count = v_published_count,
    updated_at = TIMEZONE('UTC', NOW())
  WHERE operator_user_id = p_operator_user_id;
END;
$$;

COMMIT;

-- ============================================================================
-- Verify — this previously raised 23503 twice over. It should now succeed:
--
--   UPDATE public.tours SET updated_at = updated_at
--   WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
--
-- And confirm a NORMAL operator is unaffected — usage accounting must still run for anyone with a
-- commercial profile:
--
--   SELECT operator_user_id, cycle_start, published_tours_count, updated_at
--   FROM public.operator_feature_usage_monthly
--   ORDER BY updated_at DESC LIMIT 5;
--
-- Then re-run Section A of
--   supabase/maintenance/remove_fabricated_ratings_and_demo_listings.sql
-- ============================================================================
