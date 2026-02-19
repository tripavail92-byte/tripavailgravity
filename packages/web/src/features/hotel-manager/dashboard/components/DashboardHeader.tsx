import { Search } from 'lucide-react'

import { RoleBasedDrawer } from '@/components/navigation/RoleBasedDrawer'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export function DashboardHeader() {
  const { activeRole } = useAuth()
  const roleTitle = activeRole?.role_type === 'tour_operator' ? 'Tour Operator' : 'Hotel Manager'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">TripAvail {roleTitle}</h2>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search listings, bookings..."
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationBell />

            {/* Role-Based Drawer Menu (Profile Pill) */}
            <RoleBasedDrawer />
          </div>
        </div>
      </div>
    </header>
  )
}
