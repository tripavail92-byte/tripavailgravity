/**
 * Booking Mutation Hooks
 * 
 * ✅ Enterprise: Mutations with proper cache invalidation
 * 
 * CRITICAL: When bookings are created/confirmed, availability cache MUST be invalidated
 * to prevent showing stale availability to other users.
 */

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { packageBookingService, tourBookingService } from '@/features/booking'
import type { Database } from '@/types/database.types'
import { availabilityKeys } from './availabilityQueries'
import { bookingKeys } from './bookingQueries'

type PackageBooking = Database['public']['Tables']['package_bookings']['Row']
type TourBooking = Database['public']['Tables']['tour_bookings']['Row']

/**
 * Package Booking Mutations
 */

interface CreatePackageBookingParams {
  package_id: string
  traveler_id: string
  check_in_date: string
  check_out_date: string
  guest_count: number
}

interface ConfirmPackageBookingParams {
  bookingId: string
  packageId: string
  checkIn: string
  checkOut: string
}

/**
 * Hook: Create Package Booking Hold
 * 
 * ✅ Invalidates availability cache for specific dates
 * ⚡ Creates 10-minute hold atomically
 */
export function useCreatePackageBooking(
  options?: Omit<UseMutationOptions<PackageBooking, Error, CreatePackageBookingParams>, 'mutationFn'>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: CreatePackageBookingParams) => {
      return await packageBookingService.createPendingBooking(params)
    },
    onSuccess: (data, variables) => {
      // Invalidate availability for this specific package + date range
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.packageAvailability(
          variables.package_id,
          variables.check_in_date,
          variables.check_out_date
        )
      })
      
      // Invalidate user's booking list
      queryClient.invalidateQueries({
        queryKey: bookingKeys.userPackageBookings(variables.traveler_id)
      })
    },
    ...options
  })
}

/**
 * Hook: Confirm Package Booking (After Payment)
 * 
 * ✅ Invalidates availability cache
 * ⚡ Called from payment success handler
 */
export function useConfirmPackageBooking(
  options?: Omit<UseMutationOptions<PackageBooking, Error, ConfirmPackageBookingParams>, 'mutationFn'>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ bookingId }: ConfirmPackageBookingParams) => {
      return await packageBookingService.confirmBooking(bookingId)
    },
    onSuccess: (_data, variables) => {
      // CRITICAL: Invalidate availability for this package + dates
      // Prevents other users from seeing stale "available" status
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.packageAvailability(
          variables.packageId,
          variables.checkIn,
          variables.checkOut
        )
      })
      
      // Also invalidate all bookings for this package (admin view)
      queryClient.invalidateQueries({
        queryKey: bookingKeys.packageBookings()
      })
    },
    ...options
  })
}

/**
 * Tour Booking Mutations
 */

interface CreateTourBookingParams {
  schedule_id: string
  traveler_id: string
  tour_date: string
  guest_count: number
}

interface ConfirmTourBookingParams {
  bookingId: string
  scheduleId: string
  tourDate: string
}

/**
 * Hook: Create Tour Booking Hold
 * 
 * ✅ Invalidates tour slot availability
 */
export function useCreateTourBooking(
  options?: Omit<UseMutationOptions<TourBooking, Error, CreateTourBookingParams>, 'mutationFn'>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: CreateTourBookingParams) => {
      return await tourBookingService.createPendingBooking(params)
    },
    onSuccess: (_data, variables) => {
      // Invalidate tour slot availability for this schedule + date
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.tourAvailability(variables.schedule_id, variables.tour_date)
      })
      
      // Invalidate available slots query
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.tourSlots(variables.schedule_id)
      })
      
      // Invalidate user's tour bookings
      queryClient.invalidateQueries({
        queryKey: bookingKeys.userTourBookings(variables.traveler_id)
      })
    },
    ...options
  })
}

/**
 * Hook: Confirm Tour Booking (After Payment)
 */
export function useConfirmTourBooking(
  options?: Omit<UseMutationOptions<TourBooking, Error, ConfirmTourBookingParams>, 'mutationFn'>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ bookingId }: ConfirmTourBookingParams) => {
      return await tourBookingService.confirmBooking(bookingId)
    },
    onSuccess: (_data, variables) => {
      // CRITICAL: Invalidate tour availability
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.tourAvailability(variables.scheduleId, variables.tourDate)
      })
      
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.tourSlots(variables.scheduleId)
      })
      
      // Invalidate all tour bookings (admin view)
      queryClient.invalidateQueries({
        queryKey: bookingKeys.tourBookings()
      })
    },
    ...options
  })
}

/**
 * Optimistic Update Utilities (Advanced Pattern)
 * 
 * For instant UI feedback before server confirms
 */

export function useOptimisticPackageBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: CreatePackageBookingParams) => {
      return await packageBookingService.createPendingBooking(params)
    },
    
    // Before mutation runs
    onMutate: async (variables) => {
      // Cancel outgoing availability queries
      await queryClient.cancelQueries({
        queryKey: availabilityKeys.packageAvailability(
          variables.package_id,
          variables.check_in_date,
          variables.check_out_date
        )
      })
      
      // Get current availability value
      const previousAvailability = queryClient.getQueryData<boolean>(
        availabilityKeys.packageAvailability(
          variables.package_id,
          variables.check_in_date,
          variables.check_out_date
        )
      )
      
      // Optimistically mark as unavailable
      queryClient.setQueryData(
        availabilityKeys.packageAvailability(
          variables.package_id,
          variables.check_in_date,
          variables.check_out_date
        ),
        false
      )
      
      // Return context for rollback
      return { previousAvailability }
    },
    
    // If mutation fails, rollback
    onError: (_err, variables, context) => {
      if (context?.previousAvailability !== undefined) {
        queryClient.setQueryData(
          availabilityKeys.packageAvailability(
            variables.package_id,
            variables.check_in_date,
            variables.check_out_date
          ),
          context.previousAvailability
        )
      }
    },
    
    // Always refetch to ensure accuracy
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.packageAvailability(
          variables.package_id,
          variables.check_in_date,
          variables.check_out_date
        )
      })
    }
  })
}
