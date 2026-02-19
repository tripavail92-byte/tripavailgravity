-- ============================================================================
-- Partner Account Status (Suspension Workflow)
-- Date: 2026-02-20
--
-- Governance matrix:
--   verification_status  |  account_status  |  Can operate?
--   ---------------------|------------------|----------------
--   approved             |  active          |  YES
--   approved             |  suspended       |  NO
--   pending              |  active          |  NO
--   rejected             |  active          |  NO
--
-- New objects:
--   RPC  admin_set_hotel_manager_status  - suspend / activate / soft-delete hotel managers
--   RPC  admin_set_tour_operator_status  - suspend / activate / soft-delete tour operators
--   RPC  get_my_partner_status           - partner reads their own operative status
--
-- All RPCs:
--  - Require admin privileges (is_admin check)
--  - SECURITY DEFINER (bypass RLS for the targeted table mutation)
--  - Log to admin_action_logs via admin_log_action()
--  - Send in-app notification to the affected partner
-- ============================================================================

-- ============================================================================
-- 1. Ensure account_status column exists on both profile tables
--    (idempotent — the column was added in initial schema but belt-and-suspenders)
-- ============================================================================

ALTER TABLE public.hotel_manager_profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'deleted'));

ALTER TABLE public.hotel_manager_profiles
  ADD COLUMN IF NOT EXISTS account_status_reason TEXT,
  ADD COLUMN IF NOT EXISTS account_status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_status_changed_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;

ALTER TABLE public.tour_operator_profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'deleted'));

ALTER TABLE public.tour_operator_profiles
  ADD COLUMN IF NOT EXISTS account_status_reason TEXT,
  ADD COLUMN IF NOT EXISTS account_status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_status_changed_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;

-- Non-admins cannot write account_status fields (defense-in-depth)
REVOKE UPDATE (account_status, account_status_reason, account_status_changed_at, account_status_changed_by)
  ON public.hotel_manager_profiles FROM authenticated;
REVOKE UPDATE (account_status, account_status_reason, account_status_changed_at, account_status_changed_by)
  ON public.hotel_manager_profiles FROM anon;

REVOKE UPDATE (account_status, account_status_reason, account_status_changed_at, account_status_changed_by)
  ON public.tour_operator_profiles FROM authenticated;
REVOKE UPDATE (account_status, account_status_reason, account_status_changed_at, account_status_changed_by)
  ON public.tour_operator_profiles FROM anon;

-- ============================================================================
-- 2. Helper: can_partner_operate(user_id, partner_type)
--    Returns TRUE only when verified + active.
--    Used by listing/tour creation RPCs and partner dashboard guards.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_partner_operate(
  p_user_id    UUID,
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

  RETURN v_account_status = 'active';
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_partner_operate(UUID, TEXT) TO authenticated;

-- ============================================================================
-- 3. RPC: admin_set_hotel_manager_status
--    Suspends, activates, or soft-deletes a hotel manager account.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_set_hotel_manager_status(
  p_user_id TEXT,  -- TEXT to accept from frontend easily, cast internally
  p_status  TEXT,
  p_reason  TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id   UUID := auth.uid();
  v_admin_role public.admin_role_enum;
  v_user_uuid  UUID := p_user_id::UUID;
  v_prev_status TEXT;
  v_action     TEXT;
BEGIN
  -- Auth + role guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Support admins cannot suspend partners (moderator+ only)
  SELECT role INTO v_admin_role FROM public.admin_users WHERE id = v_admin_id;
  IF v_admin_role = 'support' THEN
    RAISE EXCEPTION 'Support role cannot change partner account status';
  END IF;

  IF p_status NOT IN ('active', 'suspended', 'deleted') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be active, suspended, or deleted', p_status;
  END IF;

  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Reason must be at least 10 characters';
  END IF;

  -- Snapshot previous state for audit
  SELECT account_status INTO v_prev_status
  FROM public.hotel_manager_profiles
  WHERE user_id = v_user_uuid;

  IF v_prev_status IS NULL THEN
    RAISE EXCEPTION 'Hotel manager profile not found for user %', p_user_id;
  END IF;

  v_action := CASE
    WHEN p_status = 'suspended' THEN 'suspend_partner'
    WHEN p_status = 'active'    THEN 'activate_partner'
    WHEN p_status = 'deleted'   THEN 'delete_partner'
    ELSE 'modify_partner_status'
  END;

  -- Apply the status change
  UPDATE public.hotel_manager_profiles
  SET
    account_status            = p_status,
    account_status_reason     = TRIM(p_reason),
    account_status_changed_at = TIMEZONE('UTC', NOW()),
    account_status_changed_by = v_admin_id,
    -- If deleting, unpublish their listings
    updated_at                = TIMEZONE('UTC', NOW())
  WHERE user_id = v_user_uuid;

  -- If suspending or deleting, cascade to their packages (hide them)
  IF p_status IN ('suspended', 'deleted') THEN
    UPDATE public.packages
    SET status = 'suspended', moderation_reason = p_reason, moderated_by = v_admin_id, moderated_at = TIMEZONE('UTC', NOW())
    WHERE owner_id = v_user_uuid AND status = 'live';
  END IF;

  -- If reactivating, restore their packages to live (only if they were our previous 'live')
  -- (Conservative: don't auto-restore what was manually suspended before account suspension)

  -- Audit log
  PERFORM public.admin_log_action(
    'partner',
    v_user_uuid,
    v_action,
    TRIM(p_reason),
    jsonb_build_object('account_status', v_prev_status, 'partner_type', 'hotel_manager'),
    jsonb_build_object('account_status', p_status, 'partner_type', 'hotel_manager')
  );

  -- In-app notification to the partner
  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_user_uuid,
    CASE
      WHEN p_status = 'suspended' THEN 'account_suspended'
      WHEN p_status = 'active'    THEN 'account_reinstated'
      ELSE 'account_status_changed'
    END,
    CASE
      WHEN p_status = 'suspended' THEN '⚠️ Your account has been suspended'
      WHEN p_status = 'active'    THEN '✅ Your account has been reinstated'
      ELSE 'Account status update'
    END,
    CASE
      WHEN p_status = 'suspended'
        THEN 'Your hotel manager account has been suspended. Reason: ' || TRIM(p_reason) || '. Contact support to appeal.'
      WHEN p_status = 'active'
        THEN 'Your hotel manager account is active again. You can resume creating listings.'
      ELSE 'Your account status has been updated. Reason: ' || TRIM(p_reason)
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_hotel_manager_status(TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 4. RPC: admin_set_tour_operator_status  (same logic, targets tour_operator_profiles)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_set_tour_operator_status(
  p_user_id TEXT,
  p_status  TEXT,
  p_reason  TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id   UUID := auth.uid();
  v_admin_role public.admin_role_enum;
  v_user_uuid  UUID := p_user_id::UUID;
  v_prev_status TEXT;
  v_action     TEXT;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT role INTO v_admin_role FROM public.admin_users WHERE id = v_admin_id;
  IF v_admin_role = 'support' THEN
    RAISE EXCEPTION 'Support role cannot change partner account status';
  END IF;

  IF p_status NOT IN ('active', 'suspended', 'deleted') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be active, suspended, or deleted', p_status;
  END IF;

  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Reason must be at least 10 characters';
  END IF;

  SELECT account_status INTO v_prev_status
  FROM public.tour_operator_profiles
  WHERE user_id = v_user_uuid;

  IF v_prev_status IS NULL THEN
    RAISE EXCEPTION 'Tour operator profile not found for user %', p_user_id;
  END IF;

  v_action := CASE
    WHEN p_status = 'suspended' THEN 'suspend_partner'
    WHEN p_status = 'active'    THEN 'activate_partner'
    WHEN p_status = 'deleted'   THEN 'delete_partner'
    ELSE 'modify_partner_status'
  END;

  UPDATE public.tour_operator_profiles
  SET
    account_status            = p_status,
    account_status_reason     = TRIM(p_reason),
    account_status_changed_at = TIMEZONE('UTC', NOW()),
    account_status_changed_by = v_admin_id,
    updated_at                = TIMEZONE('UTC', NOW())
  WHERE user_id = v_user_uuid;

  -- Cascade: suspend their active tours when account is suspended/deleted
  IF p_status IN ('suspended', 'deleted') THEN
    UPDATE public.tours
    SET status = 'suspended', moderation_reason = p_reason, moderated_by = v_admin_id, moderated_at = TIMEZONE('UTC', NOW())
    WHERE operator_id = v_user_uuid AND status = 'live';
  END IF;

  PERFORM public.admin_log_action(
    'partner',
    v_user_uuid,
    v_action,
    TRIM(p_reason),
    jsonb_build_object('account_status', v_prev_status, 'partner_type', 'tour_operator'),
    jsonb_build_object('account_status', p_status, 'partner_type', 'tour_operator')
  );

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_user_uuid,
    CASE
      WHEN p_status = 'suspended' THEN 'account_suspended'
      WHEN p_status = 'active'    THEN 'account_reinstated'
      ELSE 'account_status_changed'
    END,
    CASE
      WHEN p_status = 'suspended' THEN '⚠️ Your account has been suspended'
      WHEN p_status = 'active'    THEN '✅ Your account has been reinstated'
      ELSE 'Account status update'
    END,
    CASE
      WHEN p_status = 'suspended'
        THEN 'Your tour operator account has been suspended. Reason: ' || TRIM(p_reason) || '. Contact support to appeal.'
      WHEN p_status = 'active'
        THEN 'Your tour operator account is active again. You can resume publishing tours.'
      ELSE 'Your account status has been updated. Reason: ' || TRIM(p_reason)
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_tour_operator_status(TEXT, TEXT, TEXT) TO authenticated;
