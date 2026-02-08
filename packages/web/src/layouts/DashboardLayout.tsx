import { Outlet } from 'react-router-dom'
import { DashboardHeader } from '@/features/hotel-manager/dashboard/components/DashboardHeader'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
