import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  HikerTabIcon,
  HomeTabIcon,
  HotelTabIcon,
  type TabIconProps,
  UserTabIcon,
} from '@/components/navigation/tabIcons'

type TabIcon = (props: TabIconProps) => JSX.Element

interface Tab {
  label: string
  icon: TabIcon
  to: string
  /** Extra path prefixes that should also light this tab up. */
  match?: string[]
}

// Prefix-aware active state (mirrors CollapsibleSidebar.isItemActive) so detail routes like
// /tours/:id keep their parent tab highlighted.
function isActive(pathname: string, to: string, match?: string[]) {
  const hit = (base: string) =>
    base === '/' ? pathname === '/' : pathname === base || pathname.startsWith(base + '/')
  return hit(to) || (match?.some(hit) ?? false)
}

/**
 * Mobile bottom tab bar — the app-shell primary nav for the storefront + traveller experience.
 * Mounted once in TravellerLayout (never on operator/manager/admin shells), hidden on desktop
 * where the collapsible sidebar takes over, and only shown to anonymous visitors and travellers.
 *
 * Uses the custom two-state glyphs in tabIcons.tsx: the active tab's icon is a solid rose
 * silhouette that lifts slightly, inactive tabs are light muted outlines. No background chip.
 */
export function BottomTabsNav() {
  const { pathname } = useLocation()
  const { user, activeRole } = useAuth()

  // Storefront chrome: show to anonymous visitors and travellers only. A signed-in operator/manager
  // browsing the public storefront keeps their own context instead of a traveller bar.
  const roleType = activeRole?.role_type
  if (roleType && roleType !== 'traveller') return null

  const isAuthenticated = Boolean(user && activeRole)

  const tabs: Tab[] = [
    { label: 'Home', icon: HomeTabIcon, to: '/' },
    { label: 'Trips', icon: HikerTabIcon, to: '/tours' },
    { label: 'Hotels', icon: HotelTabIcon, to: '/hotels', match: ['/hotel'] },
    {
      label: 'Profile',
      icon: UserTabIcon,
      to: isAuthenticated ? '/profile' : '/auth?mode=login',
      match: ['/profile', '/dashboard', '/trips', '/wishlist', '/settings', '/payment-methods'],
    },
  ]

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around glass-nav-bottom pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = isActive(pathname, tab.to.split('?')[0], tab.match)
        return (
          <Link
            key={tab.label}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
          >
            <Icon
              active={active}
              className={cn(
                'h-[26px] w-[26px] transition-all duration-200 ease-out',
                active ? 'text-primary -translate-y-0.5' : 'text-muted-foreground',
              )}
            />
            <span
              className={cn(
                'text-[10px] leading-none tracking-wide transition-colors duration-200',
                active ? 'font-semibold text-primary' : 'font-medium text-muted-foreground',
              )}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
