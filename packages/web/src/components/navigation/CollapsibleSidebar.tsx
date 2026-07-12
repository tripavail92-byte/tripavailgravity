import { ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ROLE_NAVIGATION, type NavItem } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebarStore'

const ROLE_LABELS: Record<string, string> = {
  tour_operator: 'Tour Operator',
  hotel_manager: 'Hotel Manager',
  traveller: 'Traveller',
  admin: 'Admin',
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

/**
 * The collapsed-by-default desktop sidebar. It replaces the hamburger drawer on laptop/desktop —
 * a slim icon rail that expands to full labels on hover, or stays open when pinned. Mobile is
 * untouched (this whole component is `hidden lg:flex`); the drawer remains the mobile menu.
 *
 * The menu is ALWAYS `ROLE_NAVIGATION[activeRole]`, so each role sees only its own navigation —
 * operator, manager and traveller menus can never mix. Renders nothing without an active role
 * (e.g. an anonymous visitor), so it only appears in the signed-in dashboard/account areas.
 */
export function CollapsibleSidebar() {
  const { user, activeRole, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { pinned, togglePinned } = useSidebarStore()
  const [hovered, setHovered] = useState(false)

  const roleType = activeRole?.role_type
  const items: NavItem[] = roleType ? (ROLE_NAVIGATION[roleType] ?? []) : []
  if (!roleType || items.length === 0) return null

  const expanded = pinned || hovered
  const roleLabel = ROLE_LABELS[roleType] ?? roleType
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account'
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      {/* When the rail expands ON HOVER it overlays the page (content only reserves the collapsed
          width, so it doesn't reflow on every mouse-over). Dim + blur the page behind it so the
          overlay reads as intentional rather than broken. Pinned needs no scrim — the layout
          reserves the full width and pushes content instead. Purely visual (pointer-events-none),
          so it never blocks a click. */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-30 hidden bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:block',
          expanded && !pinned ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`${roleLabel} navigation`}
      data-expanded={expanded ? 'true' : 'false'}
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col overflow-hidden border-r border-border/60 bg-background/95 backdrop-blur-xl transition-[width] duration-200 ease-out lg:flex',
        expanded ? 'w-64 shadow-2xl shadow-black/10' : 'w-16',
      )}
    >
      {/* Role header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/50 px-3">
        <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/30">
          <AvatarImage src={user?.user_metadata?.avatar_url} alt={displayName} />
          <AvatarFallback className="bg-primary/15 text-sm font-bold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'min-w-0 transition-opacity duration-150',
            expanded ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-primary">
            {roleLabel}
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isItemActive(location.pathname, item.href)
            const Icon = item.icon
            return (
              <li key={item.href + item.label}>
                <Link
                  to={item.href}
                  title={expanded ? undefined : item.label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex items-center rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span
                    className={cn(
                      'ml-3 truncate transition-opacity duration-150',
                      expanded ? 'opacity-100' : 'pointer-events-none opacity-0',
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer: pin, theme, sign out */}
      <div className="shrink-0 border-t border-border/50 p-2">
        <button
          type="button"
          onClick={togglePinned}
          aria-pressed={pinned}
          title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
          className="flex w-full items-center rounded-xl px-2.5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {pinned ? (
            <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <PanelLeftOpen className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <span
            className={cn(
              'ml-3 truncate transition-opacity duration-150',
              expanded ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            {pinned ? 'Unpin' : 'Pin open'}
          </span>
        </button>

        <div
          className={cn(
            'flex items-center rounded-xl px-2.5 py-1.5',
            expanded ? 'justify-between' : 'justify-center',
          )}
        >
          <ThemeToggle />
          {expanded ? (
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          title={expanded ? undefined : 'Sign out'}
          className="flex w-full items-center rounded-xl px-2.5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span
            className={cn(
              'ml-3 truncate transition-opacity duration-150',
              expanded ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            Sign out
          </span>
        </button>

        {/* A hint chevron on the collapsed rail, so it reads as expandable. */}
        {!expanded ? (
          <div className="mt-1 flex justify-center text-muted-foreground/40">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </aside>
    </>
  )
}
