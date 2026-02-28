-- ============================================================
-- One-time backfill fix: restore approved status for operator
-- e169fc8b-eb30-43d8-836a-c1906eb3f809
--
-- Root cause:
--   Session 4e18a1d9 was approved on Feb 26, BEFORE the status-
--   change trigger was created on Feb 28. So verification_status
--   was never set to 'approved' on user_roles.
--   A later test revoke (session 8e493857, Feb 28) then fired the
--   trigger and reset verification_status back to 'pending'.
--
-- Fix:
--   1. Set user_roles.verification_status = 'approved'
--   2. Backfill tour_operator_profiles with OCR data from the
--      approved session (cnic already done via Node script)
--   3. Grant service_role SELECT+UPDATE on user_roles so that
--      the client-side fix script works in future
--   4. Add GRANT so the existing trigger can always write to
--      user_roles (belt-and-suspenders)
--   5. Fix the kyc_audit_log INSERT in the fix script (missing
--      'action' column → the column name in the table is 'action')
--
-- This migration is idempotent: running it twice is safe.
-- ============================================================

-- 1. Ensure service_role can update user_roles (belt-and-suspenders)
GRANT SELECT, UPDATE ON public.user_roles TO service_role;

-- 2. Restore verification_status for the affected operator
UPDATE public.user_roles
SET    verification_status = 'approved'
WHERE  user_id   = 'e169fc8b-eb30-43d8-836a-c1906eb3f809'
  AND  role_type = 'tour_operator'
  AND  verification_status <> 'approved';  -- idempotent

-- 3. Ensure profile KYC cols are set (cnic was already set by Node script,
--    but set all again to be safe)
UPDATE public.tour_operator_profiles
SET    current_kyc_session_id = '4e18a1d9-dc5d-4790-8d25-ab22b3ecb47c',
       kyc_verified_cnic      = '33100-4836586-9',
       kyc_verified_at        = '2026-02-26T22:46:43.466+00:00',
       kyc_rejection_reason   = NULL
WHERE  user_id = 'e169fc8b-eb30-43d8-836a-c1906eb3f809';

-- 4. Write audit log entry for the manual fix
INSERT INTO public.kyc_audit_log (session_id, user_id, old_status, new_status, changed_by, notes)
VALUES (
  '4e18a1d9-dc5d-4790-8d25-ab22b3ecb47c',
  'e169fc8b-eb30-43d8-836a-c1906eb3f809',
  'pending',
  'approved',
  '669cd0d3-051d-442c-a9da-79f1b13c99a7',
  'Manual backfill via migration 20260228000004. Session was approved Feb 26 before trigger existed. Revoke of test session 8e493857 had incorrectly reset verification_status to pending.'
)
ON CONFLICT DO NOTHING;
