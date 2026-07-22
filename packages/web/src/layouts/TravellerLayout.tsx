import { Outlet, useLocation } from 'react-router-dom'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { BottomTabsNav } from '@/components/navigation/BottomTabsNav'
import { CollapsibleSidebar } from '@/components/navigation/CollapsibleSidebar'
import { RoleBasedDrawer } from '@/components/navigation/RoleBasedDrawer'
import { useAuth } from '@/hooks/useAuth'
import { useLocaleDirection } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import { useCurrencyAutoDetect } from '@/store/currencyStore'
import { useLocaleAutoDetect } from '@/store/localeStore'
import { useSidebarStore } from '@/store/sidebarStore'

// The signed-in traveller ACCOUNT area gets the sidebar; the public storefront (home, browse,
// search, listing details, checkout) stays a clean top-nav storefront. Matched by path prefix.
const ACCOUNT_PREFIXES = [
  '/dashboard',
  '/profile',
  '/trips',
  '/wishlist',
  '/payment-methods',
  '/settings',
]

export default function TravellerLayout() {
  // Auto-pick the traveller's display currency from their locale on first visit
  // (a UAE visitor lands on AED); an explicit switcher choice always wins.
  useCurrencyAutoDetect()
  // Same for language (Gulf timezones → Arabic) + keep <html dir> in sync (RTL for Arabic).
  useLocaleAutoDetect()
  useLocaleDirection()

  const location = useLocation()
  const { activeRole } = useAuth()
  const pinned = useSidebarStore((s) => s.pinned)

  const isAccountRoute = ACCOUNT_PREFIXES.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/'),
  )
  const showSidebar = isAccountRoute && activeRole?.role_type === 'traveller'

  return (
    <div
      className="min-h-screen overflow-x-clip bg-background font-sans"
      style={
        {
          // Override Primary Color to Airbnb Rose for Traveller Experience
          // #FF385C -> HSL 351 100% 61%
          '--primary': '351 100% 61%',
          '--primary-foreground': '0 0% 100%',
        } as React.CSSProperties
      }
    >
      {/* Account area only, never the public storefront. Desktop gets the collapsed sidebar; the
          sidebar is hidden on mobile, so mobile gets the same hamburger drawer the rest of the app
          uses (the traveller dashboard has no menu of its own). */}
      {showSidebar ? (
        <>
          <CollapsibleSidebar />
          <div className="fixed right-3 top-3 z-50 lg:hidden">
            <RoleBasedDrawer />
          </div>
        </>
      ) : null}
      <div
        className={cn(
          'transition-[padding] duration-200',
          // Clear the fixed mobile bottom bar. Applied only below lg (where the bar shows); a
          // directional max-lg class avoids the arbitrary-value-vs-responsive ordering clash that
          // let a plain `lg:pb-0` lose to `pb-[calc(...)]`.
          'max-lg:pb-[calc(4rem+env(safe-area-inset-bottom))]',
          showSidebar ? (pinned ? 'lg:pl-64' : 'lg:pl-16') : '',
        )}
      >
        {/* The storefront top bar. It used to live inside LandingPage as a local component, so it
            appeared on "/" and nowhere else — search, listing details, collections and checkout all
            rendered with no navigation at all. Hoisting it here is what makes the storefront one
            site rather than a home page plus a set of orphans.

            The account area opts out: it already has the sidebar and its own chrome, and would
            otherwise show two navigations at once. */}
        {!showSidebar ? <SiteHeader /> : null}

        {/* SiteHeader is `fixed`, so nothing below it reserves space on its own. Applying the
            offset once here means a new storefront page cannot forget it — which is exactly how
            SearchPage ended up positioning its filter bar at top-16 against a header that was not
            rendered on that route. */}
        <main className={cn('min-h-screen relative', !showSidebar && 'pt-[60px] md:pt-20')}>
          <Outlet />
        </main>

        <SiteFooter />
      </div>

      {/* Global mobile tab bar (storefront + traveller only; self-gates role + hides on desktop). */}
      <BottomTabsNav />
    </div>
  )
}
