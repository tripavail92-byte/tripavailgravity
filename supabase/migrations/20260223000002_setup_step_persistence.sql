-- Add setup_current_step to tour_operator_profiles so the wizard can resume
-- from exactly where the user left off after clicking "Save & Exit".

ALTER TABLE public.tour_operator_profiles
  ADD COLUMN IF NOT EXISTS setup_current_step INTEGER DEFAULT 0;

-- Comment explaining intent
COMMENT ON COLUMN public.tour_operator_profiles.setup_current_step IS
  'Tracks the last step index the user reached during onboarding (0-indexed). '
  'Set to NULL or 0 when setup_completed = true.';
