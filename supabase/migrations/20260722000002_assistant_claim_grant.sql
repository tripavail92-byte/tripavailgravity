-- ============================================================================
-- Fix: the assistant's rate limiter is unreachable by the edge function
--
-- 20260722000001 locked down assistant_claim_request with
--
--     REVOKE ALL ON FUNCTION public.assistant_claim_request(...) FROM PUBLIC, anon, authenticated;
--
-- and then granted EXECUTE to nobody. PostgreSQL grants EXECUTE on new functions to PUBLIC by
-- default, and service_role — which is an ordinary role with BYPASSRLS, not a superuser — was
-- relying on exactly that default. Revoking from PUBLIC therefore took the privilege away from the
-- one caller that needs it.
--
-- Symptom: every assistant request returned 500 "Could not start the assistant", because the quota
-- claim is the first thing the endpoint does and its failure is fatal by design — a rate limiter
-- that cannot be consulted must block the request, never wave it through.
--
-- Verified end to end against the deployed function, not inferred: a real POST with the anon key
-- returned that error while CORS preflight (200) and unauthenticated POST (401) both behaved.
--
-- The intent of the original REVOKE stands: anon and authenticated must NOT be able to call this.
-- A quota the browser can advance — or reset — is not a quota. Only the edge function's
-- service_role may touch it.
-- ============================================================================

BEGIN;

GRANT EXECUTE ON FUNCTION public.assistant_claim_request(UUID, TEXT, INTEGER) TO service_role;

COMMIT;

-- ============================================================================
-- Verify:
--
--   -- who can execute it now? Expect exactly one row: service_role.
--   SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_name = 'assistant_claim_request'
--     AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC');
--
-- Then re-test the assistant itself; the endpoint should answer rather than 500.
-- ============================================================================
