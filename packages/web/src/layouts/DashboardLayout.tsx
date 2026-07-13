import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { CollapsibleSidebar } from '@/components/navigation/CollapsibleSidebar'
import { DashboardHeader } from '@/features/hotel-manager/dashboard/components/DashboardHeader'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebarStore'

export default function DashboardLayout() {
  const { activeRole } = useAuth()
  const pinned = useSidebarStore((s) => s.pinned)

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
      <div className={cn('transition-[padding] duration-200', pinned ? 'lg:pl-64' : 'lg:pl-16')}>
        <DashboardHeader />
        <main className="min-h-screen">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}
