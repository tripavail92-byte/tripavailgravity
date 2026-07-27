import { supabase } from '@/lib/supabase'

import type { PackageData } from '../types'

/**
 * Convert base64 data URL to File object
 */
/**
 * The nightly price to advertise for a package.
 *
 * The pricing step stores each selected room's `packagePrice` in `packageData.selectedRooms` and
 * summarises them in `packageData.priceRange`, but never writes `basePricePerNight`. So this exists
 * to derive it deterministically at publish time from what the wizard actually collected. Returns
 * undefined when the payload genuinely has nothing to base a price on, in which case the caller
 * inserts NULL and the DB guard blocks the publish rather than shipping a bookable card with no
 * price behind it.
 */
export function derivePackageBasePrice(pkg: PackageData): number | undefined {
  // 1. An explicit override from the payload wins if present and positive.
  if (typeof pkg.basePricePerNight === 'number' && pkg.basePricePerNight > 0) {
    return pkg.basePricePerNight
  }

  // 2. Cheapest configured room per night — the "from" price the details page already shows.
  const rooms = Object.values(pkg.selectedRooms ?? {})
  const prices = rooms
    .map((r: any) => Number(r?.packagePrice))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (prices.length > 0) return Math.min(...prices)

  // 3. Anything the pricing step summarised for us.
  const rangeMin = Number(pkg.priceRange?.min)
  if (Number.isFinite(rangeMin) && rangeMin > 0) return rangeMin

  return undefined
}

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

/**
 * Upload a single media file to Supabase Storage
 */
async function uploadMediaFile(file: File | string, userId: string): Promise<string> {
  // Convert base64 to File if needed
  let fileToUpload: File
  if (typeof file === 'string' && file.startsWith('data:')) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    fileToUpload = dataURLtoFile(file, `package_${timestamp}_${random}.jpg`)
  } else if (file instanceof File) {
    fileToUpload = file
  } else {
    throw new Error('Invalid file format')
  }

  const fileExt = fileToUpload.name.split('.').pop() || 'jpg'
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = fileName

  console.log('📤 Uploading media file:', filePath)

  const { error: uploadError } = await supabase.storage
    .from('package-media')
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('❌ Upload error:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('package-media').getPublicUrl(filePath)

  console.log('✅ Uploaded successfully:', data.publicUrl)
  return data.publicUrl
}

/**
 * Upload multiple media files
 */
export async function uploadPackageMedia(
  mediaFiles: (File | string)[],
  userId: string,
  onProgress?: (current: number, total: number) => void,
): Promise<string[]> {
  console.log(`📦 Uploading ${mediaFiles.length} media files...`)

  const uploadedUrls: string[] = []

  for (let i = 0; i < mediaFiles.length; i++) {
    try {
      const url = await uploadMediaFile(mediaFiles[i], userId)
      uploadedUrls.push(url)
      onProgress?.(i + 1, mediaFiles.length)
    } catch (error) {
      console.error(`❌ Failed to upload file ${i + 1}:`, error)
      throw new Error(`Failed to upload media file ${i + 1}`)
    }
  }

  console.log('✅ All media uploaded successfully')
  return uploadedUrls
}

/**
 * Publish a package to the database
 */
/**
 * Publish a package.
 *
 * Pass `draftId` when promoting a saved draft, so the SAME row goes live instead of a second one
 * being inserted alongside it. Without this the wizard's own autosave would guarantee duplicates:
 * every publish from a resumed draft would leave the draft orphaned and create a fresh listing.
 * hotelService.publishListing had exactly this bug and was fixed the same way.
 */
export async function publishPackage(packageData: PackageData, userId: string, draftId?: string) {
  console.log('🚀 Starting package publish...')
  console.log('Package data:', packageData)

  if (!userId) {
    throw new Error('User ID is required')
  }

  try {
    const packageCurrency =
      packageData.currency ||
      packageData.priceRange?.currency ||
      Object.values(packageData.selectedRooms || {})[0]?.currency ||
      'PKR'

    // Step 1: Upload media files if they exist
    let mediaUrls: string[] = []
    if (packageData.photos && packageData.photos.length > 0) {
      console.log(`📸 Uploading ${packageData.photos.length} photos...`)
      mediaUrls = await uploadPackageMedia(packageData.photos, userId)
      console.log('✅ Media uploaded:', mediaUrls)
    }

    // Step 2: Prepare package payload
    // Build room_configuration from selectedRooms
    const roomConfiguration = packageData.selectedRooms
      ? {
          rooms:
            packageData.roomIds?.map((roomId) => ({
              room_id: roomId,
              room_type: packageData.selectedRooms?.[roomId]?.room_type || 'standard',
              count: 1,
            })) || [],
          max_guests: packageData.maxGuests || 4,
          fixed_price: packageData.fixedPrice || null,
        }
      : {}

    const packagePayload = {
      owner_id: userId,
      hotel_id: packageData.hotelId || null, // Link to hotel
      package_type: packageData.packageType || 'custom',
      name: packageData.name || 'Untitled Package',
      description: packageData.description || null,
      cover_image: mediaUrls[0] || null,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      highlights: packageData.highlights || null,
      inclusions: packageData.inclusions || null,
      exclusions: packageData.exclusions || null,

      // JSONB Fields for structured data
      discount_offers: packageData.discountOffers || [],
      free_inclusions: packageData.freeInclusions || [],

      cancellation_policy: packageData.cancellationPolicy || null,
      payment_terms: packageData.paymentTerms || null,

      // Room Configuration (Option A: Fixed package)
      room_configuration: roomConfiguration,

      // Pricing and booking rules.
      //
      // The pricing step never sets basePricePerNight explicitly — it collects a per-room
      // `packagePrice` in packageData.selectedRooms and a summary priceRange, but the field this
      // column reads was declared on the type and never assigned. `packageData.basePricePerNight
      // || null` therefore inserted NULL, and the DB accepted it (base_price_per_night is nullable
      // with only CHECK >= 0). The listing then rendered "Price on request" while the atomic
      // booking RPC raised P0001 "Package has no base price set" at the first booking attempt.
      //
      // The right value is the CHEAPEST configured room per night: that is what the details page
      // shows as the from-price, and it is the honest advertised nightly rate. Falls back through
      // priceRange.min and an explicit basePricePerNight for older payload shapes. The migration
      // guard (20260722000006) will reject a NULL either way, so this is the client's half of
      // making both sides agree.
      base_price_per_night: derivePackageBasePrice(packageData) ?? null,
      currency: packageCurrency,
      minimum_nights: packageData.minimumNights || 1,
      maximum_nights: packageData.maximumNights || 30,
      max_guests: packageData.maxGuests || 4,

      slug: packageData.slug || null,
      is_published: true,
      // The row is going live, so it is no longer a resumable draft. Clearing this also stops it
      // reappearing in the dashboard's draft list.
      draft_data: null,
    }

    console.log('💾 Writing package to database...')
    console.log('Payload:', packagePayload)

    // Step 3: Promote the draft if we have one, otherwise insert fresh. Scoped to owner_id so a
    // draft id can never be used to overwrite somebody else's row.
    let packageRecord: any = null

    if (draftId) {
      const { data, error } = await supabase
        .from('packages')
        .update(packagePayload)
        .eq('id', draftId)
        .eq('owner_id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Database update error:', error)
        throw error
      }
      packageRecord = data
    } else {
      const { data, error } = await supabase
        .from('packages')
        .insert(packagePayload)
        .select()
        .single()

      if (error) {
        console.error('❌ Database insert error:', error)
        throw error
      }
      packageRecord = data
    }

    console.log('✅ Package published successfully!', packageRecord)
    return packageRecord
  } catch (error) {
    console.error('❌ FATAL ERROR in publishPackage:', error)
    throw error
  }
}

/**
 * Save (or update) an in-progress package as an unpublished draft.
 *
 * The whole wizard state goes into draft_data verbatim; the typed columns carry whatever is already
 * known so the row is still meaningful on the dashboard before it is finished.
 *
 * PLACEHOLDERS ARE REQUIRED, NOT LAZY. packages.package_type is NOT NULL, packages.name is NOT NULL,
 * and packages_name_min_length demands >= 3 characters. A draft saved on step 1 has none of those,
 * and a partner mid-word has a 1-2 character name. Substituting here keeps the constraints strict
 * for published rows — which is where they matter — instead of relaxing the schema to fit a
 * half-filled form. Both placeholders are visible and editable in the wizard.
 *
 * NOTE ON MEDIA: photos are NOT uploaded here. Autosave runs on a timer while the partner is still
 * typing, and uploading half-chosen images on every keystroke would burn storage and bandwidth for
 * files that may never be published. Media is uploaded once, at publish. A resumed draft therefore
 * restores everything except pending local image selections, which the partner re-picks on the
 * Media step.
 */
export async function savePackageDraft(
  packageData: PackageData,
  userId: string,
  draftId?: string,
): Promise<{ success: boolean; draftId?: string; error?: unknown }> {
  if (!userId) throw new Error('User ID required')

  const safeData = packageData || {}
  const typedName = (safeData.name || '').trim()

  const draftPayload = {
    owner_id: userId,
    // >= 3 chars or the CHECK constraint rejects the save mid-typing.
    name: typedName.length >= 3 ? typedName : 'Untitled Package',
    package_type: safeData.packageType || 'custom',
    description: safeData.description || null,
    hotel_id: safeData.hotelId || null,
    currency:
      safeData.currency ||
      safeData.priceRange?.currency ||
      Object.values(safeData.selectedRooms || {})[0]?.currency ||
      'PKR',
    // Derived where possible so the dashboard card can show a real price on a draft. Left null when
    // nothing is set yet — packages_published_requires_price only applies to published rows.
    base_price_per_night: derivePackageBasePrice(safeData) ?? null,
    minimum_nights: safeData.minimumNights || 1,
    maximum_nights: safeData.maximumNights || 30,
    max_guests: safeData.maxGuests || 4,

    is_published: false,
    draft_data: safeData as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  }

  try {
    if (draftId) {
      const { data, error } = await supabase
        .from('packages')
        .update(draftPayload)
        .eq('id', draftId)
        // Scoped to owner so a draft id from elsewhere cannot overwrite another partner's row.
        .eq('owner_id', userId)
        .select('id')
        .single()

      if (error) throw error
      return { success: true, draftId: data.id }
    }

    const { data, error } = await supabase
      .from('packages')
      .insert(draftPayload)
      .select('id')
      .single()

    if (error) throw error
    return { success: true, draftId: data.id }
  } catch (error) {
    console.error('[packageService] Error saving draft:', error)
    return { success: false, error }
  }
}

/**
 * Load a draft for resuming. Restricted to the caller's own unpublished rows — a published package
 * is not a draft, and reopening one in the wizard would silently republish over it.
 */
export async function getPackageDraft(draftId: string, userId: string) {
  if (!userId) throw new Error('User ID required')
  if (!draftId) throw new Error('Draft ID required')

  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', draftId)
    .eq('owner_id', userId)
    .eq('is_published', false)
    .single()

  if (error) throw error

  return {
    draft: data,
    // draft_data is the wizard's own shape; the columns alongside are the derived view of it.
    draftData: (data?.draft_data ?? {}) as PackageData,
  }
}

/**
 * Get user's packages
 */
export async function getUserPackages(userId: string) {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get a single package by ID or Slug
 */
export async function getPackageById(identifier: string) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
  const queryColumn = isUUID ? 'id' : 'slug'

  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq(queryColumn, identifier)
    .eq('is_published', true)
    .single()

  if (error) throw error
  return data
}

/**
 * Get multiple packages by IDs
 */
export async function getPackagesByIds(ids: string[]) {
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .in('id', ids)
    .eq('is_published', true)

  if (error) {
    console.error('Error fetching packages by IDs:', error)
    throw error
  }

  return data
}
