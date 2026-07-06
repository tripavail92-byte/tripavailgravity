import { Search, SlidersHorizontal, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { SearchOverlay } from '@/components/search/SearchOverlay'
import { SearchResultsGrid } from '@/components/search/SearchResultsGrid'
import { type SearchFilters, TripAvailSearchBar } from '@/components/search/TripAvailSearchBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSeo } from '@/hooks/useSeo'
import { useTravellerCoords } from '@/hooks/useTravellerCoords'
import { useTravellerCityStore } from '@/store/travellerCityStore'
import {
  type SearchListingType,
  type SearchSort,
  useSearchFacets,
  useUnifiedSearch,
} from '@/queries/searchQueries'

const SORT_OPTIONS: { value: SearchSort | ''; label: string }[] = [
  { value: '', label: 'Recommended' },
  { value: 'nearest', label: 'Nearest to me' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'newest', label: 'Newest' },
]

const RATINGS = [0, 3, 4, 4.5]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false)
  const { coords } = useTravellerCoords()
  const setSelectedCityByName = useTravellerCityStore((s) => s.setSelectedCityByName)

  // ---- read filters from the URL --------------------------------------------
  const q = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''
  const effectiveQuery = [q, location].map((s) => s.trim()).filter(Boolean).join(' ')

  const typesParam = useMemo(
    () =>
      (searchParams.get('types') || '')
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is SearchListingType => s === 'tour' || s === 'package'),
    [searchParams],
  )

  // Seed the shared geo origin from a searched place (non-destructive: only sets coords
  // when the term matches a known city, so "nearest" sort uses the searched destination).
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
    () => ({ ...baseFilters, types: typesParam, sort: (sort || undefined) as SearchSort | undefined }),
    [baseFilters, typesParam, sort],
  )

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUnifiedSearch(searchInput)
  const { data: facets } = useSearchFacets(baseFilters)

  const items = useMemo(() => (data?.pages ?? []).flatMap((p) => p.rows), [data])
  // Header count comes from facets (a single consistent snapshot); pagination is driven
  // by the per-page window total below.
  const total = facets?.total ?? data?.pages?.[0]?.total ?? 0

  const tourCount = facets?.types?.tour ?? 0
  const packageCount = facets?.types?.package ?? 0
  const showDistance = (sort || (effectiveQuery ? '' : coords ? 'nearest' : '')) === 'nearest'

  // ---- URL helpers ----------------------------------------------------------
  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value == null || value === '') next.delete(key)
    else next.set(key, value)
    setSearchParams(next)
  }

  const activeType: 'all' | SearchListingType =
    typesParam.length === 1 ? typesParam[0] : 'all'

  const activeFilterCount =
    (minPrice != null ? 1 : 0) +
    (maxPrice != null ? 1 : 0) +
    (minRating ? 1 : 0) +
    (country ? 1 : 0) +
    (category ? 1 : 0)

  // The overlay/search bar owns q/location/category/price/rating. Merge onto the current
  // URL so it never wipes the active type, sort or country selection.
  const handleAdvancedSearch = (filters: SearchFilters) => {
    const next = new URLSearchParams(searchParams)
    const put = (key: string, value: string | null | undefined) =>
      value ? next.set(key, value) : next.delete(key)

    put('q', filters.query)
    put('location', filters.location)
    put('category', filters.category && filters.category !== 'all' ? filters.category : null)
    put('minPrice', filters.priceRange[0] !== 0 ? String(filters.priceRange[0]) : null)
    put('maxPrice', filters.priceRange[1] !== 5000 ? String(filters.priceRange[1]) : null)
    put('minRating', filters.minRating > 0 ? String(filters.minRating) : null)

    setSearchParams(next)
    setIsSearchOverlayOpen(false)
  }

  const heading = effectiveQuery
    ? `Results for “${effectiveQuery}”`
    : country
      ? `Experiences in ${country}`
      : 'Explore everything'

  useSeo({
    title: effectiveQuery ? `Search: ${effectiveQuery}` : 'Search tours & stays',
    description: 'Search tours and hotel stays across every destination on TripAvail.',
    canonicalPath: '/search',
    noindex: true, // filtered result URLs shouldn't be indexed
  })

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top bar with search */}
      <div className="glass-nav border-b sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="hidden md:block flex-1">
            <TripAvailSearchBar
              onSearch={handleAdvancedSearch}
              onSearchOverlayToggle={(isOpen) => setIsSearchOverlayOpen(isOpen)}
              className="p-0 shadow-none"
            />
          </div>

          <button
            onClick={() => setIsSearchOverlayOpen(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2 glass-chip rounded-full text-sm font-medium"
          >
            <Search className="w-4 h-4" />
            Search destinations...
          </button>

          {/* Sort */}
          <select
            aria-label="Sort results"
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="h-9 rounded-full border border-border bg-background px-3 text-sm font-medium"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value || 'auto'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Filters sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <Separator className="my-4" />
              <div className="space-y-6">
                <div>
                  <Label>Price range</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Min"
                      defaultValue={minPrice ?? ''}
                      onBlur={(e) => setParam('minPrice', e.target.value || null)}
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Max"
                      defaultValue={maxPrice ?? ''}
                      onBlur={(e) => setParam('maxPrice', e.target.value || null)}
                    />
                  </div>
                  {facets?.priceMin != null && facets?.priceMax != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Available: {Math.round(facets.priceMin).toLocaleString()} –{' '}
                      {Math.round(facets.priceMax).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Minimum rating</Label>
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
                        {r === 0 ? 'Any' : (
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
                    <Label>Country</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => setParam('country', null)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                          !country ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted'
                        }`}
                      >
                        All
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

      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
        onSearch={handleAdvancedSearch}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? 'Searching…' : `${total.toLocaleString()} ${total === 1 ? 'result' : 'results'}`}
            </p>
          </div>

          {/* Type toggle with facet counts */}
          <div className="inline-flex rounded-full border border-border bg-background p-1 self-start">
            {[
              { key: 'all' as const, label: `All ${facets ? `(${tourCount + packageCount})` : ''}` },
              { key: 'tour' as const, label: `Tours ${facets ? `(${tourCount})` : ''}` },
              { key: 'package' as const, label: `Stays ${facets ? `(${packageCount})` : ''}` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setParam('types', t.key === 'all' ? null : t.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeType === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label.trim()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {isError ? (
            <div className="rounded-2xl border border-border/60 p-10 text-center text-sm text-muted-foreground">
              Something went wrong loading results. Please try again.
            </div>
          ) : (
            <SearchResultsGrid items={items} isLoading={isLoading} showDistance={showDistance} />
          )}
        </div>

        {hasNextPage && !isLoading && (
          <div className="mt-10 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
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
