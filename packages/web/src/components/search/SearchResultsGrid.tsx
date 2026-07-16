import { MapPin } from 'lucide-react'

import { PackageCard } from '@/components/traveller/PackageCard'
import { TourCard } from '@/components/traveller/TourCard'
import { useT } from '@/hooks/useT'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { SearchListing } from '@/queries/searchQueries'

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop'

function DistanceChip({ km }: { km: number | null }) {
  if (km == null) return null
  const label = km < 1 ? '<1 km away' : `${Math.round(km).toLocaleString()} km away`
  return (
    <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <MapPin className="h-3.5 w-3.5" />
      {label}
    </div>
  )
}

function ResultCard({ item, showDistance }: { item: SearchListing; showDistance: boolean }) {
  if (item.listingType === 'tour') {
    return (
      <div>
        <TourCard
          id={item.listingId}
          slug={item.slug ?? undefined}
          image={item.images?.[0] || FALLBACK_IMG}
          title={item.title}
          location={item.locationLabel ?? item.country ?? 'Worldwide'}
          duration={item.durationDays ? `${item.durationDays} days` : 'Multi-day'}
          rating={item.rating ?? 0}
          price={item.price ?? 0}
          currency={item.currency}
          type={item.badge ?? 'Tour'}
          isFeatured={item.isFeatured}
        />
        {showDistance && <DistanceChip km={item.distanceKm} />}
      </div>
    )
  }

  return (
    <div>
      <PackageCard
        id={item.listingId}
        slug={item.slug ?? undefined}
        images={item.images?.length ? item.images : [FALLBACK_IMG]}
        title={item.title}
        subtitle={item.subtitle ?? undefined}
        location={item.locationLabel ?? item.country ?? undefined}
        rating={item.rating ?? undefined}
        reviewCount={item.reviewCount ?? undefined}
        priceFrom={item.price}
        currency={item.currency}
        badge={item.badge ?? 'Stay'}
      />
      {showDistance && <DistanceChip km={item.distanceKm} />}
    </div>
  )
}

export function SearchResultsGrid({
  items,
  isLoading,
  showDistance = false,
}: {
  items: SearchListing[]
  isLoading: boolean
  showDistance?: boolean
}) {
  const t = useT()
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Card
            key={i}
            className="rounded-3xl border border-border/60 overflow-hidden"
          >
            <div className="aspect-[4/5]">
              <Skeleton className="w-full h-full" />
            </div>
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      // m-auto centers the card in the flex-1 column its parent now claims, instead of
      // stranding it at the top with a dead half-page beneath.
      <Card className="m-auto w-full max-w-md rounded-2xl border border-border/60 p-10 text-center">
        <p className="text-lg font-semibold text-foreground">{t('search.noResults')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('search.noResultsSub')}</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ResultCard key={`${item.listingType}-${item.listingId}`} item={item} showDistance={showDistance} />
      ))}
    </div>
  )
}
