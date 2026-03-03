import { AdvancedMarker, APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { Check, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LocationData {
  address: string
  city: string
  area: string
  country: string
  coordinates: { lat: number; lng: number }
  placeId: string
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void
  onClose?: () => void
  initialLocation?: LocationData | null
  placeholder?: string
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || ''

// Default center (Lahore, Pakistan)
const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 }

// Airbnb-style custom map styles
const MAP_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
]

function PlacesAutocomplete({
  onPlaceSelect,
  searchQuery,
  setSearchQuery,
}: {
  onPlaceSelect: (place: any) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}) {
  const map = useMap()
  const [predictions, setPredictions] = useState<
    Array<{ key: string; placeId?: string; label: string; secondary?: string; placePrediction?: any }>
  >([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const sessionTokenRef = useRef<any>(null)

  useEffect(() => {
    if (!searchQuery.trim() || !map) {
      setPredictions([])
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(async () => {
      try {
        const hasNewAutocomplete =
          typeof (google.maps as any).importLibrary === 'function' &&
          (google.maps as any).places?.AutocompleteSuggestion

        if (hasNewAutocomplete) {
          const lib = (await (google.maps as any).importLibrary('places')) as any
          const AutocompleteSuggestion = lib?.AutocompleteSuggestion
          const AutocompleteSessionToken = lib?.AutocompleteSessionToken

          if (!AutocompleteSuggestion) {
            setPredictions([])
            return
          }

          if (!sessionTokenRef.current && AutocompleteSessionToken) {
            sessionTokenRef.current = new AutocompleteSessionToken()
          }
          const token = sessionTokenRef.current

          const request: any = {
            input: searchQuery,
            includedRegionCodes: ['pk'],
          }
          const bounds = map.getBounds?.()
          if (bounds) request.locationRestriction = bounds
          const center = map.getCenter?.()
          if (center) request.origin = center
          if (token) request.sessionToken = token

          const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
          const next = (suggestions ?? [])
            .map((s: any) => s?.placePrediction)
            .filter(Boolean)
            .map((placePrediction: any) => {
              const text = placePrediction?.text?.toString?.() ?? ''
              const id = placePrediction?.placeId
              return {
                key: id || text,
                placeId: id,
                label: text,
                secondary: '',
                placePrediction,
              }
            })

          setPredictions(next)
          return
        }

        const service = new google.maps.places.AutocompleteService()
        const response = await service.getPlacePredictions({
          input: searchQuery,
          componentRestrictions: { country: 'pk' },
        })

        const next = (response.predictions || []).map((p) => ({
          key: p.place_id,
          placeId: p.place_id,
          label: p.structured_formatting.main_text,
          secondary: p.structured_formatting.secondary_text,
        }))

        setPredictions(next)
      } catch (error) {
        console.error('Error fetching predictions:', error)
        setPredictions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, map])

  const handlePredictionClick = useCallback(
    async (item: { placeId?: string; placePrediction?: any }) => {
      // New API details.
      if (item.placePrediction?.toPlace) {
        try {
          const place = item.placePrediction.toPlace()
          await place.fetchFields({
            fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'id'],
          })
          onPlaceSelect(place)
          setShowSuggestions(false)
          return
        } catch (e) {
          console.error('Error fetching place details (new):', e)
          return
        }
      }

      if (!item.placeId) return

      // Legacy details.
      const service = new google.maps.places.PlacesService(document.createElement('div'))
      service.getDetails(
        {
          placeId: item.placeId,
          fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            onPlaceSelect(place)
            setShowSuggestions(false)
          }
        },
      )
    },
    [map, onPlaceSelect],
  )

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <Input
          type="text"
          placeholder="Search for your hotel location..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          className="pl-12 pr-10 py-6 text-base bg-background border border-border rounded-full shadow-sm hover:shadow-md transition-shadow"
        />
        {isSearching && (
          <Loader2
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground animate-spin"
            size={20}
          />
        )}
      </div>

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full mt-2 bg-background border border-border rounded-2xl shadow-xl z-10 max-h-80 overflow-y-auto"
          >
            {predictions.map((prediction) => (
              <button
                key={prediction.key}
                onClick={() => handlePredictionClick(prediction)}
                className="w-full px-5 py-4 text-left hover:bg-muted border-b border-border last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {prediction.label}
                    </p>
                    {prediction.secondary ? (
                      <p className="text-sm text-muted-foreground truncate">{prediction.secondary}</p>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LocationPickerContent({
  onLocationSelect,
  onClose,
  initialLocation,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [markerPosition, setMarkerPosition] = useState(initialLocation?.coordinates || null)
  const [initialCenter] = useState(initialLocation?.coordinates || DEFAULT_CENTER)
  const map = useMap()

  const handlePlaceSelect = useCallback(
    (place: any) => {
      console.log('🎯 handlePlaceSelect called with place:', place)
      const location = place?.geometry?.location ?? place?.location
      const lat = typeof location?.lat === 'function' ? location.lat() : location?.lat
      const lng = typeof location?.lng === 'function' ? location.lng() : location?.lng

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        console.log('❌ No geometry/location in place object!')
        return
      }
      console.log('🎯 Extracted coordinates:', { lat, lng })

      // Extract address components
      let city = ''
      let area = ''
      let country = ''

      place.address_components?.forEach((component: any) => {
        if (component.types?.includes('locality')) {
          city = component.long_name
        }
        if (component.types?.includes('sublocality') || component.types?.includes('neighborhood')) {
          area = component.long_name
        }
        if (component.types?.includes('country')) {
          country = component.long_name
        }
      })

      place.addressComponents?.forEach?.((component: any) => {
        const types = component?.types ?? []
        const longText = component?.longText
        if (!longText || !Array.isArray(types)) return
        if (types.includes('locality')) city = longText
        if (types.includes('sublocality') || types.includes('neighborhood')) area = longText
        if (types.includes('country')) country = longText
      })

      const locationData: LocationData = {
        address: place.formatted_address || place.formattedAddress || '',
        city: city || 'Unknown City',
        area: area || city || 'Unknown Area',
        country: country || 'Unknown Country',
        coordinates: { lat, lng },
        placeId: place.place_id || place.id || `custom_${Date.now()}`,
      }

      setSelectedLocation(locationData)
      setMarkerPosition({ lat, lng })
      setSearchQuery(place.formatted_address || place.formattedAddress || '')

      // Auto-save and close picker immediately
      onLocationSelect(locationData)

      // Smooth pan to location
      if (map) {
        map.panTo({ lat, lng })
        map.setZoom(16)
      }
    },
    [map],
  )

  const handleMapClick = useCallback(
    (event: any) => {
      console.log('🗺️ Map clicked! Event:', event)
      const latLng = event.detail?.latLng
      console.log('🗺️ Extracted latLng from event.detail:', latLng)

      if (!latLng) {
        console.log('❌ No latLng in event.detail!')
        return
      }

      const lat = latLng.lat
      const lng = latLng.lng
      console.log('🗺️ Coordinates:', { lat, lng })

      console.log('📍 Setting marker position...')
      setMarkerPosition({ lat, lng })

      // Reverse geocode to get address
      console.log('🔄 Starting reverse geocoding...')
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        console.log('🔄 Geocoding complete. Status:', status)
        console.log('🔄 Results:', results)

        if (status === 'OK' && results && results[0]) {
          console.log('✅ Geocoding successful, calling handlePlaceSelect')
          handlePlaceSelect(results[0])
        } else {
          console.log('⚠️ Geocoding failed or no results, creating fallback location')
          const locationData: LocationData = {
            address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            city: 'Selected Location',
            area: 'Custom Pin',
            country: 'Unknown',
            coordinates: { lat, lng },
            placeId: `custom_${Date.now()}`,
          }
          console.log('⚠️ Fallback locationData:', locationData)
          setSelectedLocation(locationData)
        }
      })
    },
    [handlePlaceSelect],
  )

  const handleMarkerDrag = useCallback(
    (event: any) => {
      const latLng = event.latLng
      if (!latLng) return

      const lat = latLng.lat()
      const lng = latLng.lng()

      setMarkerPosition({ lat, lng })

      // Debounced reverse geocoding on drag end
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          handlePlaceSelect(results[0])
        }
      })
    },
    [handlePlaceSelect],
  )

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        setMarkerPosition({ lat, lng })

        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            handlePlaceSelect(results[0])
          }
        })
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Unable to get your current location')
      },
    )
  }, [handlePlaceSelect])

  const handleConfirmLocation = () => {
    console.log('🗺️ LocationPicker: Confirm button clicked')
    console.log('🗺️ LocationPicker: selectedLocation:', selectedLocation)
    if (selectedLocation) {
      console.log('🗺️ LocationPicker: Calling onLocationSelect with:', selectedLocation)
      onLocationSelect(selectedLocation)
    } else {
      console.log('🗺️ LocationPicker: ERROR - No selectedLocation to confirm!')
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col\">
      {/* Minimal Header - Airbnb Style */}
      <div className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onClose} className="p-2 -ml-2 rounded-full">
            <X size={24} className="text-foreground" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Confirm your address</h1>
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>
      </div>

      {/* Search Bar with Current Location */}
      <div className="bg-background px-6 py-4 border-b border-border">
        <div className="max-w-2xl mx-auto flex gap-3">
          <div className="flex-1">
            <PlacesAutocomplete
              onPlaceSelect={handlePlaceSelect}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={getCurrentLocation}
            className="w-12 h-12 rounded-full"
            title="Use current location"
          >
            <LocateFixed size={20} className="text-foreground" />
          </Button>
        </div>
      </div>

      {/* Location Info and Confirm Button - Shown above map when location selected */}
      <AnimatePresence mode="wait">
        {selectedLocation && (
          <motion.div
            key="location-confirm"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-background border-b border-border px-6 py-4 shadow-md"
          >
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={20} className="text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {selectedLocation.address}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.city}, {selectedLocation.country}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleConfirmLocation}
                className="w-full h-12 bg-gradient-to-r from-[#E61E4D] to-[#FF385C] hover:from-[#D90B40] hover:to-[#E61E4D] text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Check size={20} className="mr-2" />
                Confirm Location
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container - Full Height */}
      <div className="flex-1 relative bg-muted">
        <Map
          defaultCenter={initialCenter}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={true}
          onClick={handleMapClick}
          mapId={GOOGLE_MAPS_MAP_ID || undefined}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          zoomControlOptions={{
            position: 7, // RIGHT_BOTTOM
          }}
        >
          {markerPosition ? (
            GOOGLE_MAPS_MAP_ID ? (
              <AdvancedMarker position={markerPosition} draggable={true} onDragEnd={handleMarkerDrag}>
                <motion.div
                  initial={{ scale: 0, y: -40 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative"
                >
                  {/* Airbnb-style pin */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-[#FF385C] rounded-full border-4 border-background shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing">
                      <MapPin size={24} className="text-primary-foreground" fill="currentColor" />
                    </div>
                    {/* Pin shadow */}
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-foreground/20 rounded-full blur-sm" />
                  </div>
                </motion.div>
              </AdvancedMarker>
            ) : (
              <Marker position={markerPosition} draggable={true} onDragEnd={handleMarkerDrag} />
            )
          ) : null}
        </Map>

        {/* Instruction Text Overlay */}
        {!selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-background px-6 py-3 rounded-full shadow-lg"
          >
            <p className="text-sm font-medium text-foreground">
              Click on the map to pin your location
            </p>
          </motion.div>
        )}
      </div>

      {/* Sticky Bottom Bar - Airbnb Style */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-background border-t border-border shadow-2xl"
          >
            <div className="px-6 py-6">
              <div className="max-w-4xl mx-auto">
                {/* Location Info */}
                <div className="mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin size={24} className="text-[#FF385C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-lg mb-1">
                        {selectedLocation.address}
                      </h3>
                      <p className="text-muted-foreground">
                        {selectedLocation.city}, {selectedLocation.country}
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        📍 {selectedLocation.coordinates.lat.toFixed(5)},{' '}
                        {selectedLocation.coordinates.lng.toFixed(5)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirmation Note */}
                <div className="bg-info/10 border border-info/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Tip:</span> You can drag the pin to adjust your
                    exact location
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-12 rounded-xl border-2 font-medium hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmLocation}
                    className="flex-1 h-12 bg-gradient-to-r from-[#E61E4D] to-[#FF385C] hover:from-[#D90B40] hover:to-[#E61E4D] text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <Check size={20} className="mr-2" />
                    Confirm Location
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LocationPicker(props: LocationPickerProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Google Maps API Key Missing
          </h2>
          <p className="text-muted-foreground">
            Please add VITE_GOOGLE_MAPS_API_KEY to your .env file
          </p>
        </div>
      </div>
    )
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
      <LocationPickerContent {...props} />
    </APIProvider>
  )
}
