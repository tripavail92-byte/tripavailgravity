import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import type { NearestPickupSearchResult } from '@tripavail/shared/types/tourPickup'

import { isAbortError } from '@/lib/withTimeout'
import { supabase } from '@/lib/supabase'

export const pickupKeys = {
  all: ['pickups'] as const,
  nearestTours: (filters: {
    userLat: number
    userLng: number
    radiusKm: number
    limit: number
    offset: number
  }) =>
    [
      ...pickupKeys.all,
      'nearest_tours',
      filters.userLat,
      filters.userLng,
      filters.radiusKm,
      filters.limit,
      filters.offset,
    ] as const,
}

async function fetchNearestToursByPickup(params: {
  userLat: number
  userLng: number
  radiusKm?: number
  limit?: number
  offset?: number
}): Promise<NearestPickupSearchResult[]> {
  const { userLat, userLng, radiusKm = 200, limit = 50, offset = 0 } = params

  const { data, error } = await supabase.rpc('search_tours_by_nearest_pickup', {
    p_user_lat: userLat,
    p_user_lng: userLng,
    p_radius_km: radiusKm,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    if (isAbortError(error)) return []
    console.error('[pickupQueries] Error fetching nearest tours by pickup:', error)
    throw error
  }

  return (data ?? []) as NearestPickupSearchResult[]
}

export function useNearestToursByPickup(
  params: {
    userLat: number
    userLng: number
    radiusKm?: number
    limit?: number
    offset?: number
  },
  options?: Omit<UseQueryOptions<NearestPickupSearchResult[], Error>, 'queryKey' | 'queryFn'>,
) {
  const radiusKm = params.radiusKm ?? 200
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  return useQuery({
    queryKey: pickupKeys.nearestTours({
      userLat: params.userLat,
      userLng: params.userLng,
      radiusKm,
      limit,
      offset,
    }),
    queryFn: () => fetchNearestToursByPickup({ ...params, radiusKm, limit, offset }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}
