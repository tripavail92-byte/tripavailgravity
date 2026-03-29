import { supabase } from '@/lib/supabase'
import type { TourReviewWithReply } from '@/features/booking/services/reviewService'
import type {
  OperatorAward,
  OperatorFleetAsset,
  OperatorGalleryItem,
  OperatorGuideProfile,
  OperatorProfileDocumentLinks,
  OperatorPublicPolicies,
} from '@/features/tour-operator/types/operatorProfile'

function isMissingRpcError(error: any) {
  const message = String(error?.message || error || '').toLowerCase()
  return message.includes('schema cache') || message.includes('could not find the function')
}

export interface OperatorPublicProfile {
  user_id: string
  slug: string | null
  company_name: string | null
  business_name: string | null
  company_logo_url: string | null
  description: string | null
  primary_city: string | null
  coverage_range: string | null
  categories: string[] | null
  years_experience: string | null
  team_size: string | null
  registration_number: string | null
  phone_number: string | null
  email: string | null
  verification_documents: Record<string, any> | null
  verification_urls: OperatorProfileDocumentLinks | null
  fleet_assets: OperatorFleetAsset[] | null
  guide_profiles: OperatorGuideProfile[] | null
  gallery_media: OperatorGalleryItem[] | null
  public_policies: OperatorPublicPolicies | null
  is_public: boolean
  setup_completed: boolean
}

export interface OperatorVerificationReview {
  id: string
  operator_id: string
  verification_key: string
  decision: 'verified' | 'rejected' | 'cleared'
  notes: string | null
  reviewed_by: string | null
  reviewed_at: string
}

export interface OperatorPublicMetrics {
  avg_rating: number | null
  total_reviews: number
  total_completed_bookings: number
  total_travelers_served: number
  cancellation_rate: number | null
  verified_badge_count: number
  avg_communication: number | null
  avg_punctuality: number | null
  avg_transport: number | null
  avg_guide: number | null
  avg_safety: number | null
  avg_cleanliness: number | null
  avg_value: number | null
  avg_itinerary: number | null
}

export interface OperatorStorefrontAnalytics {
  profile_views: number
  unique_visitors: number
  engaged_visitors: number
  cta_clicks: number
  tour_clicks: number
  booking_starts: number
  attributed_booking_starts: number
  engagement_rate: number
  attributed_conversion_rate: number
  last_viewed_at: string | null
}

export interface OperatorStorefrontResponseMetrics {
  traveler_messages: number
  responded_messages: number
  response_rate: number
  avg_response_minutes: number
}

export interface OperatorStorefrontEvent {
  id: string
  operator_id: string
  event_type: 'profile_view' | 'cta_click' | 'tour_click' | 'booking_start'
  slug: string | null
  tour_id: string | null
  session_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

function getOrCreateStorefrontSessionId(): string | null {
  if (typeof window === 'undefined') return null

  const storageKey = 'tripavail.storefront-session-id'
  const existing = window.localStorage.getItem(storageKey)
  if (existing) return existing

  const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `storefront-${Date.now()}`

  window.localStorage.setItem(storageKey, next)
  return next
}

export const operatorPublicService = {
  async getProfileBySlug(slug: string): Promise<OperatorPublicProfile | null> {
    const { data, error } = await supabase
      .from('tour_operator_profiles')
      .select(
        'user_id, slug, company_name, business_name, company_logo_url, description, primary_city, coverage_range, categories, years_experience, team_size, registration_number, phone_number, email, verification_documents, verification_urls, fleet_assets, guide_profiles, gallery_media, public_policies, is_public, setup_completed',
      )
      .eq('slug', slug)
      .eq('is_public', true)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data as OperatorPublicProfile | null
  },

  async getProfileById(operatorId: string): Promise<OperatorPublicProfile | null> {
    const { data, error } = await supabase
      .from('tour_operator_profiles')
      .select(
        'user_id, slug, company_name, business_name, company_logo_url, description, primary_city, coverage_range, categories, years_experience, team_size, registration_number, phone_number, email, verification_documents, verification_urls, fleet_assets, guide_profiles, gallery_media, public_policies, is_public, setup_completed',
      )
      .eq('user_id', operatorId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data as OperatorPublicProfile | null
  },

  async getMetrics(operatorId: string): Promise<OperatorPublicMetrics | null> {
    const { data, error } = await supabase
      .from('operator_public_metrics')
      .select('avg_rating, total_reviews, total_completed_bookings, total_travelers_served, cancellation_rate, verified_badge_count, avg_communication, avg_punctuality, avg_transport, avg_guide, avg_safety, avg_cleanliness, avg_value, avg_itinerary')
      .eq('operator_id', operatorId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data as OperatorPublicMetrics | null
  },

  async getPublishedTours(operatorId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tours')
      .select('id, title, description, price, currency, duration, location, images, rating, review_count, difficulty_level')
      .eq('operator_id', operatorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)
    return (data ?? []).map((tour: any) => ({
      ...tour,
      price_per_person: Number(tour.price ?? 0),
      duration_days: tour.duration ?? null,
      cover_image_url: Array.isArray(tour.images) ? (tour.images[0] ?? null) : null,
      tags: [],
    }))
  },

  async getAllReviewsWithReplies(operatorId: string): Promise<TourReviewWithReply[]> {
    const { data, error } = await supabase
      .from('tour_booking_reviews')
      .select('*, tours!inner(operator_id, title), reply:tour_review_replies(id, review_id, operator_id, body, created_at, updated_at)')
      .eq('tours.operator_id', operatorId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw new Error(error.message)
    return (data ?? []).map((row: any) => ({
      ...row,
      tour_title: row.tours?.title ?? null,
      reply: Array.isArray(row.reply) ? (row.reply[0] ?? null) : (row.reply ?? null),
    })) as TourReviewWithReply[]
  },

  async getAwards(operatorId: string): Promise<OperatorAward[]> {
    const { data, error } = await supabase
      .from('operator_awards')
      .select('id, award_code, award_name, awarded_at, expires_at, metadata, award_source, admin_note')
      .eq('operator_id', operatorId)
      .order('awarded_at', { ascending: false })

    if (error) throw new Error(error.message)
    const now = Date.now()
    return ((data ?? []) as OperatorAward[]).filter((award) => !award.expires_at || new Date(award.expires_at).getTime() > now)
  },

  async getVerificationReviews(operatorId: string): Promise<OperatorVerificationReview[]> {
    const { data, error } = await supabase
      .from('operator_verification_reviews')
      .select('id, operator_id, verification_key, decision, notes, reviewed_by, reviewed_at')
      .eq('operator_id', operatorId)
      .order('reviewed_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as OperatorVerificationReview[]
  },

  async recordStorefrontEvent(params: {
    operatorId: string
    eventType: 'profile_view' | 'cta_click' | 'tour_click' | 'booking_start'
    slug?: string | null
    tourId?: string | null
    metadata?: Record<string, unknown>
  }) {
    const { error } = await (supabase as any).rpc('record_operator_storefront_event', {
      p_operator_id: params.operatorId,
      p_event_type: params.eventType,
      p_slug: params.slug ?? null,
      p_tour_id: params.tourId ?? null,
      p_session_id: getOrCreateStorefrontSessionId(),
      p_metadata: params.metadata ?? {},
    })

    if (error) throw new Error(error.message)
    return { success: true }
  },

  async getStorefrontAnalytics(operatorId: string, days = 30): Promise<OperatorStorefrontAnalytics | null> {
    const { data, error } = await (supabase as any).rpc('get_operator_storefront_analytics', {
      p_operator_id: operatorId,
      p_days: days,
    })

    if (error) throw new Error(error.message)
    const row = Array.isArray(data) ? data[0] : data
    return (row ?? null) as OperatorStorefrontAnalytics | null
  },

  async getStorefrontResponseMetrics(operatorId: string, days = 90): Promise<OperatorStorefrontResponseMetrics | null> {
    const { data, error } = await (supabase as any).rpc('get_operator_storefront_response_metrics', {
      p_operator_id: operatorId,
      p_days: days,
    })

    if (error) {
      if (isMissingRpcError(error)) return null
      throw new Error(error.message)
    }
    const row = Array.isArray(data) ? data[0] : data
    return (row ?? null) as OperatorStorefrontResponseMetrics | null
  },

  async listStorefrontEvents(operatorId: string, limit = 200): Promise<OperatorStorefrontEvent[]> {
    const { data, error } = await supabase
      .from('operator_storefront_events')
      .select('id, operator_id, event_type, slug, tour_id, session_id, metadata, created_at')
      .eq('operator_id', operatorId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)
    return (data ?? []) as OperatorStorefrontEvent[]
  },

  async submitOperatorReport(params: {
    operatorId: string
    reason: string
    details?: string | null
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Please sign in to submit a report')

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_entity_type: 'partner',
      target_entity_id: params.operatorId,
      report_reason: params.reason.trim(),
      details: params.details?.trim() || null,
    })

    if (error) throw new Error(error.message)
    return { success: true }
  },
}
