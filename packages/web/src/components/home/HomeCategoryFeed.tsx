import { isSurfaceEnabled } from '@tripavail/shared/config/launchScope'
import { Ticket } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { DestinationTiles } from '@/components/home/DestinationTiles'
import { ExploreControls, type ExploreMode } from '@/components/home/ExploreControls'
import {
  BudgetChips,
  HowItWorks,
  OperatorCta,
  TrustBand,
} from '@/components/home/HomeStaticSections'
import { HotelPropertyCard } from '@/components/traveller/HotelPropertyCard'
import { PackageCard } from '@/components/traveller/PackageCard'
import { TourCard } from '@/components/traveller/TourCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatTourDuration, isExpedition, isShortEscape } from '@/lib/tourDuration'
import { useNextDepartures } from '@/queries/departureQueries'
import type { HotelBrowseItem } from '@/queries/hotelQueries'
import { useHotelBrowse } from '@/queries/hotelQueries'
import { useCuratedPackages, useFeaturedPackages, useSpecialOffers } from '@/queries/packageQueries'
import {
  type HomepageMixTour,
  useFeaturedTours,
  useHomepageMixTours,
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

function renderTourCards(
  tours: any[],
  seen?: Set<string>,
  departures?: Record<string, string>,
): ReactNode[] {
  const out: ReactNode[] = []
  for (const tour of tours) {
    // Cross-rail de-duplication. Four rails query the same small table with
    // is_featured leading most sorts, so without this the SAME trip appeared in
    // three rows — the mechanical cause of the homepage "feeling thin" while
    // claiming 16 cards.
    if (seen) {
      if (seen.has(tour.id)) continue
      seen.add(tour.id)
    }
    out.push(
      <TourCard
        key={`tour-${tour.id}`}
        id={tour.id}
        slug={tour.slug ?? undefined}
        image={tour.images?.[0] || TOUR_FALLBACK_IMG}
        title={tour.title}
        location={tour.location}
        duration={formatTourDuration(tour.durationDays)}
        rating={tour.rating}
        reviewCount={tour.reviewCount}
        price={typeof tour.tourPrice === 'number' ? tour.tourPrice : 0}
        currency={tour.currency || 'PKR'}
        type={tour.badge || 'Tour'}
        isFeatured={tour.badge === 'Featured'}
        shortDescription={tour.shortDescription}
        departureDate={departures?.[tour.id] ?? null}
      />,
    )
  }
  return out
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
  minCards = 3,
}: {
  title: string
  subtitle?: string
  viewAllHref: string
  isLoading: boolean
  cards: ReactNode[]
  /** Hide the row unless it can show at least this many cards. A one-card row
   *  reads as broken, so a thin catalogue shows fewer sections instead. */
  minCards?: number
}) {
  if (!isLoading && cards.length < Math.max(1, minCards)) return null

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
  // The whole live catalogue, newest first — powers New arrivals + the trip-length rails.
  // This hook already existed and was already ordered created_at desc; the homepage
  // simply never called it, which is why there was no "New arrivals" row.
  const mixQ = useHomepageMixTours(96)
  // Real departure dates for the cards — one batched query over the ids on screen.
  const departureIds = useMemo(
    () => [
      ...new Set([
        ...(mixQ.data ?? []).map((t: HomepageMixTour) => t.id),
        ...(featTourQ.data ?? []).map((t: any) => t.id),
        ...(northernQ.data ?? []).map((t: any) => t.id),
        ...(adventureQ.data ?? []).map((t: any) => t.id),
        ...(hikingQ.data ?? []).map((t: any) => t.id),
      ]),
    ],
    [mixQ.data, featTourQ.data, northernQ.data, adventureQ.data, hikingQ.data],
  )
  const { data: departures } = useNextDepartures(departureIds)

  const offers = useMemo(() => renderPackageCards(offersQ.data ?? []), [offersQ.data])
  const hotels = useMemo(() => renderHotelCards(hotelsQ.data ?? []), [hotelsQ.data])
  const featuredStays = useMemo(() => renderPackageCards(featPkgQ.data ?? []), [featPkgQ.data])
  const topRated = useMemo(() => renderPackageCards(topRatedQ.data ?? []), [topRatedQ.data])
  const couples = useMemo(() => renderPackageCards(couplesQ.data ?? []), [couplesQ.data])
  const family = useMemo(() => renderPackageCards(familyQ.data ?? []), [familyQ.data])
  const weekend = useMemo(() => renderPackageCards(weekendQ.data ?? []), [weekendQ.data])
  const newArrivals = useMemo(() => renderPackageCards(newQ.data ?? []), [newQ.data])
  // Rail strategy for a SMALL catalogue.
  //
  // The audit's finding was that four rails all sorted by is_featured showed the same
  // trips in the same order — repetition that carried no information. The fix is that
  // each rail must answer a DIFFERENT question, not that a trip may appear only once:
  // a trip legitimately is both "new" and "in Northern Pakistan" (Netflix works this way).
  //
  // So: the two GENERIC rails (New / Handpicked) de-duplicate against each other, while
  // the THEMATIC rails (place, trip length, category) draw from the full pool. Every rail
  // then hides itself below MIN_RAIL_CARDS, because a one-card row reads as broken.
  const tourRails = useMemo(() => {
    const mix = mixQ.data ?? []
    const generic = new Set<string>()
    const newArrivals = renderTourCards(mix.slice(0, 8), generic, departures)
    const featured = renderTourCards(featTourQ.data ?? [], generic, departures)
    return {
      newArrivals,
      featured,
      northern: renderTourCards(northernQ.data ?? [], undefined, departures),
      shortEscapes: renderTourCards(
        mix.filter((t: HomepageMixTour) => isShortEscape(t.durationDays)),
      ),
      expeditions: renderTourCards(
        mix.filter((t: HomepageMixTour) => isExpedition(t.durationDays)),
      ),
      adventure: renderTourCards(adventureQ.data ?? [], undefined, departures),
      hiking: renderTourCards(hikingQ.data ?? [], undefined, departures),
    }
  }, [mixQ.data, featTourQ.data, northernQ.data, adventureQ.data, hikingQ.data, departures])
  const featTours = tourRails.featured
  const adventure = tourRails.adventure
  const hiking = tourRails.hiking
  const northern = tourRails.northern

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
            {/* Section order follows the tours-only homepage plan: what's new →
                what we vouch for → where → how long → how much → how it works →
                supply. Rails de-duplicate against each other and self-hide when
                the catalogue is too small to fill them. */}
            <TrustBand />

            <FeedSection
              title="New on TripAvail"
              subtitle="Freshly added by verified operators"
              viewAllHref="/search?types=tour&sort=newest"
              isLoading={mixQ.isLoading}
              cards={tourRails.newArrivals}
            />

            <FeedSection
              title="Handpicked by TripAvail"
              subtitle="Real photos, transparent pricing"
              viewAllHref="/tours"
              isLoading={featTourQ.isLoading}
              cards={featTours}
            />

            <DestinationTiles />

            <FeedSection
              title="Northern Pakistan"
              subtitle="Hunza, Skardu, Naran, Swat and Fairy Meadows"
              viewAllHref="/explore/tours/collections/pakistan-northern"
              isLoading={northernQ.isLoading}
              cards={northern}
            />

            <FeedSection
              title="Short escapes"
              subtitle="Day trips and weekenders, 1–3 days"
              viewAllHref="/search?types=tour"
              isLoading={mixQ.isLoading}
              cards={tourRails.shortEscapes}
            />

            <FeedSection
              title="Big expeditions"
              subtitle="Seven days and up, for the long haul"
              viewAllHref="/search?types=tour"
              isLoading={mixQ.isLoading}
              cards={tourRails.expeditions}
            />

            <BudgetChips />

            <FeedSection
              title="Adventure & jeep safaris"
              subtitle="High passes, glaciers and off-road valleys"
              viewAllHref="/explore/tours/categories/adventure-trips"
              isLoading={adventureQ.isLoading}
              cards={adventure}
            />

            <FeedSection
              title="Hiking & nature"
              subtitle="Treks, alpine lakes and forest trails"
              viewAllHref="/explore/tours/categories/hiking-trips"
              isLoading={hikingQ.isLoading}
              cards={hiking}
            />

            <HowItWorks />
            <OperatorCta />
          </>
        )}

        {mode === 'events' && (
          <Card className="mt-2 rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
            <Ticket className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">Events are coming</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Concerts, festivals, and local experiences with verified tickets — launching soon. In
              the meantime, explore hotels and tours.
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
