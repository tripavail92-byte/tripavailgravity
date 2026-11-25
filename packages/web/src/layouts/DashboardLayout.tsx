import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { BottomTabsNav } from '@/components/navigation/BottomTabsNav'
import { CollapsibleSidebar } from '@/components/navigation/CollapsibleSidebar'
import { DashboardHeader } from '@/features/hotel-manager/dashboard/components/DashboardHeader'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebarStore'

export default function DashboardLayout() {
  const { activeRole } = useAuth()
  const pinned = useSidebarStore((s) => s.pinned)
  const isTraveller = activeRole?.role_type === 'traveller'

  useEffect(() => {
    const roleType = activeRole?.role_type

    if (!roleType) {
      document.documentElement.removeAttribute('data-role')
      return
    }

    document.documentElement.setAttribute('data-role', roleType)

    return () => {
      document.documentElement.removeAttribute('data-role')
    }
  }, [activeRole?.role_type])

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      {/* Desktop: a collapsed icon rail that expands on hover / when pinned. Mobile is untouched —
          the header keeps its hamburger drawer. Reserve the rail's width so content never sits
          under it (pl-16 collapsed, pl-64 pinned). */}
      <CollapsibleSidebar />
      <div
        className={cn(
          'transition-[padding] duration-200',
          pinned ? 'lg:pl-64' : 'lg:pl-16',
          // Room for the phone tab bar, which only travellers get (see below).
          isTraveller && 'max-lg:pb-[calc(4rem+env(safe-area-inset-bottom))]',
        )}
      >
        <DashboardHeader />
        <main className="min-h-screen">
          <Outlet />
        </main>
        <SiteFooter />
      </div>

      {/* Messages / Help / Legal are shared with partners, so they live in this layout — and a
          traveller who tapped "Message" on a trip lost the Home · Tours · Profile bar. The bar
          renders nothing for partner roles, so this only adds it back for travellers. */}
      <BottomTabsNav />
    </div>
  )
}
