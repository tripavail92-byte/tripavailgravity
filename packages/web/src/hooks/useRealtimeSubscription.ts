import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@tripavail/shared/core/client'
import { useEffect } from 'react'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeOptions<T extends Record<string, any>> {
  table: string
  event?: RealtimeEvent
  schema?: string
  filter?: string
  onData: (payload: RealtimePostgresChangesPayload<T>) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRealtimeSubscription<T extends Record<string, any> = Record<string, any>>({
  table,
  event = '*',
  schema = 'public',
  filter,
  onData,
}: UseRealtimeOptions<T>) {
  useEffect(() => {
    const channelName = `realtime:${schema}:${table}:${filter || 'all'}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter,
        },
        (payload) => {
          onData(payload as RealtimePostgresChangesPayload<T>)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event, schema, filter, onData]) // Re-subscribe if options change
}
