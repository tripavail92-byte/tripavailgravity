import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { isAbortError } from '@/lib/withTimeout'

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
}

export const hotelKeys = {
  all: ['hotels'] as const,
  browse: () => [...hotelKeys.all, 'browse'] as const,
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
