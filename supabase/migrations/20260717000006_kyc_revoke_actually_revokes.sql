-- =====================================================================
-- SECURITY: make "Revoke KYC" actually revoke something.
--
-- THE HOLE: admin_enforce_kyc_action('revoke') (20260228000003:199-206) only ever flipped
-- kyc_sessions.status to 'revoked'. Everything that made revocation MEAN anything lived in the
-- kyc_session_status_changed trigger's revoked branch (20260228000003:114-136):
--     * clear the profile's kyc_verified_* identity record
--     * reset user_roles.verification_status so the partner stops being able to trade
--     * notify the partner
-- That branch was silently dropped when 20260314000001 CREATE OR REPLACEd the function body
-- (grep 'revoked' in that file returns nothing), and 20260717000004 did not restore it.
--
-- So today: an admin revokes a partner's identity — the deliberate act of saying "this person is
-- not who they claimed" — and the partner keeps their approved status, keeps a full verified
-- identity record on their profile, keeps publishing, keeps taking bookings, and is never told.
-- The /admin/kyc Revoked tab lists partners it believes it stopped. They are still trading.
--
-- WHY THE FIX GOES HERE AND NOT BACK IN THE TRIGGER: 20260717000004 made /admin/partners the
-- single writer of user_roles.verification_status, because a trigger writing it meant approving a
-- CNIC photo silently granted publish rights. That reasoning is about IMPLICIT writes — a trigger
-- firing invisibly off a status column. It does not apply to an admin deliberately invoking an
-- is_admin-guarded RPC with a mandatory reason. Revocation is an explicit, audited, human decision;
-- letting the partner trade on afterwards is not "respecting the single writer", it is a hole.
-- So the demotion moves INTO the enforcement RPC: still exactly one place, still explicit, still
-- audited, and now atomic with the revocation rather than depending on a trigger side effect.
--
-- WHY 'incomplete' AND NOT 'pending': the original code chose 'pending' with the comment "revoke
-- means try again, not barred". That was right in spirit but 20260713000001 later redefined the
-- state machine — 'pending' now means "submitted, awaiting review", which would put the partner in
-- a review queue with nothing to review and show them "we are reviewing you" when nobody is.
-- 'incomplete' is the state that means "you need to complete verification", which is exactly true
-- after a revocation: the partner-facing screen says "Finish your verification" with a CTA, and
-- the admin's needs-action band picks them up. Not 'rejected' — revocation is not a bar, and the
-- partner may legitimately re-verify.
-- =====================================================================

BEGIN;

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

    -- ── everything below used to be the trigger's job, and has been doing nothing since
    --    20260314000001 dropped it ──────────────────────────────────────────────────────

    -- 1. Void the verified identity record. These columns are the "immutable, admin-reviewed
    --    identity" — leaving them populated after a revocation means the profile still asserts a
    --    verified name/CNIC/DOB for someone whose identity was just withdrawn.
    --    tour_operator_profiles only: hotel_manager_profiles has no kyc_verified_* columns (the
    --    promotion that writes them is gated `IF NEW.role = 'tour_operator'`), which is exactly why
    --    admin_get_partner_evidence reads kyc_sessions rather than the profile.
    IF v_session.role = 'tour_operator' THEN
      UPDATE public.tour_operator_profiles
      SET
        current_kyc_session_id   = NULL,
        kyc_verified_name        = NULL,
        kyc_verified_cnic        = NULL,
        kyc_verified_dob         = NULL,
        kyc_verified_gender      = NULL,
        kyc_verified_father_name = NULL,
        kyc_verified_at          = NULL,
        kyc_rejection_reason     = COALESCE(NULLIF(TRIM(p_reason), ''), 'KYC revoked by admin')
      WHERE user_id = v_session.user_id;
    END IF;

    -- 2. Stop them trading. THE POINT OF THE WHOLE MIGRATION.
    --    can_partner_operate() reads exactly this column, so without this the revoked partner
    --    keeps publishing.
    UPDATE public.user_roles
    SET verification_status = 'incomplete'
    WHERE user_id   = v_session.user_id
      AND role_type = v_session.role
      -- Only demote someone who is actually approved: a partner already 'incomplete' or 'rejected'
      -- must not be silently rewritten. NOTE this does NOT make revoke re-runnable — the status
      -- guard above raises long before this predicate is reached. Fixing an already-revoked partner
      -- needs the backfill at the bottom of this file, not a second revoke.
      AND verification_status = 'approved';

    -- 3. Tell them. A partner who quietly stops being able to publish, with no message, files a
    --    support ticket — or worse, does not notice until a booking fails.
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      v_session.user_id,
      'kyc_revoked',
      'Identity verification withdrawn',
      'Your identity verification has been withdrawn and your listings are paused. Reason: ' ||
      TRIM(p_reason) || '. You can re-verify from your dashboard.'
    );

    -- 4. Audit trail beyond the trigger's kyc_audit_log row, in the log partners cannot write.
    INSERT INTO public.admin_action_logs
      (admin_id, entity_type, entity_id, action_type, reason, new_state)
    VALUES (
      v_admin_id,
      'partner',
      v_session.user_id,
      'kyc_revoked',
      TRIM(p_reason),
      jsonb_build_object(
        'partner_type',        v_session.role,
        'session_id',          p_session_id,
        'verification_status', 'incomplete'
      )
    );

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


-- ---------------------------------------------------------------------
-- THE EXISTING VICTIMS — run this. This migration stops NEW cases; it changes no data, so anyone
-- already revoked-but-still-trading stays that way until you act.
--
-- STEP 1 — WHO (read-only). Every row is a partner whose identity was revoked and who is STILL
-- approved to trade.
-- ---------------------------------------------------------------------
-- SELECT ur.user_id, u.email, ur.role_type, ur.verification_status,
--        ks.id AS session_id, ks.reviewed_at AS revoked_at, ks.review_notes AS revoke_reason
-- FROM public.user_roles ur
-- JOIN public.users u ON u.id = ur.user_id
-- JOIN LATERAL (
--   SELECT s.* FROM public.kyc_sessions s
--    WHERE s.user_id = ur.user_id AND s.role = ur.role_type
--    ORDER BY s.created_at DESC LIMIT 1
-- ) ks ON TRUE
-- WHERE ur.verification_status = 'approved'
--   AND ks.status = 'revoked';
--
-- STEP 2 — FIX THEM (destructive).
-- NOTE: you cannot simply "revoke them again". admin_enforce_kyc_action's revoke branch guards on
-- `IF v_session.status != 'approved' THEN RAISE`, so re-revoking an already-revoked session throws —
-- and AdminKYCPage only renders the Revoke button for approved sessions (availableFor: ['approved']),
-- so the UI will not offer it either. This backfill does by hand exactly what the fixed RPC now does
-- automatically, for the rows step 1 returned.
/*
BEGIN;

CREATE TEMP TABLE _revoked_but_trading AS
SELECT ur.user_id, ur.role_type
FROM public.user_roles ur
JOIN LATERAL (
  SELECT s.* FROM public.kyc_sessions s
   WHERE s.user_id = ur.user_id AND s.role = ur.role_type
   ORDER BY s.created_at DESC LIMIT 1
) ks ON TRUE
WHERE ur.verification_status = 'approved'
  AND ks.status = 'revoked';

SELECT count(*) AS partners_to_demote FROM _revoked_but_trading;   -- sanity-check against step 1

-- Void the verified identity record (operators only — managers have no kyc_verified_* columns).
UPDATE public.tour_operator_profiles p
SET current_kyc_session_id = NULL, kyc_verified_name = NULL, kyc_verified_cnic = NULL,
    kyc_verified_dob = NULL, kyc_verified_gender = NULL, kyc_verified_father_name = NULL,
    kyc_verified_at = NULL,
    kyc_rejection_reason = COALESCE(kyc_rejection_reason, 'KYC revoked by admin (backfill)')
FROM _revoked_but_trading r
WHERE p.user_id = r.user_id AND r.role_type = 'tour_operator';

-- Stop them trading.
UPDATE public.user_roles ur
SET verification_status = 'incomplete'
FROM _revoked_but_trading r
WHERE ur.user_id = r.user_id AND ur.role_type = r.role_type
  AND ur.verification_status = 'approved';

-- Tell them.
INSERT INTO public.notifications (user_id, type, title, body)
SELECT r.user_id, 'kyc_revoked', 'Identity verification withdrawn',
       'Your identity verification has been withdrawn and your listings are paused. You can re-verify from your dashboard.'
FROM _revoked_but_trading r;

-- Expect 0.
SELECT count(*) AS still_trading_on_a_revoked_identity
FROM public.user_roles ur
JOIN LATERAL (
  SELECT s.* FROM public.kyc_sessions s
   WHERE s.user_id = ur.user_id AND s.role = ur.role_type
   ORDER BY s.created_at DESC LIMIT 1
) ks ON TRUE
WHERE ur.verification_status = 'approved' AND ks.status = 'revoked';

-- Happy? COMMIT;   Anything unexpected? ROLLBACK;
ROLLBACK;   -- <- deliberately the default.
*/
