import { BedDouble } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { ExploreControls } from '@/components/home/ExploreControls'
import { HotelPropertyCard } from '@/components/traveller/HotelPropertyCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHotelBrowse } from '@/queries/hotelQueries'

export default function HotelsPage() {
  const { data: hotels = [], isLoading, isError } = useHotelBrowse()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Same search + Hotels/Tours/Events row as home. The current-route
            pill is active; clicking a sibling navigates. */}
        <ExploreControls
          activeMode="hotels"
          onModeSelect={(m) => navigate(m === 'hotels' ? '/hotels' : m === 'tours' ? '/tours' : '/events')}
          className="mb-10"
        />

        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hotels</h1>
            <p className="text-muted-foreground font-medium">
              Browse properties — open one to book a room or a curated stay.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl border-border/60 font-bold">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>

        {isError ? (
          <Card className="rounded-2xl border border-border/60 p-6 text-sm text-muted-foreground">
            Unable to load hotels right now. Please try again.
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Card key={i} className="rounded-2xl border border-border/60 overflow-hidden">
                <div className="aspect-[4/5]">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                  <Skeleton className="h-9 w-28 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        ) : hotels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hotels.map((hotel) => (
              <HotelPropertyCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 py-16 px-6 text-center">
            <BedDouble className="w-9 h-9 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-foreground">No properties are live yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              New stays are being added. Check back soon, or explore tours in the meantime.
            </p>
            <Button asChild className="mt-5 rounded-xl">
              <Link to="/tours">Browse tours</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
