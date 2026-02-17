import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Partners', to: '/admin/partners' },
  { label: 'Listings', to: '/admin/listings' },
  { label: 'Bookings', to: '/admin/bookings' },
  { label: 'Reports', to: '/admin/reports' },
  { label: 'Audit Logs', to: '/admin/audit-logs' },
  { label: 'Settings', to: '/admin/settings' },
]

export default function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [openReportsCount, setOpenReportsCount] = useState<number>(0)

  useEffect(() => {
    let isCancelled = false

    const loadOpenCount = async () => {
      try {
        const { count } = await (supabase.from('reports' as any) as any)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open')

        if (!isCancelled) setOpenReportsCount(typeof count === 'number' ? count : 0)
      } catch {
        if (!isCancelled) setOpenReportsCount(0)
      }
    }

    loadOpenCount()

    const onAdminAction = () => {
      loadOpenCount()
    }

    window.addEventListener('tripavail:admin_action', onAdminAction as any)
    return () => {
      isCancelled = true
      window.removeEventListener('tripavail:admin_action', onAdminAction as any)
    }
  }, [])

  const renderNavLabel = (label: string) => {
    if (label !== 'Reports') return label
    return (
      <span className="inline-flex items-center gap-2">
        <span>{label}</span>
        {openReportsCount > 0 ? <Badge variant="secondary">{openReportsCount}</Badge> : null}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile top bar + collapsible nav */}
      <div className="md:hidden w-full border-b border-border bg-background">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">TripAvail</div>
            <div className="text-base font-bold">Admin</div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-expanded={mobileNavOpen}
            aria-controls="admin-mobile-nav"
          >
            Menu
          </Button>
        </div>

        {mobileNavOpen && (
          <div id="admin-mobile-nav" className="px-4 pb-3">
            <Separator className="mb-3" />
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {renderNavLabel(item.label)}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-background">
        <div className="w-full p-4">
          <div className="mb-4">
            <div className="text-sm font-semibold">TripAvail</div>
            <div className="text-lg font-bold">Admin</div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {renderNavLabel(item.label)}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
