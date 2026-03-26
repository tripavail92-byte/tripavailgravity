import { supabase } from '@/lib/supabase'
import type { TourReviewWithReply } from '@/features/booking/services/reviewService'

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
  is_public: boolean
  setup_completed: boolean
}

export interface OperatorPublicMetrics {
  avg_rating: number | null
  total_reviews: number
  total_completed_bookings: number
  total_travelers_served: number
  cancellation_rate: number | null
  verified_badge_count: number
}

export const operatorPublicService = {
  async getProfileBySlug(slug: string): Promise<OperatorPublicProfile | null> {
    const { data, error } = await supabase
      .from('tour_operator_profiles')
      .select(
        'user_id, slug, company_name, business_name, company_logo_url, description, primary_city, coverage_range, categories, years_experience, team_size, is_public, setup_completed',
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
        'user_id, slug, company_name, business_name, company_logo_url, description, primary_city, coverage_range, categories, years_experience, team_size, is_public, setup_completed',
      )
      .eq('user_id', operatorId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data as OperatorPublicProfile | null
  },

  async getMetrics(operatorId: string): Promise<OperatorPublicMetrics | null> {
    const { data, error } = await supabase
      .from('operator_public_metrics')
      .select('avg_rating, total_reviews, total_completed_bookings, total_travelers_served, cancellation_rate, verified_badge_count')
      .eq('operator_id', operatorId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data as OperatorPublicMetrics | null
  },

  async getPublishedTours(operatorId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tours')
      .select('id, title, description, price_per_person, currency, duration_days, location, cover_image_url, rating, review_count, difficulty_level, tags')
      .eq('operator_id', operatorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)
    return data ?? []
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
}
