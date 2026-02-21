import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { packageBookingService, tourBookingService } from '@/features/booking'

/**
 * Query Keys for Availability
 * ✅ Enterprise: Schedule-scoped to prevent cache bleed
 */
export const availabilityKeys = {
  all: ['availability'] as const,

  // Package availability - scoped by packageId + dates
  packageAvailability: (packageId: string, checkIn: string, checkOut: string) =>
    ['availability', 'package', packageId, checkIn, checkOut] as const,

  // Tour availability - scoped by scheduleId + date
  tourAvailability: (scheduleId: string, date: string) =>
    ['availability', 'tour', scheduleId, date] as const,

  // Tour slots - scoped by scheduleId
  tourSlots: (scheduleId: string) => ['availability', 'tour-slots', scheduleId] as const,
}

/**
 * Hook: Check Package Availability
 * ✅ Enterprise: 15-second staleTime (availability is inventory-critical)
 *
 * Usage:
 * const { data: isAvailable } = usePackageAvailability(packageId, checkIn, checkOut)
 */
export function usePackageAvailability(
  packageId: string | undefined,
  checkIn: string | undefined,
  checkOut: string | undefined,
  options?: Omit<UseQueryOptions<boolean, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: availabilityKeys.packageAvailability(packageId || '', checkIn || '', checkOut || ''),
    queryFn: async () => {
      if (!packageId || !checkIn || !checkOut) return false
      return await packageBookingService.checkAvailability(packageId, checkIn, checkOut)
    },
    staleTime: 15 * 1000, // 15 seconds - inventory changes rapidly
    gcTime: 1 * 60 * 1000, // 1 minute
    enabled: !!packageId && !!checkIn && !!checkOut,
    ...options,
  })
}

/**
 * Hook: Get Tour Available Slots
 * ✅ Enterprise: 20-second staleTime (slot inventory is critical)
 *
 * Usage:
 * const { data: slotsAvailable } = useTourAvailableSlots(scheduleId)
 */
export function useTourAvailableSlots(
  scheduleId: string | undefined,
  options?: Omit<UseQueryOptions<number, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: availabilityKeys.tourSlots(scheduleId || ''),
    queryFn: async () => {
      if (!scheduleId) return 0
      return await tourBookingService.getAvailableSlots(scheduleId)
    },
    staleTime: 20 * 1000, // 20 seconds
    gcTime: 2 * 60 * 1000,
    enabled: !!scheduleId,
    ...options,
  })
}

/**
 * Prefetch Package Availability
 * ✅ Enterprise: Preload availability on date selection
 *
 * Usage:
 * await prefetchPackageAvailability(queryClient, packageId, checkIn, checkOut)
 */
export async function prefetchPackageAvailability(
  queryClient: any,
  packageId: string,
  checkIn: string,
  checkOut: string,
) {
  return queryClient.prefetchQuery({
    queryKey: availabilityKeys.packageAvailability(packageId, checkIn, checkOut),
    queryFn: () => packageBookingService.checkAvailability(packageId, checkIn, checkOut),
    staleTime: 15 * 1000,
  })
}

/**
 * Prefetch Tour Slots
 * ✅ Enterprise: Preload slot count on schedule hover
 *
 * Usage:
 * await prefetchTourSlots(queryClient, scheduleId)
 */
export async function prefetchTourSlots(queryClient: any, scheduleId: string) {
  return queryClient.prefetchQuery({
    queryKey: availabilityKeys.tourSlots(scheduleId),
    queryFn: () => tourBookingService.getAvailableSlots(scheduleId),
    staleTime: 20 * 1000,
  })
}
