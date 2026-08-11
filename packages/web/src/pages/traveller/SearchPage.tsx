// DIFF: complete replacement of the top-bar block and the SearchOverlay
// mount. The Sort <select> and Filters <Sheet> are RETAINED — only the
// search UIs (TripAvailSearchBar + mobile compact pill + the top-bar Ask AI
// button) are removed. AirbnbSearchBar now mounts above the results header
// and provides the single Ask AI entry point.
//
// Removed imports: SearchOverlay, TripAvailSearchBar, SearchFilters,
//                  Sparkles, TravelAssistant, Dialog, useState (only if no
//                  longer used — kept here because Sheet still needs no
//                  state; if TS complains about unused, drop it).
// Kept imports:    everything else the page still uses.
import { SlidersHorizontal, Star } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AirbnbSearchBar } from '@/components/search/AirbnbSearchBar'
import { HotelResultsGrid } from '@/components/search/HotelResultsGrid'
import { SearchResultsGrid } from '@/components/search/SearchResultsGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useSeo } from '@/hooks/useSeo'
import { useT } from '@/hooks/useT'
import { useTravellerCoords } from '@/hooks/useTravellerCoords'
import { useHotelSearch } from '@/queries/hotelQueries'
import { type SearchSort, useSearchFacets, useUnifiedSearch } from '@/queries/searchQueries'
import { useTravellerCityStore } from '@/store/travellerCityStore'

type SearchType = 'hotel' | 'tour'
type ActiveType = 'all' | SearchType

const SORT_OPTIONS: { value: SearchSort | ''; labelKey: string }[] = [
  { value: '', labelKey: 'search.sortRecommended' },
  { value: 'nearest', labelKey: 'search.sortNearest' },
  { value: 'price_asc', labelKey: 'search.sortPriceLow' },
  { value: 'price_desc', labelKey: 'search.sortPriceHigh' },
  { value: 'rating', labelKey: 'search.sortRating' },
  { value: 'newest', labelKey: 'search.sortNewest' },
]

const RATINGS = [0, 3, 4, 4.5]

export default function SearchPage() {
  const t = useT()
  const [searchParams, setSearchParams] = useSearchParams()
  const { coords } = useTravellerCoords()
  const setSelectedCityByName = useTravellerCityStore((s) => s.setSelectedCityByName)

  const q = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''
  const effectiveQuery = [q, location]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ')

  const activeType: ActiveType = useMemo(() => {
    const raw = (searchParams.get('types') || '').trim().toLowerCase()
    if (raw === 'tour') return 'tour'
    if (raw === 'hotel' || raw === 'package') return 'hotel'
    return 'all'
  }, [searchParams])

  useEffect(() => {
    const seed = (location || q).trim()
    if (seed) setSelectedCityByName(seed)
  }, [location, q, setSelectedCityByName])

  const country = searchParams.get('country') || ''
  const category = searchParams.get('category') || ''
  const minPrice = numOrNull(searchParams.get('minPrice'))
  const maxPrice = numOrNull(searchParams.get('maxPrice'))
  const minRating = numOrNull(searchParams.get('minRating'))
  const sort = (searchParams.get('sort') || '') as SearchSort | ''

  const baseFilters = useMemo(
    () => ({
      query: effectiveQuery || null,
      lat: coords?.latitude ?? null,
      lng: coords?.longitude ?? null,
      minPrice,
      maxPrice,
      minRating,
      country: country || null,
      category: category || null,
    }),
    [effectiveQuery, coords?.latitude, coords?.longitude, minPrice, maxPrice, minRating, country, category],
  )

  const searchInput = useMemo(
    () => ({ ...baseFilters, sort: (sort || undefined) as SearchSort | undefined }),
    [baseFilters, sort],
  )

  const wantsHotels = activeType === 'all' || activeType === 'hotel'
  const wantsTours = activeType === 'all' || activeType === 'tour'

  const hotelQuery = useHotelSearch(searchInput, { enabled: wantsHotels })
  const tourQuery = useUnifiedSearch({ ...searchInput, types: ['tour'] }, { enabled: wantsTours })

  const { data: facets } = useSearchFacets(baseFilters)

  const hotelItems = useMemo(
    () => (hotelQuery.data?.pages ?? []).flatMap((p) => p.rows),
    [hotelQuery.data],
  )
  const tourItems = useMemo(
    () => (tourQuery.data?.pages ?? []).flatMap((p) => p.rows),
    [tourQuery.data],
  )

  const hotelTotal = hotelQuery.data?.pages?.[0]?.total ?? 0
  const tourTotal = tourQuery.data?.pages?.[0]?.total ?? 0
  const total =
    activeType === 'hotel' ? hotelTotal : activeType === 'tour' ? tourTotal : hotelTotal + tourTotal

  const isLoading =
    (wantsHotels && hotelQuery.isLoading) || (wantsTours && tourQuery.isLoading)
  const isError = hotelQuery.isError || tourQuery.isError

  const showDistance = (sort || (effectiveQuery ? '' : coords ? 'nearest' : '')) === 'nearest'

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value == null || value === '') next.delete(key)
    else next.set(key, value)
    setSearchParams(next)
  }

  const activeFilterCount =
    (minPrice != null ? 1 : 0) +
    (maxPrice != null ? 1 : 0) +
    (minRating ? 1 : 0) +
    (country ? 1 : 0) +
    (category ? 1 : 0)

  const heading = effectiveQuery
    ? t('search.resultsFor', { query: effectiveQuery })
    : country
      ? t('search.experiencesIn', { country })
      : t('search.exploreEverything')

  useSeo({
    title: effectiveQuery ? `Search: ${effectiveQuery}` : 'Search tours & stays',
    description: 'Search tours and hotel stays across every destination on TripAvail.',
    canonicalPath: '/search',
    noindex: true,
  })

  // Tab preselect: /search?types=tour opens the bar on Tours; hotel/all → Hotels.
  const defaultTab = activeType === 'tour' ? 'tour' : 'hotel'

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* ONE search bar for the whole app — Airbnb-style, sticky, morphs on
          scroll, and provides Ask AI. Every other search UI on this page has
          been removed. */}
      <AirbnbSearchBar defaultTab={defaultTab === 'tour' ? 'tours' : 'hotels'} />

      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading
                ? t('search.searching')
                : t('search.results', { count: total.toLocaleString() })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            {/* Type toggle — kept: it lets the traveller flip between the two
                surfaces without re-opening the search bar. */}
            <div className="inline-flex rounded-full border border-border bg-background p-1">
              {[
                { key: 'all' as const, label: `${t('search.all')} (${hotelTotal + tourTotal})` },
                { key: 'hotel' as const, label: `Hotels (${hotelTotal})` },
                { key: 'tour' as const, label: `${t('search.tours')} (${tourTotal})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setParam('types', tab.key === 'all' ? null : tab.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    activeType === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label.trim()}
                </button>
              ))}
            </div>

            {/* Sort — kept. */}
            <select
              aria-label="Sort results"
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="h-9 rounded-full border border-border bg-background px-3 text-sm font-medium"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value || 'auto'} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>

            {/* Filters — kept. */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                  {t('search.filters')}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t('search.filters')}</SheetTitle>
                </SheetHeader>
                <Separator className="my-4" />
                <div className="space-y-6">
                  <div>
                    <Label>{t('search.priceRange')}</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder={t('search.min')}
                        defaultValue={minPrice ?? ''}
                        onBlur={(e) => setParam('minPrice', e.target.value || null)}
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder={t('search.max')}
                        defaultValue={maxPrice ?? ''}
                        onBlur={(e) => setParam('maxPrice', e.target.value || null)}
                      />
                    </div>
                    {facets?.priceMin != null && facets?.priceMax != null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('search.available')}: {Math.round(facets.priceMin).toLocaleString()} –{' '}
                        {Math.round(facets.priceMax).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>{t('search.minRating')}</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {RATINGS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setParam('minRating', r > 0 ? String(r) : null)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                            (minRating ?? 0) === r
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background hover:bg-muted'
                          }`}
                        >
                          {r === 0 ? (
                            t('search.any')
                          ) : (
                            <>
                              {r}
                              <Star className="h-3.5 w-3.5 fill-current" />+
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {facets && facets.countries.length > 0 && (
                    <div>
                      <Label>{t('search.country')}</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => setParam('country', null)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                            !country
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background hover:bg-muted'
                          }`}
                        >
                          {t('search.all')}
                        </button>
                        {facets.countries.map((c) => (
                          <button
                            key={c.country}
                            onClick={() => setParam('country', c.country)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                              country === c.country
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background hover:bg-muted'
                            }`}
                          >
                            {c.country} ({c.count})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="mt-6 flex-1 flex flex-col space-y-10">
          {isError ? (
            <div className="m-auto w-full max-w-md rounded-2xl border border-border/60 p-10 text-center text-sm text-muted-foreground">
              {t('search.error')}
            </div>
          ) : activeType === 'hotel' ? (
            <HotelResultsGrid hotels={hotelItems} isLoading={hotelQuery.isLoading} showDistance={showDistance} />
          ) : activeType === 'tour' ? (
            <SearchResultsGrid items={tourItems} isLoading={tourQuery.isLoading} showDistance={showDistance} />
          ) : (
            <>
              {(hotelItems.length > 0 || hotelQuery.isLoading) && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-foreground">
                    Hotels {hotelTotal > 0 ? `(${hotelTotal})` : ''}
                  </h2>
                  <HotelResultsGrid hotels={hotelItems} isLoading={hotelQuery.isLoading} showDistance={showDistance} />
                </section>
              )}
              {(tourItems.length > 0 || tourQuery.isLoading) && (
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-foreground">
                    {t('search.tours')} {tourTotal > 0 ? `(${tourTotal})` : ''}
                  </h2>
                  <SearchResultsGrid items={tourItems} isLoading={tourQuery.isLoading} showDistance={showDistance} />
                </section>
              )}
              {!hotelQuery.isLoading &&
                !tourQuery.isLoading &&
                hotelItems.length === 0 &&
                tourItems.length === 0 && <SearchResultsGrid items={[]} isLoading={false} />}
            </>
          )}
        </div>

        {wantsHotels && hotelQuery.hasNextPage && !hotelQuery.isLoading && (
          <div className="mt-10 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8"
              onClick={() => hotelQuery.fetchNextPage()}
              disabled={hotelQuery.isFetchingNextPage}
            >
              {hotelQuery.isFetchingNextPage ? t('search.loading') : `${t('search.loadMore')} · Hotels`}
            </Button>
          </div>
        )}
        {wantsTours && tourQuery.hasNextPage && !tourQuery.isLoading && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8"
              onClick={() => tourQuery.fetchNextPage()}
              disabled={tourQuery.isFetchingNextPage}
            >
              {tourQuery.isFetchingNextPage ? t('search.loading') : `${t('search.loadMore')} · ${t('search.tours')}`}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

function numOrNull(v: string | null): number | null {
  if (v == null || v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
