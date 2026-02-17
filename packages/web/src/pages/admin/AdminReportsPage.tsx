import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchReports } from '@/features/admin/services/adminService'
import { supabase } from '@/lib/supabase'

type ReportRow = {
  id: string
  reporter_id: string | null
  target_entity_type: string
  target_entity_id: string
  report_reason: string
  details: string | null
  status: string
  status_reason: string | null
  created_at: string
}

type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed'

const MIN_REASON_LEN = 12

function shortId(value: string | null) {
  if (!value) return '—'
  return value.length <= 12 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`
}

export default function AdminReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [nextStatusById, setNextStatusById] = useState<Record<string, ReportStatus>>({})
  const [reasonById, setReasonById] = useState<Record<string, string>>({})
  const [busyById, setBusyById] = useState<Record<string, boolean>>({})

  const [confirm, setConfirm] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: null | (() => void)
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: null,
  })

  const rpc = (
    supabase as unknown as {
      rpc: (
        fn: string,
        args: unknown,
      ) => Promise<{ data: unknown; error: { message: string } | null }>
    }
  ).rpc

  useEffect(() => {
    let isCancelled = false

    const load = async () => {
      setLoading(true)
      setErrorMessage(null)

      try {
        const data = await fetchReports(50)
        if (!isCancelled) setRows(data as ReportRow[])
      } catch (err: any) {
        console.error('Error loading reports:', err)
        if (!isCancelled) setErrorMessage(err?.message || 'Failed to load reports')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [])

  const reloadReports = async () => {
    setErrorMessage(null)

    try {
      const data = await fetchReports(50)
      setRows(data as ReportRow[])
    } catch (err: any) {
      console.error('Error reloading reports:', err)
      setErrorMessage(err?.message || 'Failed to load reports')
    }
  }

  const statusOptions = useMemo(() => {
    return [
      { value: 'open', label: 'open' },
      { value: 'in_review', label: 'in_review' },
      { value: 'resolved', label: 'resolved' },
      { value: 'dismissed', label: 'dismissed' },
    ] as const
  }, [])

  const applyStatus = async (row: ReportRow) => {
    const nextStatus = (nextStatusById[row.id] || row.status || 'open') as ReportStatus

    if (nextStatus === 'dismissed') {
      setConfirm({
        open: true,
        title: 'Confirm dismiss',
        description: 'This will dismiss the report. This action is logged.',
        onConfirm: () => doApplyStatus(row),
      })
      return
    }

    await doApplyStatus(row)
  }

  const doApplyStatus = async (row: ReportRow) => {
    const nextStatus = (nextStatusById[row.id] || row.status || 'open') as ReportStatus
    const reason = (reasonById[row.id] || '').trim()

    if (!reason) {
      toast.error('Reason is required', { id: `reason-report-${row.id}` })
      return
    }

    if (reason.length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`, {
        id: `reason-report-${row.id}`,
      })
      return
    }

    setBusyById((prev) => ({ ...prev, [row.id]: true }))
    try {
      const { error } = await rpc('admin_set_report_status', {
        p_report_id: row.id,
        p_status: nextStatus,
        p_reason: reason,
      })

      if (error) throw error

      toast.success('Report updated — see Audit Logs')
      window.dispatchEvent(new CustomEvent('tripavail:admin_action'))
      await reloadReports()
      setReasonById((prev) => ({ ...prev, [row.id]: '' }))
    } catch (err: any) {
      console.error('Error updating report:', err)
      toast.error(err?.message || 'Failed to update report')
    } finally {
      setBusyById((prev) => ({ ...prev, [row.id]: false }))
    }
  }

  const suspendTargetFromReport = async (row: ReportRow) => {
    const reason = (reasonById[row.id] || '').trim()

    if (!reason) {
      toast.error('Reason is required', { id: `reason-suspend-${row.id}` })
      return
    }

    if (reason.length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`, {
        id: `reason-suspend-${row.id}`,
      })
      return
    }

    const targetId = row.target_entity_id
    if (!targetId) return

    setBusyById((prev) => ({ ...prev, [row.id]: true }))
    try {
      if (row.target_entity_type === 'package') {
        const { error } = await rpc('admin_moderate_package', {
          p_package_id: targetId,
          p_status: 'suspended',
          p_reason: reason,
        })
        if (error) throw error
      } else if (row.target_entity_type === 'tour') {
        const { error } = await rpc('admin_moderate_tour', {
          p_tour_id: targetId,
          p_status: 'suspended',
          p_reason: reason,
        })
        if (error) throw error
      } else if (row.target_entity_type === 'user') {
        const { error } = await rpc('admin_set_traveler_status', {
          p_user_id: targetId,
          p_status: 'suspended',
          p_reason: reason,
        })
        if (error) throw error
      } else {
        toast.error('No quick action available for this entity type')
        return
      }

      toast.success('Action applied — see Audit Logs')
      window.dispatchEvent(new CustomEvent('tripavail:admin_action'))
    } catch (err: any) {
      console.error('Error applying quick action:', err)
      toast.error(err?.message || 'Failed to apply action')
    } finally {
      setBusyById((prev) => ({ ...prev, [row.id]: false }))
    }
  }

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-64" />
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
            <CardTitle className="text-lg">Couldn’t load reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </CardContent>
        </Card>
      )
    }

    if (!rows.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No reports yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Reports will appear here once they exist in the database.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg truncate">{r.target_entity_type}</CardTitle>
                  <div className="text-sm text-muted-foreground truncate">
                    Target: {shortId(r.target_entity_id)} • Reporter: {shortId(r.reporter_id)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Report reason: <span className="text-foreground">{r.report_reason}</span>
              </div>
              {r.details ? (
                <div className="text-sm text-muted-foreground">
                  Details: <span className="text-foreground">{r.details}</span>
                </div>
              ) : null}
              <div className="text-xs text-muted-foreground">
                Created: {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
              </div>

              <div className="mt-3 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(r.target_entity_type === 'package' || r.target_entity_type === 'tour') && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => suspendTargetFromReport(r)}
                      disabled={!!busyById[r.id]}
                    >
                      Suspend Listing
                    </Button>
                  )}
                  {r.target_entity_type === 'user' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => suspendTargetFromReport(r)}
                      disabled={!!busyById[r.id]}
                    >
                      Suspend User
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    value={nextStatusById[r.id] || (r.status as ReportStatus)}
                    onValueChange={(value) =>
                      setNextStatusById((prev) => ({
                        ...prev,
                        [r.id]: value as ReportStatus,
                      }))
                    }
                    disabled={!!busyById[r.id]}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Reason (required)"
                    value={reasonById[r.id] || ''}
                    onChange={(e) =>
                      setReasonById((prev) => ({
                        ...prev,
                        [r.id]: e.target.value,
                      }))
                    }
                    disabled={!!busyById[r.id]}
                  />

                  <Button onClick={() => applyStatus(r)} disabled={!!busyById[r.id]}>
                    {busyById[r.id] ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        Applying…
                      </span>
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Reason must be at least {MIN_REASON_LEN} characters. All actions are logged.
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }, [busyById, errorMessage, loading, nextStatusById, reasonById, rows, statusOptions])

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Reports</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Moderation-driven reports (review/resolve/dismiss) with audit logging.
      </p>

      <div className="mt-6">{content}</div>

      <Dialog
        open={confirm.open}
        onOpenChange={(open) =>
          setConfirm((prev) => ({ ...prev, open, onConfirm: open ? prev.onConfirm : null }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm.title}</DialogTitle>
            <DialogDescription>{confirm.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirm((prev) => ({ ...prev, open: false, onConfirm: null }))}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const fn = confirm.onConfirm
                setConfirm((prev) => ({ ...prev, open: false, onConfirm: null }))
                fn?.()
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
