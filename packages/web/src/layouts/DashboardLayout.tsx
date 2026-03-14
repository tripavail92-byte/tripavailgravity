import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { DashboardHeader } from '@/features/hotel-manager/dashboard/components/DashboardHeader'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout() {
  const { activeRole } = useAuth()

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
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="min-h-screen">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}
