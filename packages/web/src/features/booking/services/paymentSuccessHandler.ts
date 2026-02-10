/**
 * Payment Success Handler Service
 * 
 * Handles the post-payment flow:
 * 1. Verify payment was successful with Stripe
 * 2. Confirm the pending booking
 * 3. Redirect to confirmation page
 */

import { tourBookingService, TourBooking } from '@/features/booking';

export interface PaymentSuccessResult {
  success: boolean;
  booking?: TourBooking;
  error?: string;
}

/**
 * Handle successful payment by confirming the pending booking
 * Called after Stripe confirms payment_intent.succeeded
 */
export async function handlePaymentSuccess(
  paymentIntentId: string,
  bookingId: string
): Promise<PaymentSuccessResult> {
  try {
    // 1. Find the booking by payment intent ID to verify it exists
    const booking = await tourBookingService.getBookingByPaymentIntent(paymentIntentId);
    
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found for this payment',
      };
    }

    // 2. Verify the booking ID matches (extra safety check)
    if (booking.id !== bookingId) {
      return {
        success: false,
        error: 'Booking ID mismatch',
      };
    }

    // 3. Check if booking is still pending (shouldn't be confirmed already)
    if (booking.status !== 'pending') {
      return {
        success: false,
        error: `Booking is already ${booking.status}`,
      };
    }

    // 4. Confirm the pending booking (transition to confirmed)
    const confirmedBooking = await tourBookingService.confirmBooking(bookingId);

    // 5. Update payment status to paid
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
