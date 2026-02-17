import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { TourCard } from '@/components/traveller/TourCard'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type TourCategoryKind, useToursByCategoryFull } from '@/queries/tourQueries'

function isTourCategoryKind(value: string | undefined): value is TourCategoryKind {
  return value === 'adventure-trips' || value === 'hiking-trips'
}

export default function TourCategoryPage() {
  const { category } = useParams()

  const tourCategory = useMemo(() => {
    return isTourCategoryKind(category) ? category : null
  }, [category])

  const { data = [], isLoading, isError } = useToursByCategoryFull(tourCategory ?? 'adventure-trips', {
    enabled: Boolean(tourCategory),
  })

  if (!tourCategory) {
    return (
      <div className="container mx-auto max-w-7xl px-4 pt-28 pb-16">
        <Card className="rounded-2xl border border-border/60 p-6">
          <div className="text-lg font-bold">Category not found</div>
          <div className="text-sm text-muted-foreground mt-1">This tours category doesn’t exist.</div>
          <div className="mt-4">
            <Link className="text-primary underline underline-offset-4" to="/">
              Back to Home
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const title = tourCategory === 'adventure-trips' ? 'Adventure Trips' : 'Hiking Trips'
  const subtitle = 'Curated from live listings'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-7xl px-4 pt-28 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>
          <Link className="text-primary underline underline-offset-4" to="/">
            Home
          </Link>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Card key={i} className="rounded-3xl border border-border/60 overflow-hidden">
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
          ) : isError ? (
            <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
              Unable to load tours right now.
            </Card>
          ) : data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.map((tour) => (
                <TourCard
                  key={tour.id}
                  id={tour.id}
                  slug={tour.slug ?? undefined}
                  image={
                    tour.images?.[0] ||
                    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop'
                  }
                  title={tour.title}
                  location={tour.location}
                  duration={'Multi-day'}
                  rating={tour.rating}
                  price={typeof tour.tourPrice === 'number' ? tour.tourPrice : 0}
                  currency="USD"
                  type={tour.badge}
                  isFeatured={tour.badge === 'Featured'}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border border-border/60 p-6">
              <div className="text-sm text-muted-foreground">No tours available yet.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
