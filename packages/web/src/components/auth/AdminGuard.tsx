import { ReactNode, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { useAdminRole } from '@/queries/adminQueries'
import { supabase } from '@/lib/supabase'

type AdminGuardState =
  | { status: 'checking' }
  | { status: 'allowed'; role: 'super_admin' | 'moderator' | 'support' }
  | { status: 'denied' }

interface AdminGuardProps {
  children: ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, activeRole, initialized } = useAuth()
  const location = useLocation()

  const [state, setState] = useState<AdminGuardState>({ status: 'checking' })

  // ✅ Enterprise: Use query hook instead of manual useEffect
  const { data: adminUser, isLoading, error } = useAdminRole(user?.id, {
    enabled: initialized && !!user,
  })

  useEffect(() => {
    if (!initialized) return

    if (!user) {
      setState({ status: 'denied' })
      return
    }

    if (isLoading) {
      setState({ status: 'checking' })
      return
    }

    if (error || !adminUser || !adminUser.role) {
      setState({ status: 'denied' })
      return
    }

    setState({ status: 'allowed', role: adminUser.role as any })
  }, [initialized, user, adminUser, isLoading, error])

  useEffect(() => {
    if (state.status !== 'allowed' || !user) return

    const key = `tripavail:admin_login_logged:${user.id}`
    if (sessionStorage.getItem(key)) return

    sessionStorage.setItem(key, '1')

    const fingerprintSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const accessToken = data?.session?.access_token
        if (!accessToken) return null

        if (typeof crypto === 'undefined' || !crypto.subtle) return null

        const bytes = new TextEncoder().encode(accessToken)
        const digest = await crypto.subtle.digest('SHA-256', bytes)
        const hex = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')

        return hex
      } catch {
        return null
      }
    }

    ;(async () => {
      try {
        const sessionId = await fingerprintSession()
        await supabase.rpc('admin_log_login' as any, {
          p_ip_address: null,
          p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          p_session_id: sessionId,
        })
      } catch {
        // Best-effort logging only
      }
    })()
  }, [state.status, user])

  useEffect(() => {
    if (state.status === 'denied' && initialized && user) {
      toast.error('Access Denied: Admin privileges required.', {
        id: 'admin-denied',
      })
    }
  }, [state.status, initialized, user])

  if (!initialized || state.status === 'checking') {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  if (state.status === 'denied') {
    const defaultDashboard =
      activeRole?.role_type === 'hotel_manager'
        ? '/manager/dashboard'
        : activeRole?.role_type === 'tour_operator'
          ? '/operator/dashboard'
          : '/'

    return <Navigate to={defaultDashboard} replace />
  }

  return <>{children}</>
}
