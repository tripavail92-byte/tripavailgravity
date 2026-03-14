/**
 * Payment Success Handler Service
 *
 * Handles the post-payment flow:
 * 1. Validate booking is still pending & not expired
 * 2. Confirm the pending booking (transition to confirmed)
 * 3. Update payment status
 *
 * ⚠️ CRITICAL: Must validate expiration!
 * If Stripe returns success after 10-min hold expired,
 * this must fail gracefully and tell user to rebook.
 */

import {
  type PackageBooking,
  packageBookingService,
  type TourBooking,
  tourBookingService,
  validateBookingBeforePayment,
  validatePackageBookingBeforePayment,
} from '@/features/booking'

export interface PaymentSuccessResult {
  success: boolean
  booking?: TourBooking
  error?: string
}

export interface PackagePaymentSuccessResult {
  success: boolean
  booking?: PackageBooking
  error?: string
}

/**
 * Handle successful payment by confirming the pending booking
 * Called after Stripe confirms payment_intent.succeeded
 *
 * CRITICAL VALIDATIONS:
 * 1. Booking exists
 * 2. Booking status = pending (not already confirmed)
 * 3. Booking hasn't expired (expires_at > now)
 * 4. Booking ID matches payment intent
 */
export async function handlePaymentSuccess(
  paymentIntentId: string,
  bookingId: string,
): Promise<PaymentSuccessResult> {
  try {
    // STEP 1: Load the booking directly from the return URL booking_id.
    // The payment intent can be written slightly later than the redirect/navigation.
    const booking = await tourBookingService.getBookingById(bookingId)

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    // STEP 2: Reject mismatched payment intents when one is already stored.
    if (booking.stripe_payment_intent_id && booking.stripe_payment_intent_id !== paymentIntentId) {
      return {
        success: false,
        error: 'Payment intent mismatch - possible security issue',
      }
    }

    // STEP 3: Make confirmation idempotent for return-page reloads.
    if (booking.status === 'confirmed' && booking.payment_status === 'paid') {
      return {
        success: true,
        booking,
      }
    }

    // STEP 4: VALIDATE booking state before confirming
    // This checks: exists, status=pending, NOT expired
    const validation = await validateBookingBeforePayment(bookingId)

    if (!validation.isValid) {
      // Graceful failure if booking expired or invalid state
      return {
        success: false,
        error: validation.error || 'Booking validation failed',
      }
    }

    // STEP 5: Confirm the pending booking (transition to confirmed)
    await tourBookingService.confirmBooking(bookingId)

    // STEP 6: Update payment status to paid and persist the intent ID.
    const finalBooking = await tourBookingService.updatePaymentStatus(
      bookingId,
      'paid',
      paymentIntentId,
      'stripe_card', // payment_method
    )

    return {
      success: true,
      booking: finalBooking,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment confirmation failed'
    console.error('Payment success handler error:', error)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Handle successful payment for package bookings
 */
export async function handlePackagePaymentSuccess(
  paymentIntentId: string,
  bookingId: string,
): Promise<PackagePaymentSuccessResult> {
  try {
    const booking = await packageBookingService.getBookingById(bookingId)

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    if (booking.stripe_payment_intent_id && booking.stripe_payment_intent_id !== paymentIntentId) {
      return {
        success: false,
        error: 'Payment intent mismatch - possible security issue',
      }
    }

    if (booking.status === 'confirmed' && booking.payment_status === 'paid') {
      return {
        success: true,
        booking,
      }
    }

    const validation = await validatePackageBookingBeforePayment(bookingId)

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || 'Booking validation failed',
      }
    }

    await packageBookingService.confirmBooking(bookingId)

    const finalBooking = await packageBookingService.updatePaymentStatus(
      bookingId,
      'paid',
      paymentIntentId,
      'stripe_card',
    )

    return {
      success: true,
      booking: finalBooking,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment confirmation failed'
    console.error('Package payment success handler error:', error)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Hook for handling payment completion in React components
 * Use this in the return URL page after Stripe redirects
 */
export function usePaymentConfirmation() {
  const confirmPayment = async (
    paymentIntentId: string,
    bookingId: string,
  ): Promise<PaymentSuccessResult> => {
    return handlePaymentSuccess(paymentIntentId, bookingId)
  }

  return { confirmPayment }
}

/**
 * Hook for handling package payment completion in React components
 */
export function usePackagePaymentConfirmation() {
  const confirmPackagePayment = async (
    paymentIntentId: string,
    bookingId: string,
  ): Promise<PackagePaymentSuccessResult> => {
    return handlePackagePaymentSuccess(paymentIntentId, bookingId)
  }

  return { confirmPackagePayment }
}
