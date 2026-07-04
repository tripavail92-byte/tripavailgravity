-- ============================================================================
-- Fix: switching to tour_operator fails with a FK violation
-- Date: 2026-07-05
--
-- BUG: public.switch_user_role() auto-creates a partner role by inserting the
-- user_roles row FIRST, then the partner-profile row. For tour_operator the
-- user_roles INSERT fires trigger `user_roles_sync_operator_commercial_kyc`
-- (migration 20260315000021), which calls provision_operator_commercial_profile()
-- and INSERTs into operator_commercial_profiles. That table's PK operator_user_id
-- has a NON-deferrable FK -> tour_operator_profiles(user_id). But the
-- tour_operator_profiles row is only inserted on the NEXT statement, so the FK
-- check fails (SQLSTATE 23503) and the whole transaction rolls back. Hotel
-- managers are unaffected because that trigger early-returns for non-operators.
--
-- FIX: insert the partner-profile (parent) row BEFORE the user_roles row, so the
-- commercial-provisioning trigger's FK to tour_operator_profiles is satisfied.
-- The provisioning function is idempotent (checks IF FOUND) and both inserts use
-- ON CONFLICT DO NOTHING, so the tour_operator_profiles AFTER-INSERT bootstrap
-- trigger and the later user_roles sync trigger coexist safely.
--
-- Behaviour is otherwise byte-for-byte identical to the 20260223000001 version
-- (auth guard, partner_type hard-lock governance, activate/deactivate, return).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.switch_user_role(
  p_user_id UUID,
  p_role_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_partner_type TEXT;
  v_existing_partner TEXT;
BEGIN
  -- SECURITY: This function is SECURITY DEFINER. Never allow switching another user's role.
  IF auth.uid() IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Ensure profiles row exists (profiles system is optional/late-bound in this repo)
  INSERT INTO public.profiles (id, email)
  SELECT u.id, u.email
  FROM public.users u
  WHERE u.id = p_user_id
  ON CONFLICT (id) DO NOTHING;

  SELECT partner_type INTO v_partner_type
  FROM public.profiles
  WHERE id = p_user_id;

  -- Partner type governance (Option A hard lock)
  IF p_role_type IN ('hotel_manager', 'tour_operator') THEN
    -- If a partner type is already locked, prevent switching to the other one
    IF v_partner_type IS NOT NULL AND v_partner_type <> p_role_type THEN
      RAISE EXCEPTION 'Partner type is locked as %. Admin approval is required to switch.', v_partner_type;
    END IF;

    -- Belt-and-suspenders: if user_roles already contains the opposite partner role, block
    SELECT role_type INTO v_existing_partner
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role_type IN ('hotel_manager', 'tour_operator')
      AND role_type <> p_role_type
    LIMIT 1;

    IF v_existing_partner IS NOT NULL THEN
      RAISE EXCEPTION 'User can only have one partner role (hotel_manager OR tour_operator)';
    END IF;

    -- First-time partner selection: persist it
    IF v_partner_type IS NULL THEN
      UPDATE public.profiles
      SET partner_type = p_role_type
      WHERE id = p_user_id;
    END IF;
  END IF;

  -- 1. Check if role exists
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role_type = p_role_type
  ) THEN
    -- Auto-create if it's a partner role
    IF p_role_type IN ('hotel_manager', 'tour_operator') THEN

      -- Insert Partner Profile FIRST (parent row). For tour_operator this makes
      -- the tour_operator_profiles(user_id) FK target exist before the user_roles
      -- INSERT below fires the commercial-provisioning trigger.
      IF p_role_type = 'hotel_manager' THEN
        INSERT INTO public.hotel_manager_profiles (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
      ELSIF p_role_type = 'tour_operator' THEN
        INSERT INTO public.tour_operator_profiles (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
      END IF;

      -- Insert Role (DB trigger also enforces exclusivity; commercial-provisioning
      -- trigger now finds its FK parent already present).
      INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status)
      VALUES (p_user_id, p_role_type, true, 'pending');

    ELSIF p_role_type = 'traveller' THEN
      INSERT INTO public.user_roles (user_id, role_type, is_active)
      VALUES (p_user_id, 'traveller', true)
      ON CONFLICT (user_id, role_type) DO UPDATE SET is_active = true;
    ELSE
      RAISE EXCEPTION 'Role % does not exist for this user', p_role_type;
    END IF;
  END IF;

  -- 2. Deactivate currently active role
  UPDATE public.user_roles
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;

  -- 3. Activate new role
  UPDATE public.user_roles
  SET is_active = true
  WHERE user_id = p_user_id AND role_type = p_role_type;

  -- 4. Return success structure
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'active_role', p_role_type,
    'status', 'success'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.switch_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.switch_user_role(UUID, TEXT) TO authenticated;
