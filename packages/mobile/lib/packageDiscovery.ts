import { supabase } from '@/lib/supabase'

/**
 * Traveller-side package discovery — mirrors web packageQueries.ts.
 * Gate: is_published=true AND status='live'. Joins hotels for name/location/rating.
 * Price comes from base_price_per_night (the mobile authoring path always sets it).
 */

export interface DiscoveryPackage {
  id: string
  slug: string | null
  name: string
  hotelName: string
  location: string
  pricePerNight: number | null
  currency: string
  rating: number
  starRating: number | null
  propertyType: string | null
  image: string | null
  packageType: string | null
  minimumNights: number | null
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

function imagesOf(pkg: any): string[] {
  if (Array.isArray(pkg.media_urls) && pkg.media_urls.length) return pkg.media_urls
  if (pkg.cover_image) return [pkg.cover_image]
  return []
}

function locationOf(hotel: any): string {
  if (!hotel) return ''
  const city = hotel.city || ''
  const country = hotel.country || ''
  if (city && country) return `${city}, ${country}`
  return city || country || ''
}

const LIST_SELECT =
  'id, slug, name, currency, cover_image, media_urls, package_type, minimum_nights, base_price_per_night, hotels ( name, city, country, rating, star_rating, property_type )'

export async function fetchPackages(limit = 40): Promise<DiscoveryPackage[]> {
  const { data, error } = await supabase
    .from('packages')
    .select(LIST_SELECT)
    .eq('is_published', true)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return ((data ?? []) as any[]).map(mapRow)
}

export type CuratedKind =
  | 'new_arrivals'
  | 'top_rated'
  | 'best_for_couples'
  | 'family_friendly'
  | 'weekend_getaways'

export const CURATED_BADGE: Record<CuratedKind, string> = {
  new_arrivals: 'New Arrival',
  top_rated: 'Top Rated',
  best_for_couples: 'Best for Couples',
  family_friendly: 'Family Friendly',
  weekend_getaways: 'Weekend Getaway',
}

function mapRow(pkg: any): DiscoveryPackage {
  const hotel = pkg.hotels
  const imgs = imagesOf(pkg)
  return {
    id: pkg.id,
    slug: pkg.slug ?? null,
    name: pkg.name || 'Package',
    hotelName: hotel?.name || 'Partner hotel',
    location: locationOf(hotel),
    pricePerNight: num(pkg.base_price_per_night),
    currency: String(pkg.currency || 'PKR'),
    rating: num(hotel?.rating) ?? 0,
    starRating: num(hotel?.star_rating),
    propertyType: hotel?.property_type ?? null,
    image: imgs[0] ?? null,
    packageType: pkg.package_type ?? null,
    minimumNights: num(pkg.minimum_nights),
  }
}

/** Curated rails — same filters as web packageQueries.fetchCuratedPackages. */
export async function fetchCuratedPackages(kind: CuratedKind, take = 8): Promise<DiscoveryPackage[]> {
  let query = supabase
    .from('packages')
    .select(LIST_SELECT)
    .eq('is_published', true)
    .eq('status', 'live')

  if (kind === 'best_for_couples') query = query.eq('package_type', 'romantic')
  if (kind === 'family_friendly') query = query.eq('package_type', 'family')
  if (kind === 'weekend_getaways') query = query.or('package_type.eq.weekend,minimum_nights.lte.2')

  const { data, error } = await query.order('created_at', { ascending: false }).limit(Math.max(24, take))
  if (error) throw error

  const mapped = ((data ?? []) as any[]).map(mapRow)
  if (kind === 'top_rated') {
    return mapped.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, take)
  }
  return mapped.slice(0, take)
}

export interface PackageRoom {
  id: string
  name: string
  description: string | null
  roomType: string | null
  beds: Array<{ type: string; quantity: number }>
  capacityAdults: number | null
  capacityChildren: number | null
  sizeSqm: number | null
  amenities: string[]
}

export interface PackageHotel {
  id: string | null
  name: string
  city: string | null
  country: string | null
  area: string | null
  address: string | null
  rating: number | null
  starRating: number | null
  propertyType: string | null
  amenities: string[]
  services: string[]
  checkIn: string | null
  checkOut: string | null
  houseRules: string | null
  latitude: number | null
  longitude: number | null
}

export interface PackageDetail {
  id: string
  name: string
  description: string | null
  images: string[]
  currency: string
  pricePerNight: number | null
  packageType: string | null
  minimumNights: number | null
  maximumNights: number | null
  maxGuests: number | null
  inclusions: string[]
  exclusions: string[]
  highlights: string[]
  freeInclusions: Array<{ name: string }>
  discountOffers: Array<{ name: string; originalPrice: number; discount: number }>
  cancellationPolicy: string | null
  paymentTerms: string | null
  hotelId: string | null
  hotel: PackageHotel | null
  rooms: PackageRoom[]
  /** hotel.amenities + every room.amenities + highlights, de-duplicated. */
  aggregatedAmenities: string[]
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
}

/** Normalize hotels.services (jsonb: breakfast/parking/wifi enums + facilities map) → labelled strings. */
function servicesToList(services: any): string[] {
  if (!services || typeof services !== 'object') return []
  const out: string[] = []
  if (services.breakfast && services.breakfast !== 'none') out.push(`Breakfast (${services.breakfast})`)
  if (services.parking && services.parking !== 'none') out.push(`Parking (${services.parking})`)
  if (services.wifi && services.wifi !== 'none') out.push(`WiFi (${services.wifi})`)
  const facilities = services.facilities && typeof services.facilities === 'object' ? services.facilities : {}
  for (const [key, on] of Object.entries(facilities)) {
    if (on) out.push(String(key).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
  }
  const access = services.accessibility
  if (access?.wheelchairAccessible) out.push('Wheelchair accessible')
  if (access?.elevator) out.push('Elevator')
  return out
}

async function fetchPackageRooms(roomIds: string[]): Promise<PackageRoom[]> {
  if (!roomIds.length) return []
  const { data, error } = await supabase
    .from('rooms')
    .select('id,name,description,room_type,bed_config,capacity_adults,capacity_children,size_sqm,amenities')
    .in('id', roomIds)
  if (error) return []
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    name: r.name || 'Room',
    description: r.description ?? null,
    roomType: r.room_type ?? null,
    beds: Array.isArray(r.bed_config)
      ? r.bed_config.map((b: any) => ({ type: String(b?.type ?? ''), quantity: Number(b?.quantity) || 1 }))
      : [],
    capacityAdults: num(r.capacity_adults),
    capacityChildren: num(r.capacity_children),
    sizeSqm: num(r.size_sqm),
    amenities: strArray(r.amenities),
  }))
}

export async function fetchPackageDetail(idOrSlug: string): Promise<PackageDetail> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
  const { data, error } = await supabase
    .from('packages')
    .select(
      '*, hotels ( id, name, city, country, area, address, rating, star_rating, property_type, amenities, services, policies, latitude, longitude )',
    )
    .eq(isUUID ? 'id' : 'slug', idOrSlug)
    .eq('is_published', true)
    .single()
  if (error) throw error
  const p = data as any
  const h = p.hotels

  // Rooms referenced by the package's room_configuration (fallbacks for legacy shapes).
  const roomIds: string[] = (() => {
    const cfg = p.room_configuration ?? p.rooms_config ?? {}
    if (Array.isArray(cfg?.rooms)) return cfg.rooms.map((r: any) => r?.room_id).filter(Boolean)
    if (Array.isArray(p.room_ids)) return p.room_ids.filter(Boolean)
    return []
  })()
  const rooms = await fetchPackageRooms(roomIds)

  const highlights = strArray(p.highlights)
  const hotelAmenities = strArray(h?.amenities)
  const aggregated = Array.from(
    new Set([...hotelAmenities, ...rooms.flatMap((r) => r.amenities), ...highlights]),
  )

  const policies = h?.policies && typeof h.policies === 'object' ? h.policies : {}

  return {
    id: p.id,
    name: p.name || 'Package',
    description: p.description ?? null,
    images: imagesOf(p),
    currency: String(p.currency || 'PKR'),
    pricePerNight: num(p.base_price_per_night),
    packageType: p.package_type ?? null,
    minimumNights: num(p.minimum_nights),
    maximumNights: num(p.maximum_nights),
    maxGuests: num(p.max_guests),
    inclusions: strArray(p.inclusions),
    exclusions: strArray(p.exclusions),
    highlights,
    freeInclusions: Array.isArray(p.free_inclusions) ? p.free_inclusions : [],
    discountOffers: Array.isArray(p.discount_offers)
      ? p.discount_offers.map((o: any) => ({
          name: String(o?.name ?? ''),
          originalPrice: Number(o?.originalPrice ?? o?.original_price) || 0,
          discount: Number(o?.discount ?? o?.discount_percent) || 0,
        }))
      : [],
    cancellationPolicy: p.cancellation_policy ?? null,
    paymentTerms: p.payment_terms ?? null,
    hotelId: p.hotel_id ?? null,
    hotel: h
      ? {
          id: h.id ?? null,
          name: h.name,
          city: h.city ?? null,
          country: h.country ?? null,
          area: h.area ?? null,
          address: h.address ?? null,
          rating: num(h.rating),
          starRating: num(h.star_rating),
          propertyType: h.property_type ?? null,
          amenities: hotelAmenities,
          services: servicesToList(h.services),
          checkIn: policies.checkIn ?? policies.check_in ?? null,
          checkOut: policies.checkOut ?? policies.check_out ?? null,
          houseRules: policies.houseRules ?? policies.house_rules ?? null,
          latitude: num(h.latitude),
          longitude: num(h.longitude),
        }
      : null,
    rooms,
    aggregatedAmenities: aggregated,
  }
}
