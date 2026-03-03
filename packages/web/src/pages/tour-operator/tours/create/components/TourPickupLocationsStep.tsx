import {
  APIProvider,
  APILoadingStatus,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps'
import { Loader2, MapPin, Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Tour } from '@/features/tour-operator/services/tourService'

import { PickupMap } from './PickupMap'

type PickupRow = {
  id: string
  tour_id: string
  title: string
  formatted_address: string
  city: string | null
  country: string | null
  latitude: number
  longitude: number
  google_place_id: string | null
  pickup_time: string | null
  notes: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

type DraftPickup = {
  key: string
  title: string
  formatted_address: string
  city: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  google_place_id: string | null
  pickup_time: string | null
  notes: string | null
  is_primary: boolean
}

interface TourPickupLocationsStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
  tourId?: string | null
  ensureTourDraft?: () => Promise<string>
}

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''
const GOOGLE_MAPS_MAP_ID = (import.meta as any).env.VITE_GOOGLE_MAPS_MAP_ID || ''
const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 }
const WHEEL_ITEM_HEIGHT = 40

function shouldToastAgain(lastAtMs: number, windowMs: number) {
  return Date.now() - lastAtMs > windowMs
}

function isValidLatitude(lat: number) {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90
}

function isValidLongitude(lng: number) {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180
}

function isValidLatLng(lat: number, lng: number) {
  return isValidLatitude(lat) && isValidLongitude(lng)
}

function formatLatLngAddress(lat: number, lng: number) {
  return `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
}

const pad2 = (value: number) => String(value).padStart(2, '0')

function formatTime24(hour: number, minute: number) {
  return `${pad2(hour)}:${pad2(minute)}`
}

function parseTime24(timeString?: string) {
  if (!timeString || !timeString.includes(':')) {
    return { hour: 9, minute: 0 }
  }

  const [hour, minute] = timeString.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return { hour: 9, minute: 0 }
  }

  return {
    hour: Math.max(0, Math.min(23, hour)),
    minute: Math.max(0, Math.min(59, minute)),
  }
}

function formatHourLabel(hour24: number) {
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12} ${suffix}`
}

function WheelColumn({
  options,
  selectedValue,
  onSelect,
  ariaLabel,
  disabled,
}: {
  options: Array<{ value: number; label: string }>
  selectedValue: number
  onSelect: (value: number) => void
  ariaLabel: string
  disabled?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const snapTimeoutRef = useRef<number | null>(null)

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  )

  const snapToNearest = useCallback(() => {
    if (!scrollRef.current || disabled) return

    const rawIndex = Math.round(scrollRef.current.scrollTop / WHEEL_ITEM_HEIGHT)
    const boundedIndex = Math.max(0, Math.min(options.length - 1, rawIndex))
    const boundedOption = options[boundedIndex]

    if (!boundedOption) return

    if (boundedOption.value !== selectedValue) {
      onSelect(boundedOption.value)
    }

    scrollRef.current.scrollTo({
      top: boundedIndex * WHEEL_ITEM_HEIGHT,
      behavior: 'smooth',
    })
  }, [disabled, onSelect, options, selectedValue])

  useEffect(() => {
    if (!scrollRef.current) return

    scrollRef.current.scrollTo({
      top: selectedIndex * WHEEL_ITEM_HEIGHT,
      behavior: 'smooth',
    })
  }, [selectedIndex, options.length])

  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) {
        window.clearTimeout(snapTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className={cn(
        'relative h-40 md:h-44 rounded-xl border border-primary/20 bg-background/80 shadow-inner overflow-hidden',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 rounded-lg bg-primary/10 border border-primary/25 shadow-sm pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background via-background/85 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background via-background/85 to-transparent pointer-events-none z-10" />

      <div
        ref={scrollRef}
        role="listbox"
        aria-label={ariaLabel}
        onScroll={() => {
          if (disabled) return
          if (snapTimeoutRef.current) {
            window.clearTimeout(snapTimeoutRef.current)
          }
          snapTimeoutRef.current = window.setTimeout(snapToNearest, 80)
        }}
        className="h-full overflow-y-auto snap-y snap-mandatory py-16 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue
          return (
            <div
              key={option.value}
              role="option"
              aria-selected={isSelected}
              className={cn(
                'h-10 flex items-center justify-center snap-center px-2 text-sm md:text-base font-extrabold transition-all',
                isSelected ? 'text-foreground' : 'text-muted-foreground/70',
              )}
            >
              {option.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimeWheelPicker({
  value,
  onChange,
  disabled,
}: {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const parsed = useMemo(() => parseTime24(value), [value])

  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: formatHourLabel(hour) })),
    [],
  )

  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => {
        const minute = idx * 5
        return { value: minute, label: pad2(minute) }
      }),
    [],
  )

  const snappedMinute = minuteOptions.reduce((closest, option) => {
    const currentDistance = Math.abs(option.value - parsed.minute)
    const closestDistance = Math.abs(closest - parsed.minute)
    return currentDistance < closestDistance ? option.value : closest
  }, minuteOptions[0]?.value ?? 0)

  const handleHourSelect = (hour: number) => {
    onChange(formatTime24(hour, snappedMinute))
  }

  const handleMinuteSelect = (minute: number) => {
    onChange(formatTime24(parsed.hour, minute))
  }

  return (
    <div className="space-y-2 md:space-y-3">
      <div className="grid grid-cols-2 gap-2 md:gap-3 px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Hour
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Minute
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <WheelColumn
          options={hourOptions}
          selectedValue={parsed.hour}
          onSelect={handleHourSelect}
          ariaLabel="Select hour"
          disabled={disabled}
        />
        <WheelColumn
          options={minuteOptions}
          selectedValue={snappedMinute}
          onSelect={handleMinuteSelect}
          ariaLabel="Select minute"
          disabled={disabled}
        />
      </div>
      <div className="px-2.5 md:px-3 py-2 rounded-xl border border-primary/25 bg-primary/10 text-xs md:text-sm font-bold text-foreground shadow-sm">
        Selected: {formatHourLabel(parsed.hour)} : {pad2(snappedMinute)}
      </div>
    </div>
  )
}

function PickupMapSection({
  center,
  markerPosition,
  onMapClick,
  onMarkerDragEnd,
  isSaving,
  active,
  setActive,
  setMarkerPosition,
  mapId,
}: {
  center: { lat: number; lng: number }
  markerPosition: { lat: number; lng: number } | null
  onMapClick: (event: any) => void
  onMarkerDragEnd: (event: any) => void
  isSaving: boolean
  active: { latitude: number | null; longitude: number | null }
  setActive: React.Dispatch<React.SetStateAction<any>>
  setMarkerPosition: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>
  mapId?: string
}) {
  const status = useApiLoadingStatus()
  const [retryNonce, setRetryNonce] = useState(0)
  const [gmAuthFailed, setGmAuthFailed] = useState(false)

  useEffect(() => {
    const prev = (window as any).gm_authFailure
    ;(window as any).gm_authFailure = () => {
      setGmAuthFailed(true)
      if (typeof prev === 'function') {
        try {
          prev()
        } catch {
          // ignore
        }
      }
    }
    return () => {
      ;(window as any).gm_authFailure = prev
    }
  }, [])

  const isAuthFailure = status === APILoadingStatus.AUTH_FAILURE
  const isFailed = status === APILoadingStatus.FAILED
  const isMapUnavailable = !GOOGLE_MAPS_API_KEY || isAuthFailure || isFailed || gmAuthFailed

  const canUseCoords =
    typeof active.latitude === 'number' &&
    typeof active.longitude === 'number' &&
    isValidLatLng(active.latitude, active.longitude)

  if (isMapUnavailable) {
    const reason = !GOOGLE_MAPS_API_KEY
      ? 'Missing Google Maps API key (VITE_GOOGLE_MAPS_API_KEY).'
      : gmAuthFailed
        ? 'Google Maps reported an auth failure (check billing, key restrictions, enabled APIs, and quota).'
      : isAuthFailure
        ? 'Google Maps authorization failed (check key restrictions, billing, or quota).'
        : 'Google Maps failed to load.'

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="text-sm font-semibold text-foreground">Map unavailable</div>
          <div className="text-xs text-muted-foreground mt-1">{reason}</div>
          <div className="text-xs text-muted-foreground mt-2">
            You can still add a pickup by entering coordinates manually.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1 block">
              Latitude
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              value={typeof active.latitude === 'number' ? String(active.latitude) : ''}
              onChange={(e) => {
                const raw = e.target.value
                const next = raw.trim() === '' ? null : Number.parseFloat(raw)
                setActive((prev: any) => ({
                  ...prev,
                  latitude: Number.isFinite(next as number) ? (next as number) : null,
                }))
              }}
              placeholder="e.g. 48.8566"
              className="rounded-2xl"
              disabled={isSaving}
            />
            {typeof active.latitude === 'number' && !isValidLatitude(active.latitude) && (
              <div className="text-xs text-destructive">Latitude must be between -90 and 90.</div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1 block">
              Longitude
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              value={typeof active.longitude === 'number' ? String(active.longitude) : ''}
              onChange={(e) => {
                const raw = e.target.value
                const next = raw.trim() === '' ? null : Number.parseFloat(raw)
                setActive((prev: any) => ({
                  ...prev,
                  longitude: Number.isFinite(next as number) ? (next as number) : null,
                }))
              }}
              placeholder="e.g. 2.3522"
              className="rounded-2xl"
              disabled={isSaving}
            />
            {typeof active.longitude === 'number' && !isValidLongitude(active.longitude) && (
              <div className="text-xs text-destructive">Longitude must be between -180 and 180.</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="bg-white/60 border-white/60"
            onClick={() => {
              if (!canUseCoords) return

              const lat = active.latitude as number
              const lng = active.longitude as number
              setMarkerPosition({ lat, lng })

              // Ensure list doesn't show a blank address when map/reverse-geocode isn't available.
              setActive((prev: any) => ({
                ...prev,
                formatted_address:
                  typeof prev.formatted_address === 'string' && prev.formatted_address.trim().length > 0
                    ? prev.formatted_address
                    : formatLatLngAddress(lat, lng),
              }))
            }}
            disabled={isSaving || !canUseCoords}
          >
            Use coordinates
          </Button>

          <Button
            type="button"
            variant="outline"
            className="bg-white/60 border-white/60"
            onClick={() => setRetryNonce((n) => n + 1)}
            disabled={isSaving}
            title="Retry rendering the map"
          >
            Retry map
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[320px] rounded-3xl overflow-hidden border border-white/40 bg-muted">
      <PickupMap
        key={retryNonce}
        center={center}
        markerPosition={markerPosition}
        onMapClick={onMapClick}
        onMarkerDragEnd={onMarkerDragEnd}
        mapId={mapId}
      />
    </div>
  )
}

type SelectedPlaceLike = {
  formatted_address?: string
  formattedAddress?: string
  name?: string
  displayName?: string
  place_id?: string
  id?: string
  geometry?: { location?: any }
  location?: any
  address_components?: Array<{ long_name: string; types: string[] }>
  addressComponents?: Array<{ longText?: string; types?: string[] }>
}

function getLatLngFromPlace(place: SelectedPlaceLike): { lat: number; lng: number } | null {
  const location = place.geometry?.location ?? place.location
  if (!location) return null

  const lat = typeof location.lat === 'function' ? location.lat() : location.lat
  const lng = typeof location.lng === 'function' ? location.lng() : location.lng

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function normalizeDraftPickup(pickup: DraftPickup) {
  return {
    title: pickup.title.trim(),
    formatted_address: pickup.formatted_address.trim(),
    city: pickup.city,
    country: pickup.country,
    latitude: pickup.latitude,
    longitude: pickup.longitude,
    google_place_id: pickup.google_place_id,
    pickup_time: pickup.pickup_time,
    notes: pickup.notes,
    is_primary: pickup.is_primary,
  }
}

function pickupsHash(pickups: DraftPickup[]) {
  return JSON.stringify(pickups.map(normalizeDraftPickup))
}

function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  onPlaceSelect: (place: SelectedPlaceLike) => void
  disabled?: boolean
}) {
  const map = useMap()
  const [predictions, setPredictions] = useState<
    Array<{ key: string; placeId?: string; label: string; secondary?: string; placePrediction?: any }>
  >([])
  const [open, setOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const sessionTokenRef = useRef<any>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open || !value.trim()) {
      setPredictions([])
      return
    }

    if (!window.google) return

    setIsSearching(true)
    const t = setTimeout(async () => {
      try {
        // Prefer Autocomplete (New) if available; fall back to legacy for existing projects.
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

          const request: any = {
            input: value,
          }

          const bounds = map?.getBounds?.()
          if (bounds) {
            request.locationRestriction = bounds
          }
          const center = map?.getCenter?.()
          if (center) {
            request.origin = center
          }
          if (sessionTokenRef.current) {
            request.sessionToken = sessionTokenRef.current
          }

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
        const response = await service.getPlacePredictions({ input: value })
        const next = (response.predictions || []).map((p) => ({
          key: p.place_id,
          placeId: p.place_id,
          label: p.structured_formatting.main_text,
          secondary: p.structured_formatting.secondary_text,
        }))
        setPredictions(next)
      } catch (e) {
        console.error('[PickupLocations] autocomplete failed', e)
        setPredictions([])
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(t)
  }, [value, open, map])

  const handlePredictionClick = useCallback(
    async (item: { placeId?: string; placePrediction?: any }) => {
      if (!window.google) return

      // If we have a PlacePrediction (new API), use it to fetch fields.
      if (item.placePrediction?.toPlace) {
        try {
          const place = item.placePrediction.toPlace()
          await place.fetchFields({
            fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'id'],
          })
          onPlaceSelect(place as any)
          setOpen(false)
          // Conclude session; new token next search session.
          sessionTokenRef.current = null
          return
        } catch (e) {
          console.error('[PickupLocations] place details (new) failed', e)
          return
        }
      }

      if (!item.placeId) return

      // Legacy details lookup.
      const service = new google.maps.places.PlacesService(document.createElement('div'))
      service.getDetails(
        {
          placeId: item.placeId,
          fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            onPlaceSelect(place)
            setOpen(false)
          }
        },
      )
    },
    [map, onPlaceSelect],
  )

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search address or landmark..."
          disabled={disabled}
          className="pl-11 rounded-2xl border-border/60 bg-background focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-medium"
        />
        <MapPin
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60"
          aria-hidden="true"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
        )}
      </div>

      {open && predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.key}
              type="button"
              onClick={() => handlePredictionClick(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border/50 last:border-b-0"
            >
              <div className="text-sm font-semibold text-foreground truncate">
                {prediction.label}
              </div>
              {prediction.secondary ? (
                <div className="text-xs text-muted-foreground truncate">{prediction.secondary}</div>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function extractCityCountry(place: SelectedPlaceLike): { city: string | null; country: string | null } {
  let city: string | null = null
  let country: string | null = null

  place.address_components?.forEach((component) => {
    if (component.types.includes('locality')) city = component.long_name
    if (component.types.includes('administrative_area_level_1') && !city) city = component.long_name
    if (component.types.includes('country')) country = component.long_name
  })

  ;(place.addressComponents as any)?.forEach?.((component: any) => {
    const types = component?.types ?? []
    const longText = component?.longText
    if (!longText || !Array.isArray(types)) return
    if (types.includes('locality')) city = longText
    if (types.includes('administrative_area_level_1') && !city) city = longText
    if (types.includes('country')) country = longText
  })

  return { city, country }
}

function toDraftPickupFromRow(row: PickupRow): DraftPickup {
  return {
    key: row.id,
    title: row.title,
    formatted_address: row.formatted_address,
    city: row.city,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    google_place_id: row.google_place_id,
    pickup_time: row.pickup_time,
    notes: row.notes,
    is_primary: row.is_primary,
  }
}

function newEmptyPickup(): DraftPickup {
  const key = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? (crypto as any).randomUUID() : `tmp_${Date.now()}`
  return {
    key,
    title: '',
    formatted_address: '',
    city: null,
    country: null,
    latitude: null,
    longitude: null,
    google_place_id: null,
    pickup_time: null,
    notes: null,
    is_primary: false,
  }
}

export function TourPickupLocationsStep({
  data,
  onUpdate,
  onNext,
  onBack,
  tourId,
  ensureTourDraft,
}: TourPickupLocationsStepProps) {
  const initialFromDraft = Array.isArray((data as any)?.draft_data?.pickup_locations)
    ? ((data as any).draft_data.pickup_locations as PickupRow[])
    : null

  const [pickups, setPickups] = useState<DraftPickup[]>(
    () => initialFromDraft?.map(toDraftPickupFromRow) ?? [],
  )
  const [active, setActive] = useState<DraftPickup>(() => newEmptyPickup())
  const [searchQuery, setSearchQuery] = useState('')
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingRemote, setIsLoadingRemote] = useState(false)

  const lastReverseGeocodeToastAt = useRef(0)

  const [lastSavedHash, setLastSavedHash] = useState(() => pickupsHash(pickups))

  const isDirty = useMemo(() => pickupsHash(pickups) !== lastSavedHash, [pickups, lastSavedHash])

  const center = useMemo(() => {
    const p0 = pickups.find((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number')
    if (p0 && typeof p0.latitude === 'number' && typeof p0.longitude === 'number') {
      return { lat: p0.latitude, lng: p0.longitude }
    }

    const loc = data.location
    if (loc?.lat && loc?.lng) return { lat: loc.lat, lng: loc.lng }
    return DEFAULT_CENTER
  }, [pickups, data.location])

  const syncDraftCounts = useCallback(
    (nextPickups: DraftPickup[]) => {
      onUpdate({
        draft_data: {
          ...((data as any)?.draft_data ?? {}),
          pickup_locations_count: nextPickups.length,
        },
      } as any)
    },
    [data, onUpdate],
  )

  useEffect(() => {
    // If CreateTourPage already injected pickups into draft_data, keep local state aligned.
    if (initialFromDraft) {
      const next = initialFromDraft.map(toDraftPickupFromRow)
      setPickups(next)
      setLastSavedHash(pickupsHash(next))
      syncDraftCounts(next)
      return
    }

    if (!tourId) return

    let cancelled = false
    ;(async () => {
      setIsLoadingRemote(true)
      try {
        const { data: rows, error } = await supabase
          .from('tour_pickup_locations')
          .select('*')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: true })

        if (cancelled) return
        if (error) throw error

        const next = (rows ?? []).map(toDraftPickupFromRow)
        setPickups(next)
        setLastSavedHash(pickupsHash(next))
        syncDraftCounts(next)
      } catch (e: unknown) {
        if (!cancelled) console.error('[PickupLocations] failed to load', e)
      } finally {
        if (!cancelled) setIsLoadingRemote(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tourId, initialFromDraft, syncDraftCounts])

  const applyPrimary = useCallback((targetKey: string) => {
    setPickups((prev) =>
      prev.map((p) => ({
        ...p,
        is_primary: p.key === targetKey ? !p.is_primary : false,
      })),
    )
  }, [])

  const handlePlaceSelect = useCallback(
    (place: SelectedPlaceLike) => {
      const coords = getLatLngFromPlace(place)
      if (!coords) return

      const lat = coords.lat
      const lng = coords.lng
      const { city, country } = extractCityCountry(place)

      setMarkerPosition({ lat, lng })
      setActive((prev) => ({
        ...prev,
        formatted_address:
          (place.formatted_address || place.formattedAddress) ?? prev.formatted_address,
        city,
        country,
        latitude: lat,
        longitude: lng,
        google_place_id: (place.place_id || place.id) ?? prev.google_place_id,
        title: prev.title || place.name || place.displayName || 'Pickup',
      }))

      setSearchQuery(place.formatted_address || place.formattedAddress || '')
    },
    [],
  )

  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!window.google) return
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const place = results[0] as any as google.maps.places.PlaceResult
          const { city, country } = extractCityCountry(place)
          setActive((prev) => ({
            ...prev,
            formatted_address: place.formatted_address || prev.formatted_address,
            city,
            country,
          }))
          setSearchQuery(place.formatted_address || '')
          return
        }

        if (shouldToastAgain(lastReverseGeocodeToastAt.current, 5000)) {
          lastReverseGeocodeToastAt.current = Date.now()
          toast.error('Could not auto-detect address. Please enter manually.')
        }
      })
    },
    [],
  )

  const handleMapClick = useCallback(
    (event: any) => {
      const latLng = event.detail?.latLng
      if (!latLng) return

      const lat = latLng.lat
      const lng = latLng.lng

      setMarkerPosition({ lat, lng })
      setActive((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        google_place_id: prev.google_place_id,
        formatted_address:
          prev.formatted_address?.trim().length > 0
            ? prev.formatted_address
            : `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      }))

      reverseGeocode(lat, lng)
    },
    [reverseGeocode],
  )

  const handleMarkerDrag = useCallback(
    (event: any) => {
      const latLng = event.latLng
      if (!latLng) return
      const lat = latLng.lat()
      const lng = latLng.lng()

      setMarkerPosition({ lat, lng })
      setActive((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        formatted_address:
          prev.formatted_address?.trim().length > 0
            ? prev.formatted_address
            : `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      }))

      reverseGeocode(lat, lng)
    },
    [reverseGeocode],
  )

  const handleAddOrUpdate = useCallback(() => {
    const title = active.title.trim()
    const lat = active.latitude
    const lng = active.longitude

    if (!title) {
      toast.error('Title is required')
      return
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      toast.error('Please select a pickup point on the map')
      return
    }

    if (!isValidLatLng(lat, lng)) {
      toast.error('Coordinates are invalid. Latitude must be -90..90 and longitude must be -180..180.')
      return
    }

    const formatted = active.formatted_address.trim() || formatLatLngAddress(lat, lng)

    setPickups((prev) => {
      const next = prev.some((p) => p.key === active.key)
        ? prev.map((p) => (p.key === active.key ? { ...active, formatted_address: formatted } : p))
        : [...prev, { ...active, formatted_address: formatted }]

      const primaryKeys = next.filter((p) => p.is_primary).map((p) => p.key)
      if (primaryKeys.length > 1) {
        const keep = primaryKeys[0]
        return next.map((p) => ({ ...p, is_primary: p.key === keep }))
      }

      return next
    })

    const nextActive = newEmptyPickup()
    setActive(nextActive)
    setMarkerPosition(null)
    setSearchQuery('')
  }, [active])

  const handleEdit = useCallback((key: string) => {
    const found = pickups.find((p) => p.key === key)
    if (!found) return
    setActive(found)
    if (typeof found.latitude === 'number' && typeof found.longitude === 'number') {
      setMarkerPosition({ lat: found.latitude, lng: found.longitude })
    }
    setSearchQuery(found.formatted_address)
  }, [pickups])

  const handleDelete = useCallback((key: string) => {
    setPickups((prev) => prev.filter((p) => p.key !== key))
    if (active.key === key) {
      setActive(newEmptyPickup())
      setMarkerPosition(null)
      setSearchQuery('')
    }
  }, [active.key])

  useEffect(() => {
    syncDraftCounts(pickups)
  }, [pickups, syncDraftCounts])

  const handleSavePickups = useCallback(async () => {
    const hasAnyPickups = pickups.length > 0
    const activeTitle = active.title.trim()
    const activeLat = active.latitude
    const activeLng = active.longitude

    const canPromoteActive =
      !!activeTitle &&
      typeof activeLat === 'number' &&
      typeof activeLng === 'number' &&
      isValidLatLng(activeLat, activeLng)

    const pickupsToSave = hasAnyPickups
      ? pickups
      : canPromoteActive
        ? [
            {
              ...active,
              title: activeTitle,
              formatted_address:
                active.formatted_address.trim() || formatLatLngAddress(activeLat as number, activeLng as number),
            },
          ]
        : []

    if (pickupsToSave.length < 1) {
      toast.error('Add at least 1 pickup location (click “Add / Update in list”, or enter title + coordinates)')
      return
    }

    setIsSaving(true)
    try {
      let resolvedTourId = tourId
      if (!resolvedTourId) {
        if (!ensureTourDraft) throw new Error('Tour draft not available')
        resolvedTourId = await ensureTourDraft()
      }

      // Hard enforce max-one primary
      const primaryCount = pickupsToSave.filter((p) => p.is_primary).length
      if (primaryCount > 1) {
        toast.error('Only one primary pickup is allowed')
        return
      }

      const rows = pickupsToSave.map((p) => {
        if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') {
          throw new Error('All pickups must have coordinates')
        }

        if (!isValidLatLng(p.latitude, p.longitude)) {
          throw new Error('Pickup coordinates are invalid (latitude -90..90, longitude -180..180)')
        }

        const formatted = p.formatted_address.trim() || formatLatLngAddress(p.latitude, p.longitude)

        return {
          tour_id: resolvedTourId,
          title: p.title.trim(),
          formatted_address: formatted,
          city: p.city,
          country: p.country,
          latitude: p.latitude,
          longitude: p.longitude,
          google_place_id: p.google_place_id,
          pickup_time: p.pickup_time,
          notes: p.notes,
          is_primary: p.is_primary,
        }
      })

      const { error: delError } = await supabase
        .from('tour_pickup_locations')
        .delete()
        .eq('tour_id', resolvedTourId)

      if (delError) throw delError

      const { data: inserted, error: insError } = await supabase
        .from('tour_pickup_locations')
        .insert(rows as any)
        .select('*')

      if (insError) throw insError

      const insertedSorted = [...(inserted ?? [])].sort((a: any, b: any) =>
        String(a?.created_at ?? '').localeCompare(String(b?.created_at ?? '')),
      )

      const nextPickups = insertedSorted.map(toDraftPickupFromRow)
      setPickups(nextPickups)
      setLastSavedHash(pickupsHash(nextPickups))

      onUpdate({
        draft_data: {
          ...((data as any)?.draft_data ?? {}),
          pickup_locations: insertedSorted,
          pickup_locations_count: insertedSorted.length,
        },
      } as any)

      toast.success('Pickup locations saved')
    } catch (e: any) {
      console.error('[PickupLocations] save failed', e)
      toast.error(e?.message || 'Failed to save pickup locations')
    } finally {
      setIsSaving(false)
    }
  }, [pickups, tourId, ensureTourDraft, data, onUpdate])

  const handleNextStep = useCallback(async () => {
    if (pickups.length < 1) {
      toast.error('Add at least 1 pickup location and save')
      return
    }
    if (isDirty) {
      toast.error('Save pickup locations before continuing')
      return
    }
    onNext()
  }, [pickups.length, isDirty, onNext])

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Pickup Locations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add at least one exact map pin. Travellers will be ranked by distance to the nearest pickup.
          </p>
        </div>

        <Card className="p-8 bg-white/60 backdrop-blur-xl border-white/40 shadow-2xl rounded-3xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Saved pickups</h3>
              <p className="text-xs text-muted-foreground">{pickups.length} pickup(s)</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="bg-white/60 border-white/60"
              onClick={() => {
                setActive(newEmptyPickup())
                setMarkerPosition(null)
                setSearchQuery('')
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New pickup
            </Button>
          </div>

          {isLoadingRemote ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading pickup locations…
            </div>
          ) : pickups.length === 0 ? (
            <div className="text-sm text-muted-foreground">No pickups yet. Add one below and save.</div>
          ) : (
            <div className="space-y-3">
              {pickups.map((p) => (
                <div
                  key={p.key}
                  className={cn(
                    'rounded-2xl border p-4 flex items-start justify-between gap-4 bg-white/50',
                    p.is_primary ? 'border-primary/40' : 'border-border/60',
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-foreground truncate">{p.title}</div>
                      {p.is_primary && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                          <Star className="w-3 h-3" /> Primary
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{p.formatted_address}</div>
                    <div className="text-[11px] text-muted-foreground/80 mt-1">
                      {typeof p.latitude === 'number' && typeof p.longitude === 'number'
                        ? `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`
                        : 'No coordinates'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant={p.is_primary ? 'default' : 'outline'}
                      className={cn(
                        'rounded-xl',
                        p.is_primary ? 'bg-primary text-white' : 'bg-white/60 border-white/60',
                      )}
                      onClick={() => applyPrimary(p.key)}
                      title="Toggle primary"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl bg-white/60 border-white/60"
                      onClick={() => handleEdit(p.key)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl bg-white/60 border-white/60"
                      onClick={() => handleDelete(p.key)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/30 pt-6 space-y-4">
            <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1 block">
              Add / edit pickup
            </Label>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1 block">
                  Search
                </Label>
                <PlacesAutocomplete
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onPlaceSelect={handlePlaceSelect}
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1 block">
                    Title
                  </Label>
                  <Input
                    value={active.title}
                    onChange={(e) => setActive((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Main Pickup"
                    className="rounded-2xl"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1 block">
                      Pickup time (optional)
                    </Label>
                    {active.pickup_time ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setActive((prev) => ({ ...prev, pickup_time: null }))}
                        disabled={isSaving}
                        title="Clear pickup time"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </div>

                  <TimeWheelPicker
                    value={active.pickup_time ?? undefined}
                    onChange={(value) => setActive((prev) => ({ ...prev, pickup_time: value }))}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1 block">
                  Address
                </Label>
                <Input
                  value={active.formatted_address}
                  onChange={(e) => setActive((prev) => ({ ...prev, formatted_address: e.target.value }))}
                  placeholder="Formatted address (auto-filled from map)"
                  className="rounded-2xl"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1 block">
                  Notes (optional)
                </Label>
                <Textarea
                  value={active.notes ?? ''}
                  onChange={(e) => setActive((prev) => ({ ...prev, notes: e.target.value || null }))}
                  placeholder="Anything travellers should know about this pickup"
                  rows={3}
                  className="rounded-2xl resize-none"
                  disabled={isSaving}
                />
              </div>

              <PickupMapSection
                center={center}
                markerPosition={markerPosition}
                onMapClick={handleMapClick}
                onMarkerDragEnd={handleMarkerDrag}
                isSaving={isSaving}
                active={{ latitude: active.latitude, longitude: active.longitude }}
                setActive={setActive}
                setMarkerPosition={setMarkerPosition}
                mapId={GOOGLE_MAPS_MAP_ID || undefined}
              />

              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/60 border-white/60"
                  onClick={handleAddOrUpdate}
                  disabled={isSaving}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add / Update in list
                </Button>

                <Button
                  type="button"
                  onClick={handleSavePickups}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg border-0"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save pickups
                </Button>
              </div>

              {isDirty && (
                <div className="text-xs text-muted-foreground">
                  You have unsaved changes. Save pickups before continuing.
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between pt-6 border-t border-white/30">
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
            className="px-8 bg-white/50 border-white/60 hover:bg-white/70"
          >
            Back
          </Button>
          <Button
            onClick={handleNextStep}
            size="lg"
            className="px-8 min-w-[140px] bg-primary hover:bg-primary/90 text-white font-bold shadow-lg border-0"
          >
            Next Step
          </Button>
        </div>
      </div>
    </APIProvider>
  )
}
