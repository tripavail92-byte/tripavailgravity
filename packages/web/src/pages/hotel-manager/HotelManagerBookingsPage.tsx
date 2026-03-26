import { format } from 'date-fns'
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Receipt,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'

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
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { bookingService, type PackageBooking } from '@/features/booking/services/bookingService'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type OwnerBookingTab = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
type OwnerCancellationAction = 'approve' | 'decline' | 'refund'

type TravelerProfile = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
}

type OwnerPackageBookingRecord = PackageBooking & {
  packages?: {
    id: string
    name: string
    owner_id: string
  } | null
  travelerProfile?: TravelerProfile | null
}

function statusVariant(status: OwnerPackageBookingRecord['status']) {
  if (status === 'confirmed') return 'default'
  if (status === 'pending') return 'outline'
  if (status === 'cancelled' || status === 'refunded') return 'destructive'
  return 'secondary'
}

function paymentTone(paymentStatus: OwnerPackageBookingRecord['payment_status']) {
  if (paymentStatus === 'paid') return 'text-success'
  if (paymentStatus === 'processing') return 'text-warning'
  if (paymentStatus === 'failed' || paymentStatus === 'refunded') return 'text-destructive'
  return 'text-muted-foreground'
}

function travelerLabel(booking: OwnerPackageBookingRecord) {
  const fullName = [
    booking.travelerProfile?.first_name,
    booking.travelerProfile?.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  if (fullName) return fullName
  if (booking.travelerProfile?.email) return booking.travelerProfile.email
  return `${booking.traveler_id.slice(0, 8)}...`
}

function cancellationState(booking: OwnerPackageBookingRecord) {
  const value = booking.metadata?.cancellation_request_state
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function refundAmount(booking: OwnerPackageBookingRecord) {
  const value = Number(booking.metadata?.refund_amount || 0)
  if (value > 0) return value
  if (booking.payment_status === 'refunded') {
    return Number((booking.amount_paid_online ?? booking.upfront_amount ?? booking.total_price) || 0)
  }
  return 0
}

function paidOnlineAmount(booking: OwnerPackageBookingRecord) {
  return Number((booking.amount_paid_online ?? booking.upfront_amount ?? booking.total_price) || 0)
}

function availableCancellationActions(booking: OwnerPackageBookingRecord) {
  const state = cancellationState(booking)
  const paidOnline = paidOnlineAmount(booking)

  if (state === 'requested') {
    return [
      'approve',
      'decline',
      ...(paidOnline > 0 ? (['refund'] as OwnerCancellationAction[]) : []),
    ] as OwnerCancellationAction[]
  }

  if (state === 'declined') {
    return [
      'approve',
      ...(paidOnline > 0 ? (['refund'] as OwnerCancellationAction[]) : []),
    ] as OwnerCancellationAction[]
  }

  if (state === 'approved' && paidOnline > 0 && booking.payment_status !== 'refunded' && booking.payment_status !== 'partially_refunded') {
    return ['refund']
  }

  return [] as OwnerCancellationAction[]
}

function actionLabel(action: OwnerCancellationAction) {
  if (action === 'approve') return 'Approve cancellation'
  if (action === 'decline') return 'Decline request'
  return 'Record refund'
}

export default function HotelManagerBookingsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [bookings, setBookings] = useState<OwnerPackageBookingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<OwnerBookingTab>('all')
  const [reviewTarget, setReviewTarget] = useState<OwnerPackageBookingRecord | null>(null)
  const [reviewAction, setReviewAction] = useState<OwnerCancellationAction | null>(null)
  const [reviewReason, setReviewReason] = useState('')
  const [refundAmountInput, setRefundAmountInput] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const highlightedBookingId = searchParams.get('bookingId')
  const highlightedBooking = useMemo(
    () => bookings.find((booking) => booking.id === highlightedBookingId) ?? null,
    [bookings, highlightedBookingId],
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'hotel_manager')
    return () => document.documentElement.removeAttribute('data-role')
  }, [])

  const loadBookings = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const rawBookings = (await bookingService.package.getOwnerBookings(user.id)) as OwnerPackageBookingRecord[]
      const travelerIds = Array.from(new Set(rawBookings.map((booking) => booking.traveler_id).filter(Boolean)))

      let profilesById = new Map<string, TravelerProfile>()
      if (travelerIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', travelerIds)

        if (profileError) {
          console.error('Failed to load traveler profiles for owner bookings:', profileError)
        } else {
          profilesById = new Map((profiles || []).map((profile) => [profile.id, profile as TravelerProfile]))
        }
      }

      setBookings(
        rawBookings.map((booking) => ({
          ...booking,
          travelerProfile: profilesById.get(booking.traveler_id) ?? null,
        })),
      )
      setError(null)
    } catch (loadError) {
      console.error('Failed to load owner bookings:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Failed to load package bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBookings()
  }, [user?.id])

  const stats = useMemo(() => {
    const confirmed = bookings.filter((booking) => booking.status === 'confirmed')
    const pending = bookings.filter((booking) => booking.status === 'pending')
    const cancellationRequests = bookings.filter((booking) => cancellationState(booking) === 'requested')
    const revenue = confirmed.reduce((sum, booking) => sum + booking.total_price, 0)

    return {
      confirmed: confirmed.length,
      pending: pending.length,
      cancellationRequests: cancellationRequests.length,
      revenue,
    }
  }, [bookings])

  const filteredBookings = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return bookings.filter((booking) => booking.status === 'pending')
      case 'confirmed':
        return bookings.filter((booking) => booking.status === 'confirmed')
      case 'completed':
        return bookings.filter((booking) => booking.status === 'completed')
      case 'cancelled':
        return bookings.filter((booking) => booking.status === 'cancelled' || booking.status === 'refunded')
      default:
        return bookings
    }
  }, [activeTab, bookings])

  useEffect(() => {
    if (!highlightedBookingId || loading) return
    const row = document.getElementById(`owner-booking-row-${highlightedBookingId}`)
    if (!row) return
    row.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [filteredBookings, highlightedBookingId, loading])

  const clearHighlightedBooking = () => {
    if (!highlightedBookingId) return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('bookingId')
    setSearchParams(nextParams, { replace: true })
  }

  const openReviewDialog = (booking: OwnerPackageBookingRecord, action: OwnerCancellationAction) => {
    setReviewTarget(booking)
    setReviewAction(action)
    setReviewReason('')
    setRefundAmountInput(action === 'refund' ? String(paidOnlineAmount(booking)) : '')
  }

  const handleSubmitReview = async () => {
    if (!reviewTarget || !reviewAction) return

    const reason = reviewReason.trim()
    const refundAmount = reviewAction === 'refund' ? Number(refundAmountInput) : undefined

    if ((reviewAction === 'approve' || reviewAction === 'decline') && !reason) {
      toast.error('Add a note for the traveler before submitting this decision')
      return
    }

    if (reviewAction === 'refund' && (!Number.isFinite(refundAmount) || refundAmount <= 0)) {
      toast.error('Enter a valid refund amount')
      return
    }

    try {
      setSubmittingReview(true)
      await bookingService.reviewTravelerCancellationRequest('package_booking', {
        bookingId: reviewTarget.id,
        action: reviewAction,
        reason,
        refundAmount,
      })
      toast.success(
        reviewAction === 'approve'
          ? 'Cancellation approved'
          : reviewAction === 'decline'
            ? 'Cancellation declined'
            : 'Refund recorded',
      )
      setReviewTarget(null)
      setReviewAction(null)
      setReviewReason('')
      setRefundAmountInput('')
      await loadBookings()
    } catch (submitError) {
      console.error('Failed to review package cancellation request:', submitError)
      toast.error(submitError instanceof Error ? submitError.message : 'Unable to update cancellation request')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Bookings"
          subtitle="Dedicated package-owner reservation console with traveler messaging, payment context, and cancellation review actions outside the thread view."
          showBackButton={false}
          actions={
            <Button asChild variant="outline" className="rounded-2xl border-border/60 bg-background/70 hover:bg-accent">
              <Link to="/help">
                Need help
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GlassCard variant="card" className="rounded-3xl p-5">
            <StatCard icon={BedDouble} label="Confirmed" value={String(stats.confirmed)} />
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <StatCard icon={CalendarRange} label="Pending" value={String(stats.pending)} />
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <StatCard icon={AlertTriangle} label="Needs review" value={String(stats.cancellationRequests)} />
          </GlassCard>
          <GlassCard variant="card" className="rounded-3xl p-5">
            <StatCard icon={Receipt} label="Revenue" value={`PKR ${stats.revenue.toLocaleString()}`} />
          </GlassCard>
        </div>

        {highlightedBooking ? (
          <GlassCard variant="card" className="mb-6 rounded-3xl border border-primary/30 px-6 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Focused reservation view</p>
                <p className="text-sm text-muted-foreground">
                  This table is highlighting the booking linked from a thread or oversight surface.
                </p>
              </div>
              <Button variant="outline" className="rounded-2xl" onClick={clearHighlightedBooking}>
                Clear highlight
              </Button>
            </div>
          </GlassCard>
        ) : null}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OwnerBookingTab)}>
          <TabsList className="mb-4 h-auto rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="all" className="rounded-2xl">All</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-2xl">Pending</TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-2xl">Confirmed</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-2xl">Completed</TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-2xl">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <GlassCard variant="card" className="overflow-hidden rounded-3xl p-0">
              {error ? (
                <div className="p-8 text-center text-sm text-destructive">{error}</div>
              ) : loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading bookings...</div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-12 text-center">
                  <h2 className="text-lg font-black text-foreground">No bookings in this view</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    New package reservations will appear here with payment context and cancellation decision controls.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reservation</TableHead>
                      <TableHead>Traveler</TableHead>
                      <TableHead>Stay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Cancellation</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      const requestState = cancellationState(booking)
                      const reviewActions = availableCancellationActions(booking)

                      return (
                        <TableRow
                          key={booking.id}
                          id={`owner-booking-row-${booking.id}`}
                          className={booking.id === highlightedBooking?.id ? 'bg-primary/5 ring-1 ring-primary/30' : undefined}
                        >
                          <TableCell>
                            <div>
                              <p className="font-semibold text-foreground">{booking.packages?.name || 'Package booking'}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Ref {booking.id.slice(0, 8).toUpperCase()} · booked {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-foreground">{travelerLabel(booking)}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {booking.travelerProfile?.email || 'Message in booking thread'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {booking.check_in_date ? format(new Date(booking.check_in_date), 'MMM d, yyyy') : 'Check-in not set'}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {booking.check_out_date
                                  ? `${format(new Date(booking.check_out_date), 'MMM d, yyyy')} · ${booking.guest_count} guests`
                                  : `${booking.guest_count} guests`}
                              </p>
                            </div>
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
                              <div>
                                <span className={`text-sm font-medium ${paymentTone(booking.payment_status)}`}>
                                  {booking.payment_status || 'unpaid'}
                                </span>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Paid online: PKR {paidOnlineAmount(booking).toLocaleString()}
                                </p>
                                {refundAmount(booking) > 0 ? (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Refunded: PKR {refundAmount(booking).toLocaleString()}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {requestState ? (
                                <Badge variant="outline" className="capitalize">
                                  {requestState}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">No request</span>
                              )}
                              {booking.metadata?.traveler_cancellation_reason ? (
                                <p className="text-xs text-muted-foreground">
                                  Traveler note: {booking.metadata.traveler_cancellation_reason}
                                </p>
                              ) : null}
                              {booking.metadata?.cancellation_request_review_reason ? (
                                <p className="text-xs text-muted-foreground">
                                  Decision note: {booking.metadata.cancellation_request_review_reason}
                                </p>
                              ) : null}
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
                                <Link to={`/messages?scope=package_booking&bookingId=${booking.id}`}>
                                  <MessageSquare className="mr-2 h-3.5 w-3.5" />
                                  Message traveler
                                </Link>
                              </Button>
                              {reviewActions.map((action) => (
                                <Button
                                  key={action}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full border-border/60 bg-background/80 px-3 text-xs"
                                  onClick={() => openReviewDialog(booking, action)}
                                >
                                  {action === 'approve' ? <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> : action === 'refund' ? <CreditCard className="mr-2 h-3.5 w-3.5" /> : <AlertTriangle className="mr-2 h-3.5 w-3.5" />}
                                  {actionLabel(action)}
                                </Button>
                              ))}
                              {!reviewActions.length ? (
                                <span className="text-xs text-muted-foreground">No cancellation action available</span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-foreground">
                            <p>PKR {booking.total_price.toLocaleString()}</p>
                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                              Guests: {booking.guest_count}
                            </p>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={reviewAction !== null}
        onOpenChange={(open) => {
          if (!open && !submittingReview) {
            setReviewTarget(null)
            setReviewAction(null)
            setReviewReason('')
            setRefundAmountInput('')
          }
        }}
      >
        <DialogContent className="rounded-3xl border-border/60 bg-background/95 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{reviewAction ? actionLabel(reviewAction) : 'Review cancellation request'}</DialogTitle>
            <DialogDescription>
              {reviewTarget
                ? `${reviewTarget.packages?.name || 'Package booking'} · ${travelerLabel(reviewTarget)} · ${reviewTarget.check_in_date ? format(new Date(reviewTarget.check_in_date), 'MMM d, yyyy') : 'Upcoming stay'}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction === 'refund' ? (
              <Input
                value={refundAmountInput}
                onChange={(event) => setRefundAmountInput(event.target.value)}
                placeholder="Refund amount in PKR"
                className="rounded-2xl border-border/60 bg-background/80"
              />
            ) : null}
            <Textarea
              value={reviewReason}
              onChange={(event) => setReviewReason(event.target.value)}
              placeholder={
                reviewAction === 'decline'
                  ? 'Explain why the booking stays active'
                  : reviewAction === 'approve'
                    ? 'Tell the traveler what happens next'
                    : 'Add refund timing, amount confirmation, or finance notes'
              }
              className="min-h-[140px] rounded-2xl border-border/60 bg-background/80"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setReviewAction(null)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-2xl" disabled={submittingReview} onClick={handleSubmitReview}>
              {submittingReview ? 'Saving...' : reviewAction ? actionLabel(reviewAction) : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble
  label: string
  value: string
}) {
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