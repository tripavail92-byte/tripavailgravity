import { supabase } from '@/lib/supabase'

export interface Tour {
  id: string
  slug?: string
  operator_id: string
  title: string
  tour_type: string
  location: {
    city: string
    country: string
    lat?: number
    lng?: number
    address?: string
  }
  duration: string
  price: number
  currency: string
  description: string | null
  short_description: string | null
  images: string[]
  highlights: string[]
  inclusions: string[]
  exclusions: string[]
  requirements: string[]
  min_participants: number
  max_participants: number
  min_age: number
  max_age: number
  difficulty_level: 'easy' | 'moderate' | 'difficult'
  languages: string[]
  // Pricing & Policies
  group_discounts: boolean
  pricing_tiers: Array<{
    id: string
    name: string
    minPeople: number
    maxPeople: number
    pricePerPerson: number
  }>
  seasonal_pricing: boolean
  peak_season_multiplier: number
  off_season_multiplier: number
  deposit_required: boolean
  deposit_percentage: number
  cancellation_policy: 'flexible' | 'moderate' | 'strict' | 'non-refundable'

  rating: number
  review_count: number
  is_active: boolean
  is_verified: boolean
  is_featured: boolean
  itinerary?: any[] // Structured itinerary data (JSONB in DB) - TODO: Define strict type
  schedules?: any[] // Structured schedule data
  created_at: string
  updated_at: string
}

export type CreateTourDTO = Omit<
  Tour,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'rating'
  | 'review_count'
  | 'is_active'
  | 'is_verified'
  | 'is_featured'
>

/**
 * Tour Schedule - One fixed departure/date slot for a tour
 * Each tour has ONE schedule (one fixed departure)
 */
export interface TourSchedule {
  id: string
  tour_id: string
  start_time: string // ISO 8601 timestamp
  end_time: string // ISO 8601 timestamp
  capacity: number // Total seats/slots available
  booked_count: number // Currently booked/confirmed slots
  price_override?: number // Optional price for this specific schedule
  status: 'scheduled' | 'cancelled' | 'completed'
  created_at: string
}

export const tourService = {
  async createTour(tourData: Partial<Tour>) {
    console.log('Creating tour with data:', tourData)
    // Cast to any to bypass strict type definition mismatch between Partial<Tour> and Table Insert type
    const { data, error } = await supabase
      .from('tours')
      .insert(tourData as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating tour:', error)
      throw error
    }

    return data as unknown as Tour
  },

  async updateTour(id: string, updates: Partial<Tour>) {
    console.log(`Updating tour ${id}:`, updates)
    const { data, error } = await supabase
      .from('tours')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating tour ${id}:`, error)
      throw error
    }

    return data as unknown as Tour
  },

  async getTourById(identifier: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    )
    const queryColumn = isUUID ? 'id' : 'slug'

    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq(queryColumn, identifier)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error(`Error fetching tour ${identifier}:`, error)
      throw error
    }

    return data as unknown as Tour
  },

  async getOperatorTourById(operatorId: string, tourId: string) {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .eq('operator_id', operatorId)
      .single()

    if (error) {
      console.error(`Error fetching operator tour ${tourId}:`, error)
      throw error
    }

    return data as unknown as Tour
  },

  async getOperatorTours(operatorId: string) {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('operator_id', operatorId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`Error fetching tours for operator ${operatorId}:`, error)
      throw error
    }

    return data as unknown as Tour[]
  },

  async getToursByIds(ids: string[]) {
    if (!ids.length) return []
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .in('id', ids)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching tours by IDs:', error)
      throw error
    }

    return data as unknown as Tour[]
  },

  async fetchPublishedTours(operatorId: string) {
    return this.getOperatorTours(operatorId)
  },

  async fetchDraftTours(operatorId: string) {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('operator_id', operatorId)
      .eq('is_published', false)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error(`Error fetching drafts for operator ${operatorId}:`, error)
      throw error
    }

    return data as unknown as Tour[]
  },

  async saveTourDraft(data: Partial<Tour>, operatorId: string, draftId?: string) {
    if (!operatorId) throw new Error('Operator ID required')

    const draftPayload = {
      operator_id: operatorId,
      title: data.title || 'Untitled Tour',
      slug: data.slug || null,
      tour_type: data.tour_type || 'Adventure',
      location: data.location || {},
      duration: data.duration || '1 day',
      price: data.price || 0,
      currency: data.currency || 'USD',
      is_published: false,
      // Provide defaults for required fields to satisfy DB constraints for drafts
      images: data.images || [],
      highlights: data.highlights || [],
      inclusions: data.inclusions || [],
      exclusions: data.exclusions || [],
      requirements: data.requirements || [],
      languages: data.languages || ['en'],
      min_participants: data.min_participants || 1,
      max_participants: data.max_participants || 10,
      min_age: data.min_age || 5,
      max_age: data.max_age || 80,
      difficulty_level: data.difficulty_level || 'moderate',
      cancellation_policy: data.cancellation_policy || 'moderate',
      deposit_required: data.deposit_required ?? false,
      deposit_percentage: data.deposit_percentage || 0,
      group_discounts: data.group_discounts ?? false,
      seasonal_pricing: data.seasonal_pricing ?? false,
      peak_season_multiplier: data.peak_season_multiplier || 1.2,
      off_season_multiplier: data.off_season_multiplier || 0.8,
      pricing_tiers: data.pricing_tiers || [],
      itinerary: data.itinerary || [],
      schedules: data.schedules || [],

      draft_data: data,
      updated_at: new Date().toISOString(),
    }

    if (draftId) {
      const { data: tour, error } = await supabase
        .from('tours')
        .update(draftPayload as any)
        .eq('id', draftId)
        .eq('operator_id', operatorId)
        .select()
        .single()

      if (error) throw error
      return { success: true, tourId: tour.id }
    } else {
      const { data: tour, error } = await supabase
        .from('tours')
        .insert(draftPayload as any)
        .select()
        .single()

      if (error) throw error
      return { success: true, tourId: tour.id }
    }
  },

  async fetchFeaturedTours() {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) {
      console.error('Error fetching featured tours:', error)
      throw error
    }

    return data as unknown as Tour[]
  },

  /**
   * Get schedule for a tour (typically ONE fixed departure per tour)
   */
  async getTourSchedules(tourId: string) {
    const { data, error } = await supabase
      .from('tour_schedules')
      .select('*')
      .eq('tour_id', tourId)
      .eq('status', 'scheduled')
      .order('start_time', { ascending: true })

    if (error) {
      console.error(`Error fetching schedules for tour ${tourId}:`, error)
      throw error
    }

    return (data as TourSchedule[]) || []
  },

  /**
   * Get the first available schedule for a tour (primarily used for travelers)
   * Returns the earliest upcoming schedule
   */
  async getFirstAvailableSchedule(tourId: string): Promise<TourSchedule | null> {
    const schedules = await this.getTourSchedules(tourId)
    return schedules.length > 0 ? schedules[0] : null
  },

  async uploadTourImages(operatorId: string, files: File[]) {
    const urls: string[] = []

    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${operatorId}/${fileName}`

      console.log(`📤 Uploading tour image: ${filePath}`)

      const { error: uploadError } = await supabase.storage
        .from('tour-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error(`❌ Error uploading file ${file.name}:`, uploadError)
        throw uploadError
      }

      const { data } = supabase.storage.from('tour-images').getPublicUrl(filePath)

      urls.push(data.publicUrl)
    }

    return urls
  },
}
