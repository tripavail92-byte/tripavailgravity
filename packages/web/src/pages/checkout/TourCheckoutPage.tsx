import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  MapPin,
  Shield,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { GlassCard, GlassContent, GlassHeader, GlassTitle } from '@/components/ui/glass'
import { Input } from '@/components/ui/input'
import { createBookingWithValidation, TourBooking, tourBookingService } from '@/features/booking'
import {
  buildTourPaymentTermsFromTotal,
  getTourPaymentTerms,
  type ResolvedTourPromotion,
} from '@/features/booking/utils/tourPaymentTerms'
import { operatorPublicService } from '@/features/tour-operator/services/operatorPublicService'
import { Tour, TourSchedule, tourService } from '@/features/tour-operator/services/tourService'
import { useAuth } from '@/hooks/useAuth'
import { getSessionCached } from '@/lib/authCache'
import { getStripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

const STRIPE_TEST_CARD_HINT = 'Sandbox card: 4242 4242 4242 4242 · any future date · any CVC.'

interface CountdownTimer {
  minutes: number
  seconds: number
}

function logStripeDebug(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const enabled =
    params.get('stripe_debug') === '1' || window.localStorage.getItem('tripavail:stripe-debug') === '1'

  if (!enabled) return

  const globalWindow = window as Window & {
    __tripavailStripeDebug?: Array<Record<string, unknown>>
  }
  const entry = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  }

  globalWindow.__tripavailStripeDebug = [...(globalWindow.__tripavailStripeDebug ?? []), entry]
  console.info('[stripe-debug]', entry)
}

export default function TourCheckoutPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const requestedGuests = Math.max(1, Number(searchParams.get('guests') || '1') || 1)
  const autoStartPayment = searchParams.get('autostart') === '1'

  // State
  const [tour, setTour] = useState<Tour | null>(null)
  const [schedule, setSchedule] = useState<TourSchedule | null>(null)
  const [availableSlots, setAvailableSlots] = useState<number | null>(null)
  const [guestCount, setGuestCount] = useState(requestedGuests)
  const [loading, setLoading] = useState(true)
  const [processingBooking, setProcessingBooking] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [pendingBooking, setPendingBooking] = useState<TourBooking | null>(null)
  const [countdown, setCountdown] = useState<CountdownTimer>({ minutes: 10, seconds: 0 })
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromotion, setAppliedPromotion] = useState<ResolvedTourPromotion | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false)
  const [stripeAvailable, setStripeAvailable] = useState<boolean | null>(null)
  const [paymentIntentAttempted, setPaymentIntentAttempted] = useState(false)
  const isTestStripe = Boolean(
    (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)?.startsWith('pk_test_'),
  )

  // Fetch tour and schedule details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return
      try {
        const foundTour = await tourService.getTourById(id)
        setTour(foundTour)

        if (foundTour) {
          // IMPORTANT: Use foundTour.id (UUID) instead of id (which might be a slug)
          const schedules = await tourService.getTourSchedules(foundTour.id)
          const mainSchedule = schedules[0]
          setSchedule(mainSchedule)

          if (mainSchedule) {
            try {
              const slots = await tourBookingService.getAvailableSlots(mainSchedule.id)
              setAvailableSlots(slots)
            } catch (error) {
              console.error('Error fetching available slots:', error)
              setAvailableSlots(0)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching tour details:', error)
        setTour(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [id])

  // Countdown timer for pending booking (10 minutes)
  useEffect(() => {
    if (!pendingBooking?.expires_at) return

    const interval = setInterval(() => {
      const now = new Date()
      const expiresAt = new Date(pendingBooking.expires_at!)
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        // Booking expired
        clearInterval(interval)
        setPendingBooking(null)
        setCountdown({ minutes: 0, seconds: 0 })
        setBookingError('Your booking hold has expired. Please try again.')
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setCountdown({ minutes, seconds })
    }, 1000)

    return () => clearInterval(interval)
  }, [pendingBooking?.expires_at])

  // Require authentication
  useEffect(() => {
    if (!loading && !user) {
      navigate(
        '/auth?mode=signup&notice=checkout&redirect=' +
          encodeURIComponent(window.location.pathname + window.location.search),
      )
    }
  }, [loading, user, navigate])

  // Calculate totals (apply group pricing tiers when applicable)
  const baseUnitPrice = Number(tour?.price || 0)
  const normalizedPricingTiers = Array.isArray(tour?.pricing_tiers)
    ? tour.pricing_tiers
        .map((tier: any) => ({
          minPeople: Number(tier?.minPeople || 0),
          maxPeople: Number(tier?.maxPeople || 0),
          pricePerPerson: Number(tier?.pricePerPerson || 0),
          name: String(tier?.name || ''),
        }))
        .filter((tier: any) => tier.minPeople > 0 && tier.pricePerPerson > 0)
    : []

  const rangeMatchedTier = normalizedPricingTiers
    .filter((tier: any) => {
      const meetsMin = guestCount >= tier.minPeople
      const withinMax = tier.maxPeople > 0 ? guestCount <= tier.maxPeople : true
      return meetsMin && withinMax
    })
    .sort((a: any, b: any) => b.minPeople - a.minPeople)[0]
  const fallbackThresholdTier = normalizedPricingTiers
    .filter((tier: any) => guestCount >= tier.minPeople)
    .sort((a: any, b: any) => b.minPeople - a.minPeople)[0]
  const applicableTier = rangeMatchedTier || fallbackThresholdTier

  const basePaymentTerms = getTourPaymentTerms({
    basePrice: baseUnitPrice,
    guestCount,
    pricingTiers: tour?.pricing_tiers,
    depositRequired: tour?.deposit_required,
    depositPercentage: Number(tour?.deposit_percentage || 0),
  })
  const paymentTerms = appliedPromotion
    ? buildTourPaymentTermsFromTotal({
        totalAmount: appliedPromotion.discountedBookingTotal,
        guestCount,
        depositRequired: tour?.deposit_required,
        depositPercentage: Number(tour?.deposit_percentage || 0),
        activeTier: basePaymentTerms.activeTier,
      })
    : basePaymentTerms
  const effectiveUnitPrice = paymentTerms.effectiveUnitPrice
  const totalPrice = paymentTerms.totalAmount
  const payNowAmount = paymentTerms.upfrontAmount
  const payLaterAmount = paymentTerms.remainingAmount
  const usesDeposit = paymentTerms.paymentCollectionMode === 'partial_online'
  const scheduleCapacity = schedule?.capacity || null
  const liveAvailableSeats = availableSlots ?? scheduleCapacity ?? 0
  const seatsRemainingAfterSelection = Math.max(0, liveAvailableSeats - guestCount)
  const maxGuests = Math.max(
    1,
    Math.min(liveAvailableSeats, scheduleCapacity ?? liveAvailableSeats),
  )

  useEffect(() => {
    setGuestCount((prev) => Math.min(prev, maxGuests))
  }, [maxGuests])

  useEffect(() => {
    setAppliedPromotion(null)
    setPromoError(null)
  }, [guestCount, tour?.id])

  // Create Stripe PaymentIntent when booking is created
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!pendingBooking?.id || clientSecret || creatingPaymentIntent || paymentIntentAttempted)
        return

      setCreatingPaymentIntent(true)
      setBookingError(null)
      setPaymentIntentAttempted(true)

      try {
        const session = await getSessionCached()
        let accessToken = session?.access_token

        if (!accessToken) {
          const { data: refreshed } = await supabase.auth.refreshSession()
          accessToken = refreshed?.session?.access_token
        }

        if (!accessToken) {
          throw new Error('Session expired. Please sign in again.')
        }

        const { data, error } = await supabase.functions.invoke('stripe-create-payment-intent', {
          body: {
            booking_id: pendingBooking.id,
            booking_type: 'tour',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (error) {
          if ((error as any)?.status === 401) {
            throw new Error('Session expired. Please sign in again.')
          }
          const msg = String((error as any)?.message || error)
          if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
            throw new Error(
              'Payments are not deployed for this Supabase project (missing Edge Function: stripe-create-payment-intent).',
            )
          }
          throw error
        }

        if (!data?.ok) {
          throw new Error(data?.error || 'Failed to start payment')
        }

        if (!data?.client_secret) {
          throw new Error('No client secret returned')
        }

        setClientSecret(String(data.client_secret))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start payment'
        setBookingError(message)
        if (
          message.toLowerCase().includes('sign in again') ||
          message.toLowerCase().includes('not authenticated')
        ) {
          navigate(
            '/auth?mode=signup&notice=checkout&redirect=' +
              encodeURIComponent(window.location.pathname + window.location.search),
          )
        }
      } finally {
        setCreatingPaymentIntent(false)
      }
    }

    createPaymentIntent()
  }, [
    pendingBooking?.id,
    clientSecret,
    creatingPaymentIntent,
    paymentIntentAttempted,
    totalPrice,
    tour?.currency,
    tour?.id,
    schedule?.id,
    user?.id,
    guestCount,
    navigate,
  ])

  useEffect(() => {
    if (pendingBooking?.id) {
      setPaymentIntentAttempted(false)
    }
  }, [pendingBooking?.id])

  const handleApplyPromo = async () => {
    if (!tour?.id) return

    const normalizedCode = promoCode.trim().toUpperCase()
    if (!normalizedCode) {
      setAppliedPromotion(null)
      setPromoError('Enter a promo code to apply a discount')
      return
    }

    try {
      setPromoLoading(true)
      const preview = await tourBookingService.inspectPromotionPreview({
        tourId: tour.id,
        bookingTotal: basePaymentTerms.totalAmount,
        promoCode: normalizedCode,
      })

      if (preview.status !== 'valid' || !preview.promotion) {
        setAppliedPromotion(null)
        setPromoError(preview.message)
        return
      }

      setAppliedPromotion(preview.promotion)
      setPromoError(null)
    } catch (error) {
      setAppliedPromotion(null)
      setPromoError(error instanceof Error ? error.message : 'Failed to apply promo code')
    } finally {
      setPromoLoading(false)
    }
  }

  // Check Stripe availability
  const stripePromise = getStripe()
  useEffect(() => {
    let cancelled = false
    stripePromise
      .then((stripe) => {
        if (!cancelled) setStripeAvailable(!!stripe)
      })
      .catch(() => {
        if (!cancelled) setStripeAvailable(false)
      })

    return () => {
      cancelled = true
    }
  }, [stripePromise])

  const handleCreatePendingBooking = async () => {
    if (!user?.id || !tour?.id || !schedule?.id) {
      setBookingError('Missing required information')
      return
    }

    if (guestCount > liveAvailableSeats) {
      setBookingError('Not enough seats available')
      return
    }

    setProcessingBooking(true)
    setBookingError(null)

    try {
      // Use safe booking creation with validation
      // This handles race conditions and validates capacity atomically
      const result = await createBookingWithValidation({
        tour_id: tour.id,
        schedule_id: schedule.id,
        traveler_id: user.id,
        pax_count: guestCount,
        total_price: totalPrice,
        promoCode: promoCode.trim() || undefined,
        metadata: {
          tour_name: tour.title,
          schedule_start: schedule.start_time,
          guest_count: guestCount,
          payment_collection_mode: paymentTerms.paymentCollectionMode,
          upfront_amount: payNowAmount,
          remaining_amount: payLaterAmount,
          promo_code: promoCode.trim().toUpperCase() || null,
        },
      })

      setPendingBooking(result.booking)
      setClientSecret(null) // Reset client secret to trigger new payment intent

      if (tour.operator_id) {
        void operatorPublicService.recordStorefrontEvent({
          operatorId: tour.operator_id,
          eventType: 'booking_start',
          tourId: tour.id,
          metadata: {
            booking_id: result.booking.id,
            guest_count: guestCount,
            schedule_id: schedule.id,
          },
        }).catch((eventError) => {
          console.error('Failed to record booking_start storefront event:', eventError)
        })
      }

      // Payment form will be shown automatically via the useEffect
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create booking hold'
      setBookingError(message)
      console.error('Booking creation error:', error)
    } finally {
      setProcessingBooking(false)
    }
  }

  const [autoStartAttempted, setAutoStartAttempted] = useState(false)

  useEffect(() => {
    if (!autoStartPayment || autoStartAttempted) return
    if (loading || !tour || !schedule || !user?.id) return
    if (pendingBooking || processingBooking || clientSecret) return
    if (liveAvailableSeats <= 0) return

    setAutoStartAttempted(true)
    handleCreatePendingBooking()
  }, [
    autoStartPayment,
    autoStartAttempted,
    loading,
    tour,
    schedule,
    user?.id,
    pendingBooking,
    processingBooking,
    clientSecret,
    liveAvailableSeats,
  ])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  if (!tour || !schedule) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="type-h2 text-foreground mb-2">Tour not found</h1>
        <Button
          onClick={() => navigate(-1)}
          variant="default"
          className="rounded-2xl px-8 h-12 font-bold mt-8"
        >
          Back
        </Button>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-muted/30 min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="type-title text-foreground">Complete Your Booking</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tour Summary */}
            <GlassCard
              asMotion
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              variant="card"
              className="rounded-2xl shadow-modern"
            >
              <GlassHeader className="p-6 pb-0">
                <GlassTitle>Tour Details</GlassTitle>
              </GlassHeader>
              <GlassContent className="p-6 pt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="type-title text-foreground mb-2">{tour.title}</h3>
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {tour.location.city}, {tour.location.country}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        {tour.duration}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Info */}
                  <div className="p-4 bg-info/10 rounded-xl border border-info/20">
                    <p className="type-overline text-info mb-2">
                      Your Departure
                    </p>
                    <p className="text-foreground font-bold">
                      {formatDate(schedule.start_time)} at {formatTime(schedule.start_time)}
                    </p>
                    <p className="type-body-sm text-muted-foreground mt-1">
                      Returns: {formatDate(schedule.end_time)}
                    </p>
                  </div>
                </div>
              </GlassContent>
            </GlassCard>

            {/* Guest Selector */}
            {!pendingBooking && !autoStartPayment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm"
              >
                <h2 className="type-h2 text-foreground mb-4">Select Number of Guests</h2>
                <div className="space-y-4">
                  <p className="type-body-sm text-muted-foreground">
                    Live seats available:{' '}
                    <span className="text-foreground font-bold">{liveAvailableSeats}</span>
                  </p>
                  <p className="type-body-sm text-muted-foreground">
                    Remaining after this booking:{' '}
                    <span className="text-foreground font-bold">{seatsRemainingAfterSelection}</span>
                  </p>

                  {/* Guest Counter */}
                  <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl">
                    <button
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      disabled={guestCount <= 1}
                      className="w-10 h-10 rounded-lg bg-background border border-border/60 flex items-center justify-center font-bold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <p className="text-3xl font-black text-foreground">{guestCount}</p>
                      <p className="type-caption text-muted-foreground">
                        {guestCount === 1 ? 'Guest' : 'Guests'}
                      </p>
                    </div>
                    <button
                      onClick={() => setGuestCount(Math.min(maxGuests, guestCount + 1))}
                      disabled={guestCount >= maxGuests}
                      className="w-10 h-10 rounded-lg bg-background border border-border/60 flex items-center justify-center font-bold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {seatsRemainingAfterSelection < 5 && liveAvailableSeats > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                      <p className="type-body-sm text-warning">
                        {seatsRemainingAfterSelection === 0
                          ? 'This selection will use the last available seats.'
                          : `Only ${seatsRemainingAfterSelection} seat${seatsRemainingAfterSelection > 1 ? 's' : ''} will remain after this booking`}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Pending Booking / Payment State */}
            {pendingBooking && (
              <GlassCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                variant="card"
                className="rounded-2xl shadow-modern"
              >
                <GlassContent className="p-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="type-h2 text-foreground mb-2">
                        Booking Hold Active
                      </h3>
                      <p className="type-body-sm text-muted-foreground">
                        Your seats are reserved for 10 minutes
                      </p>
                    </div>

                    {/* Countdown Timer */}
                    <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 text-center">
                      <p className="type-body-sm text-muted-foreground mb-2">
                        Time Remaining
                      </p>
                      <div className="text-5xl font-black text-primary">
                        {String(countdown.minutes).padStart(2, '0')}:
                        {String(countdown.seconds).padStart(2, '0')}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-3 p-4 bg-muted/40 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Booking ID</span>
                        <span className="font-mono text-sm font-bold text-foreground">
                          {pendingBooking.id.slice(0, 8).toUpperCase()}...
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Guests</span>
                        <span className="font-bold text-foreground">
                          {pendingBooking.pax_count}
                        </span>
                      </div>
                      <div className="h-px bg-border/60" />
                      <div className="flex items-center justify-between text-lg">
                        <span className="text-foreground font-bold">Total booking amount</span>
                        <span className="font-black text-primary">
                          {tour.currency} {Number(pendingBooking.total_price || totalPrice).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">
                          Pay now{usesDeposit ? ` (${paymentTerms.upfrontPercentage}%)` : ''}
                        </span>
                        <span className="font-bold text-foreground">
                          {tour.currency} {Number(pendingBooking.upfront_amount ?? payNowAmount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Pay later to operator</span>
                        <span className="font-bold text-foreground">
                          {tour.currency} {Number(pendingBooking.remaining_amount ?? payLaterAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {usesDeposit ? (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                        You are paying only {tour.currency} {Number(pendingBooking.upfront_amount ?? payNowAmount).toFixed(2)} now to confirm your booking. The remaining {tour.currency} {Number(pendingBooking.remaining_amount ?? payLaterAmount).toFixed(2)} will be paid directly to the tour operator before departure.
                      </div>
                    ) : null}

                    {/* Stripe Payment Form */}
                    <div className="space-y-4">
                      {stripeAvailable === false ? (
                        <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 text-center">
                          <p className="type-body-sm text-destructive">
                            Payments are not configured.
                          </p>
                        </div>
                      ) : !clientSecret ? (
                        <div className="p-4 bg-info/10 rounded-xl border border-info/20 text-center">
                          <Loader2 className="w-5 h-5 animate-spin text-primary inline-block mr-2" />
                          <p className="type-body-sm text-info inline">
                            {creatingPaymentIntent
                              ? 'Preparing secure payment...'
                              : 'Loading payment form...'}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-muted/40 rounded-xl border border-border/60">
                          <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <TourPaymentForm
                              bookingId={pendingBooking.id}
                              chargeAmount={Number(pendingBooking.upfront_amount ?? payNowAmount)}
                              remainingAmount={Number(pendingBooking.remaining_amount ?? payLaterAmount)}
                              currency={tour.currency}
                            />
                          </Elements>
                          {isTestStripe ? (
                            <p className="mt-3 text-xs text-muted-foreground">{STRIPE_TEST_CARD_HINT}</p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </GlassContent>
              </GlassCard>
            )}

            {/* Error Messages */}
            {bookingError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="type-body-sm text-destructive">{bookingError}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column: Price Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <GlassCard variant="card" className="rounded-2xl shadow-modern">
                <GlassHeader className="p-6 pb-0">
                  <GlassTitle>Price Summary</GlassTitle>
                </GlassHeader>
                <GlassContent className="p-6 pt-4">
                  <div className="space-y-4">
                    {!pendingBooking ? (
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Promo code</p>
                          <p className="text-xs text-muted-foreground">
                            Apply an operator or TripAvail promo before payment.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={promoCode}
                            onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                            placeholder="Enter promo code"
                            className="h-11 rounded-xl"
                            aria-label="Promo code"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-xl"
                            onClick={handleApplyPromo}
                            disabled={promoLoading}
                          >
                            {promoLoading ? 'Applying...' : 'Apply'}
                          </Button>
                        </div>
                        {promoError ? (
                          <p className="text-xs text-destructive">{promoError}</p>
                        ) : null}
                        {appliedPromotion ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                            <p className="font-semibold">
                              {appliedPromotion.code} applied: {tour.currency} {appliedPromotion.appliedDiscountValue.toFixed(2)} off
                            </p>
                            <p className="mt-1 text-xs text-emerald-800">
                              {appliedPromotion.ownerLabel} · {appliedPromotion.fundingSource === 'platform' ? 'TripAvail funded' : 'Operator funded'}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Tour price</span>
                      <span className="text-foreground font-bold">
                        {tour.currency} {effectiveUnitPrice.toFixed(2)} per person
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Travelers</span>
                      <span className="text-foreground font-bold">{guestCount}</span>
                    </div>
                    {applicableTier ? (
                      <div className="type-caption text-success font-semibold">
                        Tier applied: {applicableTier.name || `${applicableTier.minPeople}+ guests`}
                      </div>
                    ) : null}
                    {appliedPromotion ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">Original booking total</span>
                          <span className="text-foreground font-bold">
                            {tour.currency} {basePaymentTerms.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">Promo discount</span>
                          <span className="font-bold text-emerald-700">
                            -{tour.currency} {appliedPromotion.appliedDiscountValue.toFixed(2)}
                          </span>
                        </div>
                        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs text-emerald-900">
                          Your promo savings are already reflected in the pay-now and remaining-balance amounts below.
                        </div>
                      </>
                    ) : null}
                    <div className="h-px bg-border/60" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Total booking amount</span>
                      <span className="text-foreground font-bold">
                        {tour.currency} {totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">
                        Pay now{usesDeposit ? ` (${paymentTerms.upfrontPercentage}%)` : ''}
                      </span>
                      <span className="text-foreground font-bold">
                        {tour.currency} {payNowAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Pay later to operator</span>
                      <span className="text-foreground font-bold">
                        {tour.currency} {payLaterAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-bold">Payment Summary</span>
                      <span className="type-h2 text-primary">
                        {tour.currency} {payNowAmount.toFixed(2)}
                      </span>
                    </div>
                    {usesDeposit ? (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                        You pay {tour.currency} {payNowAmount.toFixed(2)} now. Remaining {tour.currency} {payLaterAmount.toFixed(2)} will be paid directly to the tour operator before departure.
                      </div>
                    ) : null}
                  </div>

                  {!pendingBooking && (
                    <Button
                      onClick={handleCreatePendingBooking}
                      disabled={
                        processingBooking ||
                        (availableSlots !== null && guestCount > availableSlots)
                      }
                      className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold mt-6"
                    >
                      {processingBooking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Starting Payment...
                        </>
                      ) : (
                        <>
                          Pay {tour.currency} {payNowAmount.toFixed(2)} & Confirm Booking
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                  </div>
                </GlassContent>
              </GlassCard>

              {/* Trust Badges */}
              <GlassCard variant="card" className="rounded-2xl">
                <GlassContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-success" />
                    <span className="type-body-sm text-muted-foreground">Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-success" />
                    <span className="type-body-sm text-muted-foreground">Data Protected</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <span className="type-body-sm text-muted-foreground">Instant Confirmation</span>
                  </div>
                </GlassContent>
              </GlassCard>

              {/* Policy Info */}
              <div className="bg-info/10 border border-info/20 rounded-2xl p-4">
                <p className="type-caption text-info leading-relaxed">
                  <span className="font-bold">Free cancellation</span> up to 48 hours before
                  departure. Your booking hold will expire in 10 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TourPaymentForm(props: { bookingId: string; chargeAmount: number; remainingAmount: number; currency: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentReady, setPaymentReady] = useState(false)
  const [lastPaymentEvent, setLastPaymentEvent] = useState<{
    complete: boolean
    empty: boolean
    collapsed?: boolean
    valueType: string | null
  } | null>(null)
  const stripeDebugEnabled =
    typeof window !== 'undefined'
    && (new URLSearchParams(window.location.search).get('stripe_debug') === '1'
      || window.localStorage.getItem('tripavail:stripe-debug') === '1')

  const handlePay = async () => {
    if (!stripe || !elements) {
      logStripeDebug('payment_submit_blocked', {
        bookingId: props.bookingId,
        hasStripe: Boolean(stripe),
        hasElements: Boolean(elements),
        paymentReady,
        lastPaymentEvent,
      })
      return
    }

    const paymentElement = elements.getElement(PaymentElement)
    if (!paymentElement) {
      logStripeDebug('payment_element_missing', {
        bookingId: props.bookingId,
        paymentReady,
        lastPaymentEvent,
      })
      setError('Payment form is still loading. Please wait a moment and try again.')
      return
    }

    setSubmitting(true)
    setError(null)
    logStripeDebug('payment_submit_started', {
      bookingId: props.bookingId,
      chargeAmount: props.chargeAmount,
      remainingAmount: props.remainingAmount,
      paymentReady,
      lastPaymentEvent,
    })

    try {
      const returnUrl =
        window.location.origin +
        `/booking/confirmation?booking_id=${encodeURIComponent(props.bookingId)}`

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      })
      const paymentIntentStatus = 'paymentIntent' in result ? result.paymentIntent?.status ?? null : null

      if (result.error) {
        logStripeDebug('payment_submit_result', {
          bookingId: props.bookingId,
          outcome: 'error',
          message: result.error.message || 'Payment failed',
          paymentIntentStatus,
          lastPaymentEvent,
        })
        throw new Error(result.error.message || 'Payment failed')
      }

      const paymentIntentId = result.paymentIntent?.id
      logStripeDebug('payment_submit_result', {
        bookingId: props.bookingId,
        outcome: 'success',
        paymentIntentId: paymentIntentId ?? null,
        paymentIntentStatus,
        lastPaymentEvent,
      })
      if (paymentIntentId && result.paymentIntent?.status === 'succeeded') {
        navigate(
          `/booking/confirmation?booking_id=${encodeURIComponent(props.bookingId)}&payment_intent=${encodeURIComponent(paymentIntentId)}`,
        )
      }
    } catch (err) {
      logStripeDebug('payment_submit_exception', {
        bookingId: props.bookingId,
        message: err instanceof Error ? err.message : 'Payment failed',
        lastPaymentEvent,
      })
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement
        onReady={() => {
          setPaymentReady(true)
          logStripeDebug('payment_element_ready', {
            bookingId: props.bookingId,
            chargeAmount: props.chargeAmount,
            remainingAmount: props.remainingAmount,
          })
        }}
        onLoadError={(event: any) => {
          console.error('Stripe PaymentElement failed to load for tour checkout', event)
          logStripeDebug('payment_element_load_error', {
            bookingId: props.bookingId,
            message:
              event?.error?.message ||
              'Secure payment form failed to load. Refresh the page or try another browser.',
          })
          setPaymentReady(false)
          setError(
            event?.error?.message ||
              'Secure payment form failed to load. Refresh the page or try another browser.',
          )
        }}
        onChange={(event: any) => {
          const snapshot = {
            complete: Boolean(event?.complete),
            empty: Boolean(event?.empty),
            collapsed: typeof event?.collapsed === 'boolean' ? event.collapsed : undefined,
            valueType:
              event?.value && typeof event.value === 'object' && 'type' in event.value
                ? String(event.value.type ?? '')
                : null,
          }

          setLastPaymentEvent(snapshot)
          logStripeDebug('payment_element_change', {
            bookingId: props.bookingId,
            ...snapshot,
          })
          if (error) setError(null)
        }}
      />

      {!paymentReady && !error && (
        <div className="type-caption text-muted-foreground">Loading secure payment form...</div>
      )}

      {stripeDebugEnabled && lastPaymentEvent ? (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Stripe debug: ready={paymentReady ? 'yes' : 'no'} complete={lastPaymentEvent.complete ? 'yes' : 'no'} empty={lastPaymentEvent.empty ? 'yes' : 'no'} type={lastPaymentEvent.valueType || 'unknown'}
        </div>
      ) : null}

      {error && <div className="type-body-sm text-destructive">{error}</div>}

      <Button
        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 type-button shadow-xl shadow-primary/25"
        onClick={handlePay}
        disabled={!stripe || !elements || !paymentReady || submitting}
      >
        {submitting
          ? 'Processing...'
          : `Pay ${props.currency} ${Number(props.chargeAmount || 0).toFixed(2)} & Confirm Booking`}
      </Button>
      {props.remainingAmount > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          Remaining {props.currency} {Number(props.remainingAmount || 0).toFixed(2)} will be paid directly to the tour operator before departure.
        </p>
      ) : null}
    </div>
  )
}
