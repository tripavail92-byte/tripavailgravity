/**
 * Recovery for stale lazy-loaded chunks after a deploy.
 *
 * Vite fingerprints every route chunk (SearchPage-<hash>.js). A new deploy writes new hashes and
 * removes the old files. A browser tab opened before the deploy still holds the old index.html, so
 * the moment it lazy-loads a route whose hash changed, the request 404s and the dynamic import
 * rejects with "Failed to fetch dynamically imported module" — and the user hits an error screen for
 * a page that is perfectly fine, just newer. The cure is simply to reload: the fresh index.html
 * points at the chunks that exist.
 */

const RELOAD_KEY = 'tripavail-chunk-reload-at'
const RELOAD_COOLDOWN_MS = 10_000

/** True when an error is a lazily-imported-chunk load failure — the signature of a stale deploy. */
export function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '')
  const name = error instanceof Error ? error.name : ''
  return (
    name === 'ChunkLoadError' ||
    /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|dynamically imported module/i.test(
      msg,
    )
  )
}

/**
 * Reload to pull fresh assets — but at most once per cooldown, so a chunk that is genuinely broken
 * (not merely stale) can't trap the tab in a reload loop. Returns true if a reload was triggered.
 */
export function reloadForFreshAssets(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || '0')
    if (Date.now() - last > RELOAD_COOLDOWN_MS) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
      window.location.reload()
      return true
    }
  } catch {
    // sessionStorage can be unavailable (private mode, blocked storage). Reload once unguarded
    // rather than leave the user stranded — the worst case is a single extra reload.
    window.location.reload()
    return true
  }
  return false
}
