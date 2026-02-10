/**
 * Booking Validation Service
 * 
 * Handles transactional safety and race condition prevention:
 * - Validates available slots at booking time
 * - Prevents overbooking due to concurrent requests
 * - Checks capacity hasn't been exceeded
 * - Ensures atomicity of booking creation
 */

import { packageBookingService, tourBookingService } from './bookingService';

export interface BookingValidationResult {
  isValid: boolean;
  availableSlots: number;
  requestedSlots: number;
  error?: string;
}

export interface PackageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate that requested slots are available
 * Performs a real-time capacity check before booking creation
 * 
 * This is called IMMEDIATELY before createPendingBooking()
 * to ensure the slots are still available
 */
export async function validateAvailableCapacity(
  scheduleId: string,
  requestedSlots: number
): Promise<BookingValidationResult> {
  try {
    // Get current available slots (live calculation from DB)
    const availableSlots = await tourBookingService.getAvailableSlots(scheduleId);

    // Check if requested slots exceed available
    if (requestedSlots > availableSlots) {
      return {
        isValid: false,
        availableSlots,
        requestedSlots,
        error: `Only ${availableSlots} seat${availableSlots !== 1 ? 's' : ''} available, you requested ${requestedSlots}`,
      };
    }

    // Check for invalid input
    if (requestedSlots < 1) {
      return {
        isValid: false,
        availableSlots,
        requestedSlots,
        error: 'At least 1 guest is required',
      };
    }

    // Validation passed
    return {
      isValid: true,
      availableSlots,
      requestedSlots,
    };
  } catch (error) {
    return {
      isValid: false,
      availableSlots: 0,
      requestedSlots,
      error: error instanceof Error ? error.message : 'Capacity validation failed',
    };
  }
}

/**
 * Safe booking creation with validation
 * 
 * This function:
 * 1. Validates capacity is available
 * 2. Creates pending booking atomically
 * 3. Handles race conditions by catching constraint violations
 * 
 * Returns booking if successful, error if capacity exhausted or validation fails
 */
export async function createBookingWithValidation(params: {
  tour_id: string;
  schedule_id: string;
  traveler_id: string;
  pax_count: number;
  total_price: number;
  metadata?: any;
}) {
  // Step 1: Validate capacity before attempting creation
  const validation = await validateAvailableCapacity(params.schedule_id, params.pax_count);

  if (!validation.isValid) {
    throw new Error(validation.error || 'Booking validation failed');
  }

  // Step 2: Create pending booking
  // If capacity has changed since validation (race condition), this may also fail
  try {
    const booking = await tourBookingService.createPendingBooking(params);
    return {
      success: true,
      booking,
      availableSlots: validation.availableSlots,
    };
  } catch (error) {
    // Check if error is due to capacity constraint
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    if (errorMsg.includes('capacity') || errorMsg.includes('RLS')) {
      // Likely a capacity or permission issue - get current availability
      const currentCapacity = await tourBookingService.getAvailableSlots(params.schedule_id);
      throw new Error(
        `Booking failed. Only ${currentCapacity} seat${currentCapacity !== 1 ? 's' : ''} currently available.`
      );
    }

    throw error;
  }
}

/**
 * Check if a booking is still valid (not expired)
 */
export async function isBookingStillValid(bookingId: string): Promise<boolean> {
  try {
    const booking = await tourBookingService.getPendingBooking(bookingId);

    if (!booking) {
      return false; // Booking not found or not pending
    }

    if (booking.expires_at) {
      const expiresAt = new Date(booking.expires_at);
      const now = new Date();
      return expiresAt > now; // Still valid if expiry is in the future
    }

    return true; // No expiry set (fallback)
  } catch (error) {
    console.error('Error checking booking validity:', error);
    return false;
  }
}

/**
 * Validate booking before payment
 * Ensures:
 * 1. Booking still exists
 * 2. Booking is still pending (not confirmed/expired)
 * 3. Booking hasn't expired (10 min hold)
 */
export async function validateBookingBeforePayment(
  bookingId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const booking = await tourBookingService.getPendingBooking(bookingId);

    if (!booking) {
      return {
        isValid: false,
        error: 'Booking not found',
      };
    }

    if (booking.status !== 'pending') {
      return {
        isValid: false,
        error: `Booking is ${booking.status}`,
      };
    }

    // Check expiration
    if (booking.expires_at) {
      const expiresAt = new Date(booking.expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        return {
          isValid: false,
          error: 'Booking hold has expired. Please book again.',
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Validation error',
    };
  }
}

/**
 * Validate package availability for selected date range
 */
export async function validatePackageAvailability(params: {
  package_id: string;
  check_in_date: string;
  check_out_date: string;
}): Promise<PackageValidationResult> {
  try {
    const available = await packageBookingService.checkAvailability(
      params.package_id,
      params.check_in_date,
      params.check_out_date
    );

    if (!available) {
      return {
        isValid: false,
        error: 'Package not available for selected dates',
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Package validation failed',
    };
  }
}

/**
 * Safe package booking creation with overlap validation
 */
export async function createPackageBookingWithValidation(params: {
  package_id: string;
  traveler_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
}) {
  const validation = await validatePackageAvailability(params);

  if (!validation.isValid) {
    throw new Error(validation.error || 'Package validation failed');
  }

  try {
    const booking = await packageBookingService.createPendingBooking(params);
    return {
      success: true,
      booking,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    if (errorMsg.includes('not available') || errorMsg.includes('Minimum') || errorMsg.includes('Maximum')) {
      throw new Error(errorMsg);
    }

    throw error;
  }
}

/**
 * Validate package booking before payment
 * Ensures: booking exists, status=pending, not expired
 */
export async function validatePackageBookingBeforePayment(
  bookingId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const booking = await packageBookingService.getPendingBooking(bookingId);

    if (!booking) {
      return {
        isValid: false,
        error: 'Booking not found',
      };
    }

    if (booking.status !== 'pending') {
      return {
        isValid: false,
        error: `Booking is ${booking.status}`,
      };
    }

    if (booking.expires_at) {
      const expiresAt = new Date(booking.expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        return {
          isValid: false,
          error: 'Booking hold has expired. Please book again.',
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Validation error',
    };
  }
}
