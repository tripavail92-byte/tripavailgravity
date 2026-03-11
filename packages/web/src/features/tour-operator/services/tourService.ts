import { supabase } from '@/lib/supabase'
import type { TourPickupLocation } from '@tripavail/shared/types/tourPickup'
import {
  buildStructuredFeaturesFromLabels,
  EXCLUDED_FEATURE_OPTIONS,
  INCLUDED_FEATURE_OPTIONS,
  TourFeatureItem,
} from '@/features/tour-operator/assets/TourIconRegistry'

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
  duration_days?: number | null
  price: number
  currency: string
  description: string | null
  short_description: string | null
  custom_category_label?: string | null
  images: string[]
  highlights: string[]
  inclusions: string[]
  exclusions: string[]
  included_features?: TourFeatureItem[]
  excluded_features?: TourFeatureItem[]
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
    discountPercentage?: number
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
  itinerary?: any[]
  schedules?: any[]
  // Draft workflow
  workflow_status: 'draft' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived'
  last_edited_at?: string | null
  completion_percentage?: number
  autosave_enabled?: boolean
  rejection_reason?: string | null
  submitted_at?: string | null
  approved_at?: string | null
  draft_data?: Record<string, any> | null
  theme_color?: string | null
  pickup_locations?: TourPickupLocation[]
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

export interface TourMediaItem {
  id: string
  tour_id: string
  url: string
  storage_path: string
  sort_order: number
  is_main: boolean
  created_at: string
}

export interface NormalizedTourScheduleRow {
  start_time: string
  end_time: string
  capacity: number
  status: 'scheduled' | 'cancelled' | 'completed'
}

const DEFAULT_SCHEDULE_START = '09:00'
const DEFAULT_SCHEDULE_DURATION_HOURS = 2

const toIsoOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

const combineDateAndTimeToIso = (dateValue: unknown, timeValue: unknown): string | null => {
  if (typeof dateValue !== 'string' || dateValue.trim().length === 0) return null
  const time = typeof timeValue === 'string' && timeValue.trim().length > 0 ? timeValue : DEFAULT_SCHEDULE_START
  const parsed = new Date(`${dateValue}T${time}:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

const parseCapacity = (value: unknown, fallback: number): number => {
  const normalized = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(normalized) || normalized <= 0) return Math.max(1, fallback)
  return Math.max(1, Math.round(normalized))
}

export function normalizeTourSchedules(
  schedules: unknown,
  fallbackCapacity = 10,
): NormalizedTourScheduleRow[] {
  if (!Array.isArray(schedules)) return []

  return schedules
    .map((schedule: any) => {
      const startFromTimestamp = toIsoOrNull(schedule?.start_time)
      const startFromDateTime = combineDateAndTimeToIso(schedule?.date, schedule?.time)
      const start_time = startFromTimestamp || startFromDateTime

      if (!start_time) return null

      const endFromTimestamp = toIsoOrNull(schedule?.end_time)
      const end_time =
        endFromTimestamp ||
        new Date(new Date(start_time).getTime() + DEFAULT_SCHEDULE_DURATION_HOURS * 60 * 60 * 1000).toISOString()

      const capacity = parseCapacity(schedule?.capacity, fallbackCapacity)
      const status =
        schedule?.status === 'cancelled' || schedule?.status === 'completed'
          ? schedule.status
          : 'scheduled'

      return {
        start_time,
        end_time,
        capacity,
        status,
      } as NormalizedTourScheduleRow
    })
    .filter((row): row is NormalizedTourScheduleRow => row !== null)
}

async function syncTourSchedulesFromJson(
  tourId: string,
  schedules: unknown,
  fallbackCapacity = 10,
) {
  const normalized = normalizeTourSchedules(schedules, fallbackCapacity)
  const { error } = await supabase.rpc('sync_tour_schedules_from_json', {
    p_tour_id: tourId,
    p_schedules: normalized,
    p_default_capacity: Math.max(1, fallbackCapacity),
  })

  if (error) {
    console.error('Error syncing tour schedules:', error)
    throw error
  }
}

/** Calculate how complete a tour draft is (0–100) */
export function calculateCompletionPercentage(data: Partial<Tour>): number {
  const checks = [
    !!data.title?.trim(),
    !!data.tour_type,
    !!data.location?.city,
    !!data.duration,
    (data.images?.length ?? 0) > 0,
    !!data.description?.trim(),
    (data.itinerary?.length ?? 0) > 0,
    !!data.price && data.price > 0,
    !!data.cancellation_policy,
    (data.schedules?.length ?? 0) > 0,
  ]
  const filled = checks.filter(Boolean).length
  return Math.round((filled / checks.length) * 100)
}

export const tourService = {
  async createTour(tourData: Partial<Tour>) {
    console.log('Creating tour with data:', tourData)
    const normalizedPrice = Number.isFinite(Number(tourData.price)) ? Number(tourData.price) : 0
    const normalizedDepositRequired = Boolean(tourData.deposit_required)
    const normalizedCancellationPolicy =
      (tourData.cancellation_policy || 'moderate') as
        | 'flexible'
        | 'moderate'
        | 'strict'
        | 'non-refundable'
    const normalizedInclusions = Array.isArray(tourData.inclusions) ? tourData.inclusions : []
    const normalizedExclusions = Array.isArray(tourData.exclusions) ? tourData.exclusions : []
    const normalizedIncludedFeatures =
      Array.isArray(tourData.included_features) && tourData.included_features.length > 0
        ? tourData.included_features
        : buildStructuredFeaturesFromLabels(normalizedInclusions, INCLUDED_FEATURE_OPTIONS)
    const normalizedExcludedFeatures =
      Array.isArray(tourData.excluded_features) && tourData.excluded_features.length > 0
        ? tourData.excluded_features
        : buildStructuredFeaturesFromLabels(normalizedExclusions, EXCLUDED_FEATURE_OPTIONS)

    const payload = {
      ...tourData,
      price: normalizedPrice,
      base_price: normalizedPrice,
      deposit_required: normalizedDepositRequired,
      require_deposit: normalizedDepositRequired,
      cancellation_policy: normalizedCancellationPolicy,
      cancellation_policy_type: normalizedCancellationPolicy,
      inclusions: normalizedInclusions,
      included: normalizedInclusions,
      exclusions: normalizedExclusions,
      excluded: normalizedExclusions,
      included_features: normalizedIncludedFeatures,
      excluded_features: normalizedExcludedFeatures,
    }

    // Cast to any to bypass strict type definition mismatch between Partial<Tour> and Table Insert type
    const { data, error } = await supabase
      .from('tours')
      .insert(payload as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating tour:', error)
      throw error
    }

    const created = data as unknown as Tour
    await syncTourSchedulesFromJson(
      created.id,
      payload.schedules,
      payload.max_participants || 10,
    )

    return created
  },

  async updateTour(id: string, updates: Partial<Tour>) {
    console.log(`Updating tour ${id}:`, updates)
    const normalizedPrice = Number.isFinite(Number(updates.price)) ? Number(updates.price) : 0
    const normalizedDepositRequired = Boolean(updates.deposit_required)
    const normalizedCancellationPolicy =
      (updates.cancellation_policy || 'moderate') as
        | 'flexible'
        | 'moderate'
        | 'strict'
        | 'non-refundable'
    const normalizedInclusions = Array.isArray(updates.inclusions) ? updates.inclusions : []
    const normalizedExclusions = Array.isArray(updates.exclusions) ? updates.exclusions : []
    const normalizedIncludedFeatures =
      Array.isArray(updates.included_features) && updates.included_features.length > 0
        ? updates.included_features
        : buildStructuredFeaturesFromLabels(normalizedInclusions, INCLUDED_FEATURE_OPTIONS)
    const normalizedExcludedFeatures =
      Array.isArray(updates.excluded_features) && updates.excluded_features.length > 0
        ? updates.excluded_features
        : buildStructuredFeaturesFromLabels(normalizedExclusions, EXCLUDED_FEATURE_OPTIONS)

    const payload = {
      ...updates,
      price: normalizedPrice,
      base_price: normalizedPrice,
      deposit_required: normalizedDepositRequired,
      require_deposit: normalizedDepositRequired,
      cancellation_policy: normalizedCancellationPolicy,
      cancellation_policy_type: normalizedCancellationPolicy,
      inclusions: normalizedInclusions,
      included: normalizedInclusions,
      exclusions: normalizedExclusions,
      excluded: normalizedExclusions,
      included_features: normalizedIncludedFeatures,
      excluded_features: normalizedExcludedFeatures,
      updated_at: new Date().toISOString(),
      last_edited_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('tours')
      .update(payload as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating tour ${id}:`, error)
      throw error
    }

    const updated = data as unknown as Tour
  await syncTourSchedulesFromJson(id, payload.schedules, payload.max_participants || 10)

    return updated
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

    const { data: pickups, error: pickupError } = await supabase
      .from('tour_pickup_locations')
      .select('*')
      .eq('tour_id', data.id)
      .order('is_primary', { ascending: false })
      .order('pickup_time', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (pickupError) {
      console.error(`Error fetching pickup locations for tour ${data.id}:`, pickupError)
      throw pickupError
    }

    return {
      ...(data as unknown as Tour),
      pickup_locations: (pickups ?? []) as TourPickupLocation[],
    }
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

  /** Returns tours the operator can still edit: draft, in_progress, rejected */
  async fetchContinuableTours(operatorId: string) {
    const { data, error } = await supabase
      .from('tours')
      .select('id, title, workflow_status, completion_percentage, last_edited_at, images, tour_type, rejection_reason')
      .eq('operator_id', operatorId)
      .in('workflow_status', ['draft', 'in_progress', 'rejected'])
      .order('last_edited_at', { ascending: false, nullsFirst: false })
      .limit(10)

    if (error) {
      console.error(`Error fetching continuable tours for operator ${operatorId}:`, error)
      throw error
    }

    return (data ?? []) as unknown as Partial<Tour>[]
  },

  /** Save current form state as draft/in_progress — creates or updates */
  async saveWorkflowDraft(
    data: Partial<Tour>,
    operatorId: string,
    tourId?: string | null,
    completionPct?: number,
    workflowSnapshot?: {
      version: number
      currentStep: number
      visitedSteps: number[]
      stepStatuses: Array<{
        id: string
        status: string
        requiredCount: number
        filledCount: number
      }>
      updatedAt: string
    },
  ) {
    const now = new Date().toISOString()
    const { draft_data: existingDraftData, ...restData } = data as Partial<Tour> & {
      draft_data?: Record<string, any> | null
    }

    const normalizedDraftData = {
      ...(existingDraftData && typeof existingDraftData === 'object' ? existingDraftData : {}),
      ...restData,
      _workflow: workflowSnapshot ?? (existingDraftData as any)?._workflow ?? null,
    }

    const normalizedPrice = Number.isFinite(Number(data.price)) ? Number(data.price) : 0
    const normalizedDepositRequired = Boolean(data.deposit_required)
    const normalizedCancellationPolicy =
      (data.cancellation_policy || 'moderate') as
        | 'flexible'
        | 'moderate'
        | 'strict'
        | 'non-refundable'
    const normalizedInclusions = Array.isArray(data.inclusions) ? data.inclusions : []
    const normalizedExclusions = Array.isArray(data.exclusions) ? data.exclusions : []
    const normalizedIncludedFeatures =
      Array.isArray(data.included_features) && data.included_features.length > 0
        ? data.included_features
        : buildStructuredFeaturesFromLabels(normalizedInclusions, INCLUDED_FEATURE_OPTIONS)
    const normalizedExcludedFeatures =
      Array.isArray(data.excluded_features) && data.excluded_features.length > 0
        ? data.excluded_features
        : buildStructuredFeaturesFromLabels(normalizedExclusions, EXCLUDED_FEATURE_OPTIONS)

    const payload = {
      operator_id: operatorId,
      title: data.title || 'Untitled Tour',
      slug: data.slug || null,
      tour_type: data.tour_type || 'Adventure',
      location: data.location || {},
      duration: data.duration || '1 day',
      price: normalizedPrice,
      base_price: normalizedPrice,
      currency: data.currency || 'USD',
      is_published: false,
      images: data.images || [],
      highlights: data.highlights || [],
      inclusions: normalizedInclusions,
      included: normalizedInclusions,
      exclusions: normalizedExclusions,
      excluded: normalizedExclusions,
      included_features: normalizedIncludedFeatures,
      excluded_features: normalizedExcludedFeatures,
      requirements: data.requirements || [],
      languages: data.languages || ['en'],
      min_participants: data.min_participants || 1,
      max_participants: data.max_participants || 10,
      min_age: data.min_age || 5,
      max_age: data.max_age || 80,
      difficulty_level: data.difficulty_level || 'moderate',
      cancellation_policy: normalizedCancellationPolicy,
      cancellation_policy_type: normalizedCancellationPolicy,
      deposit_required: normalizedDepositRequired,
      require_deposit: normalizedDepositRequired,
      deposit_percentage: data.deposit_percentage || 0,
      group_discounts: data.group_discounts ?? false,
      seasonal_pricing: data.seasonal_pricing ?? false,
      peak_season_multiplier: data.peak_season_multiplier || 1.2,
      off_season_multiplier: data.off_season_multiplier || 0.8,
      pricing_tiers: data.pricing_tiers || [],
      itinerary: data.itinerary || [],
      schedules: data.schedules || [],
      draft_data: normalizedDraftData,
      workflow_status: 'in_progress',
      last_edited_at: now,
      completion_percentage: completionPct ?? 0,
      updated_at: now,
    }

    if (tourId) {
      const { data: tour, error } = await supabase
        .from('tours')
        .update(payload as any)
        .eq('id', tourId)
        .eq('operator_id', operatorId)
        .select('id')
        .single()
      if (error) throw error
      await syncTourSchedulesFromJson(tour.id as string, payload.schedules, payload.max_participants)
      return { success: true, tourId: tour.id as string }
    } else {
      const { data: tour, error } = await supabase
        .from('tours')
        .insert({ ...payload, workflow_status: 'draft' } as any)
        .select('id')
        .single()
      if (error) throw error
      await syncTourSchedulesFromJson(tour.id as string, payload.schedules, payload.max_participants)
      return { success: true, tourId: tour.id as string }
    }
  },

  /** Submit a saved tour for admin review */
  async submitForReview(tourId: string, operatorId: string) {
    const { error } = await supabase
      .from('tours')
      .update({
        workflow_status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', tourId)
      .eq('operator_id', operatorId)
    if (error) throw error
    return { success: true }
  },

  async saveTourDraft(data: Partial<Tour>, operatorId: string, draftId?: string) {
    if (!operatorId) throw new Error('Operator ID required')

    const normalizedPrice = Number.isFinite(Number(data.price)) ? Number(data.price) : 0
    const normalizedDepositRequired = Boolean(data.deposit_required)
    const normalizedCancellationPolicy =
      (data.cancellation_policy || 'moderate') as
        | 'flexible'
        | 'moderate'
        | 'strict'
        | 'non-refundable'
    const normalizedInclusions = Array.isArray(data.inclusions) ? data.inclusions : []
    const normalizedExclusions = Array.isArray(data.exclusions) ? data.exclusions : []
    const normalizedIncludedFeatures =
      Array.isArray(data.included_features) && data.included_features.length > 0
        ? data.included_features
        : buildStructuredFeaturesFromLabels(normalizedInclusions, INCLUDED_FEATURE_OPTIONS)
    const normalizedExcludedFeatures =
      Array.isArray(data.excluded_features) && data.excluded_features.length > 0
        ? data.excluded_features
        : buildStructuredFeaturesFromLabels(normalizedExclusions, EXCLUDED_FEATURE_OPTIONS)

    const draftPayload = {
      operator_id: operatorId,
      title: data.title || 'Untitled Tour',
      slug: data.slug || null,
      tour_type: data.tour_type || 'Adventure',
      location: data.location || {},
      duration: data.duration || '1 day',
      price: normalizedPrice,
      base_price: normalizedPrice,
      currency: data.currency || 'USD',
      is_published: false,
      // Provide defaults for required fields to satisfy DB constraints for drafts
      images: data.images || [],
      highlights: data.highlights || [],
      inclusions: normalizedInclusions,
      included: normalizedInclusions,
      exclusions: normalizedExclusions,
      excluded: normalizedExclusions,
      included_features: normalizedIncludedFeatures,
      excluded_features: normalizedExcludedFeatures,
      requirements: data.requirements || [],
      languages: data.languages || ['en'],
      min_participants: data.min_participants || 1,
      max_participants: data.max_participants || 10,
      min_age: data.min_age || 5,
      max_age: data.max_age || 80,
      difficulty_level: data.difficulty_level || 'moderate',
      cancellation_policy: normalizedCancellationPolicy,
      cancellation_policy_type: normalizedCancellationPolicy,
      deposit_required: normalizedDepositRequired,
      require_deposit: normalizedDepositRequired,
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
      await syncTourSchedulesFromJson(tour.id, draftPayload.schedules, draftPayload.max_participants)
      return { success: true, tourId: tour.id }
    } else {
      const { data: tour, error } = await supabase
        .from('tours')
        .insert(draftPayload as any)
        .select()
        .single()

      if (error) throw error
      await syncTourSchedulesFromJson(tour.id, draftPayload.schedules, draftPayload.max_participants)
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

  async listTourMedia(tourId: string) {
    const { data, error } = await supabase
      .from('tour_media')
      .select('*')
      .eq('tour_id', tourId)
      .order('is_main', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as TourMediaItem[]
  },

  async syncTourImagesFromMedia(tourId: string, operatorId: string) {
    const media = await this.listTourMedia(tourId)
    const orderedUrls = media.map((item) => item.url)

    const { error } = await supabase
      .from('tours')
      .update({
        images: orderedUrls,
        updated_at: new Date().toISOString(),
        last_edited_at: new Date().toISOString(),
      } as any)
      .eq('id', tourId)
      .eq('operator_id', operatorId)

    if (error) throw error
    return orderedUrls
  },

  async uploadTourMediaAtomic(params: {
    tourId: string
    operatorId: string
    file: File
    sortOrder: number
    makeMain: boolean
    timeoutMs?: number
  }) {
    const {
      tourId,
      operatorId,
      file,
      sortOrder,
      makeMain,
      timeoutMs = 15000,
    } = params

    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${operatorId}/${tourId}/${fileName}`

    const uploadPromise = supabase.storage
      .from('tour-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout: no progress detected')), timeoutMs)
    })

    const uploadResult = await Promise.race([uploadPromise, timeoutPromise]) as {
      error: any
    }

    if (uploadResult.error) {
      throw uploadResult.error
    }

    const { data: publicData } = supabase.storage.from('tour-images').getPublicUrl(filePath)
    const publicUrl = publicData.publicUrl

    const { data: inserted, error: insertError } = await supabase
      .from('tour_media')
      .insert({
        tour_id: tourId,
        url: publicUrl,
        storage_path: filePath,
        sort_order: sortOrder,
        is_main: false,
      } as any)
      .select('*')
      .single()

    if (insertError) {
      await supabase.storage.from('tour-images').remove([filePath])
      throw insertError
    }

    if (makeMain) {
      const { error: mainError } = await supabase.rpc('set_tour_media_main', {
        p_tour_id: tourId,
        p_media_id: inserted.id,
      })
      if (mainError) {
        throw mainError
      }
    }

    await this.syncTourImagesFromMedia(tourId, operatorId)
    return inserted as TourMediaItem
  },

  async setTourMediaMain(tourId: string, mediaId: string, operatorId: string) {
    const { error } = await supabase.rpc('set_tour_media_main', {
      p_tour_id: tourId,
      p_media_id: mediaId,
    })
    if (error) throw error
    await this.syncTourImagesFromMedia(tourId, operatorId)
    return { success: true }
  },

  async removeTourMedia(tourId: string, mediaId: string, operatorId: string) {
    const { data: media, error: mediaError } = await supabase
      .from('tour_media')
      .select('id, storage_path, is_main')
      .eq('id', mediaId)
      .eq('tour_id', tourId)
      .single()

    if (mediaError) throw mediaError

    const { error: deleteError } = await supabase
      .from('tour_media')
      .delete()
      .eq('id', mediaId)
      .eq('tour_id', tourId)

    if (deleteError) throw deleteError

    if (media.storage_path) {
      await supabase.storage.from('tour-images').remove([media.storage_path])
    }

    const remaining = await this.listTourMedia(tourId)
    if (media.is_main && remaining.length > 0) {
      await this.setTourMediaMain(tourId, remaining[0].id, operatorId)
    } else {
      await this.syncTourImagesFromMedia(tourId, operatorId)
    }

    return { success: true }
  },
}
