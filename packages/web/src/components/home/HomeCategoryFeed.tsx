import {
  Compass,
  Heart,
  MapPin,
  Mountain,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PackageCard } from '@/components/traveller/PackageCard'
import { TourCard } from '@/components/traveller/TourCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useCuratedPackages,
  useFeaturedPackages,
  useHomepageMixPackages,
} from '@/queries/packageQueries'
import {
  useFeaturedTours,
  useHomepageMixTours,
  usePakistanNorthernTours,
  useToursByCategory,
} from '@/queries/tourQueries'

const TOUR_FALLBACK_IMG =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop'

const FEED_SIZE = 12

type FeedItem =
  | { type: 'hotel'; id: string; pkg: any }
  | { type: 'tour'; id: string; tour: any }

type CategoryKey =
  | 'featured'
  | 'top-rated'
  | 'new'
  | 'couples'
  | 'family'
  | 'weekend'
  | 'adventure'
  | 'hiking'
  | 'northern-pk'

interface CategoryDef {
  key: CategoryKey
  label: string
  icon: LucideIcon
  /** Full-page browse link for this category. */
  viewAllHref: string
}

// Single source of truth for the home category chips + feed. Order == chip order.
const CATEGORIES: CategoryDef[] = [
  { key: 'featured', label: 'Featured', icon: Star, viewAllHref: '/search' },
  { key: 'top-rated', label: 'Top Rated', icon: TrendingUp, viewAllHref: '/collections/top-rated' },
  { key: 'new', label: 'New Arrivals', icon: Sparkles, viewAllHref: '/collections/new' },
  { key: 'couples', label: 'Couples', icon: Heart, viewAllHref: '/explore/hotel-packages/best_for_couples' },
  { key: 'family', label: 'Family', icon: Users, viewAllHref: '/explore/hotel-packages/family_friendly' },
  { key: 'weekend', label: 'Weekend', icon: Sun, viewAllHref: '/explore/hotel-packages/weekend_getaways' },
  { key: 'adventure', label: 'Adventure', icon: Mountain, viewAllHref: '/explore/tours/categories/adventure-trips' },
  { key: 'hiking', label: 'Hiking', icon: Compass, viewAllHref: '/explore/tours/categories/hiking-trips' },
  { key: 'northern-pk', label: 'Northern Pakistan', icon: MapPin, viewAllHref: '/explore/tours/collections/pakistan-northern' },
]

const toHotel = (pkg: any): FeedItem => ({ type: 'hotel', id: pkg.id, pkg })
const toTour = (tour: any): FeedItem => ({ type: 'tour', id: tour.id, tour })

const ratingOf = (it: FeedItem) => {
  const r = it.type === 'hotel' ? it.pkg.rating : it.tour.rating
  return typeof r === 'number' ? r : null
}
const createdOf = (it: FeedItem) => (it.type === 'hotel' ? it.pkg.created_at : it.tour.created_at)

const compareRatingDesc = (a: FeedItem, b: FeedItem) => {
  const ar = ratingOf(a)
  const br = ratingOf(b)
  if (ar == null && br == null) return 0
  if (ar == null) return 1
  if (br == null) return -1
  return br - ar
}

// Mirrors the old MixedHomepageRow merge: 'new' = freshest across both tables;
// 'top-rated' = interleave the best of each type, then fill by rating.
function buildMixed(kind: 'new' | 'top-rated', pkgs: any[], tours: any[]): FeedItem[] {
  const hotelItems = pkgs.map(toHotel)
  const tourItems = tours.map(toTour)

  if (kind === 'new') {
    return [...hotelItems, ...tourItems]
      .slice()
      .sort((a, b) => Date.parse(createdOf(b)) - Date.parse(createdOf(a)))
      .slice(0, FEED_SIZE)
  }

  const perType = Math.ceil(FEED_SIZE / 2)
  const sortedHotels = hotelItems.slice().sort(compareRatingDesc)
  const sortedTours = tourItems.slice().sort(compareRatingDesc)
  const pickedHotels = sortedHotels.slice(0, perType)
  const pickedTours = sortedTours.slice(0, perType)

  const out: FeedItem[] = []
  const maxLen = Math.max(pickedHotels.length, pickedTours.length)
  for (let i = 0; i < maxLen; i++) {
    if (pickedHotels[i]) out.push(pickedHotels[i])
    if (out.length >= FEED_SIZE) break
    if (pickedTours[i]) out.push(pickedTours[i])
    if (out.length >= FEED_SIZE) break
  }
  if (out.length < FEED_SIZE) {
    const remaining = [
      ...sortedHotels.slice(pickedHotels.length),
      ...sortedTours.slice(pickedTours.length),
    ]
      .slice()
      .sort(compareRatingDesc)
    out.push(...remaining.slice(0, FEED_SIZE - out.length))
  }
  return out.slice(0, FEED_SIZE)
}

// Featured = flagged-featured trips + stays interleaved, topped up with top-rated picks so the
// default feed is never sparse when few listings carry the "featured" flag.
function buildFeatured(fTours: any[], fPkgs: any[], mixPkgs: any[], mixTours: any[]): FeedItem[] {
  const seen = new Set<string>()
  const out: FeedItem[] = []
  const push = (it: FeedItem) => {
    const k = `${it.type}-${it.id}`
    if (seen.has(k) || out.length >= FEED_SIZE) return
    seen.add(k)
    out.push(it)
  }

  const ft = fTours.filter((t) => t.images?.[0]).map(toTour)
  const fp = fPkgs.filter((p) => p.images?.[0]).map(toHotel)
  const maxLen = Math.max(ft.length, fp.length)
  for (let i = 0; i < maxLen && out.length < FEED_SIZE; i++) {
    if (ft[i]) push(ft[i])
    if (fp[i]) push(fp[i])
  }
  if (out.length < FEED_SIZE) {
    for (const it of buildMixed('top-rated', mixPkgs, mixTours)) push(it)
  }
  return out
}

function renderCard(item: FeedItem) {
  if (item.type === 'hotel') {
    const pkg = item.pkg
    return (
      <PackageCard
        key={`hotel-${pkg.id}`}
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
        currency={pkg.currency || 'PKR'}
        totalOriginal={pkg.totalOriginal}
        totalDiscounted={pkg.totalDiscounted}
        badge={pkg.badge || 'Hotel Stay'}
      />
    )
  }
  const tour = item.tour
  return (
    <TourCard
      key={`tour-${tour.id}`}
      id={tour.id}
      slug={tour.slug ?? undefined}
      image={tour.images?.[0] || TOUR_FALLBACK_IMG}
      title={tour.title}
      location={tour.location}
      duration={tour.durationDays ? `${tour.durationDays} days` : 'Multi-day'}
      rating={tour.rating}
      price={typeof tour.tourPrice === 'number' ? tour.tourPrice : 0}
      currency={tour.currency || 'PKR'}
      depositRequired={Boolean(tour.deposit_required ?? tour.depositRequired)}
      depositPercentage={Number(tour.deposit_percentage ?? tour.depositPercentage ?? 0)}
      type={tour.badge || 'Tour Experience'}
      isFeatured={Boolean(tour.isFeatured) || tour.badge === 'Featured'}
    />
  )
}

/**
 * The home discovery body: a single row of category chips (overflow behind a filter sheet) driving
 * ONE vertical feed of full-width cards. Replaces the old stack of horizontal category rows so mobile
 * scrolls straight down, one listing per row. Every category's data is fetched up-front (React Query
 * dedupes the shared keys), so tapping a chip swaps the feed instantly with no refetch flash.
 */
export function HomeCategoryFeed() {
  const [selected, setSelected] = useState<CategoryKey>('featured')
  const [sheetOpen, setSheetOpen] = useState(false)

  const mixPkgQ = useHomepageMixPackages(48)
  const mixTourQ = useHomepageMixTours(48)
  const featPkgQ = useFeaturedPackages()
  const featTourQ = useFeaturedTours()
  const couplesQ = useCuratedPackages('best_for_couples')
  const familyQ = useCuratedPackages('family_friendly')
  const weekendQ = useCuratedPackages('weekend_getaways')
  const adventureQ = useToursByCategory('adventure-trips')
  const hikingQ = useToursByCategory('hiking-trips')
  const northernQ = usePakistanNorthernTours()

  const itemsByCategory = useMemo<Record<CategoryKey, FeedItem[]>>(() => {
    const mixPkgs = mixPkgQ.data ?? []
    const mixTours = mixTourQ.data ?? []
    return {
      featured: buildFeatured(featTourQ.data ?? [], featPkgQ.data ?? [], mixPkgs, mixTours),
      'top-rated': buildMixed('top-rated', mixPkgs, mixTours),
      new: buildMixed('new', mixPkgs, mixTours),
      couples: (couplesQ.data ?? []).map(toHotel),
      family: (familyQ.data ?? []).map(toHotel),
      weekend: (weekendQ.data ?? []).map(toHotel),
      adventure: (adventureQ.data ?? []).slice(0, FEED_SIZE).map(toTour),
      hiking: (hikingQ.data ?? []).slice(0, FEED_SIZE).map(toTour),
      'northern-pk': (northernQ.data ?? []).slice(0, FEED_SIZE).map(toTour),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mixPkgQ.data,
    mixTourQ.data,
    featPkgQ.data,
    featTourQ.data,
    couplesQ.data,
    familyQ.data,
    weekendQ.data,
    adventureQ.data,
    hikingQ.data,
    northernQ.data,
  ])

  const loadingByCategory: Record<CategoryKey, boolean> = {
    featured:
      featTourQ.isLoading || featPkgQ.isLoading || mixPkgQ.isLoading || mixTourQ.isLoading,
    'top-rated': mixPkgQ.isLoading || mixTourQ.isLoading,
    new: mixPkgQ.isLoading || mixTourQ.isLoading,
    couples: couplesQ.isLoading,
    family: familyQ.isLoading,
    weekend: weekendQ.isLoading,
    adventure: adventureQ.isLoading,
    hiking: hikingQ.isLoading,
    'northern-pk': northernQ.isLoading,
  }
  const errorByCategory: Record<CategoryKey, boolean> = {
    // OR (not AND): with the items-first render below, an error flag only decides between the error
    // card and the empty card — both shown ONLY when the feed is empty. So if ANY contributing
    // source failed we surface "couldn't load" instead of a misleading "nothing here yet". When a
    // source succeeds with data, items-first shows it regardless of a sibling source's error.
    // Featured also draws on the mix queries (buildFeatured's fallback fill), so it lists all four.
    featured: featTourQ.isError || featPkgQ.isError || mixPkgQ.isError || mixTourQ.isError,
    'top-rated': mixPkgQ.isError || mixTourQ.isError,
    new: mixPkgQ.isError || mixTourQ.isError,
    couples: couplesQ.isError,
    family: familyQ.isError,
    weekend: weekendQ.isError,
    adventure: adventureQ.isError,
    hiking: hikingQ.isError,
    'northern-pk': northernQ.isError,
  }

  const activeDef = CATEGORIES.find((c) => c.key === selected) ?? CATEGORIES[0]
  const items = itemsByCategory[selected]
  const loading = loadingByCategory[selected]
  const error = errorByCategory[selected]

  return (
    <section aria-labelledby="home-feed-heading">
      {/* Category chips — horizontal scroll on mobile, overflow tucked behind the filter sheet. */}
      <div className="flex items-center gap-2">
        <div className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSel = cat.key === selected
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelected(cat.key)}
                aria-pressed={isSel}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  isSel
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Browse all categories"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader className="text-left">
              <SheetTitle>Browse by category</SheetTitle>
            </SheetHeader>
            <div className="mt-4 grid grid-cols-2 gap-2 pb-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isSel = cat.key === selected
                return (
                  <button
                    key={cat.key}
                    type="button"
                    aria-pressed={isSel}
                    onClick={() => {
                      setSelected(cat.key)
                      setSheetOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition-colors',
                      isSel
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background text-foreground hover:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                        isSel
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Section heading + view-all for the selected category. */}
      <div className="mt-6 flex items-end justify-between gap-4">
        <h2 id="home-feed-heading" className="text-2xl font-bold text-foreground md:text-3xl">
          {activeDef.label}
        </h2>
        <Button asChild variant="link" className="px-0">
          <Link to={activeDef.viewAllHref}>View all</Link>
        </Button>
      </div>

      {/* One vertical feed: single column on phones (one listing per row), widening on larger screens. */}
      <div className="mt-5">
        {/* Items-first: whenever a category has renderable listings, show them — even if a sibling
            data source is still loading or errored. Skeleton/error/empty are only for a truly empty
            feed. This stops the default "Featured" tab from flashing a skeleton (while its fallback
            mix queries load) or an error card (when the featured queries fail but the mix fallback
            succeeded) over content it could already render. */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(renderCard)}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <Card
                key={i}
                className="overflow-hidden rounded-2xl border border-border/60"
              >
                <div className="aspect-[4/5]">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="space-y-3 p-4">
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
        ) : error ? (
          <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
            Unable to load experiences right now. Please try again shortly.
          </Card>
        ) : (
          <Card className="rounded-2xl border border-border/60 p-6">
            <div className="text-sm text-muted-foreground">
              Nothing in {activeDef.label} yet — try another category.
            </div>
          </Card>
        )}
      </div>
    </section>
  )
}
