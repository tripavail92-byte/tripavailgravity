-- ============================================================================
-- Verify: two prod RLS concerns from memory. READ-ONLY, no writes.
--
-- (A) Operator PII leak — supposedly closed 2026-07-14 (migrations
--     20260714000001 + 20260714000003). Prove it: anon should have NO SELECT
--     on tour_operator_profiles at all (base-table policy was dropped).
--
-- (B) Hotels-table anon enumeration — flagged in Phase 0, never fixed. Anon
--     may still be able to list unpublished draft hotels + read owner_id.
--     Confirm whether that's still the case today so we know if it needs work.
-- ============================================================================


-- ── (A) Operator PII — anon column privileges on tour_operator_profiles ─────
-- EXPECTED (post-fix state): 0 rows for the CONFIDENTIAL list, but potentially
-- rows for the safe column list. The confidential list is what matters.
--
-- If ANY row appears here for a confidential column, the fix has regressed and
-- we do the emergency re-close.
SELECT column_name AS anon_can_read_confidential_col
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name   = 'tour_operator_profiles'
  AND grantee      = 'anon'
  AND privilege_type = 'SELECT'
  AND column_name IN (
    'verification_documents','verification_urls','registration_number',
    'kyc_verified_cnic','kyc_verified_name','kyc_verified_dob',
    'kyc_verified_gender','kyc_verified_father_name','current_kyc_session_id'
  );

-- Also: any row-level policy that still grants anon read?
SELECT policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'tour_operator_profiles'
  AND (roles @> ARRAY['anon']::name[] OR roles @> ARRAY['public']::name[]);
-- EXPECTED: 0 rows. `public_read_operator_profiles` was dropped by 20260714000003.


-- ── (B) Hotels table — can anon see rows they shouldn't? ────────────────────
-- Same question but for the hotels table. Two things to check:
--   1. Row-level policy — is anon restricted to is_published = true?
--   2. Column privileges — can anon read owner_id?
SELECT policyname, cmd, qual::text AS using_clause, roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'hotels'
ORDER BY policyname;
-- Look for: at least ONE anon/public SELECT policy that INCLUDES is_published = true
-- in its USING clause. If the only anon-visible policy is missing that filter, anon
-- can read every draft row.

-- Does anon have SELECT on owner_id (the column that identifies which real user
-- owns the property — a low-grade privacy concern, not PII)?
SELECT count(*) AS anon_can_read_owner_id
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name   = 'hotels'
  AND grantee      = 'anon'
  AND privilege_type = 'SELECT'
  AND column_name = 'owner_id';
-- 1 = anon can read owner_id. 0 = they can't.
