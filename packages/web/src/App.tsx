import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/layouts/DashboardLayout'
import LoginPage from '@/pages/auth/LoginPage'
// Pages
import LandingPage from '@/pages/LandingPage'
import PartnerSelectionPage from '@/pages/partner/PartnerSelectionPage'
import HotelDetailsPage from '@/pages/traveller/HotelDetailsPage'
import SearchPage from '@/pages/traveller/SearchPage'
import ListHotelPage from '@/pages/manager/ListHotelPage'
import ListPackagePage from '@/pages/manager/ListPackagePage'
import DashboardPage from '@/pages/hotel-manager/DashboardPage'
import PackageDetailsPage from '@/pages/traveller/PackageDetailsPage'

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
          <Route path="/" element={<Homepage />} />
          <Route path="/packages/:id" element={<PackageDetailsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/hotel/:id" element={<HotelDetailsPage />} />
        </Route>

        {/* Authenticated Routes with Drawer (Purple Theme) */}
        <Route element={<DashboardLayout />}>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/hotels/:id" element={<HotelDetailsPage />} />
          <Route path="/partner/onboarding" element={<PartnerSelectionPage />} />
          <Route path="/manager/dashboard" element={<DashboardPage />} />
          <Route path="/operator/dashboard" element={<div>Tour Operator Dashboard (Coming Soon)</div>} />
          <Route path="/dashboard" element={<div>Dashboard (Coming Soon)</div>} />
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
