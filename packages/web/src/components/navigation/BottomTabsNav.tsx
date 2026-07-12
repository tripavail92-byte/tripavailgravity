import { BedDouble, Home, Mountain, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface Tab {
  label: string
  icon: LucideIcon
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
 * Premium treatment: the active tab's glyph goes duotone (solid primary stroke + a soft primary
 * fill) inside a rounded highlight chip, with a colour + weight shift on the label — the iOS/Airbnb
 * pattern — while inactive tabs stay as light muted outlines.
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
    { label: 'Home', icon: Home, to: '/' },
    { label: 'Trips', icon: Mountain, to: '/tours' },
    { label: 'Hotels', icon: BedDouble, to: '/hotels', match: ['/hotel'] },
    {
      label: 'Profile',
      icon: UserRound,
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
            className="group flex flex-1 flex-col items-center justify-center gap-0.5 pb-1.5 pt-1.5"
          >
            <span
              className={cn(
                'flex h-9 w-[3.25rem] items-center justify-center rounded-2xl transition-all duration-200 ease-out',
                active
                  ? 'bg-primary/10 -translate-y-0.5'
                  : 'bg-transparent group-active:bg-muted/60',
              )}
            >
              <Icon
                className={cn(
                  'h-[22px] w-[22px] transition-colors duration-200',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
                // Duotone when active: solid primary stroke over a soft primary wash.
                fill={active ? 'currentColor' : 'none'}
                fillOpacity={active ? 0.16 : 0}
                strokeWidth={active ? 2.1 : 1.8}
              />
            </span>
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
