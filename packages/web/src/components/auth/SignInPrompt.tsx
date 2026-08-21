import { Mail, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

/**
 * Sign-in capture for logged-out visitors.
 *
 * 1. Google One-Tap (the native chip) shows first for anyone with a Google session in the browser —
 *    lowest-friction, one tap to sign in. Uses a hashed nonce so the returned ID token can't be
 *    replayed, and exchanges it for a Supabase session via signInWithIdToken.
 * 2. Soft modal fallback for everyone else (no Google session, One-Tap blocked, or a config gap) —
 *    "Continue with Google" (the redirect flow) / "Continue with email" / "Maybe later".
 *
 * Dismissing (modal or the One-Tap chip) stays quiet for a week; never runs on the /auth pages or
 * before auth has bootstrapped.
 */

const DISMISS_KEY = 'tripavail_signin_prompt_dismissed_at'
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// The Google OAuth client id — public (it's in every OAuth redirect) and matches the id configured
// in Supabase's Google provider, so signInWithIdToken accepts One-Tap tokens. Overridable via env.
const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ||
  '347976301399-rqkcoo5g4q2gm696krbmd8n89m3frvs7.apps.googleusercontent.com'

function recentlyDismissed(): boolean {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY) || 0)
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_WINDOW_MS
  } catch {
    return false
  }
}

function markDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    /* private mode — just won't be remembered */
  }
}

/** Load Google Identity Services once. Resolves false if it can't load (blocked / offline). */
function loadGis(): Promise<boolean> {
  return new Promise((resolve) => {
    const w = window as any
    if (w.google?.accounts?.id) return resolve(true)
    const existing = document.getElementById('google-gsi-client') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(w.google?.accounts?.id)))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const s = document.createElement('script')
    s.id = 'google-gsi-client'
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve(Boolean(w.google?.accounts?.id))
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
}

/** [rawNonce, sha256HexOfRaw] — Google gets the hash, Supabase gets the raw to verify. */
async function makeNonce(): Promise<[string, string]> {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const raw = btoa(String.fromCharCode(...bytes))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return [raw, hashed]
}

export function SignInPrompt() {
  const { user, initialized, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const startedRef = useRef(false)

  const onAuthRoute = location.pathname.startsWith('/auth')
  const eligible = initialized && !isLoading && !user && !onAuthRoute && !recentlyDismissed()

  // One-Tap first, soft modal as the fallback.
  useEffect(() => {
    if (!eligible || startedRef.current) return
    startedRef.current = true
    let cancelled = false

    const run = async () => {
      const loaded = await loadGis()
      const google = (window as any).google
      if (cancelled) return
      if (!loaded || !google?.accounts?.id) {
        setShowModal(true) // GIS unavailable → modal
        return
      }
      try {
        const [rawNonce, hashedNonce] = await makeNonce()
        if (cancelled) return
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: hashedNonce,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async (resp: { credential?: string }) => {
            if (!resp?.credential) return
            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: resp.credential,
              nonce: rawNonce,
            })
            if (error) {
              console.warn('[one-tap] signInWithIdToken failed:', error.message)
              setShowModal(true) // let them use the redirect flow instead
            }
            // success → onAuthStateChange updates the store; the effect below closes everything
          },
        })
        google.accounts.id.prompt((n: any) => {
          // FedCM gives limited signals. Treat an explicit dismissal (not a returned credential) as
          // an opt-out; "not displayed" / "skipped" (usually no Google session in this browser)
          // falls back to the modal so we still capture the login.
          if (n?.isDismissedMoment?.() && n.getDismissedReason?.() !== 'credential_returned') {
            markDismissed()
          } else if (n?.isNotDisplayed?.() || n?.isSkippedMoment?.()) {
            setShowModal(true)
          }
        })
        // Safety net for browsers where the moment callback stops firing (FedCM-mandatory): if
        // still logged out and not dismissed after a few seconds, show the modal.
        window.setTimeout(() => {
          if (!cancelled && !useAuth.getState().user && !recentlyDismissed()) setShowModal(true)
        }, 6000)
      } catch (err) {
        console.warn('[one-tap] init failed:', err)
        setShowModal(true)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [eligible])

  // Signed in (via One-Tap, the modal, or another tab) → close everything.
  useEffect(() => {
    if (user) {
      setShowModal(false)
      ;(window as any).google?.accounts?.id?.cancel?.()
    }
  }, [user])

  const dismiss = () => {
    markDismissed()
    setShowModal(false)
    ;(window as any).google?.accounts?.id?.cancel?.()
  }

  // The modal's "Continue with Google" uses the reliable redirect flow.
  const continueWithGoogleRedirect = async () => {
    setBusy(true)
    try {
      await useAuth.getState().signInWithGoogle()
    } catch {
      setBusy(false)
      navigate('/auth')
    }
  }

  if (!showModal) return null

  return (
    <Dialog
      open={showModal}
      onOpenChange={(next) => {
        if (!next) dismiss()
      }}
    >
      <DialogContent className="max-w-sm overflow-hidden rounded-3xl border-none p-0 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-primary/12 via-background to-background p-7 pt-8">
          <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
            Welcome to TripAvail
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Sign in to book faster, save trips you love, and keep all your bookings in one place.
          </DialogDescription>

          <div className="mt-6 space-y-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={continueWithGoogleRedirect}
              disabled={busy}
              className="h-12 w-full rounded-2xl border-border bg-background text-base font-semibold shadow-sm hover:bg-muted/40"
            >
              <svg
                className="mr-2.5 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              onClick={() => {
                setShowModal(false)
                navigate('/auth')
              }}
              className="h-12 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
            >
              <Mail className="mr-2.5 h-4 w-4" />
              Continue with email
            </Button>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="mx-auto mt-4 block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
