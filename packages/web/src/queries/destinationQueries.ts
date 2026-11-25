import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { buildHubs, type DestinationHub, type DestinationTour } from '@/lib/destinations'
import { supabase } from '@/lib/supabase'

/**
 * The live catalogue in the slim shape destination pages need, plus the hubs built from it. The
 * whole catalogue is a few hundred rows, so one cached request serves every destination page.
 */
export function useDestinationCatalog() {
  const query = useQuery({
    queryKey: ['tours', 'destination-catalog'],
    queryFn: async (): Promise<DestinationTour[]> => {
      const { data, error } = await supabase
        .from('tours')
        .select(
          'id,slug,title,location,destination_cities,price,currency,price_on_request,duration_days,images,rating,review_count,tour_type,availability,booking_mode,short_description,operator_id',
        )
        .eq('is_active', true)
        .eq('is_published', true)
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(2000)
      if (error) throw error
      return (data ?? []) as unknown as DestinationTour[]
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
  const hubs = useMemo<DestinationHub[]>(() => buildHubs(query.data ?? []), [query.data])
  return { ...query, hubs }
}
