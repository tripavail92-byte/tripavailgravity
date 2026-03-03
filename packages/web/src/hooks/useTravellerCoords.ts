import { useMemo } from 'react'

import { getCityById } from '@/data/cities'
import { useGeolocationIfGranted } from '@/hooks/useGeolocationIfGranted'
import { useTravellerCityStore } from '@/store/travellerCityStore'

type Coords = { latitude: number; longitude: number }

export function useTravellerCoords(): {
  coords: Coords | null
  source: 'city' | 'geolocation' | null
  cityId: string | null
  cityName: string | null
} {
  const selectedCityId = useTravellerCityStore((s) => s.selectedCityId)
  const { coords: geoCoords } = useGeolocationIfGranted()

  const selectedCity = useMemo(() => getCityById(selectedCityId), [selectedCityId])

  if (selectedCity) {
    return {
      coords: { latitude: selectedCity.latitude, longitude: selectedCity.longitude },
      source: 'city',
      cityId: selectedCity.id,
      cityName: selectedCity.name,
    }
  }

  if (geoCoords) {
    return {
      coords: { latitude: geoCoords.latitude, longitude: geoCoords.longitude },
      source: 'geolocation',
      cityId: null,
      cityName: null,
    }
  }

  return { coords: null, source: null, cityId: null, cityName: null }
}
