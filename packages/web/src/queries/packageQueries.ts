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
 * Call this on hover to preload data before navigation
 * 
 * Usage:
 * <Link onMouseEnter={() => prefetchPackage(queryClient, id)}>
 */
export function prefetchPackage(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return queryClient.prefetchQuery({
    queryKey: packageKeys.detail(id),
    queryFn: () => fetchPackageById(id),
    staleTime: 3 * 60 * 1000,
  })
}

/**
 * Hook: Create/Update Package Mutation
 * Includes automatic cache invalidation
 */
export function usePackageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (packageData: Partial<Package>) => {
      // Implementation would go here
      // For now, placeholder
      throw new Error('Not implemented')
    },
    onSuccess: () => {
      // ✅ Enterprise: Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: packageKeys.all })
      queryClient.invalidateQueries({ queryKey: packageKeys.featured() })
    },
    onError: (error) => {
      console.error('[packageMutation] Failed:', error)
    },
  })
}
