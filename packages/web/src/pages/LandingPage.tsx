import { CheckCircle2, ShieldCheck, Star, Zap } from 'lucide-react'

import { HomeCategoryFeed } from '@/components/home/HomeCategoryFeed'
import { QueryErrorBoundaryWrapper } from '@/components/QueryErrorBoundary'
import { Card } from '@/components/ui/card'
import { useSeo } from '@/hooks/useSeo'

export default function LandingPage() {
  useSeo({
    canonicalPath: '/',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'TripAvail',
        url: 'https://tripavail.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://tripavail.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'TripAvail',
        url: 'https://tripavail.com',
        logo: 'https://tripavail.com/brand/logo-emblem-512.png',
      },
    ],
  })

  // overflow-x: CLIP, not hidden. `overflow-x: hidden` implies `overflow-y: auto`,
  // which turns this div into a scroll ancestor and captures every `position: sticky`
  // descendant. AirbnbSearchBar's sticky then anchors to a container that doesn't
  // itself scroll (the window does), so on scroll the bar drifts off with the page
  // instead of pinning. `overflow-x: clip` clips horizontally without becoming a
  // scroll ancestor, and sticky pins to the viewport as intended.
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip">
      <div className="container mx-auto max-w-7xl px-4 pb-6">
        <div className="space-y-8">
          {/*
            Layout order: search + mode pills first, THEN the geo-adaptive hero,
            then the mode-driven feed. The hero is passed to HomeCategoryFeed as
            a slot so the pill state stays local — the pills come from the same
            component that renders the sections they drive.
          */}
          <QueryErrorBoundaryWrapper>
            <HomeCategoryFeed />
          </QueryErrorBoundaryWrapper>

          {/* Trust Strip — moved below the listings so experiences lead the page */}
          {/* The four bare trust chips that used to sit here were unbacked
              ("Instant confirmation", "Top-rated trips" — every tour has rating 0)
              and rendered BELOW every card. HomeCategoryFeed now renders a TrustBand
              directly under the hero that explains how the marketplace actually works. */}
        </div>
      </div>
    </div>
  )
}

// Airbnb Header Component
