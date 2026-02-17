import { useQuery, type UseQueryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/types/database.types'
import type { UnifiedExperience } from '@/types/experience'
import { supabase } from '@/lib/supabase'

type Tour = Database['public']['Tables']['tours']['Row']

/**
 * Query Keys - Following TanStack Query best practices
 * ✅ Enterprise: Keys serialize primitives to avoid object identity trap
 */
export const tourKeys = {
  all: ['tours'] as const,
  lists: () => [...tourKeys.all, 'list'] as const,
  list: (filters?: { location?: string; dates?: string; guests?: number; tourType?: string; page?: number }) => 
    [
      ...tourKeys.lists(), 
      filters?.location ?? '', 
      filters?.dates ?? '', 
      filters?.guests ?? 0, 
      filters?.tourType ?? '', 
      filters?.page ?? 1
    ] as const,
  details: () => [...tourKeys.all, 'detail'] as const,
  detail: (id: string) => [...tourKeys.details(), id] as const,
  featured: () => [...tourKeys.all, 'featured'] as const,
  curated: () => [...tourKeys.all, 'curated'] as const,
  category: (category: string) => [...tourKeys.curated(), 'category', category] as const,
  pakistanNorthern: () => [...tourKeys.curated(), 'pakistan_northern'] as const,
  homepageMerge: (take: number) => [...tourKeys.all, 'homepage_merge', take] as const,
}

export type TourCategoryKind = 'adventure-trips' | 'hiking-trips'

function tourTypeForCategory(category: TourCategoryKind): string {
  // NOTE: Current seed data uses tour_type: 'adventure' | 'nature' | 'cultural'
  // We map "Hiking Trips" to 'nature' to keep categories clean and non-mixed.
  if (category === 'adventure-trips') return 'adventure'
  return 'nature'
}

/**
 * Mapped Tour type for UI consumption
 */
export interface MappedTour {
  id: string
  slug: string | null
  title: string
  location: string
  tourPrice: number | 'Contact'
  rating: number
  images: string[]
  badge: string
}

function mapTourRowToUnifiedExperience(tour: any): UnifiedExperience {
  const images = Array.isArray(tour.images)
    ? tour.images
    : ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1080']

  const price = Number(tour.price)
  const rating = typeof tour.rating === 'number' ? tour.rating : tour.rating != null ? Number(tour.rating) : null

  return {
    id: tour.id,
    title: tour.title || 'Unnamed Tour',
    price: Number.isFinite(price) && price > 0 ? price : null,
    images,
    rating: Number.isFinite(rating as number) ? (rating as number) : null,
    reviewCount: null,
    created_at: tour.created_at,
    type: 'tour',
  }
}

async function fetchHomepageMergeTours(take: number): Promise<UnifiedExperience[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('id,title,price,rating,images,created_at')
    .eq('is_active', true)
    .eq('is_published', true)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(take)

  if (error) {
    console.error('[tourQueries] Error fetching homepage merge tours:', error)
    throw error
  }

  return ((data || []) as any[]).map(mapTourRowToUnifiedExperience)
}

export function useHomepageMergeTours(
  take: number,
  options?: Omit<UseQueryOptions<UnifiedExperience[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tourKeys.homepageMerge(take),
    queryFn: () => fetchHomepageMergeTours(take),
    staleTime: 6 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

/**
 * Fetch featured tours with proper typing
 */
async function fetchFeaturedTours(): Promise<MappedTour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('id,slug,title,location,price,currency,rating,tour_type,is_featured,images,created_at')
    .eq('is_active', true)
    .eq('is_published', true)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[tourQueries] Error fetching featured tours:', error)
    throw error
  }

  if (!data) return []

  // Map to UI-friendly format
  return data.map((tour: any) => {
    const locationObj = tour.location || {}
    const location = `${locationObj.city || ''}, ${locationObj.country || ''}`
      .replace(/^, /, '')
      .replace(/, $/, '')
      .trim()

    const images = Array.isArray(tour.images)
      ? tour.images
      : ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1080']

    return {
      id: tour.id,
      slug: tour.slug,
      title: tour.title || 'Unnamed Tour',
      location: location || 'Global',
      tourPrice: Number(tour.price) > 0 ? Number(tour.price) : 'Contact',
      rating: Number(tour.rating) || 0,
      images,
      badge: tour.is_featured ? 'Featured' : tour.tour_type || 'Tour',
    }
  })
}

async function fetchToursByCategory(category: TourCategoryKind, take: number = 12): Promise<MappedTour[]> {
  const tourType = tourTypeForCategory(category)

  const { data, error } = await supabase
    .from('tours')
    .select('id,slug,title,location,price,currency,rating,tour_type,is_featured,images,created_at')
    .eq('is_active', true)
    .eq('is_published', true)
    .eq('status', 'live')
    .eq('tour_type', tourType)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(take)

  if (error) {
    console.error('[tourQueries] Error fetching tours by category:', { category, error })
    throw error
  }

  if (!data) return []

  return data.map((tour: any) => {
    const locationObj = tour.location || {}
    const location = `${locationObj.city || ''}, ${locationObj.country || ''}`
      .replace(/^, /, '')
      .replace(/, $/, '')
      .trim()

    const images = Array.isArray(tour.images)
      ? tour.images
      : ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1080']

    return {
      id: tour.id,
      slug: tour.slug,
      title: tour.title || 'Unnamed Tour',
      location: location || 'Global',
      tourPrice: Number(tour.price) > 0 ? Number(tour.price) : 'Contact',
      rating: Number(tour.rating) || 0,
      images,
      badge: tour.is_featured ? 'Featured' : tour.tour_type || 'Tour',
    }
  })
}

async function fetchPakistanNorthernTours(take: number = 12): Promise<MappedTour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('id,slug,title,location,price,currency,rating,tour_type,is_featured,images,created_at')
    .eq('is_active', true)
    .eq('is_published', true)
    .eq('status', 'live')
    // PostgREST JSON path filter
    .eq('location->>country', 'Pakistan')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(take)

  if (error) {
    console.error('[tourQueries] Error fetching Pakistan northern tours:', error)
    throw error
  }

  if (!data) return []

  return data.map((tour: any) => {
    const locationObj = tour.location || {}
    const location = `${locationObj.city || ''}, ${locationObj.country || ''}`
      .replace(/^, /, '')
      .replace(/, $/, '')
      .trim()

    const images = Array.isArray(tour.images)
      ? tour.images
      : ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1080']

    return {
      id: tour.id,
      slug: tour.slug,
      title: tour.title || 'Unnamed Tour',
      location: location || 'Pakistan',
      tourPrice: Number(tour.price) > 0 ? Number(tour.price) : 'Contact',
      rating: Number(tour.rating) || 0,
      images,
      badge: tour.is_featured ? 'Featured' : tour.tour_type || 'Tour',
    }
  })
}

/**
 * Hook: Use Featured Tours Query
 * Enterprise pattern with proper caching
 * StaleTime: 8 minutes - featured tours are relatively stable
 */
export function useFeaturedTours(
  options?: Omit<UseQueryOptions<MappedTour[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tourKeys.featured(),
    queryFn: fetchFeaturedTours,
    staleTime: 8 * 60 * 1000, // 8 minutes
    gcTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useToursByCategory(
  category: TourCategoryKind,
  options?: Omit<UseQueryOptions<MappedTour[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tourKeys.category(category),
    queryFn: () => fetchToursByCategory(category, 12),
    staleTime: 8 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useToursByCategoryFull(
  category: TourCategoryKind,
  options?: Omit<UseQueryOptions<MappedTour[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: [...tourKeys.category(category), 'full'] as const,
    queryFn: () => fetchToursByCategory(category, 48),
    staleTime: 8 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function usePakistanNorthernTours(
  options?: Omit<UseQueryOptions<MappedTour[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tourKeys.pakistanNorthern(),
    queryFn: () => fetchPakistanNorthernTours(12),
    staleTime: 8 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function usePakistanNorthernToursFull(
  options?: Omit<UseQueryOptions<MappedTour[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: [...tourKeys.pakistanNorthern(), 'full'] as const,
    queryFn: () => fetchPakistanNorthernTours(48),
    staleTime: 8 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  })
}

/**
 * Fetch tour by ID with proper typing
 */
async function fetchTourById(id: string): Promise<Tour> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const queryColumn = isUUID ? 'id' : 'slug'

  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq(queryColumn, id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error(`[tourQueries] Error fetching tour ${id}:`, error)
    throw error
  }

  return data
}

/**
 * Hook: Use Tour Query
 * For tour details pages
 */
export function useTour(
  id: string,
  options?: Omit<UseQueryOptions<Tour, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tourKeys.detail(id),
    queryFn: () => fetchTourById(id),
    staleTime: 3 * 60 * 1000, // 3 minutes for details
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
    ...options,
  })
}

/**
 * Prefetch Tour - Enterprise UX Pattern
 * ✅ Production-safe: Throttled, mobile-aware, cache-aware
 * 
 * Usage:
 * <Link 
 *   onMouseEnter={() => prefetchTour(queryClient, id)}
 *   onTouchStart={() => prefetchTour(queryClient, id)}
 * >
 */
const prefetchThrottleMap = new Map<string, number>()
const PREFETCH_THROTTLE_MS = 200 // Don't prefetch same item more than once per 200ms

export function prefetchTour(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  // ✅ Skip if already cached and fresh
  const cached = queryClient.getQueryData(tourKeys.detail(id))
  const state = queryClient.getQueryState(tourKeys.detail(id))
  if (cached && state?.dataUpdatedAt && Date.now() - state.dataUpdatedAt < 3 * 60 * 1000) {
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
      return Promise.resolve()
    }
  }

  return queryClient.prefetchQuery({
    queryKey: tourKeys.detail(id),
    queryFn: () => fetchTourById(id),
    staleTime: 3 * 60 * 1000,
  })
}

/**
 * Hook: Create/Update Tour Mutation
 * ✅ Enterprise: Surgical cache invalidation
 */
export function useTourMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tourData: Partial<Tour> & { id?: string }) => {
      // Implementation would go here
      throw new Error('Not implemented')
    },
    onSuccess: (data, variables) => {
      // ✅ SURGICAL: Only invalidate what this mutation affects
      
      // 1. Update specific tour cache directly
      if (variables.id) {
        queryClient.setQueryData(tourKeys.detail(variables.id), data)
      }
      
      // 2. Only invalidate featured if this tour is featured
      // @ts-ignore - data shape depends on implementation
      if (data?.is_featured) {
        queryClient.invalidateQueries({ queryKey: tourKeys.featured() })
      }
      
      // 3. Invalidate search/lists only (not all tours)
      queryClient.invalidateQueries({ queryKey: tourKeys.lists() })
      
      // ❌ NEVER blanket invalidate: tourKeys.all
    },
    onError: (error) => {
      console.error('[tourMutation] Failed:', error)
    },
  })
}
