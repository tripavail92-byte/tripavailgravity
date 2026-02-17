import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

type AdminActionLog = {
  id: string
  admin_id: string
  entity_type: string
  entity_id: string
  action_type: string
  reason: string | null
  created_at: string
}

function shortId(value: string) {
  if (!value) return ''
  return value.length <= 12 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminActionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const { data, error } = await (supabase.from('admin_action_logs' as any) as any)
        .select('id, admin_id, entity_type, entity_id, action_type, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setLogs((data || []) as AdminActionLog[])
    } catch (err: any) {
      console.error('Error loading audit logs:', err)
      setErrorMessage(err?.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    reload()

    const onAdminAction = () => {
      if (isCancelled) return
      reload()
    }

    window.addEventListener('tripavail:admin_action', onAdminAction)

    return () => {
      isCancelled = true
      window.removeEventListener('tripavail:admin_action', onAdminAction)
    }
  }, [reload])

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-56" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-80" />
                <Skeleton className="h-4 w-72" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (errorMessage) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Couldn’t load audit logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </CardContent>
        </Card>
      )
    }

    if (!logs.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No audit logs yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Logs will appear after an admin performs an action (hide/suspend/delete listings or
              suspend/reactivate users/partners).
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CardTitle className="text-lg truncate">{log.action_type}</CardTitle>
                  <Badge variant="outline" className="shrink-0">
                    {log.entity_type}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Entity: <span className="text-foreground">{shortId(log.entity_id)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Admin: <span className="text-foreground">{shortId(log.admin_id)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Reason: <span className="text-foreground">{log.reason || '—'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }, [errorMessage, loading, logs])

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Latest admin actions (most recent first).
      </p>

      <div className="mt-6">{content}</div>
    </div>
  )
}
