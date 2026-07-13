-- ============================================================================
-- Fix: (BUG B) new partners show "Under Review" before submitting any documents,
--      and (BUG A) admin Suspend/Delete raises "profile not found" for operators
--      that have a user_roles row but no *_profiles row.
-- Date: 2026-07-13
--
-- ROOT CAUSE (BUG B): switch_user_role() (the become-a-partner path) hardcodes
--   user_roles.verification_status = 'pending' the instant a user acquires the
--   tour_operator / hotel_manager role — BEFORE any document is uploaded. The
--   verification lifecycle is: 'incomplete' (never started) → 'pending' (submitted,
--   awaiting review) → 'approved'/'rejected'. 'pending' must be set only at SUBMIT
--   time (20260219000002), never at role-creation. So new partners wrongly read as
--   "Application Under Review" (operator side) / "Not Verified" (admin side).
--
-- ROOT CAUSE (BUG A): admin_set_*_status RAISES 'profile not found' when the target
--   operator has no *_profiles row. admin_list_operator_identities surfaces exactly
--   those profile-less operators, so Suspend/Delete on them throws.
--
-- This migration: (1) recreates switch_user_role verbatim with the single change
-- 'pending' -> 'incomplete'; (2) backfills existing never-submitted partners from
-- 'pending' back to 'incomplete'; (3) backfills any missing partner profile rows.
-- All statements are idempotent and safe to re-run.
-- ============================================================================

-- (1) Stop stamping brand-new partners as 'pending'. Byte-for-byte identical to
--     20260705000001 except line marked below.
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
  IF auth.uid() IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.profiles (id, email)
  SELECT u.id, u.email
  FROM public.users u
  WHERE u.id = p_user_id
  ON CONFLICT (id) DO NOTHING;

  SELECT partner_type INTO v_partner_type
  FROM public.profiles
  WHERE id = p_user_id;

  IF p_role_type IN ('hotel_manager', 'tour_operator') THEN
    IF v_partner_type IS NOT NULL AND v_partner_type <> p_role_type THEN
      RAISE EXCEPTION 'Partner type is locked as %. Admin approval is required to switch.', v_partner_type;
    END IF;

    SELECT role_type INTO v_existing_partner
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role_type IN ('hotel_manager', 'tour_operator')
      AND role_type <> p_role_type
    LIMIT 1;

    IF v_existing_partner IS NOT NULL THEN
      RAISE EXCEPTION 'User can only have one partner role (hotel_manager OR tour_operator)';
    END IF;

    IF v_partner_type IS NULL THEN
      UPDATE public.profiles
      SET partner_type = p_role_type
      WHERE id = p_user_id;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role_type = p_role_type
  ) THEN
    IF p_role_type IN ('hotel_manager', 'tour_operator') THEN

      IF p_role_type = 'hotel_manager' THEN
        INSERT INTO public.hotel_manager_profiles (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
      ELSIF p_role_type = 'tour_operator' THEN
        INSERT INTO public.tour_operator_profiles (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
      END IF;

      -- CHANGED: new partners start 'incomplete' (never-started), not 'pending' (under-review).
      INSERT INTO public.user_roles (user_id, role_type, is_active, verification_status)
      VALUES (p_user_id, p_role_type, true, 'incomplete');

    ELSIF p_role_type = 'traveller' THEN
      INSERT INTO public.user_roles (user_id, role_type, is_active)
      VALUES (p_user_id, 'traveller', true)
      ON CONFLICT (user_id, role_type) DO UPDATE SET is_active = true;
    ELSE
      RAISE EXCEPTION 'Role % does not exist for this user', p_role_type;
    END IF;
  END IF;

  UPDATE public.user_roles
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;

  UPDATE public.user_roles
  SET is_active = true
  WHERE user_id = p_user_id AND role_type = p_role_type;

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

-- (2) Backfill: any partner currently 'pending' that never submitted a verification
--     request is really 'incomplete' (never started). Leaves genuine submissions alone.
UPDATE public.user_roles ur
SET verification_status = 'incomplete'
WHERE ur.verification_status = 'pending'
  AND ur.role_type IN ('tour_operator', 'hotel_manager')
  AND NOT EXISTS (
    SELECT 1 FROM public.partner_verification_requests pvr
    WHERE pvr.user_id = ur.user_id
      AND pvr.partner_type = ur.role_type
  );

-- (3) Backfill missing partner-profile rows so admin Suspend/Delete never raises
--     "profile not found" for a listed operator/manager.
INSERT INTO public.tour_operator_profiles (user_id)
SELECT ur.user_id
FROM public.user_roles ur
LEFT JOIN public.tour_operator_profiles top ON top.user_id = ur.user_id
WHERE ur.role_type = 'tour_operator' AND top.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.hotel_manager_profiles (user_id)
SELECT ur.user_id
FROM public.user_roles ur
LEFT JOIN public.hotel_manager_profiles hmp ON hmp.user_id = ur.user_id
WHERE ur.role_type = 'hotel_manager' AND hmp.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
