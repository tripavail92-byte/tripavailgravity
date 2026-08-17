import { isSurfaceEnabled } from '@tripavail/shared/config/launchScope'
import { Ticket } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ExploreControls, type ExploreMode } from '@/components/home/ExploreControls'
import { HotelPropertyCard } from '@/components/traveller/HotelPropertyCard'
import { PackageCard } from '@/components/traveller/PackageCard'
import { TourCard } from '@/components/traveller/TourCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { HotelBrowseItem } from '@/queries/hotelQueries'
import { useHotelBrowse } from '@/queries/hotelQueries'
import {
  useCuratedPackages,
  useFeaturedPackages,
  useSpecialOffers,
} from '@/queries/packageQueries'
import {
  useFeaturedTours,
  usePakistanNorthernTours,
  useToursByCategory,
} from '@/queries/tourQueries'

const TOUR_FALLBACK_IMG =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop'

// How many cards a home row shows — one desktop row. "See all" carries the rest.
const ROW_SIZE = 4

type Mode = ExploreMode
const MODE_STORAGE_KEY = 'ta_home_mode'

// ── Card builders (loosely typed to match the mapped-row shapes) ────────────
function renderPackageCards(pkgs: any[]): ReactNode[] {
  return pkgs.map((pkg) => (
    <PackageCard
      key={`pkg-${pkg.id}`}
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
      currency={pkg.currency || 'PKR'}
      totalOriginal={pkg.totalOriginal}
      totalDiscounted={pkg.totalDiscounted}
      badge={pkg.badge}
    />
  ))
}

function renderTourCards(tours: any[]): ReactNode[] {
  return tours.map((tour) => (
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
      type={tour.badge || 'Tour'}
      isFeatured={tour.badge === 'Featured'}
    />
  ))
}

function renderHotelCards(hotels: HotelBrowseItem[]): ReactNode[] {
  return hotels.map((h) => <HotelPropertyCard key={`hotel-${h.id}`} hotel={h} />)
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border/60">
      <div className="aspect-[4/5]">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Card>
  )
}

/** One home row: heading + See-all + up to ROW_SIZE cards. Hides itself entirely
 *  once loaded and empty, so a sparse catalogue simply shows fewer sections
 *  rather than a wall of "nothing here yet" cards. */
function FeedSection({
  title,
  subtitle,
  viewAllHref,
  isLoading,
  cards,
}: {
  title: string
  subtitle?: string
  viewAllHref: string
  isLoading: boolean
  cards: ReactNode[]
}) {
  if (!isLoading && cards.length === 0) return null

  return (
    <section className="mt-12 first:mt-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <Button asChild variant="link" className="shrink-0 px-0">
          <Link to={viewAllHref}>See all</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading && cards.length === 0
          ? [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
          : cards.slice(0, ROW_SIZE)}
      </div>
    </section>
  )
}

/**
 * Intent-first home discovery. Big Hotels/Tours/Events mode pills switch the
 * sections below; the default 'all' state shows a teaser row of each so a
 * first-time visitor sees the whole platform before choosing. Search and Ask AI
 * sit beside the pills; search is pre-scoped to the active mode. Every query is
 * fetched up-front (React Query dedupes shared keys) so switching modes is
 * instant with no refetch flash. Reuses PackageCard / HotelPropertyCard /
 * TourCard and the TravelAssistant dialog verbatim.
 *
 * `hero` renders BETWEEN the pill row and the mode sections — so the page reads
 * as: search bar, mode pills, featured hero, then the sections that respond to
 * the pill choice. This is why the mode pills are the first thing a visitor sees.
 */
export function HomeCategoryFeed({ hero }: { hero?: ReactNode }) {
  // LAUNCH SCOPE: trips-only home is locked to the 'tours' mode (the Hotels/
  // Events pills are hidden in the search bar), so the hotel/package/event
  // sections never render and their queries never fire.
  const hotelsOn = isSurfaceEnabled('hotels')
  const [mode, setMode] = useState<Mode>(hotelsOn ? 'all' : 'tours')

  // Restore the visitor's last-picked mode (Airbnb-style tab memory). Only
  // restore surfaces that are live — a stored 'hotels'/'events' is ignored.
  useEffect(() => {
    if (!hotelsOn) return
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY)
      if (saved === 'hotels' || saved === 'tours' || saved === 'events') setMode(saved)
    } catch {
      /* private-mode / disabled storage — default 'all' is fine */
    }
  }, [hotelsOn])

  const selectMode = (next: Exclude<Mode, 'all'>) => {
    // Clicking the active pill again returns to the 'all' overview.
    const resolved: Mode = mode === next ? 'all' : next
    setMode(resolved)
    try {
      if (resolved === 'all') localStorage.removeItem(MODE_STORAGE_KEY)
      else localStorage.setItem(MODE_STORAGE_KEY, resolved)
    } catch {
      /* ignore */
    }
  }

  // ── Data. All prefetched; sections read from these. Hotel/package queries
  //    are disabled in the trips-only launch (nothing consumes them). ──
  const offersQ = useSpecialOffers({ enabled: hotelsOn })
  const hotelsQ = useHotelBrowse({ enabled: hotelsOn })
  const featPkgQ = useFeaturedPackages({ enabled: hotelsOn })
  const topRatedQ = useCuratedPackages('top_rated', { enabled: hotelsOn })
  const couplesQ = useCuratedPackages('best_for_couples', { enabled: hotelsOn })
  const familyQ = useCuratedPackages('family_friendly', { enabled: hotelsOn })
  const weekendQ = useCuratedPackages('weekend_getaways', { enabled: hotelsOn })
  const newQ = useCuratedPackages('new_arrivals', { enabled: hotelsOn })
  const featTourQ = useFeaturedTours()
  const adventureQ = useToursByCategory('adventure-trips')
  const hikingQ = useToursByCategory('hiking-trips')
  const northernQ = usePakistanNorthernTours()

  const offers = useMemo(() => renderPackageCards(offersQ.data ?? []), [offersQ.data])
  const hotels = useMemo(() => renderHotelCards(hotelsQ.data ?? []), [hotelsQ.data])
  const featuredStays = useMemo(
    () => renderPackageCards(featPkgQ.data ?? []),
    [featPkgQ.data],
  )
  const topRated = useMemo(() => renderPackageCards(topRatedQ.data ?? []), [topRatedQ.data])
  const couples = useMemo(() => renderPackageCards(couplesQ.data ?? []), [couplesQ.data])
  const family = useMemo(() => renderPackageCards(familyQ.data ?? []), [familyQ.data])
  const weekend = useMemo(() => renderPackageCards(weekendQ.data ?? []), [weekendQ.data])
  const newArrivals = useMemo(() => renderPackageCards(newQ.data ?? []), [newQ.data])
  const featTours = useMemo(() => renderTourCards(featTourQ.data ?? []), [featTourQ.data])
  const adventure = useMemo(() => renderTourCards(adventureQ.data ?? []), [adventureQ.data])
  const hiking = useMemo(() => renderTourCards(hikingQ.data ?? []), [hikingQ.data])
  const northern = useMemo(() => renderTourCards(northernQ.data ?? []), [northernQ.data])

  return (
    <section aria-labelledby="home-explore-heading">
      <h2 id="home-explore-heading" className="sr-only">
        Explore TripAvail
      </h2>

      {/* Shared search + Ask AI + Hotels/Tours/Events pills. On HOME the pills
          switch which sections render below (local state), so we pass selectMode
          as the click handler. On the standalone browse pages the same
          component is mounted but its pill handler is navigate — same UI,
          different semantic per host, which is the whole point of B. */}
      <ExploreControls activeMode={mode} onModeSelect={selectMode} />

      {/* ── Featured hero — sits BETWEEN the pill row and the sections, so the
          mode-switcher is the first thing a visitor sees on the page. Optional:
          if no hero is passed the layout collapses cleanly. */}
      {hero ? <div className="mt-8">{hero}</div> : null}

      {/* ── Sections per mode ────────────────────────────────────────────── */}
      <div className="mt-8">
        {mode === 'all' && (
          <>
            <FeedSection
              title="Special offers"
              subtitle="Curated stays with real savings"
              viewAllHref="/search?types=hotel"
              isLoading={offersQ.isLoading}
              cards={offers}
            />
            <FeedSection
              title="Tours & experiences"
              viewAllHref="/tours"
              isLoading={featTourQ.isLoading}
              cards={featTours}
            />
            <FeedSection
              title="Places to stay"
              viewAllHref="/hotels"
              isLoading={hotelsQ.isLoading}
              cards={hotels}
            />
          </>
        )}

        {mode === 'hotels' && (
          <>
            <FeedSection
              title="Special offers"
              subtitle="Curated stays with real savings"
              viewAllHref="/search?types=hotel"
              isLoading={offersQ.isLoading}
              cards={offers}
            />
            <FeedSection
              title="Places to stay"
              viewAllHref="/hotels"
              isLoading={hotelsQ.isLoading}
              cards={hotels}
            />
            <FeedSection
              title="Top rated"
              viewAllHref="/collections/top-rated"
              isLoading={topRatedQ.isLoading}
              cards={topRated}
            />
            <FeedSection
              title="Featured stays"
              viewAllHref="/hotels"
              isLoading={featPkgQ.isLoading}
              cards={featuredStays}
            />
            <FeedSection
              title="Weekend getaways"
              viewAllHref="/explore/hotel-packages/weekend_getaways"
              isLoading={weekendQ.isLoading}
              cards={weekend}
            />
            <FeedSection
              title="Family friendly"
              viewAllHref="/explore/hotel-packages/family_friendly"
              isLoading={familyQ.isLoading}
              cards={family}
            />
            <FeedSection
              title="For couples"
              viewAllHref="/explore/hotel-packages/best_for_couples"
              isLoading={couplesQ.isLoading}
              cards={couples}
            />
            <FeedSection
              title="New arrivals"
              viewAllHref="/collections/new"
              isLoading={newQ.isLoading}
              cards={newArrivals}
            />
          </>
        )}

        {mode === 'tours' && (
          <>
            <FeedSection
              title="Featured tours"
              viewAllHref="/tours"
              isLoading={featTourQ.isLoading}
              cards={featTours}
            />
            <FeedSection
              title="Adventure"
              viewAllHref="/explore/tours/categories/adventure-trips"
              isLoading={adventureQ.isLoading}
              cards={adventure}
            />
            <FeedSection
              title="Hiking & nature"
              viewAllHref="/explore/tours/categories/hiking-trips"
              isLoading={hikingQ.isLoading}
              cards={hiking}
            />
            <FeedSection
              title="Northern Pakistan"
              viewAllHref="/explore/tours/collections/pakistan-northern"
              isLoading={northernQ.isLoading}
              cards={northern}
            />
          </>
        )}

        {mode === 'events' && (
          <Card className="mt-2 rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
            <Ticket className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">Events are coming</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Concerts, festivals, and local experiences with verified tickets — launching soon.
              In the meantime, explore hotels and tours.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full">
                <Link to="/hotels">Browse hotels</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/tours">Browse tours</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </section>
  )
}
