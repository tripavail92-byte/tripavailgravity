import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { supabase } from '@tripavail/shared/core/client'

import { useAuth } from '@/hooks/useAuth'
import { withTimeout } from '@/lib/withTimeout'

export function DashboardRedirect() {
  const { user, activeRole, initialized } = useAuth()
  const location = useLocation()
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

  useEffect(() => {
    if (!initialized) return
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
        const applyTarget = (nextTarget: string) => {
          if (nextTarget === location.pathname) {
            setTarget('/dashboard/overview')
            return
          }

          try {
            const redirectKey = `${location.pathname}->${nextTarget}`
            const raw = sessionStorage.getItem('tripavail_last_redirect')
            const now = Date.now()
            if (raw) {
              const parsed = JSON.parse(raw) as { key?: string; at?: number }
              const repeated = parsed?.key === redirectKey && now - Number(parsed?.at || 0) < 2000
              if (repeated) {
                setTarget('/dashboard/overview')
                return
              }
            }
            sessionStorage.setItem('tripavail_last_redirect', JSON.stringify({ key: redirectKey, at: now }))
          } catch {
            // ignore sessionStorage failures
          }

          setTarget(nextTarget)
        }

        if (roleType === 'tour_operator') {
          const { data, error } = await withTimeout<any>(
            supabase
              .from('tour_operator_profiles')
              .select('setup_completed')
              .eq('user_id', userId)
              .maybeSingle(),
            8000,
            'redirect.tour_operator_profiles',
          )

          if (error) throw error

          const setupCompleted = data?.setup_completed === true
          if (!cancelled) applyTarget(setupCompleted ? '/operator/dashboard' : '/operator/setup')
          return
        }

        if (roleType === 'hotel_manager') {
          const { count, error } = await withTimeout<any>(
            supabase
              .from('hotels')
              .select('*', { count: 'exact', head: true })
              .eq('owner_id', userId)
              .eq('is_published', true),
            8000,
            'redirect.hotels_count',
          )

          if (error) throw error

          const hasPublishedHotel = (count ?? 0) > 0
          if (!cancelled)
            applyTarget(hasPublishedHotel ? '/manager/dashboard' : '/manager/list-hotel')
          return
        }

        if (!cancelled) applyTarget('/dashboard/overview')
      } catch (e) {
        console.error('[DashboardRedirect] Failed to compute partner redirect target', e)
        if (!cancelled) setTarget('/dashboard/overview')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [baseTarget, roleType, userId, initialized, location.pathname])

  if (!initialized || !target) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <Navigate to={target} replace />
}
