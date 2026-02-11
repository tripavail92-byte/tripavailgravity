import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function DashboardRedirect() {
    const { user, activeRole, initialized } = useAuth();

    if (!initialized) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // Determine default dashboard based on role
    const defaultDashboard = activeRole?.role_type === 'hotel_manager'
        ? '/manager/dashboard'
        : activeRole?.role_type === 'tour_operator'
            ? '/operator/dashboard'
            : '/dashboard/overview';

    return <Navigate to={defaultDashboard} replace />;
}
