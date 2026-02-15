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
} from './services/bookingService'

// Payment Success Handler
export {
  handlePaymentSuccess,
  handlePackagePaymentSuccess,
  usePaymentConfirmation,
  usePackagePaymentConfirmation,
  type PaymentSuccessResult,
  type PackagePaymentSuccessResult,
} from './services/paymentSuccessHandler'

// Booking Validation
export {
  validateAvailableCapacity,
  createBookingWithValidation,
  isBookingStillValid,
  validateBookingBeforePayment,
  validatePackageAvailability,
  createPackageBookingWithValidation,
  validatePackageBookingBeforePayment,
  type BookingValidationResult,
  type PackageValidationResult,
} from './services/bookingValidation'

// Jobs
export { expireOldPendingBookings } from './jobs/expiryJob'
export type { ExpiryJobResult } from './jobs/expiryJob'
