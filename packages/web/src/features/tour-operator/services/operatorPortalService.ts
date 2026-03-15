import { startOfDay } from 'date-fns'

import { supabase } from '@/lib/supabase'
import { tourOperatorSettingsService } from '@/services/tourOperatorSettingsService'

export interface OperatorScheduleRecord {
  id: string
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  status: 'scheduled' | 'cancelled' | 'completed'
  price_override?: number | null
  tours: {
    id: string
    title: string
    location?: {
      city?: string
      country?: string
    } | null
    images?: string[] | null
    workflow_status?: string | null
    is_published?: boolean | null
  }
}

export interface OperatorBookingRecord {
  id: string
  tour_id: string
  schedule_id: string
  traveler_id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  total_price: number
  pax_count: number
  booking_date: string
  expires_at?: string | null
  payment_status?: 'unpaid' | 'processing' | 'partially_paid' | 'balance_pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | null
  payment_collection_mode?: 'full_online' | 'partial_online' | null
  payment_method?: string | null
  upfront_amount?: number | null
  remaining_amount?: number | null
  amount_paid_online?: number | null
  amount_due_to_operator?: number | null
  payment_policy_text?: string | null
  metadata?: Record<string, any> | null
  paid_at?: string | null
  tours: {
    id: string
    title: string
    location?: {
      city?: string
      country?: string
    } | null
    images?: string[] | null
  }
  tour_schedules: {
    id: string
    start_time: string
    end_time: string
    capacity: number
    booked_count: number
    status: 'scheduled' | 'cancelled' | 'completed'
  }
  traveler: {
    id: string
    full_name: string
    first_name?: string | null
    last_name?: string | null
    avatar_url?: string | null
    email?: string | null
    phone?: string | null
    email_verified: boolean
    phone_verified: boolean
    allow_messages_from_anyone: boolean
    contact_mode: 'direct' | 'messaging_only'
  }
}

export interface OperatorCalendarSummary {
  totalDepartures: number
  upcomingDepartures: number
  seatsSold: number
  totalCapacity: number
  occupancyRate: number
  activeDays: number
  bookingsPaused: boolean
}

function mapScheduleRow(row: any): OperatorScheduleRecord {
  return {
    id: row.id,
    start_time: row.start_time,
    end_time: row.end_time,
    capacity: Number(row.capacity || 0),
    booked_count: Number(row.booked_count || 0),
    status: row.status,
    price_override: row.price_override ?? null,
    tours: {
      id: row.tours?.id,
      title: row.tours?.title || 'Untitled Tour',
      location: row.tours?.location ?? null,
      images: row.tours?.images ?? [],
      workflow_status: row.tours?.workflow_status ?? null,
      is_published: row.tours?.is_published ?? null,
    },
  }
}

function mapBookingRow(row: any): OperatorBookingRecord {
  return {
    id: row.id,
    tour_id: row.tour_id,
    schedule_id: row.schedule_id,
    traveler_id: row.traveler_id,
    status: row.status,
    total_price: Number(row.total_price || 0),
    pax_count: Number(row.pax_count || 0),
    booking_date: row.booking_date,
    expires_at: row.expires_at ?? null,
    payment_status: row.payment_status ?? null,
    payment_collection_mode: row.payment_collection_mode ?? null,
    payment_method: row.payment_method ?? null,
    upfront_amount: row.upfront_amount ?? null,
    remaining_amount: row.remaining_amount ?? null,
    amount_paid_online: row.amount_paid_online ?? null,
    amount_due_to_operator: row.amount_due_to_operator ?? null,
    payment_policy_text: row.payment_policy_text ?? null,
    metadata: row.metadata ?? null,
    paid_at: row.paid_at ?? null,
    tours: {
      id: row.tours?.id,
      title: row.tours?.title || 'Untitled Tour',
      location: row.tours?.location ?? null,
      images: row.tours?.images ?? [],
    },
    tour_schedules: {
      id: row.tour_schedules?.id,
      start_time: row.tour_schedules?.start_time,
      end_time: row.tour_schedules?.end_time,
      capacity: Number(row.tour_schedules?.capacity || 0),
      booked_count: Number(row.tour_schedules?.booked_count || 0),
      status: row.tour_schedules?.status,
    },
    traveler: {
      id: row.traveler?.id || row.traveler_id,
      full_name: row.traveler?.full_name || 'Traveler',
      first_name: row.traveler?.first_name ?? null,
      last_name: row.traveler?.last_name ?? null,
      avatar_url: row.traveler?.avatar_url ?? null,
      email: row.traveler?.email ?? null,
      phone: row.traveler?.phone ?? null,
      email_verified: Boolean(row.traveler?.email_verified),
      phone_verified: Boolean(row.traveler?.phone_verified),
      allow_messages_from_anyone: Boolean(row.traveler?.allow_messages_from_anyone ?? true),
      contact_mode: row.traveler?.contact_mode === 'direct' ? 'direct' : 'messaging_only',
    },
  }
}

export const operatorPortalService = {
  async getCalendarData(operatorId: string): Promise<{
    schedules: OperatorScheduleRecord[]
    summary: OperatorCalendarSummary
  }> {
    const [{ data, error }, settings] = await Promise.all([
      supabase
        .from('tour_schedules')
        .select(`
          id,
          start_time,
          end_time,
          capacity,
          booked_count,
          status,
          price_override,
          tours!inner(
            id,
            title,
            location,
            images,
            workflow_status,
            is_published,
            operator_id
          )
        `)
        .eq('tours.operator_id', operatorId)
        .order('start_time', { ascending: true }),
      tourOperatorSettingsService.getSettings(operatorId),
    ])

    if (error) throw error

    const schedules = (data ?? []).map(mapScheduleRow)
    const now = new Date()
    const upcoming = schedules.filter((schedule) => new Date(schedule.end_time) >= now)
    const seatsSold = schedules.reduce((sum, schedule) => sum + schedule.booked_count, 0)
    const totalCapacity = schedules.reduce((sum, schedule) => sum + schedule.capacity, 0)
    const activeDays = new Set(
      upcoming.map((schedule) => startOfDay(new Date(schedule.start_time)).toISOString()),
    ).size

    return {
      schedules,
      summary: {
        totalDepartures: schedules.length,
        upcomingDepartures: upcoming.length,
        seatsSold,
        totalCapacity,
        occupancyRate: totalCapacity > 0 ? Math.round((seatsSold / totalCapacity) * 100) : 0,
        activeDays,
        bookingsPaused: settings.pause_bookings,
      },
    }
  },

  async getBookingsData(operatorId: string): Promise<{
    bookings: OperatorBookingRecord[]
    bookingsPaused: boolean
  }> {
    const [{ data, error }, settings] = await Promise.all([
      supabase.rpc('operator_get_tour_bookings' as any),
      tourOperatorSettingsService.getSettings(operatorId),
    ])

    if (error) throw error

    return {
      bookings: (data ?? []).map(mapBookingRow),
      bookingsPaused: settings.pause_bookings,
    }
  },

  async performBookingAction(params: {
    bookingId: string
    action: 'cancel' | 'complete' | 'resend_confirmation'
    reason?: string
  }): Promise<{
    bookingId: string
    status: OperatorBookingRecord['status']
    action: 'cancel' | 'complete' | 'resend_confirmation'
    notificationCount: number
  }> {
    const { data, error } = await supabase.rpc('operator_manage_tour_booking' as any, {
      p_booking_id: params.bookingId,
      p_action: params.action,
      p_reason: params.reason?.trim() || null,
    })

    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data

    if (!row) {
      throw new Error('No booking action result returned')
    }

    return {
      bookingId: row.booking_id,
      status: row.status,
      action: row.action,
      notificationCount: Number(row.notification_count || 0),
    }
  },
}

function bookingMetadataValue(booking: OperatorBookingRecord, key: string) {
  const value = booking.metadata?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export function isCancellationLocked(booking: OperatorBookingRecord) {
  if (booking.status !== 'confirmed') return false
  return new Date(booking.tour_schedules.start_time) <= new Date(Date.now() + 24 * 60 * 60 * 1000)
}

export function isAwaitingTravelerCompletionConfirmation(booking: OperatorBookingRecord) {
  return booking.status === 'completed'
    && Boolean(bookingMetadataValue(booking, 'operator_completion_confirmed_at'))
    && !Boolean(bookingMetadataValue(booking, 'traveler_completion_confirmed_at'))
}

export function isTravelerCompletionConfirmed(booking: OperatorBookingRecord) {
  return Boolean(bookingMetadataValue(booking, 'traveler_completion_confirmed_at'))
}