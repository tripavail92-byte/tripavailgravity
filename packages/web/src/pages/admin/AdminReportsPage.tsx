import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, CheckCircle2, Copy, Eye, Loader2, MessageSquare, RefreshCw, Siren, ShieldCheck, Target } from 'lucide-react'

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchAdminConversationMessages,
  fetchMessagingReports,
  fetchReports,
  fetchSupportEscalations,
} from '@/features/admin/services/adminService'
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
type MessagingReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed'
type SupportEscalationStatus = 'pending' | 'in_review' | 'resolved'

type MessagingReportRow = {
  report_id: string
  conversation_id: string
  message_id: string | null
  reporter_id: string | null
  reporter_name: string
  report_reason: string
  details: string | null
  status: MessagingReportStatus
  status_reason: string | null
  review_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  booking_scope: string
  booking_id: string
  booking_label: string
  subject: string | null
  traveler_name: string
  partner_name: string
  support_escalated_at: string | null
  last_message_preview: string | null
}

type SupportEscalationRow = {
  conversation_id: string
  booking_scope: string
  booking_id: string
  booking_label: string
  subject: string | null
  conversation_status: string
  support_escalated_at: string
  support_review_status: SupportEscalationStatus
  support_review_reason: string | null
  support_review_notes: string | null
  support_reviewed_by: string | null
  support_reviewed_at: string | null
  traveler_name: string
  partner_name: string
  last_message_preview: string | null
  updated_at: string
}

type AdminConversationMessage = {
  message_id: string
  conversation_id: string
  sender_id: string
  sender_role: string
  sender_name: string
  message_kind: string
  body: string | null
  reply_to_message_id: string | null
  created_at: string
  edited_at: string | null
  unsent_at: string | null
  metadata: Record<string, unknown>
  reactions: Array<Record<string, unknown>>
  read_by: Array<Record<string, unknown>>
}

type MessagingInspectionTarget = {
  kind: 'messaging-report'
  conversationId: string
  bookingLabel: string
  subject: string | null
  travelerName: string
  partnerName: string
  sourceLabel: string
  latestPreview: string | null
  reportId: string
  reportedMessageId: string | null
}

type EscalationInspectionTarget = {
  kind: 'support-escalation'
  conversationId: string
  bookingLabel: string
  subject: string | null
  travelerName: string
  partnerName: string
  sourceLabel: string
  latestPreview: string | null
}

type ConversationInspectionState = MessagingInspectionTarget | EscalationInspectionTarget | null

const MIN_REASON_LEN = 12

function shortId(value: string | null) {
  if (!value) return '—'
  return value.length <= 12 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`
}

export default function AdminReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([])
  const [messagingRows, setMessagingRows] = useState<MessagingReportRow[]>([])
  const [escalationRows, setEscalationRows] = useState<SupportEscalationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [nextStatusById, setNextStatusById] = useState<Record<string, ReportStatus>>({})
  const [reasonById, setReasonById] = useState<Record<string, string>>({})
  const [busyById, setBusyById] = useState<Record<string, boolean>>({})
  const [messagingStatusById, setMessagingStatusById] = useState<Record<string, MessagingReportStatus>>({})
  const [messagingReasonById, setMessagingReasonById] = useState<Record<string, string>>({})
  const [messagingNotesById, setMessagingNotesById] = useState<Record<string, string>>({})
  const [messagingBusyById, setMessagingBusyById] = useState<Record<string, boolean>>({})
  const [escalationStatusById, setEscalationStatusById] = useState<Record<string, SupportEscalationStatus>>({})
  const [escalationReasonById, setEscalationReasonById] = useState<Record<string, string>>({})
  const [escalationNotesById, setEscalationNotesById] = useState<Record<string, string>>({})
  const [escalationBusyById, setEscalationBusyById] = useState<Record<string, boolean>>({})
  const [inspectionTarget, setInspectionTarget] = useState<ConversationInspectionState>(null)
  const [inspectionMessages, setInspectionMessages] = useState<AdminConversationMessage[]>([])
  const [inspectionLoading, setInspectionLoading] = useState(false)
  const [inspectionError, setInspectionError] = useState<string | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({})

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
        const [generalData, messagingData, escalationData] = await Promise.all([
          fetchReports(50),
          fetchMessagingReports(100),
          fetchSupportEscalations(100),
        ])

        if (!isCancelled) {
          setRows(generalData as ReportRow[])
          setMessagingRows(messagingData as MessagingReportRow[])
          setEscalationRows(escalationData as SupportEscalationRow[])
        }
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
      const [generalData, messagingData, escalationData] = await Promise.all([
        fetchReports(50),
        fetchMessagingReports(100),
        fetchSupportEscalations(100),
      ])
      setRows(generalData as ReportRow[])
      setMessagingRows(messagingData as MessagingReportRow[])
      setEscalationRows(escalationData as SupportEscalationRow[])
    } catch (err: any) {
      console.error('Error reloading reports:', err)
      setErrorMessage(err?.message || 'Failed to load reports')
    }
  }

  const openConversationInspection = async (target: NonNullable<ConversationInspectionState>) => {
    setInspectionTarget(target)
    setHighlightedMessageId(target.kind === 'messaging-report' ? target.reportedMessageId : null)
    setInspectionLoading(true)
    setInspectionError(null)

    try {
      const data = await fetchAdminConversationMessages(target.conversationId, 100)
      setInspectionMessages((data as AdminConversationMessage[]).slice().reverse())
    } catch (err: any) {
      console.error('Error loading conversation inspection:', err)
      setInspectionError(err?.message || 'Failed to load conversation messages')
      setInspectionMessages([])
    } finally {
      setInspectionLoading(false)
    }
  }

  const scrollToMessage = (messageId: string | null) => {
    if (!messageId) {
      return
    }

    const node = messageRefs.current[messageId]
    if (!node) {
      return
    }

    setHighlightedMessageId(messageId)
    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  useEffect(() => {
    if (!inspectionTarget || inspectionLoading) {
      return
    }

    if (inspectionTarget.kind === 'messaging-report' && inspectionTarget.reportedMessageId) {
      const timeoutId = window.setTimeout(() => {
        scrollToMessage(inspectionTarget.reportedMessageId)
      }, 120)

      return () => window.clearTimeout(timeoutId)
    }
  }, [inspectionLoading, inspectionMessages, inspectionTarget])

  const copyInspectionEvidence = async () => {
    if (!inspectionTarget) {
      return
    }

    const evidence = buildInspectionEvidence(inspectionTarget, inspectionMessages)

    try {
      await navigator.clipboard.writeText(evidence)
      toast.success('Evidence copied to clipboard')
    } catch (error) {
      console.error('Failed to copy evidence:', error)
      toast.error('Could not copy evidence to clipboard')
    }
  }

  const applyInspectionModeration = async () => {
    if (!inspectionTarget) {
      return
    }

    if (inspectionTarget.kind === 'messaging-report') {
      const row = messagingRows.find((item) => item.report_id === inspectionTarget.reportId)
      if (!row) {
        toast.error('Messaging report is no longer available')
        return
      }

      await doApplyMessagingStatus(row)
      return
    }

    const row = escalationRows.find((item) => item.conversation_id === inspectionTarget.conversationId)
    if (!row) {
      toast.error('Support escalation is no longer available')
      return
    }

    await applyEscalationStatus(row)
  }

  const statusOptions = useMemo(() => {
    return [
      { value: 'open', label: 'open' },
      { value: 'in_review', label: 'in_review' },
      { value: 'resolved', label: 'resolved' },
      { value: 'dismissed', label: 'dismissed' },
    ] as const
  }, [])

  const messagingStatusOptions = useMemo(() => {
    return [
      { value: 'open', label: 'open' },
      { value: 'reviewing', label: 'reviewing' },
      { value: 'resolved', label: 'resolved' },
      { value: 'dismissed', label: 'dismissed' },
    ] as const
  }, [])

  const escalationStatusOptions = useMemo(() => {
    return [
      { value: 'pending', label: 'pending' },
      { value: 'in_review', label: 'in_review' },
      { value: 'resolved', label: 'resolved' },
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

  const applyMessagingStatus = async (row: MessagingReportRow) => {
    const nextStatus = (messagingStatusById[row.report_id] || row.status) as MessagingReportStatus

    if (nextStatus === 'dismissed') {
      setConfirm({
        open: true,
        title: 'Confirm dismiss',
        description: 'This will dismiss the messaging report. This action is logged.',
        onConfirm: () => void doApplyMessagingStatus(row),
      })
      return
    }

    await doApplyMessagingStatus(row)
  }

  const doApplyMessagingStatus = async (row: MessagingReportRow) => {
    const nextStatus = (messagingStatusById[row.report_id] || row.status) as MessagingReportStatus
    const reason = (messagingReasonById[row.report_id] || '').trim()
    const note = (messagingNotesById[row.report_id] || '').trim()

    if (!reason) {
      toast.error('Reason is required', { id: `reason-message-report-${row.report_id}` })
      return
    }

    if (reason.length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`, {
        id: `reason-message-report-${row.report_id}`,
      })
      return
    }

    setMessagingBusyById((prev) => ({ ...prev, [row.report_id]: true }))
    try {
      const { error } = await rpc('admin_set_messaging_report_status', {
        p_report_id: row.report_id,
        p_status: nextStatus,
        p_reason: reason,
        p_internal_note: note || null,
      })

      if (error) throw error

      toast.success('Messaging report updated')
      window.dispatchEvent(new CustomEvent('tripavail:admin_action'))
      await reloadReports()
    } catch (err: any) {
      console.error('Error updating messaging report:', err)
      toast.error(err?.message || 'Failed to update messaging report')
    } finally {
      setMessagingBusyById((prev) => ({ ...prev, [row.report_id]: false }))
    }
  }

  const applyEscalationStatus = async (row: SupportEscalationRow) => {
    const nextStatus = (escalationStatusById[row.conversation_id] || row.support_review_status || 'pending') as SupportEscalationStatus
    const reason = (escalationReasonById[row.conversation_id] || '').trim()
    const note = (escalationNotesById[row.conversation_id] || '').trim()

    if (!reason) {
      toast.error('Reason is required', { id: `reason-escalation-${row.conversation_id}` })
      return
    }

    if (reason.length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`, {
        id: `reason-escalation-${row.conversation_id}`,
      })
      return
    }

    setEscalationBusyById((prev) => ({ ...prev, [row.conversation_id]: true }))
    try {
      const { error } = await rpc('admin_set_support_escalation_status', {
        p_conversation_id: row.conversation_id,
        p_status: nextStatus,
        p_reason: reason,
        p_internal_note: note || null,
      })

      if (error) throw error

      toast.success('Escalation updated')
      window.dispatchEvent(new CustomEvent('tripavail:admin_action'))
      await reloadReports()
    } catch (err: any) {
      console.error('Error updating escalation:', err)
      toast.error(err?.message || 'Failed to update escalation')
    } finally {
      setEscalationBusyById((prev) => ({ ...prev, [row.conversation_id]: false }))
    }
  }

  const generalContent = useMemo(() => {
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

  const messagingContent = useMemo(() => {
    if (loading) {
      return <SectionSkeleton count={5} />
    }

    if (errorMessage) {
      return <ErrorCard message={errorMessage} />
    }

    if (!messagingRows.length) {
      return <EmptyCard title="No messaging reports" body="Booking message reports will appear here once travelers or partners escalate a conversation for moderation." />
    }

    return (
      <div className="space-y-3">
        {messagingRows.map((row) => (
          <Card key={row.report_id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg truncate">{row.booking_label}</CardTitle>
                  <div className="text-sm text-muted-foreground truncate">
                    {row.traveler_name} ↔ {row.partner_name} • Reporter: {row.reporter_name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{row.status}</Badge>
                  {row.support_escalated_at ? <Badge variant="outline">support escalated</Badge> : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Report reason: <span className="text-foreground">{row.report_reason}</span>
              </div>
              {row.details ? (
                <div className="text-sm text-muted-foreground">
                  Reporter details: <span className="text-foreground">{row.details}</span>
                </div>
              ) : null}
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                Latest thread preview: <span className="text-foreground">{row.last_message_preview || 'No preview available'}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Filed {relativeTime(row.created_at)} • Conversation {shortId(row.conversation_id)}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void openConversationInspection({
                      conversationId: row.conversation_id,
                      bookingLabel: row.booking_label,
                      subject: row.subject,
                      travelerName: row.traveler_name,
                      partnerName: row.partner_name,
                      sourceLabel: 'Messaging report',
                      latestPreview: row.last_message_preview,
                      reportId: row.report_id,
                      reportedMessageId: row.message_id,
                      kind: 'messaging-report',
                    })
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Review thread
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_160px]">
                <Select
                  value={messagingStatusById[row.report_id] || row.status}
                  onValueChange={(value) =>
                    setMessagingStatusById((prev) => ({
                      ...prev,
                      [row.report_id]: value as MessagingReportStatus,
                    }))
                  }
                  disabled={!!messagingBusyById[row.report_id]}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {messagingStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Resolution reason (required)"
                  value={messagingReasonById[row.report_id] || ''}
                  onChange={(event) =>
                    setMessagingReasonById((prev) => ({
                      ...prev,
                      [row.report_id]: event.target.value,
                    }))
                  }
                  disabled={!!messagingBusyById[row.report_id]}
                />

                <Button onClick={() => applyMessagingStatus(row)} disabled={!!messagingBusyById[row.report_id]}>
                  {messagingBusyById[row.report_id] ? 'Applying…' : 'Apply'}
                </Button>
              </div>

              <Textarea
                placeholder="Internal moderation notes"
                value={messagingNotesById[row.report_id] || row.review_notes || ''}
                onChange={(event) =>
                  setMessagingNotesById((prev) => ({
                    ...prev,
                    [row.report_id]: event.target.value,
                  }))
                }
                disabled={!!messagingBusyById[row.report_id]}
                className="min-h-[96px]"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }, [applyMessagingStatus, errorMessage, loading, messagingBusyById, messagingNotesById, messagingReasonById, messagingRows, messagingStatusById, messagingStatusOptions])

  const escalationContent = useMemo(() => {
    if (loading) {
      return <SectionSkeleton count={5} />
    }

    if (errorMessage) {
      return <ErrorCard message={errorMessage} />
    }

    if (!escalationRows.length) {
      return <EmptyCard title="No support escalations" body="Escalated booking conversations will appear here once support is invited into a thread." />
    }

    return (
      <div className="space-y-3">
        {escalationRows.map((row) => (
          <Card key={row.conversation_id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg truncate">{row.booking_label}</CardTitle>
                  <div className="text-sm text-muted-foreground truncate">
                    {row.traveler_name} ↔ {row.partner_name} • Escalated {relativeTime(row.support_escalated_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{row.support_review_status}</Badge>
                  <Badge variant="outline">{row.conversation_status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Subject: <span className="text-foreground">{row.subject || 'Booking conversation'}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                Latest thread preview: <span className="text-foreground">{row.last_message_preview || 'No preview available'}</span>
              </div>
              {row.support_review_reason ? (
                <div className="text-sm text-muted-foreground">
                  Latest review reason: <span className="text-foreground">{row.support_review_reason}</span>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void openConversationInspection({
                      conversationId: row.conversation_id,
                      bookingLabel: row.booking_label,
                      subject: row.subject,
                      travelerName: row.traveler_name,
                      partnerName: row.partner_name,
                      sourceLabel: 'Support escalation',
                      latestPreview: row.last_message_preview,
                      kind: 'support-escalation',
                    })
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Review thread
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_160px]">
                <Select
                  value={escalationStatusById[row.conversation_id] || row.support_review_status || 'pending'}
                  onValueChange={(value) =>
                    setEscalationStatusById((prev) => ({
                      ...prev,
                      [row.conversation_id]: value as SupportEscalationStatus,
                    }))
                  }
                  disabled={!!escalationBusyById[row.conversation_id]}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {escalationStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Review reason (required)"
                  value={escalationReasonById[row.conversation_id] || row.support_review_reason || ''}
                  onChange={(event) =>
                    setEscalationReasonById((prev) => ({
                      ...prev,
                      [row.conversation_id]: event.target.value,
                    }))
                  }
                  disabled={!!escalationBusyById[row.conversation_id]}
                />

                <Button onClick={() => applyEscalationStatus(row)} disabled={!!escalationBusyById[row.conversation_id]}>
                  {escalationBusyById[row.conversation_id] ? 'Applying…' : 'Apply'}
                </Button>
              </div>

              <Textarea
                placeholder="Internal support note"
                value={escalationNotesById[row.conversation_id] || row.support_review_notes || ''}
                onChange={(event) =>
                  setEscalationNotesById((prev) => ({
                    ...prev,
                    [row.conversation_id]: event.target.value,
                  }))
                }
                disabled={!!escalationBusyById[row.conversation_id]}
                className="min-h-[96px]"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }, [applyEscalationStatus, errorMessage, escalationBusyById, escalationNotesById, escalationReasonById, escalationRows, escalationStatusById, escalationStatusOptions, loading])

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            General moderation reports, booking-message abuse reviews, and support escalation triage in one queue.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void reloadReports()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh queues
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <SummaryCard icon={AlertTriangle} label="General reports" value={String(rows.length)} />
        <SummaryCard icon={MessageSquare} label="Messaging reports" value={String(messagingRows.length)} />
        <SummaryCard icon={Siren} label="Escalations" value={String(escalationRows.length)} />
      </div>

      <Tabs defaultValue="general" className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General Reports</TabsTrigger>
          <TabsTrigger value="messaging">Messaging Reports</TabsTrigger>
          <TabsTrigger value="escalations">Support Escalations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">{generalContent}</TabsContent>
        <TabsContent value="messaging">{messagingContent}</TabsContent>
        <TabsContent value="escalations">{escalationContent}</TabsContent>
      </Tabs>

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

      <Sheet open={Boolean(inspectionTarget)} onOpenChange={(open) => {
        if (!open) {
          setInspectionTarget(null)
          setInspectionMessages([])
          setInspectionError(null)
        }
      }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{inspectionTarget?.bookingLabel || 'Conversation review'}</SheetTitle>
            <SheetDescription>
              {inspectionTarget
                ? `${inspectionTarget.sourceLabel} · ${inspectionTarget.travelerName} ↔ ${inspectionTarget.partnerName}`
                : 'Admin conversation review'}
            </SheetDescription>
          </SheetHeader>

          {inspectionTarget ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{inspectionTarget.sourceLabel}</Badge>
                    {inspectionTarget.subject ? <Badge variant="outline">{inspectionTarget.subject}</Badge> : null}
                    {inspectionTarget.kind === 'messaging-report' && inspectionTarget.reportedMessageId ? (
                      <Badge variant="outline">reported message attached</Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inspectionTarget.kind === 'messaging-report' && inspectionTarget.reportedMessageId ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => scrollToMessage(inspectionTarget.reportedMessageId)}
                      >
                        <Target className="mr-2 h-4 w-4" />
                        Jump to reported message
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" onClick={() => void copyInspectionEvidence()}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy evidence
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Latest preview: <span className="text-foreground">{inspectionTarget.latestPreview || 'No preview available'}</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Conversation ID: {shortId(inspectionTarget.conversationId)}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Moderation actions</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Resolve or update this case from the thread view without returning to the queue card.
                    </p>
                  </div>
                  <Button type="button" onClick={() => void applyInspectionModeration()}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Apply from drawer
                  </Button>
                </div>

                {inspectionTarget.kind === 'messaging-report' ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <Select
                      value={messagingStatusById[inspectionTarget.reportId] || messagingRows.find((item) => item.report_id === inspectionTarget.reportId)?.status || 'open'}
                      onValueChange={(value) =>
                        setMessagingStatusById((prev) => ({
                          ...prev,
                          [inspectionTarget.reportId]: value as MessagingReportStatus,
                        }))
                      }
                      disabled={!!messagingBusyById[inspectionTarget.reportId]}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {messagingStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Resolution reason (required)"
                      value={messagingReasonById[inspectionTarget.reportId] || ''}
                      onChange={(event) =>
                        setMessagingReasonById((prev) => ({
                          ...prev,
                          [inspectionTarget.reportId]: event.target.value,
                        }))
                      }
                      disabled={!!messagingBusyById[inspectionTarget.reportId]}
                    />
                    <Textarea
                      placeholder="Internal moderation notes"
                      value={messagingNotesById[inspectionTarget.reportId] || ''}
                      onChange={(event) =>
                        setMessagingNotesById((prev) => ({
                          ...prev,
                          [inspectionTarget.reportId]: event.target.value,
                        }))
                      }
                      disabled={!!messagingBusyById[inspectionTarget.reportId]}
                      className="lg:col-span-2 min-h-[96px]"
                    />
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <Select
                      value={escalationStatusById[inspectionTarget.conversationId] || escalationRows.find((item) => item.conversation_id === inspectionTarget.conversationId)?.support_review_status || 'pending'}
                      onValueChange={(value) =>
                        setEscalationStatusById((prev) => ({
                          ...prev,
                          [inspectionTarget.conversationId]: value as SupportEscalationStatus,
                        }))
                      }
                      disabled={!!escalationBusyById[inspectionTarget.conversationId]}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {escalationStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Review reason (required)"
                      value={escalationReasonById[inspectionTarget.conversationId] || ''}
                      onChange={(event) =>
                        setEscalationReasonById((prev) => ({
                          ...prev,
                          [inspectionTarget.conversationId]: event.target.value,
                        }))
                      }
                      disabled={!!escalationBusyById[inspectionTarget.conversationId]}
                    />
                    <Textarea
                      placeholder="Internal support note"
                      value={escalationNotesById[inspectionTarget.conversationId] || ''}
                      onChange={(event) =>
                        setEscalationNotesById((prev) => ({
                          ...prev,
                          [inspectionTarget.conversationId]: event.target.value,
                        }))
                      }
                      disabled={!!escalationBusyById[inspectionTarget.conversationId]}
                      className="lg:col-span-2 min-h-[96px]"
                    />
                  </div>
                )}
              </div>

              {inspectionLoading ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background/70">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading thread messages</p>
                </div>
              ) : inspectionError ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {inspectionError}
                </div>
              ) : inspectionMessages.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                  No messages were found for this conversation.
                </div>
              ) : (
                <div className="space-y-4">
                  {inspectionMessages.map((message) => (
                    <div
                      key={message.message_id}
                      ref={(node) => {
                        messageRefs.current[message.message_id] = node
                      }}
                      className={`rounded-2xl border bg-background/80 p-4 transition-all ${
                        highlightedMessageId === message.message_id
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{message.sender_name}</Badge>
                          <Badge variant="outline" className="capitalize">
                            {message.sender_role.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {message.message_kind.replace('_', ' ')}
                          </Badge>
                          {inspectionTarget.kind === 'messaging-report' && inspectionTarget.reportedMessageId === message.message_id ? (
                            <Badge className="bg-primary text-primary-foreground">Reported</Badge>
                          ) : null}
                        </div>
                        <span>{new Date(message.created_at).toLocaleString()}</span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                        {message.body || `[${message.message_kind.replace('_', ' ')}]`}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {message.edited_at ? <span>Edited {relativeTime(message.edited_at)}</span> : null}
                        {message.unsent_at ? <span>Unsent {relativeTime(message.unsent_at)}</span> : null}
                        {message.reactions.length > 0 ? <span>{message.reactions.length} reactions</span> : null}
                        {message.read_by.length > 0 ? <span>{message.read_by.length} read receipts</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof AlertTriangle; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-black text-foreground">{value}</p>
          </div>
        </div>
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

function SectionSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Couldn’t load moderation queues</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function buildInspectionEvidence(
  target: NonNullable<ConversationInspectionState>,
  messages: AdminConversationMessage[],
) {
  const header = [
    `Source: ${target.sourceLabel}`,
    `Conversation: ${target.bookingLabel}`,
    `Subject: ${target.subject || 'Booking conversation'}`,
    `Participants: ${target.travelerName} <> ${target.partnerName}`,
    `Conversation ID: ${target.conversationId}`,
  ]

  if (target.kind === 'messaging-report') {
    header.push(`Report ID: ${target.reportId}`)
    header.push(`Reported Message ID: ${target.reportedMessageId || 'none'}`)
  }

  const transcript = messages.map((message) => {
    const annotations = [
      message.edited_at ? `edited ${new Date(message.edited_at).toISOString()}` : null,
      message.unsent_at ? `unsent ${new Date(message.unsent_at).toISOString()}` : null,
      message.reactions.length > 0 ? `${message.reactions.length} reactions` : null,
      message.read_by.length > 0 ? `${message.read_by.length} reads` : null,
    ]
      .filter(Boolean)
      .join(', ')

    return [
      `[${new Date(message.created_at).toISOString()}] ${message.sender_name} (${message.sender_role})`,
      `Kind: ${message.message_kind}`,
      `Message ID: ${message.message_id}`,
      message.body || `[${message.message_kind.replace('_', ' ')}]`,
      annotations ? `Meta: ${annotations}` : null,
    ]
      .filter(Boolean)
      .join('\n')
  })

  return [...header, '', 'Transcript:', ...transcript].join('\n\n')
}

function relativeTime(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}
