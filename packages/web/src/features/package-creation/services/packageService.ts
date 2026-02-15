import { supabase } from '@/lib/supabase'

import type { PackageData } from '../types'

/**
 * Convert base64 data URL to File object
 */
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
export async function publishPackage(packageData: PackageData, userId: string) {
  console.log('🚀 Starting package publish...')
  console.log('Package data:', packageData)

  if (!userId) {
    throw new Error('User ID is required')
  }

  try {
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

      // Pricing and booking rules
      base_price_per_night: packageData.basePricePerNight || null,
      minimum_nights: packageData.minimumNights || 1,
      maximum_nights: packageData.maximumNights || 30,
      max_guests: packageData.maxGuests || 4,

      slug: packageData.slug || null,
      is_published: true,
    }

    console.log('💾 Inserting package to database...')
    console.log('Payload:', packagePayload)

    // Step 3: Insert package to database
    const { data: packageRecord, error: insertError } = await supabase
      .from('packages')
      .insert(packagePayload)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Database insert error:', insertError)
      throw insertError
    }

    console.log('✅ Package published successfully!', packageRecord)
    return packageRecord
  } catch (error) {
    console.error('❌ FATAL ERROR in publishPackage:', error)
    throw error
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
    .single()

  if (error) throw error
  return data
}

/**
 * Get multiple packages by IDs
 */
export async function getPackagesByIds(ids: string[]) {
  if (!ids.length) return []
  const { data, error } = await supabase.from('packages').select('*').in('id', ids)

  if (error) {
    console.error('Error fetching packages by IDs:', error)
    throw error
  }

  return data
}
