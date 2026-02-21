import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuditLogs } from '@/queries/adminQueries'

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
  // ✅ Enterprise: Use query hook instead of manual useEffect
  const { data: logs = [], isLoading: loading, error, refetch: reload } = useAuditLogs()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // ✅ Set error from query
  useEffect(() => {
    if (error) {
      setErrorMessage(error.message || 'Failed to load audit logs')
    }
  }, [error])

  // ✅ Listen for admin actions to refetch logs
  useEffect(() => {
    const onAdminAction = () => {
      reload()
    }

    window.addEventListener('tripavail:admin_action', onAdminAction)

    return () => {
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
