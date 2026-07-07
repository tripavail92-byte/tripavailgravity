import { supabase } from '@/lib/supabase'

export interface TourSchedule {
  id: string
  start_time: string
  end_time: string | null
  capacity: number
  booked_count: number
  price_override: number | null
  status: string
}

export async function fetchTourSchedules(tourId: string): Promise<TourSchedule[]> {
  const { data, error } = await supabase
    .from('tour_schedules')
    .select('id,start_time,end_time,capacity,booked_count,price_override,status')
    .eq('tour_id', tourId)
    .eq('status', 'scheduled')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(30)
  if (error) throw error
  return (data ?? []) as TourSchedule[]
}

/** Live seats left for a schedule (capacity − confirmed − active holds). */
export async function getAvailableSlots(scheduleId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_available_slots', {
    schedule_id_param: scheduleId,
  })
  if (error) throw error
  return Number(data ?? 0)
}

export interface PromoPreview {
  status: string
  appliedDiscount: number
  discountedTotal: number
  code: string | null
  title: string | null
}

export async function inspectPromo(
  tourId: string,
  code: string,
  total: number,
): Promise<PromoPreview> {
  const { data, error } = await supabase.rpc('inspect_tour_promotion', {
    p_tour_id: tourId,
    p_promo_code: code,
    p_booking_total: total,
  })
  if (error) throw error
  const row: any = Array.isArray(data) ? data[0] : data
  return {
    status: row?.resolution_status ?? 'invalid',
    appliedDiscount: Number(row?.applied_discount_value ?? 0),
    discountedTotal: Number(row?.discounted_booking_total ?? total),
    code: row?.code ?? null,
    title: row?.title ?? null,
  }
}

export async function requestBookingCancellation(bookingId: string): Promise<void> {
  const { error } = await supabase.rpc('traveler_request_tour_booking_cancellation', {
    p_booking_id: bookingId,
  })
  if (error) throw error
}

export async function fetchTourForCheckout(id: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const { data, error } = await supabase
    .from('tours')
    .select(
      'id,title,price,currency,images,location,deposit_required,require_deposit,deposit_percentage,pricing_tiers',
    )
    .eq(isUuid ? 'id' : 'slug', id)
    .single()
  if (error) throw error
  return data as any
}
