-- ============================================================================
-- Make every registered tour operator visible to admin — even before setup.
--
-- THE BUG: the admin partner list is built by admin_list_tour_operators (and its
-- direct-query fallback), both of which read ONLY public.tour_operator_profiles.
-- An operator's identity, however, lives in public.user_roles (role_type =
-- 'tour_operator'); the tour_operator_profiles row is a SEPARATE object. If that
-- profile row is missing, the operator is structurally invisible to admin — no
-- status, no badge, no type, nothing to action. That is exactly what happened to
-- kariyotop@gmail.com: an operator identity with no profile row.
--
-- How the profile row goes missing: switch_user_role once inserted user_roles
-- BEFORE tour_operator_profiles, so the commercial-provisioning trigger on
-- user_roles hit a foreign-key violation and rolled the whole signup back — leaving
-- (depending on timing) neither row, or a user_roles row with no profile. The order
-- was fixed in 20260705000001. Confirm that fix is actually live in production
-- (see the pg_get_functiondef check handed over with this migration); if it is not,
-- every new operator signup is still aborting.
--
-- This migration does two things:
--   (1) backfills the missing profile rows, so existing operators appear at once, and
--   (2) adds an identity-based admin list so an operator can NEVER again be hidden
--       merely for lacking a profile row — the class-of-bug fix, not just this row.
-- ============================================================================

BEGIN;

-- (1) Backfill. Anyone who holds the tour_operator role, or whose partner_type is
--     locked to it, but has no profile row, gets one now. user_id-only insert; every
--     other column has a default. Idempotent.
INSERT INTO public.tour_operator_profiles (user_id)
SELECT ur.user_id
FROM public.user_roles ur
LEFT JOIN public.tour_operator_profiles top ON top.user_id = ur.user_id
WHERE ur.role_type = 'tour_operator'
  AND top.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.tour_operator_profiles (user_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.tour_operator_profiles top ON top.user_id = p.id
WHERE p.partner_type = 'tour_operator'
  AND top.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- (2) Identity-based list. Enumerates operators by user_roles and LEFT JOINs the
--     profile, so a profile-less operator still appears — with has_profile = false —
--     rather than vanishing. SECURITY DEFINER + the same is_admin gate as the
--     existing RPC.
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
    COALESCE(top.created_at, ur.created_at) AS created_at
  FROM public.user_roles ur
  JOIN public.users u ON u.id = ur.user_id
  LEFT JOIN public.tour_operator_profiles top ON top.user_id = ur.user_id
  WHERE ur.role_type = 'tour_operator'
    AND (
      p_status IS NULL
      OR (p_status = 'missing' AND top.user_id IS NULL)
      OR top.account_status::text = p_status
    )
  ORDER BY COALESCE(top.created_at, ur.created_at) DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_operator_identities(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_operator_identities(text) TO authenticated;

COMMIT;

-- ── After applying, this must return zero rows ───────────────────────────────
--   SELECT ur.user_id FROM public.user_roles ur
--   LEFT JOIN public.tour_operator_profiles top ON top.user_id = ur.user_id
--   WHERE ur.role_type = 'tour_operator' AND top.user_id IS NULL;
