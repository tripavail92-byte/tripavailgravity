import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import type { NearestPickupSearchResult } from '@tripavail/shared/types/tourPickup'

import { isAbortError } from '@/lib/withTimeout'
import { supabase } from '@/lib/supabase'
import type { SearchListing } from '@/queries/searchQueries'

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
  nearbyTours: (filters: { userLat: number; userLng: number; radiusKm: number; limit: number }) =>
    [
      ...pickupKeys.all,
      'nearby_tours',
      filters.userLat,
      filters.userLng,
      filters.radiusKm,
      filters.limit,
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

// ---------------------------------------------------------------------------
// Nearby tours, fully hydrated — the CANONICAL "tours near me" for the app.
//
// A tour has no single location: it has PICKUP POINTS where the trip departs.
// So "nearby tours" means tours whose *nearest pickup* is close to the
// traveller. This does the complete job in two steps so the ranking spans the
// ENTIRE catalogue (not just one paginated page of a text search):
//
//   1. `search_tours_by_nearest_pickup` RPC → every tour with a pickup inside
//      the radius, ordered by nearest-pickup distance (one row per tour).
//   2. Hydrate those tour ids from the `tours` table (anon RLS allows
//      published/active tours) and return them AS SearchListing[] — same shape
//      the unified search yields — in pickup order, with `distanceKm` set to
//      the nearest-pickup distance so cards can read "Pickup N km away".
//
// Use this anywhere the app shows tours near a location (search Tours tab,
// tours browse "Nearest pickup", home "near you"). Returns [] when the
// traveller has no pickup-reachable tour.
// ---------------------------------------------------------------------------

const TOUR_COLUMNS =
  'id,slug,title,location,price,currency,rating,review_count,tour_type,is_featured,duration_days,difficulty_level,images'

function mapTourRowToSearchListing(t: any, distanceKm: number | null): SearchListing {
  const loc = (t?.location && typeof t.location === 'object' ? t.location : {}) as Record<
    string,
    unknown
  >
  const city = typeof loc.city === 'string' ? loc.city : ''
  const country = typeof loc.country === 'string' && loc.country ? loc.country : null
  const locationLabel = [city, country].filter(Boolean).join(', ') || null
  return {
    listingId: String(t.id),
    listingType: 'tour',
    slug: t.slug ?? null,
    title: t.title ?? 'Tour',
    subtitle: city || null,
    locationLabel,
    country,
    price: t.price != null ? Number(t.price) : null,
    currency: t.currency || 'PKR',
    rating: t.rating != null && Number(t.rating) > 0 ? Number(t.rating) : null,
    reviewCount: t.review_count != null ? Number(t.review_count) : null,
    images: Array.isArray(t.images) ? t.images.filter((x: unknown) => typeof x === 'string') : [],
    durationDays: t.duration_days != null ? Number(t.duration_days) : null,
    difficultyLevel: (typeof t.difficulty_level === 'string' && t.difficulty_level.trim()) || null,
    badge: (typeof t.tour_type === 'string' && t.tour_type.trim()) || 'Tour',
    isFeatured: Boolean(t.is_featured),
    distanceKm,
    relevance: 0,
  }
}

async function fetchNearbyTours(params: {
  userLat: number
  userLng: number
  radiusKm: number
  limit: number
}): Promise<SearchListing[]> {
  const { userLat, userLng, radiusKm, limit } = params

  // 1. Ordered tour ids + nearest-pickup distances.
  const { data: pickups, error } = await supabase.rpc('search_tours_by_nearest_pickup', {
    p_user_lat: userLat,
    p_user_lng: userLng,
    p_radius_km: radiusKm,
    p_limit: limit,
    p_offset: 0,
  })
  if (error) {
    if (isAbortError(error)) return []
    console.error('[pickupQueries] Error fetching nearby tours (pickup rpc):', error)
    throw error
  }

  const ordered = (pickups ?? []) as NearestPickupSearchResult[]
  if (!ordered.length) return []

  // Keep the first (nearest) distance per tour, preserving pickup order.
  const distById = new Map<string, number>()
  const orderedIds: string[] = []
  for (const r of ordered) {
    const id = String(r.tour_id)
    if (!distById.has(id)) {
      distById.set(id, r.nearest_distance_km)
      orderedIds.push(id)
    }
  }

  // 2. Hydrate the tour cards.
  const { data: tours, error: hydrateError } = await supabase
    .from('tours')
    .select(TOUR_COLUMNS)
    .in('id', orderedIds)
    .eq('is_active', true)
    .eq('is_published', true)
  if (hydrateError) {
    if (isAbortError(hydrateError)) return []
    console.error('[pickupQueries] Error hydrating nearby tours:', hydrateError)
    throw hydrateError
  }

  const byId = new Map((tours ?? []).map((t: any) => [String(t.id), t]))

  // 3. Emit in pickup order, dropping any id that didn't hydrate.
  return orderedIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((t: any) => mapTourRowToSearchListing(t, distById.get(String(t.id)) ?? null))
}

/**
 * Hook: tours ranked by nearest pickup, hydrated as SearchListing[]. The
 * canonical "tours near me" query — see the block comment above.
 */
export function useNearbyTours(
  params: { userLat: number; userLng: number; radiusKm?: number; limit?: number },
  options?: Omit<UseQueryOptions<SearchListing[], Error>, 'queryKey' | 'queryFn'>,
) {
  const radiusKm = params.radiusKm ?? 500
  const limit = params.limit ?? 96

  return useQuery({
    queryKey: pickupKeys.nearbyTours({
      userLat: params.userLat,
      userLng: params.userLng,
      radiusKm,
      limit,
    }),
    queryFn: () => fetchNearbyTours({ ...params, radiusKm, limit }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}
