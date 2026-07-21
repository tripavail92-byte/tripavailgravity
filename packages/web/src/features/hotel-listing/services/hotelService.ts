import { supabase } from '@/lib/supabase'

import { HotelData } from '../components/CompleteHotelListingFlow'

/*
  Maps the frontend HotelData structure to the Database Schema:
  
  HOTEL DATA -> DB COLUMNS
  ------------------------
  propertyType -> property_type
  hotelName -> name
  description -> description
  images -> main_image_url (1st), images (JSONB for rest)
  rooms -> rooms table
  policies -> policies (JSONB)
  services -> services (JSONB)
  contactEmail -> contact_email
*/

export const hotelService = {
  /**
   * Publish a listing. Pass `draftId` when promoting a saved draft (or when RETRYING after a failed
   * publish) so we UPDATE that row instead of inserting a second one — the wizard accepted a draft
   * id but never used it, so publishing a draft orphaned it and created a duplicate hotel.
   *
   * Ordering matters: the row is written UNPUBLISHED, then rooms, and `is_published` is flipped last.
   * There is no transaction across PostgREST calls, so the flip is the closest thing we have to a
   * commit — anything that throws before it leaves a resumable draft (is_published=false + draft_data
   * is exactly what getDraft/fetchDrafts look for) rather than a live, bookable hotel with no rooms.
   * The caller must feed `hotelId` back as `draftId` on retry; otherwise the retry re-INSERTs.
   * `onRowCreated` exists for exactly that: it fires the moment the row has an id, so a caller can
   * capture it even on the paths where we throw afterwards. The success return can't carry it.
   */
  async publishListing(
    data: Partial<HotelData>,
    userId: string,
    draftId?: string,
    onRowCreated?: (hotelId: string) => void,
  ) {
    if (!userId) throw new Error('User ID required')

    // 1. Prepare Hotel Payload
    const hotelPayload = {
      owner_id: userId,
      name: data.hotelName,
      description: data.description,
      property_type: data.propertyType,
      star_rating: data.starRating,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,

      // Location breakdown
      location:
        data.city && data.country ? `${data.city}, ${data.country}` : data.location?.address || '',
      address: data.address,
      country: data.country,
      city: data.city,
      area: data.area,
      zip_code: data.zipCode,
      latitude: data.location?.lat,
      longitude: data.location?.lng,

      base_price_per_night: 0, // Calculated from lowest room price
      currency: 'USD', // Replaced below with the listing currency; see 20260721000004.

      // JSONB Columns
      policies: data.policies,
      services: data.services,
      images: data.photos?.propertyPhotos,

      // Arrays
      amenities: data.amenities,

      // NOT is_published — that is flipped last, once the rooms are safely written. See below.
      // draft_data keeps the row resumable if we throw part-way through.
      draft_data: data,
      updated_at: new Date().toISOString(),
    }

    // Currency is a property of the listing, not of each room. It used to be picked per room, so
    // Math.min below could compare 120000 PKR against 400 USD as bare numbers and publish the PKR
    // room as the cheaper one. The wizard now sets it once; rooms whose stored currency disagrees
    // (older drafts) are excluded from the "from" price rather than silently mis-compared.
    const listingCurrency = data.currency || data.rooms?.[0]?.pricing?.currency || 'USD'
    hotelPayload.currency = listingCurrency

    if (data.rooms && data.rooms.length > 0) {
      const comparablePrices = data.rooms
        .filter((r) => (r.pricing?.currency || listingCurrency) === listingCurrency)
        .map((r) => r.pricing.basePrice)
        .filter((p) => Number.isFinite(p) && p > 0)

      if (comparablePrices.length > 0) {
        hotelPayload.base_price_per_night = Math.min(...comparablePrices)
      }
    }

    try {
      // 2. Write the hotel UNPUBLISHED — update the existing row when we have one, else insert.
      let hotel: { id: string } | null = null

      if (draftId) {
        const { data: updated, error: updateError } = await supabase
          .from('hotels')
          .update({ ...hotelPayload, is_published: false })
          .eq('id', draftId)
          // Scope to the owner: a draft id must never be able to overwrite someone else's row.
          .eq('owner_id', userId)
          .select()
          .single()
        if (updateError) {
          console.error('❌ Hotel update error:', updateError)
          throw updateError
        }
        hotel = updated
      } else {
        const { data: inserted, error: hotelError } = await supabase
          .from('hotels')
          .insert({ ...hotelPayload, is_published: false })
          .select()
          .single()
        if (hotelError) {
          console.error('❌ Hotel insert error:', hotelError)
          throw hotelError
        }
        hotel = inserted
      }

      if (!hotel) throw new Error('Publish failed: no hotel row was returned')
      onRowCreated?.(hotel.id)

      // 3. Rooms — replace, never append. Republishing (a draft, or a retry after a failed attempt)
      // would otherwise stack a second full set of rooms onto the same hotel.
      // Keyed on hotel.id, not draftId: a retry reuses the row we inserted on the first attempt, and
      // that row may already carry rooms from a partially-successful run.
      const { error: clearRoomsError } = await supabase
        .from('rooms')
        .delete()
        .eq('hotel_id', hotel.id)
      if (clearRoomsError) {
        console.error('❌ Rooms clear error:', clearRoomsError)
        throw clearRoomsError
      }

      if (data.rooms && data.rooms.length > 0) {
        const roomsPayload = data.rooms.map((room) => ({
          hotel_id: hotel.id,
          // A custom type stores the partner's own wording, not the literal string 'custom'.
          // room_type is plain text with no CHECK constraint, so this needs no migration.
          room_type: room.type === 'custom' ? room.customType?.trim() || 'Other' : room.type,
          name: room.name,
          description: room.description,
          capacity_adults: room.maxGuests,
          capacity_children: 0,
          price_override: room.pricing.basePrice,
          currency: listingCurrency,
          initial_stock: room.count,

          // Additional columns
          size_sqm: room.size,
          bed_config: room.beds,
          amenities: room.amenities,
          images: [],
        }))

        const { error: roomsError } = await supabase.from('rooms').insert(roomsPayload)

        if (roomsError) {
          console.error('❌ Rooms insert error:', roomsError)
          throw roomsError
        }
      }

      // 4. Go live. Last write, and the only one that exposes the listing publicly — everything it
      // depends on is already durable by this point. draft_data is cleared so the published row
      // stops looking like a resumable draft.
      const { error: publishError } = await supabase
        .from('hotels')
        .update({ is_published: true, draft_data: null, updated_at: new Date().toISOString() })
        .eq('id', hotel.id)
        .eq('owner_id', userId)
      if (publishError) {
        console.error('❌ Hotel publish flip error:', publishError)
        throw publishError
      }

      return { success: true, hotelId: hotel.id }
    } catch (error) {
      console.error('❌ FATAL ERROR in publishListing:', error)
      throw error
    }
  },

  async uploadImage(file: File, bucketProp: 'hotel-images' = 'hotel-images') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage.from(bucketProp).upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from(bucketProp).getPublicUrl(filePath)

    return data.publicUrl
  },

  async saveDraft(data: Partial<HotelData>, userId: string, draftId?: string) {
    if (!userId) throw new Error('User ID required')

    // Handle undefined or empty data
    const safeData = data || {}

    const draftPayload = {
      owner_id: userId,
      name: safeData.hotelName || 'Untitled Hotel',
      description: safeData.description || null,
      property_type: safeData.propertyType || null,
      contact_email: safeData.contactEmail || null,
      location: safeData.location?.address || null,
      latitude: safeData.location?.lat || null,
      longitude: safeData.location?.lng || null,
      base_price_per_night: 0,

      // JSONB Columns
      policies: safeData.policies || null,
      services: safeData.services || null,
      images: safeData.photos?.propertyPhotos || null,
      amenities: safeData.amenities || null,

      // Draft-specific
      is_published: false,
      draft_data: safeData, // Store entire form data for resuming
      updated_at: new Date().toISOString(),
    }

    try {
      if (draftId) {
        // Update existing draft
        const { data: hotel, error } = await supabase
          .from('hotels')
          .update(draftPayload)
          .eq('id', draftId)
          .eq('owner_id', userId)
          .select()
          .single()

        if (error) throw error
        return { success: true, draftId: hotel.id }
      } else {
        // Create new draft
        const { data: hotel, error } = await supabase
          .from('hotels')
          .insert(draftPayload)
          .select()
          .single()

        if (error) throw error
        return { success: true, draftId: hotel.id }
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      return { success: false, error }
    }
  },

  async fetchDrafts(userId: string) {
    if (!userId) throw new Error('User ID required')

    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('owner_id', userId)
        .eq('is_published', false)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return { success: true, drafts: data }
    } catch (error) {
      console.error('Error fetching drafts:', error)
      return { success: false, error, drafts: [] }
    }
  },

  async getDraft(draftId: string, userId: string) {
    if (!userId) throw new Error('User ID required')
    if (!draftId) throw new Error('Draft ID required')

    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', draftId)
        .eq('owner_id', userId)
        .eq('is_published', false)
        .single()

      if (error) throw error

      // Return the draft_data for restoring the form state
      return {
        success: true,
        draft: data,
        draftData: data.draft_data,
      }
    } catch (error) {
      console.error('Error fetching draft:', error)
      return { success: false, error }
    }
  },

  async fetchPublishedListings(userId: string) {
    if (!userId) throw new Error('User ID required')

    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*, rooms(count)')
        .eq('owner_id', userId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, listings: data }
    } catch (error) {
      console.error('Error fetching listings:', error)
      return { success: false, error, listings: [] }
    }
  },

  /**
   * Fetch hotel by ID with optional fields
   * Used by PackageDetailsPage to get hotel amenities
   */
  async getHotelById(hotelId: string, selectFields = 'name, amenities') {
    const { data, error } = await supabase
      .from('hotels')
      .select(selectFields)
      .eq('id', hotelId)
      .maybeSingle()

    if (error) {
      console.warn('[hotelService] Error fetching hotel:', error)
      throw error
    }

    return data
  },

  /**
   * Fetch rooms by IDs
   * Used by PackageDetailsPage to get room amenities
   */
  async getRoomsByIds(roomIds: string[], selectFields = 'name, description, amenities') {
    if (!roomIds || roomIds.length === 0) return []

    const { data, error } = await supabase.from('rooms').select(selectFields).in('id', roomIds)

    if (error) {
      console.warn('[hotelService] Error fetching rooms:', error)
      throw error
    }

    return data || []
  },
}
