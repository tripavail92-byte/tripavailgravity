import { type Hotel, searchService } from '@tripavail/shared/services/searchService'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { HotelGrid } from '@/components/search/HotelGrid'
import { SearchForm } from '@/components/search/SearchForm'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import { type SearchFilters, TripAvailSearchBar } from '@/components/search/TripAvailSearchBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({})
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false)

  const parsedCriteria = useMemo(() => {
    const q = searchParams.get('q') || ''
    const locationParam = searchParams.get('location') || ''
    const guests = Number.parseInt(searchParams.get('guests') || '1', 10)
    const minPrice = Number.parseInt(searchParams.get('minPrice') || '', 10)
    const maxPrice = Number.parseInt(searchParams.get('maxPrice') || '', 10)
    const minRating = Number.parseFloat(searchParams.get('minRating') || '0')

    return {
      location: (q || locationParam || undefined) as string | undefined,
      guests: Number.isFinite(guests) && guests > 0 ? guests : 1,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      minRating: Number.isFinite(minRating) ? minRating : 0,
    }
  }, [searchParams])

  const performSearch = useCallback(
    async (customFilters?: {
      location?: string
      guests?: number
      minPrice?: number
      maxPrice?: number
      minRating?: number
    }) => {
      setIsLoading(true)
      try {
        const effective = customFilters || {
          location: parsedCriteria.location,
          guests: parsedCriteria.guests,
          minPrice: parsedCriteria.minPrice ?? priceRange.min,
          maxPrice: parsedCriteria.maxPrice ?? priceRange.max,
          minRating: parsedCriteria.minRating,
        }

        const results = await searchService.searchHotels({
          location: effective.location,
          guests: effective.guests,
          minPrice: effective.minPrice,
          maxPrice: effective.maxPrice,
        })

        const filteredByRating =
          (effective.minRating || 0) > 0
            ? results.filter((h) => (h.rating ?? 0) >= (effective.minRating || 0))
            : results

        setHotels(filteredByRating)
      } catch (error) {
        console.error('Search failed', error)
      } finally {
        setIsLoading(false)
      }
    },
    [
      parsedCriteria.location,
      parsedCriteria.guests,
      parsedCriteria.minPrice,
      parsedCriteria.maxPrice,
      parsedCriteria.minRating,
      priceRange.min,
      priceRange.max,
    ],
  )

  // Initial load & when params change
  useEffect(() => {
    performSearch()
  }, [performSearch])

  // Real-time updates: Refetch if any hotel is updated (e.g. price change)
  useRealtimeSubscription({
    table: 'hotels',
    onData: (payload) => {
      console.log('Realtime update:', payload)
      performSearch()
    },
  })

  const handleAdvancedSearch = (filters: SearchFilters) => {
    // Update URL params based on filters
    const params = new URLSearchParams()
    if (filters.query) params.set('q', filters.query)
    if (filters.location) params.set('location', filters.location)
    if (filters.category && filters.category !== 'all') params.set('category', filters.category)
    if (filters.duration) params.set('duration', filters.duration)
    if (filters.priceRange[0] !== 0) params.set('minPrice', filters.priceRange[0].toString())
    if (filters.priceRange[1] !== 5000) params.set('maxPrice', filters.priceRange[1].toString())
    if (filters.minRating > 0) params.set('minRating', filters.minRating.toString())
    if (filters.experienceType.length > 0) params.set('types', filters.experienceType.join(','))

    setSearchParams(params)

    // Update price range state
    setPriceRange({
      min: filters.priceRange[0] !== 0 ? filters.priceRange[0] : undefined,
      max: filters.priceRange[1] !== 5000 ? filters.priceRange[1] : undefined,
    })

    setIsSearchOverlayOpen(false)

    // Trigger the actual search with the new filter values
    performSearch({
      location: filters.query || filters.location || undefined,
      guests: parsedCriteria.guests,
      minPrice: filters.priceRange[0] !== 0 ? filters.priceRange[0] : undefined,
      maxPrice: filters.priceRange[1] !== 5000 ? filters.priceRange[1] : undefined,
      minRating: filters.minRating > 0 ? filters.minRating : 0,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      {/* Top Bar with Compact Search - Glass Effect */}
      <div className="glass-nav border-b sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Desktop: Advanced Search Bar */}
          <div className="hidden md:block flex-1">
            <TripAvailSearchBar
              onSearch={handleAdvancedSearch}
              onSearchOverlayToggle={(isOpen) => setIsSearchOverlayOpen(isOpen)}
              className="p-0 shadow-none"
            />
          </div>

          {/* Mobile: Search Button */}
          <button
            onClick={() => setIsSearchOverlayOpen(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2 glass-chip rounded-full text-sm font-medium hover:active"
          >
            <Search className="w-4 h-4" />
            Search destinations...
          </button>

          {/* Filters Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Refine your search results</SheetDescription>
              </SheetHeader>
              <Separator className="my-4" />

              <div className="space-y-4">
                <div>
                  <Label>Price Range (per night)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          min: Number(e.target.value) || undefined,
                        }))
                      }
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          max: Number(e.target.value) || undefined,
                        }))
                      }
                    />
                  </div>
                </div>
                {/* More filters (Amenities) could go here */}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search Overlay for Mobile */}
      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
        onSearch={handleAdvancedSearch}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">
          {parsedCriteria.location ? `Stays in ${parsedCriteria.location}` : 'All Stays'}
        </h1>

        <HotelGrid hotels={hotels} isLoading={isLoading} />
      </main>
    </div>
  )
}
