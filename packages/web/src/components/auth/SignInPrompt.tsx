import { Mail, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'

/**
 * Soft sign-in prompt shown to logged-out visitors shortly after they land, so we capture the
 * login early without blocking browsing. It is dismissible (X / "Maybe later" / click-outside),
 * and once dismissed or signed in it stays quiet for a week. It never shows on the auth pages,
 * and only after auth has finished bootstrapping (so it can't flash before we know the user is
 * actually signed out).
 *
 * "Continue with Google" reuses the existing Supabase OAuth redirect — no extra client-side
 * Google client id / One-Tap library needed.
 */

const DISMISS_KEY = 'tripavail_signin_prompt_dismissed_at'
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const SHOW_DELAY_MS = 2200

function recentlyDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY)
    const at = raw ? Number(raw) : 0
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_WINDOW_MS
  } catch {
    return false
  }
}

export function SignInPrompt() {
  const { user, initialized, isLoading, signInWithGoogle } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // Don't prompt on the auth pages themselves.
  const onAuthRoute = location.pathname.startsWith('/auth')

  useEffect(() => {
    if (!initialized || isLoading || user || onAuthRoute || recentlyDismissed()) return
    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [initialized, isLoading, user, onAuthRoute])

  // If the visitor signs in (in another tab, or after returning), close it.
  useEffect(() => {
    if (user && open) setOpen(false)
  }, [user, open])

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* private mode — fine, it just won't be remembered */
    }
    setOpen(false)
  }

  const continueWithGoogle = async () => {
    setBusy(true)
    try {
      await signInWithGoogle() // redirects to Google, then back to /auth/callback
    } catch {
      setBusy(false)
      navigate('/auth') // fall back to the full auth screen
    }
  }

  if (!open) return null

  return (
    <Dialog
      open={open}
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
              onClick={continueWithGoogle}
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
                setOpen(false)
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
