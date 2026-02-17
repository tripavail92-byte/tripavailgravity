import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { Database } from '@/types/database.types'
import { supabase } from '@/lib/supabase'

type PackageBooking = Database['public']['Tables']['package_bookings']['Row']
type TourBooking = Database['public']['Tables']['tour_bookings']['Row']

/**
 * Query Keys for Booking Operations
 */
export const bookingKeys = {
  all: ['bookings'] as const,
  packageBookings: () => [...bookingKeys.all, 'package'] as const,
  packageBooking: (id: string) => [...bookingKeys.packageBookings(), id] as const,
  tourBookings: () => [...bookingKeys.all, 'tour'] as const,
  tourBooking: (id: string) => [...bookingKeys.tourBookings(), id] as const,
  userPackageBookings: (userId: string) => [...bookingKeys.all, 'user-packages', userId] as const,
  userTourBookings: (userId: string) => [...bookingKeys.all, 'user-tours', userId] as const,
}

/**
 * Fetch package booking by ID
 */
async function fetchPackageBookingById(id: string): Promise<PackageBooking> {
  const { data, error } = await supabase
    .from('package_bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`[bookingQueries] Error fetching package booking ${id}:`, error)
    throw error
  }

  return data
}

/**
 * Hook: Fetch package booking by ID
 * StaleTime: 30 seconds (booking details can change during payment)
 */
export function usePackageBooking(
  id: string | undefined | null,
  options?: Omit<UseQueryOptions<PackageBooking, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: bookingKeys.packageBooking(id || ''),
    queryFn: () => fetchPackageBookingById(id!),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
    ...options,
  })
}

/**
 * Fetch tour booking by ID
 */
async function fetchTourBookingById(id: string): Promise<TourBooking> {
  const { data, error } = await supabase
    .from('tour_bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`[bookingQueries] Error fetching tour booking ${id}:`, error)
    throw error
  }

  return data
}

/**
 * Hook: Fetch tour booking by ID
 * StaleTime: 30 seconds
 */
export function useTourBooking(
  id: string | undefined | null,
  options?: Omit<UseQueryOptions<TourBooking, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: bookingKeys.tourBooking(id || ''),
    queryFn: () => fetchTourBookingById(id!),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
    ...options,
  })
}
