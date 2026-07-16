-- =====================================================================
-- Fix: the tour wizard's "Additional Physical Requirements / Logistics" textarea was bound to
-- data.description, so whatever the operator typed there OVERWROTE the tour description and then
-- rendered on the live tour page under the heading "About the Journey".
--
-- Physical requirements are not a description — give them their own column.
--
-- Additive and nullable: safe to apply any time, and existing rows are untouched.
--
-- NOTE: no backfill here, deliberately. Existing tours have physical-requirements text sitting in
-- tours.description, but a blind `UPDATE tours SET physical_requirements = description` would be
-- wrong for every tour whose description is a genuine description. That needs a human to review
-- row by row — see the triage notes.
-- =====================================================================

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS physical_requirements TEXT;

COMMENT ON COLUMN public.tours.physical_requirements IS
  'Operator-supplied physical requirements / logistics for the tour. Distinct from description ("About the Journey"); rendered in its own section on the tour page.';
