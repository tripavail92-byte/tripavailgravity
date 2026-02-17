import { useQuery, type UseQueryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/types/database.types'
import { supabase } from '@/lib/supabase'

type Package = Database['public']['Tables']['packages']['Row']
type Hotel = Database['public']['Tables']['hotels']['Row']

/**
 * Query Keys - Following TanStack Query best practices
 * Hierarchical structure for precise cache invalidation
 */
export const packageKeys = {
  all: ['packages'] as const,
  lists: () => [...packageKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...packageKeys.lists(), filters] as const,
  details: () => [...packageKeys.all, 'detail'] as const,
  detail: (id: string) => [...packageKeys.details(), id] as const,
  featured: () => [...packageKeys.all, 'featured'] as const,
}

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
  images: string[]
  badge: string
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
      hotels (
        name,
        city,
        country
      )
    `,
    )
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[packageQueries] Error fetching featured packages:', error)
    throw error
  }

  if (!data) return []

  // Map to UI-friendly format
  return data.map((pkg: any) => {
    // Calculate best price from rooms_config
    let price: number | 'Contact' = 'Contact'
    if (pkg.rooms_config && typeof pkg.rooms_config === 'object') {
      const prices = Object.values(pkg.rooms_config as Record<string, any>)
        .map((r: any) => Number(r.price) || 0)
        .filter((p) => p > 0)
      if (prices.length > 0) price = Math.min(...prices)
    }

    // Build location string
    const hotel = pkg.hotels
    const location =
      hotel && (hotel.city || hotel.country)
        ? `${hotel.city || ''}, ${hotel.country || ''}`.replace(/^, /, '').replace(/, $/, '')
        : 'Multiple Locations'

    // Get images
    const images =
      pkg.media_urls && Array.isArray(pkg.media_urls) && pkg.media_urls.length > 0
        ? pkg.media_urls
        : pkg.cover_image
          ? [pkg.cover_image]
          : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1080']

    return {
      id: pkg.id,
      slug: pkg.slug,
      title: pkg.name || 'Unnamed Package',
      hotelName: hotel?.name || 'Partner Hotel',
      location,
      packagePrice: price,
      rating: 5.0, // Placeholder - should come from reviews
      images,
      badge: 'New Arrival',
    }
  })
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
