-- =====================================================================
-- ONE WRITER FOR THE AUTHORITY COLUMN.
--
-- THE PROBLEM THIS SOLVES (the real answer to "why are we dealing with partners on two fronts?"):
--
-- /admin/partners and /admin/kyc are NOT duplicates. They are two different questions:
--     /admin/partners  — may this business trade?      (user_roles, partner_verification_requests)
--     /admin/kyc       — is this person who they say?  (kyc_sessions, kyc_documents, blocked CNICs)
-- They share no table and no RPC. As concerns, the split is correct and worth keeping.
--
-- What is NOT correct is that the identity page can silently overrule the partner page.
-- can_partner_operate() is the ONLY definition of "can this partner trade", and it reads exactly
-- user_roles.verification_status + <role>_profiles.account_status. It never reads kyc_sessions.
-- Yet kyc_session_status_changed() — an AFTER UPDATE trigger on kyc_sessions, SECURITY DEFINER —
-- writes user_roles.verification_status directly (20260314000001:112-116, :134-138).
--
-- Consequences, all live today:
--   * Approving a CNIC photo on /admin/kyc grants FULL PUBLISH RIGHTS — to a hotel manager, with
--     nobody having looked at a title deed, a utility bill, or a property photo. Identity is not
--     commercial approval, but the trigger treats it as though it were.
--   * The rejected branch is guarded `AND verification_status NOT IN ('approved')` (:138), so
--     rejecting the KYC of an already-approved partner matches ZERO rows. /admin/kyc files them
--     under Rejected; /admin/partners badges them Operative. Both pages are honest about their own
--     store; neither can see the other's.
--   * The 'revoked' branch that 20260228000003:113-133 had was silently dropped when
--     20260314000001 CREATE OR REPLACEd the body (grep 'revoked' in that file → nothing). So
--     revoking a partner's identity does not demote them at all. They keep trading.
--
-- THE FIX: the trigger stops writing user_roles. It keeps doing everything else — the audit log,
-- the verification_documents cache sync, and the kyc_verified_* promotion. KYC records an identity
-- FACT; a human still makes the partner-level call on /admin/partners, where the evidence checklist
-- now shows them the identity verdict before they decide.
--
-- Net: approval writers collapse from three to two (admin_approve_partner and
-- admin_verify_partner_direct), both on one page, both is_admin-guarded, both audited.
-- The contradictions above become impossible rather than invisible: they cannot arise, because
-- only one surface writes the column.
--
-- The dropped 'revoked' branch is deliberately NOT restored. Under single-writer it must not write
-- user_roles either. /admin/partners surfaces the contradiction (identity revoked + still
-- operative) and puts the suspend lever one click away.
--
-- ⚠️ BEHAVIOURAL. Run the PRE-FLIGHT below FIRST and read it. After this migration, an admin who
-- approves KYC must ALSO approve on /admin/partners for the partner to be able to publish. That is
-- the intent — but if your team currently relies on the KYC page granting publish rights, this
-- changes their workflow.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.kyc_session_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verification_patch jsonb;
BEGIN
  -- Guard: only run when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- ── a) Audit log (append-only — never changes) ──────────────────────────
  INSERT INTO public.kyc_audit_log (
    session_id, user_id, old_status, new_status, changed_by, notes
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    OLD.status,
    NEW.status,
    NEW.reviewed_by,
    NEW.review_notes
  );

  -- ── b) Build the JSONB patch for verification_documents ─────────────────
  --  Targeted merge so we never wipe existing fields on the profile
  --  (e.g. idCardUrl, idBackUrl, kycSessionToken set during the upload phase).
  v_verification_patch := jsonb_build_object(
    'kycStatus',   NEW.status,
    'cnicNumber',  COALESCE(NEW.cnic_number,   OLD.cnic_number),
    'expiryDate',  COALESCE(
                     CASE WHEN NEW.expiry_date IS NOT NULL
                          THEN NEW.expiry_date::text ELSE NULL END,
                     CASE WHEN OLD.expiry_date IS NOT NULL
                          THEN OLD.expiry_date::text ELSE NULL END
                   )
  );

  -- ── c) Sync to tour_operator_profiles ───────────────────────────────────
  IF NEW.role = 'tour_operator' THEN
    UPDATE public.tour_operator_profiles
    SET
      verification_documents = COALESCE(verification_documents, '{}'::jsonb)
                               || v_verification_patch,
      updated_at             = now()
    WHERE user_id = NEW.user_id;
  END IF;

  -- ── d) Sync to hotel_manager_profiles ───────────────────────────────────
  IF NEW.role = 'hotel_manager' THEN
    UPDATE public.hotel_manager_profiles
    SET
      verification_documents = COALESCE(verification_documents, '{}'::jsonb)
                               || v_verification_patch,
      updated_at             = now()
    WHERE user_id = NEW.user_id;
  END IF;

  -- ── e) On APPROVAL: promote identity to the dedicated columns ────────────
  --  kyc_verified_* is the immutable, admin-reviewed identity record — separate from the mutable
  --  cache above. This is an identity FACT and stays here.
  --
  --  REMOVED (this is the point of the migration): the
  --      UPDATE public.user_roles SET verification_status = 'approved'
  --  that used to follow. Identity approval is not commercial approval. /admin/partners is now the
  --  single writer of that column — see the header.
  IF NEW.status = 'approved' THEN
    IF NEW.role = 'tour_operator' THEN
      UPDATE public.tour_operator_profiles
      SET
        current_kyc_session_id   = NEW.id,
        kyc_verified_name        = COALESCE(NEW.full_name,     kyc_verified_name),
        kyc_verified_cnic        = COALESCE(NEW.cnic_number,   kyc_verified_cnic),
        kyc_verified_dob         = COALESCE(NEW.date_of_birth::text, kyc_verified_dob),
        kyc_verified_gender      = COALESCE(NEW.gender,        kyc_verified_gender),
        kyc_verified_father_name = COALESCE(NEW.father_name,   kyc_verified_father_name),
        kyc_verified_at          = COALESCE(NEW.reviewed_at,   now()),
        kyc_rejection_reason     = NULL
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  -- ── f) On REJECTION / FAILED: record the reason ─────────────────────────
  --  REMOVED likewise: the guarded
  --      UPDATE public.user_roles SET verification_status='rejected'
  --        ... AND verification_status NOT IN ('approved')
  --  It was a silent no-op for exactly the partners it mattered most for (the already-approved
  --  ones), which is how a partner could be Rejected on one page and Operative on the other.
  --  /admin/partners now shows the contradiction and offers the suspend lever.
  IF NEW.status IN ('rejected', 'failed') THEN
    IF NEW.role = 'tour_operator' THEN
      UPDATE public.tour_operator_profiles
      SET
        kyc_rejection_reason = COALESCE(
          NEW.review_notes,
          NEW.failure_reason,
          CASE NEW.status WHEN 'rejected' THEN 'Rejected by admin' ELSE 'Processing failed' END
        )
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger definition unchanged; re-attached for clarity.
DROP TRIGGER IF EXISTS kyc_session_status_changed_trg ON public.kyc_sessions;
CREATE TRIGGER kyc_session_status_changed_trg
  AFTER UPDATE OF status ON public.kyc_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.kyc_session_status_changed();

COMMIT;


-- ---------------------------------------------------------------------
-- PRE-FLIGHT (read-only) — RUN THIS BEFORE THE MIGRATION AND READ IT.
--
-- (1) Who was approved ONLY by the trigger? These partners can publish today because someone
--     approved their identity photo, not because anyone approved their business. After this
--     migration they KEEP that status (this migration changes no data) — but nothing will have
--     vouched for their documents. Decide deliberately whether each should stay approved.
-- ---------------------------------------------------------------------
-- SELECT ur.user_id, u.email, ur.role_type, ur.verification_status,
--        ks.status AS kyc_status, ks.reviewed_at AS kyc_reviewed_at,
--        EXISTS (SELECT 1 FROM public.admin_action_logs l
--                 WHERE l.entity_type='partner' AND l.entity_id=ur.user_id
--                   AND l.action_type IN ('partner_verified_direct','partner_approved')
--               ) AS approved_by_an_admin_on_partners
-- FROM public.user_roles ur
-- JOIN public.users u ON u.id = ur.user_id
-- LEFT JOIN LATERAL (
--   SELECT s.* FROM public.kyc_sessions s
--    WHERE s.user_id = ur.user_id AND s.role = ur.role_type
--    ORDER BY s.created_at DESC LIMIT 1
-- ) ks ON TRUE
-- WHERE ur.role_type IN ('hotel_manager','tour_operator')
--   AND ur.verification_status = 'approved'
-- ORDER BY approved_by_an_admin_on_partners ASC;
--   -> rows with approved_by_an_admin_on_partners = false were approved by the trigger alone.
--
-- (2) THE LIVE CONTRADICTIONS — partners who are Operative but whose identity was
--     rejected/revoked. The guarded downgrade never touched them, and the revoke branch no longer
--     exists at all, so they are still trading. This migration does not fix them; it stops NEW
--     ones appearing. Fix these by hand (suspend, or re-review) after reviewing.
-- ---------------------------------------------------------------------
-- SELECT ur.user_id, u.email, ur.role_type, ur.verification_status, ks.status AS kyc_status
-- FROM public.user_roles ur
-- JOIN public.users u ON u.id = ur.user_id
-- JOIN LATERAL (
--   SELECT s.* FROM public.kyc_sessions s
--    WHERE s.user_id = ur.user_id AND s.role = ur.role_type
--    ORDER BY s.created_at DESC LIMIT 1
-- ) ks ON TRUE
-- WHERE ur.verification_status = 'approved'
--   AND ks.status IN ('rejected', 'revoked');
