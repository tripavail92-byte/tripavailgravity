-- =====================================================================
-- POST-MIGRATION SECURITY AUDIT — all read-only. Run each check on its own.
--
-- The 20260717* migrations stop NEW exploitation but change no existing data. These queries answer
-- the two questions that follow from that:
--   * is the systemic grant hole actually present on THIS database? (check 0)
--   * who is already a victim of the holes we just closed? (checks 1-5)
--
-- Nothing here writes. Every check names what a clean result looks like.
-- =====================================================================


-- ── CHECK 0 — IS THE GRANT HOLE REAL? Run this FIRST. ───────────────────────
-- The premise behind migration 7 and the whole "account_status is partner-writable" claim is that
-- `GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated` (20260204215500:3) was never revoked
-- at table level, so every column-level REVOKE is a silent no-op. This proves it or disproves it.
--
-- Expect: if this returns rows, the grant hole is REAL — `authenticated` holds table-level UPDATE,
-- so a partner can write any column RLS lets them reach (account_status, packages.status, etc.).
-- If it returns ZERO rows, the column REVOKEs took and my premise was wrong — tell me.
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee = 'authenticated'
  AND privilege_type = 'UPDATE'
  AND table_name IN (
    'tour_operator_profiles', 'hotel_manager_profiles',
    'packages', 'tours', 'profiles', 'reports'
  )
ORDER BY table_name;
-- A row for tour_operator_profiles/hotel_manager_profiles = the trigger in migration 7 is now the
-- only thing protecting the trading gate (expected — the trigger does not need the grant fixed).
-- A row for packages/tours/profiles/reports = STILL OPEN, no trigger covers them yet.


-- ── CHECK 1 — DID A SUSPENDED PARTNER REACTIVATE THEMSELVES? ─────────────────
-- The sharpest consequence of check 0: account_status feeds can_partner_operate(), so a partner who
-- PATCHed their own account_status back to 'active' after being suspended is trading again against
-- an admin's decision. Fingerprint: currently active, but the LAST admin account-action was a
-- suspend/delete with no later reactivate.
-- Expect: zero rows. Any row is a partner who overrode a suspension.
WITH last_admin_action AS (
  SELECT DISTINCT ON (l.entity_id)
    l.entity_id AS user_id, l.action_type, l.created_at
  FROM public.admin_action_logs l
  WHERE l.entity_type = 'partner'
    AND l.action_type IN ('suspend', 'reactivate', 'delete')
  ORDER BY l.entity_id, l.created_at DESC
)
SELECT
  u.email,
  la.action_type   AS last_admin_decision,
  la.created_at    AS decided_at,
  COALESCE(top.account_status::text, hmp.account_status::text) AS account_status_now
FROM last_admin_action la
JOIN public.users u ON u.id = la.user_id
LEFT JOIN public.tour_operator_profiles top ON top.user_id = la.user_id
LEFT JOIN public.hotel_manager_profiles hmp ON hmp.user_id = la.user_id
WHERE la.action_type IN ('suspend', 'delete')
  AND COALESCE(top.account_status::text, hmp.account_status::text) = 'active';


-- ── CHECK 2 — DID ANYONE SELF-APPROVE THEIR KYC? ────────────────────────────
-- Before migration 1's guard, a partner could PATCH their own kyc_sessions row to status='approved'.
-- reviewed_by is FK'd to auth.users, NOT admin_users, so its mere presence proves nothing — join
-- admin_users and ask whether the recorded reviewer is a REAL admin.
-- Expect: only 'ok' rows. Any SUSPECT row is an approval no admin made.
SELECT
  u.email,
  ks.role,
  ks.status,
  ks.reviewed_by,
  ks.reviewed_at,
  ur.verification_status AS role_status_now,
  CASE
    WHEN ks.reviewed_by IS NULL      THEN 'SUSPECT: approved, no reviewer recorded'
    WHEN au.id IS NULL               THEN 'SUSPECT: reviewer is not an admin'
    WHEN ks.reviewed_by = ks.user_id THEN 'SUSPECT: self-reviewed'
    ELSE 'ok: reviewed by a real admin'
  END AS assessment
FROM public.kyc_sessions ks
LEFT JOIN public.users u          ON u.id  = ks.user_id
LEFT JOIN public.admin_users au   ON au.id = ks.reviewed_by
LEFT JOIN public.user_roles ur    ON ur.user_id = ks.user_id AND ur.role_type = ks.role
WHERE ks.status IN ('approved', 'revoked', 'rejected')
ORDER BY (au.id IS NULL AND ks.reviewed_by IS NOT NULL) DESC, ks.reviewed_by IS NULL DESC, ks.updated_at DESC;


-- ── CHECK 3 — WHO IS TRADING ON A REVOKED IDENTITY? ─────────────────────────
-- Revocation used to change one word and nothing else, so partners revoked before migration 6 kept
-- their approved status. Fingerprint: role still approved, latest kyc session revoked.
-- Expect: zero rows. Fix any with the backfill at the bottom of migration 6.
SELECT
  u.email, ur.role_type, ur.verification_status,
  ks.id AS session_id, ks.reviewed_at AS revoked_at, ks.review_notes AS revoke_reason
FROM public.user_roles ur
JOIN public.users u ON u.id = ur.user_id
JOIN LATERAL (
  SELECT s.* FROM public.kyc_sessions s
   WHERE s.user_id = ur.user_id AND s.role = ur.role_type
   ORDER BY s.created_at DESC LIMIT 1
) ks ON TRUE
WHERE ur.verification_status = 'approved'
  AND ks.status = 'revoked';


-- ── CHECK 4 — FORGED "IDENTITY VERIFIED" BADGE ──────────────────────────────
-- The public storefront lights has_identity_verified from a partner-writable JSONB. Fingerprint: the
-- badge is on, but nothing server-side backs it — no approved role, no admin-reviewed kyc session.
-- Expect: zero rows.
SELECT
  u.email,
  p.company_name,
  p.verification_documents ->> 'kycStatus'    AS claimed_kyc_status,
  p.verification_documents ->> 'kycVerifiedAt' AS claimed_verified_at,
  ur.verification_status                      AS real_role_status,
  ks.status                                   AS real_kyc_status
FROM public.tour_operator_profiles p
LEFT JOIN public.users u ON u.id = p.user_id
LEFT JOIN public.user_roles ur
  ON ur.user_id = p.user_id AND ur.role_type = 'tour_operator'
LEFT JOIN LATERAL (
  SELECT s.* FROM public.kyc_sessions s
   WHERE s.user_id = p.user_id AND s.role = 'tour_operator'
   ORDER BY s.created_at DESC LIMIT 1
) ks ON TRUE
WHERE (
    (p.verification_documents ->> 'kycStatus') = 'approved'
    OR COALESCE(p.verification_documents ->> 'kycVerifiedAt', '') <> ''
  )
  AND COALESCE(ur.verification_status, '') <> 'approved'
  AND COALESCE(ks.status, '') <> 'approved';


-- ── CHECK 5 — FORGED BUSINESS/INSURANCE/VEHICLE/GUIDE BADGES ────────────────
-- These flags have a legitimate author (admin_set_operator_verification_flag), which always writes a
-- row to operator_verification_reviews — a table partners cannot write. Fingerprint: flag reads
-- 'true' with no matching 'verified' review behind it.
-- Expect: only 'ok' rows.
SELECT
  u.email,
  p.company_name,
  f.key AS badge,
  CASE WHEN EXISTS (
         SELECT 1 FROM public.operator_verification_reviews r
          WHERE r.operator_id = p.user_id
            AND r.verification_key = f.key
            AND r.decision = 'verified')
       THEN 'ok: an admin verified this'
       ELSE 'SUSPECT: badge shown with no admin review behind it'
  END AS assessment
FROM public.tour_operator_profiles p
LEFT JOIN public.users u ON u.id = p.user_id
CROSS JOIN LATERAL (
  VALUES ('businessRegistrationVerified'), ('insuranceVerified'),
         ('vehicleDocsVerified'), ('guideLicenseVerified')
) AS f(key)
WHERE (p.verification_documents ->> f.key) = 'true'
ORDER BY assessment DESC, u.email;
