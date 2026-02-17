import { Link } from 'react-router-dom'

import { BottomTabsNav } from '@/components/navigation/BottomTabsNav'
import { TourCard } from '@/components/traveller/TourCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHomepageMixTours } from '@/queries/tourQueries'

export default function ToursPage() {
  const { data: tours = [], isLoading, isError } = useHomepageMixTours(96)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto px-4 py-10 pb-24">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tours</h1>
            <p className="text-muted-foreground font-medium">Tour packages curated from live listings</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl border-border/60 font-bold">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
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
            Unable to load tour packages right now.
          </Card>
        ) : tours.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour: any) => (
              <TourCard
                key={tour.id}
                id={tour.id}
                slug={tour.slug ?? undefined}
                image={
                  tour.images?.[0] ||
                  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop'
                }
                title={tour.title}
                location={tour.location}
                duration={'Multi-day'}
                rating={tour.rating}
                price={typeof tour.tourPrice === 'number' ? tour.tourPrice : 0}
                currency="USD"
                type={'Tour Experience'}
                isFeatured={Boolean(tour.isFeatured)}
              />
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
            No tour packages available yet.
          </Card>
        )}
      </main>

      <BottomTabsNav />
    </div>
  )
}
