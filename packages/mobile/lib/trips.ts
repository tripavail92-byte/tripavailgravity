import { supabase } from '@/lib/supabase'

/**
 * My Trips — port of web MyTripsPage data layer. The web merges TWO sources
 * (bookingService.getTravelerBookings): tour_bookings (with the schedule's
 * real departure time) AND package_bookings (hotel stays, with check-in/out).
 * Mobile previously showed only tour bookings, which is why "trips weren't
 * loading" for accounts whose trips are package stays.
 * Settlement math mirrors travelerBookingPresentation:
 * paidOnline = amount_paid_online ?? upfront_amount ?? total_price,
 * deposit when remaining_amount > 0.
 */

export interface TripItem {
  id: string
  kind: 'tour' | 'package'
  refId: string | null
  title: string
  image: string | null
  currency: string
  status: string | null
  paymentStatus: string | null
  bookedAt: string | null
  tripDate: string | null
  durationLabel: string | null
  guests: number | null
  total: number
  paidOnline: number
  remaining: number
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : 0
  return Number.isFinite(n) ? n : 0
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

function nightsBetween(checkIn: string | null, checkOut: string | null): number | null {
  if (!checkIn || !checkOut) return null
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return null
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

async function fetchTourTrips(userId: string): Promise<TripItem[]> {
  const { data, error } = await supabase
    .from('tour_bookings')
    .select(
      '*, tours(id, title, images, duration, currency), tour_schedules!tour_bookings_schedule_id_fkey(start_time, end_time)',
    )
    .eq('traveler_id', userId)
    .order('booking_date', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []).map((row: any) => {
    const tour = one<Record<string, any>>(row.tours)
    const schedule = one<Record<string, any>>(row.tour_schedules)
    const paidOnline = num(row.amount_paid_online ?? row.upfront_amount ?? row.total_price)
    return {
      id: row.id,
      kind: 'tour' as const,
      refId: tour?.id ?? null,
      title: tour?.title ?? 'Tour booking',
      image: Array.isArray(tour?.images) ? (tour.images[0] ?? null) : null,
      currency: tour?.currency ?? 'PKR',
      status: row.status ?? null,
      paymentStatus: row.payment_status ?? null,
      bookedAt: row.booking_date ?? null,
      tripDate: schedule?.start_time ?? row.booking_date ?? null,
      durationLabel: tour?.duration ?? null,
      guests: row.pax_count != null ? Number(row.pax_count) : null,
      total: num(row.total_price),
      paidOnline,
      remaining: num(row.remaining_amount),
    }
  })
}

async function fetchPackageTrips(userId: string): Promise<TripItem[]> {
  const { data, error } = await supabase
    .from('package_bookings')
    .select('*, packages(id, name, cover_image, currency)')
    .eq('traveler_id', userId)
    .order('booking_date', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []).map((row: any) => {
    const pkg = one<Record<string, any>>(row.packages)
    const nights = nightsBetween(row.check_in_date ?? null, row.check_out_date ?? null)
    const paidOnline = num(row.amount_paid_online ?? row.upfront_amount ?? row.total_price)
    return {
      id: row.id,
      kind: 'package' as const,
      refId: pkg?.id ?? null,
      title: pkg?.name ?? 'Package stay',
      image: pkg?.cover_image ?? null,
      currency: pkg?.currency ?? 'PKR',
      status: row.status ?? null,
      paymentStatus: row.payment_status ?? null,
      bookedAt: row.booking_date ?? null,
      tripDate: row.check_in_date ?? row.booking_date ?? null,
      durationLabel: nights ? `${nights} night${nights === 1 ? '' : 's'}` : null,
      guests: row.guest_count != null ? Number(row.guest_count) : null,
      total: num(row.total_price),
      paidOnline,
      remaining: num(row.remaining_amount),
    }
  })
}

export async function fetchMyTrips(userId: string): Promise<TripItem[]> {
  const [tours, packages] = await Promise.all([fetchTourTrips(userId), fetchPackageTrips(userId)])
  return [...tours, ...packages].sort((a, b) => {
    const ad = new Date(a.tripDate ?? a.bookedAt ?? 0).getTime()
    const bd = new Date(b.tripDate ?? b.bookedAt ?? 0).getTime()
    return bd - ad
  })
}

/** Same split rule as web: future + not-cancelled = upcoming; everything else past. */
export function splitTrips(trips: TripItem[]): { upcoming: TripItem[]; past: TripItem[] } {
  const now = Date.now()
  const upcoming: TripItem[] = []
  const past: TripItem[] = []
  for (const t of trips) {
    const when = new Date(t.tripDate ?? t.bookedAt ?? 0).getTime()
    if (when >= now && t.status !== 'cancelled') upcoming.push(t)
    else past.push(t)
  }
  upcoming.sort((a, b) => new Date(a.tripDate ?? 0).getTime() - new Date(b.tripDate ?? 0).getTime())
  return { upcoming, past }
}
