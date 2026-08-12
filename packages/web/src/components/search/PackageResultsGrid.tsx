import { PackageCheck } from 'lucide-react'

import { PackageCard } from '@/components/traveller/PackageCard'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/hooks/useT'
import type { MappedPackage } from '@/queries/packageQueries'

/**
 * Grid of curated HOTEL PACKAGES for /search (the "Packages" tab). One card per
 * package via PackageCard → /packages/:slug. Room-only stays are excluded at the
 * query, so this never duplicates the hotel PROPERTY cards. Mirrors
 * HotelResultsGrid / SearchResultsGrid (same columns, skeleton, empty state) so
 * the three grids feel like siblings on the same page.
 */
export function PackageResultsGrid({
  packages,
  isLoading,
}: {
  packages: MappedPackage[]
  isLoading: boolean
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

  if (packages.length === 0) {
    return (
      <Card className="m-auto w-full max-w-md rounded-2xl border border-border/60 p-10 text-center">
        <PackageCheck className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">{t('search.noResults')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('search.noResultsSub')}</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {packages.map((p) => (
        <PackageCard
          key={p.id}
          id={p.id}
          slug={p.slug ?? undefined}
          images={p.images}
          title={p.title}
          subtitle={p.hotelName}
          location={p.location}
          durationDays={p.durationDays}
          rating={p.rating}
          reviewCount={p.reviewCount}
          priceFrom={typeof p.packagePrice === 'number' ? p.packagePrice : null}
          currency={p.currency}
          totalOriginal={p.totalOriginal}
          totalDiscounted={p.totalDiscounted}
          badge={p.badge}
        />
      ))}
    </div>
  )
}
