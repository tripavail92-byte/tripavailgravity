import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/layouts/DashboardLayout'
import LoginPage from '@/pages/auth/LoginPage'
// Pages
import LandingPage from '@/pages/LandingPage'
import PartnerSelectionPage from '@/pages/partner/PartnerSelectionPage'
import HotelDetailsPage from '@/pages/traveller/HotelDetailsPage'
import SearchPage from '@/pages/traveller/SearchPage'
import ListHotelPage from '@/pages/manager/ListHotelPage'
import DashboardPage from '@/pages/hotel-manager/DashboardPage'

function App() {
  const { initialize, initialized } = useAuth()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!initialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<LoginPage />} />

        {/* Authenticated Routes with Drawer */}
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
