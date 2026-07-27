import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { GlassButton } from '@/components/ui/glass'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface TourReviewButtonProps {
  tourId: string
}

/**
 * Header CTA on the tour details page. Behaves differently based on whether the current user has
 * an eligible booking:
 *   - Eligible (a tour_bookings row for this tour whose operator has confirmed completion) →
 *     deep-link to that booking's detail page with ?openReview=1, which auto-opens the write-a-
 *     review dialog on arrival.
 *   - Not eligible or anonymous → smooth-scroll to the #reviews section on this page. They can
 *     still read what other travelers said.
 *
 * "Eligible" mirrors the gate on TravelerBookingDetailPage: metadata.operator_completion_confirmed_at
 * must be set. The button never routes someone to a screen that would reject them.
 *
 * One tiny query on mount for authenticated visitors, skipped entirely for anons.
 */
export function TourReviewButton({ tourId }: TourReviewButtonProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [eligibleBookingId, setEligibleBookingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id || !tourId) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('tour_bookings')
        .select('id')
        .eq('traveler_id', user.id)
        .eq('tour_id', tourId)
        .not('metadata->>operator_completion_confirmed_at', 'is', null)
        .limit(1)
        .maybeSingle()
      if (!cancelled && data?.id) setEligibleBookingId(data.id)
    })().catch(() => {
      // Silent — worst case the button falls back to the scroll-to-reviews behaviour, which is
      // still useful. No point surfacing a query error to a visitor who did nothing wrong.
    })
    return () => {
      cancelled = true
    }
  }, [user?.id, tourId])

  const handleClick = () => {
    if (eligibleBookingId) {
      navigate(`/trips/${eligibleBookingId}?openReview=1`)
      return
    }
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <GlassButton
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="rounded-full gap-1.5 text-foreground hover:bg-muted/40"
      title={eligibleBookingId ? 'Write a review for this tour' : 'See traveler reviews'}
    >
      <Star size={16} className="text-primary" />
      Review
    </GlassButton>
  )
}
