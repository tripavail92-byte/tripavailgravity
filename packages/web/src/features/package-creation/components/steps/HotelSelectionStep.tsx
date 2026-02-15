import { supabase } from '@tripavail/shared/core/client'
import { AlertCircle, Building2, Check, Loader2, MapPin, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { StepData } from '../../types'

interface HotelSelectionStepProps {
  onComplete: (data: StepData) => void
  onUpdate: (data: StepData) => void
  existingData?: StepData
  onBack?: () => void
}

interface Hotel {
  id: string
  name: string
  address: string
  city?: string
  country?: string
  roomCount?: number
  status?: 'draft' | 'published'
}

export function HotelSelectionStep({
  onComplete,
  onUpdate,
  existingData,
}: HotelSelectionStepProps) {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's hotels
  const fetchUserHotels = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🏨 HotelSelectionStep: Fetching user hotels from Supabase')

      // Fetch published hotels from Supabase (selecting only core columns)
      const { data: hotelsData, error: fetchError } = await supabase
        .from('hotels')
        .select('id, name, address, location, is_published')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Error fetching hotels:', fetchError)
        throw fetchError
      }

      console.log('📦 Hotels fetched from database:', hotelsData)

      if (!hotelsData) {
        console.error('❌ hotelsData is undefined!')
        setError('Failed to load hotels from database.')
        setLoading(false)
        return
      }

      // Fetch room counts separately for each hotel
      const hotelsWithRooms = await Promise.all(
        hotelsData.map(async (hotel) => {
          const { count } = await supabase
            .from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', hotel.id)

          return {
            id: hotel.id,
            name: hotel.name,
            address: hotel.address || hotel.location || 'No address',
            city: undefined,
            country: undefined,
            roomCount: count || 0,
            status: 'published' as const,
          }
        }),
      )

      const userHotels: Hotel[] = hotelsWithRooms

      console.log(`✅ Loaded ${userHotels.length} hotel(s)`)
      setHotels(userHotels)

      // Auto-select and skip if only 1 hotel
      if (userHotels.length === 1) {
        const hotel = userHotels[0]
        setSelectedHotel(hotel)
        console.log('🎯 Auto-selecting single hotel:', hotel.name)
        // Auto-complete and move to next step
        setTimeout(() => {
          onComplete({
            hotelId: hotel.id,
            hotelName: hotel.name,
            hotelAddress: hotel.address,
          })
        }, 500)
      } else if (userHotels.length === 0) {
        setError('No hotels found. Please create a hotel listing first.')
      }

      // Restore previously selected hotel if exists
      if (existingData?.hotelId) {
        const existing = userHotels.find((h) => h.id === existingData.hotelId)
        if (existing) {
          console.log('✅ Restored previously selected hotel:', existing.name)
          setSelectedHotel(existing)
        }
      }
    } catch (err) {
      setError('Failed to load your hotels. Please try again.')
      console.error('❌ Error fetching hotels:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserHotels()
  }, [])

  const handleSelectHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel)
    onUpdate({
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelAddress: hotel.address,
    })
  }

  const handleContinue = () => {
    if (!selectedHotel) {
      setError('Please select a hotel to continue.')
      return
    }

    onComplete({
      hotelId: selectedHotel.id,
      hotelName: selectedHotel.name,
      hotelAddress: selectedHotel.address,
    })
  }

  // Loading State
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Hotel</h2>
          <p className="text-gray-600">Choose which hotel this package is for</p>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-gray-600">Loading your hotels...</p>
          </div>
        </Card>
      </div>
    )
  }

  // Error State
  if (error && hotels.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Hotel</h2>
          <p className="text-gray-600">Choose which hotel this package is for</p>
        </div>
        <Card className="p-8 bg-error/5 border-error/20">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-error" />
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">No Hotels Found</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => (window.location.href = '/manager/list-hotel')}>
                <Plus size={18} className="mr-2" />
                Create Hotel Listing
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Auto-skip message (shown briefly before auto-continuing)
  if (hotels.length === 1 && selectedHotel) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Hotel</h2>
          <p className="text-gray-600">Choose which hotel this package is for</p>
        </div>
        <Card className="p-8 bg-success/5 border-success/20">
          <div className="flex items-center gap-4">
            <Check className="w-8 h-8 text-success flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Hotel Selected</h3>
              <p className="text-gray-600">
                Automatically selected <strong>{selectedHotel.name}</strong>
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Multiple Hotels Selection
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Hotel</h2>
        <p className="text-gray-600">Choose which hotel this package is for</p>
      </div>

      {/* Info Banner */}
      <Card className="p-4 bg-info/5 border-info/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Package-Hotel Link</p>
            <p>
              Each package is linked to a specific hotel. Room prices and availability will be
              fetched from the selected hotel.
            </p>
          </div>
        </div>
      </Card>

      {/* Hotel Cards */}
      <div className="grid gap-4">
        {hotels.map((hotel) => {
          const isSelected = selectedHotel?.id === hotel.id

          return (
            <Card
              key={hotel.id}
              className={cn(
                'p-6 cursor-pointer transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'hover:border-gray-300 hover:shadow-sm',
              )}
              onClick={() => handleSelectHotel(hotel)}
            >
              <div className="flex items-start gap-4">
                {/* Selection Indicator */}
                <div
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all',
                    isSelected ? 'bg-primary border-primary' : 'border-gray-300',
                  )}
                >
                  {isSelected && <Check size={16} className="text-white" />}
                </div>

                {/* Hotel Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-primary/10' : 'bg-gray-100',
                  )}
                >
                  <Building2 size={24} className={isSelected ? 'text-primary' : 'text-gray-400'} />
                </div>

                {/* Hotel Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                        <MapPin size={14} className="text-gray-400" />
                        <span>
                          {hotel.address}
                          {hotel.city && `, ${hotel.city}`}
                          {hotel.country && `, ${hotel.country}`}
                        </span>
                      </div>
                    </div>
                    <Badge variant={hotel.status === 'published' ? 'default' : 'outline'}>
                      {hotel.status}
                    </Badge>
                  </div>

                  {hotel.roomCount !== undefined && (
                    <p className="text-sm text-gray-600">
                      <strong>{hotel.roomCount}</strong> room type{hotel.roomCount !== 1 ? 's' : ''}{' '}
                      available
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Error Message */}
      {error && hotels.length > 0 && (
        <Card className="p-4 bg-error/5 border-error/20">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-error" />
            <p className="text-sm text-gray-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-6">
        <Button onClick={handleContinue} disabled={!selectedHotel}>
          Continue
        </Button>
      </div>
    </div>
  )
}
