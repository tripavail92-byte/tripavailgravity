import { motion, useReducedMotion, type Transition } from 'motion/react'
import { useEffect, useRef } from 'react'
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

// Springy lift for the active glyph; iOS-elastic values consistent with the drawer chrome.
const LIFT_SPRING: Transition = { type: 'spring', stiffness: 520, damping: 20, mass: 0.7 }
// Outline → solid crossfade (the two stacked glyph copies).
const FADE: Transition = { duration: 0.22, ease: 'easeOut' }

// Prefix-aware active state (mirrors CollapsibleSidebar.isItemActive) so detail routes like
// /tours/:id keep their parent tab highlighted.
function isActive(pathname: string, to: string, match?: string[]) {
  const hit = (base: string) =>
    base === '/' ? pathname === '/' : pathname === base || pathname.startsWith(base + '/')
  return hit(to) || (match?.some(hit) ?? false)
}

/**
 * One tab. The RESTING look (solid vs outline, colour, lift) is committed synchronously via
 * initial={false}, so it's correct even when the offscreen preview freezes requestAnimationFrame.
 * Motion adds only transient, additive flourishes: a press-in on tap, a one-shot "pop" the moment a
 * tab becomes active, and a spring lift — all degrade to "nothing happens" if rAF is frozen or the
 * visitor prefers reduced motion.
 */
function TabItem({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon
  const reduce = useReducedMotion()

  // Fire the pop only on the idle→active edge (the bar re-renders on every navigation, so gating on
  // a ref stops the keyframe from replaying and keeps the resting scale a flat, declarative 1).
  const prev = useRef(active)
  const rising = active && !prev.current
  useEffect(() => {
    prev.current = active
  }, [active])

  const scaleTarget = reduce || !rising ? 1 : [1, 1.18, 1]
  const scaleTransition: Transition =
    reduce || !Array.isArray(scaleTarget)
      ? { duration: 0 }
      : { duration: 0.42, times: [0, 0.42, 1], ease: [0.22, 1, 0.36, 1] }

  return (
    <Link
      to={tab.to}
      aria-current={active ? 'page' : undefined}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
    >
      {/* Outer: press-in on tap (whole glyph). */}
      <motion.span
        className="inline-flex"
        whileTap={reduce ? undefined : { scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 700, damping: 30, mass: 0.6 }}
      >
        {/* Carrier: spring lift + activation pop. */}
        <motion.span
          className="relative inline-flex h-[26px] w-[26px] items-center justify-center"
          initial={false}
          animate={{ y: active ? -2 : 0, scale: scaleTarget }}
          transition={{ y: reduce ? { duration: 0 } : LIFT_SPRING, scale: scaleTransition }}
        >
          {/* idle outline — fades OUT as the tab activates */}
          <motion.span
            className="absolute inset-0 text-muted-foreground"
            initial={false}
            animate={{ opacity: active ? 0 : 1 }}
            transition={reduce ? { duration: 0 } : FADE}
            aria-hidden="true"
          >
            <Icon active={false} className="h-full w-full" />
          </motion.span>
          {/* active solid — fades IN (colour + fill crossfade together) */}
          <motion.span
            className="absolute inset-0 text-primary"
            initial={false}
            animate={{ opacity: active ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : FADE}
            aria-hidden="true"
          >
            <Icon active className="h-full w-full" />
          </motion.span>
        </motion.span>
      </motion.span>

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
      {tabs.map((tab) => (
        <TabItem
          key={tab.label}
          tab={tab}
          active={isActive(pathname, tab.to.split('?')[0], tab.match)}
        />
      ))}
    </nav>
  )
}
