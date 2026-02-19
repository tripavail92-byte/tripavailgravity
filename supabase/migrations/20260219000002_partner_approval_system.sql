-- ============================================================================
-- Partner Verification & Approval System
-- Date: 2026-02-19
-- Designed after Airbnb / Booking.com partner onboarding architecture
--
-- State Machine:
--   incomplete → pending → approved
--                       → rejected → pending (re-submit)
--   approved   → suspended (policy violation)
--   suspended  → approved (reinstated)
--
-- New objects:
--   TABLE  partner_verification_requests   - immutable queue with full history
--   TABLE  notifications                   - in-app notification bell
--   RPC    admin_approve_partner           - approve + activate + notify
--   RPC    admin_reject_partner            - reject + reason + notify
--   RPC    admin_request_partner_info      - ask for more info + notify
--   RPC    partner_submit_verification     - partner submits / re-submits
--   RPC    mark_notifications_read         - partner marks bell read
-- ============================================================================

-- ============================================================================
-- 1. partner_verification_requests table
--    Immutable history: every re-submission creates a NEW row (new version).
--    Admins can always see every submission and decision.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partner_verification_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_type    TEXT        NOT NULL CHECK (partner_type IN ('hotel_manager', 'tour_operator')),
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'info_requested')),
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID        REFERENCES public.admin_users(id) ON DELETE SET NULL,
  decision_reason TEXT,
  -- Snapshot of partner profile data at the time of submission (immutable record)
  submission_data JSONB       NOT NULL DEFAULT '{}',
  -- Increments on each re-submission so history is traceable
  version         INTEGER     NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS pvr_user_id_idx        ON public.partner_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS pvr_status_idx         ON public.partner_verification_requests(status);
CREATE INDEX IF NOT EXISTS pvr_partner_type_idx   ON public.partner_verification_requests(partner_type);
CREATE INDEX IF NOT EXISTS pvr_submitted_at_idx   ON public.partner_verification_requests(submitted_at DESC);

ALTER TABLE public.partner_verification_requests ENABLE ROW LEVEL SECURITY;

-- Partners can read their own requests
DROP POLICY IF EXISTS "Partners can read own requests" ON public.partner_verification_requests;
CREATE POLICY "Partners can read own requests"
  ON public.partner_verification_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all requests
DROP POLICY IF EXISTS "Admins can read all requests" ON public.partner_verification_requests;
CREATE POLICY "Admins can read all requests"
  ON public.partner_verification_requests
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Only SECURITY DEFINER functions (RPCs) can insert/update — no direct writes
DROP POLICY IF EXISTS "Service can manage requests" ON public.partner_verification_requests;
CREATE POLICY "Service can manage requests"
  ON public.partner_verification_requests
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. notifications table
--    Written atomically inside approval/rejection RPCs (same transaction).
--    Partner frontend polls or subscribes via Supabase Realtime.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,   -- e.g. 'verification_approved', 'verification_rejected', 'info_requested'
  title      TEXT        NOT NULL,
  body       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('UTC', NOW())
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx      ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read (UPDATE read only)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role / SECURITY DEFINER functions write notifications
DROP POLICY IF EXISTS "Service can write notifications" ON public.notifications;
CREATE POLICY "Service can write notifications"
  ON public.notifications
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Admins can read all notifications (for support/debugging)
DROP POLICY IF EXISTS "Admins can read all notifications" ON public.notifications;
CREATE POLICY "Admins can read all notifications"
  ON public.notifications
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- 3. Expand admin_action_logs entity_type to include 'verification'
-- ============================================================================

DO $$
DECLARE c RECORD;
BEGIN
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

-- ============================================================================
-- 4. RPC: partner_submit_verification
--    Called by the partner when they submit or re-submit their application.
--    Creates a new versioned row, sets verification_status = 'pending'.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.partner_submit_verification(
  p_partner_type    TEXT,
  p_submission_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_version    INTEGER;
  v_request_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_partner_type NOT IN ('hotel_manager', 'tour_operator') THEN
    RAISE EXCEPTION 'Invalid partner_type: %', p_partner_type;
  END IF;

  -- Calculate next version number for this user+type combo
  SELECT COALESCE(MAX(version), 0) + 1
  INTO v_version
  FROM public.partner_verification_requests
  WHERE user_id = v_user_id AND partner_type = p_partner_type;

  -- Create the immutable submission record
  INSERT INTO public.partner_verification_requests (
    user_id, partner_type, status, submission_data, version
  )
  VALUES (v_user_id, p_partner_type, 'pending', p_submission_data, v_version)
  RETURNING id INTO v_request_id;

  -- Update verification_status on user_roles to 'pending'
  UPDATE public.user_roles
  SET verification_status = 'pending'
  WHERE user_id = v_user_id AND role_type = p_partner_type;

  -- Log to verification activity
  INSERT INTO public.verification_activity_logs (
    user_id, role, event_type, status, details
  ) VALUES (
    v_user_id,
    p_partner_type,
    'status_change',
    'pending',
    jsonb_build_object(
      'request_id', v_request_id,
      'version', v_version,
      'action', 'partner_submitted'
    )
  );

  RETURN v_request_id;
END;
$$;

-- ============================================================================
-- 5. RPC: admin_approve_partner
--    Admin approves a partner. Sets verification_status = 'approved',
--    activates the role, logs to audit trail, sends in-app notification.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_approve_partner(
  p_user_id     UUID,
  p_partner_type TEXT,
  p_request_id  UUID
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
  -- Admin guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Capture previous state for audit
  SELECT verification_status INTO v_prev_status
  FROM public.user_roles
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  -- Update verification_status and activate the role
  UPDATE public.user_roles
  SET
    verification_status = 'approved',
    is_active = true
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  -- Stamp the request row
  UPDATE public.partner_verification_requests
  SET
    status      = 'approved',
    reviewed_at = TIMEZONE('UTC', NOW()),
    reviewed_by = v_admin_id
  WHERE id = p_request_id;

  -- Admin audit log
  PERFORM public.admin_log_action(
    'verification',
    p_user_id,
    'partner_approved',
    'Partner application approved',
    jsonb_build_object('verification_status', v_prev_status, 'partner_type', p_partner_type),
    jsonb_build_object('verification_status', 'approved', 'is_active', true, 'request_id', p_request_id)
  );

  -- Verification activity log
  INSERT INTO public.verification_activity_logs (
    user_id, role, event_type, status, details
  ) VALUES (
    p_user_id,
    p_partner_type,
    'status_change',
    'success',
    jsonb_build_object(
      'request_id', p_request_id,
      'reviewed_by', v_admin_id,
      'action', 'approved'
    )
  );

  -- In-app notification
  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    p_user_id,
    'verification_approved',
    '🎉 Your application has been approved!',
    CASE p_partner_type
      WHEN 'hotel_manager' THEN 'Congratulations! Your hotel manager account is now active. You can start listing your properties.'
      WHEN 'tour_operator' THEN 'Congratulations! Your tour operator account is now active. You can start publishing your tours.'
      ELSE 'Your partner account has been approved.'
    END
  );
END;
$$;

-- ============================================================================
-- 6. RPC: admin_reject_partner
--    Admin rejects a partner application with a mandatory reason.
--    Partner can re-submit after reading the reason.
-- ============================================================================

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
  v_admin_id    UUID := auth.uid();
  v_prev_status TEXT;
BEGIN
  -- Admin guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Rejection reason must be at least 10 characters';
  END IF;

  -- Capture previous state
  SELECT verification_status INTO v_prev_status
  FROM public.user_roles
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  -- Update verification_status (leave is_active as-is so partner can resubmit)
  UPDATE public.user_roles
  SET verification_status = 'rejected'
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  -- Stamp the request row with decision
  UPDATE public.partner_verification_requests
  SET
    status          = 'rejected',
    reviewed_at     = TIMEZONE('UTC', NOW()),
    reviewed_by     = v_admin_id,
    decision_reason = p_reason
  WHERE id = p_request_id;

  -- Admin audit log
  PERFORM public.admin_log_action(
    'verification',
    p_user_id,
    'partner_rejected',
    p_reason,
    jsonb_build_object('verification_status', v_prev_status, 'partner_type', p_partner_type),
    jsonb_build_object('verification_status', 'rejected', 'request_id', p_request_id)
  );

  -- Verification activity log
  INSERT INTO public.verification_activity_logs (
    user_id, role, event_type, status, details
  ) VALUES (
    p_user_id,
    p_partner_type,
    'status_change',
    'failure',
    jsonb_build_object(
      'request_id', p_request_id,
      'reviewed_by', v_admin_id,
      'action', 'rejected',
      'reason', p_reason
    )
  );

  -- In-app notification with the specific rejection reason
  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    p_user_id,
    'verification_rejected',
    'Application Requires Attention',
    'Your application could not be approved at this time. Reason: ' || p_reason || ' — Please update your information and re-submit.'
  );
END;
$$;

-- ============================================================================
-- 7. RPC: admin_request_partner_info
--    Admin requests more information. Partner sees the message and can resubmit.
-- ============================================================================

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
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_message IS NULL OR LENGTH(TRIM(p_message)) < 10 THEN
    RAISE EXCEPTION 'Info request message must be at least 10 characters';
  END IF;

  -- Mark request as info_requested (not rejected — partner can resubmit)
  UPDATE public.partner_verification_requests
  SET
    status          = 'info_requested',
    reviewed_at     = TIMEZONE('UTC', NOW()),
    reviewed_by     = v_admin_id,
    decision_reason = p_message
  WHERE id = p_request_id;

  -- Keep verification_status as 'pending' in user_roles (still in review)

  -- Admin audit log
  PERFORM public.admin_log_action(
    'verification',
    p_user_id,
    'partner_info_requested',
    p_message,
    jsonb_build_object('partner_type', p_partner_type),
    jsonb_build_object('status', 'info_requested', 'request_id', p_request_id)
  );

  -- In-app notification
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
-- 8. RPC: mark_notifications_read
--    Partner calls this to mark their bell notifications as read.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_notifications_read(
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count   INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_notification_ids IS NULL THEN
    -- Mark ALL unread notifications for this user
    UPDATE public.notifications
    SET read = true
    WHERE user_id = v_user_id AND read = false;
  ELSE
    -- Mark only specified notifications (must belong to this user)
    UPDATE public.notifications
    SET read = true
    WHERE id = ANY(p_notification_ids)
      AND user_id = v_user_id
      AND read = false;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- 9. Grant execute on RPCs to authenticated role
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.partner_submit_verification(TEXT, JSONB)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_partner(UUID, TEXT, UUID)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_partner(UUID, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_request_partner_info(UUID, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(UUID[])            TO authenticated;
