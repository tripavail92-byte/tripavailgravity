import { supabase } from '@/lib/supabase'

export interface OperatorTour {
  id: string
  title: string
  status: string | null
  is_published: boolean | null
  is_active: boolean | null
  rating: number | null
  price: number
  currency: string
  images: string[] | null
  draft_data: any
  completion_percentage: number | null
  last_edited_at: string | null
}

export async function fetchOperatorTours(userId: string): Promise<OperatorTour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select(
      'id,title,status,is_published,is_active,rating,price,currency,images,draft_data,completion_percentage,last_edited_at',
    )
    .eq('operator_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as OperatorTour[]
}

export interface OperatorBooking {
  id: string
  status: string | null
  total_price: number
  booking_date: string | null
  pax_count: number | null
  payment_status: string | null
  tour: { title: string; currency: string } | null
}

export async function fetchOperatorBookings(userId: string): Promise<OperatorBooking[]> {
  const { data, error } = await supabase
    .from('tour_bookings')
    .select(
      'id,status,total_price,booking_date,pax_count,payment_status,tour:tours!inner(title,currency,operator_id)',
    )
    .eq('tour.operator_id', userId)
    .order('booking_date', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((b: any) => ({
    id: b.id,
    status: b.status,
    total_price: b.total_price,
    booking_date: b.booking_date,
    pax_count: b.pax_count,
    payment_status: b.payment_status,
    tour: Array.isArray(b.tour) ? (b.tour[0] ?? null) : b.tour,
  }))
}

export interface OperatorStats {
  activeTours: number
  drafts: number
  bookings: number
  avgRating: number | null
}

export function computeOperatorStats(
  tours: OperatorTour[],
  bookings: OperatorBooking[],
): OperatorStats {
  const active = tours.filter((t) => t.is_published && t.status === 'live')
  const drafts = tours.filter((t) => !t.is_published)
  const rated = active.filter((t) => (t.rating ?? 0) > 0)
  const avg = rated.length
    ? rated.reduce((s, t) => s + Number(t.rating), 0) / rated.length
    : null
  const confirmed = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed')
  return {
    activeTours: active.length,
    drafts: drafts.length,
    bookings: confirmed.length,
    avgRating: avg,
  }
}

export interface OperatorReview {
  id: string
  rating: number
  title: string | null
  body: string | null
  created_at: string
  tour: { title: string } | null
  reply: { id: string; body: string } | null
}

export async function fetchOperatorReviews(userId: string): Promise<OperatorReview[]> {
  const { data, error } = await supabase
    .from('tour_booking_reviews')
    .select(
      'id,rating,title,body,created_at,tour:tours!inner(title,operator_id),reply:tour_review_replies(id,body)',
    )
    .eq('tour.operator_id', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    rating: Number(r.rating ?? 0),
    title: r.title ?? null,
    body: r.body ?? null,
    created_at: r.created_at,
    tour: Array.isArray(r.tour) ? (r.tour[0] ?? null) : r.tour,
    reply: Array.isArray(r.reply) ? (r.reply[0] ?? null) : (r.reply ?? null),
  }))
}

export async function submitReviewReply(
  reviewId: string,
  body: string,
  operatorId: string,
): Promise<void> {
  const { error } = await supabase
    .from('tour_review_replies')
    .insert({ review_id: reviewId, operator_id: operatorId, body: body.trim() })
  if (error) throw error
}
