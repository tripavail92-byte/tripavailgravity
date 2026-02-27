-- ============================================================================
-- KYC Admin Enforcement: Revoke + Re-review + Suspension Cascade
-- Date: 2026-02-28
--
-- Problem: once an operator is approved, admin had no way to act on violations.
--
-- New capabilities:
--   1. 'revoked' status on kyc_sessions
--      - Admin can revoke a previously approved session (violation, fraud, etc.)
--      - Trigger: clears kyc_verified_* on profile, resets verification_status
--        to 'pending' (operator must re-submit — not deleted, just unverified)
--   2. 're_review' status transition
--      - Admin can push an approved/rejected session back to pending_admin_review
--        (e.g. new info came in, want a second look)
--   3. Admin enforcement RPC: admin_enforce_kyc_action
--      - Single entry point for all post-approval actions
--      - Validates admin role, requires reason, logs to kyc_audit_log
--      - Supports: revoke | re_review | suspend_account | reinstate_account
-- ============================================================================

BEGIN;

-- ─── 1. Expand kyc_sessions.status to include 'revoked' ─────────────────────

ALTER TABLE public.kyc_sessions
  DROP CONSTRAINT IF EXISTS kyc_sessions_status_check;

ALTER TABLE public.kyc_sessions
  ADD CONSTRAINT kyc_sessions_status_check
  CHECK (status IN (
    'pending',
    'uploading',
    'processing',
    'pending_admin_review',
    'approved',
    'rejected',
    'failed',
    'expired',
    'revoked'
  ));

-- ─── 2. Update trigger: handle 'revoked' and 're-open to pending_admin_review' ─

CREATE OR REPLACE FUNCTION public.kyc_session_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- ── a) Always write audit log ─────────────────────────────────────────────
  INSERT INTO public.kyc_audit_log (session_id, user_id, old_status, new_status, changed_by, notes)
  VALUES (
    NEW.id,
    NEW.user_id,
    OLD.status,
    NEW.status,
    NEW.reviewed_by,
    NEW.review_notes
  );

  -- ── b) APPROVED: promote identity → operator profile ─────────────────────
  IF NEW.status = 'approved' AND NEW.role = 'tour_operator' THEN
    UPDATE public.tour_operator_profiles
    SET
      current_kyc_session_id   = NEW.id,
      kyc_verified_name        = NEW.full_name,
      kyc_verified_cnic        = NEW.cnic_number,
      kyc_verified_dob         = NEW.date_of_birth,
      kyc_verified_gender      = NEW.gender,
      kyc_verified_father_name = NEW.father_name,
      kyc_verified_at          = COALESCE(NEW.reviewed_at, now()),
      kyc_rejection_reason     = NULL
    WHERE user_id = NEW.user_id;

    UPDATE public.user_roles
    SET verification_status = 'approved'
    WHERE user_id = NEW.user_id AND role_type = 'tour_operator';
  END IF;

  IF NEW.status = 'approved' AND NEW.role = 'hotel_manager' THEN
    UPDATE public.hotel_manager_profiles SET updated_at = now() WHERE user_id = NEW.user_id;
    UPDATE public.user_roles
    SET verification_status = 'approved'
    WHERE user_id = NEW.user_id AND role_type = 'hotel_manager';
  END IF;

  -- ── c) REJECTED: record reason, mark user_roles ───────────────────────────
  IF NEW.status = 'rejected' AND NEW.role = 'tour_operator' THEN
    UPDATE public.tour_operator_profiles
    SET kyc_rejection_reason = COALESCE(NEW.review_notes, NEW.failure_reason, 'Rejected by admin')
    WHERE user_id = NEW.user_id;

    UPDATE public.user_roles
    SET verification_status = 'rejected'
    WHERE user_id = NEW.user_id AND role_type = 'tour_operator'
      AND verification_status NOT IN ('approved');
  END IF;

  IF NEW.status = 'rejected' AND NEW.role = 'hotel_manager' THEN
    UPDATE public.user_roles
    SET verification_status = 'rejected'
    WHERE user_id = NEW.user_id AND role_type = 'hotel_manager'
      AND verification_status NOT IN ('approved');
  END IF;

  -- ── d) REVOKED: strip verified identity, require re-submission ───────────
  -- This is the "violation / fraud / document expired" path.
  -- The operator's account stays intact but they must re-submit KYC.
  IF NEW.status = 'revoked' THEN
    IF NEW.role = 'tour_operator' THEN
      UPDATE public.tour_operator_profiles
      SET
        current_kyc_session_id   = NULL,
        kyc_verified_name        = NULL,
        kyc_verified_cnic        = NULL,
        kyc_verified_dob         = NULL,
        kyc_verified_gender      = NULL,
        kyc_verified_father_name = NULL,
        kyc_verified_at          = NULL,
        kyc_rejection_reason     = COALESCE(NEW.review_notes, 'KYC revoked by admin')
      WHERE user_id = NEW.user_id;
    END IF;

    -- Reset verification_status to 'pending' so operator can re-submit
    -- (use 'pending' not 'rejected' — revoke means "try again", not "barred")
    UPDATE public.user_roles
    SET verification_status = 'pending'
    WHERE user_id = NEW.user_id
      AND role_type = NEW.role;

    -- Send in-app notification
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.user_id,
      'kyc_revoked',
      '⚠️ Your identity verification has been revoked',
      'Your KYC verification was revoked by admin. Reason: ' ||
        COALESCE(NEW.review_notes, 'Policy violation') ||
        '. Please re-submit your documents to restore access.'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── e) RE-OPENED to pending_admin_review ─────────────────────────────────
  -- Admin pushed an old approved/rejected session back for second look.
  -- No profile change needed — just log (already done above).
  -- (Nothing else to do here — the audit entry is sufficient.)

  RETURN NEW;
END;
$$;

-- Re-attach trigger (replaces previous version)
DROP TRIGGER IF EXISTS kyc_session_status_changed_trg ON public.kyc_sessions;
CREATE TRIGGER kyc_session_status_changed_trg
  AFTER UPDATE OF status ON public.kyc_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.kyc_session_status_changed();

-- ─── 3. RPC: admin_enforce_kyc_action ────────────────────────────────────────
-- Single entry point for all post-approval admin actions.
-- Validates admin, requires reason, updates session, trigger handles rest.

CREATE OR REPLACE FUNCTION public.admin_enforce_kyc_action(
  p_session_id uuid,
  p_action     text,   -- 'revoke' | 're_review' | 'suspend_account' | 'reinstate_account'
  p_reason     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id  uuid := auth.uid();
  v_session   RECORD;
BEGIN
  -- Auth guard
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Reason required (min 5 chars)
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 5 THEN
    RAISE EXCEPTION 'A reason of at least 5 characters is required';
  END IF;

  -- Load session
  SELECT * INTO v_session FROM public.kyc_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'KYC session not found: %', p_session_id;
  END IF;

  IF p_action = 'revoke' THEN
    -- Can revoke any approved session
    IF v_session.status != 'approved' THEN
      RAISE EXCEPTION 'Can only revoke approved sessions (current status: %)', v_session.status;
    END IF;
    UPDATE public.kyc_sessions
    SET status = 'revoked', reviewed_by = v_admin_id, reviewed_at = now(), review_notes = TRIM(p_reason)
    WHERE id = p_session_id;

  ELSIF p_action = 're_review' THEN
    -- Re-open approved/rejected/revoked for another look
    IF v_session.status NOT IN ('approved', 'rejected', 'revoked', 'failed') THEN
      RAISE EXCEPTION 'Can only re-open terminal sessions for review (current status: %)', v_session.status;
    END IF;
    UPDATE public.kyc_sessions
    SET status = 'pending_admin_review', reviewed_by = v_admin_id, reviewed_at = now(), review_notes = TRIM(p_reason)
    WHERE id = p_session_id;

  ELSIF p_action = 'suspend_account' THEN
    -- Suspend the operator account (account_status on profile)
    IF v_session.role = 'tour_operator' THEN
      PERFORM public.admin_set_tour_operator_status(v_session.user_id::text, 'suspended', TRIM(p_reason));
    ELSIF v_session.role = 'hotel_manager' THEN
      PERFORM public.admin_set_hotel_manager_status(v_session.user_id::text, 'suspended', TRIM(p_reason));
    ELSE
      RAISE EXCEPTION 'Unknown role: %', v_session.role;
    END IF;
    -- Also log to kyc_audit_log for traceability
    INSERT INTO public.kyc_audit_log (session_id, user_id, old_status, new_status, changed_by, notes)
    VALUES (p_session_id, v_session.user_id, v_session.status, v_session.status || ':account_suspended', v_admin_id, TRIM(p_reason));

  ELSIF p_action = 'reinstate_account' THEN
    IF v_session.role = 'tour_operator' THEN
      PERFORM public.admin_set_tour_operator_status(v_session.user_id::text, 'active', TRIM(p_reason));
    ELSIF v_session.role = 'hotel_manager' THEN
      PERFORM public.admin_set_hotel_manager_status(v_session.user_id::text, 'active', TRIM(p_reason));
    ELSE
      RAISE EXCEPTION 'Unknown role: %', v_session.role;
    END IF;
    INSERT INTO public.kyc_audit_log (session_id, user_id, old_status, new_status, changed_by, notes)
    VALUES (p_session_id, v_session.user_id, v_session.status, v_session.status || ':account_reinstated', v_admin_id, TRIM(p_reason));

  ELSE
    RAISE EXCEPTION 'Unknown action: %. Must be: revoke, re_review, suspend_account, reinstate_account', p_action;
  END IF;

END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_enforce_kyc_action(uuid, text, text) TO authenticated;

COMMIT;
