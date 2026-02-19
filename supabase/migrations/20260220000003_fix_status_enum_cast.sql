-- =============================================================================
-- Fix account_status enum cast in partner status RPCs
-- Date: 2026-02-20
--
-- The account_status column on both profile tables is account_status_enum,
-- not TEXT. The original RPCs assigned p_status (TEXT) directly, causing:
--   ERROR 42804: column "account_status" is of type account_status_enum
--               but expression is of type text
--
-- Fix: cast p_status::public.account_status_enum in both UPDATE statements.
-- =============================================================================

-- ─── 1. admin_set_hotel_manager_status ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_set_hotel_manager_status(
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
  v_admin_id    UUID := auth.uid();
  v_admin_role  public.admin_role_enum;
  v_user_uuid   UUID := p_user_id::UUID;
  v_prev_status TEXT;
  v_action      TEXT;
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

  SELECT account_status::TEXT INTO v_prev_status
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

  -- FIX: cast TEXT → enum
  UPDATE public.hotel_manager_profiles
  SET
    account_status            = p_status::public.account_status_enum,
    account_status_reason     = TRIM(p_reason),
    account_status_changed_at = TIMEZONE('UTC', NOW()),
    account_status_changed_by = v_admin_id,
    updated_at                = TIMEZONE('UTC', NOW())
  WHERE user_id = v_user_uuid;

  -- Cascade: hide live listings when suspending/deleting
  IF p_status IN ('suspended', 'deleted') THEN
    UPDATE public.packages
    SET status = 'suspended', moderation_reason = p_reason,
        moderated_by = v_admin_id, moderated_at = TIMEZONE('UTC', NOW())
    WHERE owner_id = v_user_uuid AND status = 'live';
  END IF;

  PERFORM public.admin_log_action(
    'partner', v_user_uuid, v_action, TRIM(p_reason),
    jsonb_build_object('account_status', v_prev_status, 'partner_type', 'hotel_manager'),
    jsonb_build_object('account_status', p_status,      'partner_type', 'hotel_manager')
  );

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_user_uuid,
    CASE WHEN p_status = 'suspended' THEN 'account_suspended'
         WHEN p_status = 'active'    THEN 'account_reinstated'
         ELSE 'account_status_changed' END,
    CASE WHEN p_status = 'suspended' THEN '⚠️ Your account has been suspended'
         WHEN p_status = 'active'    THEN '✅ Your account has been reinstated'
         ELSE 'Account status update' END,
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


-- ─── 2. admin_set_tour_operator_status ──────────────────────────────────────

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
  v_admin_id    UUID := auth.uid();
  v_admin_role  public.admin_role_enum;
  v_user_uuid   UUID := p_user_id::UUID;
  v_prev_status TEXT;
  v_action      TEXT;
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

  SELECT account_status::TEXT INTO v_prev_status
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

  -- FIX: cast TEXT → enum
  UPDATE public.tour_operator_profiles
  SET
    account_status            = p_status::public.account_status_enum,
    account_status_reason     = TRIM(p_reason),
    account_status_changed_at = TIMEZONE('UTC', NOW()),
    account_status_changed_by = v_admin_id,
    updated_at                = TIMEZONE('UTC', NOW())
  WHERE user_id = v_user_uuid;

  -- Cascade: hide live tours when suspending/deleting
  IF p_status IN ('suspended', 'deleted') THEN
    UPDATE public.tours
    SET status = 'suspended', moderation_reason = p_reason,
        moderated_by = v_admin_id, moderated_at = TIMEZONE('UTC', NOW())
    WHERE operator_id = v_user_uuid AND status = 'live';
  END IF;

  PERFORM public.admin_log_action(
    'partner', v_user_uuid, v_action, TRIM(p_reason),
    jsonb_build_object('account_status', v_prev_status, 'partner_type', 'tour_operator'),
    jsonb_build_object('account_status', p_status,      'partner_type', 'tour_operator')
  );

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_user_uuid,
    CASE WHEN p_status = 'suspended' THEN 'account_suspended'
         WHEN p_status = 'active'    THEN 'account_reinstated'
         ELSE 'account_status_changed' END,
    CASE WHEN p_status = 'suspended' THEN '⚠️ Your account has been suspended'
         WHEN p_status = 'active'    THEN '✅ Your account has been reinstated'
         ELSE 'Account status update' END,
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
