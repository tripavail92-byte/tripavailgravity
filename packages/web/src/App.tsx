import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { useAuth } from '@/hooks/useAuth'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { DashboardRedirect } from '@/components/auth/DashboardRedirect'

// Eager load critical components
import DashboardLayout from '@/layouts/DashboardLayout'
import TravellerLayout from '@/layouts/TravellerLayout'
import LoginPage from '@/pages/auth/LoginPage'
import LandingPage from '@/pages/LandingPage'

// Lazy load all other pages
const PartnerSelectionPage = lazy(() => import('@/pages/partner/PartnerSelectionPage'))
const HotelDetailsPage = lazy(() => import('@/pages/traveller/HotelDetailsPage'))
const SearchPage = lazy(() => import('@/pages/traveller/SearchPage'))
const ListHotelPage = lazy(() => import('@/pages/manager/ListHotelPage'))
const ListPackagePage = lazy(() => import('@/pages/manager/ListPackagePage'))
const DashboardPage = lazy(() => import('@/pages/hotel-manager/DashboardPage'))
const OperatorDashboardPage = lazy(() => import('@/pages/tour-operator/OperatorDashboardPage'))
const TourOperatorSetupPage = lazy(() => import('@/pages/tour-operator/setup/TourOperatorSetupPage'))
const CreateTourPage = lazy(() => import('@/pages/tour-operator/tours/create/CreateTourPage'))
const TourDetailsPage = lazy(() => import('@/pages/traveller/TourDetailsPage'))
const TourCheckoutPage = lazy(() => import('@/pages/checkout/TourCheckoutPage'))
const BookingConfirmationPage = lazy(() => import('@/pages/checkout/BookingConfirmationPage'))
const PackageBookingConfirmationPage = lazy(() => import('@/pages/checkout/PackageBookingConfirmationPage'))
const PackageDetailsPage = lazy(() => import('@/pages/traveller/PackageDetailsPage'))
const PackageCheckoutPage = lazy(() => import('@/pages/checkout/PackageCheckoutPage'))
const Homepage = lazy(() => import('@/pages/traveller/Homepage'))
const TravellerProfilePage = lazy(() => import('@/pages/traveller/TravellerProfilePage'))
const AccountSettingsPage = lazy(() => import('@/pages/traveller/AccountSettingsPage'))
const HotelManagerSettingsPage = lazy(() => import('@/pages/hotel-manager/HotelManagerSettingsPage'))
const TourOperatorSettingsPage = lazy(() => import('@/pages/tour-operator/TourOperatorSettingsPage'))

// Legal (public)
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'))
const PrivacyPage = lazy(() => import('@/pages/legal/PrivacyPage'))
const RefundsPage = lazy(() => import('@/pages/legal/RefundsPage'))
const ContactPage = lazy(() => import('@/pages/legal/ContactPage'))

// Loading component
const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

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
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/checkout/package/:id" element={<PackageCheckoutPage />} />
          <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
          <Route path="/booking/package/confirmation" element={<PackageBookingConfirmationPage />} />
          
          {/* Profile & Settings */}
          <Route path="/profile" element={<TravellerProfilePage />} />
          <Route path="/settings" element={<AccountSettingsPage />} />

          {/* Legal */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/refunds" element={<RefundsPage />} />
          <Route path="/contact" element={<ContactPage />} />
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

          {/* Hotel Manager Settings */}
          <Route
            path="/manager/settings"
            element={
              <RoleGuard allowedRoles={['hotel_manager']}>
                <HotelManagerSettingsPage />
              </RoleGuard>
            }
          />

          {/* Tour Operator Settings */}
          <Route
            path="/operator/settings"
            element={
              <RoleGuard allowedRoles={['tour_operator']}>
                <TourOperatorSettingsPage />
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
      </Suspense>
    </BrowserRouter>
  )
}

export default App
