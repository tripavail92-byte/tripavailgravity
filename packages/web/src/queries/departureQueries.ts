import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

/**
 * Next upcoming departure per tour, for the card grids.
 *
 * Tour cards want to show a real departure date, but no list query fetched one —
 * `tour_schedules` was only ever read one tour at a time on the detail page. This
 * takes the ids already on screen and resolves them in ONE query (not N), then
 * reduces to the earliest upcoming departure per tour.
 *
 * Missing is normal and fine: a tour with no future schedule simply renders no
 * date pill rather than a fabricated one.
 */
export function useNextDepartures(tourIds: string[]) {
  // Stable key regardless of the order the grid happens to render in.
  const ids = [...new Set(tourIds.filter(Boolean))].sort()

  return useQuery({
    queryKey: ['tours', 'next-departures', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from('tour_schedules')
        .select('tour_id,start_time')
        .in('tour_id', ids)
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (error) {
        // A missing date must never break a grid — degrade to "no date shown".
        console.error('[departureQueries] next departures failed:', error.message)
        return {}
      }

      const out: Record<string, string> = {}
      for (const row of (data ?? []) as { tour_id: string; start_time: string }[]) {
        // Rows arrive ascending, so the first one seen per tour is the soonest.
        if (row.tour_id && !out[row.tour_id]) out[row.tour_id] = row.start_time
      }
      return out
    },
  })
}

/** "Sat 14 Sep" — compact enough for a card pill. */
export function formatDepartureDate(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

/**
 * ALL upcoming departures per tour (ascending), for date-filtered search: a tour
 * qualifies for a chosen date D if it has any departure on/after D. useNextDepartures
 * only exposes the soonest, which can't answer "does a later departure fall on/after D".
 */
export function useUpcomingDepartures(tourIds: string[]) {
  const ids = [...new Set(tourIds.filter(Boolean))].sort()

  return useQuery({
    queryKey: ['tours', 'upcoming-departures', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Record<string, string[]>> => {
      const { data, error } = await supabase
        .from('tour_schedules')
        .select('tour_id,start_time')
        .in('tour_id', ids)
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (error) {
        console.error('[departureQueries] upcoming departures failed:', error.message)
        return {}
      }
      const out: Record<string, string[]> = {}
      for (const row of (data ?? []) as { tour_id: string; start_time: string }[]) {
        ;(out[row.tour_id] ??= []).push(row.start_time)
      }
      return out
    },
  })
}

export interface TourDepartureSummary {
  /** ISO start of the soonest upcoming departure. */
  nextStart: string | null
  /** ISO end of that departure (for a date range on the card). */
  nextEnd: string | null
  /** Seats left on that next departure (capacity - booked_count), or null if unknown. */
  seatsLeft: number | null
  /** How many upcoming departures the tour has. */
  count: number
}

/**
 * Per-tour departure summary for the cards: next departure (start/end), seats left on it,
 * and how many upcoming departures exist — resolved for all visible tours in ONE query.
 */
export function useTourDepartureSummary(tourIds: string[]) {
  const ids = [...new Set(tourIds.filter(Boolean))].sort()

  return useQuery({
    queryKey: ['tours', 'departure-summary', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Record<string, TourDepartureSummary>> => {
      const { data, error } = await supabase
        .from('tour_schedules')
        .select('tour_id,start_time,end_time,capacity,booked_count')
        .in('tour_id', ids)
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (error) {
        console.error('[departureQueries] departure summary failed:', error.message)
        return {}
      }
      const out: Record<string, TourDepartureSummary> = {}
      for (const row of (data ?? []) as {
        tour_id: string
        start_time: string
        end_time: string | null
        capacity: number | null
        booked_count: number | null
      }[]) {
        const cur = out[row.tour_id]
        if (!cur) {
          // First row per tour (ascending) is the soonest departure.
          const cap = Number(row.capacity)
          const booked = Number(row.booked_count ?? 0)
          out[row.tour_id] = {
            nextStart: row.start_time,
            nextEnd: row.end_time ?? null,
            seatsLeft: Number.isFinite(cap) ? Math.max(0, cap - booked) : null,
            count: 1,
          }
        } else {
          cur.count += 1
        }
      }
      return out
    },
  })
}

/** "6–9 Sep" (range) or "6 Sep" (single day). Compact for a card pill. */
export function formatDepartureRange(
  startIso?: string | null,
  endIso?: string | null,
): string | null {
  if (!startIso) return null
  const start = new Date(startIso)
  if (Number.isNaN(start.getTime())) return null
  const end = endIso ? new Date(endIso) : null
  const day = (d: Date) => d.getDate()
  const mon = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' })
  const sameDay =
    !end || Number.isNaN(end.getTime()) || (day(start) === day(end) && mon(start) === mon(end))
  if (sameDay) return `${day(start)} ${mon(start)}`
  const sameMonth = mon(start) === mon(end as Date)
  return sameMonth
    ? `${day(start)}–${day(end as Date)} ${mon(end as Date)}`
    : `${day(start)} ${mon(start)} – ${day(end as Date)} ${mon(end as Date)}`
}
