/**
 * LAUNCH SCOPE — the single switch that controls which product verticals are
 * live. TripAvail launches as a TRIPS-ONLY product (tours) to grab first-mover
 * advantage; Events and Hotels are later phases.
 *
 *   Phase 1 (LAUNCH):  tours   = true
 *   Phase 2:           events  = true   (flip it on)
 *   Phase 3:           hotels  = true   (flip it on — covers hotels, stays & packages)
 *
 * GATE, DON'T GUT: every hotel/events/packages surface across web + mobile is
 * hidden/redirected behind these flags but left intact in the tree, so a phase
 * relaunches by flipping the flag — no rebuild of the feature, no re-add.
 *
 * IMPORTANT — how each app sees a change here:
 *   • Web reads @tripavail/shared from SOURCE (vite alias → ../shared/src), so a
 *     flip lands on the next dev/build with no extra step.
 *   • Mobile reads @tripavail/shared from DIST (package `main` → ./dist/index.js).
 *     After flipping a flag you MUST rebuild shared so Metro picks it up:
 *       pnpm --filter @tripavail/shared build
 *
 * This is a plain compile-time constant on purpose — no env plumbing (web uses
 * VITE_*, mobile uses EXPO_PUBLIC_*; a shared const avoids the double wiring).
 */
export const LAUNCH_SCOPE = {
  tours: true,
  events: false,
  /** Covers the whole hotel side: hotels, room-only "stays", and packages. */
  hotels: false,
} as const

export type LaunchSurface = keyof typeof LAUNCH_SCOPE

/** Is a given product surface live in this launch? */
export function isSurfaceEnabled(surface: LaunchSurface): boolean {
  return LAUNCH_SCOPE[surface]
}

/** Convenience: true when we're in the trips-only launch (no hotels, no events). */
export const TRIPS_ONLY = !LAUNCH_SCOPE.hotels && !LAUNCH_SCOPE.events
