import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

type BookingRow = {
  id: string
  tour_id: string | null
  traveler_id: string | null
  status: string
  total_price: number | null
  pax_count: number | null
  booking_date: string | null
  payment_status: string | null
  payment_method: string | null
  stripe_payment_intent_id: string | null
  expires_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  confirmed:  'bg-green-100 text-green-800 border-green-200',
  pending:    'bg-amber-100 text-amber-800 border-amber-200',
  cancelled:  'bg-red-100 text-red-800 border-red-200',
  expired:    'bg-slate-100 text-slate-600 border-slate-200',
  completed:  'bg-blue-100 text-blue-800 border-blue-200',
}

function shortId(v: string | null) {
  if (!v) return '—'
  return v.length <= 12 ? v : `${v.slice(0, 8)}…${v.slice(-4)}`
}

function fmt(v: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleString()
}

function fmtPrice(v: number | null) {
  if (v == null) return '—'
  return `PKR ${v.toLocaleString()}`
}

export default function AdminBookingsPage() {
  const [rows, setRows]       = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('tour_bookings')
      .select(
        'id, tour_id, traveler_id, status, total_price, pax_count, booking_date, payment_status, payment_method, stripe_payment_intent_id, expires_at',
      )
      .order('booking_date', { ascending: false })
      .limit(100)
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) { setError(err.message); setLoading(false); return }
        setRows(data || [])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
      <p className="text-sm text-muted-foreground mt-2">
        All tour bookings — most recent first (limit 100).
      </p>

      <div className="mt-6 space-y-3">
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3"><Skeleton className="h-5 w-64" /></CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-80" />
              <Skeleton className="h-4 w-56" />
            </CardContent>
          </Card>
        ))}

        {!loading && error && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Failed to load bookings</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{error}</p></CardContent>
          </Card>
        )}

        {!loading && !error && rows.length === 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">No bookings yet</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tour bookings will appear here once travellers make purchases.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && rows.map((row) => (
          <Card key={row.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <CardTitle className="text-base font-mono">{shortId(row.id)}</CardTitle>
                  <p className="text-xs text-muted-foreground">Tour: {shortId(row.tour_id)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={STATUS_COLORS[row.status] ?? ''}
                  >
                    {row.status}
                  </Badge>
                  {row.payment_status && (
                    <Badge variant="outline" className="text-xs">
                      💳 {row.payment_status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Traveller</span>
                <p className="font-mono text-xs">{shortId(row.traveler_id)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Price</span>
                <p>{fmtPrice(row.total_price)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pax</span>
                <p>{row.pax_count ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Booked</span>
                <p className="text-xs">{fmt(row.booking_date)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Payment</span>
                <p>{row.payment_method ?? '—'}</p>
              </div>
              {row.stripe_payment_intent_id && (
                <div>
                  <span className="text-muted-foreground">Stripe PI</span>
                  <p className="font-mono text-xs truncate">{shortId(row.stripe_payment_intent_id)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
