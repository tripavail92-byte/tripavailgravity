import { AlertTriangle, Loader2, LocateFixed, MapPin } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Input } from '@/components/ui/input'
import { useGoogleMapsUnavailable } from '@/hooks/useGoogleMapsStatus'
import { cn } from '@/lib/utils'

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''

interface CityAutocompleteProps {
  value: string
  /**
   * Called with the city and, when the source knows it, the country. Callers should persist
   * `meta.country` — before this existed nothing ever captured a country, so tour locations
   * rendered as "undefined, undefined".
   */
  onCitySelect: (city: string, meta?: { country?: string }) => void
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
  const [predictions, setPredictions] = useState<
    Array<{ key: string; label: string; secondary?: string; placePrediction?: any }>
  >([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sessionTokenRef = useRef<any>(null)
  // Set true right after a suggestion click / geolocation fill so the effect below doesn't
  // immediately re-open the dropdown on the value we just committed.
  const justSelectedRef = useRef(false)
  const mapsUnavailable = useGoogleMapsUnavailable(Boolean(GOOGLE_MAPS_API_KEY))

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

  // Sync with external value (e.g. resumed/prefilled data) without clobbering active typing.
  useEffect(() => {
    setSearchQuery((prev) => (prev === value ? prev : value))
  }, [value])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setPredictions([])
      return
    }
    // Don't re-search the value we just committed via a click / geolocation.
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      setPredictions([])
      return
    }

    if (mapsUnavailable) {
      // Google Maps failed to load/authenticate — don't spin forever waiting on a request
      // that can never succeed; let the caller type the city name manually instead.
      setIsSearching(false)
      setPredictions([])
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(async () => {
      if (!window.google) {
        setIsSearching(false)
        return
      }
      try {
        type Prediction = { key: string; label: string; secondary?: string; placePrediction?: any }

        // Legacy AutocompleteService — only needs the classic "Places API", which is
        // enabled on the project. Used as the reliable fallback.
        const fetchLegacy = async (): Promise<Prediction[]> => {
          const service = new google.maps.places.AutocompleteService()
          const response = await service.getPlacePredictions({
            input: searchQuery,
            types: ['(cities)'],
          })
          return (response.predictions || []).map((p) => ({
            key: p.place_id,
            label: p.structured_formatting.main_text,
            secondary: p.structured_formatting.secondary_text,
          }))
        }

        // Prefer Autocomplete (New) when the project has it enabled, but never let it be a
        // dead end: if "Places API (New)" is disabled/unbilled it throws, so fall back to legacy.
        const hasNewAutocomplete =
          typeof (google.maps as any).importLibrary === 'function' &&
          (google.maps as any).places?.AutocompleteSuggestion

        let next: Prediction[] | null = null

        if (hasNewAutocomplete) {
          try {
            const lib = (await (google.maps as any).importLibrary('places')) as any
            const AutocompleteSuggestion = lib?.AutocompleteSuggestion
            const AutocompleteSessionToken = lib?.AutocompleteSessionToken

            if (AutocompleteSuggestion) {
              if (!sessionTokenRef.current && AutocompleteSessionToken) {
                sessionTokenRef.current = new AutocompleteSessionToken()
              }

              const request: any = {
                input: searchQuery,
                includedPrimaryTypes: ['locality'],
              }
              if (sessionTokenRef.current) {
                request.sessionToken = sessionTokenRef.current
              }

              const { suggestions } =
                await AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
              next = (suggestions ?? [])
                .map((s: any) => s?.placePrediction)
                .filter(Boolean)
                .map((placePrediction: any) => {
                  const text = placePrediction?.text?.toString?.() ?? ''
                  return {
                    key: placePrediction?.placeId || text,
                    label: text,
                    secondary: '',
                    placePrediction,
                  }
                })
            }
          } catch (newErr) {
            // Most common cause: "Places API (New)" is not enabled on the Cloud project.
            // Fall back to the legacy service instead of silently showing nothing.
            console.warn('Places Autocomplete (New) unavailable, using legacy service:', newErr)
            next = null
          }
        }

        if (next === null) {
          next = await fetchLegacy()
        }

        setPredictions(next)
      } catch (error) {
        console.error('Error fetching predictions:', error)
        setPredictions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, mapsUnavailable])

  const handlePredictionClick = useCallback(
    (prediction: { label: string; secondary?: string }) => {
      // Legacy predictions:  label = "Islamabad", secondary = "Punjab, Pakistan"
      // New Autocomplete:    label = "Islamabad, Pakistan", secondary = ''
      // Either shape flattens to segments where the city is first and the country is last.
      const segments = [prediction.label, prediction.secondary]
        .filter(Boolean)
        .join(', ')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const cityName = segments[0] || prediction.label
      const country = segments.length > 1 ? segments[segments.length - 1] : undefined
      justSelectedRef.current = true
      setSearchQuery(cityName)
      onCitySelect(cityName, { country })
      setShowSuggestions(false)
      setPredictions([])
    },
    [onCitySelect],
  )

  const detectLocation = useCallback(() => {
    if (mapsUnavailable) {
      toast.error('Location search is temporarily unavailable')
      return
    }
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
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
              // Commit city and country separately — previously the combined "City, Country"
              // string was committed as the CITY, and the country was dropped entirely.
              justSelectedRef.current = true
              setSearchQuery(cityComponent.long_name)
              onCitySelect(cityComponent.long_name, { country: countryComponent?.long_name })
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
        toast.error('Unable to get your current location')
      },
    )
  }, [onCitySelect, mapsUnavailable])

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
            const v = e.target.value
            setSearchQuery(v)
            // Commit the raw text upward too — so the city counts as entered even when the
            // operator types it fully instead of picking a dropdown suggestion.
            onCitySelect(v)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-12 pr-12 rounded-xl border-border/60 bg-background focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-medium w-full"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : mapsUnavailable ? (
            <AlertTriangle
              className="w-4 h-4 text-amber-500"
              aria-hidden="true"
            />
          ) : (
            <button
              type="button"
              onClick={detectLocation}
              aria-label="Detect current location"
              className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground/50 hover:text-primary transition-all active:scale-95"
              title="Detect current location"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {mapsUnavailable && (
        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-500">
          Map search unavailable right now — type the city name manually.
        </p>
      )}

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
                key={prediction.key}
                onClick={() => handlePredictionClick(prediction)}
                aria-label={`Select ${prediction.label}`}
                className="w-full px-4 py-3.5 text-left hover:bg-muted/60 flex items-center gap-3 transition-colors group border-b border-border/50 last:border-b-0"
              >
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-all flex-shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate text-sm">
                    {prediction.label}
                  </p>
                  {prediction.secondary ? (
                    <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-widest truncate">
                      {prediction.secondary}
                    </p>
                  ) : null}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
