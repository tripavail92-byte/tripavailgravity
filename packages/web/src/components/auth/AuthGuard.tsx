import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

/**
 * Requires a signed-in user of ANY role. Logged-out visitors are sent to /auth with a return path,
 * instead of rendering a private page (My Trips, Profile, Settings…) that spins forever waiting for a
 * session that will never arrive. Use this — not RoleGuard — for pages every signed-in user can see;
 * RoleGuard additionally bounces users whose role isn't in an allow-list, which is wrong for account pages.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, initialized } = useAuth()
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <>{children}</>
}
