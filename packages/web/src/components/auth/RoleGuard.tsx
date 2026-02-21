import { RoleType } from '@tripavail/shared/roles/types'
import { ReactNode, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: RoleType[]
  redirectTo?: string
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const { user, activeRole, initialized } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (initialized && user && activeRole && !allowedRoles.includes(activeRole.role_type)) {
      const roleLabel =
        activeRole.role_type === 'admin'
          ? 'Admin'
          : activeRole.role_type === 'hotel_manager'
            ? 'Hotel Manager'
            : activeRole.role_type === 'tour_operator'
              ? 'Tour Operator'
              : 'Traveler'

      toast.error(`Access Denied: You are logged in as a ${roleLabel}.`, {
        id: 'role-denied', // Prevent duplicate toasts
      })
    }
  }, [initialized, user, activeRole, allowedRoles])

  if (!initialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  if (!activeRole || !allowedRoles.includes(activeRole.role_type)) {
    // If we have a specific redirect, use it, otherwise go to their role's dashboard
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />
    }

    // Default redirection logic based on their actual role
    const defaultDashboard =
      activeRole?.role_type === 'admin'
        ? '/admin/dashboard'
        : activeRole?.role_type === 'hotel_manager'
          ? '/manager/dashboard'
          : activeRole?.role_type === 'tour_operator'
            ? '/operator/dashboard'
            : '/'

    return <Navigate to={defaultDashboard} replace />
  }

  return <>{children}</>
}
