/**
 * Auto-expiry Job for Pending Bookings
 *
 * Purpose: Automatically expire pending bookings that exceed 10-minute hold window
 * Schedule: Should run every 1-2 minutes (via backend cron or edge function)
 *
 * When a traveler clicks "Book" but doesn't complete payment within 10 minutes:
 * 1. This job marks their booking as 'expired'
 * 2. Their reserved slots are released back to schedule capacity
 * 3. Other travelers immediately see increased availability
 *
 * This prevents dead inventory from abandoned shopping carts
 */

import { packageBookingService, tourBookingService } from '../services/bookingService'

export interface ExpiryJobResult {
  success: boolean
  expiredCount: number
  expiredTours: number
  expiredPackages: number
  error?: string
  timestamp: string
}

/**
 * Main job function - call this from Supabase Edge Function or backend scheduler
 */
export async function expireOldPendingBookings(): Promise<ExpiryJobResult> {
  const timestamp = new Date().toISOString()

  try {
    const [expiredTours, expiredPackages] = await Promise.all([
      tourBookingService.expirePendingBookings(),
      packageBookingService.expirePendingBookings(),
    ])

    const expiredCount = expiredTours + expiredPackages

    return {
      success: true,
      expiredCount,
      expiredTours,
      expiredPackages,
      timestamp,
    }
  } catch (error) {
    return {
      success: false,
      expiredCount: 0,
      expiredTours: 0,
      expiredPackages: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    }
  }
}

/**
 * Setup: Register this job with your scheduler
 *
 * Example 1: Supabase Edge Function (runs on HTTP POST)
 * ```
 * import { expireOldPendingBookings } from '@/features/booking/jobs/expiryJob';
 *
 * Deno.serve(async (req: Request) => {
 *   const result = await expireOldPendingBookings();
 *   return new Response(JSON.stringify(result), { status: 200 });
 * });
 * ```
 *
 * Example 2: Node.js Backend (with node-cron)
 * ```
 * import cron from 'node-cron';
 * import { expireOldPendingBookings } from '@/features/booking/jobs/expiryJob';
 *
 * // Run every 2 minutes
 * cron.schedule('* /2 * * * *', async () => {
 *   const result = await expireOldPendingBookings();
 *   console.log(`Booking expiry job: ${result.expiredCount} bookings expired`);
 * });
 * ```
 *
 * Example 3: AWS Lambda / Railway Cron (POST to Edge Function)
 * Trigger via HTTP POST to:
 * https://your-supabase-project.supabase.co/functions/v1/expire-pending-bookings
 * Every 2 minutes
 */
