-- ============================================================
-- Fix Missing Admin RPCs
-- Date: 2026-03-14
--
-- Creates the following missing functions called by the frontend:
--   1. admin_approve_partner        → Partners page Approve button
--   2. admin_reject_partner         → Partners page Reject button
--   3. admin_request_partner_info   → Partners page Request Info button
--   4. admin_update_account_status  → useUpdateUserStatus hook
--
-- All functions:
--   - Require is_admin(auth.uid()) — fail if called by non-admin
--   - SECURITY DEFINER — run as postgres (bypasses RLS for DML)
--   - SET search_path = public — prevents search_path injection
--   - Log every action to admin_action_logs
--   - Send in-app notification to the affected partner
-- ============================================================

-- ============================================================
-- 0. Ensure entity_type constraint includes 'partner'
-- ============================================================
DO $$
DECLARE c RECORD;
BEGIN
  -- Drop any old constraint
  FOR c IN (
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.admin_action_logs'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%entity_type%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.admin_action_logs DROP CONSTRAINT %I', c.conname);
  END LOOP;

  ALTER TABLE public.admin_action_logs
    ADD CONSTRAINT admin_action_logs_entity_type_check
    CHECK (entity_type IN ('user', 'partner', 'package', 'tour', 'booking', 'report', 'verification'));
END $$;

-- ============================================================
-- 1. admin_approve_partner
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_approve_partner(
  p_user_id      UUID,
  p_partner_type TEXT,
  p_request_id   UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  -- Auth guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_partner_type NOT IN ('hotel_manager', 'tour_operator') THEN
    RAISE EXCEPTION 'Invalid partner_type: %', p_partner_type;
  END IF;

  -- Mark verification request as approved
  UPDATE public.partner_verification_requests
  SET
    status          = 'approved',
    reviewed_at     = TIMEZONE('UTC', NOW()),
    reviewed_by     = v_admin_id,
    decision_reason = NULL
  WHERE id = p_request_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  -- Sync to user_roles
  UPDATE public.user_roles
  SET verification_status = 'approved'
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  -- Audit log
  INSERT INTO public.admin_action_logs
    (admin_id, entity_type, entity_id, action_type, reason, new_state)
  VALUES (
    v_admin_id,
    'partner',
    p_user_id,
    'partner_approved',
    'Application approved',
    jsonb_build_object('request_id', p_request_id, 'partner_type', p_partner_type)
  );

  -- In-app notification
  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    p_user_id,
    'partner_approved',
    'Application Approved 🎉',
    'Congratulations! Your ' || replace(p_partner_type, '_', ' ') ||
    ' application has been approved. You can now start listing on TripAvail.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_partner(UUID, TEXT, UUID) TO authenticated;

-- ============================================================
-- 2. admin_reject_partner
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_reject_partner(
  p_user_id      UUID,
  p_partner_type TEXT,
  p_request_id   UUID,
  p_reason       TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  -- Auth guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_partner_type NOT IN ('hotel_manager', 'tour_operator') THEN
    RAISE EXCEPTION 'Invalid partner_type: %', p_partner_type;
  END IF;

  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Rejection reason must be at least 10 characters';
  END IF;

  -- Mark verification request as rejected
  UPDATE public.partner_verification_requests
  SET
    status          = 'rejected',
    reviewed_at     = TIMEZONE('UTC', NOW()),
    reviewed_by     = v_admin_id,
    decision_reason = p_reason
  WHERE id = p_request_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  -- Sync to user_roles
  UPDATE public.user_roles
  SET verification_status = 'rejected'
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  -- Audit log
  INSERT INTO public.admin_action_logs
    (admin_id, entity_type, entity_id, action_type, reason, new_state)
  VALUES (
    v_admin_id,
    'partner',
    p_user_id,
    'partner_rejected',
    p_reason,
    jsonb_build_object('request_id', p_request_id, 'partner_type', p_partner_type)
  );

  -- In-app notification
  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    p_user_id,
    'partner_rejected',
    'Application Not Approved',
    'Your ' || replace(p_partner_type, '_', ' ') ||
    ' application was not approved. Reason: ' || p_reason ||
    ' You may re-submit after addressing the issues.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reject_partner(UUID, TEXT, UUID, TEXT) TO authenticated;

-- ============================================================
-- 3. admin_request_partner_info
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_request_partner_info(
  p_user_id      UUID,
  p_partner_type TEXT,
  p_request_id   UUID,
  p_message      TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  -- Auth guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_message IS NULL OR LENGTH(TRIM(p_message)) < 10 THEN
    RAISE EXCEPTION 'Message must be at least 10 characters';
  END IF;

  -- Update request to info_requested state
  UPDATE public.partner_verification_requests
  SET
    status          = 'info_requested',
    reviewed_at     = TIMEZONE('UTC', NOW()),
    reviewed_by     = v_admin_id,
    decision_reason = p_message
  WHERE id = p_request_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  -- Audit log
  INSERT INTO public.admin_action_logs
    (admin_id, entity_type, entity_id, action_type, reason, new_state)
  VALUES (
    v_admin_id,
    'partner',
    p_user_id,
    'partner_info_requested',
    p_message,
    jsonb_build_object('request_id', p_request_id, 'partner_type', p_partner_type)
  );

  -- In-app notification
  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    p_user_id,
    'partner_info_requested',
    'Additional Information Required',
    'Your ' || replace(p_partner_type, '_', ' ') ||
    ' application needs more information: ' || p_message
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_request_partner_info(UUID, TEXT, UUID, TEXT) TO authenticated;

-- ============================================================
-- 4. admin_update_account_status
--    Generic traveler account status update used by useUpdateUserStatus hook.
--    Delegates to the same logic as admin_set_traveler_status.
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_update_account_status(
  target_user_id UUID,
  new_status     TEXT,
  reason_text    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id    UUID := auth.uid();
  v_prev_status TEXT;
BEGIN
  -- Auth guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF new_status NOT IN ('active', 'suspended', 'deleted') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be active, suspended, or deleted', new_status;
  END IF;

  IF reason_text IS NULL OR LENGTH(TRIM(reason_text)) < 10 THEN
    RAISE EXCEPTION 'Reason must be at least 10 characters';
  END IF;

  -- Snapshot previous state
  SELECT account_status INTO v_prev_status
  FROM public.profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Apply status change
  UPDATE public.profiles
  SET
    account_status       = new_status,
    status_reason        = reason_text,
    status_updated_by    = v_admin_id,
    status_updated_at    = TIMEZONE('UTC', NOW())
  WHERE id = target_user_id;

  -- Audit log
  INSERT INTO public.admin_action_logs
    (admin_id, entity_type, entity_id, action_type, reason, previous_state, new_state)
  VALUES (
    v_admin_id,
    'user',
    target_user_id,
    'user_status_' || new_status,
    reason_text,
    jsonb_build_object('account_status', v_prev_status),
    jsonb_build_object('account_status', new_status)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_account_status(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================
-- 5. admin_get_dashboard_stats
--    Returns key counts for the admin dashboard in a single call.
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id       UUID := auth.uid();
  v_total_users    BIGINT;
  v_kyc_pending    BIGINT;
  v_open_reports   BIGINT;
  v_total_bookings BIGINT;
  v_active_pkgs    BIGINT;
  v_active_tours   BIGINT;
  v_pending_partners BIGINT;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT COUNT(*) INTO v_total_users    FROM public.profiles;
  SELECT COUNT(*) INTO v_kyc_pending    FROM public.kyc_sessions    WHERE status = 'pending_admin_review';
  SELECT COUNT(*) INTO v_open_reports   FROM public.reports          WHERE status = 'open';
  SELECT COUNT(*) INTO v_total_bookings FROM public.tour_bookings;
  SELECT COUNT(*) INTO v_active_pkgs    FROM public.packages          WHERE status = 'live' OR is_published = true;
  SELECT COUNT(*) INTO v_active_tours   FROM public.tours             WHERE is_active = true;
  SELECT COUNT(*) INTO v_pending_partners FROM public.partner_verification_requests WHERE status IN ('pending', 'under_review');

  RETURN jsonb_build_object(
    'total_users',       v_total_users,
    'kyc_pending',       v_kyc_pending,
    'open_reports',      v_open_reports,
    'total_bookings',    v_total_bookings,
    'active_listings',   v_active_pkgs + v_active_tours,
    'pending_partners',  v_pending_partners
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats() TO authenticated;
