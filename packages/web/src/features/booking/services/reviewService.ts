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
}

export interface SubmitReviewParams {
  bookingId: string
  tourId: string
  rating: number
  title?: string
  body?: string
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
