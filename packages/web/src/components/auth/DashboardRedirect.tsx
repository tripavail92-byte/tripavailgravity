import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { supabase } from '@tripavail/shared/core/client'

import { useAuth } from '@/hooks/useAuth'

export function DashboardRedirect() {
  const { user, activeRole, initialized } = useAuth()
  const [target, setTarget] = useState<string | null>(null)

  const roleType = activeRole?.role_type
  const userId = user?.id

  const baseTarget = useMemo(() => {
    if (!user) return '/auth'
    if (!roleType) return '/dashboard/overview'
    if (roleType === 'admin') return '/admin/dashboard'
    if (roleType === 'traveller') return '/dashboard/overview'
    return null
  }, [roleType, user])

  if (!initialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (baseTarget) {
        if (!cancelled) setTarget(baseTarget)
        return
      }

      if (!userId || !roleType) {
        if (!cancelled) setTarget('/auth')
        return
      }

      try {
        if (roleType === 'tour_operator') {
          const { data, error } = await supabase
            .from('tour_operator_profiles')
            .select('setup_completed')
            .eq('user_id', userId)
            .maybeSingle()

          if (error) throw error

          const setupCompleted = data?.setup_completed === true
          if (!cancelled) setTarget(setupCompleted ? '/operator/dashboard' : '/operator/setup')
          return
        }

        if (roleType === 'hotel_manager') {
          const { count, error } = await supabase
            .from('hotels')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId)
            .eq('is_published', true)

          if (error) throw error

          const hasPublishedHotel = (count ?? 0) > 0
          if (!cancelled) setTarget(hasPublishedHotel ? '/manager/dashboard' : '/manager/list-hotel')
          return
        }

        if (!cancelled) setTarget('/dashboard/overview')
      } catch (e) {
        console.error('[DashboardRedirect] Failed to compute partner redirect target', e)
        if (!cancelled) setTarget('/dashboard/overview')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [baseTarget, roleType, userId])

  if (!target) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <Navigate to={target} replace />
}
