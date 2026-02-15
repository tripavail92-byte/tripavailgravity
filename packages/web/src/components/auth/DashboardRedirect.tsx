import { Navigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

export function DashboardRedirect() {
  const { user, activeRole, initialized } = useAuth()

  if (!initialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Determine default dashboard based on role
  let defaultDashboard = '/dashboard/overview'

  if (activeRole?.role_type === 'hotel_manager') {
    defaultDashboard =
      activeRole.verification_status === 'incomplete' ? '/manager/setup' : '/manager/dashboard'
  } else if (activeRole?.role_type === 'tour_operator') {
    defaultDashboard =
      activeRole.verification_status === 'incomplete' ? '/operator/setup' : '/operator/dashboard'
  }

  return <Navigate to={defaultDashboard} replace />
}
