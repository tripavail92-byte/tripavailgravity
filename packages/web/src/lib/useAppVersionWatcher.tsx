import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'

// The Vite build emits a content-hashed entry (…/assets/index-<hash>.js). The hash changes on every
// deploy, so comparing the running tab's entry to the one referenced by the freshly-fetched
// index.html tells us a newer build is live.
function currentEntry(): string | null {
  const s = document.querySelector(
    'script[type="module"][src*="/assets/index-"]',
  ) as HTMLScriptElement | null
  return s?.src.match(/index-[A-Za-z0-9_-]+\.js/)?.[0] ?? null
}

async function deployedEntry(): Promise<string | null> {
  // index.html is served no-store, so this always reflects the live deploy.
  const res = await fetch('/', { cache: 'no-store' })
  if (!res.ok) return null
  const html = await res.text()
  return html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/)?.[1] ?? null
}

/**
 * Detects when a newer build has been deployed while a tab is open and shows a one-click "Refresh"
 * toast, so users (and admins verifying a change) don't have to remember to hard-refresh. It never
 * reloads on its own — a click is always required — so in-progress form input is never lost.
 *
 * Checks on tab focus/visibility (the moment you come back to look) and on a slow poll. No-ops in
 * dev, where Vite serves an un-hashed entry (nothing to compare).
 */
export function useAppVersionWatcher() {
  const promptedRef = useRef(false)

  useEffect(() => {
    const initial = currentEntry()
    if (!initial) return // dev build — no hashed entry to diff against
    let stopped = false

    const check = async () => {
      if (stopped || promptedRef.current || document.hidden || !navigator.onLine) return
      try {
        const deployed = await deployedEntry()
        if (stopped || promptedRef.current || !deployed) return
        if (deployed !== initial) {
          promptedRef.current = true
          toast(
            () => (
              <span className="flex items-center gap-3">
                <span className="text-sm font-medium">A new version of TripAvail is available.</span>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                >
                  Refresh
                </button>
              </span>
            ),
            { id: 'app-update', duration: Infinity },
          )
        }
      } catch {
        /* offline / transient network — retry on the next tick */
      }
    }

    const onVisible = () => {
      if (!document.hidden) void check()
    }
    const intervalId = window.setInterval(() => void check(), 90_000)
    const kickoff = window.setTimeout(() => void check(), 8_000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      stopped = true
      window.clearInterval(intervalId)
      window.clearTimeout(kickoff)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])
}
