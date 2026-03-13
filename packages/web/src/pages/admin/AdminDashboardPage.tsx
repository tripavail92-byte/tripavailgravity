import { useEffect, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

type Stats = {
  total_users:      number
  kyc_pending:      number
  open_reports:     number
  total_bookings:   number
  active_listings:  number
  pending_partners: number
}

const STAT_CONFIG: { key: keyof Stats; label: string; emoji: string; description: string }[] = [
  { key: 'total_users',      emoji: '👥', label: 'Total Users',       description: 'Registered profiles' },
  { key: 'pending_partners', emoji: '⏳', label: 'Partners Pending',  description: 'Awaiting KYC/approval review' },
  { key: 'kyc_pending',      emoji: '🛡️', label: 'KYC Queue',         description: 'Sessions pending admin review' },
  { key: 'open_reports',     emoji: '🚩', label: 'Open Reports',      description: 'Unresolved user reports' },
  { key: 'active_listings',  emoji: '📦', label: 'Active Listings',    description: 'Live packages + tours' },
  { key: 'total_bookings',   emoji: '🎫', label: 'Total Bookings',     description: 'All tour bookings' },
]

export default function AdminDashboardPage() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    ;(supabase as any)
      .rpc('admin_get_dashboard_stats')
      .then(({ data, error: err }: { data: Stats | null; error: any }) => {
        if (cancelled) return
        if (err) { setError(err.message); setLoading(false); return }
        setStats(data)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Live snapshot of the TripAvail platform.
      </p>

      {error && (
        <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          Failed to load stats: {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CONFIG.map(({ key, label, emoji, description }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{emoji}</span>
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {stats ? stats[key].toLocaleString() : '—'}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: '/admin/kyc',      label: '🛡️ Review KYC Queue' },
            { href: '/admin/partners', label: '🤝 Partner Applications' },
            { href: '/admin/reports',  label: '🚩 Moderate Reports' },
            { href: '/admin/listings', label: '📦 Moderate Listings' },
            { href: '/admin/users',    label: '👥 Manage Users' },
            { href: '/admin/audit-logs', label: '📋 Audit Logs' },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 text-sm font-medium text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
