import { supabase } from '@/lib/supabase'

/**
 * Hotel listing authoring — port of web hotelService. Writes `hotels` + `rooms`.
 * No RPCs in this flow. Media goes to the `hotel-images` storage bucket (verified
 * to exist) and we ALSO set main_image_url + image_urls (web omits them, but the
 * mobile read side `lib/manager.ts` renders thumbnails from them).
 */

export interface HotelBed {
  type: string
  quantity: number
}
export interface HotelRoomInput {
  id: string
  type: string
  name: string
  description: string
  count: number
  maxGuests: number
  size: number
  beds: HotelBed[]
  amenities?: string[]
  pricing: { basePrice: number; currency: string }
}
export interface HotelPhoto {
  id: string
  url: string
  order: number
  isCover?: boolean
}
export interface HotelData {
  propertyType: string
  hotelName: string
  description: string
  contactEmail: string
  contactPhone: string
  starRating?: number
  country: string
  city: string
  area: string
  address: string
  zipCode: string
  location?: { address: string; lat: number; lng: number }
  amenities: string[]
  rooms: HotelRoomInput[]
  policies?: Record<string, any>
  services?: Record<string, any>
  photos?: { propertyPhotos: HotelPhoto[] }
}

const nowISO = () => new Date().toISOString()

export interface UploadHotelImageParams {
  userId: string
  draftHotelId?: string
  localUri: string
  fileName?: string
  mimeType?: string
}

export async function uploadHotelImage(p: UploadHotelImageParams): Promise<string> {
  let ext = 'jpg'
  if (p.fileName && p.fileName.includes('.')) ext = p.fileName.split('.').pop()!.toLowerCase()
  else if (p.mimeType?.includes('/')) ext = p.mimeType.split('/')[1]
  const name = `${Math.random().toString(36).substring(2)}.${ext}`
  // Storage RLS requires the first path segment to be the owner uid.
  const filePath = `${p.userId}/${p.draftHotelId ?? 'staging'}/${name}`
  const contentType = p.mimeType ?? `image/${ext}`
  const arraybuffer = await fetch(p.localUri).then((r) => r.arrayBuffer())
  const { error } = await supabase.storage
    .from('hotel-images')
    .upload(filePath, arraybuffer, { contentType, cacheControl: '3600', upsert: false })
  if (error) throw error
  return supabase.storage.from('hotel-images').getPublicUrl(filePath).data.publicUrl
}

function buildHotelPayload(data: Partial<HotelData>, userId: string, isPublished: boolean): Record<string, any> {
  const rooms = data.rooms ?? []
  const minPrice = rooms.length ? Math.min(...rooms.map((r) => Number(r.pricing?.basePrice) || 0)) : 0
  const photos = data.photos?.propertyPhotos ?? []
  const cover = photos.find((ph) => ph.isCover) ?? photos[0]
  return {
    owner_id: userId,
    name: data.hotelName || 'Untitled Hotel',
    description: data.description ?? null,
    property_type: data.propertyType ?? null,
    star_rating: data.starRating ?? null,
    contact_email: data.contactEmail ?? null,
    contact_phone: data.contactPhone ?? null,
    location: data.city && data.country ? `${data.city}, ${data.country}` : data.location?.address ?? '',
    address: data.address ?? null,
    country: data.country ?? null,
    city: data.city ?? null,
    area: data.area ?? null,
    zip_code: data.zipCode ?? null,
    latitude: data.location?.lat ?? null,
    longitude: data.location?.lng ?? null,
    base_price_per_night: minPrice,
    policies: data.policies ?? null,
    services: data.services ?? null,
    images: photos,
    main_image_url: cover?.url ?? null,
    image_urls: photos.map((ph) => ph.url),
    amenities: data.amenities ?? [],
    is_published: isPublished,
    updated_at: nowISO(),
  }
}

export async function publishHotelListing(
  data: Partial<HotelData>,
  userId: string,
  existingId?: string | null,
): Promise<{ success: true; hotelId: string }> {
  if (!userId) throw new Error('User ID required')
  const payload = buildHotelPayload(data, userId, true)

  let hotelId: string
  if (existingId) {
    // Promote an existing draft row to published (no duplicate row).
    const { data: row, error } = await supabase
      .from('hotels')
      .update(payload)
      .eq('id', existingId)
      .eq('owner_id', userId)
      .select('id')
      .single()
    if (error) throw error
    hotelId = (row as { id: string }).id
    await supabase.from('rooms').delete().eq('hotel_id', hotelId) // replace rooms
  } else {
    const { data: row, error } = await supabase.from('hotels').insert(payload).select('id').single()
    if (error) throw error
    hotelId = (row as { id: string }).id
  }

  const rooms = data.rooms ?? []
  if (rooms.length) {
    const roomsPayload = rooms.map((room) => ({
      hotel_id: hotelId,
      room_type: room.type,
      name: room.name,
      description: room.description,
      capacity_adults: room.maxGuests,
      capacity_children: 0,
      price_override: room.pricing?.basePrice ?? 0,
      currency: room.pricing?.currency ?? 'PKR',
      initial_stock: room.count,
      size_sqm: room.size,
      bed_config: room.beds,
      amenities: room.amenities ?? [],
      images: [],
    }))
    const { error: roomsError } = await supabase.from('rooms').insert(roomsPayload)
    if (roomsError) throw roomsError // hotel row already exists (no rollback) — same as web
  }
  return { success: true, hotelId }
}

/**
 * Load an owned hotel row back into the wizard's data shape for editing.
 * Drafts keep the exact wizard state in draft_data; published rows are
 * reconstructed from the authoritative columns + rooms table.
 */
export async function fetchHotelForEdit(
  hotelId: string,
  userId: string,
): Promise<{ data: Record<string, any>; isPublished: boolean }> {
  const { data: row, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', hotelId)
    .eq('owner_id', userId)
    .single()
  if (error) throw error
  const hotel = row as Record<string, any>
  const isPublished = Boolean(hotel.is_published)

  if (!isPublished && hotel.draft_data && typeof hotel.draft_data === 'object') {
    return { data: hotel.draft_data as Record<string, any>, isPublished }
  }

  const { data: roomRows, error: roomsError } = await supabase
    .from('rooms')
    .select('*')
    .eq('hotel_id', hotelId)
  if (roomsError) throw roomsError

  const rooms: HotelRoomInput[] = (roomRows ?? []).map((r: any) => ({
    id: r.id,
    type: r.room_type ?? 'standard',
    name: r.name ?? '',
    description: r.description ?? '',
    count: Number(r.initial_stock) || 1,
    maxGuests: Number(r.capacity_adults) || 2,
    size: Number(r.size_sqm) || 0,
    beds: Array.isArray(r.bed_config) ? r.bed_config : [],
    amenities: Array.isArray(r.amenities) ? r.amenities : [],
    pricing: { basePrice: Number(r.price_override) || 0, currency: r.currency || 'PKR' },
  }))

  const photos: HotelPhoto[] = Array.isArray(hotel.images)
    ? (hotel.images as any[]).map((ph: any, i: number) =>
        typeof ph === 'string'
          ? { id: `existing_${i}`, url: ph, order: i, isCover: i === 0 }
          : { id: ph.id ?? `existing_${i}`, url: ph.url, order: ph.order ?? i, isCover: ph.isCover ?? i === 0 },
      )
    : []

  return {
    isPublished,
    data: {
      propertyType: hotel.property_type ?? '',
      hotelName: hotel.name ?? '',
      description: hotel.description ?? '',
      contactEmail: hotel.contact_email ?? '',
      contactPhone: hotel.contact_phone ?? '',
      starRating: hotel.star_rating ?? undefined,
      country: hotel.country ?? '',
      city: hotel.city ?? '',
      area: hotel.area ?? '',
      address: hotel.address ?? '',
      zipCode: hotel.zip_code ?? '',
      location:
        hotel.latitude != null && hotel.longitude != null
          ? { address: hotel.address ?? '', lat: Number(hotel.latitude), lng: Number(hotel.longitude) }
          : {},
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
      rooms,
      policies: hotel.policies ?? {},
      services: hotel.services ?? null,
      photos: { propertyPhotos: photos },
    },
  }
}

export async function saveHotelDraft(
  data: Partial<HotelData>,
  userId: string,
  draftId?: string | null,
): Promise<{ success: boolean; draftId?: string; error?: any }> {
  if (!userId) return { success: false, error: new Error('User ID required') }
  const payload = { ...buildHotelPayload(data, userId, false), draft_data: data }
  try {
    if (draftId) {
      const { data: row, error } = await supabase
        .from('hotels')
        .update(payload)
        .eq('id', draftId)
        .eq('owner_id', userId)
        .select('id')
        .single()
      if (error) return { success: false, error }
      return { success: true, draftId: (row as { id: string }).id }
    }
    const { data: row, error } = await supabase.from('hotels').insert(payload).select('id').single()
    if (error) return { success: false, error }
    return { success: true, draftId: (row as { id: string }).id }
  } catch (error) {
    return { success: false, error }
  }
}
