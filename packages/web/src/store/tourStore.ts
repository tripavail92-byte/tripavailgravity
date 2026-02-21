import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TourState {
  completedTravellerTourVersion: string | null
  completedHotelManagerTourVersion: string | null
  completedTourOperatorTourVersion: string | null
  completeTour: (role: 'traveller' | 'hotel-manager' | 'tour-operator', version: string) => void
  resetTours: () => void
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      completedTravellerTourVersion: null,
      completedHotelManagerTourVersion: null,
      completedTourOperatorTourVersion: null,

      completeTour: (role, version) =>
        set((state) => {
          switch (role) {
            case 'traveller':
              return { completedTravellerTourVersion: version }
            case 'hotel-manager':
              return { completedHotelManagerTourVersion: version }
            case 'tour-operator':
              return { completedTourOperatorTourVersion: version }
            default:
              return state
          }
        }),

      resetTours: () =>
        set({
          completedTravellerTourVersion: null,
          completedHotelManagerTourVersion: null,
          completedTourOperatorTourVersion: null,
        }),
    }),
    {
      name: 'tripavail-tour-storage', // unique name
    },
  ),
)
