-- ============================================================================
-- Enterprise KYC Status Auto-Sync (v2)
-- Date: 2026-03-14
--
-- Problem fixed:
--   The previous trigger only propagated 'approved' and 'rejected' states.
--   Intermediate states (processing, pending_admin_review, failed) were never
--   written back to verification_documents on the profile, creating a stale
--   cache that diverged from the source of truth (kyc_sessions).
--
-- Enterprise principle: ONE source of truth (kyc_sessions).
--   The profile's verification_documents JSONB is a derived cache.
--   This trigger guarantees that cache is always current — no UI workaround
--   should ever be needed to compensate for a stale DB value.
--
-- Changes:
--   1. Replace kyc_session_status_changed() to sync on EVERY status transition.
--   2. hotel_manager profiles now also receive full JSONB sync (prev missing).
--   3. Backfill: repair all existing profiles where status is diverged.
-- ============================================================================

BEGIN;

-- ─── 1. Replace the trigger function — full status sync on every transition ──

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
  --
  --  We do a targeted merge so we never wipe existing fields on the profile
  --  (e.g. idCardUrl, idBackUrl, kycSessionToken set during upload phase).
  --
  --  Fields we always keep current:
  --    kycStatus   — source of truth replicated from kyc_sessions.status
  --    cnicNumber  — once OCR extracts it, persist immediately
  --    expiryDate  — same
  --
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

  -- ── d) Sync to hotel_manager_profiles (was fully missing before) ─────────
  IF NEW.role = 'hotel_manager' THEN
    UPDATE public.hotel_manager_profiles
    SET
      verification_documents = COALESCE(verification_documents, '{}'::jsonb)
                               || v_verification_patch,
      updated_at             = now()
    WHERE user_id = NEW.user_id;
  END IF;

  -- ── e) On APPROVAL: also promote identity to dedicated columns ───────────
  --  Dedicated columns (kyc_verified_*) are the immutable, admin-reviewed
  --  identity record — separate from the mutable cache above.
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

    -- Promote user_role verification_status → approved for both roles
    UPDATE public.user_roles
    SET verification_status = 'approved'
    WHERE user_id    = NEW.user_id
      AND role_type  = NEW.role;
  END IF;

  -- ── f) On REJECTION / FAILED: record reason, update user_roles ──────────
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

    -- Only downgrade if not already approved (don't regress approved accounts)
    IF NEW.status = 'rejected' THEN
      UPDATE public.user_roles
      SET verification_status = 'rejected'
      WHERE user_id   = NEW.user_id
        AND role_type = NEW.role
        AND verification_status NOT IN ('approved');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-attach (CREATE OR REPLACE function body above, trigger definition unchanged)
DROP TRIGGER IF EXISTS kyc_session_status_changed_trg ON public.kyc_sessions;
CREATE TRIGGER kyc_session_status_changed_trg
  AFTER UPDATE OF status ON public.kyc_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.kyc_session_status_changed();


-- ─── 2. Backfill: repair any profiles whose cache is behind the session ───────
--
--  For every kyc_session that is MORE advanced than the profile's kycStatus,
--  overwrite kycStatus, cnicNumber, and expiryDate in verification_documents.
--
--  Rank inline with CASE so Postgres can evaluate it without referencing the
--  target table from within the FROM clause (which is not permitted).
-- 
--  Status rank: pending(0) < uploading(1) < processing(2)
--              < pending_admin_review(3) < approved/rejected/failed/expired(4)

CREATE OR REPLACE FUNCTION _kyc_status_rank(s text) RETURNS int
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE s
    WHEN 'pending'              THEN 0
    WHEN 'uploading'            THEN 1
    WHEN 'processing'           THEN 2
    WHEN 'pending_admin_review' THEN 3
    WHEN 'approved'             THEN 4
    WHEN 'rejected'             THEN 4
    WHEN 'failed'               THEN 4
    WHEN 'expired'              THEN 4
    ELSE 0
  END
$$;

-- Backfill tour_operator_profiles
UPDATE public.tour_operator_profiles p
SET
  verification_documents = COALESCE(p.verification_documents, '{}'::jsonb)
                           || jsonb_build_object(
                                'kycStatus',  ls.status,
                                'cnicNumber', ls.cnic_number,
                                'expiryDate', ls.expiry_date::text
                              ),
  updated_at = now()
FROM (
  SELECT DISTINCT ON (user_id)
         user_id,
         status,
         cnic_number,
         expiry_date
  FROM   public.kyc_sessions
  WHERE  role = 'tour_operator'
  ORDER  BY user_id, created_at DESC
) ls
WHERE p.user_id = ls.user_id
  AND _kyc_status_rank(ls.status)
      > _kyc_status_rank(COALESCE(p.verification_documents->>'kycStatus', 'pending'));


-- Backfill hotel_manager_profiles
UPDATE public.hotel_manager_profiles p
SET
  verification_documents = COALESCE(p.verification_documents, '{}'::jsonb)
                           || jsonb_build_object(
                                'kycStatus',  ls.status,
                                'cnicNumber', ls.cnic_number,
                                'expiryDate', ls.expiry_date::text
                              ),
  updated_at = now()
FROM (
  SELECT DISTINCT ON (user_id)
         user_id,
         status,
         cnic_number,
         expiry_date
  FROM   public.kyc_sessions
  WHERE  role = 'hotel_manager'
  ORDER  BY user_id, created_at DESC
) ls
WHERE p.user_id = ls.user_id
  AND _kyc_status_rank(ls.status)
      > _kyc_status_rank(COALESCE(p.verification_documents->>'kycStatus', 'pending'));


COMMIT;
