import { Search } from 'lucide-react'

import { RoleBasedDrawer } from '@/components/navigation/RoleBasedDrawer'
import { NotificationBell } from '@/components/notifications/NotificationBell'
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
  const isPartnerChrome = activeRole?.role_type === 'hotel_manager'

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
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div>
              <p
                className={cn(
                  'text-[11px] font-bold uppercase tracking-[0.24em]',
                  isPartnerChrome ? 'text-white/55' : 'text-muted-foreground',
                )}
              >
                TripAvail
              </p>
              <h2 className={cn('text-xl font-semibold', isPartnerChrome ? 'text-white' : 'text-foreground')}>
                {roleTitle}
              </h2>
            </div>
          </div>

          {/* Search Bar - Hidden on mobile */}
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

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationBell inverted={isPartnerChrome} />

            {/* Role-Based Drawer Menu (Profile Pill) */}
            <RoleBasedDrawer inverted={isPartnerChrome} />
          </div>
        </div>
      </div>
    </header>
  )
}
