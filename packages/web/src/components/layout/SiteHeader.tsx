import { useNavigate } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'
import { CurrencySwitcher } from '@/components/CurrencySwitcher'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { RoleBasedDrawer } from '@/components/navigation/RoleBasedDrawer'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useT } from '@/hooks/useT'

/**
 * The storefront top bar — logo, search, language, currency, theme, account.
 *
 * WHY THIS FILE EXISTS. This was a local `AirbnbHeader` inside LandingPage.tsx, so it rendered on
 * "/" and nowhere else. Every other storefront page — search, tour and package details,
 * collections, checkout — had no top navigation at all: no logo home link, no currency switcher,
 * no account menu. SearchPage made the symptom visible by positioning its filter bar at
 * `sticky top-16`, reserving 64px for a header that was never rendered on that route.
 *
 * It now lives in TravellerLayout so every storefront route gets it. Being `fixed`, it needs the
 * page beneath to reserve its height; the layout applies that once rather than leaving each page
 * to remember.
 */

export function SiteHeader() {
  const navigate = useNavigate()
  const t = useT()
  // Header is deliberately minimal: logo · (empty) · account cluster. Every
  // browse route mounts its own ExploreControls (search + Hotels/Tours/Events
  // pills), so the header no longer owns search or primary nav — that lives
  // where the content lives.
  const { user, activeRole } = useAuth()
  const isAuthenticated = Boolean(user && activeRole)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background/70 supports-[backdrop-filter]:bg-background/55 backdrop-blur-xl border-b border-border/60 z-50">
        <div className="container mx-auto max-w-7xl grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 min-h-[60px] px-4 py-2 md:h-20 md:py-0 md:px-6 lg:px-10">
          {/* Logo + primary nav (desktop). Emblem-only logo on phones; the nav
              collapses to the bottom tab bar there. */}
          <div className="flex items-center gap-4 shrink-0">
            <Logo />
            {/* Primary nav removed from the header — every page hosts its own
                Hotels/Tours/Events pill row via ExploreControls, so the top bar
                does not compete with it. */}
          </div>

          {/* Empty centre column. The header no longer owns search; every browse
              page renders its own via ExploreControls. Keeps the 3-column grid. */}
          <div aria-hidden />

          {/* Right User Menu (drawer + toggles) */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
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
        </div>
      </header>
    </>
  )
}
