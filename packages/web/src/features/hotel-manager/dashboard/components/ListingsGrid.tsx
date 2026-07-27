import { Building, Grid, List, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { hotelService } from '@/features/hotel-listing/services/hotelService'
import { useAuth } from '@/hooks/useAuth'

import { ListingCard } from './ListingCard'

export function ListingsGrid() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const fetchListings = async () => {
      setLoading(true)
      const result = await hotelService.fetchPublishedListings(user.id)
      if (result.success && result.listings) {
        setListings(result.listings)
      }
      setLoading(false)
    }

    fetchListings()
  }, [user?.id])

  const handleNewListing = () => {
    navigate('/manager/list-hotel')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-96 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Your Listings</h2>
          <p className="text-muted-foreground mt-1">{listings.length} published properties</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button className="p-2 rounded-md bg-card text-foreground shadow-sm">
              <Grid className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-md text-muted-foreground hover:text-foreground">
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            data-tour="add-property"
            onClick={handleNewListing}
            className="bg-primary-gradient text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Listing
          </Button>
        </div>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-xl border-2 border-dashed border-border">
          <div className="mb-4">
            <Building className="w-16 h-16 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No published listings yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first listing to start receiving bookings
          </p>
          <Button
            data-tour="add-property"
            onClick={handleNewListing}
            className="bg-primary-gradient text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Listing
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
            >
              <ListingCard
                id={listing.id}
                name={listing.name}
                location={listing.location || 'Location not set'}
                status="published"
                imageUrl={listing.images?.[0]}
                bookings={undefined}
                rating={undefined}
                revenue={undefined}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
