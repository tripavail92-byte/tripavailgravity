import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

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

  const { pathname } = useLocation()

  useEffect(() => {
    // Wait for auth to be fully loaded
    if (!initialized || !user || !activeRole) {
      setIsActive(false)
      return
    }
    // Each tour points at one page's UI, so run it only there. They used to start on any page — on
    // a phone the card docks over the bottom of the screen, which covered the operator setup
    // wizard, and for a traveller who signed up mid-booking it covered the checkout pay bar.
    // The traveller tour's targets (search bar, menu button) live on the home page.
    const tourPage =
      activeRole.role_type === 'tour_operator'
        ? '/operator/dashboard'
        : activeRole.role_type === 'hotel_manager'
          ? '/manager/dashboard'
          : '/'
    if (pathname !== tourPage) {
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
    pathname,
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
