-- =====================================================================
-- P0 SECURITY: stop partners approving their own KYC.
--
-- THE HOLE (every link verified against the migration text before writing this):
--   1. "Owner can update own kyc session" (20260225000002:83-87) is
--        FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
--      RLS scopes ROWS, never COLUMNS — so a partner may write ANY column of their own row.
--   2. There are no column-level GRANTs on kyc_sessions, so `status` is writable.
--   3. There was no BEFORE UPDATE validator. The only triggers on the table were
--      kyc_session_status_changed_trg (AFTER UPDATE OF status) and
--      kyc_session_set_operator_profile_trg (BEFORE INSERT).
--   4. kyc_session_status_changed() is SECURITY DEFINER (20260314000001:29), so it writes
--      user_roles with rights the partner does not have, and its approved branch is unconditional
--      and role-agnostic (:112-116):
--          IF NEW.status = 'approved' THEN
--            UPDATE public.user_roles SET verification_status = 'approved'
--            WHERE user_id = NEW.user_id AND role_type = NEW.role;
--   5. can_partner_operate() reads exactly that column.
--
--   => Any partner could PATCH /rest/v1/kyc_sessions?id=eq.<their own row> with
--      {"status":"approved"} using nothing but their own JWT and the public anon key, and
--      immediately gain publish rights with no documents, no admin, and no review.
--
-- THE FIX: validators on both write paths. Every legitimate writer separates cleanly by identity,
-- so the guard is tight rather than a guess:
--
--   service_role (request_jwt_role()='service_role')
--       kyc-mobile-upload/index.ts:222 -> 'uploading' | 'processing'
--       worker.py                      -> 'failed' | 'pending_admin_review'
--   admin (is_admin(auth.uid()))
--       /admin/kyc                     -> 'approved' | 'rejected' | 'revoked'
--       admin_request_kyc_reupload / admin_enforce_kyc_action (SECURITY DEFINER; auth.uid() is
--       still the calling admin inside them, so is_admin passes)
--   the partner (their own JWT)
--       expireKycSession()             -> 'expired', and NOTHING else.
--
-- expireKycSession (kycSessionService.ts:198-203) is the ONLY client status write in the app; its
-- one caller is refreshQr (IdentitySubFlow.tsx:351). updateKycSession (:170) types `status` as
-- patchable but has ZERO callers — dead code. createKycSession (:102-114) inserts only
-- {user_id, role}. So this guard breaks no real flow.
--
-- WHY NOT `auth.uid() IS NULL` AS THE MACHINE TEST (a first draft did exactly that):
-- auth.uid() is NULL for ANY caller with no `sub` claim — which includes the ANON role, not just
-- service_role. That draft waved anon straight through. It was unreachable only because anon holds
-- no UPDATE policy on this table *today* — precisely the dependency a defence-in-depth trigger
-- exists to remove, and this table shipped with exactly such a policy once
-- ("Token holder can update active session" TO anon, 20260224000001:61-66, dropped at
-- 20260225000002:66). So assert the role instead of inferring it from a missing subject.
-- request_jwt_role() (20260323000010) returns 'service_role' | 'authenticated' | 'anon', or '' when
-- there is no JWT at all (migrations/psql). anon now falls through to the RAISE.
--
-- This does NOT change the AFTER trigger, the RLS policies, or any grant. It only rejects
-- transitions the partner was never meant to be able to make.
-- =====================================================================

BEGIN;

-- ─── 1. UPDATE guard ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.kyc_session_status_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      UUID := auth.uid();
  v_jwt_role TEXT := public.request_jwt_role();
BEGIN
  -- Machine callers: the worker and the upload edge function, which are the legitimate authors of
  -- the machine statuses. '' = not a PostgREST request at all (migration / psql / superuser).
  -- Deliberately NOT `v_uid IS NULL` — that matches anon too. See the header.
  IF v_jwt_role = 'service_role' OR v_jwt_role = '' THEN
    RETURN NEW;
  END IF;

  -- Admins own the review verdicts.
  IF v_uid IS NOT NULL AND public.is_admin(v_uid) THEN
    RETURN NEW;
  END IF;

  -- Everyone else is the partner acting on their own session (RLS already proved
  -- auth.uid() = user_id to get here). They may ABANDON an in-flight session; they may not judge
  -- one, and they may not launder a verdict that has already been reached.
  --
  -- OLD.status is constrained, not just NEW.status: allowing 'expired' from ANY state would let a
  -- partner expire their own approved or revoked session. That keeps
  -- user_roles.verification_status='approved' (the AFTER trigger has no 'expired' downgrade
  -- branch), drops the row out of the /admin/kyc queue, and makes admin_enforce_kyc_action
  -- ('revoke'|'re_review') raise — i.e. it would hand partners a way to defeat admin revocation.
  -- 'pending_admin_review' is excluded so a partner cannot yank a session out from under a
  -- reviewer mid-decision.
  IF NEW.status = 'expired'
     AND OLD.status IN ('pending', 'uploading', 'processing', 'failed', 'expired') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'kyc_sessions.status: % -> % is not permitted for this caller (role=%, uid=%). Partners may only expire an in-flight session; verdicts are admin-only.',
    OLD.status, NEW.status, COALESCE(NULLIF(v_jwt_role, ''), 'none'), COALESCE(v_uid::text, 'anon')
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS kyc_session_status_guard_trg ON public.kyc_sessions;
CREATE TRIGGER kyc_session_status_guard_trg
  BEFORE UPDATE OF status ON public.kyc_sessions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.kyc_session_status_guard();


-- ─── 2. INSERT guard ────────────────────────────────────────────────────────
-- The UPDATE guard alone is not enough. "Owner can insert kyc session" (20260225000002:73-76) is
-- WITH CHECK (auth.uid() = user_id) — it constrains WHO, not WHAT — and 'approved' satisfies the
-- status CHECK constraint. An INSERT does not escalate (the promoter is AFTER UPDATE OF status, so
-- it never fires on INSERT and user_roles is untouched), but a fabricated row would:
--   * defeat the forensic query at the bottom of this file, by arriving pre-stamped with an
--     arbitrary reviewed_by — reviewed_by is FK'd to auth.users, NOT to admin_users, so ANY user id
--     satisfies it, including the attacker's own or a known admin's;
--   * let a partner plant an arbitrary cnic_number, which the worker's duplicate-CNIC check reads —
--     so a forged row could deny a legitimate partner their verification.
-- Normalise rather than raise: no client sends these columns today (createKycSession posts only
-- {user_id, role}), so silently pinning them cannot break a real caller.
CREATE OR REPLACE FUNCTION public.kyc_session_insert_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      UUID := auth.uid();
  v_jwt_role TEXT := public.request_jwt_role();
BEGIN
  IF v_jwt_role = 'service_role' OR v_jwt_role = '' THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NOT NULL AND public.is_admin(v_uid) THEN
    RETURN NEW;
  END IF;

  -- A partner-created session always starts at the beginning, unreviewed.
  NEW.status      := 'pending';
  NEW.reviewed_by := NULL;
  NEW.reviewed_at := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kyc_session_insert_guard_trg ON public.kyc_sessions;
CREATE TRIGGER kyc_session_insert_guard_trg
  BEFORE INSERT ON public.kyc_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.kyc_session_insert_guard();

-- Both are trigger functions, invoked by the trigger rather than by EXECUTE permission.
REVOKE ALL ON FUNCTION public.kyc_session_status_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kyc_session_insert_guard() FROM PUBLIC;

COMMIT;


-- ---------------------------------------------------------------------
-- DETECTION (read-only) — has this already been used? Run AFTER applying the guard.
--
-- NOTE the fingerprint is "the recorded reviewer is not a real admin", NOT "reviewed_by IS NULL".
-- A first draft of this query used the NULL test, which is worthless: reviewed_by is writable
-- through the very hole being fixed, so a self-approver could stamp any admin's uuid on their own
-- row. reviewed_by is FK'd to auth.users, not admin_users — so join admin_users and check.
-- Cross-check survivors against admin_action_logs (partners cannot write it); kyc_audit_log is
-- written by the SECURITY DEFINER trigger with changed_by taken from the row, so it inherits the
-- same forgery and cannot corroborate.
-- ---------------------------------------------------------------------
-- SELECT
--   ks.id            AS session_id,
--   ks.user_id,
--   u.email,
--   ks.role,
--   ks.status,
--   ks.reviewed_by,
--   ks.reviewed_at,
--   ks.updated_at,
--   ur.verification_status AS role_status_now,
--   CASE
--     WHEN ks.reviewed_by IS NULL      THEN 'SUSPECT: approved with no reviewer recorded'
--     WHEN au.id IS NULL               THEN 'SUSPECT: recorded reviewer is NOT an admin'
--     WHEN ks.reviewed_by = ks.user_id THEN 'SUSPECT: self-reviewed'
--     ELSE 'ok: reviewed by a real admin'
--   END AS assessment
-- FROM public.kyc_sessions ks
-- LEFT JOIN auth.users u        ON u.id  = ks.user_id
-- LEFT JOIN public.admin_users au ON au.id = ks.reviewed_by
-- LEFT JOIN public.user_roles ur
--   ON ur.user_id = ks.user_id AND ur.role_type = ks.role
-- WHERE ks.status IN ('approved', 'revoked', 'rejected')
-- ORDER BY (au.id IS NULL) DESC, ks.updated_at DESC;
--
-- Corroborate any SUSPECT row against the log partners cannot forge. admin_action_logs.admin_id is
-- FK'd to admin_users (20260216000001:86), so a row here proves a real admin acted; the approval
-- RPCs log entity_type='partner' with entity_id = the partner's user_id (20260314000003:89-96).
-- A SUSPECT session with NO corresponding row here was not approved by any admin.
-- SELECT l.created_at, l.admin_id, a.email AS admin_email, l.action_type, l.reason, l.new_state
-- FROM public.admin_action_logs l
-- LEFT JOIN public.admin_users a ON a.id = l.admin_id
-- WHERE l.entity_type = 'partner'
--   AND l.entity_id   = '<user_id from above>'
-- ORDER BY l.created_at DESC;
