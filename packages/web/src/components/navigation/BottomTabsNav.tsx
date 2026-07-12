import { Building2, Home, Mountain, UserCircle } from 'lucide-react'
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
    { label: 'Hotels', icon: Building2, to: '/hotels', match: ['/hotel'] },
    {
      label: 'Profile',
      icon: UserCircle,
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
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className={cn('h-6 w-6', active && 'fill-primary/10')} strokeWidth={active ? 2.4 : 2} />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
