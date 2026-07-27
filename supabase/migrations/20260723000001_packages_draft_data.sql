-- ============================================================================
-- packages.draft_data — make the package wizard resumable
--
-- REPORTED: "There is no exit or back option, we need to back the window manually or through
-- dashboard, it goes to step 1 instead of the recent one."
--
-- The diagnosis is not what the wording suggests. The wizard does not resume at the WRONG step —
-- there is nothing to resume to at all. The package flow has no persistence of any kind: no
-- draft_data column, no autosave, no load path. Every piece of an 11-step wizard lives in React
-- state, so a refresh, a closed tab or an accidental Back loses all of it. Starting at step 1 is
-- the honest consequence, not the bug.
--
-- Hotels have had exactly this since 20260207000001. This gives packages the same thing, matching
-- that column's shape and intent so the two flows behave alike.
--
-- WHY A JSONB BLOB RATHER THAN REAL COLUMNS. The wizard collects far more than the packages table
-- models (per-room package pricing, selected room ids, blackout dates, step-local UI state), and a
-- half-finished step has no valid shape to store relationally. draft_data holds the form exactly as
-- the wizard left it; the typed columns alongside carry whatever is already known so the row is
-- still listable on the dashboard. publishPackage then promotes the same row rather than inserting
-- a second one — see the note below, which is the part that would otherwise bite.
--
-- ── WHAT THIS MIGRATION DELIBERATELY DOES NOT DO ────────────────────────────
--
-- It does NOT relax packages.package_type NOT NULL, packages.name NOT NULL, or
-- packages_name_min_length CHECK (char_length(name) >= 3).
--
-- A draft saved on step 1 has none of those yet, so the client supplies placeholders
-- ('Untitled Package', 'custom') exactly as hotelService.saveDraft does. Loosening real constraints
-- to accommodate a half-filled form would weaken every published row to buy convenience for drafts,
-- and the placeholder is visible and correctable in the wizard.
--
-- It also does NOT need to touch packages_published_requires_price (20260722000006): that
-- constraint is `is_published = FALSE OR base_price_per_night > 0`, and a draft is unpublished by
-- definition, so drafts pass it untouched. That is why it was written partial rather than NOT NULL.
-- ============================================================================

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS draft_data JSONB;

COMMENT ON COLUMN public.packages.draft_data IS
  'Complete wizard form state for an unpublished package, so listing creation can be resumed. Cleared to NULL when the package is published.';

-- Drafts are read by owner and ordered by recency on the dashboard. Partial, because published rows
-- never carry draft_data and there is no reason to index them.
CREATE INDEX IF NOT EXISTS packages_owner_drafts_idx
  ON public.packages (owner_id, updated_at DESC)
  WHERE is_published = FALSE;

-- ============================================================================
-- Verify:
--
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'draft_data';
--
-- Expect one row: draft_data | jsonb | YES.
--
-- Existing published packages are unaffected — the column is nullable with no default, so nothing
-- is rewritten and no row changes meaning.
-- ============================================================================
