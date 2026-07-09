/**
 * The canonical order of the operator setup wizard's steps.
 *
 * This list is the single source of truth for turning a saved step index into a deep-link
 * slug (`/operator/setup?step=fleet`). It previously lived duplicated in the dashboard, which
 * drifted out of sync with the wizard — `fleet` and `guides` were missing, so any operator
 * saved at step 6 or later resumed on the wrong step. Import this in both places.
 */
export const SETUP_STEP_SLUGS = [
  'welcome',
  'personal',
  'profile-pic',
  'business',
  'services',
  'coverage',
  'fleet',
  'guides',
  'policies',
  'completion',
] as const

export type SetupStepSlug = (typeof SETUP_STEP_SLUGS)[number]

/** Maps a persisted step index onto its slug, clamped to the valid range. */
export function setupStepSlugForIndex(index: number): SetupStepSlug {
  const clamped = Math.min(Math.max(0, Math.trunc(index)), SETUP_STEP_SLUGS.length - 1)
  return SETUP_STEP_SLUGS[clamped]
}
