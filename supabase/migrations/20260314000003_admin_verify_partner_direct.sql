-- ============================================================
-- admin_verify_partner_direct
-- Date: 2026-03-14
--
-- Allows an admin to directly approve (verify) a partner from
-- the All Partners table without needing a pending request_id.
-- Handles two cases:
--   a) Partner has an existing pending/info_requested request → approves it
--   b) No open request → creates a synthetic approved record
--
-- Always:
--   - Sets user_roles.verification_status = 'approved'
--   - Logs to admin_action_logs
--   - Sends in-app notification to the partner
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_verify_partner_direct(
  p_user_id      UUID,
  p_partner_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id   UUID := auth.uid();
  v_request_id UUID;
BEGIN
  -- Auth guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_partner_type NOT IN ('hotel_manager', 'tour_operator') THEN
    RAISE EXCEPTION 'Invalid partner_type: %', p_partner_type;
  END IF;

  -- Try to find an existing open request to approve
  SELECT id INTO v_request_id
  FROM public.partner_verification_requests
  WHERE user_id = p_user_id
    AND partner_type = p_partner_type
    AND status IN ('pending', 'under_review', 'info_requested')
  ORDER BY submitted_at DESC
  LIMIT 1;

  IF v_request_id IS NOT NULL THEN
    -- Approve the existing request
    UPDATE public.partner_verification_requests
    SET
      status          = 'approved',
      reviewed_at     = TIMEZONE('UTC', NOW()),
      reviewed_by     = v_admin_id,
      decision_reason = NULL
    WHERE id = v_request_id;
  ELSE
    -- No open request — check if already approved
    IF EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = p_user_id
        AND role_type = p_partner_type
        AND verification_status = 'approved'
    ) THEN
      RAISE EXCEPTION 'Partner is already verified';
    END IF;

    -- Create a synthetic approved record for audit trail
    INSERT INTO public.partner_verification_requests
      (user_id, partner_type, status, reviewed_at, reviewed_by, submission_data, version)
    VALUES (
      p_user_id,
      p_partner_type,
      'approved',
      TIMEZONE('UTC', NOW()),
      v_admin_id,
      '{"note": "Direct admin verification — no submission on file"}',
      1
    )
    RETURNING id INTO v_request_id;
  END IF;

  -- Sync verification_status on user_roles
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
    'partner_verified_direct',
    'Direct admin verification',
    jsonb_build_object(
      'partner_type', p_partner_type,
      'request_id',   v_request_id
    )
  );

  -- In-app notification to the partner
  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    p_user_id,
    'partner_approved',
    'Application Approved 🎉',
    'Congratulations! Your ' || replace(p_partner_type, '_', ' ') ||
    ' account has been verified. You can now start listing on TripAvail.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_partner_direct(UUID, TEXT) TO authenticated;
