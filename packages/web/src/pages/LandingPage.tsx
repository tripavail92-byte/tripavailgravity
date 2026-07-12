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
      {/* Airbnb Header (Fixed) */}
      <AirbnbHeader />

      <div className="container mx-auto max-w-7xl px-4 pt-28 md:pt-24 pb-6">
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
function AirbnbHeader() {
  const navigate = useNavigate()
  const t = useT()
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false)
  const { user, activeRole } = useAuth()
  const isAuthenticated = Boolean(user && activeRole)

  const handleSearch = (_filters: SearchFilters) => {
    const params = new URLSearchParams()
    if (_filters.query) params.set('q', _filters.query)
    if (_filters.location) params.set('location', _filters.location)
    if (_filters.category && _filters.category !== 'all') params.set('category', _filters.category)
    if (_filters.duration) params.set('duration', _filters.duration)
    if (_filters.priceRange[0] !== 0) params.set('minPrice', _filters.priceRange[0].toString())
    if (_filters.priceRange[1] !== 5000) params.set('maxPrice', _filters.priceRange[1].toString())
    if (_filters.minRating > 0) params.set('minRating', _filters.minRating.toString())
    // NOTE: `types` is reserved for the listing-type contract (tour/package) that
    // /search consumes — do not serialise experience themes into it.

    setIsSearchOverlayOpen(false)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background border-b z-50">
        <div className="container mx-auto max-w-7xl min-h-20 px-4 py-3 md:py-0 md:h-20 md:px-6 lg:px-10 flex flex-wrap items-center gap-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-3">
          {/* Logo — central Logo component, links home. */}
          <div className="flex items-center shrink-0 order-1">
            <Logo />
          </div>

          {/* Centered Search Bar (Hidden on mobile, visible on tablet+). order-2 keeps it in the
              MIDDLE grid column — without it, its default order:0 sorted it before the order-1 logo,
              rendering search-left / logo-center. */}
          <div className="hidden md:flex justify-center min-w-0 order-2">
            <GlassCard
              variant="light"
              className="p-2 rounded-[2rem] shadow-2xl shadow-black/20 max-w-3xl w-full flex flex-row items-center gap-2 border border-white/30"
            >
              <button
                data-tour="search-bar"
                type="button"
                className="flex-1 w-full px-6 flex items-center gap-3 border-r border-border/50 py-3 min-w-0"
                onClick={() => setIsSearchOverlayOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setIsSearchOverlayOpen(true)
                }}
                aria-label="Open search"
              >
                <Search className="w-5 h-5 text-primary" />
                <input
                  type="text"
                  readOnly
                  value=""
                  placeholder={t('search.whereToNext')}
                  className="w-full bg-transparent border-none outline-none font-bold text-foreground placeholder:text-muted-foreground"
                  onFocus={() => setIsSearchOverlayOpen(true)}
                />
              </button>

              <Button
                type="button"
                onClick={() => setIsSearchOverlayOpen(true)}
                className="px-10 h-14 rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg transition-all hover:scale-[1.02] shadow-xl shadow-primary/20"
              >
                {t('nav.exploreNow')}
              </Button>
            </GlassCard>
          </div>

          {/* Right User Menu */}
          <div className="flex items-center justify-end gap-2 shrink-0 order-3 ml-auto md:ml-0">
            {/* Language + currency picker + dark/light toggle — always in the top bar */}
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <CurrencySwitcher className="hidden sm:inline-flex" />
            <ThemeToggle />

            {/* Become a Partner — near the menu (Airbnb-style). Tablet/desktop; phones use the drawer entry. */}
            {(!isAuthenticated || activeRole?.role_type === 'traveller') && (
              <Button
                variant="ghost"
                className="hidden md:inline-flex h-9 rounded-full px-4 font-semibold text-foreground hover:bg-muted"
                onClick={() => navigate('/partner/onboarding')}
              >
                {t('nav.becomePartner')}
              </Button>
            )}

            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-9 rounded-full px-4"
                  onClick={() => navigate('/auth?mode=login')}
                >
                  {t('nav.login')}
                </Button>
                <Button
                  className="h-9 rounded-full px-4 text-primary-foreground"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  {t('nav.signup')}
                </Button>
              </div>
            ) : (
              <RoleBasedDrawer />
            )}
          </div>

          {/* Mobile Search Bar — a single compact pill below the logo/menu row on phones. The
              "Explore Now" CTA was dropped here (tapping the pill already opens search) so the row
              stays slim and doesn't eat vertical space. */}
          <div className="order-4 basis-full md:hidden min-w-0">
            <GlassCard
              variant="light"
              className="w-full rounded-full border border-white/30 p-1 shadow-lg shadow-black/10"
            >
              <button
                data-tour="search-bar"
                type="button"
                className="flex w-full min-w-0 items-center gap-2.5 rounded-full px-3.5 py-2"
                onClick={() => setIsSearchOverlayOpen(true)}
                aria-label="Open search"
              >
                <Search className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-semibold text-foreground">
                  {t('search.whereToNext')}
                </span>
              </button>
            </GlassCard>
          </div>
        </div>
      </header>

      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
        onSearch={handleSearch}
      />
    </>
  )
}
