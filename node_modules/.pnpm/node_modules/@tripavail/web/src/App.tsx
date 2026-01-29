import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import SearchPage from '@/pages/traveller/SearchPage';
// import DashboardPage from '@/pages/dashboard/DashboardPage'; // To be created

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
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<LoginPage />} />

                {/* Placeholder Routes */}
                <Route path="/search" element={<div>Search Results (Coming Soon)</div>} />
                <Route path="/dashboard" element={<div>Dashboard (Coming Soon)</div>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
