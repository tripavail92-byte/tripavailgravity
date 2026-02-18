import { Link } from 'react-router-dom'

import { BottomTabsNav } from '@/components/navigation/BottomTabsNav'
import { TourCard } from '@/components/traveller/TourCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeaturedTours, useHomepageMixTours, usePakistanNorthernTours, useToursByCategory } from '@/queries/tourQueries'

export default function ToursPage() {
  const featuredQuery = useFeaturedTours()
  const allToursQuery = useHomepageMixTours(96)
  const adventureQuery = useToursByCategory('adventure-trips')
  const hikingQuery = useToursByCategory('hiking-trips')
  const pakistanNorthernQuery = usePakistanNorthernTours()

  const isLoading =
    featuredQuery.isLoading ||
    allToursQuery.isLoading ||
    adventureQuery.isLoading ||
    hikingQuery.isLoading ||
    pakistanNorthernQuery.isLoading

  const isError =
    featuredQuery.isError ||
    allToursQuery.isError ||
    adventureQuery.isError ||
    hikingQuery.isError ||
    pakistanNorthernQuery.isError

  const featured = featuredQuery.data ?? []
  const allTours = allToursQuery.data ?? []
  const topRated = allTours
    .slice()
    .filter((t: any) => typeof t.rating === 'number' && t.rating > 0)
    .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 12)
  const adventure = adventureQuery.data ?? []
  const hiking = hikingQuery.data ?? []
  const pakistanNorthern = pakistanNorthernQuery.data ?? []

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[0, 1, 2].map((i) => (
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
  )

  const renderToursGrid = (tours: any[], source: 'mapped' | 'mix') => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {tours.map((tour: any) => (
        <TourCard
          key={tour.id}
          id={tour.id}
          slug={tour.slug ?? undefined}
          image={
            (Array.isArray(tour.images) ? tour.images?.[0] : tour.image) ||
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop'
          }
          title={tour.title}
          location={tour.location}
          duration={'Multi-day'}
          rating={tour.rating}
          price={
            source === 'mapped'
              ? typeof tour.tourPrice === 'number'
                ? tour.tourPrice
                : 0
              : typeof tour.tourPrice === 'number'
                ? tour.tourPrice
                : 0
          }
          currency="USD"
          type={tour.badge || 'Tour Experience'}
          isFeatured={Boolean(tour.isFeatured)}
        />
      ))}
    </div>
  )

  const renderSection = (title: string, subtitle: string, tours: any[], kind: 'mapped' | 'mix') => (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
      </div>
      {isLoading ? (
        renderSkeletonGrid()
      ) : tours.length > 0 ? (
        renderToursGrid(tours, kind)
      ) : (
        <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
          No tours available right now.
        </Card>
      )}
    </section>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto px-4 py-10 pb-24">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tours</h1>
            <p className="text-muted-foreground font-medium">Browse featured, top rated, and category-wise tours</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl border-border/60 font-bold">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>

        {isError ? (
          <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
            Unable to load tours right now.
          </Card>
        ) : (
          <div className="space-y-10">
            {renderSection('Featured', 'Hand-picked tours from live listings', featured, 'mapped')}
            {renderSection('Top Rated', 'Highest rated experiences', topRated, 'mix')}
            {renderSection('Adventure Trips', 'Adrenaline and outdoor experiences', adventure, 'mapped')}
            {renderSection('Hiking Trips', 'Nature-focused itineraries', hiking, 'mapped')}
            {renderSection('Pakistan Northern', 'Curated northern routes', pakistanNorthern, 'mapped')}
          </div>
        )}
      </main>

      <BottomTabsNav />
    </div>
  )
}
