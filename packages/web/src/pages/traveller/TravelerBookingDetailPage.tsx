import { format } from 'date-fns'
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  ExternalLink,
  Headphones,
  Loader2,
  MapPin,
  MessageSquare,
  Receipt,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { BookingConversationPanel } from '@/components/messaging/BookingConversationPanel'
import { NotificationBell } from '@/components/notifications/NotificationBell'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { bookingService } from '@/features/booking/services/bookingService'
import { downloadBookingReceipt } from '@/features/booking/utils/bookingReceiptDownload'
import {
  getTravelerBookingOutcomeSummary,
  getTravelerBookingSettlementState,
} from '@/features/booking/utils/travelerBookingPresentation'
import { tourService } from '@/features/tour-operator/services/tourService'
import { useAuth } from '@/hooks/useAuth'
import type { BookingConversationScope } from '@/features/messaging/services/bookingMessengerService'

const BOOKING_TABS = ['overview', 'messages'] as const

type BookingTab = (typeof BOOKING_TABS)[number]

const TOUR_CANCELLATION_POLICY_META = {
  flexible: {
    title: 'Free cancellation',
    description: 'Cancel up to 48 hours before departure.',
  },
  moderate: {
    title: 'Moderate cancellation',
    description: 'Cancel up to 5 days before departure for free.',
  },
  strict: {
    title: 'Strict cancellation',
    description: '50% refund if cancelled 14 days before departure.',
  },
  'non-refundable': {
    title: 'Non-refundable booking',
    description: 'No refund after booking confirmation.',
  },
} as const

function getTourCancellationPolicySummary(policy: unknown) {
  const normalized = typeof policy === 'string' ? policy : 'flexible'
  return TOUR_CANCELLATION_POLICY_META[normalized as keyof typeof TOUR_CANCELLATION_POLICY_META]
    || TOUR_CANCELLATION_POLICY_META.flexible
}

function getTrimmedMetadataString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export default function TravelerBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [booking, setBooking] = useState<any | null>(null)
  const [schedule, setSchedule] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingCompletion, setConfirmingCompletion] = useState(false)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [requestingCancellation, setRequestingCancellation] = useState(false)

  const activeTab = (searchParams.get('tab') as BookingTab) || 'overview'
  const safeActiveTab = BOOKING_TABS.includes(activeTab) ? activeTab : 'overview'

  const loadBookingDetails = async () => {
    if (!user?.id || !bookingId) {
      return
    }

    try {
      setLoading(true)
      const loadedBooking = await bookingService.getTravelerBookingById(user.id, bookingId)

      if (!loadedBooking) {
        setBooking(null)
        setError('Booking not found')
        return
      }

      setBooking(loadedBooking)
      setError(null)

      if (loadedBooking.tours?.id && loadedBooking.schedule_id) {
        const schedules = await tourService.getTourSchedules(loadedBooking.tours.id)
        setSchedule(schedules.find((item) => item.id === loadedBooking.schedule_id) || null)
      } else {
        setSchedule(null)
      }
    } catch (loadError) {
      console.error('Failed to load traveller booking details:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this booking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBookingDetails()
  }, [bookingId, user?.id])

  const scope = useMemo<BookingConversationScope | null>(() => {
    if (!booking) return null
    return booking.tours ? 'tour_booking' : 'package_booking'
  }, [booking])

  const details = booking?.tours || booking?.packages || null
  const imageSrc = booking?.tours
    ? booking.tours.images?.[0]
    : booking?.packages?.cover_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'
  const locationLabel = details?.location?.city || details?.location || 'Location confirmed after booking'
  const dateLabel = booking?.check_in_date || schedule?.start_time || booking?.booking_date || null
  const totalGuests = booking?.pax_count ?? booking?.guest_count ?? 0
  const settlementState = getTravelerBookingSettlementState(booking)
  const outcome = getTravelerBookingOutcomeSummary(settlementState)
  const formatMoney = (value: number) => `PKR ${value.toLocaleString()}`
  const totalAmount = settlementState.totalAmount
  const paidOnline = settlementState.paidOnline
  const remainingAmount = settlementState.remainingAmount
  const promoDiscountValue = settlementState.promoDiscountValue
  const priceBeforePromo = settlementState.priceBeforePromo
  const refundAmount = settlementState.refundAmount
  const refundReason = settlementState.refundReason
  const refundTimestamp = settlementState.refundTimestamp
  const hasPromo = settlementState.hasPromo
  const isRefunded = settlementState.isRefunded
  const isCancelled = settlementState.isCancelled
  const counterpartLabel = scope === 'tour_booking' ? 'tour operator' : 'host'
  const bookingLabel = details?.title || details?.name || 'Booked reservation'
  const messagingUnlocked = Boolean(booking && booking.status !== 'pending' && booking.status !== 'expired')
  const itinerary = Array.isArray(booking?.tours?.itinerary) ? booking.tours.itinerary : []
  const pickupLocations = Array.isArray(booking?.tours?.pickup_locations) ? booking.tours.pickup_locations : []
  const operatorCompletionConfirmedAt =
    typeof booking?.metadata?.operator_completion_confirmed_at === 'string'
      ? booking.metadata.operator_completion_confirmed_at
      : null
  const travelerCompletionConfirmedAt =
    typeof booking?.metadata?.traveler_completion_confirmed_at === 'string'
      ? booking.metadata.traveler_completion_confirmed_at
      : null
  const cancellationRequestState = getTrimmedMetadataString(booking?.metadata?.cancellation_request_state)
  const cancellationRequestedAt = getTrimmedMetadataString(booking?.metadata?.traveler_cancellation_requested_at)
  const cancellationRequestedReason = getTrimmedMetadataString(booking?.metadata?.traveler_cancellation_reason)
  const cancellationReviewedAt = getTrimmedMetadataString(booking?.metadata?.cancellation_request_reviewed_at)
  const cancellationReviewReason = getTrimmedMetadataString(booking?.metadata?.cancellation_request_review_reason)
  const tourCancellationPolicy = getTourCancellationPolicySummary(booking?.tours?.cancellation_policy)
  const packageCancellationPolicy = getTrimmedMetadataString(details?.cancellation_policy)
  const packagePaymentTerms = getTrimmedMetadataString(details?.payment_terms)
  const cancellationPolicyTitle = scope === 'tour_booking'
    ? tourCancellationPolicy.title
    : 'Package cancellation policy'
  const cancellationPolicyDescription = scope === 'tour_booking'
    ? tourCancellationPolicy.description
    : packageCancellationPolicy || 'Your host reviews cancellation requests using the cancellation policy attached to this reservation.'
  const cancellationPolicySecondary = scope === 'package_booking' ? packagePaymentTerms : null
  const cancellationRequestPending = cancellationRequestState === 'requested'
  const cancellationRequestDeclined = cancellationRequestState === 'declined'
  const canRequestCancellation = Boolean(
    scope
    && booking?.status === 'confirmed'
    && !isCancelled
    && !cancellationRequestPending,
  )
  const showCompletionConfirmationAction =
    scope === 'tour_booking'
    && booking?.status === 'completed'
    && Boolean(operatorCompletionConfirmedAt)
    && !travelerCompletionConfirmedAt

  const setTab = (value: string) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', value)
    setSearchParams(nextParams, { replace: true })
  }

  const handleDownloadReceipt = () => {
    if (!booking) return

    const confirmationNumber = booking.id.slice(0, 8).toUpperCase()
    const baseSections = [
      {
        title: 'Booking summary',
        rows: [
          { label: 'Reservation type', value: scope === 'tour_booking' ? 'Tour booking' : 'Package booking' },
          { label: 'Booking status', value: booking.status || 'confirmed' },
          { label: 'Payment status', value: booking.payment_status || 'paid' },
          { label: 'Guests', value: String(totalGuests) },
          { label: 'Total booking amount', value: formatMoney(totalAmount) },
          { label: 'Paid online', value: formatMoney(paidOnline) },
          { label: 'Remaining balance', value: formatMoney(remainingAmount) },
          {
            label: 'Balance payment method',
            value: remainingAmount > 0 ? 'Direct to operator' : 'Fully paid online',
          },
        ],
      },
      {
        title: 'Receipt notes',
        bullets: [
          outcome.message,
          messagingUnlocked
            ? `Message your ${counterpartLabel} directly from the booking workspace.`
            : 'Messaging unlocks automatically after payment clears.',
          remainingAmount > 0
            ? `Remaining balance due before departure: ${formatMoney(remainingAmount)}.`
            : 'This reservation is fully settled online.',
        ],
      },
    ]

    if (scope === 'tour_booking') {
      downloadBookingReceipt({
        fileName: `tripavail-tour-workspace-receipt-${booking.id.slice(0, 8).toLowerCase()}.html`,
        title: outcome.title,
        subtitle: bookingLabel,
        confirmationNumber,
        sections: [
          {
            title: 'Tour details',
            rows: [
              { label: 'Tour name', value: bookingLabel },
              { label: 'Location', value: locationLabel },
              { label: 'Departure', value: dateLabel ? format(new Date(dateLabel), 'MMM d, yyyy') : 'TBA' },
              { label: 'Start time', value: schedule?.start_time ? format(new Date(schedule.start_time), 'MMM d, yyyy h:mm a') : 'TBA' },
              { label: 'End time', value: schedule?.end_time ? format(new Date(schedule.end_time), 'MMM d, yyyy h:mm a') : 'TBA' },
            ],
          },
          ...baseSections,
        ],
      })
      return
    }

    downloadBookingReceipt({
      fileName: `tripavail-package-workspace-receipt-${booking.id.slice(0, 8).toLowerCase()}.html`,
      title: outcome.title,
      subtitle: bookingLabel,
      confirmationNumber,
      sections: [
        {
          title: 'Package details',
          rows: [
            { label: 'Package', value: bookingLabel },
            { label: 'Location', value: locationLabel },
            { label: 'Check-in', value: booking.check_in_date ? format(new Date(booking.check_in_date), 'MMM d, yyyy') : 'TBA' },
            { label: 'Check-out', value: booking.check_out_date ? format(new Date(booking.check_out_date), 'MMM d, yyyy') : 'TBA' },
          ],
        },
        ...baseSections,
      ],
    })
  }

  const handleConfirmCompletion = async () => {
    if (!booking?.id) return

    try {
      setConfirmingCompletion(true)
      await bookingService.confirmTravelerTourCompletion(booking.id)
      const reloadedBooking = await bookingService.getTravelerBookingById(user!.id, booking.id)
      setBooking(reloadedBooking)
      toast.success('Trip completion confirmed')
    } catch (confirmError) {
      console.error('Failed to confirm trip completion:', confirmError)
      toast.error(confirmError instanceof Error ? confirmError.message : 'Unable to confirm trip completion')
    } finally {
      setConfirmingCompletion(false)
    }
  }

  const handleRequestCancellation = async () => {
    if (!booking?.id || !scope) return

    const reason = cancellationReason.trim()
    if (!reason) {
      toast.error('Add a short reason for your cancellation request')
      return
    }

    try {
      setRequestingCancellation(true)
      await bookingService.requestTravelerCancellation(scope, booking.id, reason)
      setShowCancellationDialog(false)
      setCancellationReason('')
      await loadBookingDetails()
      toast.success(`Cancellation request sent to the ${counterpartLabel}`)
    } catch (requestError) {
      console.error('Failed to request booking cancellation:', requestError)
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to request cancellation')
    } finally {
      setRequestingCancellation(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your booking workspace.</p>
        </div>
      </div>
    )
  }

  if (!booking || error) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <PageHeader title="Booking" subtitle="Traveller reservation workspace" backPath="/trips" />
          <GlassCard variant="card" className="rounded-3xl border border-border/60 p-10 text-center">
            <h2 className="text-xl font-semibold text-foreground">Booking unavailable</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {error || 'We could not find that reservation in your account.'}
            </p>
            <Button asChild className="mt-6 rounded-2xl">
              <Link to="/trips">Back to My Trips</Link>
            </Button>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={bookingLabel}
          subtitle="Reservation workspace with secure operator messaging for this booked trip."
          backPath="/trips"
          actions={
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button asChild variant="outline" className="rounded-2xl border-border/60 bg-background/80">
                <Link to="/trips">All bookings</Link>
              </Button>
              {canRequestCancellation ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-border/60 bg-background/80"
                  onClick={() => setShowCancellationDialog(true)}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Request cancellation
                </Button>
              ) : null}
              {cancellationRequestPending ? (
                <Button type="button" variant="outline" className="rounded-2xl border-border/60 bg-background/80" disabled>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Cancellation requested
                </Button>
              ) : null}
              <Button type="button" variant="outline" className="rounded-2xl border-border/60 bg-background/80" onClick={handleDownloadReceipt}>
                <Receipt className="mr-2 h-4 w-4" />
                Download receipt
              </Button>
              <Button
                type="button"
                className="rounded-2xl"
                onClick={() => setTab('messages')}
                disabled={!messagingUnlocked}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message {scope === 'tour_booking' ? 'operator' : 'host'}
              </Button>
            </div>
          }
        />

        <GlassCard variant="card" className="overflow-hidden rounded-[32px] border border-border/60 p-0 shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="relative min-h-[260px] overflow-hidden bg-muted">
              <img src={imageSrc} alt={bookingLabel} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute left-5 top-5">
                <Badge className="rounded-full border-0 bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm">
                  {booking.status}
                </Badge>
              </div>
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  Confirmation
                </p>
                <p className="mt-2 text-2xl font-black">#{booking.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryTile
                  icon={Calendar}
                  label={scope === 'tour_booking' ? 'Departure' : 'Arrival'}
                  value={dateLabel ? format(new Date(dateLabel), 'EEE, MMM d, yyyy') : 'TBA'}
                />
                <SummaryTile icon={MapPin} label="Location" value={locationLabel} />
                <SummaryTile icon={Users} label="Guests" value={String(totalGuests)} />
                <SummaryTile icon={CreditCard} label="Paid online" value={`PKR ${paidOnline.toLocaleString()}`} />
              </div>

              <div className="mt-6 rounded-3xl border border-border/60 bg-background/80 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Messaging access
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-foreground">
                      {messagingUnlocked
                        ? `You can message your ${counterpartLabel}`
                        : 'Messaging unlocks after payment clears'}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      TripAvail keeps traveler and partner communication inside this booked reservation so itinerary changes, pickup notes, and support evidence stay attached to the booking.
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-full border-border/60 bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Post-booking only
                  </Badge>
                </div>
              </div>

              {scope === 'tour_booking' && operatorCompletionConfirmedAt ? (
                <div className="mt-6 rounded-3xl border border-border/60 bg-background/80 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Completion confirmation
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-foreground">
                        {travelerCompletionConfirmedAt
                          ? 'Trip completion confirmed'
                          : 'Operator marked the trip complete'}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        {travelerCompletionConfirmedAt
                          ? 'Both sides have confirmed completion. TripAvail can continue payout processing for this booking.'
                          : 'Confirm completion here after the tour is actually finished. TripAvail will keep operator payout blocked until you confirm.'}
                      </p>
                    </div>
                    {showCompletionConfirmationAction ? (
                      <Button
                        type="button"
                        className="rounded-2xl"
                        onClick={handleConfirmCompletion}
                        disabled={confirmingCompletion}
                      >
                        {confirmingCompletion ? 'Confirming...' : 'Confirm trip completion'}
                      </Button>
                    ) : (
                      <Badge variant="outline" className="w-fit rounded-full border-border/60 bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {travelerCompletionConfirmedAt ? 'Confirmed by both sides' : 'Awaiting your confirmation'}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : null}

              {(canRequestCancellation || cancellationRequestPending || cancellationRequestDeclined) ? (
                <div className="mt-6 rounded-3xl border border-border/60 bg-background/80 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Cancellation support
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-foreground">
                        {cancellationRequestPending
                          ? 'Cancellation request submitted'
                          : cancellationRequestDeclined
                            ? 'Cancellation request declined'
                            : 'Need to cancel this booking?'}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        {cancellationRequestPending
                          ? 'TripAvail sent your request to the partner. The booking remains active until they process the request or support steps in.'
                          : cancellationRequestDeclined
                            ? 'The partner kept this reservation active. Use the booking thread if you need to challenge the decision or submit a new request with updated context.'
                            : 'TripAvail records your cancellation request inside the booking workspace so policy, payment, and support follow-up stay attached to this reservation.'}
                      </p>
                    </div>
                    {canRequestCancellation ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl border-border/60 bg-background/80"
                        onClick={() => setShowCancellationDialog(true)}
                      >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                        Request cancellation
                      </Button>
                    ) : (
                      <Badge variant="outline" className="w-fit rounded-full border-border/60 bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {cancellationRequestPending ? 'Awaiting partner review' : 'Decision recorded'}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <InfoRow label="Policy" value={cancellationPolicyTitle} />
                    <InfoRow label="What to expect" value="Request review before refund" />
                    <InfoRow label="Policy details" value={cancellationPolicyDescription} />
                    {cancellationRequestedAt ? (
                      <InfoRow label="Requested at" value={format(new Date(cancellationRequestedAt), 'MMM d, yyyy h:mm a')} />
                    ) : null}
                    {cancellationRequestedReason ? (
                      <InfoRow label="Your reason" value={cancellationRequestedReason} />
                    ) : null}
                    {cancellationReviewedAt ? (
                      <InfoRow label="Reviewed at" value={format(new Date(cancellationReviewedAt), 'MMM d, yyyy h:mm a')} />
                    ) : null}
                    {cancellationReviewReason ? (
                      <InfoRow label="Partner note" value={cancellationReviewReason} />
                    ) : null}
                    {cancellationPolicySecondary ? (
                      <InfoRow label="Payment terms" value={cancellationPolicySecondary} />
                    ) : null}
                  </div>
                </div>
              ) : null}

              {hasPromo ? (
                <div className="mt-6 rounded-3xl border border-emerald-200/80 bg-emerald-50/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Promo pricing locked at booking time
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">
                    {booking?.promo_owner || 'Promo applied'}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Original total: PKR {priceBeforePromo.toLocaleString()} · Discount: PKR {promoDiscountValue.toLocaleString()} · Final booking total: PKR {totalAmount.toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Funding: {booking?.promo_funding_source === 'platform' ? 'TripAvail funded' : 'Operator funded'}
                  </p>
                </div>
              ) : null}

              {(isRefunded || isCancelled) ? (
                <div className="mt-6 rounded-3xl border border-warning/30 bg-warning/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning">
                    {isRefunded ? 'Refund status' : 'Cancellation status'}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">
                    {outcome.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{outcome.message}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <InfoRow label="Paid online" value={`PKR ${paidOnline.toLocaleString()}`} />
                    <InfoRow label="Refunded amount" value={`PKR ${refundAmount.toLocaleString()}`} />
                    <InfoRow label="Remaining balance" value={`PKR ${remainingAmount.toLocaleString()}`} />
                    <InfoRow label="Booking status" value={booking.status} />
                    {refundReason ? <InfoRow label="Reason" value={refundReason} /> : null}
                    {refundTimestamp ? (
                      <InfoRow label="Updated at" value={format(new Date(refundTimestamp), 'MMM d, yyyy h:mm a')} />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </GlassCard>

        <Tabs value={safeActiveTab} onValueChange={setTab} className="mt-8">
          <TabsList className="mb-6 h-auto rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="overview" className="rounded-2xl px-5">
              Overview
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-2xl px-5">
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <GlassCard variant="card" className="rounded-3xl border border-border/60 p-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Reservation summary
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">What this booking covers</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoRow label="Reservation type" value={scope === 'tour_booking' ? 'Tour booking' : 'Package booking'} />
                    <InfoRow label="Booking status" value={booking.status} />
                    <InfoRow label="Booked on" value={format(new Date(booking.booking_date), 'MMM d, yyyy')} />
                    <InfoRow label="Payment status" value={booking.payment_status || 'paid'} />
                    <InfoRow label="Guests" value={String(totalGuests)} />
                    <InfoRow label="Total" value={`PKR ${totalAmount.toLocaleString()}`} />
                    {hasPromo ? <InfoRow label="Original total" value={`PKR ${priceBeforePromo.toLocaleString()}`} /> : null}
                    {hasPromo ? <InfoRow label="Promo discount" value={`PKR ${promoDiscountValue.toLocaleString()}`} /> : null}
                    {hasPromo ? <InfoRow label="Promo funding" value={booking?.promo_funding_source === 'platform' ? 'TripAvail funded' : 'Operator funded'} /> : null}
                    {hasPromo ? <InfoRow label="Promo attribution" value={booking?.promo_owner || 'Promo applied'} /> : null}
                    <InfoRow label="Upfront paid" value={`PKR ${paidOnline.toLocaleString()}`} />
                    <InfoRow label="Remaining balance" value={`PKR ${remainingAmount.toLocaleString()}`} />
                    {isRefunded ? <InfoRow label="Refunded amount" value={`PKR ${refundAmount.toLocaleString()}`} /> : null}
                    {refundReason ? <InfoRow label="Refund reason" value={refundReason} /> : null}
                    <InfoRow label="Balance payment method" value={remainingAmount > 0 ? 'Direct to operator' : 'Fully paid online'} />
                    <InfoRow label="Due timing" value={remainingAmount > 0 ? 'Before departure' : 'Paid in full'} />
                    {schedule?.start_time ? (
                      <InfoRow label="Start time" value={format(new Date(schedule.start_time), 'MMM d, yyyy h:mm a')} />
                    ) : null}
                    {schedule?.end_time ? (
                      <InfoRow label="End time" value={format(new Date(schedule.end_time), 'MMM d, yyyy h:mm a')} />
                    ) : null}
                    {booking.check_in_date ? (
                      <InfoRow label="Check-in" value={format(new Date(booking.check_in_date), 'MMM d, yyyy')} />
                    ) : null}
                    {booking.check_out_date ? (
                      <InfoRow label="Check-out" value={format(new Date(booking.check_out_date), 'MMM d, yyyy')} />
                    ) : null}
                  </div>

                  {scope === 'tour_booking' && itinerary.length > 0 ? (
                    <div className="space-y-4 border-t border-border/60 pt-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Itinerary
                        </p>
                        <h4 className="mt-1 text-base font-semibold text-foreground">
                          Your booked day-by-day plan
                        </h4>
                      </div>

                      <div className="space-y-6">
                        {itinerary.map((day: any, index: number) => (
                          <div
                            key={`${day?.day ?? index}-${day?.title ?? 'itinerary-day'}`}
                            className="relative border-l-2 border-border/50 pb-6 pl-8 last:border-transparent last:pb-0"
                          >
                            <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                            <div className="space-y-3">
                              <h5 className="text-sm font-semibold text-foreground">
                                Day {day?.day ?? index + 1}
                                {day?.title ? `: ${day.title}` : ''}
                              </h5>

                              {Array.isArray(day?.activities) && day.activities.length > 0 ? (
                                <div className="space-y-2">
                                  {day.activities.map((activity: any, activityIndex: number) => (
                                    <div
                                      key={`${activity?.title ?? activity?.activity ?? 'activity'}-${activityIndex}`}
                                      className="rounded-2xl border border-border/40 bg-muted/20 p-3"
                                    >
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-foreground">
                                          {activity?.title ?? activity?.activity ?? 'Activity'}
                                        </span>
                                        {activity?.time ? (
                                          <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                            {activity.time}
                                          </span>
                                        ) : null}
                                      </div>
                                      {activity?.description ? (
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                          {activity.description}
                                        </p>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : typeof day?.description === 'string' && day.description.trim().length > 0 ? (
                                <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                                    {day.description}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {scope === 'tour_booking' && pickupLocations.length > 0 ? (
                    <div className="space-y-4 border-t border-border/60 pt-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Pickup locations
                        </p>
                        <h4 className="mt-1 text-base font-semibold text-foreground">
                          Where your tour picks up
                        </h4>
                      </div>
                      <div className="space-y-4">
                        {pickupLocations.map((pickup: any, index: number) => (
                          <div
                            key={pickup.id ?? index}
                            className="rounded-2xl border border-border/40 bg-muted/20 p-4 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-sm font-semibold text-foreground">
                                  {pickup.title ?? pickup.name ?? `Stop ${index + 1}`}
                                </span>
                              </div>
                              {pickup.is_primary ? (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                                  Primary
                                </span>
                              ) : null}
                            </div>
                            {pickup.formatted_address ? (
                              <p className="text-sm text-muted-foreground pl-6">{pickup.formatted_address}</p>
                            ) : null}
                            {pickup.pickup_time ? (
                              <p className="text-sm text-muted-foreground pl-6">
                                Pickup: <span className="font-medium text-foreground">{pickup.pickup_time}</span>
                              </p>
                            ) : null}
                            {pickup.notes ? (
                              <p className="text-sm text-muted-foreground pl-6 italic">{pickup.notes}</p>
                            ) : null}
                            {pickup.formatted_address ? (
                              <div className="pl-6">
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickup.formatted_address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Get directions
                                </a>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </GlassCard>

              <div className="space-y-6">
                <GlassCard variant="card" className="rounded-3xl border border-border/60 p-6">
                  <div className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Booking records
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">Keep your receipt and thread together</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Re-download your confirmation from the workspace any time, then use the booking thread for itinerary clarifications, payment follow-up, and support-ready written history.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl border-border/60 bg-background/80"
                      onClick={handleDownloadReceipt}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      Download Receipt
                    </Button>
                    <Button
                      type="button"
                      className="w-full rounded-2xl"
                      onClick={() => setTab('messages')}
                      disabled={!messagingUnlocked}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Open Messages
                    </Button>
                  </div>
                </GlassCard>

                <GlassCard variant="card" className="rounded-3xl border border-border/60 p-6">
                  <div className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-info/10 text-info">
                      <Headphones className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Support
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">Need help with this booking?</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Open the booking thread to message your {counterpartLabel} directly. If you need platform support, use the escalation option inside the messages tab.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl border-border/60 bg-background/80"
                      onClick={() => setTab('messages')}
                      disabled={!messagingUnlocked}
                    >
                      <Headphones className="mr-2 h-4 w-4" />
                      Get support
                    </Button>
                  </div>
                </GlassCard>

                {(canRequestCancellation || cancellationRequestPending || cancellationRequestDeclined) ? (
                  <GlassCard variant="card" className="rounded-3xl border border-border/60 p-6">
                    <div className="space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Cancellation request
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">
                          {cancellationRequestPending
                            ? 'Request in review'
                            : cancellationRequestDeclined
                              ? 'Request was declined'
                              : 'Start a cancellation request'}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cancellationPolicyDescription}
                      </p>
                      {cancellationPolicySecondary ? (
                        <p className="text-sm text-muted-foreground">
                          {cancellationPolicySecondary}
                        </p>
                      ) : null}
                      {cancellationRequestedAt ? (
                        <p className="text-sm text-muted-foreground">
                          Requested on {format(new Date(cancellationRequestedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      ) : null}
                      {cancellationReviewedAt ? (
                        <p className="text-sm text-muted-foreground">
                          Reviewed on {format(new Date(cancellationReviewedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      ) : null}
                      {cancellationReviewReason ? (
                        <p className="text-sm text-muted-foreground">
                          {cancellationReviewReason}
                        </p>
                      ) : null}
                      {cancellationRequestPending ? (
                        <Button type="button" variant="outline" className="w-full rounded-2xl border-border/60 bg-background/80" disabled>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Cancellation requested
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full rounded-2xl border-border/60 bg-background/80"
                          onClick={() => setShowCancellationDialog(true)}
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Request cancellation
                        </Button>
                      )}
                    </div>
                  </GlassCard>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            {scope ? (
              <BookingConversationPanel
                bookingId={booking.id}
                scope={scope}
                counterpartLabel={counterpartLabel}
                bookingLabel={bookingLabel}
                allowMessaging={messagingUnlocked}
                lockedReason="This thread is reserved for confirmed reservations so operators only receive messages tied to paid bookings."
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Request cancellation</DialogTitle>
            <DialogDescription>
              TripAvail will send this request to the {counterpartLabel}. The booking stays active until they process it or support intervenes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Cancellation policy
              </p>
              <h3 className="mt-2 text-base font-semibold text-foreground">{cancellationPolicyTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {cancellationPolicyDescription}
              </p>
              {cancellationPolicySecondary ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {cancellationPolicySecondary}
                </p>
              ) : null}
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Submitting this request does not automatically cancel or refund the booking. The partner reviews the request inside this workspace.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="traveler-cancellation-reason">
                Reason for cancellation
              </label>
              <Textarea
                id="traveler-cancellation-reason"
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                placeholder="Tell the operator what changed so they can review the request quickly."
                rows={5}
                disabled={requestingCancellation}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-border/60 bg-background/80"
              onClick={() => setShowCancellationDialog(false)}
              disabled={requestingCancellation}
            >
              Keep booking
            </Button>
            <Button type="button" className="rounded-2xl" onClick={handleRequestCancellation} disabled={requestingCancellation}>
              {requestingCancellation ? 'Sending request...' : 'Send cancellation request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: string
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-foreground">{value}</p>
    </div>
  )
}