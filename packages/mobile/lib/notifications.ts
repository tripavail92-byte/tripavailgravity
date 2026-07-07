import { supabase } from '@/lib/supabase'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string | null
  metadata: any
  read: boolean
  created_at: string
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,type,title,body,metadata,read,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as AppNotification[]
}

/** Marks all of the user's notifications read (RPC marks all when called with no ids). */
export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase.rpc('mark_notifications_read')
  if (error) throw error
}
