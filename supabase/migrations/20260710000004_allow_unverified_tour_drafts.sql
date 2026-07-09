-- ============================================================================
-- Let an unapproved operator DRAFT a tour; keep PUBLISHING gated on approval.
--
-- The tours INSERT policy required `can_partner_operate(auth.uid(),'tour_operator')`,
-- which is false until `user_roles.verification_status = 'approved'`. The create-tour
-- wizard autosaves on mount, so an operator whose verification is still pending had
-- every single save rejected by RLS (42501) — before typing anything. The UI showed a
-- silent "Save failed" and retried forever. Nothing they did could ever be stored.
--
-- Drafting is not a privileged act; publishing is. This migration:
--   * lets an operator INSERT their own tour while it is unpublished, and
--   * closes the matching gap on UPDATE — which had NO operative check at all, so an
--     unverified operator could flip `is_published` to true on a row they owned.
-- ============================================================================

DROP POLICY IF EXISTS "Operative tour operators can create tours" ON public.tours;
CREATE POLICY "Operators can create own tour drafts"
  ON public.tours
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = operator_id
    AND (
      -- Drafts are always allowed for the owner…
      COALESCE(is_published, FALSE) = FALSE
      -- …publishing straight away still requires an approved, operative account.
      OR public.can_partner_operate(auth.uid(), 'tour_operator')
    )
  );

DROP POLICY IF EXISTS "Operators can update own tours" ON public.tours;
CREATE POLICY "Operators can update own tours"
  ON public.tours
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = operator_id)
  WITH CHECK (
    auth.uid() = operator_id
    AND (
      COALESCE(is_published, FALSE) = FALSE
      OR public.can_partner_operate(auth.uid(), 'tour_operator')
    )
  );
