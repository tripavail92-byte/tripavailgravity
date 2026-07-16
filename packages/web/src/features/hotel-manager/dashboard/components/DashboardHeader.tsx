import { Search } from 'lucide-react'

import { Logo } from '@/components/brand/Logo'
import { RoleBasedDrawer } from '@/components/navigation/RoleBasedDrawer'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function DashboardHeader() {
  const { activeRole } = useAuth()
  const roleTitle = activeRole?.role_type === 'tour_operator'
    ? 'Tour Operator'
    : activeRole?.role_type === 'hotel_manager'
      ? 'Hotel Manager'
      : activeRole?.role_type === 'admin'
        ? 'Administrator'
        : 'Traveler'
  // Both partner roles share the premium dark chrome — previously only hotel_manager did,
  // which left tour operators with a translucent light drawer over the dark scrim
  // (washed-out, low-contrast — the "Colouring" issue in the team's QA report).
  const isPartnerChrome =
    activeRole?.role_type === 'hotel_manager' || activeRole?.role_type === 'tour_operator'
  const isTourOperator = activeRole?.role_type === 'tour_operator'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-xl transition-colors',
        isPartnerChrome
          ? 'border-white/10 bg-[linear-gradient(180deg,rgba(9,14,29,0.96)_0%,rgba(13,19,38,0.9)_100%)] shadow-[0_10px_30px_rgba(0,0,0,0.28)]'
          : 'border-border/60 bg-background/80 backdrop-blur-md',
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo (home) + role title. The emblem is the home button — it works on any header
              background, so it's safe on the dark partner chrome too.
              lg:hidden — from lg up the CollapsibleSidebar renders its own emblem, and showing both
              put two logos side by side. Below lg the sidebar is hidden, so this stays as the only
              home button. */}
          <div className="flex items-center gap-3">
            <Logo variant="emblem" emblemClassName="h-9 w-9" className="lg:hidden" />
            <h2 className={cn('text-xl font-semibold', isPartnerChrome ? 'text-white' : 'text-foreground')}>
              {roleTitle}
            </h2>
          </div>

          {/* Search Bar — hidden for tour operators (not relevant in operator console) */}
          {!isTourOperator && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search
                  className={cn(
                    'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                    isPartnerChrome ? 'text-white/45' : 'text-muted-foreground',
                  )}
                />
                <Input
                  type="text"
                  placeholder="Search listings, bookings..."
                  className={cn(
                    'w-full pl-10',
                    isPartnerChrome &&
                      'border-white/10 bg-white/5 text-white placeholder:text-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:border-primary/50 focus-visible:ring-primary/20',
                  )}
                />
              </div>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Dark / light mode toggle */}
            <ThemeToggle inverted={isPartnerChrome} />

            {/* Notifications */}
            <NotificationBell inverted={isPartnerChrome} />

            {/* The hamburger drawer is the MOBILE menu only — on desktop the collapsible sidebar
                (rendered by the layout) replaces it. */}
            <div className="lg:hidden">
              <RoleBasedDrawer inverted={isPartnerChrome} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
