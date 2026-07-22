import { CheckCircle2, Search, ShieldCheck, Star, Zap } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'
import { CurrencySwitcher } from '@/components/CurrencySwitcher'
import { GeoHomeHero } from '@/components/home/GeoHomeHero'
import { HomeCategoryFeed } from '@/components/home/HomeCategoryFeed'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { RoleBasedDrawer } from '@/components/navigation/RoleBasedDrawer'
import { QueryErrorBoundaryWrapper } from '@/components/QueryErrorBoundary'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import type { SearchFilters } from '@/components/search/TripAvailSearchBar'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass'
import { useAuth } from '@/hooks/useAuth'
import { useSeo } from '@/hooks/useSeo'
import { useT } from '@/hooks/useT'

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

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="container mx-auto max-w-7xl px-4 pb-6">
        <div className="space-y-8">
          {/* Geo-adaptive hero — reshapes to the visitor's country (real supply → "Discover
              {country}"; no supply yet → honest "expanding" band; unknown → global default). */}
          <GeoHomeHero />

          {/* Category chips + one vertical feed of full-width cards (replaces the old stack of
              horizontal category rows — mobile scrolls straight down, one listing per row). */}
          <QueryErrorBoundaryWrapper>
            <HomeCategoryFeed />
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
                  <div className="text-xs sm:text-sm font-semibold">Top-rated stays</div>
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
