-- Tour Draft Workflow Migration
-- Adds enterprise-level draft/review state management to tours table

-- ── 1. Add workflow status (text with CHECK to avoid enum migration pain) ────
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'draft'
    CHECK (workflow_status IN (
      'draft',
      'in_progress',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'archived'
    )),
  ADD COLUMN IF NOT EXISTS last_edited_at      timestamptz,
  ADD COLUMN IF NOT EXISTS completion_percentage integer NOT NULL DEFAULT 0
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  ADD COLUMN IF NOT EXISTS autosave_enabled    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS rejection_reason    text,
  ADD COLUMN IF NOT EXISTS submitted_at        timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at         timestamptz;

-- ── 2. Back-fill existing rows ────────────────────────────────────────────────
UPDATE public.tours
SET workflow_status = CASE
  WHEN is_published = true  THEN 'approved'
  WHEN is_published = false THEN 'draft'
  ELSE 'draft'
END
WHERE workflow_status = 'draft';

-- ── 3. Index for dashboard "Continue Editing" query ──────────────────────────
CREATE INDEX IF NOT EXISTS tours_workflow_status_operator_idx
  ON public.tours (operator_id, workflow_status)
  WHERE workflow_status IN ('draft', 'in_progress', 'rejected');

-- ── 4. Index for admin review queue ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS tours_submitted_review_idx
  ON public.tours (workflow_status, submitted_at DESC)
  WHERE workflow_status IN ('submitted', 'under_review');
