import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Clock, CheckCircle, XCircle, MessageSquare, Users, ShieldAlert, RefreshCw } from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  useVerificationQueue,
  useApprovePartner,
  useRejectPartner,
  useRequestPartnerInfo,
  type VerificationRequest,
} from '@/queries/adminQueries'
import { fetchHotelManagers, fetchTourOperators, fetchProfileById } from '@/features/admin/services/adminService'
import { supabase } from '@/lib/supabase'
import { useEffect, useMemo } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileIdentity = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

type HotelManagerRow = {
  user_id: string
  business_name: string | null
  account_status: string | null
  created_at: string
}

type TourOperatorRow = {
  user_id: string
  company_name: string | null
  account_status: string | null
  created_at: string
}

type AccountStatus = 'active' | 'suspended' | 'deleted'
const MIN_REASON_LEN = 12

// ─── Utilities ───────────────────────────────────────────────────────────────

function daysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function urgencyColor(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days >= 3) return 'text-red-500'
  if (days >= 1) return 'text-amber-500'
  return 'text-muted-foreground'
}

function statusBadge(status: VerificationRequest['status']) {
  const map: Record<string, { label: string; className: string }> = {
    pending:        { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    under_review:   { label: 'Under Review',   className: 'bg-blue-100 text-blue-800 border-blue-200' },
    approved:       { label: 'Approved',        className: 'bg-green-100 text-green-800 border-green-200' },
    rejected:       { label: 'Rejected',        className: 'bg-red-100 text-red-800 border-red-200' },
    info_requested: { label: 'Info Requested', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  }
  const s = map[status] ?? { label: status, className: '' }
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>
}

// ─── Pending Review Card ─────────────────────────────────────────────────────

function PendingReviewCard({ req }: { req: VerificationRequest }) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')

  const approve = useApprovePartner()
  const reject = useRejectPartner()
  const requestInfo = useRequestPartnerInfo()

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({ userId: req.user_id, partnerType: req.partner_type, requestId: req.id })
      toast.success('Partner approved — they have been notified!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve')
    }
  }

  const handleReject = async () => {
    if (reason.trim().length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`)
      return
    }
    try {
      await reject.mutateAsync({ userId: req.user_id, partnerType: req.partner_type, requestId: req.id, reason: reason.trim() })
      toast.success('Application rejected — partner has been notified with your reason')
      setShowRejectDialog(false)
      setReason('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject')
    }
  }

  const handleRequestInfo = async () => {
    if (message.trim().length < MIN_REASON_LEN) {
      toast.error(`Message must be at least ${MIN_REASON_LEN} characters`)
      return
    }
    try {
      await requestInfo.mutateAsync({ userId: req.user_id, partnerType: req.partner_type, requestId: req.id, message: message.trim() })
      toast.success('Info request sent — partner has been notified')
      setShowInfoDialog(false)
      setMessage('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send request')
    }
  }

  const submissionData = req.submission_data as Record<string, any>
  const partnerLabel = req.partner_type === 'hotel_manager' ? 'Hotel Manager' : 'Tour Operator'

  return (
    <>
      <Card className="border-l-4 border-l-amber-400">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">
                  {submissionData?.business_name || submissionData?.company_name || submissionData?.email || req.user_id}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {partnerLabel}
                </Badge>
                {req.version > 1 && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    Re-submission v{req.version}
                  </Badge>
                )}
              </div>
              {submissionData?.email && (
                <p className="text-sm text-muted-foreground mt-0.5">{submissionData.email}</p>
              )}
              {submissionData?.registration_number && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reg: {submissionData.registration_number}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {statusBadge(req.status)}
              <span className={`text-xs font-medium ${urgencyColor(req.submitted_at)}`}>
                {daysAgo(req.submitted_at)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Submitted documents preview */}
          {submissionData?.verification_urls && Object.keys(submissionData.verification_urls).length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submitted Documents</p>
              {Object.entries(submissionData.verification_urls as Record<string, string>).map(([docType, url]) => (
                <a
                  key={docType}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  📄 {docType.replace(/_/g, ' ')}
                </a>
              ))}
            </div>
          )}

          {/* Business details */}
          {submissionData?.business_address && (
            <p className="text-xs text-muted-foreground mb-3">📍 {submissionData.business_address}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              onClick={handleApprove}
              disabled={approve.isPending}
            >
              <CheckCircle className="h-4 w-4" />
              {approve.isPending ? 'Approving…' : 'Approve'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-1.5"
              onClick={() => setShowInfoDialog(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Request Info
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            All actions are logged to the audit trail and the partner is notified instantly.
          </p>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a clear reason. The partner will receive this exact message and can re-submit after correcting the issue.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Business registration document was unclear. Please upload a high-resolution scan."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">{reason.length} / {MIN_REASON_LEN} min characters</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={reject.isPending}>
              {reject.isPending ? 'Rejecting…' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Additional Information</DialogTitle>
            <DialogDescription>
              Ask the partner for specific information. They will see your message and can re-submit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Please provide your tax registration certificate number."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInfoDialog(false)}>Cancel</Button>
            <Button onClick={handleRequestInfo} disabled={requestInfo.isPending}>
              {requestInfo.isPending ? 'Sending…' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── All Partners Tab ─────────────────────────────────────────────────────────

function AllPartnersTab() {
  const [hotelManagers, setHotelManagers] = useState<HotelManagerRow[]>([])
  const [tourOperators, setTourOperators] = useState<TourOperatorRow[]>([])
  const [usersById, setUsersById] = useState<Record<string, ProfileIdentity>>({})
  const [loading, setLoading] = useState(true)
  const [nextStatusByKey, setNextStatusByKey] = useState<Record<string, AccountStatus>>({})
  const [reasonByKey, setReasonByKey] = useState<Record<string, string>>({})
  const [busyByKey, setBusyByKey] = useState<Record<string, boolean>>({})
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; description: string; onConfirm: null | (() => void) }>({
    open: false, title: '', description: '', onConfirm: null,
  })

  const rpc = (supabase as any).rpc.bind(supabase)

  const load = async () => {
    setLoading(true)
    try {
      const [hmData, opData] = await Promise.all([fetchHotelManagers(50), fetchTourOperators(50)])
      const hmRows = hmData as HotelManagerRow[]
      const opRows = opData as TourOperatorRow[]
      const ids = Array.from(new Set([...hmRows.map(r => r.user_id), ...opRows.map(r => r.user_id)].filter(Boolean)))
      const users = ids.length ? await Promise.all(ids.map(id => fetchProfileById(id))) : []
      setHotelManagers(hmRows)
      setTourOperators(opRows)
      setUsersById(Object.fromEntries(users.map(u => [u.id, u])))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'deleted', label: 'Soft-Delete' },
  ] as const

  const applyStatus = async (key: string, userId: string, rpcName: string, row: any) => {
    const nextStatus = (nextStatusByKey[key] || 'active') as AccountStatus
    const reason = (reasonByKey[key] || '').trim()
    if (!reason || reason.length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`)
      return
    }
    if (nextStatus === 'deleted') {
      setConfirm({
        open: true,
        title: 'Soft-delete partner?',
        description: 'This is a soft-delete. The profile remains in the database but is disabled.',
        onConfirm: () => { setConfirm(p => ({ ...p, open: false })); doApply(key, userId, rpcName, nextStatus, reason) },
      })
      return
    }
    await doApply(key, userId, rpcName, nextStatus, reason)
  }

  const doApply = async (key: string, userId: string, rpcName: string, status: string, reason: string) => {
    setBusyByKey(p => ({ ...p, [key]: true }))
    try {
      const { error } = await rpc(rpcName, { p_user_id: userId, p_status: status, p_reason: reason })
      if (error) throw error
      toast.success('Status updated — see Audit Logs')
      await load()
      setReasonByKey(p => ({ ...p, [key]: '' }))
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update')
    } finally {
      setBusyByKey(p => ({ ...p, [key]: false }))
    }
  }

  function PartnerCard({ row, keyPrefix, rpcName, label }: { row: any; keyPrefix: string; rpcName: string; label: string }) {
    const u = usersById[row.user_id]
    const key = `${keyPrefix}:${row.user_id}`
    const name = row.business_name || row.company_name || [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.email || row.user_id
    return (
      <Card key={row.user_id}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{name}</CardTitle>
              {u?.email && <div className="text-sm text-muted-foreground truncate">{u.email}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{row.account_status || 'active'}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3">
            Joined: {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              value={nextStatusByKey[key] || (row.account_status || 'active')}
              onValueChange={v => setNextStatusByKey(p => ({ ...p, [key]: v as AccountStatus }))}
              disabled={!!busyByKey[key]}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="Reason (required, 12+ chars)"
              value={reasonByKey[key] || ''}
              onChange={e => setReasonByKey(p => ({ ...p, [key]: e.target.value }))}
              disabled={!!busyByKey[key]}
            />
            <Button onClick={() => applyStatus(key, row.user_id, rpcName, row)} disabled={!!busyByKey[key]}>
              {busyByKey[key] ? 'Applying…' : 'Apply'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
    </div>
  )

  return (
    <>
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Hotel Managers</h2>
          {!hotelManagers.length
            ? <Card><CardContent className="p-6 text-sm text-muted-foreground">No hotel managers found.</CardContent></Card>
            : hotelManagers.map(p => <PartnerCard key={p.user_id} row={p} keyPrefix="hm" rpcName="admin_set_hotel_manager_status" label="Hotel Manager" />)
          }
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tour Operators</h2>
          {!tourOperators.length
            ? <Card><CardContent className="p-6 text-sm text-muted-foreground">No tour operators found.</CardContent></Card>
            : tourOperators.map(p => <PartnerCard key={p.user_id} row={p} keyPrefix="op" rpcName="admin_set_tour_operator_status" label="Tour Operator" />)
          }
        </section>
      </div>

      <Dialog open={confirm.open} onOpenChange={open => setConfirm(p => ({ ...p, open, onConfirm: open ? p.onConfirm : null }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm.title}</DialogTitle>
            <DialogDescription>{confirm.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(p => ({ ...p, open: false }))}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirm.onConfirm?.()}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPartnersPage() {
  const { data: pendingQueue = [], isLoading: queueLoading, refetch } = useVerificationQueue('pending')
  const { data: allQueue = [] } = useVerificationQueue()

  const approvedCount = allQueue.filter(r => r.status === 'approved').length
  const pendingCount = pendingQueue.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage hotel managers and tour operator verifications.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Pending Review</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{approvedCount}</p><p className="text-xs text-muted-foreground">Approved</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{allQueue.length}</p><p className="text-xs text-muted-foreground">Total Applications</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            Pending Review
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All Partners
          </TabsTrigger>
        </TabsList>

        {/* ── Pending Review Tab ── */}
        <TabsContent value="pending" className="space-y-4">
          {queueLoading ? (
            <div className="space-y-3">
              {[1,2].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>)}
            </div>
          ) : pendingQueue.length === 0 ? (
            <Card>
              <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-3">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-lg font-semibold text-foreground">All clear!</p>
                <p className="text-sm text-muted-foreground">No pending applications to review. Check back later.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Reviewing oldest applications first. All decisions notify the partner instantly.
              </p>
              {pendingQueue.map(req => <PendingReviewCard key={req.id} req={req} />)}
            </>
          )}
        </TabsContent>

        {/* ── All Partners Tab ── */}
        <TabsContent value="all">
          <AllPartnersTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
