import { Outlet } from 'react-router-dom'
import { DashboardHeader } from '@/features/hotel-manager/dashboard/components/DashboardHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

export default function DashboardLayout() {
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
