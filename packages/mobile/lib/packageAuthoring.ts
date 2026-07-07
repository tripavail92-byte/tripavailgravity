import { supabase } from '@/lib/supabase'

/**
 * Package creation authoring — port of web packageService. ONE insert into
 * `packages` (no RPC, no draft persistence — wizard state only). Honors the
 * gotchas: `room_configuration` (not rooms_config), `base_price_per_night` MUST
 * be set (booking RPC raises if null), NO `status` column (DB default fills it),
 * media to the `package-media` bucket.
 */

export interface SelectedRoom {
  roomId: string
  roomName: string
  originalPrice: number
  packagePrice: number
  currency: string
  maxGuests: number
  size: number
  roomType: string
}

export interface PackageData {
  hotelId?: string
  hotelName?: string
  hotelAddress?: string
  packageType?: string
  name?: string
  description?: string
  photos?: string[]
  highlights?: string[]
  inclusions?: string[]
  exclusions?: string[]
  freeInclusions?: Array<{ name: string; icon?: string }>
  discountOffers?: Array<{ name: string; originalPrice: number; discount: number; icon?: string }>
  cancellationPolicy?: string
  paymentTerms?: string
  selectedRooms?: Record<string, SelectedRoom>
  roomIds?: string[]
  priceRange?: { min: number; max: number; currency: string } | null
  currency?: string
  basePricePerNight?: number
  maxGuests?: number
  minimumNights?: number
  maximumNights?: number
  fixedPrice?: number | null
}

export async function uploadPackageMedia(localUris: string[], userId: string): Promise<string[]> {
  const urls: string[] = []
  for (let i = 0; i < localUris.length; i++) {
    const uri = localUris[i]
    if (/^https?:\/\//.test(uri)) {
      urls.push(uri)
      continue
    }
    let ext = 'jpg'
    const m = uri.match(/\.(\w+)(?:\?|$)/)
    if (m) ext = m[1].toLowerCase()
    const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`
    try {
      const arraybuffer = await fetch(uri).then((r) => r.arrayBuffer())
      const { error } = await supabase.storage
        .from('package-media')
        .upload(filePath, arraybuffer, { contentType: `image/${ext}`, cacheControl: '3600', upsert: false })
      if (error) throw error
      urls.push(supabase.storage.from('package-media').getPublicUrl(filePath).data.publicUrl)
    } catch {
      throw new Error(`Failed to upload media file ${i + 1}`)
    }
  }
  return urls
}

export interface HotelRoomOption {
  roomId: string
  roomName: string
  description: string
  basePrice: number
  currency: string
  maxGuests: number
  size: number
  roomType: string
}

export async function fetchHotelRooms(hotelId: string): Promise<HotelRoomOption[]> {
  const { data, error } = await supabase.from('rooms').select('*').eq('hotel_id', hotelId)
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    roomId: r.id,
    roomName: r.name,
    description: r.description ?? '',
    basePrice: Number(r.price_override) || 0,
    currency: r.currency || 'PKR',
    maxGuests: Number(r.capacity_adults) || 1,
    size: Number(r.size_sqm) || 0,
    roomType: r.room_type || 'standard',
  }))
}

/** Hotels owned by this manager (published only) for the package HotelSelectionStep. */
export async function fetchOwnedPublishedHotels(
  userId: string,
): Promise<Array<{ id: string; name: string; address: string; roomCount: number }>> {
  const { data, error } = await supabase
    .from('hotels')
    .select('id, name, address, location, is_published')
    .eq('owner_id', userId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  const hotels = (data ?? []) as any[]
  const out: Array<{ id: string; name: string; address: string; roomCount: number }> = []
  for (const h of hotels) {
    const { count } = await supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('hotel_id', h.id)
    out.push({ id: h.id, name: h.name, address: h.address || h.location || 'No address', roomCount: count ?? 0 })
  }
  return out
}

export async function publishPackage(
  packageData: PackageData,
  userId: string,
  existingId?: string | null,
): Promise<Record<string, any>> {
  if (!userId) throw new Error('User ID is required')
  const selected = packageData.selectedRooms ?? {}
  const roomIds = packageData.roomIds ?? Object.keys(selected)
  const packageCurrency =
    packageData.currency ||
    packageData.priceRange?.currency ||
    Object.values(selected)[0]?.currency ||
    'PKR'

  const mediaUrls = packageData.photos?.length ? await uploadPackageMedia(packageData.photos, userId) : []

  const roomConfiguration =
    Object.keys(selected).length > 0
      ? {
          rooms: roomIds.map((id) => ({ room_id: id, room_type: selected[id]?.roomType || 'standard', count: 1 })),
          max_guests: packageData.maxGuests ?? 4,
          fixed_price: packageData.fixedPrice ?? null,
        }
      : {}

  const payload: Record<string, any> = {
    owner_id: userId,
    hotel_id: packageData.hotelId ?? null,
    package_type: packageData.packageType ?? 'custom',
    name: packageData.name ?? 'Untitled Package',
    description: packageData.description ?? null,
    cover_image: mediaUrls[0] ?? null,
    media_urls: mediaUrls.length ? mediaUrls : null,
    highlights: packageData.highlights ?? null,
    inclusions: packageData.inclusions ?? null,
    exclusions: packageData.exclusions ?? null,
    discount_offers: packageData.discountOffers ?? [],
    free_inclusions: packageData.freeInclusions ?? [],
    cancellation_policy: packageData.cancellationPolicy ?? null,
    payment_terms: packageData.paymentTerms ?? null,
    room_configuration: roomConfiguration,
    base_price_per_night: packageData.basePricePerNight ?? packageData.priceRange?.min ?? null,
    currency: packageCurrency,
    minimum_nights: packageData.minimumNights ?? 1,
    maximum_nights: packageData.maximumNights ?? 30,
    max_guests: packageData.maxGuests ?? 4,
    slug: null,
    is_published: true,
  }

  if (existingId) {
    // Editing an existing package — update in place; keep ownership and the
    // already-generated slug untouched.
    delete payload.owner_id
    delete payload.slug
    const { data, error } = await supabase
      .from('packages')
      .update(payload)
      .eq('id', existingId)
      .eq('owner_id', userId)
      .select()
      .single()
    if (error) throw error
    return data as Record<string, any>
  }

  const { data, error } = await supabase.from('packages').insert(payload).select().single()
  if (error) throw error
  return data as Record<string, any>
}

/** Load an owned package row back into the wizard's data shape for editing. */
export async function fetchPackageForEdit(
  packageId: string,
  userId: string,
): Promise<Record<string, any>> {
  const { data: row, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', packageId)
    .eq('owner_id', userId)
    .single()
  if (error) throw error
  const pkg = row as Record<string, any>

  // Rebuild selectedRooms from room_configuration + the live rooms table.
  const configuredIds: string[] = Array.isArray(pkg.room_configuration?.rooms)
    ? pkg.room_configuration.rooms.map((r: any) => r.room_id).filter(Boolean)
    : []
  const selectedRooms: Record<string, SelectedRoom> = {}
  if (pkg.hotel_id && configuredIds.length) {
    const options = await fetchHotelRooms(pkg.hotel_id)
    for (const opt of options) {
      if (!configuredIds.includes(opt.roomId)) continue
      selectedRooms[opt.roomId] = {
        roomId: opt.roomId,
        roomName: opt.roomName,
        originalPrice: opt.basePrice,
        // Per-room package prices aren't stored on the row; prefill the saved
        // nightly base for a single room, else the room's own base price.
        packagePrice:
          configuredIds.length === 1 && pkg.base_price_per_night
            ? Number(pkg.base_price_per_night)
            : opt.basePrice,
        currency: opt.currency,
        maxGuests: opt.maxGuests,
        size: opt.size,
        roomType: opt.roomType,
      }
    }
  }

  return {
    hotelId: pkg.hotel_id ?? undefined,
    packageType: pkg.package_type ?? '',
    name: pkg.name ?? '',
    description: pkg.description ?? '',
    photos: Array.isArray(pkg.media_urls) && pkg.media_urls.length ? pkg.media_urls : pkg.cover_image ? [pkg.cover_image] : [],
    highlights: pkg.highlights ?? [],
    inclusions: pkg.inclusions ?? [],
    exclusions: pkg.exclusions ?? [],
    freeInclusions: pkg.free_inclusions ?? [],
    discountOffers: pkg.discount_offers ?? [],
    cancellationPolicy: pkg.cancellation_policy ?? '',
    paymentTerms: pkg.payment_terms ?? '',
    selectedRooms,
    minimumNights: Number(pkg.minimum_nights) || 1,
    maximumNights: Number(pkg.maximum_nights) || 7,
    maxGuests: Number(pkg.max_guests) || 2,
    currency: pkg.currency || 'PKR',
  }
}
