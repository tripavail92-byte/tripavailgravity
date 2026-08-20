import { useEffect, useMemo, useState } from 'react'

import type { Tour } from '@/features/tour-operator/services/tourService'
import { supabase } from '@/lib/supabase'

/**
 * Classifies each published tour by whether a traveller can actually book it.
 *
 * WHY THIS EXISTS. A tour goes live with a departure date, but once that date passes the
 * tour has zero UPCOMING schedules — so it still shows in the catalogue but the booking
 * button is dead, and nothing tells the operator. At any moment most of the catalogue can
 * be in this state. This turns that invisible gap into something the dashboard can nudge on.
 *
 *   unbookable — live, but 0 upcoming departures. Travellers literally cannot book it.
 *   thin       — exactly 1 upcoming departure. One sold-out date away from unbookable.
 *   healthy    — 2+ upcoming departures.
 */
export type Bookability = 'unbookable' | 'thin' | 'healthy'

export interface TourBookability {
  tour: Tour
  status: Bookability
  upcomingCount: number
  /** ISO start_time of the soonest upcoming departure, if any. */
  nextDeparture: string | null
}

export function useTourBookability(tours: Tour[]) {
  const [countsByTour, setCountsByTour] = useState<
    Record<string, { count: number; next: string | null }>
  >({})
  const [loading, setLoading] = useState(false)

  // Stable list of ids so the effect doesn't refire on array identity alone.
  const ids = useMemo(() => [...new Set(tours.map((t) => t.id).filter(Boolean))].sort(), [tours])
  const idsKey = ids.join(',')

  useEffect(() => {
    if (ids.length === 0) {
      setCountsByTour({})
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      // One query for every visible tour's upcoming departures.
      const { data, error } = await supabase
        .from('tour_schedules')
        .select('tour_id,start_time')
        .in('tour_id', ids)
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (cancelled) return
      if (error) {
        // Degrade quietly — a failed count must not block the dashboard or cry wolf.
        console.error('[useTourBookability] schedule count failed:', error.message)
        setCountsByTour({})
        setLoading(false)
        return
      }

      const acc: Record<string, { count: number; next: string | null }> = {}
      for (const row of (data ?? []) as { tour_id: string; start_time: string }[]) {
        const cur = acc[row.tour_id] || { count: 0, next: null }
        cur.count += 1
        if (!cur.next) cur.next = row.start_time // rows are ascending → first seen is soonest
        acc[row.tour_id] = cur
      }
      setCountsByTour(acc)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  const items: TourBookability[] = useMemo(
    () =>
      tours.map((tour) => {
        const entry = countsByTour[tour.id] || { count: 0, next: null }
        const status: Bookability =
          entry.count === 0 ? 'unbookable' : entry.count === 1 ? 'thin' : 'healthy'
        return { tour, status, upcomingCount: entry.count, nextDeparture: entry.next }
      }),
    [tours, countsByTour],
  )

  const unbookable = useMemo(() => items.filter((i) => i.status === 'unbookable'), [items])
  const thin = useMemo(() => items.filter((i) => i.status === 'thin'), [items])

  return { items, unbookable, thin, loading, byId: countsByTour }
}
