/**
 * Booking Module - Main Export
 * Central location for all booking-related services, types, and jobs
 */

// Services
export {
  type PackageBooking,
  packageBookingService,
  type PaymentWebhook,
  paymentWebhookService,
  type TourBooking,
  tourBookingService,
} from './services/bookingService'

// Payment Success Handler
export {
  handlePackagePaymentSuccess,
  handlePaymentSuccess,
  type PackagePaymentSuccessResult,
  type PaymentSuccessResult,
  usePackagePaymentConfirmation,
  usePaymentConfirmation,
} from './services/paymentSuccessHandler'

// Booking Validation
export {
  type BookingValidationResult,
  createBookingWithValidation,
  createPackageBookingWithValidation,
  isBookingStillValid,
  type PackageValidationResult,
  validateAvailableCapacity,
  validateBookingBeforePayment,
  validatePackageAvailability,
  validatePackageBookingBeforePayment,
} from './services/bookingValidation'

// Jobs
export type { ExpiryJobResult } from './jobs/expiryJob'
export { expireOldPendingBookings } from './jobs/expiryJob'
