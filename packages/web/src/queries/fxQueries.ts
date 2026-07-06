import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

/**
 * Loads the FX rate table into a lookup keyed `${base}->${quote}` → rate,
 * keeping the most recent rate per pair. Powers browsing-time currency display;
 * charges always settle in the listing's own currency.
 */
export function useFxRates() {
  return useQuery({
    queryKey: ['fx-rates'],
    staleTime: 1000 * 60 * 60, // 1 hour
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('fx_rates')
        .select('base, quote, rate, as_of')
        .order('as_of', { ascending: false })
      if (error) throw error
      const map: Record<string, number> = {}
      for (const row of data ?? []) {
        const key = `${row.base}->${row.quote}`
        if (!(key in map)) map[key] = Number(row.rate) // first seen = most recent
      }
      return map
    },
  })
}
