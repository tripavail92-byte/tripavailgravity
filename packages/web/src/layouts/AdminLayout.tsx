import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { usePartnerPopulation } from '@/queries/adminQueries'

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Partners', to: '/admin/partners' },
  { label: 'KYC', to: '/admin/kyc' },
  { label: 'Listings', to: '/admin/listings' },
  { label: 'Bookings', to: '/admin/bookings' },
  { label: 'Commercial', to: '/admin/commercial' },
  { label: 'Reports', to: '/admin/reports' },
  { label: 'Audit Logs', to: '/admin/audit-logs' },
  { label: 'Settings', to: '/admin/settings' },
]

export default function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [openReportsCount, setOpenReportsCount] = useState<number>(0)

  // Partners waiting on a human decision — powers the sidebar badge.
  //
  // This counted useVerificationQueue('pending') — partner_verification_requests — which only ever
  // holds partners who SUBMITTED. Every partner is born 'incomplete' and no hotel manager had ever
  // submitted, so the badge read 0 for months while not one manager on the platform could publish.
  // A badge that is structurally incapable of showing work is worse than no badge: it actively
  // tells the admin there is nothing to do.
  // isError matters: a swallowed failure renders a 0 badge, which tells the admin there is nothing
  // to do. That is exactly what the old queue-backed badge did for months. If we cannot count, say
  // we cannot count — never imply zero.
  const { data: partnerPopulation = [], isError: partnerCountError } = usePartnerPopulation()
  const pendingPartnersCount = partnerPopulation.filter(
    (p) =>
      p.account_status !== 'deleted' &&
      (p.verification_status === 'incomplete' || p.verification_status === 'pending'),
  ).length

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
    if (label === 'Reports') {
      return (
        <span className="inline-flex items-center gap-2">
          <span>{label}</span>
          {openReportsCount > 0 ? <Badge variant="secondary">{openReportsCount}</Badge> : null}
        </span>
      )
    }
    if (label === 'Partners') {
      return (
        <span className="inline-flex items-center gap-2">
          <span>{label}</span>
          {partnerCountError ? (
            // Never render nothing here — an absent badge reads as "zero waiting", which is the
            // claim we cannot currently support.
            <Badge
              variant="destructive"
              className="border-0"
              title="Could not count partners waiting"
            >
              !
            </Badge>
          ) : pendingPartnersCount > 0 ? (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0">
              {pendingPartnersCount}
            </Badge>
          ) : null}
        </span>
      )
    }
    return label
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground flex">
      {/* Mobile top bar + collapsible nav */}
      <div className="md:hidden w-full border-b border-border bg-background">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">TripAvail</div>
            <div className="text-base font-bold">Admin</div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
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
