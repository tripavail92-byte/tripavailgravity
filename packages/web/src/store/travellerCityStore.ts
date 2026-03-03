import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { findCityByName } from '@/data/cities'

export type TravellerCitySelection = {
  city_id: string
  city_name: string
  latitude: number
  longitude: number
}

interface TravellerCityState {
  selectedCityId: string | null
  setSelectedCityId: (cityId: string | null) => void
  setSelectedCityByName: (input: string | null | undefined) => boolean
  clearSelectedCity: () => void
}

export const useTravellerCityStore = create<TravellerCityState>()(
  persist(
    (set) => ({
      selectedCityId: null,

      setSelectedCityId: (cityId) => set({ selectedCityId: cityId }),

      setSelectedCityByName: (input) => {
        const found = findCityByName(input)
        if (!found) {
          return false
        }

        set({ selectedCityId: found.id })
        return true
      },

      clearSelectedCity: () => set({ selectedCityId: null }),
    }),
    {
      name: 'tripavail-traveller-city',
    },
  ),
)
