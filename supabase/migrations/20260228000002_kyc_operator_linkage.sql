-- ============================================================================
-- KYC ↔ Operator Profile: Enterprise-Level Linkage
-- Date: 2026-02-28
--
-- Enterprise Pattern (Jumio / Onfido style):
--
--   tour_operator_profiles           kyc_sessions
--     ├── current_kyc_session_id ──► id  (pointer to live approved session)
--     ├── kyc_verified_name            ↑  (promoted OCR data — immutable)
--     ├── kyc_verified_cnic            │  set by trigger on approval
--     ├── kyc_verified_dob             │
--     ├── kyc_verified_at              │
--     └── kyc_rejection_reason        │
--                                      │
--   kyc_audit_log ◄────────────────────┘  (append-only: every status transition)
--
-- Changes:
--   1. Add KYC identity columns to tour_operator_profiles
--   2. Create kyc_audit_log (WORM — append only)
--   3. Create trigger: on kyc_session approved/rejected →
--        a) promote OCR data to tour_operator_profiles
--        b) update user_roles.verification_status
--        c) write to kyc_audit_log
-- ============================================================================

BEGIN;

-- ─── 1. KYC identity columns on tour_operator_profiles ──────────────────────

ALTER TABLE public.tour_operator_profiles
  ADD COLUMN IF NOT EXISTS current_kyc_session_id  uuid
    REFERENCES public.kyc_sessions(id) ON DELETE SET NULL,

  -- Promoted from the approved kyc_session — immutable after approval
  ADD COLUMN IF NOT EXISTS kyc_verified_name        text,
  ADD COLUMN IF NOT EXISTS kyc_verified_cnic        text,
  ADD COLUMN IF NOT EXISTS kyc_verified_dob         text,
  ADD COLUMN IF NOT EXISTS kyc_verified_gender      text,
  ADD COLUMN IF NOT EXISTS kyc_verified_father_name text,
  ADD COLUMN IF NOT EXISTS kyc_verified_at          timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason     text;

-- Also link kyc_sessions → tour_operator_profiles explicitly (same user_id, but named FK)
-- This is optional but makes JOIN queries self-documenting
-- (The actual FK value is user_id in both tables — this column makes it explicit)
ALTER TABLE public.kyc_sessions
  ADD COLUMN IF NOT EXISTS operator_profile_id uuid
    REFERENCES public.tour_operator_profiles(user_id) ON DELETE SET NULL;

-- Backfill: set operator_profile_id for all existing sessions that belong to operators
UPDATE public.kyc_sessions ks
SET operator_profile_id = ks.user_id
WHERE ks.role = 'tour_operator'
  AND EXISTS (
    SELECT 1 FROM public.tour_operator_profiles top WHERE top.user_id = ks.user_id
  )
  AND ks.operator_profile_id IS NULL;

CREATE INDEX IF NOT EXISTS kyc_sessions_operator_idx
  ON public.kyc_sessions (operator_profile_id);

-- ─── 2. KYC Audit Log ────────────────────────────────────────────────────────
-- Append-only log of every status transition.
-- No UPDATE/DELETE policies — this is the immutable audit trail.

CREATE TABLE IF NOT EXISTS public.kyc_audit_log (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid         NOT NULL REFERENCES public.kyc_sessions(id) ON DELETE CASCADE,
  user_id       uuid         NOT NULL,   -- session owner (denormalized for query speed)
  old_status    text,
  new_status    text         NOT NULL,
  changed_by    uuid,                    -- admin user_id, or NULL for system/edge-fn
  notes         text,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kyc_audit_session_idx ON public.kyc_audit_log (session_id);
CREATE INDEX IF NOT EXISTS kyc_audit_user_idx    ON public.kyc_audit_log (user_id);

ALTER TABLE public.kyc_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit logs
DROP POLICY IF EXISTS "Admin read kyc audit"  ON public.kyc_audit_log;
CREATE POLICY "Admin read kyc audit"
  ON public.kyc_audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Owner can read their own audit trail
DROP POLICY IF EXISTS "Owner read own kyc audit" ON public.kyc_audit_log;
CREATE POLICY "Owner read own kyc audit"
  ON public.kyc_audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No direct INSERT/UPDATE/DELETE for regular users (service_role bypasses RLS)

-- ─── 3. Trigger: propagate KYC status changes ────────────────────────────────

CREATE OR REPLACE FUNCTION public.kyc_session_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- ── a) Write to audit log ───────────────────────────────────────────────
  INSERT INTO public.kyc_audit_log (session_id, user_id, old_status, new_status, changed_by, notes)
  VALUES (
    NEW.id,
    NEW.user_id,
    OLD.status,
    NEW.status,
    NEW.reviewed_by,   -- set by mark() in AdminKYCPage
    NEW.review_notes
  );

  -- ── b) On APPROVAL: promote identity data to operator profile ──────────
  IF NEW.status = 'approved' AND NEW.role = 'tour_operator' THEN
    UPDATE public.tour_operator_profiles
    SET
      current_kyc_session_id  = NEW.id,
      kyc_verified_name       = NEW.full_name,
      kyc_verified_cnic       = NEW.cnic_number,
      kyc_verified_dob        = NEW.date_of_birth,
      kyc_verified_gender     = NEW.gender,
      kyc_verified_father_name = NEW.father_name,
      kyc_verified_at         = COALESCE(NEW.reviewed_at, now()),
      kyc_rejection_reason    = NULL   -- clear any previous rejection
    WHERE user_id = NEW.user_id;

    -- Update user_roles verification_status → approved
    UPDATE public.user_roles
    SET verification_status = 'approved'
    WHERE user_id = NEW.user_id
      AND role_type = 'tour_operator';
  END IF;

  -- ── c) On REJECTION: record reason, mark user_roles ────────────────────
  IF NEW.status = 'rejected' AND NEW.role = 'tour_operator' THEN
    UPDATE public.tour_operator_profiles
    SET
      kyc_rejection_reason = COALESCE(NEW.review_notes, NEW.failure_reason, 'Rejected by admin')
    WHERE user_id = NEW.user_id;

    -- Only downgrade if currently pending — don't overwrite 'approved'
    UPDATE public.user_roles
    SET verification_status = 'rejected'
    WHERE user_id = NEW.user_id
      AND role_type = 'tour_operator'
      AND verification_status NOT IN ('approved');
  END IF;

  -- ── d) Same logic for hotel_manager ────────────────────────────────────
  IF NEW.status = 'approved' AND NEW.role = 'hotel_manager' THEN
    UPDATE public.hotel_manager_profiles
    SET updated_at = now()
    WHERE user_id = NEW.user_id;

    UPDATE public.user_roles
    SET verification_status = 'approved'
    WHERE user_id = NEW.user_id
      AND role_type = 'hotel_manager';
  END IF;

  IF NEW.status = 'rejected' AND NEW.role = 'hotel_manager' THEN
    UPDATE public.user_roles
    SET verification_status = 'rejected'
    WHERE user_id = NEW.user_id
      AND role_type = 'hotel_manager'
      AND verification_status NOT IN ('approved');
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to kyc_sessions
DROP TRIGGER IF EXISTS kyc_session_status_changed_trg ON public.kyc_sessions;
CREATE TRIGGER kyc_session_status_changed_trg
  AFTER UPDATE OF status ON public.kyc_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.kyc_session_status_changed();

-- ─── 4. Auto-link trigger: on kyc_session INSERT, set operator_profile_id ───

CREATE OR REPLACE FUNCTION public.kyc_session_set_operator_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a new session is created for a tour_operator, link it to their profile
  IF NEW.role = 'tour_operator' AND NEW.operator_profile_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.tour_operator_profiles WHERE user_id = NEW.user_id) THEN
      NEW.operator_profile_id := NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kyc_session_set_operator_profile_trg ON public.kyc_sessions;
CREATE TRIGGER kyc_session_set_operator_profile_trg
  BEFORE INSERT ON public.kyc_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.kyc_session_set_operator_profile();

COMMIT;
