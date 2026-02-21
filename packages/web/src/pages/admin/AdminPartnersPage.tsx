import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchHotelManagers,
  fetchProfilesByIds,
  fetchTourOperators,
} from '@/features/admin/services/adminService'
import { supabase } from '@/lib/supabase'
import {
  useApprovePartner,
  useRejectPartner,
  useRequestPartnerInfo,
  useVerificationQueue,
  type VerificationRequest,
} from '@/queries/adminQueries'

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileIdentity = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}
type PartnerRow = {
  user_id: string
  business_name?: string | null
  company_name?: string | null
  account_status: string | null
  created_at: string
  // enriched after fetch
  verification_status?: string | null
}

const MIN_REASON_LEN = 12

// ─── Governance Matrix  ───────────────────────────────────────────────────────
//
//   verification_status | account_status | Can operate?
//   --------------------|----------------|-------------
//   approved            | active         | ✅ YES
//   approved            | suspended      | ❌ No (suspended)
//   pending/rejected    | *              | ❌ No (not verified)
//
type OperativeStatus = 'operative' | 'suspended' | 'not_verified' | 'unknown'

function getOperativeStatus(
  verificationStatus: string | null | undefined,
  accountStatus: string | null | undefined,
): OperativeStatus {
  if (verificationStatus !== 'approved') return 'not_verified'
  if (accountStatus === 'suspended' || accountStatus === 'deleted') return 'suspended'
  if (accountStatus === 'active') return 'operative'
  return 'unknown'
}

function OperativeBadge({
  verification,
  account,
}: {
  verification: string | null | undefined
  account: string | null | undefined
}) {
  const status = getOperativeStatus(verification, account)
  const cfg = {
    operative: { label: '✅ Operative', className: 'bg-green-100 text-green-800 border-green-200' },
    suspended: {
      label: '⚠️ Suspended',
      className: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    not_verified: {
      label: '🔒 Not Verified',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    unknown: { label: '❓ Unknown', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  }[status]
  return (
    <Badge variant="outline" className={`text-xs ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

// ─── Queue utilities ──────────────────────────────────────────────────────────

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
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
    pending: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    under_review: { label: 'Under Review', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
    info_requested: {
      label: 'Info Requested',
      className: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  }
  const s = map[status] ?? { label: status, className: '' }
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  )
}

// ─── Pending Review Card ──────────────────────────────────────────────────────

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
      await approve.mutateAsync({
        userId: req.user_id,
        partnerType: req.partner_type,
        requestId: req.id,
      })
      toast.success('Partner approved — notified instantly')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve')
    }
  }

  const handleReject = async () => {
    if (reason.trim().length < MIN_REASON_LEN) {
      toast.error(`Reason must be ≥ ${MIN_REASON_LEN} chars`)
      return
    }
    try {
      await reject.mutateAsync({
        userId: req.user_id,
        partnerType: req.partner_type,
        requestId: req.id,
        reason: reason.trim(),
      })
      toast.success('Rejected — partner notified with your reason')
      setShowRejectDialog(false)
      setReason('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject')
    }
  }

  const handleRequestInfo = async () => {
    if (message.trim().length < MIN_REASON_LEN) {
      toast.error(`Message must be ≥ ${MIN_REASON_LEN} chars`)
      return
    }
    try {
      await requestInfo.mutateAsync({
        userId: req.user_id,
        partnerType: req.partner_type,
        requestId: req.id,
        message: message.trim(),
      })
      toast.success('Info request sent')
      setShowInfoDialog(false)
      setMessage('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send')
    }
  }

  const sd = req.submission_data as Record<string, any>
  const partnerLabel = req.partner_type === 'hotel_manager' ? 'Hotel Manager' : 'Tour Operator'

  return (
    <>
      <Card className="border-l-4 border-l-amber-400">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">
                  {sd?.business_name || sd?.company_name || sd?.email || req.user_id}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {partnerLabel}
                </Badge>
                {req.version > 1 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                  >
                    Re-submission v{req.version}
                  </Badge>
                )}
              </div>
              {sd?.email && <p className="text-sm text-muted-foreground mt-0.5">{sd.email}</p>}
              {sd?.registration_number && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reg: {sd.registration_number}
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
          {sd?.verification_urls && Object.keys(sd.verification_urls).length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Documents
              </p>
              {Object.entries(sd.verification_urls as Record<string, string>).map(
                ([docType, url]) => (
                  <a
                    key={docType}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    📄 {docType.replace(/_/g, ' ')}
                  </a>
                ),
              )}
            </div>
          )}
          {sd?.business_address && (
            <p className="text-xs text-muted-foreground mb-3">📍 {sd.business_address}</p>
          )}

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
            All actions are logged to the audit trail and partner notified instantly.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a clear reason. The partner will receive this exact message and can re-submit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Business registration document was unclear. Please upload a high-resolution scan."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {reason.length} / {MIN_REASON_LEN} min chars
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={reject.isPending}>
              {reject.isPending ? 'Rejecting…' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Additional Information</DialogTitle>
            <DialogDescription>
              Ask the partner for something specific. They will see your message and can re-submit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Please provide your tax registration certificate number."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInfoDialog(false)}>
              Cancel
            </Button>
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

type StatusAction = 'active' | 'suspended' | 'deleted'
const STATUS_OPTIONS = [
  { value: 'active', label: '✅ Active', icon: ShieldCheck },
  { value: 'suspended', label: '⚠️ Suspend', icon: ShieldOff },
  { value: 'deleted', label: '🗑️ Soft-Delete', icon: Trash2 },
] as const

function AllPartnersTab() {
  const [hotelManagers, setHotelManagers] = useState<PartnerRow[]>([])
  const [tourOperators, setTourOperators] = useState<PartnerRow[]>([])
  const [usersById, setUsersById] = useState<Record<string, ProfileIdentity>>({})
  const [verificationByUserId, setVerificationByUserId] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [nextStatus, setNextStatus] = useState<Record<string, StatusAction>>({})
  const [reason, setReason] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [confirmDel, setConfirmDel] = useState<{ key: string; fn: () => void } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [hmData, opData] = await Promise.all([fetchHotelManagers(100), fetchTourOperators(100)])
      const hmRows = hmData as PartnerRow[]
      const opRows = opData as PartnerRow[]

      const ids = Array.from(new Set([...hmRows, ...opRows].map((r) => r.user_id)))
      const profiles = ids.length ? await fetchProfilesByIds(ids) : []
      setUsersById(Object.fromEntries(profiles.map((p: any) => [p.id, p])))

      // Fetch verification statuses for all these users
      if (ids.length) {
        const { data: roles } = await (supabase as any)
          .from('user_roles')
          .select('user_id, role_type, verification_status')
          .in('user_id', ids)

        const vsMap: Record<string, string> = {}
        if (roles) {
          for (const r of roles) {
            // Use the verification status of the partner role for this user
            if (r.role_type === 'hotel_manager' || r.role_type === 'tour_operator') {
              vsMap[`${r.user_id}:${r.role_type}`] = r.verification_status
            }
          }
        }
        setVerificationByUserId(vsMap)
      }

      setHotelManagers(hmRows)
      setTourOperators(opRows)
    } catch (err: any) {
      console.error('[AdminPartnersPage] load error:', err)
      toast.error('Failed to load partners: ' + (err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const applyStatus = async (key: string, userId: string, rpcName: string, partnerType: string) => {
    const status = nextStatus[key] || 'active'
    const r = (reason[key] || '').trim()
    if (r.length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`)
      return
    }
    if (status === 'deleted') {
      setConfirmDel({
        key,
        fn: async () => {
          setConfirmDel(null)
          await doApply(key, userId, rpcName, status, r)
        },
      })
      return
    }
    await doApply(key, userId, rpcName, status, r)
  }

  const doApply = async (
    key: string,
    userId: string,
    rpcName: string,
    status: string,
    r: string,
  ) => {
    setBusy((p) => ({ ...p, [key]: true }))
    try {
      const { error } = await (supabase as any).rpc(rpcName, {
        p_user_id: userId,
        p_status: status,
        p_reason: r,
      })
      if (error) throw error
      toast.success(`Status changed to "${status}" — partner notified`)
      setReason((p) => ({ ...p, [key]: '' }))
      await load()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status')
    } finally {
      setBusy((p) => ({ ...p, [key]: false }))
    }
  }

  function PartnerCard({
    row,
    keyPrefix,
    rpcName,
    roleType,
  }: {
    row: PartnerRow
    keyPrefix: string
    rpcName: string
    roleType: string
  }) {
    const u = usersById[row.user_id]
    const key = `${keyPrefix}:${row.user_id}`
    const verificationStatus = verificationByUserId[`${row.user_id}:${roleType}`]
    const name =
      row.business_name ||
      row.company_name ||
      [u?.first_name, u?.last_name].filter(Boolean).join(' ') ||
      u?.email ||
      row.user_id

    const isBusy = !!busy[key]
    const currentStatus = (row.account_status || 'active') as StatusAction
    const targetStatus = nextStatus[key] || currentStatus

    return (
      <Card
        className={`transition-all ${currentStatus === 'suspended' ? 'border-orange-200 bg-orange-50/30 dark:bg-orange-950/10' : currentStatus === 'deleted' ? 'opacity-60 border-dashed' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{name}</CardTitle>
              {u?.email && <div className="text-sm text-muted-foreground truncate">{u.email}</div>}
              <div className="text-xs text-muted-foreground mt-0.5">
                Joined {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {/* Governance matrix badge */}
              <OperativeBadge verification={verificationStatus} account={row.account_status} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              value={targetStatus}
              onValueChange={(v) => setNextStatus((p) => ({ ...p, [key]: v as StatusAction }))}
              disabled={isBusy}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Reason (required, 12+ chars)"
              value={reason[key] || ''}
              onChange={(e) => setReason((p) => ({ ...p, [key]: e.target.value }))}
              disabled={isBusy}
              className={
                targetStatus === 'suspended'
                  ? 'border-orange-300 focus:ring-orange-300'
                  : targetStatus === 'deleted'
                    ? 'border-red-300 focus:ring-red-300'
                    : ''
              }
            />

            <Button
              onClick={() => applyStatus(key, row.user_id, rpcName, roleType)}
              disabled={isBusy || targetStatus === currentStatus}
              variant={
                targetStatus === 'suspended'
                  ? 'outline'
                  : targetStatus === 'deleted'
                    ? 'destructive'
                    : 'default'
              }
              className={
                targetStatus === 'suspended'
                  ? 'border-orange-400 text-orange-700 hover:bg-orange-50'
                  : ''
              }
            >
              {isBusy ? 'Applying…' : `Set ${targetStatus}`}
            </Button>
          </div>

          {/* Warn admin of cascade effect */}
          {(targetStatus === 'suspended' || targetStatus === 'deleted') &&
            targetStatus !== currentStatus && (
              <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  {targetStatus === 'suspended'
                    ? 'All active listings/tours by this partner will be hidden from the marketplace. Partner is notified.'
                    : 'Soft-delete: profile stays in DB but account and all listings become inaccessible.'}
                </span>
              </div>
            )}
        </CardContent>
      </Card>
    )
  }

  if (loading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )

  return (
    <>
      {/* Governance Matrix legend */}
      <Card className="mb-6 bg-muted/40 border-border">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Governance Matrix
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { v: 'approved', a: 'active', ops: '✅ Operative', color: 'text-green-700' },
              { v: 'approved', a: 'suspended', ops: '❌ Suspended', color: 'text-orange-700' },
              { v: 'pending', a: '—', ops: '🔒 Not verified', color: 'text-slate-600' },
              { v: 'rejected', a: '—', ops: '🔒 Not verified', color: 'text-slate-600' },
            ].map((row) => (
              <div
                key={`${row.v}:${row.a}`}
                className="p-2.5 rounded-lg bg-background border border-border"
              >
                <div className="text-muted-foreground">
                  Verified: <span className="font-medium text-foreground">{row.v}</span>
                </div>
                {row.a !== '—' && (
                  <div className="text-muted-foreground">
                    Account: <span className="font-medium text-foreground">{row.a}</span>
                  </div>
                )}
                <div className={`mt-1 font-semibold ${row.color}`}>{row.ops}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Hotel Managers <span className="font-normal">({hotelManagers.length})</span>
          </h2>
          {!hotelManagers.length ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No hotel managers yet.
              </CardContent>
            </Card>
          ) : (
            hotelManagers.map((p) => (
              <PartnerCard
                key={p.user_id}
                row={p}
                keyPrefix="hm"
                rpcName="admin_set_hotel_manager_status"
                roleType="hotel_manager"
              />
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Tour Operators <span className="font-normal">({tourOperators.length})</span>
          </h2>
          {!tourOperators.length ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No tour operators yet.
              </CardContent>
            </Card>
          ) : (
            tourOperators.map((p) => (
              <PartnerCard
                key={p.user_id}
                row={p}
                keyPrefix="op"
                rpcName="admin_set_tour_operator_status"
                roleType="tour_operator"
              />
            ))
          )}
        </section>
      </div>

      {/* Soft-delete confirm dialog */}
      <Dialog
        open={!!confirmDel}
        onOpenChange={(o) => {
          if (!o) setConfirmDel(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soft-delete this partner?</DialogTitle>
            <DialogDescription>
              The profile remains in the database but becomes inaccessible. All active listings and
              tours will be hidden. This action is logged to the audit trail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => confirmDel?.fn()}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPartnersPage() {
  const {
    data: pendingQueue = [],
    isLoading: queueLoading,
    refetch,
  } = useVerificationQueue('pending')
  const { data: allQueue = [] } = useVerificationQueue()

  const approvedCount = allQueue.filter((r) => r.status === 'approved').length
  const pendingCount = pendingQueue.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage partner verification, account status, and platform access.
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
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allQueue.length}</p>
              <p className="text-xs text-muted-foreground">Total Applications</p>
            </div>
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

        <TabsContent value="pending" className="space-y-4">
          {queueLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingQueue.length === 0 ? (
            <Card>
              <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-3">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-lg font-semibold">All clear!</p>
                <p className="text-sm text-muted-foreground">No pending applications.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Oldest first (FIFO). All decisions auto-notify the partner.
              </p>
              {pendingQueue.map((req) => (
                <PendingReviewCard key={req.id} req={req} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="all">
          <AllPartnersTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
