import { Link } from 'react-router-dom'

import { BottomTabsNav } from '@/components/navigation/BottomTabsNav'
import { PackageCard } from '@/components/traveller/PackageCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCuratedPackages, useFeaturedPackages } from '@/queries/packageQueries'

export default function HotelsPage() {
  const featuredQuery = useFeaturedPackages()
  const topRatedQuery = useCuratedPackages('top_rated')
  const newArrivalsQuery = useCuratedPackages('new_arrivals')
  const couplesQuery = useCuratedPackages('best_for_couples')
  const familyQuery = useCuratedPackages('family_friendly')
  const weekendQuery = useCuratedPackages('weekend_getaways')

  const isLoading =
    featuredQuery.isLoading ||
    topRatedQuery.isLoading ||
    newArrivalsQuery.isLoading ||
    couplesQuery.isLoading ||
    familyQuery.isLoading ||
    weekendQuery.isLoading

  const isError =
    featuredQuery.isError ||
    topRatedQuery.isError ||
    newArrivalsQuery.isError ||
    couplesQuery.isError ||
    familyQuery.isError ||
    weekendQuery.isError

  const featured = featuredQuery.data ?? []
  const topRated = topRatedQuery.data ?? []
  const newArrivals = newArrivalsQuery.data ?? []
  const couples = couplesQuery.data ?? []
  const family = familyQuery.data ?? []
  const weekend = weekendQuery.data ?? []

  const renderPackagesGrid = (packages: any[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg: any) => (
        <PackageCard
          key={pkg.id}
          id={pkg.id}
          slug={pkg.slug ?? undefined}
          images={pkg.images}
          title={pkg.title}
          subtitle={pkg.hotelName}
          location={pkg.location}
          durationDays={pkg.durationDays ?? 3}
          rating={pkg.rating}
          reviewCount={pkg.reviewCount}
          priceFrom={typeof pkg.packagePrice === 'number' ? pkg.packagePrice : null}
          totalOriginal={pkg.totalOriginal}
          totalDiscounted={pkg.totalDiscounted}
          badge={pkg.badge || 'Hotel Stay'}
        />
      ))}
    </div>
  )

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

  const renderSection = (title: string, subtitle: string, packages: any[]) => (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
      </div>
      {isLoading ? (
        renderSkeletonGrid()
      ) : packages.length > 0 ? (
        renderPackagesGrid(packages)
      ) : (
        <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
          No packages available right now.
        </Card>
      )}
    </section>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto px-4 py-10 pb-24">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hotels</h1>
            <p className="text-muted-foreground font-medium">
              Browse featured, top rated, and package-wise stays
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl border-border/60 font-bold">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>

        {isError ? (
          <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
            Unable to load hotel packages right now.
          </Card>
        ) : (
          <div className="space-y-10">
            {renderSection('Featured', 'Hand-picked stays and deals', featured)}
            {renderSection('Top Rated', 'Highest rated by travellers', topRated)}
            {renderSection('New Arrivals', 'Recently added packages', newArrivals)}
            {renderSection('Best for Couples', 'Romantic getaways', couples)}
            {renderSection('Family Friendly', 'Stays for the whole family', family)}
            {renderSection('Weekend Getaways', 'Short escapes and quick trips', weekend)}
          </div>
        )}
      </main>

      <BottomTabsNav />
    </div>
  )
}
