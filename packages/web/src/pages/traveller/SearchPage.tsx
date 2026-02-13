import { type Hotel, searchService } from '@tripavail/shared/services/searchService'
import { SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { HotelGrid } from '@/components/search/HotelGrid'
import { SearchForm } from '@/components/search/SearchForm'
import { TripAvailSearchBar, type SearchFilters } from '@/components/search/TripAvailSearchBar'
import { SearchOverlay } from '@/components/search/SearchOverlay'
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
  const [searchParams] = useSearchParams()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({})
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false)

  // Parse URL params
  const location = searchParams.get('q') || undefined
  const guests = parseInt(searchParams.get('guests') || '1')
  const minRating = parseFloat(searchParams.get('minRating') || '0')

  const performSearch = useCallback(async () => {
    setIsLoading(true)
    try {
      const results = await searchService.searchHotels({
        location,
        guests,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
      })
      setHotels(results)
    } catch (error) {
      console.error('Search failed', error)
    } finally {
      setIsLoading(false)
    }
  }, [location, guests, priceRange.min, priceRange.max])

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
    
    window.history.pushState({}, '', `/search?${params.toString()}`)
    
    // Update price range and trigger search
    setPriceRange({
      min: filters.priceRange[0] !== 0 ? filters.priceRange[0] : undefined,
      max: filters.priceRange[1] !== 5000 ? filters.priceRange[1] : undefined
    })
    
    setIsSearchOverlayOpen(false)
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
          
          {/* Mobile: Logo */}
          <div className="md:hidden font-bold text-primary">TripAvail</div>

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
          {location ? `Stays in ${location}` : 'All Stays'}
        </h1>

        <HotelGrid hotels={hotels} isLoading={isLoading} />
      </main>
    </div>
  )
}
