-- ============================================================================
-- Hotels: revoke anon column-level access to owner_id + draft_data
--
-- WHY
--   Postgres RLS filters ROWS, not COLUMNS. The `hotels` table's anon row
--   policy already gates on `is_published = true`, so anon can only see
--   PUBLISHED rows — but the column grant was table-wide, so within a visible
--   row anon could read every column, including:
--     * owner_id   — a low-grade privacy leak (which user owns which property).
--                    Confirmed live 2026-07-31: `count(*) FROM
--                    information_schema.column_privileges WHERE grantee='anon'
--                    AND table_name='hotels' AND column_name='owner_id'` = 1.
--     * draft_data — the raw wizard state JSON, which contains anything the
--                    partner typed while building the listing (may include
--                    fields we later decided not to expose publicly).
--
-- FIX (matches the pattern that closed the operator-PII leak in
--     20260714000001_operator_confidential_column_grants.sql):
--   REVOKE the blunt table-wide SELECT from anon, then re-GRANT SELECT on the
--   safe columns via a DO loop that AUTO-EXCLUDES the confidential list. So if
--   a future migration adds another sensitive column, we only need to add it to
--   the `confidential` array — never a hand-maintained "safe" list to keep in
--   sync.
--
-- WHAT STAYS WORKING
--   * `/hotels` (property browse) and `/hotel/:id` (property profile) both read
--     ONLY the public columns; verified against packageQueries/hotelQueries.
--   * search_hotels_unified is SECURITY DEFINER — it reads with the definer's
--     privileges, not anon's, so its output is unaffected.
--   * Owner self-service (a manager reading their OWN hotel row for editing)
--     uses the `authenticated` role and the `Hotel Managers can CRUD their
--     own hotels` policy — untouched.
--   * Admin reads use the admin role — untouched.
--
-- WHAT BREAKS (deliberately)
--   Any anon caller doing `select=*` or `select=owner_id` or `select=draft_data`
--   directly against /rest/v1/hotels stops seeing those columns. Repo grep for
--   this pattern found nothing outside the wizard/owner/admin paths above.
-- ============================================================================


REVOKE SELECT ON public.hotels FROM anon;

DO $$
DECLARE
  col text;
  confidential text[] := ARRAY[
    'owner_id',
    'draft_data'
  ];
BEGIN
  FOR col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'hotels'
      AND column_name <> ALL (confidential)
  LOOP
    EXECUTE format('GRANT SELECT (%I) ON public.hotels TO anon', col);
  END LOOP;
END $$;


-- ---------------------------------------------------------------------------
-- VERIFY — run after applying.
-- ---------------------------------------------------------------------------

-- (1) Confidential columns are unreachable by anon. Expect 0 rows.
SELECT column_name AS anon_can_read_confidential
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name   = 'hotels'
  AND grantee      = 'anon'
  AND privilege_type = 'SELECT'
  AND column_name IN ('owner_id', 'draft_data');

-- (2) A representative safe column IS still visible to anon (so the site
-- keeps working). Expect a row for 'name'.
SELECT column_name AS anon_can_still_read
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name   = 'hotels'
  AND grantee      = 'anon'
  AND privilege_type = 'SELECT'
  AND column_name = 'name';

-- (3) The row policy still restricts anon to published hotels. Should list
-- the "Anyone can view published hotels" policy with a USING clause that
-- references `is_published`.
SELECT policyname, qual::text AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'hotels'
  AND cmd = 'SELECT'
ORDER BY policyname;
