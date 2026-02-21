import { useEffect, useState } from 'react'

import { GuidedTour } from '@/components/ui/GuidedTour'
import { hotelManagerTour, tourOperatorTour, travellerTour } from '@/config/tours'
import { useAuth } from '@/hooks/useAuth'
import { useTourStore } from '@/store/tourStore'

export function TourManager() {
  const { user, activeRole, initialized } = useAuth()
  const [isActive, setIsActive] = useState(false)
  const [currentTour, setCurrentTour] = useState(travellerTour)

  const {
    completedTravellerTourVersion,
    completedHotelManagerTourVersion,
    completedTourOperatorTourVersion,
    completeTour,
  } = useTourStore()

  useEffect(() => {
    // Wait for auth to be fully loaded
    if (!initialized || !user || !activeRole) {
      setIsActive(false)
      return
    }

    const timer = setTimeout(() => {
      // Determine which tour to show based on role and completion version status
      if (
        activeRole.role_type === 'traveller' &&
        completedTravellerTourVersion !== travellerTour.version
      ) {
        setCurrentTour(travellerTour)
        setIsActive(true)
      } else if (
        activeRole.role_type === 'hotel_manager' &&
        completedHotelManagerTourVersion !== hotelManagerTour.version
      ) {
        setCurrentTour(hotelManagerTour)
        setIsActive(true)
      } else if (
        activeRole.role_type === 'tour_operator' &&
        completedTourOperatorTourVersion !== tourOperatorTour.version
      ) {
        setCurrentTour(tourOperatorTour)
        setIsActive(true)
      } else {
        setIsActive(false)
      }
    }, 1000) // Small delay to let the UI settle

    return () => clearTimeout(timer)
  }, [
    initialized,
    user,
    activeRole,
    completedTravellerTourVersion,
    completedHotelManagerTourVersion,
    completedTourOperatorTourVersion,
  ])

  const handleComplete = () => {
    setIsActive(false)
    if (activeRole) {
      if (activeRole.role_type === 'traveller') completeTour('traveller', currentTour.version || '1.0.0')
      if (activeRole.role_type === 'hotel_manager') completeTour('hotel-manager', currentTour.version || '1.0.0')
      if (activeRole.role_type === 'tour_operator') completeTour('tour-operator', currentTour.version || '1.0.0')
    }
  }

  const handleSkip = () => {
    // Skipping counts as completion to avoid nagging
    setIsActive(false)
    if (activeRole) {
      if (activeRole.role_type === 'traveller') completeTour('traveller', currentTour.version || '1.0.0')
      if (activeRole.role_type === 'hotel_manager') completeTour('hotel-manager', currentTour.version || '1.0.0')
      if (activeRole.role_type === 'tour_operator') completeTour('tour-operator', currentTour.version || '1.0.0')
    }
  }

  if (!isActive) return null

  return (
    <GuidedTour
      tour={currentTour}
      isActive={isActive}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  )
}
