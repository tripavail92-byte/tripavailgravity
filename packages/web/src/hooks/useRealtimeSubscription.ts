import { useEffect } from 'react';
import { supabase } from '@tripavail/shared/core/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions<T> {
    table: string;
    event?: RealtimeEvent;
    schema?: string;
    filter?: string;
    onData: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export function useRealtimeSubscription<T extends Record<string, any> = any>({
    table,
    event = '*',
    schema = 'public',
    filter,
    onData,
}: UseRealtimeOptions<T>) {
    useEffect(() => {
        const channelName = `realtime:${schema}:${table}:${filter || 'all'}`;

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
                    onData(payload as RealtimePostgresChangesPayload<T>);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, event, schema, filter]); // Re-subscribe if options change
}
