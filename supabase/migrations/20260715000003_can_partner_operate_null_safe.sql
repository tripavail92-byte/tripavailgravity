-- =====================================================================
-- can_partner_operate(): return a deterministic FALSE instead of NULL.
--
-- WHY: the final line was `RETURN v_account_status = 'active';`. When the partner has no
-- profile row at all, v_account_status is NULL, so the function returns NULL rather than FALSE.
-- RLS treats a NULL WITH CHECK as a failure, so the write was correctly refused — but callers
-- (and anyone reading logs) got a silent NULL with no way to tell "not approved" from "no row".
-- This is the same "missing profile row = invisible" trap seen on the operator side.
--
-- This does NOT change who can do what:
--   * NULL and FALSE are both refusals to RLS — the policy behaves identically.
--   * It only makes the answer honest for client callers, which now gate on this RPC up front
--     (ListPackagePage) to show "Approval pending" instead of a raw row-level-security error.
--
-- Body is otherwise copied verbatim from 20260220000001_partner_suspension_workflow.sql.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.can_partner_operate(
  p_user_id UUID,
  p_partner_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verification_status TEXT;
  v_account_status      TEXT;
BEGIN
  -- Check verification_status on user_roles
  SELECT verification_status INTO v_verification_status
  FROM public.user_roles
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  IF v_verification_status IS DISTINCT FROM 'approved' THEN
    RETURN FALSE;
  END IF;

  -- Check account_status on the appropriate profile table
  IF p_partner_type = 'hotel_manager' THEN
    SELECT account_status INTO v_account_status
    FROM public.hotel_manager_profiles
    WHERE user_id = p_user_id;
  ELSIF p_partner_type = 'tour_operator' THEN
    SELECT account_status INTO v_account_status
    FROM public.tour_operator_profiles
    WHERE user_id = p_user_id;
  ELSE
    RETURN FALSE;
  END IF;

  -- COALESCE: a missing profile row (NULL) is an explicit FALSE, not a NULL.
  RETURN COALESCE(v_account_status = 'active', FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_partner_operate(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------
-- DIAGNOSTIC (read-only) — run this to see WHY a given manager is blocked.
-- Replace the email. Tells you which arm is failing: not approved, or no profile row.
-- ---------------------------------------------------------------------
-- SELECT
--   u.email,
--   ur.role_type,
--   ur.verification_status,
--   hmp.account_status,
--   CASE
--     WHEN ur.verification_status IS DISTINCT FROM 'approved' THEN 'BLOCKED: not approved'
--     WHEN hmp.user_id IS NULL                                THEN 'BLOCKED: hotel_manager_profiles row missing'
--     WHEN hmp.account_status <> 'active'                     THEN 'BLOCKED: account_status=' || hmp.account_status
--     ELSE 'OK: can publish'
--   END AS diagnosis
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur
--   ON ur.user_id = u.id AND ur.role_type = 'hotel_manager'
-- LEFT JOIN public.hotel_manager_profiles hmp
--   ON hmp.user_id = u.id
-- WHERE u.email = 'REPLACE_WITH_THE_MANAGER_EMAIL';
