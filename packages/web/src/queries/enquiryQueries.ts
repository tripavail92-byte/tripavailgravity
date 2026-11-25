import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

/**
 * Ids of published tours that are WhatsApp-enquiry listings (operators not on TripAvail yet), so
 * any tour card — whatever list it came from — can say "Enquire" instead of "Book Now". One small
 * request per visit, shared by every card through the query cache.
 */
export function useEnquiryTourIds() {
  return useQuery({
    queryKey: ['tours', 'enquiry-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tours')
        .select('id')
        .eq('booking_mode', 'enquiry')
        .eq('is_published', true)
        .limit(5000)
      if (error) throw error
      return new Set((data ?? []).map((row) => row.id as string))
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
