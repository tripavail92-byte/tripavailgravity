import { supabase } from '@/lib/supabase'
import { buildPaymentTermsFromTotal, getTourPaymentTerms } from '@/lib/pricing'
import { inspectPromo } from '@/lib/booking'

/**
 * Real booking + payment flow — port of web bookingService/bookingValidation
 * + the Stripe edge functions:
 *   1. create a 10-minute pending HOLD (tour: validated insert; package:
 *      create_package_booking_atomic RPC)
 *   2. stripe-create-payment-intent { booking_id, booking_type } → client_secret
 *      (charges upfront_amount — full or deposit — in the listing currency)
 *   3. PaymentSheet (in the checkout screens)
 *   4. stripe-verify-payment-intent confirms server-side and finalizes the booking.
 */

export interface BookingHold {
  id: string
  total_price: number
  upfront_amount: number
  remaining_amount: number
  expires_at: string
  payment_collection_mode: string
}

export async function createTourBookingHold(params: {
  tourId: string
  scheduleId: string
  travelerId: string
  guestCount: number
  promoCode?: string
  tourTitle?: string
  scheduleStart?: string
}): Promise<BookingHold> {
  // Validate capacity first (same as web createBookingWithValidation).
  const { data: slots, error: slotsError } = await supabase.rpc('get_available_slots', {
    schedule_id_param: params.scheduleId,
  })
  if (slotsError) throw slotsError
  if (Number(slots ?? 0) < params.guestCount) {
    throw new Error(`Only ${Number(slots ?? 0)} seat(s) currently available.`)
  }

  const { data: tourRow, error: tourError } = await supabase
    .from('tours')
    .select('price, pricing_tiers, deposit_required, deposit_percentage')
    .eq('id', params.tourId)
    .single()
  if (tourError) throw tourError
  const tour = tourRow as Record<string, any>

  const baseTerms = getTourPaymentTerms({
    basePrice: Number(tour.price || 0),
    guestCount: params.guestCount,
    pricingTiers: tour.pricing_tiers,
    depositRequired: tour.deposit_required,
    depositPercentage: Number(tour.deposit_percentage || 0),
  })

  let terms = baseTerms
  let promo: Awaited<ReturnType<typeof inspectPromo>> | null = null
  if (params.promoCode?.trim()) {
    promo = await inspectPromo(params.tourId, params.promoCode.trim(), baseTerms.totalAmount)
    if (promo.status !== 'valid') throw new Error('That promo code is no longer valid.')
    terms = buildPaymentTermsFromTotal({
      totalAmount: promo.discountedTotal,
      guestCount: params.guestCount,
      depositRequired: tour.deposit_required,
      depositPercentage: Number(tour.deposit_percentage || 0),
    })
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  const row: Record<string, any> = {
    tour_id: params.tourId,
    schedule_id: params.scheduleId,
    traveler_id: params.travelerId,
    pax_count: params.guestCount,
    total_price: terms.totalAmount,
    status: 'pending',
    expires_at: expiresAt,
    payment_status: 'unpaid',
    payment_collection_mode: terms.paymentCollectionMode,
    deposit_required: terms.paymentCollectionMode === 'partial_online',
    deposit_percentage:
      terms.paymentCollectionMode === 'partial_online' ? terms.upfrontPercentage : 0,
    upfront_amount: terms.upfrontAmount,
    remaining_amount: terms.remainingAmount,
    amount_paid_online: 0,
    amount_due_to_operator: terms.remainingAmount,
    payment_policy_text: terms.paymentPolicyText,
    promo_discount_value: promo?.appliedDiscount ?? 0,
    price_before_promo: baseTerms.totalAmount,
    metadata: {
      tour_name: params.tourTitle ?? null,
      schedule_start: params.scheduleStart ?? null,
      guest_count: params.guestCount,
      payment_collection_mode: terms.paymentCollectionMode,
      upfront_amount: terms.upfrontAmount,
      remaining_amount: terms.remainingAmount,
      promo_code: promo?.code ?? null,
      source: 'mobile_app',
    },
  }

  const { data, error } = await supabase.from('tour_bookings').insert(row).select().single()
  if (error) throw error
  const b = data as Record<string, any>
  return {
    id: b.id,
    total_price: Number(b.total_price),
    upfront_amount: Number(b.upfront_amount ?? b.total_price),
    remaining_amount: Number(b.remaining_amount ?? 0),
    expires_at: b.expires_at,
    payment_collection_mode: b.payment_collection_mode ?? 'full_online',
  }
}

export async function createPackageBookingHold(params: {
  packageId: string
  travelerId: string
  checkInDate: string
  checkOutDate: string
  guestCount: number
}): Promise<BookingHold> {
  const { data, error } = await supabase.rpc('create_package_booking_atomic', {
    package_id_param: params.packageId,
    traveler_id_param: params.travelerId,
    check_in_param: params.checkInDate,
    check_out_param: params.checkOutDate,
    guest_count_param: params.guestCount,
  })
  if (error) throw error
  const bookingId = data as string

  const { data: booking, error: loadError } = await supabase
    .from('package_bookings')
    .select('*')
    .eq('id', bookingId)
    .single()
  if (loadError) throw loadError
  const b = booking as Record<string, any>
  return {
    id: b.id,
    total_price: Number(b.total_price),
    upfront_amount: Number(b.upfront_amount ?? b.total_price),
    remaining_amount: Number(b.remaining_amount ?? 0),
    expires_at: b.expires_at,
    payment_collection_mode: b.payment_collection_mode ?? 'full_online',
  }
}

export async function createPaymentIntent(
  bookingId: string,
  bookingType: 'tour' | 'package',
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const { data, error } = await supabase.functions.invoke('stripe-create-payment-intent', {
    body: { booking_id: bookingId, booking_type: bookingType },
  })
  if (error) throw new Error(error.message ?? 'Could not start payment')
  if (!data?.ok || !data?.client_secret) {
    throw new Error(data?.error ?? 'Could not start payment')
  }
  return { clientSecret: data.client_secret, paymentIntentId: data.payment_intent_id }
}

export async function verifyPayment(
  bookingId: string,
  paymentIntentId: string,
  bookingType: 'tour' | 'package',
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('stripe-verify-payment-intent', {
    body: {
      booking_id: bookingId,
      payment_intent_id: paymentIntentId,
      booking_type: bookingType,
    },
  })
  if (error) throw new Error(error.message ?? 'Payment verification failed')
  if (!data?.ok) throw new Error(data?.error ?? 'Payment verification failed')
}
