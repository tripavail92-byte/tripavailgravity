import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { Database } from '@/types/database.types'
import { supabase } from '@/lib/supabase'

type Tour = Database['public']['Tables']['tours']['Row']

/**
 * Query Keys - Following TanStack Query best practices
 */
export const tourKeys = {
  all: ['tours'] as const,
  lists: () => [...tourKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...tourKeys.lists(), filters] as const,
  details: () => [...tourKeys.all, 'detail'] as const,
  detail: (id: string) => [...tourKeys.details(), id] as const,
  featured: () => [...tourKeys.all, 'featured'] as const,
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

/**
 * Fetch featured tours with proper typing
 */
async function fetchFeaturedTours(): Promise<MappedTour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('id,slug,title,location,price,currency,rating,tour_type,is_featured,images,created_at')
    .eq('is_active', true)
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

/**
 * Hook: Use Featured Tours Query
 * Enterprise pattern with proper caching
 */
export function useFeaturedTours(
  options?: Omit<UseQueryOptions<MappedTour[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: tourKeys.featured(),
    queryFn: fetchFeaturedTours,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
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
