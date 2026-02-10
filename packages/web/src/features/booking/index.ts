/**
 * Booking Module - Main Export
 * Central location for all booking-related services, types, and jobs
 */

// Services
export {
  tourBookingService,
  packageBookingService,
  paymentWebhookService,
  type TourBooking,
  type PackageBooking,
  type PaymentWebhook,
} from './services/bookingService';

// Payment Success Handler
export {
  handlePaymentSuccess,
  usePaymentConfirmation,
  type PaymentSuccessResult,
} from './services/paymentSuccessHandler';

// Booking Validation
export {
  validateAvailableCapacity,
  createBookingWithValidation,
  isBookingStillValid,
  validateBookingBeforePayment,
  type BookingValidationResult,
} from './services/bookingValidation';

// Jobs
export { expireOldPendingBookings } from './jobs/expiryJob';
export type { ExpiryJobResult } from './jobs/expiryJob';
