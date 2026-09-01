import { useEffect, useMemo, useState } from 'react'

import { GlassCard } from '@/components/ui/glass'
import {
  type OperatorBookingRecord,
  operatorPortalService,
} from '@/features/tour-operator/services/operatorPortalService'

/**
 * Earnings over time + per-tour breakdown.
 *
 * Operator analytics was funnel-only (profile views, CTA clicks) — an operator could see traffic
 * but never "what did I earn, and which trip earned it". Computed from bookings the portal already
 * loads, so no new query or table.
 *
 * Amounts are grouped BY CURRENCY and never summed across them: adding a USD booking to a PKR one
 * produces a meaningless number, and labelling that with one currency is worse than showing nothing.
 * Hand-drawn bars rather than pulling in a charting dependency for a single chart.
 */

type Bucket = { key: string; label: string; byCurrency: Record<string, number> }

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function OperatorEarningsChart({ operatorId }: { operatorId: string }) {
  const [bookings, setBookings] = useState<OperatorBookingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!operatorId) return
    setLoading(true)
    operatorPortalService
      .getBookingsData(operatorId)
      .then((r) => {
        if (!cancelled) setBookings(r.bookings)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [operatorId])

  // Only delivered/contracted revenue counts — a cancelled booking is not earnings.
  const earned = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed'),
    [bookings],
  )

  const months: Bucket[] = useMemo(() => {
    const now = new Date()
    const out: Bucket[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      out.push({
        key: monthKey(d),
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        byCurrency: {},
      })
    }
    const index = new Map(out.map((b) => [b.key, b]))
    for (const b of earned) {
      const when = b.booking_date ? new Date(b.booking_date) : null
      if (!when || Number.isNaN(when.getTime())) continue
      const bucket = index.get(monthKey(when))
      if (!bucket) continue
      const cur = b.tours?.currency || 'PKR'
      bucket.byCurrency[cur] = (bucket.byCurrency[cur] ?? 0) + Number(b.total_price || 0)
    }
    return out
  }, [earned])

  const currencyTotals = useMemo(() => {
    const t: Record<string, number> = {}
    for (const b of earned) {
      const cur = b.tours?.currency || 'PKR'
      t[cur] = (t[cur] ?? 0) + Number(b.total_price || 0)
    }
    return t
  }, [earned])

  // Chart the currency the operator earns most in; the rest are listed as totals.
  const primary = useMemo(
    () => Object.entries(currencyTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'PKR',
    [currencyTotals],
  )

  const perTour = useMemo(() => {
    const m = new Map<string, { title: string; amount: number; seats: number }>()
    for (const b of earned) {
      if ((b.tours?.currency || 'PKR') !== primary) continue
      const id = b.tours?.id ?? 'unknown'
      const row = m.get(id) ?? { title: b.tours?.title ?? 'Tour', amount: 0, seats: 0 }
      row.amount += Number(b.total_price || 0)
      row.seats += Number(b.pax_count || 0)
      m.set(id, row)
    }
    return [...m.values()].sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [earned, primary])

  const max = Math.max(1, ...months.map((m) => m.byCurrency[primary] ?? 0))
  const fmt = (n: number) => `${primary} ${Math.round(n).toLocaleString()}`

  if (loading) {
    return (
      <GlassCard variant="card" className="rounded-3xl p-6">
        <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
      </GlassCard>
    )
  }
  if (failed) return null

  const hasEarnings = Object.keys(currencyTotals).length > 0

  return (
    <GlassCard variant="card" className="rounded-3xl p-6">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-black text-foreground">Earnings over time</h2>
        <span className="text-xs text-muted-foreground">Last 6 months</span>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Confirmed and completed bookings, by the month they were booked.
      </p>

      {!hasEarnings ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-5 py-10 text-center text-sm text-muted-foreground">
          No earnings yet. Once travellers book, your revenue shows up here.
        </p>
      ) : (
        <>
          <div className="flex h-40 items-end gap-2">
            {months.map((m) => {
              const v = m.byCurrency[primary] ?? 0
              const pct = Math.round((v / max) * 100)
              return (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-primary/80 transition-all"
                      style={{ height: `${Math.max(v > 0 ? 4 : 0, pct)}%` }}
                      title={`${m.label}: ${fmt(v)}`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">{m.label}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/50 pt-4">
            {Object.entries(currencyTotals).map(([cur, total]) => (
              <div key={cur}>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Total earned ({cur})
                </p>
                <p className="text-lg font-black text-foreground">
                  {cur} {Math.round(total).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {perTour.length > 0 && (
            <div className="mt-5 border-t border-border/50 pt-4">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Top earning trips ({primary})
              </p>
              <div className="space-y-2">
                {perTour.map((t) => (
                  <div key={t.title} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{t.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t.seats} {t.seats === 1 ? 'seat' : 'seats'}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-foreground">{fmt(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </GlassCard>
  )
}
