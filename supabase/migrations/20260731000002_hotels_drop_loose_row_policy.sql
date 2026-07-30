-- ============================================================================
-- Hotels: drop the loose "Enable read access for all users" row policy
--
-- WHY (found in the same 2026-07-31 diagnostic that surfaced the column leak):
--   The hotels table carries TWO SELECT row-policies. The narrow one is fine —
--   "Anyone can view published hotels" USING (is_published = true) — but
--   alongside it there is a Supabase-preset policy "Enable read access for all
--   users" USING (true). Because RLS policies combine with OR, any anon caller
--   can enumerate EVERY hotel row (published or draft), which defeats the
--   is_published gate that everything else on the site relies on. Combined
--   with the previous fix's column grants, anon can no longer see owner_id or
--   draft_data — but they can still list every draft hotel's name, location,
--   price, images, etc. That is exactly what the draft state is supposed to
--   hide.
--
-- WHAT KEEPS WORKING AFTER THE DROP:
--   * Anon: still reads published hotels via the surviving "Anyone can view
--     published hotels" policy (USING is_published = true).
--   * Owners (authenticated + user_id = auth.uid()): still see their OWN drafts
--     via "Hotel Managers can CRUD their own hotels" (FOR ALL, USING
--     auth.uid() = owner_id). Verified in 20260130000001_create_hotels.sql.
--   * Admins: their own moderation policies remain intact.
--   * Service role: bypasses RLS by design — server-side code untouched.
--
-- SCOPE GUARD:
--   DROP POLICY IF EXISTS is idempotent — no error if it has already been
--   dropped in some environment. Named check by exact policy name; if there is
--   a similarly-loose policy under a different name, this file does NOT touch
--   it (add another statement if the preview surfaces one).
-- ============================================================================


-- ── STEP 0 — PREVIEW. Every SELECT policy on hotels + which roles it applies
-- to. Look for the "Enable read access for all users" row with USING = true and
-- roles = {public}. Do NOT drop if the roles column shows something narrower
-- (e.g. it's been retargeted to authenticated only) — that would be a
-- deliberate later change and we don't want to silently roll it back.
SELECT policyname, roles::text AS applies_to_roles, qual::text AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'hotels'
  AND cmd        = 'SELECT'
ORDER BY policyname;


BEGIN;

-- ── STEP 1 — Drop the loose policy. Named exactly so we can't nuke the wrong
-- one by accident.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.hotels;


-- ── SANITY. Read all three before COMMIT / ROLLBACK.
-- Expected after:
--   * remaining_select_policies = 1 (only "Anyone can view published hotels")
--   * remaining_select_policies_using_true = 0 (no more open row-access)
--   * that policy's using_clause references is_published
SELECT count(*) AS remaining_select_policies
FROM pg_policies
WHERE schemaname='public' AND tablename='hotels' AND cmd='SELECT';

SELECT count(*) AS remaining_select_policies_using_true
FROM pg_policies
WHERE schemaname='public' AND tablename='hotels' AND cmd='SELECT'
  AND qual::text = 'true';

SELECT policyname, qual::text AS using_clause
FROM pg_policies
WHERE schemaname='public' AND tablename='hotels' AND cmd='SELECT';

COMMIT;
-- ROLLBACK;  -- swap for COMMIT above if any sanity number is unexpected.


-- ── VERIFY FROM OUTSIDE (as anon, from a REST call):
--   GET /rest/v1/hotels?is_published=eq.false&select=id,name
--     Before: 200 with N draft rows leaked.
--     After : 200 with an EMPTY array (no policy grants those rows to anon).
--
--   GET /rest/v1/hotels?is_published=eq.true&select=id,name
--     Still 200 with the published rows — site keeps working.
-- ============================================================================
