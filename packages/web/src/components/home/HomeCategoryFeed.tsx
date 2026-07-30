import { Building2, Compass, type LucideIcon, Search, Sparkles, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { HotelPropertyCard } from '@/components/traveller/HotelPropertyCard'
import { PackageCard } from '@/components/traveller/PackageCard'
import { TourCard } from '@/components/traveller/TourCard'
import { type SearchFilters } from '@/components/search/TripAvailSearchBar'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { TravelAssistant } from '@/features/assistant/components/TravelAssistant'
import { cn } from '@/lib/utils'
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

type Mode = 'all' | 'hotels' | 'tours' | 'events'
const MODE_STORAGE_KEY = 'ta_home_mode'

interface ModeDef {
  key: Exclude<Mode, 'all'>
  label: string
  sub: string
  icon: LucideIcon
}

const MODES: ModeDef[] = [
  { key: 'hotels', label: 'Hotels', sub: 'Stays & properties', icon: Building2 },
  { key: 'tours', label: 'Tours', sub: 'Guided experiences', icon: Compass },
  { key: 'events', label: 'Events', sub: 'Coming soon', icon: Ticket },
]

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
 */
export function HomeCategoryFeed() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('all')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Restore the visitor's last-picked mode (Airbnb-style tab memory).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY)
      if (saved === 'hotels' || saved === 'tours' || saved === 'events') setMode(saved)
    } catch {
      /* private-mode / disabled storage — default 'all' is fine */
    }
  }, [])

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

  // ── Data. All prefetched; sections read from these. ──
  const offersQ = useSpecialOffers()
  const hotelsQ = useHotelBrowse()
  const featPkgQ = useFeaturedPackages()
  const topRatedQ = useCuratedPackages('top_rated')
  const couplesQ = useCuratedPackages('best_for_couples')
  const familyQ = useCuratedPackages('family_friendly')
  const weekendQ = useCuratedPackages('weekend_getaways')
  const newQ = useCuratedPackages('new_arrivals')
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

  // Search from the home page, pre-scoped to the active mode.
  const handleSearch = (filters: SearchFilters) => {
    const params = new URLSearchParams()
    if (filters.query) params.set('q', filters.query)
    if (filters.location) params.set('location', filters.location)
    if (mode === 'hotels') params.set('types', 'hotel')
    else if (mode === 'tours') params.set('types', 'tour')
    setSearchOpen(false)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <section aria-labelledby="home-explore-heading">
      <h2 id="home-explore-heading" className="sr-only">
        Explore TripAvail
      </h2>

      {/* ── Mode pills + Ask AI + Search ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          {MODES.map((m) => {
            const Icon = m.icon
            const active = mode === m.key
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => selectMode(m.key)}
                aria-pressed={active}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl border px-5 py-3 text-left transition-all duration-300',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 lg:scale-[1.03]'
                    : 'border-border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
                )}
              >
                <span
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors',
                    active
                      ? 'bg-white/20'
                      : 'bg-primary/10 text-primary group-hover:bg-primary/15',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-tight">{m.label}</span>
                  <span
                    className={cn(
                      'block text-xs',
                      active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {m.sub}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Search className="h-4 w-4" />
            <span>
              Search{' '}
              {mode === 'hotels' ? 'hotels' : mode === 'tours' ? 'tours' : 'everything'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-105"
          >
            <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
            Ask AI
          </button>
        </div>
      </div>

      {/* Ask AI — mounts lazily, so nothing is fetched until opened. */}
      <Dialog open={assistantOpen} onOpenChange={setAssistantOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Ask TripAvail</DialogTitle>
          </DialogHeader>
          {assistantOpen && <TravelAssistant className="max-h-[70vh]" />}
        </DialogContent>
      </Dialog>

      {/* Search — reuses the same overlay as the header, pre-scoped to the mode. */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearch}
      />

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
