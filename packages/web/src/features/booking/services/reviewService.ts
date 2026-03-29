import { supabase } from '@/lib/supabase'

export interface TourReview {
  id: string
  booking_id: string
  traveler_id: string
  tour_id: string
  rating: number
  title: string | null
  body: string | null
  status: 'published' | 'removed'
  created_at: string
  updated_at: string
  // Category ratings (optional — null when not submitted)
  rating_communication: number | null
  rating_punctuality: number | null
  rating_transport: number | null
  rating_guide: number | null
  rating_safety: number | null
  rating_cleanliness: number | null
  rating_value: number | null
  rating_itinerary: number | null
}

export interface SubmitReviewParams {
  bookingId: string
  tourId: string
  rating: number
  title?: string
  body?: string
  // Category ratings (all optional)
  ratingCommunication?: number
  ratingPunctuality?: number
  ratingTransport?: number
  ratingGuide?: number
  ratingSafety?: number
  ratingCleanliness?: number
  ratingValue?: number
  ratingItinerary?: number
}

export const reviewService = {
  async submitTourReview(params: SubmitReviewParams): Promise<TourReview> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('tour_booking_reviews')
      .insert({
        booking_id: params.bookingId,
        traveler_id: user.id,
        tour_id: params.tourId,
        rating: params.rating,
        title: params.title?.trim() || null,
        body: params.body?.trim() || null,
        rating_communication: params.ratingCommunication ?? null,
        rating_punctuality:   params.ratingPunctuality   ?? null,
        rating_transport:     params.ratingTransport     ?? null,
        rating_guide:         params.ratingGuide         ?? null,
        rating_safety:        params.ratingSafety        ?? null,
        rating_cleanliness:   params.ratingCleanliness   ?? null,
        rating_value:         params.ratingValue         ?? null,
        rating_itinerary:     params.ratingItinerary     ?? null,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data as TourReview
  },

  async getTourReviews(tourId: string): Promise<TourReview[]> {
    const { data, error } = await supabase
      .from('tour_booking_reviews')
      .select('*')
      .eq('tour_id', tourId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)
    return (data ?? []) as TourReview[]
  },

  async getTourReviewsWithReplies(tourId: string): Promise<TourReviewWithReply[]> {
    const { data, error } = await supabase
      .from('tour_booking_reviews')
      .select('*, reply:tour_review_replies(id, review_id, operator_id, body, created_at, updated_at)')
      .eq('tour_id', tourId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)
    return (data ?? []).map((row: any) => ({
      ...row,
      reply: Array.isArray(row.reply) ? (row.reply[0] ?? null) : (row.reply ?? null),
    })) as TourReviewWithReply[]
  },

  async getTravelerReviewForBooking(bookingId: string): Promise<TourReview | null> {
    const { data, error } = await supabase
      .from('tour_booking_reviews')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data as TourReview | null
  },
}

export interface TourReviewReply {
  id: string
  review_id: string
  operator_id: string
  body: string
  created_at: string
  updated_at: string
}

export interface TourReviewWithReply extends TourReview {
  reply: TourReviewReply | null
}

export const operatorReviewService = {
  /** All published reviews on tours owned by the authenticated operator */
  async listMyReviews(): Promise<TourReviewWithReply[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('tour_booking_reviews')
      .select('*, tours!inner(operator_id), reply:tour_review_replies(id, review_id, operator_id, body, created_at, updated_at)')
      .eq('tours.operator_id', user.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw new Error(error.message)
    return (data ?? []).map((row: any) => ({
      ...row,
      reply: Array.isArray(row.reply) ? (row.reply[0] ?? null) : (row.reply ?? null),
    })) as TourReviewWithReply[]
  },

  async submitReply(reviewId: string, body: string): Promise<TourReviewReply> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('tour_review_replies')
      .insert({ review_id: reviewId, operator_id: user.id, body: body.trim() })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data as TourReviewReply
  },

  async updateReply(replyId: string, body: string): Promise<TourReviewReply> {
    const { data, error } = await supabase
      .from('tour_review_replies')
      .update({ body: body.trim() })
      .eq('id', replyId)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data as TourReviewReply
  },
}

// Admin functions — called via Supabase RPC (service role bypass not needed for select here,
// but admin moderation calls the DB function which is SECURITY DEFINER)
export const adminReviewService = {
  async listReviews(limit = 100): Promise<any[]> {
    const { data, error } = await supabase.rpc('admin_list_tour_reviews', { p_limit: limit })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async moderateReview(reviewId: string, action: 'remove' | 'restore'): Promise<void> {
    const { error } = await supabase.rpc('admin_moderate_tour_review', {
      p_review_id: reviewId,
      p_action: action,
    })
    if (error) throw new Error(error.message)
  },
}
