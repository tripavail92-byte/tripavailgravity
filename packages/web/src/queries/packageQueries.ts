import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import type { UnifiedExperience } from '@/types/experience'

type Package = Database['public']['Tables']['packages']['Row']
type Hotel = Database['public']['Tables']['hotels']['Row']

/**
 * Query Keys - Following TanStack Query best practices
 * Hierarchical structure for precise cache invalidation
 *
 * ✅ Enterprise: Keys serialize primitives to avoid object identity trap
 */
export const packageKeys = {
  all: ['packages'] as const,
  lists: () => [...packageKeys.all, 'list'] as const,
  list: (filters?: {
    city?: string
    dates?: string
    guests?: number
    sort?: string
    page?: number
  }) =>
    [
      ...packageKeys.lists(),
      filters?.city ?? '',
      filters?.dates ?? '',
      filters?.guests ?? 0,
      filters?.sort ?? '',
      filters?.page ?? 1,
    ] as const,
  details: () => [...packageKeys.all, 'detail'] as const,
  detail: (id: string) => [...packageKeys.details(), id] as const,
  featured: () => [...packageKeys.all, 'featured'] as const,
  curated: () => [...packageKeys.all, 'curated'] as const,
  curatedList: (kind: CuratedPackageKind) => [...packageKeys.curated(), kind] as const,
  homepageMerge: (take: number) => [...packageKeys.all, 'homepage_merge', take] as const,
  homepageMix: (take: number) => [...packageKeys.all, 'homepage_mix', take] as const,
}

export type CuratedPackageKind =
  | 'new_arrivals'
  | 'top_rated'
  | 'best_for_couples'
  | 'family_friendly'
  | 'weekend_getaways'

/**
 * Mapped Package type for UI consumption
 */
export interface MappedPackage {
  id: string
  slug: string | null
  title: string
  hotelName: string
  location: string
  packagePrice: number | 'Contact'
  rating: number
  reviewCount?: number
  images: string[]
  badge: string

  // For premium price display (optional)
  durationDays?: number
  totalOriginal?: number
  totalDiscounted?: number
}

export type HomepageMixPackage = MappedPackage & { created_at: string }

type DiscountOffer = {
  name?: string
  originalPrice?: number
  original_price?: number
  discount?: number
  discount_percent?: number
}

function safeNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(num) ? num : null
}

function extractDiscountOffers(raw: unknown): DiscountOffer[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as DiscountOffer[]
  return []
}

function computePriceTotals(basePrice: number | null, discountOffersRaw: unknown) {
  const discountOffers = extractDiscountOffers(discountOffersRaw)
  const base = basePrice ?? 0

  const addonOriginal = discountOffers.reduce((acc, offer) => {
    const original = safeNumber(offer.originalPrice ?? offer.original_price) ?? 0
    return acc + original
  }, 0)

  const addonDiscounted = discountOffers.reduce((acc, offer) => {
    const original = safeNumber(offer.originalPrice ?? offer.original_price) ?? 0
    const discountPercent = safeNumber(offer.discount ?? offer.discount_percent) ?? 0
    const discounted = original * (1 - discountPercent / 100)
    return acc + discounted
  }, 0)

  const totalOriginal = base + addonOriginal
  const totalDiscounted = base + addonDiscounted

  if (totalOriginal <= 0 || totalDiscounted <= 0) {
    return { totalOriginal: null, totalDiscounted: null }
  }

  if (totalDiscounted >= totalOriginal) {
    return { totalOriginal: null, totalDiscounted: null }
  }

  return { totalOriginal, totalDiscounted }
}

function inferDurationDays(minimumNights: unknown): number | undefined {
  const nights = safeNumber(minimumNights)
  if (!nights || nights <= 0) return undefined
  // Simple traveler-friendly display: nights + 1 ≈ days
  return Math.max(1, Math.round(nights) + 1)
}

function mapPackageRowToMappedPackage(pkg: any, badge: string): MappedPackage {
  const hotel = pkg?.hotels
  const location =
    hotel && (hotel.city || hotel.country)
      ? `${hotel.city || ''}, ${hotel.country || ''}`.replace(/^, /, '').replace(/, $/, '')
      : ''

  const images =
    pkg.media_urls && Array.isArray(pkg.media_urls) && pkg.media_urls.length > 0
      ? pkg.media_urls
      : pkg.cover_image
        ? [pkg.cover_image]
        : [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1080',
          ]

  const basePrice = safeNumber(pkg.base_price_per_night)

  const derivedPriceFromRoomsConfig = (() => {
    if (!pkg.rooms_config || typeof pkg.rooms_config !== 'object') return null
    const prices = Object.values(pkg.rooms_config as Record<string, any>)
      .map((r: any) => safeNumber(r?.price) ?? 0)
      .filter((p) => p > 0)
    return prices.length ? Math.min(...prices) : null
  })()

  const price = basePrice ?? derivedPriceFromRoomsConfig

  const { totalOriginal, totalDiscounted } = computePriceTotals(price, pkg.discount_offers)
  const durationDays = inferDurationDays(pkg.minimum_nights)

  const hotelRating = safeNumber(hotel?.rating)
  const rating = safeNumber(pkg.rating) ?? hotelRating ?? 0
  const reviewCount = safeNumber(pkg.review_count) ?? safeNumber(hotel?.review_count) ?? undefined

  return {
    id: pkg.id,
    slug: pkg.slug,
    title: pkg.name || 'Unnamed Package',
    hotelName: hotel?.name || 'Partner Hotel',
    location,
    packagePrice: price ?? 'Contact',
    rating: rating || 0,
    reviewCount,
    images,
    badge,
    durationDays,
    totalOriginal: totalOriginal ?? undefined,
    totalDiscounted: totalDiscounted ?? undefined,
  }
}

function mapPackageRowToUnifiedExperience(pkg: any): UnifiedExperience {
  const hotel = pkg?.hotels

  const images =
    pkg.media_urls && Array.isArray(pkg.media_urls) && pkg.media_urls.length > 0
      ? pkg.media_urls
      : pkg.cover_image
        ? [pkg.cover_image]
        : [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1080',
          ]

  const basePrice = safeNumber(pkg.base_price_per_night)

  const derivedPriceFromRoomsConfig = (() => {
    if (!pkg.rooms_config || typeof pkg.rooms_config !== 'object') return null
    const prices = Object.values(pkg.rooms_config as Record<string, any>)
      .map((r: any) => safeNumber(r?.price) ?? 0)
      .filter((p) => p > 0)
    return prices.length ? Math.min(...prices) : null
  })()

  const price = basePrice ?? derivedPriceFromRoomsConfig
  const { totalOriginal, totalDiscounted } = computePriceTotals(price, pkg.discount_offers)

  const rating = safeNumber(hotel?.rating)
  const reviewCount = safeNumber(hotel?.review_count)

  return {
    id: pkg.id,
    title: pkg.name || 'Unnamed Package',
    price: typeof totalDiscounted === 'number' ? totalDiscounted : price,
    originalPrice: typeof totalOriginal === 'number' ? totalOriginal : undefined,
    images,
    rating,
    reviewCount,
    created_at: pkg.created_at ?? pkg.updated_at ?? '1970-01-01T00:00:00.000Z',
    type: 'hotel',
  }
}

async function fetchHomepageMergePackages(take: number): Promise<UnifiedExperience[]> {
  const { data, error } = await supabase
    .from('packages')
    .select(
      `
      id,
      name,
      cover_image,
      media_urls,
      rooms_config,
      base_price_per_night,
      discount_offers,
      created_at,
      updated_at,
      hotels (
        rating,
        review_count
      )
    `,
    )
    .eq('is_published', true)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(take)

  if (error) {
    console.error('[packageQueries] Error fetching homepage merge packages:', error)
    throw error
  }

  return ((data || []) as any[]).map(mapPackageRowToUnifiedExperience)
}

export function useHomepageMergePackages(
  take: number,
  options?: Omit<UseQueryOptions<UnifiedExperience[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: packageKeys.homepageMerge(take),
    queryFn: () => fetchHomepageMergePackages(take),
    staleTime: 6 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

async function fetchHomepageMixPackages(take: number): Promise<HomepageMixPackage[]> {
  const { data, error } = await supabase
    .from('packages')
    .select(
      `
      id,
      slug,
      name,
      cover_image,
      media_urls,
      rooms_config,
      minimum_nights,
      base_price_per_night,
      discount_offers,
      created_at,
      updated_at,
      hotels (
        name,
        city,
        country,
        rating,
        review_count
      )
    `,
    )
    .eq('is_published', true)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(take)

  if (error) {
    console.error('[packageQueries] Error fetching homepage mix packages:', error)
    throw error
  }

  const rows = (data || []) as any[]
  return rows.map((pkg) => {
    const mapped = mapPackageRowToMappedPackage(pkg, 'Hotel Stay')
    return {
      ...mapped,
      created_at: pkg.created_at ?? pkg.updated_at ?? '1970-01-01T00:00:00.000Z',
    }
  })
}

export function useHomepageMixPackages(
  take: number,
  options?: Omit<UseQueryOptions<HomepageMixPackage[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: packageKeys.homepageMix(take),
    queryFn: () => fetchHomepageMixPackages(take),
    staleTime: 6 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

async function fetchCuratedPackages(
  kind: CuratedPackageKind,
  take: number = 8,
): Promise<MappedPackage[]> {
  let query = supabase
    .from('packages')
    .select(
      `
      id,
      slug,
      name,
      cover_image,
      media_urls,
      rooms_config,
      package_type,
      minimum_nights,
      base_price_per_night,
      discount_offers,
      hotels (
        name,
        city,
        country,
        rating,
        review_count
      )
    `,
    )
    .eq('is_published', true)
    .eq('status', 'live')

  // Filters
  if (kind === 'best_for_couples') {
    query = query.eq('package_type', 'romantic')
  }
  if (kind === 'family_friendly') {
    query = query.eq('package_type', 'family')
  }
  if (kind === 'weekend_getaways') {
    // Weekend: short stay OR explicitly typed
    query = query.or('package_type.eq.weekend,minimum_nights.lte.2')
  }

  // Ordering
  // Note: We can’t reliably order by joined hotel rating at DB-level; we sort client-side for top rated.
  const dbLimit = Math.max(24, take)
  query = query.order('created_at', { ascending: false }).limit(dbLimit)

  const { data, error } = await query

  if (error) {
    console.error('[packageQueries] Error fetching curated packages:', { kind, error })
    throw error
  }

  const rows = (data || []) as any[]

  const badgeByKind: Record<CuratedPackageKind, string> = {
    new_arrivals: 'New Arrival',
    top_rated: 'Top Rated',
    best_for_couples: 'Best for Couples',
    family_friendly: 'Family Friendly',
    weekend_getaways: 'Weekend Getaway',
  }

  const mapped = rows.map((pkg) => mapPackageRowToMappedPackage(pkg, badgeByKind[kind]))

  if (kind === 'top_rated') {
    return mapped
      .slice()
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, take)
  }

  if (kind === 'new_arrivals') return mapped.slice(0, take)
  return mapped.slice(0, take)
}

export function useCuratedPackages(
  kind: CuratedPackageKind,
  options?: Omit<UseQueryOptions<MappedPackage[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: packageKeys.curatedList(kind),
    queryFn: () => fetchCuratedPackages(kind, 8),
    staleTime: 6 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useCuratedPackagesFull(
  kind: CuratedPackageKind,
  options?: Omit<UseQueryOptions<MappedPackage[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: [...packageKeys.curatedList(kind), 'full'] as const,
    queryFn: () => fetchCuratedPackages(kind, 48),
    staleTime: 6 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

/**
 * Fetch featured packages with proper typing
 */
async function fetchFeaturedPackages(): Promise<MappedPackage[]> {
  const { data, error } = await supabase
    .from('packages')
    .select(
      `
      id,
      slug,
      name,
      cover_image,
      media_urls,
      rooms_config,
      package_type,
      minimum_nights,
      base_price_per_night,
      discount_offers,
      hotels (
        name,
        city,
        country,
        rating,
        review_count
      )
    `,
    )
    .eq('is_published', true)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[packageQueries] Error fetching featured packages:', error)
    throw error
  }

  if (!data) return []

  return (data as any[]).map((pkg) => mapPackageRowToMappedPackage(pkg, 'Featured'))
}

/**
 * Hook: Use Featured Packages Query
 * Enterprise pattern with proper caching and refetch configuration
 * StaleTime: 8 minutes - featured packages don't change frequently
 */
export function useFeaturedPackages(
  options?: Omit<UseQueryOptions<MappedPackage[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: packageKeys.featured(),
    queryFn: fetchFeaturedPackages,
    staleTime: 8 * 60 * 1000, // 8 minutes - featured content is stable
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnMount: true, // Always refetch on component mount for fresh data
    refetchOnWindowFocus: false, // Don't refetch on tab focus (reduce API calls)
    ...options,
  })
}

/**
 * Fetch package by ID with proper typing
 */
async function fetchPackageById(id: string): Promise<Package> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const queryColumn = isUUID ? 'id' : 'slug'

  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq(queryColumn, id)
    .eq('is_published', true)
    .single()

  if (error) {
    console.error(`[packageQueries] Error fetching package ${id}:`, error)
    throw error
  }

  return data
}

/**
 * Hook: Use Package Query
 * For package details pages with 2-5 minute stale time
 */
export function usePackage(
  id: string,
  options?: Omit<UseQueryOptions<Package, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: packageKeys.detail(id),
    queryFn: () => fetchPackageById(id),
    staleTime: 3 * 60 * 1000, // 3 minutes for details
    gcTime: 10 * 60 * 1000,
    enabled: !!id, // Only run if ID exists
    ...options,
  })
}

/**
 * Prefetch Package - Enterprise UX Pattern
 * ✅ Production-safe: Throttled, mobile-aware, cache-aware
 *
 * Call this on hover to preload data before navigation
 *
 * Usage:
 * <Link
 *   onMouseEnter={() => prefetchPackage(queryClient, id)}
 *   onTouchStart={() => prefetchPackage(queryClient, id)}
 * >
 */
const prefetchThrottleMap = new Map<string, number>()
const PREFETCH_THROTTLE_MS = 200 // Don't prefetch same item more than once per 200ms

export function prefetchPackage(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  // ✅ Skip if already cached and fresh
  const cached = queryClient.getQueryData(packageKeys.detail(id))
  const state = queryClient.getQueryState(packageKeys.detail(id))
  if (cached && state?.dataUpdatedAt && Date.now() - state.dataUpdatedAt < 3 * 60 * 1000) {
    // Data is fresh, no need to prefetch
    return Promise.resolve()
  }

  // ✅ Throttle: Don't spam prefetch on rapid hover events
  const lastPrefetch = prefetchThrottleMap.get(id) || 0
  if (Date.now() - lastPrefetch < PREFETCH_THROTTLE_MS) {
    return Promise.resolve()
  }
  prefetchThrottleMap.set(id, Date.now())

  // ✅ Mobile-safe: Respect reduced motion / save-data preferences
  if (typeof navigator !== 'undefined') {
    // @ts-ignore - experimental API
    if (navigator.connection?.saveData) {
      return Promise.resolve() // Don't prefetch on save-data mode
    }
  }

  return queryClient.prefetchQuery({
    queryKey: packageKeys.detail(id),
    queryFn: () => fetchPackageById(id),
    staleTime: 3 * 60 * 1000,
  })
}

/**
 * Hook: Create/Update Package Mutation
 * ✅ Enterprise: Surgical cache invalidation (no blanket nukes)
 */
export function usePackageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (packageData: Partial<Package> & { id?: string }) => {
      // Implementation would go here
      throw new Error('Not implemented')
    },
    onSuccess: (data, variables) => {
      // ✅ SURGICAL: Only invalidate what this mutation affects

      // 1. If updating specific package, update its cache directly
      if (variables.id) {
        queryClient.setQueryData(packageKeys.detail(variables.id), data)
      }

      // 2. Only invalidate featured if this package is featured
      // @ts-ignore - data shape depends on implementation
      if (data?.is_featured) {
        queryClient.invalidateQueries({ queryKey: packageKeys.featured() })
      }

      // 3. Invalidate search results (if package appears in searches)
      // Only invalidate lists, not all packages
      queryClient.invalidateQueries({ queryKey: packageKeys.lists() })

      // ❌ NEVER: queryClient.invalidateQueries({ queryKey: packageKeys.all })
      // That would nuke: traveler feed, search, collections, admin lists, drafts, etc.
    },
    onError: (error) => {
      console.error('[packageMutation] Failed:', error)
    },
  })
}
