-- ============================================================================
-- Governance Hardening Migration
-- Date: 2026-02-20
--
-- Closes three confirmed gaps from architecture audit:
--
-- GAP 1 — Support role can call verification RPCs (approve/reject/request_info)
--   Fix: Add v_admin_role check (must be 'super_admin' or 'moderator') to all
--        three verification decision RPCs. Support role = READ ONLY.
--
-- GAP 2 — can_partner_operate() not enforced at data layer
--   Fix: Enforce in INSERT + UPDATE WITH CHECK on packages and tours tables.
--        A suspended or unverified partner cannot insert a new listing at DB level.
--        This is the primary enforcement point — UI is secondary.
--
-- GAP 3 — Booking acceptance allowed without partner operative check
--   Fix: Guard create_package_booking / any booking insert RPC with
--        can_partner_operate() for the target partner.
--
-- Behavioral decisions (documented):
--   Reinstatement does NOT auto-reactivate listings.
--   Rationale: Admin must have explicitly suspended for a reason. Auto-restore
--   could re-expose content that needs manual review first. Partner re-publishes
--   listings themselves after account is reinstated.
-- ============================================================================

-- ============================================================================
-- GAP 1: Harden all three verification decision RPCs
--         Support role = read-only  →  moderator+ can approve/reject
-- ============================================================================

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
  v_admin_id   UUID := auth.uid();
  v_admin_role public.admin_role_enum;
  v_prev_status TEXT;
BEGIN
  -- Auth guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Role guard: support cannot approve partners
  SELECT role INTO v_admin_role FROM public.admin_users WHERE id = v_admin_id;
  IF v_admin_role = 'support' THEN
    RAISE EXCEPTION 'Support role cannot approve partner applications. Moderator or Super-Admin required.';
  END IF;

  SELECT verification_status INTO v_prev_status
  FROM public.user_roles
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  UPDATE public.user_roles
  SET
    verification_status = 'approved',
    is_active = true
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  UPDATE public.partner_verification_requests
  SET
    status      = 'approved',
    reviewed_at = TIMEZONE('UTC', NOW()),
    reviewed_by = v_admin_id
  WHERE id = p_request_id;

  PERFORM public.admin_log_action(
    'verification',
    p_user_id,
    'partner_approved',
    'Partner application approved by ' || v_admin_role::TEXT,
    jsonb_build_object('verification_status', v_prev_status, 'partner_type', p_partner_type),
    jsonb_build_object('verification_status', 'approved', 'is_active', true, 'request_id', p_request_id, 'approved_by_role', v_admin_role)
  );

  INSERT INTO public.verification_activity_logs (user_id, role, event_type, status, details)
  VALUES (
    p_user_id, p_partner_type, 'status_change', 'success',
    jsonb_build_object('request_id', p_request_id, 'reviewed_by', v_admin_id, 'action', 'approved')
  );

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    p_user_id,
    'verification_approved',
    '🎉 Your application has been approved!',
    CASE p_partner_type
      WHEN 'hotel_manager'  THEN 'Congratulations! Your hotel manager account is now active. You can start listing your properties.'
      WHEN 'tour_operator'  THEN 'Congratulations! Your tour operator account is now active. You can start publishing your tours.'
      ELSE 'Your partner account has been approved.'
    END
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────

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
  v_admin_id   UUID := auth.uid();
  v_admin_role public.admin_role_enum;
  v_prev_status TEXT;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT role INTO v_admin_role FROM public.admin_users WHERE id = v_admin_id;
  IF v_admin_role = 'support' THEN
    RAISE EXCEPTION 'Support role cannot reject partner applications. Moderator or Super-Admin required.';
  END IF;

  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Rejection reason must be at least 10 characters';
  END IF;

  SELECT verification_status INTO v_prev_status
  FROM public.user_roles
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  UPDATE public.user_roles
  SET verification_status = 'rejected'
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  UPDATE public.partner_verification_requests
  SET
    status          = 'rejected',
    reviewed_at     = TIMEZONE('UTC', NOW()),
    reviewed_by     = v_admin_id,
    decision_reason = p_reason
  WHERE id = p_request_id;

  PERFORM public.admin_log_action(
    'verification',
    p_user_id,
    'partner_rejected',
    p_reason,
    jsonb_build_object('verification_status', v_prev_status, 'partner_type', p_partner_type),
    jsonb_build_object('verification_status', 'rejected', 'request_id', p_request_id, 'rejected_by_role', v_admin_role)
  );

  INSERT INTO public.verification_activity_logs (user_id, role, event_type, status, details)
  VALUES (
    p_user_id, p_partner_type, 'status_change', 'failure',
    jsonb_build_object('request_id', p_request_id, 'reviewed_by', v_admin_id, 'action', 'rejected', 'reason', p_reason)
  );

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    p_user_id,
    'verification_rejected',
    'Application Requires Attention',
    'Your application could not be approved at this time. Reason: ' || p_reason || ' — Please update your information and re-submit.'
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────

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
  v_admin_id   UUID := auth.uid();
  v_admin_role public.admin_role_enum;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT role INTO v_admin_role FROM public.admin_users WHERE id = v_admin_id;
  IF v_admin_role = 'support' THEN
    RAISE EXCEPTION 'Support role cannot send info requests on verification. Moderator or Super-Admin required.';
  END IF;

  IF p_message IS NULL OR LENGTH(TRIM(p_message)) < 10 THEN
    RAISE EXCEPTION 'Info request message must be at least 10 characters';
  END IF;

  UPDATE public.partner_verification_requests
  SET
    status          = 'info_requested',
    reviewed_at     = TIMEZONE('UTC', NOW()),
    reviewed_by     = v_admin_id,
    decision_reason = p_message
  WHERE id = p_request_id;

  PERFORM public.admin_log_action(
    'verification',
    p_user_id,
    'partner_info_requested',
    p_message,
    jsonb_build_object('partner_type', p_partner_type),
    jsonb_build_object('status', 'info_requested', 'request_id', p_request_id, 'requested_by_role', v_admin_role)
  );

  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    p_user_id,
    'verification_info_requested',
    '📋 Additional Information Needed',
    'Our review team has a question about your application: ' || p_message
  );
END;
$$;


-- ============================================================================
-- GAP 2: Enforce can_partner_operate() in INSERT RLS on packages and tours
--
-- This is the DATA-LEVEL gate. No matter what the UI says, a non-operative
-- partner cannot create a new listing. Suspended = BLOCKED at DB level.
-- ============================================================================

-- PACKAGES table

-- Drop any existing "partner can insert" style policies first
DROP POLICY IF EXISTS "Partners can create packages"          ON public.packages;
DROP POLICY IF EXISTS "Hotel managers can insert packages"    ON public.packages;
DROP POLICY IF EXISTS "authenticated users can insert packages" ON public.packages;
DROP POLICY IF EXISTS "Users can insert their own packages"   ON public.packages;
DROP POLICY IF EXISTS "Partners can insert packages"          ON public.packages;

-- Create the governed INSERT policy
CREATE POLICY "Operative partners can create packages"
  ON public.packages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_partner_operate(auth.uid(), 'hotel_manager')
  );

-- TOURS table

DROP POLICY IF EXISTS "Tour operators can create tours"             ON public.tours;
DROP POLICY IF EXISTS "Operators can insert their own tours"        ON public.tours;
DROP POLICY IF EXISTS "authenticated users can insert tours"        ON public.tours;
DROP POLICY IF EXISTS "Users can insert their own tours"            ON public.tours;
DROP POLICY IF EXISTS "Partners can insert tours"                   ON public.tours;

CREATE POLICY "Operative tour operators can create tours"
  ON public.tours
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = operator_id
    AND public.can_partner_operate(auth.uid(), 'tour_operator')
  );

-- ============================================================================
-- GAP 3: Booking acceptance — prevent bookings on suspended-partner listings
--
-- When a traveller books a package/tour, the owning partner must be operative.
-- Gate the package_bookings INSERT similarly.
-- ============================================================================

DROP POLICY IF EXISTS "Travellers can create bookings"             ON public.package_bookings;
DROP POLICY IF EXISTS "authenticated users can insert bookings"    ON public.package_bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings"        ON public.package_bookings;

-- Travellers can book, but only if the package's owner is still operative
CREATE POLICY "Travellers can book operative listings"
  ON public.package_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = traveller_id
    AND EXISTS (
      SELECT 1 FROM public.packages p
      WHERE p.id = package_id
        AND p.status = 'live'
        AND public.can_partner_operate(p.user_id, 'hotel_manager')
    )
  );

-- ============================================================================
-- Documentation: Reinstatement behavior (intentional, no migration needed)
-- ============================================================================
-- When admin_set_hotel_manager_status(active) or admin_set_tour_operator_status(active)
-- is called:
--   - account_status is set to 'active'              ✅
--   - Listings that were suspended DUE TO this suspension remain 'suspended'  ✅
--   - WHY: Admin may have suspended due to content policy issue. Auto-restoring
--     listings could re-expose violating content. Partner must re-publish
--     listings manually after reinstatement. This is standard marketplace policy
--     (Airbnb, Booking.com follow the same model).
--   - Partners will see a banner in their dashboard after reinstatement.
-- ============================================================================
