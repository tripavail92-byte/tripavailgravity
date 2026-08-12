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
import { SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AirbnbSearchBar } from '@/components/search/AirbnbSearchBar'
import { HotelResultsGrid } from '@/components/search/HotelResultsGrid'
import { SearchFilterPanel } from '@/components/search/SearchFilterPanel'
import { SearchResultsGrid } from '@/components/search/SearchResultsGrid'
import { Button } from '@/components/ui/button'
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

export default function SearchPage() {
  const t = useT()
  const [searchParams, setSearchParams] = useSearchParams()
  const { coords: geoCoords } = useTravellerCoords()
  const setSelectedCityByName = useTravellerCityStore((s) => s.setSelectedCityByName)

  // Coordinates passed explicitly on the URL (from the "Nearby" action) win
  // over the ambient geolocation hook — that's what makes a nearest search
  // reliable on the FIRST location grant, without waiting for the
  // read-if-already-granted hook to catch up. They are coarse (~1 km) by
  // construction, so no precise location rides in the URL.
  const urlLat = numOrNull(searchParams.get('lat'))
  const urlLng = numOrNull(searchParams.get('lng'))
  const coords =
    urlLat != null && urlLng != null ? { latitude: urlLat, longitude: urlLng } : geoCoords

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

  // Min + max must be written in ONE setSearchParams call. Calling setParam
  // twice would rebuild from the same stale `searchParams` closure and the
  // second write would clobber the first (classic batched-router pitfall).
  const setPriceRange = (min: number | null, max: number | null) => {
    const next = new URLSearchParams(searchParams)
    if (min == null) next.delete('minPrice')
    else next.set('minPrice', String(min))
    if (max == null) next.delete('maxPrice')
    else next.set('maxPrice', String(max))
    setSearchParams(next)
  }

  const clearAllFilters = () => {
    const next = new URLSearchParams(searchParams)
    for (const k of ['minPrice', 'maxPrice', 'minRating', 'country', 'category']) next.delete(k)
    setSearchParams(next)
  }

  // Mobile filter sheet open state (desktop uses the always-visible sidebar).
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false)

  // Category options for the Tours filter are the distinct badges present in
  // the tour results — exactly what the RPC's p_category matches, so a click
  // always narrows correctly. We cache the full (category-unfiltered) list so
  // that selecting a category doesn't collapse the chip list to just the one
  // selected (which would trap the traveller — they couldn't switch without
  // clearing first).
  const categoryOptionsLive = useMemo(() => {
    const counts = new Map<string, number>()
    for (const it of tourItems) {
      const b = (it.badge ?? '').trim()
      if (b) counts.set(b, (counts.get(b) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [tourItems])

  const [categoryCache, setCategoryCache] = useState<{ label: string; count: number }[]>([])
  useEffect(() => {
    if (!category && categoryOptionsLive.length) setCategoryCache(categoryOptionsLive)
  }, [category, categoryOptionsLive])
  const categoryOptions =
    category && categoryCache.length ? categoryCache : categoryOptionsLive

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
        {/* Results toolbar — sits BELOW the search bar. Heading + count on the
            left; type tabs, sort, and (mobile only) the Filters button on the
            right. On desktop, filtering lives in the left sidebar instead. */}
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
            {/* Type toggle — flip between the two surfaces without re-opening
                the search bar. */}
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

            {/* Sort — the "Recommended" control, now clearly in the results
                toolbar below the search fields. */}
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

            {/* Filters — MOBILE/TABLET ONLY. Desktop uses the persistent left
                sidebar below, so this button is hidden at lg+. */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 shrink-0 lg:hidden">
                  <SlidersHorizontal className="w-4 h-4" />
                  {t('search.filters')}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[88%] flex-col p-0 sm:max-w-sm">
                {/* sr-only title satisfies Radix's a11y requirement without
                    duplicating the panel's own visible "Filters" header. */}
                <SheetHeader className="sr-only">
                  <SheetTitle>{t('search.filters')}</SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5">
                  <SearchFilterPanel
                    activeType={activeType}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    minRating={minRating}
                    country={country}
                    category={category}
                    facets={facets}
                    categoryOptions={categoryOptions}
                    activeFilterCount={activeFilterCount}
                    onSetParam={setParam}
                    onSetPrice={setPriceRange}
                    onClearAll={clearAllFilters}
                  />
                </div>
                <div className="border-t border-border p-4">
                  <Button
                    className="w-full rounded-full"
                    onClick={() => setFiltersOpen(false)}
                  >
                    {t('search.showResults')} · {total.toLocaleString()}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Content: sticky filter sidebar (desktop) + results column. */}
        <div className="mt-6 flex flex-1 gap-8">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border/60 bg-background px-4 py-2 pr-2">
              <SearchFilterPanel
                activeType={activeType}
                minPrice={minPrice}
                maxPrice={maxPrice}
                minRating={minRating}
                country={country}
                category={category}
                facets={facets}
                categoryOptions={categoryOptions}
                activeFilterCount={activeFilterCount}
                onSetParam={setParam}
                onSetPrice={setPriceRange}
                onClearAll={clearAllFilters}
              />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex-1 space-y-10">
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
          </div>
        </div>
      </main>
    </div>
  )
}

function numOrNull(v: string | null): number | null {
  if (v == null || v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
