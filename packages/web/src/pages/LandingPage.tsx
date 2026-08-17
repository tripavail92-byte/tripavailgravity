import { CheckCircle2, ShieldCheck, Star, Zap } from 'lucide-react'

import { GeoHomeHero } from '@/components/home/GeoHomeHero'
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
            <HomeCategoryFeed hero={<GeoHomeHero />} />
          </QueryErrorBoundaryWrapper>

          {/* Trust Strip — moved below the listings so experiences lead the page */}
          <section className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border border-border/60 rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold">Verified partners</div>
                </div>
              </Card>
              <Card className="border border-border/60 rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <Zap className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold">Instant confirmation</div>
                </div>
              </Card>
              <Card className="border border-border/60 rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold">Secure checkout</div>
                </div>
              </Card>
              <Card className="border border-border/60 rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <Star className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold">Top-rated trips</div>
                </div>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// Airbnb Header Component
