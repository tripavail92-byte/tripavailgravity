import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ExploreControls } from '@/components/home/ExploreControls'
import { SearchResultsGrid } from '@/components/search/SearchResultsGrid'
import { TourCard } from '@/components/traveller/TourCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useSeo } from '@/hooks/useSeo'
import { useTravellerCoords } from '@/hooks/useTravellerCoords'
import { formatTourDuration, isExpedition, isShortEscape } from '@/lib/tourDuration'
import { useNextDepartures } from '@/queries/departureQueries'
import { useNearbyTours } from '@/queries/pickupQueries'
import { type HomepageMixTour, useHomepageMixTours } from '@/queries/tourQueries'

/**
 * /tours — the catalogue.
 *
 * This used to render "All Tours" followed by five more rails (Featured, Top Rated,
 * Adventure, Hiking, Northern) all drawn from the SAME rows, so each trip appeared
 * three or four times, duration was hardcoded to "Multi-day", and there was no result
 * count and no way to narrow. It made a small catalogue look padded rather than
 * curated. It is now one filterable grid over the live catalogue.
 */

type DurationFilter = 'any' | 'short' | 'week' | 'long'
type SortMode = 'newest' | 'price_asc' | 'price_desc' | 'nearest_pickup'

const DURATION_LABEL: Record<DurationFilter, string> = {
  any: 'Any length',
  short: '1–3 days',
  week: '4–6 days',
  long: '7+ days',
}

function matchesDuration(t: HomepageMixTour, f: DurationFilter): boolean {
  if (f === 'any') return true
  if (f === 'short') return isShortEscape(t.durationDays)
  if (f === 'long') return isExpedition(t.durationDays)
  const n = Number(t.durationDays)
  return Number.isFinite(n) && n >= 4 && n <= 6
}

export default function ToursPage() {
  const navigate = useNavigate()
  const { coords } = useTravellerCoords()

  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [category, setCategory] = useState<string>('all')
  const [destination, setDestination] = useState<string>('all')
  const [duration, setDuration] = useState<DurationFilter>('any')

  const allToursQuery = useHomepageMixTours(96)
  const tours = useMemo(() => allToursQuery.data ?? [], [allToursQuery.data])
  // Real next-departure dates for the visible cards — one batched query.
  const { data: departures } = useNextDepartures(useMemo(() => tours.map((t) => t.id), [tours]))

  useSeo({
    title: 'Tours & trips in Pakistan',
    description:
      'Browse verified guided tours and trips across northern Pakistan — Hunza, Skardu, Naran, Swat and more. Transparent pricing and secure booking.',
    canonicalPath: '/tours',
  })

  // "Nearest pickup" uses the same canonical hook as /search — tours ranked by
  // nearest pickup point, rendered through SearchResultsGrid so the distance chip shows.
  const nearbyPickup = Boolean(coords) && sortMode === 'nearest_pickup'
  const nearbyToursQuery = useNearbyTours(
    { userLat: coords?.latitude ?? 0, userLng: coords?.longitude ?? 0, radiusKm: 500, limit: 96 },
    { enabled: nearbyPickup },
  )

  // Facets are derived from the live catalogue, so we never offer a filter that
  // would return nothing.
  const categories = useMemo(() => {
    const set = new Map<string, string>()
    for (const t of tours) {
      const raw = (t.tourType || '').trim()
      if (raw) set.set(raw.toLowerCase(), raw)
    }
    return [...set.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [tours])

  const destinations = useMemo(() => {
    const set = new Map<string, string>()
    for (const t of tours) {
      const city = (t.destinationCities?.[0] || '').trim()
      if (city) set.set(city.toLowerCase(), city)
    }
    return [...set.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [tours])

  const filtered = useMemo(() => {
    const out = tours.filter((t) => {
      if (category !== 'all' && (t.tourType || '').toLowerCase() !== category) return false
      if (destination !== 'all' && (t.destinationCities?.[0] || '').toLowerCase() !== destination)
        return false
      if (!matchesDuration(t, duration)) return false
      return true
    })
    const price = (t: HomepageMixTour) => (typeof t.tourPrice === 'number' ? t.tourPrice : Infinity)
    if (sortMode === 'price_asc') return [...out].sort((a, b) => price(a) - price(b))
    if (sortMode === 'price_desc') return [...out].sort((a, b) => price(b) - price(a))
    return out // the query already returns newest first
  }, [tours, category, destination, duration, sortMode])

  const hasFilters = category !== 'all' || destination !== 'all' || duration !== 'any'
  const clearFilters = () => {
    setCategory('all')
    setDestination('all')
    setDuration('any')
  }

  const skeletons = (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-2xl border border-border/60">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ExploreControls activeMode="tours" />

        <header className="mt-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Tours &amp; trips
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {allToursQuery.isLoading
              ? 'Loading trips…'
              : `${filtered.length} ${filtered.length === 1 ? 'trip' : 'trips'}${
                  hasFilters ? ` of ${tours.length}` : ''
                } from verified operators`}
          </p>
        </header>

        {/* Filters — derived from the live catalogue */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {categories.length > 1 && (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 w-[170px] rounded-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(([key, label]) => (
                  <SelectItem key={key} value={key} className="capitalize">
                    {label.replace(/-/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {destinations.length > 1 && (
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="h-10 w-[180px] rounded-full">
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All destinations</SelectItem>
                {destinations.map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={duration} onValueChange={(v) => setDuration(v as DurationFilter)}>
            <SelectTrigger className="h-10 w-[150px] rounded-full">
              <SelectValue placeholder="Trip length" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DURATION_LABEL) as DurationFilter[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {DURATION_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="h-10 w-[170px] rounded-full">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
              {coords ? <SelectItem value="nearest_pickup">Nearest pickup</SelectItem> : null}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" className="h-10 rounded-full" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Results */}
        <div className="mt-8">
          {nearbyPickup ? (
            <SearchResultsGrid
              items={nearbyToursQuery.data ?? []}
              isLoading={nearbyToursQuery.isLoading}
              showDistance
            />
          ) : allToursQuery.isLoading ? (
            skeletons
          ) : filtered.length === 0 ? (
            <Card className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
              <p className="text-lg font-semibold text-foreground">No trips match those filters</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Try a different destination or trip length — the catalogue is growing every week.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button className="rounded-full" onClick={clearFilters}>
                  Clear filters
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => navigate('/search?types=tour')}
                >
                  Search all trips
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tour) => (
                <TourCard
                  key={tour.id}
                  id={tour.id}
                  slug={tour.slug ?? undefined}
                  image={tour.images?.[0] || ''}
                  title={tour.title}
                  location={tour.location}
                  duration={formatTourDuration(tour.durationDays)}
                  rating={tour.rating}
                  reviewCount={tour.reviewCount}
                  price={typeof tour.tourPrice === 'number' ? tour.tourPrice : 0}
                  currency={tour.currency || 'PKR'}
                  type={tour.tourType || 'Tour'}
                  isFeatured={Boolean(tour.isFeatured)}
                  shortDescription={tour.shortDescription ?? undefined}
                  departureDate={departures?.[tour.id] ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
