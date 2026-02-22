-- ============================================================================
-- Partner Type Lock (Profiles)
-- Date: 2026-02-23
--
-- Implements Phase 1 mutual-exclusivity + hard-lock governance:
-- - Add profiles.partner_type (NULL | 'hotel_manager' | 'tour_operator')
-- - Once set, users cannot change it directly (column-level privilege revoke)
-- - switch_user_role() permanently sets partner_type when a partner role is chosen
-- - Prevent switching between partner types without admin intervention
-- ============================================================================

-- 1) Schema: add partner_type to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_type TEXT;

-- Check constraint (NULL allowed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_partner_type_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_partner_type_check
      CHECK (partner_type IS NULL OR partner_type IN ('hotel_manager', 'tour_operator'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS profiles_partner_type_idx ON public.profiles(partner_type);

-- 2) Governance: authenticated users cannot update partner_type directly
--    (Only SECURITY DEFINER RPCs / admins should change it)
REVOKE UPDATE (partner_type) ON public.profiles FROM authenticated;

-- 3) RPC: switch_user_role hardens partner selection
--    - Ensures a profiles row exists
--    - Sets profiles.partner_type on first partner selection
--    - Blocks switching to the opposite partner type
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

      -- Insert Role (DB trigger also enforces exclusivity)
      INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status)
      VALUES (p_user_id, p_role_type, true, 'pending');

      -- Insert Partner Profile
      IF p_role_type = 'hotel_manager' THEN
        INSERT INTO public.hotel_manager_profiles (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
      ELSIF p_role_type = 'tour_operator' THEN
        INSERT INTO public.tour_operator_profiles (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
      END IF;

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

-- 4) Permissions: Only authenticated users can execute. Anon cannot.
REVOKE ALL ON FUNCTION public.switch_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.switch_user_role(UUID, TEXT) TO authenticated;

-- 5) Admin override RPC (Future phase enabler)
-- Allows admins to manually change a user's partner type (governance).
-- Uses public.is_admin(auth.uid()) which is already defined in admin migrations.
CREATE OR REPLACE FUNCTION public.admin_override_partner_type(
  p_user_id UUID,
  p_new_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_new_type IS NULL OR p_new_type NOT IN ('hotel_manager', 'tour_operator') THEN
    RAISE EXCEPTION 'Invalid partner type';
  END IF;

  -- Ensure profiles row exists
  INSERT INTO public.profiles (id, email)
  SELECT u.id, u.email
  FROM public.users u
  WHERE u.id = p_user_id
  ON CONFLICT (id) DO NOTHING;

  -- Update the locked partner type
  UPDATE public.profiles
  SET partner_type = p_new_type
  WHERE id = p_user_id;

  -- Ensure mutual exclusivity in user_roles too (clean swap)
  DELETE FROM public.user_roles
  WHERE user_id = p_user_id
    AND role_type IN ('hotel_manager', 'tour_operator')
    AND role_type <> p_new_type;

  INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status)
  VALUES (p_user_id, p_new_type, false, 'pending')
  ON CONFLICT (user_id, role_type) DO NOTHING;

  -- Ensure corresponding partner profile exists
  IF p_new_type = 'hotel_manager' THEN
    INSERT INTO public.hotel_manager_profiles (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF p_new_type = 'tour_operator' THEN
    INSERT INTO public.tour_operator_profiles (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_override_partner_type(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_override_partner_type(UUID, TEXT) TO authenticated;
