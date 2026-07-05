import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { BottomTabsNav } from '@/components/navigation/BottomTabsNav'
import { PackageCard } from '@/components/traveller/PackageCard'
import { TourCard } from '@/components/traveller/TourCard'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHomepageMixPackages } from '@/queries/packageQueries'
import { useHomepageMixTours } from '@/queries/tourQueries'

/**
 * Full-grid "View All" page for the home mixed rows (New Arrivals / Top Rated).
 * Shows the same curated hotel+tour set as the home rail, but the complete list.
 * Route: /collections/:kind  (kind = 'new' | 'top-rated')
 */

type MixedItem =
  | { type: 'hotel'; id: string; created_at: string; rating: number | null; pkg: any }
  | { type: 'tour'; id: string; created_at: string; rating: number | null; tour: any }

const COPY: Record<'new' | 'top-rated', { title: string; subtitle: string }> = {
  new: { title: 'New Arrivals', subtitle: 'The latest stays and tours, fresh from our partners' },
  'top-rated': {
    title: 'Top Rated',
    subtitle: 'The highest-rated stays and tours travellers love',
  },
}

export default function MixedCollectionPage() {
  const { kind } = useParams<{ kind: string }>()
  const navigate = useNavigate()
  const key: 'new' | 'top-rated' = kind === 'top-rated' ? 'top-rated' : 'new'
  const copy = COPY[key]

  const {
    data: hotelPackages = [],
    isLoading: hotelsLoading,
    isError: hotelsError,
  } = useHomepageMixPackages(48)
  const { data: tours = [], isLoading: toursLoading, isError: toursError } = useHomepageMixTours(48)

  const isLoading = hotelsLoading || toursLoading
  const isError = hotelsError || toursError

  const merged = useMemo(() => {
    const hotelItems: MixedItem[] = hotelPackages.map((pkg: any) => ({
      type: 'hotel' as const,
      id: pkg.id,
      created_at: pkg.created_at,
      rating: typeof pkg.rating === 'number' ? pkg.rating : null,
      pkg,
    }))
    const tourItems: MixedItem[] = tours.map((tour: any) => ({
      type: 'tour' as const,
      id: tour.id,
      created_at: tour.created_at,
      rating: typeof tour.rating === 'number' ? tour.rating : null,
      tour,
    }))
    const combined = [...hotelItems, ...tourItems]

    if (key === 'new') {
      return combined.slice().sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    }
    // Top Rated: highest rating first, unrated last.
    return combined.slice().sort((a, b) => {
      const ar = a.rating
      const br = b.rating
      if (ar == null && br == null) return 0
      if (ar == null) return 1
      if (br == null) return -1
      return br - ar
    })
  }, [hotelPackages, tours, key])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="container mx-auto max-w-7xl px-4 pt-6 pb-24">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <header>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{copy.title}</h1>
          <p className="mt-1 text-muted-foreground">{copy.subtitle}</p>
        </header>

        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="rounded-2xl border border-border/60 overflow-hidden">
                  <div className="aspect-[4/5]">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
              Unable to load experiences right now.
            </Card>
          ) : merged.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {merged.map((item) =>
                item.type === 'hotel' ? (
                  <PackageCard
                    key={`hotel-${item.id}`}
                    id={item.pkg.id}
                    slug={item.pkg.slug ?? undefined}
                    images={item.pkg.images}
                    title={item.pkg.title}
                    subtitle={item.pkg.hotelName}
                    location={item.pkg.location}
                    durationDays={item.pkg.durationDays ?? 3}
                    rating={item.pkg.rating}
                    reviewCount={item.pkg.reviewCount}
                    priceFrom={
                      typeof item.pkg.packagePrice === 'number' ? item.pkg.packagePrice : null
                    }
                    currency={item.pkg.currency || 'PKR'}
                    totalOriginal={item.pkg.totalOriginal}
                    totalDiscounted={item.pkg.totalDiscounted}
                    badge={'Hotel Stay'}
                  />
                ) : (
                  <TourCard
                    key={`tour-${item.id}`}
                    id={item.tour.id}
                    slug={item.tour.slug ?? undefined}
                    image={
                      item.tour.images?.[0] ||
                      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop'
                    }
                    title={item.tour.title}
                    location={item.tour.location}
                    duration={item.tour.durationDays ? `${item.tour.durationDays} days` : 'Multi-day'}
                    rating={item.tour.rating}
                    price={typeof item.tour.tourPrice === 'number' ? item.tour.tourPrice : 0}
                    currency={item.tour.currency || 'PKR'}
                    depositRequired={Boolean(
                      (item.tour as any).deposit_required ?? (item.tour as any).depositRequired,
                    )}
                    depositPercentage={Number(
                      (item.tour as any).deposit_percentage ??
                        (item.tour as any).depositPercentage ??
                        0,
                    )}
                    type={'Tour Experience'}
                    isFeatured={Boolean(item.tour.isFeatured)}
                  />
                ),
              )}
            </div>
          ) : (
            <Card className="rounded-2xl border border-border/60 p-6">
              <div className="text-sm text-muted-foreground">No experiences available yet.</div>
            </Card>
          )}
        </div>
      </div>

      <BottomTabsNav />
    </div>
  )
}
