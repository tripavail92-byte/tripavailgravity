-- ============================================================================
-- Fix: admin partner lists crash with "column ur.created_at does not exist"
--
-- Both identity-listing RPCs read ur.created_at from public.user_roles. That column has never
-- existed. From 20260129195804_initial_schema.sql:15-23 the table is:
--
--   id, user_id, role_type, is_active, enabled_at, profile_completion, verification_status
--
-- The nearest equivalent is enabled_at (TIMESTAMPTZ DEFAULT NOW()), set when the role row is
-- created — which is exactly the "Joined" date the admin table means to show.
--
-- WHY THIS SURVIVED REVIEW AND DEPLOYMENT. PostgreSQL does not resolve column references inside
-- a PL/pgSQL body at CREATE time — check_function_bodies only checks syntax. Both migrations
-- therefore applied cleanly and reported success, and the error appeared only when an admin first
-- opened the page and the statement was planned for real. A LANGUAGE sql function would have
-- failed loudly at creation instead.
--
-- Affected:
--   * admin_list_operator_identities        — 20260711000001_admin_see_all_operators.sql:81,91
--   * admin_list_hotel_manager_identities   — 20260717000003_admin_list_hotel_manager_identities.sql:57,67
--
-- The second was written by mirroring the first, so the defect was copied rather than caught.
-- Both are corrected here; nothing else about either function changes.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_list_operator_identities(
  p_status text DEFAULT NULL  -- NULL = all; 'missing' = only those lacking a profile; else account_status
)
RETURNS TABLE (
  user_id             uuid,
  email               text,
  company_name        text,
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
    top.company_name,
    ur.verification_status::text,
    top.account_status::text,
    (top.user_id IS NOT NULL) AS has_profile,
    -- was ur.created_at, which does not exist on user_roles
    COALESCE(top.created_at, ur.enabled_at) AS created_at
  FROM public.user_roles ur
  JOIN public.users u ON u.id = ur.user_id
  LEFT JOIN public.tour_operator_profiles top ON top.user_id = ur.user_id
  WHERE ur.role_type = 'tour_operator'
    AND (
      p_status IS NULL
      OR (p_status = 'missing' AND top.user_id IS NULL)
      OR top.account_status::text = p_status
    )
  ORDER BY COALESCE(top.created_at, ur.enabled_at) DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_operator_identities(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_operator_identities(text) TO authenticated;

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
    -- was ur.created_at, which does not exist on user_roles
    COALESCE(hmp.created_at, ur.enabled_at) AS created_at
  FROM public.user_roles ur
  JOIN public.users u ON u.id = ur.user_id
  LEFT JOIN public.hotel_manager_profiles hmp ON hmp.user_id = ur.user_id
  WHERE ur.role_type = 'hotel_manager'
    AND (
      p_status IS NULL
      OR (p_status = 'missing' AND hmp.user_id IS NULL)
      OR hmp.account_status::text = p_status
    )
  ORDER BY COALESCE(hmp.created_at, ur.enabled_at) DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_hotel_manager_identities(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_hotel_manager_identities(text) TO authenticated;

COMMIT;

-- ============================================================================
-- Verify (run as an admin; both should return rows rather than raise):
--
--   SELECT * FROM public.admin_list_operator_identities(NULL) LIMIT 5;
--   SELECT * FROM public.admin_list_hotel_manager_identities(NULL) LIMIT 5;
--
-- A LANGUAGE sql probe that would have caught this class of bug at CREATE time:
--
--   SELECT ur.enabled_at FROM public.user_roles ur LIMIT 1;   -- ok
--   SELECT ur.created_at FROM public.user_roles ur LIMIT 1;   -- 42703, as the page was seeing
-- ============================================================================
