-- ============================================================================
-- Stop anonymous callers from probing admin status
--
-- `is_admin(uuid)` and `get_admin_role(uuid)` are SECURITY DEFINER helpers, but
-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. PostgREST
-- exposes every public-schema function as an RPC, so anyone holding the anon key
-- (which ships in the browser bundle, by design) could call:
--
--   POST /rest/v1/rpc/is_admin        {"p_user_id": "<uuid>"} -> true | false
--   POST /rest/v1/rpc/get_admin_role  {"p_user_id": "<uuid>"} -> role | null
--
-- Low severity — the caller must already know a user's UUID and learns only a
-- boolean/role — but it is a free oracle for confirming which accounts are admins,
-- and there is no reason for an anonymous visitor to ask.
--
-- Safe to revoke, verified against the migration history:
--   * All 53 RLS policies that call is_admin are scoped `TO authenticated` or
--     `TO service_role`. An anonymous request never evaluates them, so it never
--     needs EXECUTE. (`authenticated` DOES need it — policy expressions run as the
--     current role — hence the explicit GRANT below.)
--   * All 44 functions whose bodies call is_admin are SECURITY DEFINER, so the
--     inner call is permission-checked against the function owner, not the caller.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_admin_role(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_role(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_role(UUID) TO authenticated, service_role;
