import { useInfiniteQuery, useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { isAbortError } from '@/lib/withTimeout'
import type { SearchSort, UnifiedSearchParams } from '@/queries/searchQueries'

/**
 * A hotel as a browsable PROPERTY — one card per hotel, priced by its cheapest
 * published stay, linking to the /hotel/:id property profile. This is the
 * property-centric replacement for the old package-per-card hotel browse.
 */
export interface HotelBrowseItem {
  id: string
  name: string
  location: string
  starRating: number | null
  rating: number | null
  reviewCount: number | null
  images: string[]
  priceFrom: number | null
  currency: string
  stayCount: number
  // Set by search results when a geo origin is available; null for /hotels browse.
  distanceKm?: number | null
}

export const hotelKeys = {
  all: ['hotels'] as const,
  browse: () => [...hotelKeys.all, 'browse'] as const,
  search: (p: UnifiedSearchParams) => [...hotelKeys.all, 'search', p] as const,
}

function mapHotelRow(h: any): HotelBrowseItem | null {
  // packages RLS already restricts anon to is_published=true and `!inner` requires
  // at least one visible row; here we additionally drop anything not currently
  // live (moderated 'draft'/'hidden'/'removed') and non-positive prices, then
  // derive the "from" price from the cheapest survivor. status is filtered here
  // rather than via `.eq('packages.status', 'live')` on the DB query because
  // PostgREST's enum casting through an EMBEDDED filter silently drops all rows.
  const stays = Array.isArray(h.packages) ? h.packages : []
  const priced: Array<{ price: number; currency: string }> = stays
    .filter((p: any) => p?.is_published === true && p?.status === 'live')
    .map((p: any) => ({
      price: Number(p.base_price_per_night),
      currency: String(p.currency || 'PKR').trim() || 'PKR',
    }))
    .filter((p: { price: number }) => Number.isFinite(p.price) && p.price > 0)

  if (priced.length === 0) return null

  const cheapest = priced.reduce((a, b) => (b.price < a.price ? b : a))

  const images = [
    ...(h.main_image_url ? [h.main_image_url] : []),
    ...(Array.isArray(h.images) ? h.images : []),
  ].filter((u) => typeof u === 'string' && u.trim() !== '')

  const location = [h.city, h.country].filter(Boolean).join(', ') || h.location || ''

  return {
    id: h.id,
    name: h.name || 'Property',
    location,
    starRating: typeof h.star_rating === 'number' ? h.star_rating : null,
    rating: typeof h.rating === 'number' && h.rating > 0 ? h.rating : null,
    reviewCount: typeof h.review_count === 'number' ? h.review_count : null,
    images,
    priceFrom: cheapest.price,
    currency: cheapest.currency,
    stayCount: priced.length,
  }
}

/**
 * Every published hotel that has at least one published, live stay — i.e. every
 * property a traveller can actually book. `packages!inner` drops properties with
 * nothing to sell, so the grid never links to a dead property page.
 */
async function fetchHotelBrowse(): Promise<HotelBrowseItem[]> {
  const { data, error } = await supabase
    .from('hotels')
    .select(
      `
      id,
      name,
      city,
      country,
      location,
      star_rating,
      rating,
      review_count,
      main_image_url,
      images,
      packages!inner (
        base_price_per_night,
        currency,
        is_published,
        status
      )
    `,
    )
    .eq('is_published', true)
    // NO embedded-relation .eq() here — the status enum in particular casts
    // unreliably through PostgREST's embedded filter and can silently return 0
    // rows. `!inner` combined with packages' own RLS (is_published=true) already
    // means "hotel has at least one visible published package"; the remaining
    // status='live' + price>0 filters are applied in mapHotelRow.
    .order('created_at', { ascending: false })
    .limit(60)

  if (error) {
    if (isAbortError(error)) return []
    console.error('[hotelQueries] Error fetching hotel browse:', error)
    throw error
  }

  return ((data || []) as any[])
    .map(mapHotelRow)
    .filter((h): h is HotelBrowseItem => h !== null)
}

/**
 * Hook: property-centric hotel browse for /hotels.
 */
export function useHotelBrowse(
  options?: Omit<UseQueryOptions<HotelBrowseItem[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: hotelKeys.browse(),
    queryFn: fetchHotelBrowse,
    staleTime: 6 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

/**
 * Paginated property-centric search (Phase 3C). Uses the SECURITY DEFINER
 * `search_hotels_unified` RPC, which returns ONE row per hotel with its
 * cheapest matching stay's price + a `stay_count`. Same shape as
 * `useHotelBrowse` output (`HotelBrowseItem`), plus `distanceKm` when the
 * caller passes a lat/lng — so `HotelPropertyCard` renders both without
 * caring where the row came from.
 */

const PAGE_SIZE = 24

const rpc = (name: string, args: Record<string, unknown>) =>
  (
    supabase.rpc as unknown as (
      n: string,
      a: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>
  )(name, args)

const cleanStr = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null)

function defaultSort(p: UnifiedSearchParams): SearchSort {
  if (p.sort) return p.sort
  if (cleanStr(p.query)) return 'relevance'
  if (p.lat != null && p.lng != null) return 'nearest'
  return 'newest'
}

function mapSearchRow(r: any): HotelBrowseItem & { totalCount: number } {
  const images = Array.isArray(r.images)
    ? r.images.filter((x: unknown): x is string => typeof x === 'string')
    : []
  const location =
    typeof r.location_label === 'string' && r.location_label
      ? r.location_label
      : typeof r.country === 'string' && r.country
        ? r.country
        : ''
  return {
    id: r.hotel_id,
    name: r.name ?? 'Property',
    location,
    starRating: r.star_rating != null ? Number(r.star_rating) : null,
    rating: r.rating != null && Number(r.rating) > 0 ? Number(r.rating) : null,
    reviewCount: r.review_count != null ? Number(r.review_count) : null,
    images,
    priceFrom: r.from_price != null ? Number(r.from_price) : null,
    currency: r.from_currency || 'PKR',
    stayCount: r.stay_count != null ? Number(r.stay_count) : 0,
    distanceKm: r.distance_km != null ? Number(r.distance_km) : null,
    totalCount: Number(r.total_count) || 0,
  }
}

export function useHotelSearch(p: UnifiedSearchParams, options?: { enabled?: boolean }) {
  const sort = defaultSort(p)
  return useInfiniteQuery({
    queryKey: hotelKeys.search({ ...p, sort }),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await rpc('search_hotels_unified', {
        p_query: cleanStr(p.query),
        p_lat: p.lat ?? null,
        p_lng: p.lng ?? null,
        p_radius_km: p.radiusKm ?? null,
        p_min_price: p.minPrice ?? null,
        p_max_price: p.maxPrice ?? null,
        p_min_rating: p.minRating ?? null,
        p_country: cleanStr(p.country),
        p_sort: sort,
        p_limit: PAGE_SIZE,
        p_offset: pageParam as number,
      })
      if (error) throw error as Error
      const rows = (Array.isArray(data) ? data : []).map(mapSearchRow)
      const total = rows[0]?.totalCount ?? 0
      return { rows, total, offset: pageParam as number }
    },
    getNextPageParam: (last) => {
      const loaded = last.offset + last.rows.length
      return loaded < last.total ? loaded : undefined
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}
