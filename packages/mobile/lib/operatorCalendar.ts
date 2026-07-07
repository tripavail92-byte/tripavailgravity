import { supabase } from '@/lib/supabase'

import { fetchPauseBookings } from '@/lib/roleSettings'

/**
 * Operator calendar — port of web operatorPortalService.getCalendarData.
 * Reads tour_schedules joined through tours!inner(operator_id) and computes
 * the same summary (upcoming departures, seats sold, occupancy, active days).
 */

export interface OperatorSchedule {
  id: string
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  status: string | null
  tour: {
    id: string
    title: string
    city: string | null
    country: string | null
    image: string | null
    is_published: boolean
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

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

export async function fetchOperatorCalendar(operatorId: string): Promise<{
  schedules: OperatorSchedule[]
  summary: OperatorCalendarSummary
}> {
  const [{ data, error }, bookingsPaused] = await Promise.all([
    supabase
      .from('tour_schedules')
      .select(
        `id, start_time, end_time, capacity, booked_count, status,
         tours!inner(id, title, location, images, is_published, operator_id)`,
      )
      .eq('tours.operator_id', operatorId)
      .order('start_time', { ascending: true }),
    fetchPauseBookings(operatorId),
  ])
  if (error) throw error

  const schedules: OperatorSchedule[] = (data ?? []).map((row: any) => {
    const tour = Array.isArray(row.tours) ? row.tours[0] : row.tours
    const location = (tour?.location ?? {}) as Record<string, any>
    return {
      id: row.id,
      start_time: row.start_time,
      end_time: row.end_time ?? row.start_time,
      capacity: Number(row.capacity || 0),
      booked_count: Number(row.booked_count || 0),
      status: row.status ?? null,
      tour: {
        id: tour?.id,
        title: tour?.title ?? 'Untitled tour',
        city: location.city ?? null,
        country: location.country ?? null,
        image: Array.isArray(tour?.images) ? (tour.images[0] ?? null) : null,
        is_published: Boolean(tour?.is_published),
      },
    }
  })

  const now = new Date()
  const upcoming = schedules.filter((s) => new Date(s.end_time) >= now)
  const seatsSold = schedules.reduce((sum, s) => sum + s.booked_count, 0)
  const totalCapacity = schedules.reduce((sum, s) => sum + s.capacity, 0)
  const activeDays = new Set(upcoming.map((s) => dayKey(s.start_time))).size

  return {
    schedules,
    summary: {
      totalDepartures: schedules.length,
      upcomingDepartures: upcoming.length,
      seatsSold,
      totalCapacity,
      occupancyRate: totalCapacity > 0 ? Math.round((seatsSold / totalCapacity) * 100) : 0,
      activeDays,
      bookingsPaused,
    },
  }
}

/** Group upcoming schedules into agenda sections by day, soonest first. */
export function groupSchedulesByDay(
  schedules: OperatorSchedule[],
): Array<{ day: string; items: OperatorSchedule[] }> {
  const upcoming = schedules.filter((s) => new Date(s.end_time) >= new Date())
  const byDay = new Map<string, OperatorSchedule[]>()
  for (const s of upcoming) {
    const key = dayKey(s.start_time)
    const list = byDay.get(key) ?? []
    list.push(s)
    byDay.set(key, list)
  }
  return Array.from(byDay.entries()).map(([day, items]) => ({ day, items }))
}
