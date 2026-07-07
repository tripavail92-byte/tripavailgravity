import { supabase } from '@/lib/supabase'

export const FALLBACK_TOUR_IMAGE =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80'

export type TourCategory = 'adventure' | 'nature' | 'cultural'
export type TourCollection = 'pakistan-northern'
export type DurationBand = 'short' | 'medium' | 'long'

export interface DiscoveryTour {
  id: string
  slug: string | null
  title: string
  short_description: string | null
  price: number
  currency: string
  rating: number | null
  reviewCount: number
  images: string[]
  location: Record<string, string | null> | null
  destination_cities: string[]
  tour_type: string | null
  duration_days: number | null
  operator_id: string | null
}

interface SearchToursParams {
  query?: string
  minPrice?: number
  maxPrice?: number
  tourType?: TourCategory | null
  durationBand?: DurationBand | null
  limit?: number
}

function normalizeTour(row: any): DiscoveryTour {
  return {
    id: row.id,
    slug: row.slug ?? null,
    title: row.title ?? 'Unnamed Tour',
    short_description: row.short_description ?? null,
    price: Number(row.price ?? 0),
    currency: String(row.currency ?? 'PKR'),
    rating: row.rating == null ? null : Number(row.rating),
    reviewCount: Number(row.review_count) || 0,
    images: Array.isArray(row.images)
      ? row.images.filter((image: unknown): image is string => typeof image === 'string')
      : [],
    location:
      row.location && typeof row.location === 'object' && !Array.isArray(row.location)
        ? (row.location as Record<string, string | null>)
        : null,
    destination_cities: Array.isArray(row.destination_cities)
      ? row.destination_cities.filter((city: unknown): city is string => typeof city === 'string')
      : [],
    tour_type: typeof row.tour_type === 'string' ? row.tour_type : null,
    duration_days: row.duration_days == null ? null : Number(row.duration_days),
    operator_id: typeof row.operator_id === 'string' ? row.operator_id : null,
  }
}

function baseToursQuery() {
  return supabase
    .from('tours')
    .select(
      'id,slug,title,short_description,price,currency,rating,review_count,images,location,destination_cities,tour_type,duration_days,operator_id,is_featured,created_at',
    )
    .eq('is_active', true)
    .eq('is_published', true)
    .eq('status', 'live')
}

function buildSearchPattern(query: string) {
  return `%${query
    .replace(/[,%_]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join('%')}%`
}

export function formatTourLocation(tour: Pick<DiscoveryTour, 'location' | 'destination_cities'>) {
  if (tour.destination_cities.length > 1) {
    return tour.destination_cities.join(' · ')
  }

  if (tour.destination_cities.length === 1) {
    const country = tour.location?.country
    return [tour.destination_cities[0], country].filter(Boolean).join(', ')
  }

  return [tour.location?.city, tour.location?.country].filter(Boolean).join(', ')
}

export function getDurationLabel(durationDays: number | null) {
  if (!durationDays || durationDays < 1) return 'Flexible itinerary'
  return `${durationDays} day${durationDays === 1 ? '' : 's'}`
}

export function normalizeCategoryParam(value?: string | null): TourCategory | null {
  if (value === 'adventure' || value === 'adventure-trips') return 'adventure'
  if (value === 'nature' || value === 'hiking-trips') return 'nature'
  if (value === 'cultural') return 'cultural'
  return null
}

export function getCategoryCopy(category: TourCategory) {
  if (category === 'adventure') {
    return {
      title: 'Adventure Tours',
      subtitle: 'Bold, active itineraries from live operators across Pakistan.',
    }
  }

  if (category === 'nature') {
    return {
      title: 'Nature & Hiking',
      subtitle: 'Mountain air, scenic trails, and slower journeys into the outdoors.',
    }
  }

  return {
    title: 'Cultural Experiences',
    subtitle: 'Guided trips built around heritage, food, and local stories.',
  }
}

export function normalizeCollectionParam(value?: string | null): TourCollection | null {
  return value === 'pakistan-northern' ? value : null
}

export function getCollectionCopy(collection: TourCollection) {
  if (collection === 'pakistan-northern') {
    return {
      title: 'Northern Pakistan Tours',
      subtitle: 'Hunza, Skardu, Fairy Meadows, Naran, Swat, and nearby mountain routes.',
    }
  }

  return {
    title: 'Curated Collection',
    subtitle: 'Hand-picked routes from live TripAvail operators.',
  }
}

export async function searchTours({
  query,
  minPrice,
  maxPrice,
  tourType,
  durationBand,
  limit = 40,
}: SearchToursParams): Promise<DiscoveryTour[]> {
  let toursQuery = baseToursQuery()

  const trimmedQuery = query?.trim()
  if (trimmedQuery) {
    const pattern = buildSearchPattern(trimmedQuery)
    toursQuery = toursQuery.or(
      [`title.ilike.${pattern}`, `short_description.ilike.${pattern}`, `tour_type.ilike.${pattern}`].join(','),
    )
  }

  if (tourType) {
    toursQuery = toursQuery.eq('tour_type', tourType)
  }

  if (typeof minPrice === 'number') {
    toursQuery = toursQuery.gte('price', minPrice)
  }

  if (typeof maxPrice === 'number') {
    toursQuery = toursQuery.lte('price', maxPrice)
  }

  if (durationBand === 'short') {
    toursQuery = toursQuery.not('duration_days', 'is', null).lte('duration_days', 3)
  } else if (durationBand === 'medium') {
    toursQuery = toursQuery.gte('duration_days', 4).lte('duration_days', 7)
  } else if (durationBand === 'long') {
    toursQuery = toursQuery.gte('duration_days', 8)
  }

  const { data, error } = await toursQuery
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(normalizeTour)
}

export async function fetchToursByCategory(category: TourCategory, limit = 48): Promise<DiscoveryTour[]> {
  const { data, error } = await baseToursQuery()
    .eq('tour_type', category)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(normalizeTour)
}

export async function fetchToursByCollection(collection: TourCollection, limit = 48): Promise<DiscoveryTour[]> {
  let toursQuery = baseToursQuery()

  if (collection === 'pakistan-northern') {
    toursQuery = toursQuery.eq('location->>country', 'Pakistan')
  }

  const { data, error } = await toursQuery
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(normalizeTour)
}

export async function fetchToursByOperator(operatorId: string, limit = 24): Promise<DiscoveryTour[]> {
  const { data, error } = await baseToursQuery()
    .eq('operator_id', operatorId)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(normalizeTour)
}