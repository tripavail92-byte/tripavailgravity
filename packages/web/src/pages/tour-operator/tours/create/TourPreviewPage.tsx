import { ArrowLeft, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { Tour } from '@/features/tour-operator/services/tourService'
import TourDetailsPage from '@/pages/traveller/TourDetailsPage'

import { TOUR_PREVIEW_KEY } from './previewDraft'

/**
 * Live preview of an unsaved tour draft.
 *
 * The wizard writes its draft to sessionStorage and opens this route in a new tab; the operator
 * keeps their place in the form while checking the result. The preview renders the REAL traveller
 * page (TourDetailsPage in preview mode), not a mock-up — a mock-up would drift from the page it
 * claims to show, which is exactly the reassurance a preview is supposed to give.
 *
 * sessionStorage, not a query string: a full draft (itinerary, images, pricing tiers) is far past
 * a workable URL length, and it stays inside the tab that wrote it.
 */

export default function TourPreviewPage(): JSX.Element {
  const [draft, setDraft] = useState<Tour | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TOUR_PREVIEW_KEY)
      if (!raw) {
        setMissing(true)
        return
      }
      setDraft(JSON.parse(raw) as Tour)
    } catch {
      // A corrupt or unreadable draft is the same situation as no draft: send them back.
      setMissing(true)
    }
  }, [])

  if (missing) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-foreground">Nothing to preview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Previews open from the trip editor and last as long as that tab. Open your trip and
            press Preview again.
          </p>
          <Button className="mt-6 rounded-xl" onClick={() => window.close()}>
            Close this tab
          </Button>
        </div>
      </div>
    )
  }

  if (!draft) return <div className="min-h-screen" />

  return (
    <div className="min-h-screen">
      {/* Preview chrome. Deliberately loud: an operator must never mistake this for the live
          page, and every booking control below is inert. */}
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Eye className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">Preview</p>
            <p className="text-xs text-muted-foreground">
              How travellers will see this trip. Booking is switched off here.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="h-9 shrink-0 gap-2 rounded-xl text-sm font-semibold"
          onClick={() => window.close()}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to editing
        </Button>
      </div>

      <TourDetailsPage previewTour={draft} />
    </div>
  )
}
