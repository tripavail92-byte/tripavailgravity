import { format } from 'date-fns'
import { AlertTriangle, CalendarClock, Loader2, Ticket, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  type OperatorBookingRecord,
  operatorPortalService,
} from '@/features/tour-operator/services/operatorPortalService'

interface OperatorRecentBookingsProps {
  operatorId?: string
}

function statusVariant(status: OperatorBookingRecord['status']) {
  if (status === 'confirmed') return 'default'
  if (status === 'pending') return 'outline'
  if (status === 'cancelled') return 'destructive'
  return 'secondary'
}

function paymentLabel(booking: OperatorBookingRecord) {
  if (booking.payment_collection_mode === 'partial_online') {
    const paid = Number(booking.amount_paid_online ?? booking.upfront_amount ?? 0)
    const due = Number(booking.amount_due_to_operator ?? booking.remaining_amount ?? 0)
    return `Deposit PKR ${paid.toLocaleString()} · Due PKR ${due.toLocaleString()}`
  }

  return `PKR ${booking.total_price.toLocaleString()}`
}

export function OperatorRecentBookings({ operatorId }: OperatorRecentBookingsProps) {
  const [bookings, setBookings] = useState<OperatorBookingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!operatorId) {
        if (active) {
          setBookings([])
          setLoading(false)
        }
        return
      }

      try {
        if (active) setLoading(true)
        const response = await operatorPortalService.getBookingsData(operatorId)
        if (!active) return
        setBookings(response.bookings)
        setError(null)
      } catch (loadError) {
        if (!active) return
        console.error('Failed to load dashboard bookings:', loadError)
        setError(loadError instanceof Error ? loadError.message : 'Failed to load recent bookings')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [operatorId])

  const visibleBookings = useMemo(() => {
    const now = Date.now()

    return [...bookings]
      .sort((left, right) => {
        const leftStart = new Date(left.tour_schedules.start_time).getTime()
        const rightStart = new Date(right.tour_schedules.start_time).getTime()
        const leftUpcoming = leftStart >= now
        const rightUpcoming = rightStart >= now

        if (leftUpcoming !== rightUpcoming) {
          return leftUpcoming ? -1 : 1
        }

        if (leftUpcoming && rightUpcoming) {
          return leftStart - rightStart
        }

        return new Date(right.booking_date).getTime() - new Date(left.booking_date).getTime()
      })
      .slice(0, 4)
  }, [bookings])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Recent Bookings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Next departures and latest reservations
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          className="text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Link to="/operator/bookings">View All</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background/30 px-4 py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading recent bookings...</p>
        </div>
      ) : error ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Recent bookings failed to load</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : visibleBookings.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-background/30 px-4 py-10 text-center">
          <p className="text-sm font-medium text-foreground">No bookings yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            New reservations will appear here as soon as travellers book a tour.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleBookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-primary/30"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {booking.traveler.full_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{booking.tours.title}</p>
                </div>
                <Badge
                  variant={statusVariant(booking.status)}
                  className="rounded-full px-2.5 py-1 uppercase tracking-[0.18em] text-[10px]"
                >
                  {booking.status}
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {format(new Date(booking.tour_schedules.start_time), 'EEE, MMM d · h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {booking.pax_count} traveller{booking.pax_count === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="h-3.5 w-3.5 text-primary" />
                  <span>{paymentLabel(booking)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
