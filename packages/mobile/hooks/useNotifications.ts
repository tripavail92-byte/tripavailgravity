import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { type AppNotification, fetchNotifications, markAllNotificationsRead } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'

/** Notifications list + unread count + realtime + mark-all-read. */
export function useNotifications() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = ['notifications', user?.id] as const

  const { data: notifications = [] } = useQuery({
    queryKey: key,
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000,
  })

  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<AppNotification[]>(key)
      qc.setQueryData<AppNotification[]>(key, (old) => (old ?? []).map((n) => ({ ...n, read: true })))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return {
    notifications,
    unread,
    isAuthed: !!user,
    markAll: () => markAll.mutate(),
  }
}
