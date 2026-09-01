import { useInfiniteQuery, useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

export type SearchSort = 'relevance' | 'nearest' | 'price_asc' | 'price_desc' | 'rating' | 'newest'
export type SearchListingType = 'tour' | 'package'
/** Trip-length buckets. The keys are the contract with the facets RPC, which returns
 *  counts under exactly these labels. */
export type SearchDurationBucket = '1' | '2-3' | '4-7' | '8+'

/** Bucket → the (inclusive) day range the RPC filters on. */
const DURATION_RANGE: Record<SearchDurationBucket, [number, number | null]> = {
  '1': [1, 1],
  '2-3': [2, 3],
  '4-7': [4, 7],
  '8+': [8, null],
}

export const DURATION_BUCKETS = Object.keys(DURATION_RANGE) as SearchDurationBucket[]

export function isDurationBucket(v: string): v is SearchDurationBucket {
  return v in DURATION_RANGE
}

export interface UnifiedSearchParams {
  query?: string | null
  types?: SearchListingType[]
  lat?: number | null
  lng?: number | null
  radiusKm?: number | null
  minPrice?: number | null
  maxPrice?: number | null
  minRating?: number | null
  country?: string | null
  category?: string | null
  /** Trip length, as a bucket key. */
  duration?: SearchDurationBucket | null
  /** Difficulty levels to include (matched case-insensitively). */
  difficulty?: string[] | null
  /** ISO dates (YYYY-MM-DD). Keeps only trips with a bookable departure in the window. */
  departureFrom?: string | null
  departureTo?: string | null
  sort?: SearchSort
}

export interface SearchListing {
  listingId: string
  listingType: SearchListingType
  slug: string | null
  title: string
  subtitle: string | null
  locationLabel: string | null
  country: string | null
  price: number | null
  currency: string
  rating: number | null
  reviewCount: number | null
  images: string[]
  durationDays: number | null
  difficultyLevel: string | null
  badge: string | null
  isFeatured: boolean
  distanceKm: number | null
  relevance: number
}

export interface SearchFacets {
  total: number
  types: Record<string, number>
  countries: { country: string; count: number }[]
  durations: { bucket: SearchDurationBucket; count: number }[]
  difficulties: { level: string; count: number }[]
  priceMin: number | null
  priceMax: number | null
}

const PAGE_SIZE = 24

/** The RPCs are new; the generated Database types don't know them yet, so we call
 *  through a loosely-typed handle and normalise the rows/JSON ourselves. */
const rpc = (name: string, args: Record<string, unknown>) =>
  (supabase.rpc as unknown as (n: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)(
    name,
    args,
  )

const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null)

/** Shared filter args (everything except type/sort/pagination). */
function filterArgs(p: UnifiedSearchParams) {
  const bucket = p.duration && isDurationBucket(p.duration) ? DURATION_RANGE[p.duration] : null
  return {
    p_query: clean(p.query),
    p_lat: p.lat ?? null,
    p_lng: p.lng ?? null,
    p_radius_km: p.radiusKm ?? null,
    p_min_price: p.minPrice ?? null,
    p_max_price: p.maxPrice ?? null,
    p_min_rating: p.minRating ?? null,
    p_country: clean(p.country),
    p_category: clean(p.category),
    p_min_duration: bucket ? bucket[0] : null,
    p_max_duration: bucket ? bucket[1] : null,
    p_difficulty: p.difficulty && p.difficulty.length ? p.difficulty : null,
    p_departure_from: clean(p.departureFrom),
    p_departure_to: clean(p.departureTo),
  }
}

function mapRow(r: any): SearchListing & { totalCount: number } {
  return {
    listingId: r.listing_id,
    listingType: r.listing_type,
    slug: r.slug ?? null,
    title: r.title ?? 'Untitled',
    subtitle: r.subtitle ?? null,
    locationLabel: r.location_label ?? null,
    country: r.country ?? null,
    price: r.price != null ? Number(r.price) : null,
    currency: r.currency || 'PKR',
    rating: r.rating != null ? Number(r.rating) : null,
    reviewCount: r.review_count != null ? Number(r.review_count) : null,
    images: Array.isArray(r.images) ? r.images.filter((x: unknown) => typeof x === 'string') : [],
    durationDays: r.duration_days != null ? Number(r.duration_days) : null,
    difficultyLevel: r.difficulty_level ?? null,
    badge: r.badge ?? null,
    isFeatured: Boolean(r.is_featured),
    distanceKm: r.distance_km != null ? Number(r.distance_km) : null,
    relevance: Number(r.relevance) || 0,
    totalCount: Number(r.total_count) || 0,
  }
}

function defaultSort(p: UnifiedSearchParams): SearchSort {
  if (p.sort) return p.sort
  if (clean(p.query)) return 'relevance'
  if (p.lat != null && p.lng != null) return 'nearest'
  return 'newest'
}

export const searchKeys = {
  all: ['unified-search'] as const,
  results: (p: UnifiedSearchParams) => [...searchKeys.all, 'results', p] as const,
  facets: (p: Omit<UnifiedSearchParams, 'sort'>) => [...searchKeys.all, 'facets', p] as const,
}

/** Paginated unified search across tours + packages (FTS + geo ranked). */
export function useUnifiedSearch(p: UnifiedSearchParams, options?: { enabled?: boolean }) {
  const types = p.types && p.types.length ? p.types : (['tour', 'package'] as SearchListingType[])
  const sort = defaultSort(p)

  return useInfiniteQuery({
    queryKey: searchKeys.results({ ...p, types, sort }),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await rpc('search_listings_unified', {
        ...filterArgs(p),
        p_types: types,
        p_sort: sort,
        p_limit: PAGE_SIZE,
        p_offset: pageParam as number,
      })
      if (error) throw error as Error
      const rows = (Array.isArray(data) ? data : []).map(mapRow)
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

/** Facet counts (types, countries, price range) for the current filter set. */
export function useSearchFacets(
  p: Omit<UnifiedSearchParams, 'sort'>,
  options?: Omit<UseQueryOptions<SearchFacets, Error>, 'queryKey' | 'queryFn'>,
) {
  // Facets MUST use the same type scope as the results. The RPC unions tours + hotel packages, so
  // without this the sidebar counted packages the page wasn't showing (trips-first made that
  // obvious: 16 tours but a "Pakistan (23) / Unknown Country (6)" country facet).
  const types = p.types && p.types.length ? p.types : (['tour', 'package'] as SearchListingType[])
  return useQuery({
    queryKey: searchKeys.facets({ ...p, types }),
    queryFn: async (): Promise<SearchFacets> => {
      const { data, error } = await rpc('search_listings_facets', {
        ...filterArgs(p),
        p_types: types,
      })
      if (error) throw error as Error
      const f = (data ?? {}) as any
      return {
        total: Number(f.total) || 0,
        types: (f.types && typeof f.types === 'object' ? f.types : {}) as Record<string, number>,
        countries: Array.isArray(f.countries)
          ? f.countries.map((c: any) => ({ country: String(c.country), count: Number(c.count) || 0 }))
          : [],
        durations: Array.isArray(f.durations)
          ? f.durations
              .filter((d: any) => isDurationBucket(String(d.bucket)))
              .map((d: any) => ({
                bucket: String(d.bucket) as SearchDurationBucket,
                count: Number(d.count) || 0,
              }))
          : [],
        difficulties: Array.isArray(f.difficulties)
          ? f.difficulties.map((d: any) => ({
              level: String(d.level),
              count: Number(d.count) || 0,
            }))
          : [],
        priceMin: f.price_min != null ? Number(f.price_min) : null,
        priceMax: f.price_max != null ? Number(f.price_max) : null,
      }
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  })
}
