-- ============================================================
-- admin_request_kyc_reupload
-- Date: 2026-03-14
--
-- Allows an admin to mark a KYC session as rejected (with a
-- message to the user) so the user is prompted to re-upload
-- their identity documents.
--
-- How the frontend handles this automatically:
--   - PartnerVerificationHub detects kycStatus='rejected'
--   - Shows red banner with review_notes (the admin's message)
--   - User can start a new upload session immediately
--
-- The DB trigger (20260314000001) auto-syncs:
--   tour_operator_profiles.verification_documents.kycStatus → 'rejected'
--   user_roles.verification_status → 'rejected'
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_request_kyc_reupload(
  p_session_id UUID,
  p_message    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_user_id  UUID;
  v_prev_status TEXT;
BEGIN
  -- Auth guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_message IS NULL OR LENGTH(TRIM(p_message)) < 10 THEN
    RAISE EXCEPTION 'Message must be at least 10 characters — the user will see this as an instruction';
  END IF;

  -- Fetch user_id + current status
  SELECT user_id, status INTO v_user_id, v_prev_status
  FROM public.kyc_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'KYC session not found';
  END IF;

  -- Cannot reset a session that is already pending/uploading/processing
  -- (user is mid-upload — don't interrupt)
  IF v_prev_status IN ('pending', 'uploading', 'processing') THEN
    RAISE EXCEPTION 'Session is still active (status: %). Wait for OCR to complete before requesting re-upload.', v_prev_status;
  END IF;

  -- Mark session as rejected with admin's message as review_notes.
  -- The trigger auto-syncs kycStatus on tour_operator_profiles and
  -- verification_status on user_roles to 'rejected'.
  UPDATE public.kyc_sessions
  SET
    status       = 'rejected',
    review_notes = p_message,
    reviewed_by  = v_admin_id,
    reviewed_at  = TIMEZONE('UTC', NOW())
  WHERE id = p_session_id;

  -- Audit log
  INSERT INTO public.admin_action_logs
    (admin_id, entity_type, entity_id, action_type, reason, previous_state, new_state)
  VALUES (
    v_admin_id,
    'user',
    v_user_id,
    'kyc_reupload_requested',
    p_message,
    jsonb_build_object('status', v_prev_status),
    jsonb_build_object('status', 'rejected', 'review_notes', p_message)
  );

  -- In-app notification to the user (they see the exact admin message + CTA)
  INSERT INTO public.notifications (user_id, type, title, body)
  VALUES (
    v_user_id,
    'verification_rejected',
    'Action Required: Re-upload Documents',
    'An admin has reviewed your identity documents and requires you to re-upload. Reason: ' ||
    p_message ||
    ' Please log in and re-upload your CNIC.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_request_kyc_reupload(UUID, TEXT) TO authenticated;
