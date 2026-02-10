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

import { tourBookingService, TourBooking, validateBookingBeforePayment } from '@/features/booking';

export interface PaymentSuccessResult {
  success: boolean;
  booking?: TourBooking;
  error?: string;
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
  bookingId: string
): Promise<PaymentSuccessResult> {
  try {
    // STEP 1: Find the booking by payment intent ID to verify it exists
    const booking = await tourBookingService.getBookingByPaymentIntent(paymentIntentId);
    
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found for this payment',
      };
    }

    // STEP 2: Verify the booking ID matches (extra safety check)
    if (booking.id !== bookingId) {
      return {
        success: false,
        error: 'Booking ID mismatch - possible security issue',
      };
    }

    // STEP 3: VALIDATE booking state before confirming
    // This checks: exists, status=pending, NOT expired
    const validation = await validateBookingBeforePayment(bookingId);
    
    if (!validation.isValid) {
      // Graceful failure if booking expired or invalid state
      return {
        success: false,
        error: validation.error || 'Booking validation failed',
      };
    }

    // STEP 4: Confirm the pending booking (transition to confirmed)
    const confirmedBooking = await tourBookingService.confirmBooking(bookingId);

    // STEP 5: Update payment status to paid
    const finalBooking = await tourBookingService.updatePaymentStatus(
      bookingId,
      'paid',
      paymentIntentId,
      'stripe_card' // payment_method
    );

    return {
      success: true,
      booking: finalBooking,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment confirmation failed';
    console.error('Payment success handler error:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Hook for handling payment completion in React components
 * Use this in the return URL page after Stripe redirects
 */
export function usePaymentConfirmation() {
  const confirmPayment = async (
    paymentIntentId: string,
    bookingId: string
  ): Promise<PaymentSuccessResult> => {
    return handlePaymentSuccess(paymentIntentId, bookingId);
  };

  return { confirmPayment };
}
