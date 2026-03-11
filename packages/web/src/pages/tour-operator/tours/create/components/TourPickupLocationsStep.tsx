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
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Tour } from '@/features/tour-operator/services/tourService'

import { PickupMap } from './PickupMap'
import { TimeWheelPicker } from './TimeWheelPicker'

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

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  ae: 'ae',
  'united arab emirates': 'ae',
  uae: 'ae',
  au: 'au',
  australia: 'au',
  bd: 'bd',
  bangladesh: 'bd',
  ca: 'ca',
  canada: 'ca',
  de: 'de',
  germany: 'de',
  eg: 'eg',
  egypt: 'eg',
  es: 'es',
  spain: 'es',
  fr: 'fr',
  france: 'fr',
  gb: 'gb',
  uk: 'gb',
  'united kingdom': 'gb',
  in: 'in',
  india: 'in',
  it: 'it',
  italy: 'it',
  lk: 'lk',
  'sri lanka': 'lk',
  my: 'my',
  malaysia: 'my',
  np: 'np',
  nepal: 'np',
  om: 'om',
  oman: 'om',
  pk: 'pk',
  pakistan: 'pk',
  qa: 'qa',
  qatar: 'qa',
  sa: 'sa',
  'saudi arabia': 'sa',
  sg: 'sg',
  singapore: 'sg',
  th: 'th',
  thailand: 'th',
  tr: 'tr',
  turkey: 'tr',
  us: 'us',
  usa: 'us',
  'united states': 'us',
}

function normalizeCountryValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function getCountryRestrictionCode(value: string | null | undefined) {
  const normalized = normalizeCountryValue(value)
  if (!normalized) return null
  return COUNTRY_NAME_TO_CODE[normalized] ?? (normalized.length === 2 ? normalized : null)
}

function matchesCountryRestriction(placeCountry: string | null | undefined, countryCode: string | null) {
  if (!countryCode) return true
  return getCountryRestrictionCode(placeCountry) === countryCode
}

function buildStaticMapPreviewUrl(lat: number, lng: number) {
  if (!GOOGLE_MAPS_API_KEY || !isValidLatLng(lat, lng)) return null

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: '14',
    size: '640x320',
    scale: '2',
    maptype: 'roadmap',
    markers: `color:0x0f766e|${lat},${lng}`,
    key: GOOGLE_MAPS_API_KEY,
  })

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
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
  countryRestriction,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  onPlaceSelect: (place: SelectedPlaceLike) => void
  countryRestriction?: string | null
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
          try {
            const lib = (await (google.maps as any).importLibrary('places')) as any
            const AutocompleteSuggestion = lib?.AutocompleteSuggestion
            const AutocompleteSessionToken = lib?.AutocompleteSessionToken

            if (AutocompleteSuggestion) {
              if (!sessionTokenRef.current && AutocompleteSessionToken) {
                sessionTokenRef.current = new AutocompleteSessionToken()
              }

              const request: any = {
                input: value,
              }

              if (countryRestriction) {
                request.includedRegionCodes = [countryRestriction]
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
          } catch (e) {
            console.warn('[PickupLocations] autocomplete(new) failed; falling back to legacy autocomplete', e)
          }
        }

        if (!google.maps.places?.AutocompleteService) {
          setPredictions([])
          return
        }

        const service = new google.maps.places.AutocompleteService()
        const response = await service.getPlacePredictions({
          input: value,
          ...(countryRestriction ? { componentRestrictions: { country: countryRestriction } } : {}),
        })
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
  }, [value, open, map, countryRestriction])

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
          console.warn('[PickupLocations] place details (new) failed; falling back to legacy details lookup', e)
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
  const { user } = useAuth()
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
  const [profileCountry, setProfileCountry] = useState<string | null>(null)

  const lastReverseGeocodeToastAt = useRef(0)
  const draftDataRef = useRef<any>(((data as any)?.draft_data ?? {}))

  const [lastSavedHash, setLastSavedHash] = useState(() => pickupsHash(pickups))

  const isDirty = useMemo(() => pickupsHash(pickups) !== lastSavedHash, [pickups, lastSavedHash])

  const primaryPickup = useMemo(() => pickups.find((pickup) => pickup.is_primary) ?? pickups[0] ?? null, [pickups])

  const hasActiveDraft = useMemo(
    () =>
      Boolean(
        active.title.trim() ||
          active.formatted_address.trim() ||
          active.notes?.trim() ||
          typeof active.latitude === 'number' ||
          typeof active.longitude === 'number',
      ),
    [active],
  )

  const activeExistsInList = useMemo(() => pickups.some((pickup) => pickup.key === active.key), [pickups, active.key])

  const currentWorkspacePickup = hasActiveDraft ? active : primaryPickup

  const countryRestriction = useMemo(
    () =>
      getCountryRestrictionCode(data.location?.country) ??
      getCountryRestrictionCode(profileCountry) ??
      getCountryRestrictionCode(primaryPickup?.country) ??
      null,
    [data.location?.country, profileCountry, primaryPickup?.country],
  )

  const center = useMemo(() => {
    const p0 = pickups.find((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number')
    if (p0 && typeof p0.latitude === 'number' && typeof p0.longitude === 'number') {
      return { lat: p0.latitude, lng: p0.longitude }
    }

    const loc = data.location
    if (loc?.lat && loc?.lng) return { lat: loc.lat, lng: loc.lng }
    return DEFAULT_CENTER
  }, [pickups, data.location])

  useEffect(() => {
    draftDataRef.current = (data as any)?.draft_data ?? {}
  }, [data])

  useEffect(() => {
    if (!user?.id) {
      setProfileCountry(null)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const { data: profile, error } = await (supabase.from('profiles' as any) as any)
          .select('country')
          .eq('id', user.id)
          .maybeSingle()

        if (cancelled || error) return
        setProfileCountry((profile?.country as string | null) ?? null)
      } catch {
        if (!cancelled) setProfileCountry(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const updateDraftData = useCallback(
    (partialDraftData: Record<string, unknown>) => {
      onUpdate({
        draft_data: {
          ...draftDataRef.current,
          ...partialDraftData,
        },
      } as any)
    },
    [onUpdate],
  )

  const syncDraftCounts = useCallback(
    (nextPickups: DraftPickup[]) => {
      updateDraftData({ pickup_locations_count: nextPickups.length })
    },
    [updateDraftData],
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

      if (!matchesCountryRestriction(country, countryRestriction)) {
        toast.error('Select a pickup inside the configured tour country.')
        return
      }

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
    [countryRestriction],
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

  const resetEditor = useCallback(() => {
    setActive(newEmptyPickup())
    setMarkerPosition(null)
    setSearchQuery('')
  }, [])

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
      toast.error('Add at least 1 pickup location (click "Add / Update in list", or enter title + coordinates)')
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

      const sortByCreatedAtAsc = (list: any[]) =>
        [...list].sort((a: any, b: any) =>
          String(a?.created_at ?? '').localeCompare(String(b?.created_at ?? '')),
        )

      let sourceRows: any[] = Array.isArray(inserted) ? sortByCreatedAtAsc(inserted) : []

      // Some Supabase/RLS setups allow INSERT but prevent RETURNING/SELECT representation.
      // In that case, immediately refetch for UI consistency.
      if (sourceRows.length < rows.length) {
        const { data: fetched, error: fetchError } = await supabase
          .from('tour_pickup_locations')
          .select('*')
          .eq('tour_id', resolvedTourId)
          .order('created_at', { ascending: true })

        if (!fetchError && Array.isArray(fetched) && fetched.length > 0) {
          sourceRows = fetched
        }
      }

      // Final fallback: keep the locally-saved pickups visible even if we can't read them back.
      if (sourceRows.length === 0) {
        sourceRows = pickupsToSave.map((p) => {
          if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') {
            throw new Error('All pickups must have coordinates')
          }

          return {
            id: p.key,
            tour_id: resolvedTourId,
            title: p.title.trim(),
            formatted_address: p.formatted_address.trim() || formatLatLngAddress(p.latitude, p.longitude),
            city: p.city,
            country: p.country,
            latitude: p.latitude,
            longitude: p.longitude,
            google_place_id: p.google_place_id,
            pickup_time: p.pickup_time,
            notes: p.notes,
            is_primary: p.is_primary,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        })
      }

      const nextPickups = sourceRows.map(toDraftPickupFromRow)
      setPickups(nextPickups)
      setLastSavedHash(pickupsHash(nextPickups))

      updateDraftData({
        pickup_locations: sourceRows,
        pickup_locations_count: nextPickups.length,
      })

      toast.success('Pickup locations saved')
    } catch (e: any) {
      console.error('[PickupLocations] save failed', e)
      toast.error(e?.message || 'Failed to save pickup locations')
    } finally {
      setIsSaving(false)
    }
  }, [pickups, active, tourId, ensureTourDraft, updateDraftData])

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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <Card className="rounded-[28px] border-white/40 bg-white/65 p-4 shadow-2xl backdrop-blur-xl sm:p-6 xl:p-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                    Current Pickup Workspace
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {activeExistsInList ? 'Refining selected pickup' : pickups.length > 0 ? 'Add the next pickup' : 'Create the first pickup'}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Search, pin the exact map point, then keep building the pickup plan one stop at a time.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {countryRestriction ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Restricted to {countryRestriction.toUpperCase()}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white/70 border-white/60"
                    onClick={resetEditor}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New pickup
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                <div className="rounded-[24px] border border-border/60 bg-slate-950 p-5 text-white shadow-inner sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
                        {hasActiveDraft ? 'Editor focus' : primaryPickup ? 'Primary pickup snapshot' : 'No pickup selected'}
                      </div>
                      <div className="text-xl font-semibold leading-tight text-white sm:text-2xl">
                        {currentWorkspacePickup?.title?.trim() || 'Choose a pickup point to start the route'}
                      </div>
                      <div className="text-sm leading-6 text-white/70">
                        {currentWorkspacePickup?.formatted_address?.trim() || 'Search an address or drop the pin directly on the map to lock the boarding point.'}
                      </div>
                    </div>

                    {currentWorkspacePickup?.is_primary ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                        <Star className="h-3.5 w-3.5" />
                        Primary
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Country</div>
                      <div className="mt-2 text-sm font-medium text-white">
                        {currentWorkspacePickup?.country || data.location?.country || profileCountry || 'Not set yet'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Pickup time</div>
                      <div className="mt-2 text-sm font-medium text-white">
                        {currentWorkspacePickup?.pickup_time || 'Optional'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Coordinates</div>
                      <div className="mt-2 text-sm font-medium text-white">
                        {typeof currentWorkspacePickup?.latitude === 'number' && typeof currentWorkspacePickup?.longitude === 'number'
                          ? `${currentWorkspacePickup.latitude.toFixed(5)}, ${currentWorkspacePickup.longitude.toFixed(5)}`
                          : 'Awaiting map pin'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Status</div>
                      <div className="mt-2 text-sm font-medium text-white">
                        {activeExistsInList ? 'Editing existing stop' : hasActiveDraft ? 'Draft in progress' : pickups.length > 0 ? 'Ready for next stop' : 'Waiting for first stop'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-border/60 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5 shadow-sm sm:p-6">
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                      Workflow
                    </div>
                    <ol className="space-y-3 text-sm text-foreground/85">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">1</span>
                        Search the pickup or place the marker manually on the map.
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">2</span>
                        Confirm the title, time, address, and traveller instructions.
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">3</span>
                        Add it to the route list, then save the full pickup plan before continuing.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="block pl-1 text-xs font-bold uppercase tracking-widest text-gray-900">
                    Search
                  </Label>
                  <PlacesAutocomplete
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onPlaceSelect={handlePlaceSelect}
                    countryRestriction={countryRestriction}
                    disabled={isSaving}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="block pl-1 text-xs font-bold uppercase tracking-widest text-gray-900">
                      Title
                    </Label>
                    <Input
                      value={active.title}
                      onChange={(e) => setActive((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Marina Gate pickup"
                      className="rounded-2xl"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="block pl-1 text-xs font-bold uppercase tracking-widest text-gray-900">
                        Pickup time
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
                          <X className="h-4 w-4" />
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
                  <Label className="block pl-1 text-xs font-bold uppercase tracking-widest text-gray-900">
                    Address
                  </Label>
                  <Input
                    value={active.formatted_address}
                    onChange={(e) => setActive((prev) => ({ ...prev, formatted_address: e.target.value }))}
                    placeholder="Formatted address"
                    className="rounded-2xl"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="block pl-1 text-xs font-bold uppercase tracking-widest text-gray-900">
                    Notes
                  </Label>
                  <Textarea
                    value={active.notes ?? ''}
                    onChange={(e) => setActive((prev) => ({ ...prev, notes: e.target.value || null }))}
                    placeholder="Add instructions like landmark, entrance, waiting rules, or vehicle access notes"
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

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white/70 border-white/60"
                    onClick={handleAddOrUpdate}
                    disabled={isSaving}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {activeExistsInList ? 'Update pickup in plan' : 'Add pickup to plan'}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSavePickups}
                    disabled={isSaving}
                    className="bg-primary text-white font-bold shadow-lg border-0 hover:bg-primary/90"
                  >
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save pickups
                  </Button>
                </div>

                {isDirty ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                    You have unsaved changes. Save the pickup plan before continuing.
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] border-white/40 bg-white/60 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="space-y-5 xl:sticky xl:top-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Saved pickup plan</h3>
                <p className="text-sm text-muted-foreground">
                  {pickups.length} stop{pickups.length === 1 ? '' : 's'} ready for travellers.
                </p>
              </div>

              {isLoadingRemote ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading pickup locations...
                </div>
              ) : pickups.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground">
                  No pickups saved yet. Build the first stop in the workspace and add it to the plan.
                </div>
              ) : (
                <div className="space-y-4">
                  {pickups.map((pickup, index) => {
                    const mapPreview =
                      typeof pickup.latitude === 'number' && typeof pickup.longitude === 'number'
                        ? buildStaticMapPreviewUrl(pickup.latitude, pickup.longitude)
                        : null

                    return (
                      <article
                        key={pickup.key}
                        className={cn(
                          'overflow-hidden rounded-[24px] border bg-white/75 shadow-sm transition-colors',
                          pickup.is_primary ? 'border-primary/35 ring-1 ring-primary/10' : 'border-border/60',
                        )}
                      >
                        <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-slate-200 via-slate-100 to-white">
                          {mapPreview ? (
                            <img
                              src={mapPreview}
                              alt={pickup.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                              Map preview unavailable
                            </div>
                          )}

                          <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white">
                            Stop {index + 1}
                          </div>

                          {pickup.is_primary ? (
                            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-300/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-950">
                              <Star className="h-3.5 w-3.5" />
                              Primary
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-4 p-4">
                          <div className="space-y-2">
                            <div className="text-base font-semibold text-foreground">{pickup.title}</div>
                            <div className="text-sm leading-6 text-muted-foreground">{pickup.formatted_address}</div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                            <div className="rounded-2xl bg-muted/35 px-3 py-2">
                              <div className="font-semibold uppercase tracking-[0.18em] text-[10px] text-foreground/60">Pickup time</div>
                              <div className="mt-1 text-sm text-foreground">{pickup.pickup_time || 'Not set'}</div>
                            </div>
                            <div className="rounded-2xl bg-muted/35 px-3 py-2">
                              <div className="font-semibold uppercase tracking-[0.18em] text-[10px] text-foreground/60">Location</div>
                              <div className="mt-1 text-sm text-foreground">{pickup.city || pickup.country || 'Coordinates only'}</div>
                            </div>
                          </div>

                          {pickup.notes?.trim() ? (
                            <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3 text-sm text-muted-foreground">
                              {pickup.notes}
                            </div>
                          ) : null}

                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <Button
                              type="button"
                              variant={pickup.is_primary ? 'default' : 'outline'}
                              className={cn(
                                'rounded-xl sm:flex-1',
                                pickup.is_primary ? 'bg-primary text-white' : 'bg-white/70 border-white/60',
                              )}
                              onClick={() => applyPrimary(pickup.key)}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              {pickup.is_primary ? 'Primary stop' : 'Make primary'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-xl bg-white/70 border-white/60 sm:flex-1"
                              onClick={() => handleEdit(pickup.key)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-xl bg-white/70 border-white/60"
                              onClick={() => handleDelete(pickup.key)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

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
