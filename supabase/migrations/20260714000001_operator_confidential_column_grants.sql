-- =====================================================================
-- SECURITY FIX (2026-07-14): stop anonymous visitors from reading
-- confidential tour-operator columns via the public storefront.
--
-- ROOT CAUSE
--   Policy `public_read_operator_profiles` uses `USING (is_public = true)`,
--   and `20260328000005_public_operator_storefront_rls_fix.sql` added a
--   table-wide `GRANT SELECT ON tour_operator_profiles TO anon`.
--   Postgres RLS filters ROWS, not COLUMNS -> any anonymous client can call
--     /rest/v1/tour_operator_profiles?is_public=eq.true&select=*
--   and read EVERY column of every public operator, including:
--     verification_documents (embeds cnicNumber, kycSessionToken, ID card URLs),
--     verification_urls (private trust-doc links),
--     registration_number,
--     kyc_verified_cnic / _name / _dob / _gender / _father_name,
--     current_kyc_session_id.
--   Confirmed live: an anon REST call returned HTTP 200 with these fields.
--
-- FIX
--   Revoke the blunt table-wide SELECT from anon and re-grant SELECT on the
--   PUBLIC-SAFE columns only (built dynamically so it auto-covers every current
--   safe column and never accidentally regrants a confidential one). The
--   is_public row policy stays intact, so the public storefront keeps working;
--   the confidential columns simply become unreadable to anon.
--
-- SCOPE NOTE
--   This closes the UNAUTHENTICATED vector (no account, scriptable, cacheable).
--   A logged-in `authenticated` user can still read these via the same policy;
--   that is closed separately by the derived-boolean storefront view (Phase 2),
--   because `authenticated` is ALSO the role operators/admins use to read their
--   OWN confidential row for editing -- so it cannot be blunt-revoked here
--   without breaking operator self-service.
-- =====================================================================

REVOKE SELECT ON public.tour_operator_profiles FROM anon;

DO $$
DECLARE
  col text;
  confidential text[] := ARRAY[
    'verification_documents',
    'verification_urls',
    'registration_number',
    'kyc_verified_cnic',
    'kyc_verified_name',
    'kyc_verified_dob',
    'kyc_verified_gender',
    'kyc_verified_father_name',
    'current_kyc_session_id'
  ];
BEGIN
  FOR col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'tour_operator_profiles'
      AND column_name <> ALL (confidential)
  LOOP
    EXECUTE format('GRANT SELECT (%I) ON public.tour_operator_profiles TO anon', col);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- VERIFY (run after; expected: 0 rows -> anon can no longer see any
-- confidential column)
-- ---------------------------------------------------------------------
-- SELECT column_name
-- FROM information_schema.column_privileges
-- WHERE table_schema = 'public'
--   AND table_name   = 'tour_operator_profiles'
--   AND grantee      = 'anon'
--   AND privilege_type = 'SELECT'
--   AND column_name IN (
--     'verification_documents','verification_urls','registration_number',
--     'kyc_verified_cnic','kyc_verified_name','kyc_verified_dob',
--     'kyc_verified_gender','kyc_verified_father_name','current_kyc_session_id'
--   );
