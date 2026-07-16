-- =====================================================================
-- admin_list_hotel_manager_identities(p_status)
--
-- The hotel-manager mirror of admin_list_operator_identities (20260711000001:51-95).
--
-- WHY: the operator side was fixed months ago; the manager side never was. The asymmetry:
--
--   admin_list_operator_identities  enumerates FROM user_roles LEFT JOIN tour_operator_profiles
--                                   -> a profile-less operator still appears, flagged has_profile=false
--   admin_list_hotel_managers       enumerates FROM hotel_manager_profiles (20260228000001:189-197)
--                                   -> a manager with no profile row is INVISIBLE to admin, and the
--                                      RPC returns no email and no verification_status at all
--
-- Two consequences this closes:
--   1. A hotel manager whose profile row is missing cannot be seen, let alone approved — the exact
--      class of bug 20260711000001 fixed for operators only.
--   2. The page had to read verification_status with a raw client query against user_roles
--      (AdminPartnersPage.tsx:1267-1270), which is RLS-subject and whose error is destructured away
--      and never checked. A SECURITY DEFINER RPC removes both problems.
--
-- Signature, guard, grants and p_status semantics are copied verbatim from the operator RPC so the
-- two can be called interchangeably by one client helper.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_list_hotel_manager_identities(
  p_status text DEFAULT NULL  -- NULL = all; 'missing' = only those lacking a profile; else account_status
)
RETURNS TABLE (
  user_id             uuid,
  email               text,
  business_name       text,
  verification_status text,
  account_status      text,
  has_profile         boolean,
  created_at          timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    ur.user_id,
    u.email,
    hmp.business_name,
    ur.verification_status::text,
    hmp.account_status::text,
    (hmp.user_id IS NOT NULL) AS has_profile,
    COALESCE(hmp.created_at, ur.created_at) AS created_at
  FROM public.user_roles ur
  JOIN public.users u ON u.id = ur.user_id
  LEFT JOIN public.hotel_manager_profiles hmp ON hmp.user_id = ur.user_id
  WHERE ur.role_type = 'hotel_manager'
    AND (
      p_status IS NULL
      OR (p_status = 'missing' AND hmp.user_id IS NULL)
      OR hmp.account_status::text = p_status
    )
  ORDER BY COALESCE(hmp.created_at, ur.created_at) DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_hotel_manager_identities(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_hotel_manager_identities(text) TO authenticated;

COMMIT;

-- ---------------------------------------------------------------------
-- After applying: this should list every hotel manager, including any the old
-- profile-keyed RPC could not see. Compare the counts — a difference is the
-- population that has been invisible to admin.
-- ---------------------------------------------------------------------
-- SELECT count(*) AS via_identities FROM public.admin_list_hotel_manager_identities();
-- SELECT count(*) AS via_profiles   FROM public.hotel_manager_profiles;
