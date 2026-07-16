-- =====================================================================
-- admin_verify_partner_direct v2 — make blind approval say so, and stop it failing silently.
--
-- WHAT WAS WRONG WITH v1 (20260314000003):
--
-- 1. SILENT FAILURE. The `UPDATE public.user_roles SET verification_status='approved'` (:84-86) is
--    unguarded. If the user_roles row is missing, it matches ZERO rows — and the function carries
--    on: it writes the audit log, sends the partner a "Application Approved 🎉" notification, and
--    returns cleanly, so the UI toasts success. The admin believes they approved someone who is
--    still blocked, and nothing anywhere records that it did not happen. GET DIAGNOSTICS + RAISE.
--
-- 2. NO REASON, NO ACKNOWLEDGEMENT. This RPC approves a partner with NO DOCUMENTS ON FILE — it
--    literally writes 'Direct admin verification — no submission on file' into the record. That is
--    a legitimate power (a partner verified out-of-band still needs turning on), but v1 took no
--    reason and recorded nothing about what the admin had actually seen. Approving a real
--    submission and vouching blind for a stranger were the same call, with the same audit trail.
--    v2 requires a reason and an explicit evidence acknowledgement, and logs both.
--
-- p_evidence_ack values — what the admin is attesting they had in front of them:
--    'submission' — a verification submission on file, reviewed
--    'kyc_only'   — identity verified, but no business documents submitted
--    'none'       — nothing on file; vouching for this partner from outside the platform
--
-- SIGNATURE BREAK: cannot be CREATE OR REPLACE — adding parameters creates an ambiguous overload
-- against the 2-arg version. Safe: exactly one caller (AdminPartnersPage.tsx:1317; verified by grep
-- across packages/web/src, supabase/functions and packages/python-worker).
-- DEPLOY THIS SQL BEFORE THE CLIENT. In the gap the old button 404s — a visible, obvious error,
-- which is the right failure mode.
-- =====================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.admin_verify_partner_direct(UUID, TEXT);

CREATE FUNCTION public.admin_verify_partner_direct(
  p_user_id      UUID,
  p_partner_type TEXT,
  p_reason       TEXT,
  p_evidence_ack TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id   UUID := auth.uid();
  v_request_id UUID;
  v_rows       INTEGER;
BEGIN
  -- Auth guard
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_partner_type NOT IN ('hotel_manager', 'tour_operator') THEN
    RAISE EXCEPTION 'Invalid partner_type: %', p_partner_type;
  END IF;

  IF p_evidence_ack NOT IN ('submission', 'kyc_only', 'none') THEN
    RAISE EXCEPTION 'Invalid evidence_ack: % (expected submission | kyc_only | none)', p_evidence_ack;
  END IF;

  -- A reason is mandatory. This RPC can approve a partner nobody has checked; the least it can do
  -- is record why. 12 chars matches the UI's own minimum (AdminPartnersPage.tsx:108) — v1's
  -- siblings used 10, which meant the UI and the RPC disagreed about what was acceptable.
  IF p_reason IS NULL OR length(trim(p_reason)) < 12 THEN
    RAISE EXCEPTION 'A reason of at least 12 characters is required to verify a partner directly';
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
    UPDATE public.partner_verification_requests
    SET
      status          = 'approved',
      reviewed_at     = TIMEZONE('UTC', NOW()),
      reviewed_by     = v_admin_id,
      decision_reason = p_reason
    WHERE id = v_request_id;
  ELSE
    IF EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = p_user_id
        AND role_type = p_partner_type
        AND verification_status = 'approved'
    ) THEN
      RAISE EXCEPTION 'Partner is already verified';
    END IF;

    -- Synthetic record so the approval is traceable even with nothing submitted.
    INSERT INTO public.partner_verification_requests
      (user_id, partner_type, status, reviewed_at, reviewed_by, decision_reason, submission_data, version)
    VALUES (
      p_user_id,
      p_partner_type,
      'approved',
      TIMEZONE('UTC', NOW()),
      v_admin_id,
      p_reason,
      jsonb_build_object(
        'note',         'Direct admin verification — no submission on file',
        'evidence_ack', p_evidence_ack
      ),
      1
    )
    RETURNING id INTO v_request_id;
  END IF;

  -- Sync verification_status on user_roles. THIS is the write that actually lets them trade —
  -- can_partner_operate() reads exactly this column — so it must not be allowed to no-op.
  UPDATE public.user_roles
  SET verification_status = 'approved'
  WHERE user_id = p_user_id AND role_type = p_partner_type;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    -- v1 sailed past this and reported success. Raising rolls back the request row and the
    -- synthetic record too, so the admin sees a real error instead of a phantom approval.
    RAISE EXCEPTION
      'No % role row exists for user % — nothing was approved. The partner must hold the role before they can be verified.',
      p_partner_type, p_user_id;
  END IF;

  -- Audit log. Carries the reason and what the admin says they saw, so a blind vouch is
  -- distinguishable from a reviewed approval after the fact.
  INSERT INTO public.admin_action_logs
    (admin_id, entity_type, entity_id, action_type, reason, new_state)
  VALUES (
    v_admin_id,
    'partner',
    p_user_id,
    'partner_verified_direct',
    p_reason,
    jsonb_build_object(
      'partner_type', p_partner_type,
      'request_id',   v_request_id,
      'evidence_ack', p_evidence_ack
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

REVOKE ALL ON FUNCTION public.admin_verify_partner_direct(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_verify_partner_direct(UUID, TEXT, TEXT, TEXT) TO authenticated;

COMMIT;

-- ---------------------------------------------------------------------
-- AFTER APPLYING: every blind vouch is now visible in one query.
-- ---------------------------------------------------------------------
-- SELECT l.created_at, a.email AS approved_by, l.entity_id AS partner_user_id,
--        l.new_state ->> 'evidence_ack' AS evidence, l.reason
-- FROM public.admin_action_logs l
-- LEFT JOIN public.admin_users a ON a.id = l.admin_id
-- WHERE l.action_type = 'partner_verified_direct'
--   AND l.new_state ->> 'evidence_ack' = 'none'
-- ORDER BY l.created_at DESC;
