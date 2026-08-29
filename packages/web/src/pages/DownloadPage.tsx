import { AlertTriangle, Apple, CheckCircle2, Download, Smartphone } from 'lucide-react'
import { useEffect } from 'react'

/**
 * Internal test-build download page (/download).
 *
 * The APK itself is NOT in git — it's a large build artifact placed in
 * packages/web/public/download/ and shipped by the Railway upload (see .railwayignore, which
 * excludes *.apk except this one). Re-drop the file after a rebuild; the page degrades to a
 * clear "build not available" state if it's missing rather than serving a broken link.
 */

const APK_PATH = '/download/tripavail-android.apk'

export default function DownloadPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Download the TripAvail app'
    // Internal build — keep it out of search results.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => {
      document.title = previous
      meta.remove()
    }
  }, [])

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <img
            src="/brand/logo-mark.png"
            alt=""
            className="mx-auto mb-4 h-16 w-16"
            width={64}
            height={64}
          />
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            TripAvail for Android
          </h1>
          <p className="mt-2 text-muted-foreground">
            Internal test build — for the TripAvail team only.
          </p>
        </div>

        {/* Primary action */}
        <div className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
          <a
            href={APK_PATH}
            download
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-5 w-5" />
            Download the Android app
          </a>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Android 7.0 or newer · works on phones and tablets
          </p>
        </div>

        {/* Install steps — sideloading always trips people up, so spell it out. */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-background p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
            <Smartphone className="h-5 w-5 text-primary" />
            How to install
          </h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {[
              'Open this page on your Android phone and tap Download above.',
              'When the download finishes, tap the file to open it.',
              'Android will ask to allow installs from this source — tap Settings, turn it on, then go back.',
              'Tap Install, then Open.',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
            <span>
              The “unknown source” warning is expected — this build is distributed directly rather
              than through the Play Store. Only install it from this page.
            </span>
          </p>
        </div>

        {/* What to test */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-background p-6">
          <h2 className="mb-4 text-lg font-bold text-foreground">What to test</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'Browse trips, open a tour, check photos, itinerary and pricing',
              'Search — try a destination, a month, and a traveller count',
              'Sign up / sign in, including “Forgot password?”',
              'Operators: the dashboard, bookings, calendar and creating a tour',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            It talks to the live TripAvail database, so anything you create is real. Please don’t
            take a real payment while testing.
          </p>
        </div>

        {/* iOS */}
        <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-background/50 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
            <Apple className="h-5 w-5" />
            iPhone
          </h2>
          <p className="text-sm text-muted-foreground">
            An iOS build isn’t available yet — Apple requires builds to be distributed through
            TestFlight, which needs an Apple Developer account. Android first.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Problems installing? Send a screenshot to the team along with your phone model and
          Android version.
        </p>
      </div>
    </div>
  )
}
