import { format, isAfter } from 'date-fns'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Mail,
  MessageSquare,
  Receipt,
  Ticket,
  Users,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

import { operatorPortalService, type OperatorBookingRecord } from '@/features/tour-operator/services/operatorPortalService'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GlassCard } from '@/components/ui/glass'
import { PageHeader } from '@/components/ui/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

type BookingAction = 'cancel' | 'complete' | 'resend_confirmation'

function statusVariant(status: OperatorBookingRecord['status']) {
  if (status === 'confirmed') return 'default'
  if (status === 'pending') return 'outline'
  if (status === 'cancelled') return 'destructive'
  return 'secondary'
}

function paymentTone(paymentStatus: OperatorBookingRecord['payment_status']) {
  if (paymentStatus === 'paid') return 'text-success'
  if (paymentStatus === 'processing') return 'text-warning'
  if (paymentStatus === 'failed' || paymentStatus === 'refunded') return 'text-destructive'
  return 'text-muted-foreground'
}

export default function OperatorBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<OperatorBookingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingsPaused, setBookingsPaused] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [pendingAction, setPendingAction] = useState<{
    booking: OperatorBookingRecord
    action: BookingAction
  } | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'tour_operator')
    return () => document.documentElement.removeAttribute('data-role')
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const response = await operatorPortalService.getBookingsData(user.id)
        setBookings(response.bookings)
        setBookingsPaused(response.bookingsPaused)
        setError(null)
      } catch (loadError) {
        console.error('Failed to load operator bookings:', loadError)
        setError(loadError instanceof Error ? loadError.message : 'Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id])

  const now = new Date()
  const stats = useMemo(() => {
    const confirmed = bookings.filter((booking) => booking.status === 'confirmed')
    const pending = bookings.filter((booking) => booking.status === 'pending')
    const upcoming = bookings.filter((booking) =>
      isAfter(new Date(booking.tour_schedules.start_time), now),
    )
    const revenue = confirmed.reduce((sum, booking) => sum + booking.total_price, 0)
    const travellers = bookings.reduce((sum, booking) => sum + booking.pax_count, 0)

    return {
      confirmed: confirmed.length,
      pending: pending.length,
      upcoming: upcoming.length,
      revenue,
      travellers,
    }
  }, [bookings, now])

  const filteredBookings = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return bookings.filter((booking) => booking.status === 'pending')
      case 'confirmed':
        return bookings.filter((booking) => booking.status === 'confirmed')
      case 'completed':
        return bookings.filter((booking) => booking.status === 'completed')
      case 'cancelled':
        return bookings.filter((booking) => booking.status === 'cancelled')
      default:
        return bookings
    }
  }, [activeTab, bookings])

  const handleRefreshBookings = async () => {
    if (!user?.id) return

    try {
      const response = await operatorPortalService.getBookingsData(user.id)
      setBookings(response.bookings)
      setBookingsPaused(response.bookingsPaused)
      setError(null)
    } catch (refreshError) {
      console.error('Failed to refresh operator bookings:', refreshError)
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh bookings')
    }
  }

  const openActionDialog = (booking: OperatorBookingRecord, action: BookingAction) => {
    setPendingAction({ booking, action })
    setActionNote('')
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && !submittingAction) {
      setPendingAction(null)
      setActionNote('')
    }
  }

  const handleConfirmAction = async () => {
    if (!pendingAction) return

    try {
      setSubmittingAction(true)
      await operatorPortalService.performBookingAction({
        bookingId: pendingAction.booking.id,
        action: pendingAction.action,
        reason: actionNote,
      })
      await handleRefreshBookings()
      toast.success(actionSuccessMessage(pendingAction.action))
      setPendingAction(null)
      setActionNote('')
    } catch (actionError) {
      console.error('Failed to perform booking action:', actionError)
      toast.error(actionError instanceof Error ? actionError.message : 'Booking action failed')
    } finally {
      setSubmittingAction(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Bookings"
          subtitle="Booking.com-style reservation board with payment state, safe traveler contact, and operational actions for each tour booking."
          showBackButton={false}
          actions={
            <Button
              asChild
              variant="outline"
              className="rounded-2xl border-border/60 bg-background/70 hover:bg-accent"
            >
              <Link to="/help">
                Need help
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GlassCard variant="card" className="rounded-3xl p-5">
            <StatCard icon={Ticket} label="Confirmed" value={String(stats.confirmed)} />
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <StatCard icon={CalendarClock} label="Upcoming" value={String(stats.upcoming)} />
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <StatCard icon={Receipt} label="Revenue" value={`PKR ${stats.revenue.toLocaleString()}`} />
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <StatCard icon={Users} label="Travellers" value={String(stats.travellers)} />
          </GlassCard>
        </div>

        {bookingsPaused && (
          <GlassCard variant="card" className="mb-6 rounded-3xl border border-warning/30 px-6 py-5">
            <p className="text-sm text-foreground">
              New bookings are paused in settings. Existing reservations below are still active and should continue to be serviced.
            </p>
          </GlassCard>
        )}

        <GlassCard variant="card" className="mb-6 rounded-3xl border border-border/60 px-6 py-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Safe traveler contact</p>
              <p className="text-sm text-muted-foreground">
                Direct email and phone are only shown when the traveler opted in and the channel is verified. Otherwise the reservation stays in a messaging-required state until the dedicated messenger service is shipped.
              </p>
            </div>
            <Badge
              variant="outline"
              className="w-fit rounded-full border-border/60 bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground"
            >
              Privacy-enforced
            </Badge>
          </div>
        </GlassCard>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 h-auto rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="all" className="rounded-2xl">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-2xl">
              Pending
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-2xl">
              Confirmed
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-2xl">
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-2xl">
              Cancelled
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <GlassCard variant="card" className="overflow-hidden rounded-3xl p-0">
              {error ? (
                <div className="p-8 text-center text-sm text-destructive">{error}</div>
              ) : loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Loading bookings...
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-12 text-center">
                  <h2 className="text-lg font-black text-foreground">No bookings in this view</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Once travellers reserve your upcoming departures, they will appear here with status, safe contact detail, and action controls.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reservation</TableHead>
                      <TableHead>Traveler</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Pax</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-foreground">{booking.tours.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Ref {booking.id.slice(0, 8).toUpperCase()} · booked{' '}
                              {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div>
                              <p className="font-semibold text-foreground">
                                {booking.traveler.full_name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {booking.traveler.contact_mode === 'direct'
                                  ? 'Direct contact approved'
                                  : 'Messaging rollout required'}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {booking.traveler.email ? (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full border-border/60 bg-background/80 px-3 text-xs"
                                >
                                  <a href={`mailto:${booking.traveler.email}`}>{booking.traveler.email}</a>
                                </Button>
                              ) : null}
                              {booking.traveler.phone ? (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full border-border/60 bg-background/80 px-3 text-xs"
                                >
                                  <a href={`tel:${booking.traveler.phone}`}>{booking.traveler.phone}</a>
                                </Button>
                              ) : null}
                              {!booking.traveler.email && !booking.traveler.phone ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
                                >
                                  Secure messaging required
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {format(new Date(booking.tour_schedules.start_time), 'EEE, MMM d')}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {format(new Date(booking.tour_schedules.start_time), 'h:mm a')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-foreground">{booking.pax_count}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusVariant(booking.status)}
                            className={
                              booking.status === 'confirmed'
                                ? 'bg-primary text-primary-foreground'
                                : booking.status === 'pending'
                                  ? 'border-border/60 bg-background text-foreground'
                                  : undefined
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className={`h-4 w-4 ${paymentTone(booking.payment_status)}`} />
                            <span className={`text-sm font-medium ${paymentTone(booking.payment_status)}`}>
                              {booking.payment_status || 'unpaid'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-full border-border/60 bg-background/80 px-3 text-xs"
                            >
                              <Link to={`/messages?scope=tour_booking&bookingId=${booking.id}`}>
                                <MessageSquare className="mr-2 h-3.5 w-3.5" />
                                Message traveler
                              </Link>
                            </Button>
                            {canCancelBooking(booking) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-full border-border/60 bg-background/80 px-3 text-xs"
                                onClick={() => openActionDialog(booking, 'cancel')}
                              >
                                <XCircle className="mr-2 h-3.5 w-3.5" />
                                Cancel
                              </Button>
                            ) : null}
                            {canCompleteBooking(booking) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-full border-border/60 bg-background/80 px-3 text-xs"
                                onClick={() => openActionDialog(booking, 'complete')}
                              >
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                Complete
                              </Button>
                            ) : null}
                            {canResendConfirmation(booking) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-full border-border/60 bg-background/80 px-3 text-xs"
                                onClick={() => openActionDialog(booking, 'resend_confirmation')}
                              >
                                <Mail className="mr-2 h-3.5 w-3.5" />
                                Resend
                              </Button>
                            ) : null}
                            {!canCancelBooking(booking) &&
                            !canCompleteBooking(booking) &&
                            !canResendConfirmation(booking) ? (
                              <span className="text-xs text-muted-foreground">
                                No action available
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          PKR {booking.total_price.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(pendingAction)} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="rounded-3xl border-border/60 bg-background/95 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {pendingAction ? actionDialogTitle(pendingAction.action) : 'Update booking'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction
                ? `${pendingAction.booking.tours.title} · ${pendingAction.booking.traveler.full_name} · ${format(new Date(pendingAction.booking.tour_schedules.start_time), 'MMM d, yyyy h:mm a')}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {pendingAction ? actionDialogDescription(pendingAction.action) : ''}
            </p>
            <Textarea
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
              placeholder={
                pendingAction ? actionNotePlaceholder(pendingAction.action) : 'Add an internal note'
              }
              className="min-h-[120px] rounded-2xl border-border/60 bg-background/80"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-2xl border-border/60 bg-background/80"
              onClick={() => handleDialogOpenChange(false)}
              disabled={submittingAction}
            >
              Keep as is
            </Button>
            <Button
              className="rounded-2xl"
              onClick={handleConfirmAction}
              disabled={submittingAction}
              variant={pendingAction?.action === 'cancel' ? 'destructive' : 'default'}
            >
              {submittingAction
                ? 'Applying...'
                : pendingAction
                  ? actionDialogConfirmLabel(pendingAction.action)
                  : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Ticket; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-primary/12 p-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
      </div>
    </div>
  )
}

function canCancelBooking(booking: OperatorBookingRecord) {
  return booking.status === 'pending' || booking.status === 'confirmed'
}

function canCompleteBooking(booking: OperatorBookingRecord) {
  return booking.status === 'confirmed' && new Date(booking.tour_schedules.start_time) <= new Date()
}

function canResendConfirmation(booking: OperatorBookingRecord) {
  return booking.status === 'confirmed' || booking.status === 'completed'
}

function actionDialogTitle(action: BookingAction) {
  if (action === 'cancel') return 'Cancel booking'
  if (action === 'complete') return 'Mark booking completed'
  return 'Resend confirmation'
}

function actionDialogDescription(action: BookingAction) {
  if (action === 'cancel') {
    return 'This will cancel the reservation for the traveler and create an in-app notification with your note.'
  }
  if (action === 'complete') {
    return 'Use this after the departure has started to move the booking into completed state and notify the traveler.'
  }
  return 'This reissues the confirmation notification without changing payment status or reservation state.'
}

function actionDialogConfirmLabel(action: BookingAction) {
  if (action === 'cancel') return 'Cancel booking'
  if (action === 'complete') return 'Mark completed'
  return 'Resend confirmation'
}

function actionNotePlaceholder(action: BookingAction) {
  if (action === 'cancel') return 'Optional cancellation reason for the traveler'
  if (action === 'complete') return 'Optional completion note for support context'
  return 'Optional note for the resend event'
}

function actionSuccessMessage(action: BookingAction) {
  if (action === 'cancel') return 'Booking cancelled and traveler notified'
  if (action === 'complete') return 'Booking completed and traveler notified'
  return 'Confirmation resent to the traveler notification center'
}