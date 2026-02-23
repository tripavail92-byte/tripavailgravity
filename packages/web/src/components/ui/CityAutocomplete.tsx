import { Loader2, LocateFixed, MapPin } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CityAutocompleteProps {
  value: string
  onCitySelect: (city: string) => void
  className?: string
  placeholder?: string
}

export function CityAutocomplete({
  value,
  onCitySelect,
  className,
  placeholder = 'Search for a city...',
}: CityAutocompleteProps) {
  // const map = useMap();
  const [searchQuery, setSearchQuery] = useState(value)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sync with external value
  useEffect(() => {
    setSearchQuery(value)
  }, [value])

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery === value) {
      setPredictions([])
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(async () => {
      if (!window.google) return
      const service = new google.maps.places.AutocompleteService()

      try {
        const response = await service.getPlacePredictions({
          input: searchQuery,
          types: ['(cities)'],
        })

        setPredictions(response.predictions || [])
      } catch (error) {
        console.error('Error fetching predictions:', error)
        setPredictions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, value])

  const handlePredictionClick = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      const cityName = prediction.description
      setSearchQuery(cityName)
      onCitySelect(cityName)
      setShowSuggestions(false)
      setPredictions([])
    },
    [onCitySelect],
  )

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsSearching(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            // Find the city in address components
            const cityComponent = results[0].address_components.find(
              (c) =>
                c.types.includes('locality') || c.types.includes('administrative_area_level_1'),
            )
            const countryComponent = results[0].address_components.find((c) =>
              c.types.includes('country'),
            )

            if (cityComponent) {
              const locationName = countryComponent
                ? `${cityComponent.long_name}, ${countryComponent.long_name}`
                : cityComponent.long_name
              setSearchQuery(locationName)
              onCitySelect(locationName)
            }
          } else {
            toast.error('Could not detect city name')
          }
          setIsSearching(false)
        })
      },
      (error) => {
        console.error('Error getting location:', error)
        setIsSearching(false)
        alert('Unable to get your current location')
      },
    )
  }, [onCitySelect])

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative group">
        <MapPin
          className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110"
          aria-hidden="true"
        />
        <Input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-12 pr-12 rounded-xl border-border/60 bg-background focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-medium w-full"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <button
              type="button"
              onClick={detectLocation}
              className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground/50 hover:text-primary transition-all active:scale-95"
              title="Detect current location"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                onClick={() => handlePredictionClick(prediction)}
                className="w-full px-4 py-3.5 text-left hover:bg-muted/60 flex items-center gap-3 transition-colors group border-b border-border/50 last:border-b-0"
              >
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-all flex-shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate text-sm">
                    {prediction.structured_formatting.main_text}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-widest truncate">
                    {prediction.structured_formatting.secondary_text}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
