import { Outlet } from 'react-router-dom'

import { DrawerMenu } from '@/components/layout/DrawerMenu'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <DrawerMenu />
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
