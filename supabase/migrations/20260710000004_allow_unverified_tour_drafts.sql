-- ============================================================================
-- Let an unapproved operator DRAFT a tour; keep making a tour PUBLIC gated on approval.
--
-- The tours INSERT policy required `can_partner_operate(auth.uid(),'tour_operator')`,
-- which is false until `user_roles.verification_status = 'approved'`. The create-tour
-- wizard autosaves on mount, so an operator whose verification is still pending had
-- every save rejected by RLS (42501) — before typing anything. The UI showed a silent
-- "Save failed" and retried forever.
--
-- Drafting is not a privileged act; going public is.
--
-- ── Three things this file has to get right, none of them obvious ─────────────
--
-- 1. `is_published` is NOT the only visibility flag. Public read is granted by
--    "Anyone can view published/active tours" (20260210000013) and "Public can view
--    active tours" (20260210000015), BOTH of which read `is_published = true OR
--    is_active = true`. Gating only `is_published` would let an unapproved operator
--    ship a publicly-visible tour by setting `is_active` instead. Both are gated below.
--
-- 2. A permissive FOR ALL owner policy named "Operators manage own tours" — note the
--    spelling, there is no "can" — was created in 20260210000013 and is never dropped
--    anywhere in this migration tree. Every DROP targets "Operators can manage own
--    tours" (with "can"), a different policy. Permissive policies OR together, so while
--    that FOR ALL policy exists any owner INSERT/UPDATE is authorized and every gate
--    below is dead code. It is dropped first.
--
--    Owner reads survive that drop: "Public can view active tours" already grants SELECT
--    on `auth.uid() = operator_id`, governance_hardening's SELECT-only "Operators can
--    manage own tours" grants it again, and DELETE has its own policy.
--
-- 3. `tours.is_active` and `tours.is_published` both DEFAULT FALSE, and the draft-save
--    payload in tourService.ts sets `is_published: false` and omits `is_active`. So a
--    draft INSERT satisfies the non-public branch with no application change.
--
-- Consequence worth knowing: an operator who is suspended or still pending can no longer
-- edit a tour that is already live. They CAN take it down — an update whose new row has
-- both flags false is allowed — they just cannot keep it public while editing it.
--
-- ── Before applying, settle which world production is in ──────────────────────
--   SELECT policyname, cmd, permissive, qual, with_check
--   FROM pg_policies WHERE schemaname='public' AND tablename='tours'
--   ORDER BY cmd, policyname;
--
--   A row `Operators manage own tours` with cmd=ALL means the old gate was never
--   enforced, so the reported 42501 has some other cause and is worth understanding
--   before trusting this fix. Its absence means production already diverged from this
--   history. Either way the SQL below is correct and safe to run.
--
-- ── After applying, this must return exactly two rows ─────────────────────────
--   SELECT policyname, cmd, qual, with_check
--   FROM pg_policies WHERE schemaname='public' AND tablename='tours'
--     AND policyname IN ('Operators can create own tour drafts',
--                        'Operators can update own tours',
--                        'Operative tour operators can create tours',
--                        'Operators manage own tours');
-- ============================================================================

BEGIN;

-- (0) The permissive FOR ALL owner policy that would OR past every gate below.
--     A no-op if production already lacks it.
DROP POLICY IF EXISTS "Operators manage own tours" ON public.tours;

-- (1) INSERT: the owner may create a non-public draft. Creating something already public
--     still requires an approved, operative account.
DROP POLICY IF EXISTS "Operative tour operators can create tours" ON public.tours;
DROP POLICY IF EXISTS "Operators can create own tour drafts" ON public.tours;
CREATE POLICY "Operators can create own tour drafts"
  ON public.tours
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = operator_id
    AND (
      (COALESCE(is_published, FALSE) = FALSE AND COALESCE(is_active, FALSE) = FALSE)
      OR public.can_partner_operate(auth.uid(), 'tour_operator')
    )
  );

-- (2) UPDATE: the previous policy had USING only and NO WITH CHECK, so an unverified
--     operator could flip is_published/is_active to true on a row they owned.
--     USING sees the old row (they own it); WITH CHECK sees the new one (stays private,
--     or they are approved).
DROP POLICY IF EXISTS "Operators can update own tours" ON public.tours;
CREATE POLICY "Operators can update own tours"
  ON public.tours
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = operator_id)
  WITH CHECK (
    auth.uid() = operator_id
    AND (
      (COALESCE(is_published, FALSE) = FALSE AND COALESCE(is_active, FALSE) = FALSE)
      OR public.can_partner_operate(auth.uid(), 'tour_operator')
    )
  );

COMMIT;
