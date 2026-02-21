import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PackageCard } from '@/components/traveller/PackageCard'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type CuratedPackageKind, useCuratedPackagesFull } from '@/queries/packageQueries'

const TITLES: Record<CuratedPackageKind, { title: string; subtitle: string }> = {
  new_arrivals: {
    title: 'New Arrivals',
    subtitle: 'Hotel packages recently added from live listings',
  },
  top_rated: { title: 'Top Rated', subtitle: 'Top-rated hotel packages across partners' },
  best_for_couples: {
    title: 'Best for Couples',
    subtitle: 'Romantic hotel packages and private stays',
  },
  family_friendly: {
    title: 'Family Friendly',
    subtitle: 'Family hotel packages and spacious suites',
  },
  weekend_getaways: {
    title: 'Weekend Getaways',
    subtitle: 'Short-stay hotel packages for quick resets',
  },
}

function isCuratedPackageKind(value: string | undefined): value is CuratedPackageKind {
  if (!value) return false
  return (
    value === 'new_arrivals' ||
    value === 'top_rated' ||
    value === 'best_for_couples' ||
    value === 'family_friendly' ||
    value === 'weekend_getaways'
  )
}

export default function PackageCategoryPage() {
  const { kind } = useParams()

  const curatedKind = useMemo(() => {
    return isCuratedPackageKind(kind) ? kind : null
  }, [kind])

  const {
    data = [],
    isLoading,
    isError,
  } = useCuratedPackagesFull(curatedKind ?? 'new_arrivals', {
    enabled: Boolean(curatedKind),
  })

  if (!curatedKind) {
    return (
      <div className="container mx-auto max-w-7xl px-4 pt-28 pb-16">
        <Card className="rounded-2xl border border-border/60 p-6">
          <div className="text-lg font-bold">Category not found</div>
          <div className="text-sm text-muted-foreground mt-1">
            This package category doesn’t exist.
          </div>
          <div className="mt-4">
            <Link className="text-primary underline underline-offset-4" to="/">
              Back to Home
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const meta = TITLES[curatedKind]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-7xl px-4 pt-28 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{meta.title}</h1>
            <p className="mt-2 text-muted-foreground">{meta.subtitle}</p>
          </div>
          <Link className="text-primary underline underline-offset-4" to="/">
            Home
          </Link>
        </div>

        <div className="mt-8">
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
                    <div className="flex gap-2">
                      <Skeleton className="h-7 w-24 rounded-full" />
                      <Skeleton className="h-7 w-28 rounded-full" />
                    </div>
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
              Unable to load packages right now.
            </Card>
          ) : data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  id={pkg.id}
                  slug={pkg.slug ?? undefined}
                  images={pkg.images}
                  title={pkg.title}
                  subtitle={pkg.hotelName}
                  location={pkg.location}
                  durationDays={pkg.durationDays}
                  rating={pkg.rating}
                  reviewCount={pkg.reviewCount}
                  priceFrom={typeof pkg.packagePrice === 'number' ? pkg.packagePrice : null}
                  totalOriginal={pkg.totalOriginal}
                  totalDiscounted={pkg.totalDiscounted}
                  badge={pkg.badge}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border border-border/60 p-6">
              <div className="text-sm text-muted-foreground">No packages available yet.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
