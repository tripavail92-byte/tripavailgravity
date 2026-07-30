import { BedDouble, MapPin } from 'lucide-react'

import { HotelPropertyCard } from '@/components/traveller/HotelPropertyCard'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/hooks/useT'
import type { HotelBrowseItem } from '@/queries/hotelQueries'

function DistanceChip({ km }: { km: number | null | undefined }) {
  if (km == null) return null
  const label = km < 1 ? '<1 km away' : `${Math.round(km).toLocaleString()} km away`
  return (
    <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <MapPin className="h-3.5 w-3.5" />
      {label}
    </div>
  )
}

/**
 * Grid of hotels for /search when activeType is 'hotel' (or 'all'). Property-
 * centric: one card per hotel, priced by cheapest matching stay, linking to the
 * property profile at `/hotel/:id`. Mirrors SearchResultsGrid's shape (loading
 * skeleton + empty-state card) so the two grids feel like siblings on the same
 * page.
 */
export function HotelResultsGrid({
  hotels,
  isLoading,
  showDistance = false,
}: {
  hotels: HotelBrowseItem[]
  isLoading: boolean
  showDistance?: boolean
}) {
  const t = useT()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Card key={i} className="rounded-3xl border border-border/60 overflow-hidden">
            <div className="aspect-[4/5]">
              <Skeleton className="w-full h-full" />
            </div>
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (hotels.length === 0) {
    return (
      <Card className="m-auto w-full max-w-md rounded-2xl border border-border/60 p-10 text-center">
        <BedDouble className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">{t('search.noResults')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('search.noResultsSub')}</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {hotels.map((hotel) => (
        <div key={hotel.id}>
          <HotelPropertyCard hotel={hotel} />
          {showDistance && <DistanceChip km={hotel.distanceKm} />}
        </div>
      ))}
    </div>
  )
}
