import { Outlet, useLocation } from 'react-router-dom'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { CollapsibleSidebar } from '@/components/navigation/CollapsibleSidebar'
import { useLocaleDirection } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import { useCurrencyAutoDetect } from '@/store/currencyStore'
import { useLocaleAutoDetect } from '@/store/localeStore'
import { useSidebarStore } from '@/store/sidebarStore'

// The sidebar rides the whole storefront + account area. The only exceptions are the focused
// conversion flows — checkout and booking confirmation — where a nav rail is a distraction.
const NO_SIDEBAR_PREFIXES = ['/checkout', '/booking']

export default function TravellerLayout() {
  // Auto-pick the traveller's display currency from their locale on first visit
  // (a UAE visitor lands on AED); an explicit switcher choice always wins.
  useCurrencyAutoDetect()
  // Same for language (Gulf timezones → Arabic) + keep <html dir> in sync (RTL for Arabic).
  useLocaleAutoDetect()
  useLocaleDirection()

  const location = useLocation()
  const pinned = useSidebarStore((s) => s.pinned)

  const showSidebar = !NO_SIDEBAR_PREFIXES.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/'),
  )

  return (
    <div
      className="min-h-screen bg-background font-sans"
      style={
        {
          // Override Primary Color to Airbnb Rose for Traveller Experience
          // #FF385C -> HSL 351 100% 61%
          '--primary': '351 100% 61%',
          '--primary-foreground': '0 0% 100%',
        } as React.CSSProperties
      }
    >
      {/* Storefront + account. Signed-in visitors get their role menu; anonymous visitors get the
          public browse menu. Hidden only on the focused checkout/booking flows. */}
      {showSidebar ? <CollapsibleSidebar /> : null}
      <div
        className={cn(
          'transition-[padding] duration-200',
          showSidebar ? (pinned ? 'lg:pl-64' : 'lg:pl-16') : '',
        )}
      >
        <main className="min-h-screen relative">
          <Outlet />
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}
