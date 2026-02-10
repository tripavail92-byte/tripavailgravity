import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/layouts/DashboardLayout'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { DashboardRedirect } from '@/components/auth/DashboardRedirect'
import LoginPage from '@/pages/auth/LoginPage'
// Pages
import LandingPage from '@/pages/LandingPage'
import PartnerSelectionPage from '@/pages/partner/PartnerSelectionPage'
import HotelDetailsPage from '@/pages/traveller/HotelDetailsPage'
import SearchPage from '@/pages/traveller/SearchPage'
import ListHotelPage from '@/pages/manager/ListHotelPage'
import ListPackagePage from '@/pages/manager/ListPackagePage'
import DashboardPage from '@/pages/hotel-manager/DashboardPage'
import OperatorDashboardPage from '@/pages/tour-operator/OperatorDashboardPage'
import TourOperatorSetupPage from '@/pages/tour-operator/setup/TourOperatorSetupPage'
import CreateTourPage from '@/pages/tour-operator/tours/create/CreateTourPage'
import TourDetailsPage from '@/pages/traveller/TourDetailsPage'
import TourCheckoutPage from '@/pages/checkout/TourCheckoutPage'
import BookingConfirmationPage from '@/pages/checkout/BookingConfirmationPage'
import PackageDetailsPage from '@/pages/traveller/PackageDetailsPage'
import Homepage from '@/pages/traveller/Homepage'
import TravellerLayout from '@/layouts/TravellerLayout'

function App() {
  const { initialize, initialized, activeRole } = useAuth()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Apply role-based theme
  useEffect(() => {
    if (activeRole?.role_type) {
      document.documentElement.setAttribute('data-role', activeRole.role_type)
    } else {
      // Default to traveller if no role or not logged in
      document.documentElement.setAttribute('data-role', 'traveller')
    }
  }, [activeRole])

  if (!initialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/auth" element={<LoginPage />} />

        {/* Traveller Routes (Teal Theme) */}
        <Route element={<TravellerLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<Homepage />} />
          <Route path="/packages/:id" element={<PackageDetailsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/hotel/:id" element={<HotelDetailsPage />} />
          <Route path="/tours/:id" element={<TourDetailsPage />} />
          <Route path="/checkout/tour/:id" element={<TourCheckoutPage />} />
          <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
        </Route>

        {/* Authenticated Routes with Drawer (Purple Theme) */}
        <Route element={<DashboardLayout />}>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/hotels/:id" element={<HotelDetailsPage />} />
          <Route path="/partner/onboarding" element={<PartnerSelectionPage />} />

          <Route
            path="/manager/dashboard"
            element={
              <RoleGuard allowedRoles={['hotel_manager']}>
                <DashboardPage />
              </RoleGuard>
            }
          />

          <Route
            path="/operator/dashboard"
            element={
              <RoleGuard allowedRoles={['tour_operator']}>
                <OperatorDashboardPage />
              </RoleGuard>
            }
          />

          <Route
            path="/operator/setup"
            element={
              <RoleGuard allowedRoles={['tour_operator']}>
                <TourOperatorSetupPage />
              </RoleGuard>
            }
          />

          <Route
            path="/operator/tours/new"
            element={
              <RoleGuard allowedRoles={['tour_operator']}>
                <CreateTourPage />
              </RoleGuard>
            }
          />

          <Route path="/dashboard" element={<DashboardRedirect />} />
        </Route>

        {/* Full Screen Flows */}
        <Route path="/manager/list-hotel" element={<ListHotelPage />} />
        <Route path="/manager/list-package" element={<ListPackagePage />} />

        {/* Public Routes */}
        <Route path="/packages/:id" element={<PackageDetailsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
