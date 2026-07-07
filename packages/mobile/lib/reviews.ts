import { supabase } from '@/lib/supabase'

export interface TourReview {
  id: string
  rating: number
  title: string | null
  body: string | null
  created_at: string
  reply: { body: string; created_at: string } | null
}

/** Published reviews for a tour, with the operator's reply (mirrors web reviewService). */
export async function fetchTourReviews(tourId: string): Promise<TourReview[]> {
  const { data, error } = await supabase
    .from('tour_booking_reviews')
    .select('id,rating,title,body,created_at,reply:tour_review_replies(body,created_at)')
    .eq('tour_id', tourId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    rating: Number(r.rating ?? 0),
    title: r.title ?? null,
    body: r.body ?? null,
    created_at: r.created_at,
    reply: Array.isArray(r.reply) ? (r.reply[0] ?? null) : (r.reply ?? null),
  }))
}

/** The traveller's existing review for a booking, or null (to gate the form). */
export async function getTravelerReviewForBooking(bookingId: string): Promise<TourReview | null> {
  const { data, error } = await supabase
    .from('tour_booking_reviews')
    .select('id,rating,title,body,created_at,reply:tour_review_replies(body,created_at)')
    .eq('booking_id', bookingId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const r: any = data
  return {
    id: r.id,
    rating: Number(r.rating ?? 0),
    title: r.title ?? null,
    body: r.body ?? null,
    created_at: r.created_at,
    reply: Array.isArray(r.reply) ? (r.reply[0] ?? null) : (r.reply ?? null),
  }
}

export async function fetchBookingForReview(
  bookingId: string,
): Promise<{ id: string; tour_id: string; status: string | null; tourTitle: string | null }> {
  const { data, error } = await supabase
    .from('tour_bookings')
    .select('id,tour_id,status,tour:tours(title)')
    .eq('id', bookingId)
    .single()
  if (error) throw error
  const d: any = data
  return {
    id: d.id,
    tour_id: d.tour_id,
    status: d.status,
    tourTitle: Array.isArray(d.tour) ? (d.tour[0]?.title ?? null) : (d.tour?.title ?? null),
  }
}

export async function submitTourReview(params: {
  bookingId: string
  tourId: string
  travelerId: string
  rating: number
  title?: string
  body?: string
}): Promise<void> {
  const { error } = await supabase.from('tour_booking_reviews').insert({
    booking_id: params.bookingId,
    tour_id: params.tourId,
    traveler_id: params.travelerId,
    rating: params.rating,
    title: params.title?.trim() || null,
    body: params.body?.trim() || null,
    status: 'published',
  })
  if (error) throw error
}
