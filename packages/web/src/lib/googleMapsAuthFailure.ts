// Google's Maps JS API calls a single global `window.gm_authFailure()` callback when
// authentication fails (bad key, disabled billing, disabled API, referrer restriction).
// Several components on the same page may each want to know about this (e.g. a page can
// render more than one CityAutocomplete at once), so this module installs the global hook
// exactly once and fans the notification out to every subscriber — safe for any number of
// mounted consumers.
type Listener = () => void

const listeners = new Set<Listener>()
let installed = false

function ensureInstalled() {
  if (installed) return
  installed = true

  const prev = (window as any).gm_authFailure
  ;(window as any).gm_authFailure = () => {
    listeners.forEach((cb) => cb())
    if (typeof prev === 'function') {
      try {
        prev()
      } catch {
        // ignore — a previous handler misbehaving shouldn't break this one
      }
    }
  }
}

/** Subscribe to Google Maps auth-failure events. Returns an unsubscribe function. */
export function subscribeGoogleMapsAuthFailure(callback: Listener): () => void {
  ensureInstalled()
  listeners.add(callback)
  return () => listeners.delete(callback)
}
