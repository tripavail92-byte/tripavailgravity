import { useEffect, useMemo, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchAdminStorefrontAnalyticsOverview,
  type AdminStorefrontOverviewRow,
} from '@/features/admin/services/adminService'
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

const DAY_FILTERS = [7, 30, 90] as const

export default function AdminDashboardPage() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [storefrontOverview, setStorefrontOverview] = useState<AdminStorefrontOverviewRow[]>([])
  const [storefrontDays, setStorefrontDays] = useState<(typeof DAY_FILTERS)[number]>(30)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const storefrontSummary = useMemo(() => {
    return storefrontOverview.reduce(
      (acc, row) => ({
        profile_views: acc.profile_views + row.profile_views,
        unique_visitors: acc.unique_visitors + row.unique_visitors,
        engaged_visitors: acc.engaged_visitors + row.engaged_visitors,
        attributed_booking_starts: acc.attributed_booking_starts + row.attributed_booking_starts,
      }),
      { profile_views: 0, unique_visitors: 0, engaged_visitors: 0, attributed_booking_starts: 0 },
    )
  }, [storefrontOverview])

  const aggregateEngagementRate = storefrontSummary.unique_visitors > 0
    ? `${Number(((storefrontSummary.engaged_visitors / storefrontSummary.unique_visitors) * 100).toFixed(2))}%`
    : '0%'

  const aggregateAttributionRate = storefrontSummary.unique_visitors > 0
    ? `${Number(((storefrontSummary.attributed_booking_starts / storefrontSummary.unique_visitors) * 100).toFixed(2))}%`
    : '0%'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      (supabase as any).rpc('admin_get_dashboard_stats'),
      fetchAdminStorefrontAnalyticsOverview(5, storefrontDays),
    ]).then(([statsResult, overview]) => {
      if (cancelled) return
      const err = statsResult.error
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      setStats(statsResult.data)
      setStorefrontOverview(overview)
      setLoading(false)
    }).catch((err: any) => {
      if (cancelled) return
      setError(err?.message || 'Failed to load admin dashboard')
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [storefrontDays])

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
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">Storefront Analytics ({storefrontDays} Days)</h2>
          <div className="flex flex-wrap items-center gap-2">
            {DAY_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStorefrontDays(option)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  storefrontDays === option
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground'
                }`}
              >
                {option} days
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Admin Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Profile views</p>
                    <p className="text-3xl font-bold text-foreground">{storefrontSummary.profile_views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Unique visitors</p>
                    <p className="text-3xl font-bold text-foreground">{storefrontSummary.unique_visitors.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Engaged visitors</p>
                    <p className="text-3xl font-bold text-foreground">{storefrontSummary.engaged_visitors.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Engagement rate</p>
                    <p className="text-3xl font-bold text-foreground">{aggregateEngagementRate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Bookings after profile views</p>
                    <p className="text-3xl font-bold text-foreground">{storefrontSummary.attributed_booking_starts.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Profile view to booking rate</p>
                    <p className="text-3xl font-bold text-foreground">{aggregateAttributionRate}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Engagement shows how many visitors clicked deeper into a storefront, and the booking rate shows how many later started a booking.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Public Storefronts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : storefrontOverview.length === 0 ? (
                <p className="text-sm text-muted-foreground">No public storefront analytics available yet.</p>
              ) : (
                <div className="space-y-3">
                  {storefrontOverview.map((row) => (
                    <a
                      key={row.operator_id}
                      href={`/admin/partners?tab=all&storefront=${encodeURIComponent(row.operator_id)}`}
                      className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{row.operator_name}</p>
                          <p className="text-xs text-muted-foreground">{row.slug ? `/operators/${row.slug}` : 'No public slug'}</p>
                          <p className="mt-1 text-[11px] font-medium text-primary">Open partner review</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{Number((row.quality_score ?? 0).toFixed(2))}</p>
                          <p className="text-[11px] text-muted-foreground">marketplace score</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-5 gap-3 text-sm">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">Views</p>
                          <p className="font-semibold text-foreground">{row.profile_views}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">Visitors</p>
                          <p className="font-semibold text-foreground">{row.unique_visitors}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">Engaged</p>
                          <p className="font-semibold text-foreground">{row.engaged_visitors}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">CTA/Tour</p>
                          <p className="font-semibold text-foreground">{row.cta_clicks + row.tour_clicks}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">Bookings after view</p>
                          <p className="font-semibold text-foreground">{row.attributed_booking_starts}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Engagement {Number((row.engagement_rate ?? 0).toFixed(2))}%</span>
                        <span>View-to-booking {Number((row.attributed_conversion_rate ?? 0).toFixed(2))}%</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">Operator Reliability</h2>
        {loading ? (
          <Card>
            <CardContent className="py-6 space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-48" />
            </CardContent>
          </Card>
        ) : storefrontOverview.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">No operator data available yet.</CardContent>
          </Card>
        ) : (() => {
          const atRisk = storefrontOverview.filter((r) => r.quality_score < 30)
          const watchList = storefrontOverview.filter((r) => r.quality_score >= 30 && r.quality_score < 55)
          const healthy = storefrontOverview.filter((r) => r.quality_score >= 55)
          const avgScore = storefrontOverview.reduce((s, r) => s + r.quality_score, 0) / storefrontOverview.length
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Platform avg. score</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{avgScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">across {storefrontOverview.length} storefronts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Healthy</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{healthy.length}</p>
                    <p className="text-xs text-muted-foreground">score ≥ 55</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Watch list</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{watchList.length}</p>
                    <p className="text-xs text-muted-foreground">score 30 – 54</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">At risk</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{atRisk.length}</p>
                    <p className="text-xs text-muted-foreground">score &lt; 30</p>
                  </CardContent>
                </Card>
              </div>
              {(atRisk.length > 0 || watchList.length > 0) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Operators needing attention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[...atRisk, ...watchList].map((row) => {
                        const band = row.quality_score < 30 ? 'at-risk' : 'watch'
                        return (
                          <a
                            key={row.operator_id}
                            href={`/admin/partners?tab=all&storefront=${encodeURIComponent(row.operator_id)}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
                          >
                            <div>
                              <p className="font-medium text-foreground">{row.operator_name}</p>
                              <p className="text-xs text-muted-foreground">{row.slug ? `/operators/${row.slug}` : 'No public slug'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${band === 'at-risk' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {band === 'at-risk' ? 'At risk' : 'Watch'}
                              </span>
                              <span className="text-sm font-bold text-foreground">{row.quality_score.toFixed(1)}</span>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                    {stats?.open_reports != null && stats.open_reports > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {stats.open_reports} open platform report{stats.open_reports !== 1 ? 's' : ''} — <a href="/admin/reports" className="text-primary hover:underline">review in Reports</a>
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )
        })()}
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
