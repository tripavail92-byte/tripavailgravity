import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import SearchPage from '@/pages/traveller/SearchPage';
import HotelDetailsPage from '@/pages/traveller/HotelDetailsPage';
import PartnerSelectionPage from '@/pages/partner/PartnerSelectionPage';
import DashboardLayout from '@/layouts/DashboardLayout';

function App() {
    const { initialize, initialized } = useAuth();

    useEffect(() => {
        initialize();
    }, [initialize]);

    if (!initialized) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
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
                    <Route path="/dashboard" element={<div>Dashboard (Coming Soon)</div>} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
