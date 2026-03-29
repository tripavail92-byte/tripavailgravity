import {
  Award,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  MessageSquare,
  MoreHorizontal,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  clearOperatorAwardOverride,
  fetchOperatorAwardOverrides,
  fetchOperatorAwards,
  fetchOperatorQualityScore,
  fetchOperatorResponseMetrics,
  fetchOperatorStorefrontAnalytics,
  fetchOperatorVerificationProfile,
  fetchOperatorVerificationReviews,
  fetchHotelManagers,
  fetchProfilesByIds,
  fetchTourOperators,
  setOperatorAwardOverride,
  setOperatorVerificationFlag,
  type AdminOperatorAward,
  type AdminOperatorAwardOverride,
  type AdminOperatorQualityScore,
  type AdminOperatorResponseMetrics,
  type AdminOperatorStorefrontAnalytics,
  type AdminOperatorVerificationReview,
  type OperatorVerificationFlagKey,
} from '@/features/admin/services/adminService'
import { supabase } from '@/lib/supabase'
import {
  useApprovePartner,
  useRejectPartner,
  useRequestPartnerInfo,
  useVerificationQueue,
  type VerificationRequest,
} from '@/queries/adminQueries'
import { useSearchParams } from 'react-router-dom'

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

type PartnerAdminRow = PartnerRow & { roleType: string; rpcName: string }

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

function formatScoreReason(code: string) {
  return code.replace(/_/g, ' ')
}

function formatScoreInputValue(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2)
  if (value == null) return '—'
  return String(value).replace(/_/g, ' ')
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

  const vd = (sd?.verification_documents ?? {}) as Record<string, any>
  const kycToken = vd.kyc_session_token as string | undefined
  const kycStatus = vd.kyc_status as string | undefined
  const kycCnic = vd.cnic_number as string | undefined
  const kycExpiry = vd.expiry_date as string | undefined

  const legacyIdentityDocs = [
    { key: 'id_card_url', label: 'CNIC Front', emoji: '🪪' },
    { key: 'id_back_url', label: 'CNIC Back', emoji: '🔄' },
  ].filter((d) => !!vd[d.key])

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
          {/* Identity / Biometric Documents */}
          {(kycToken || legacyIdentityDocs.length > 0) && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50/60 border border-blue-100 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Identity Verification (CNIC)
                </p>
              </div>

              {kycToken ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    <span className="font-semibold text-foreground">KYC status:</span>{' '}
                    {kycStatus ?? '—'}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">KYC token:</span> {kycToken}
                  </div>
                  {kycCnic ? (
                    <div>
                      <span className="font-semibold text-foreground">CNIC:</span> {kycCnic}
                    </div>
                  ) : null}
                  {kycExpiry ? (
                    <div>
                      <span className="font-semibold text-foreground">Expiry:</span> {kycExpiry}
                    </div>
                  ) : null}
                  <div className="pt-1">
                    <a
                      href="/admin/kyc"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-white border border-blue-200 px-2.5 py-1 rounded-lg font-medium"
                    >
                      🛡️ Review in KYC Queue
                    </a>
                  </div>
                </div>
              ) : null}

              {legacyIdentityDocs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {legacyIdentityDocs.map((doc) => (
                    <a
                      key={doc.key}
                      href={vd[doc.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline bg-white border border-blue-200 px-2.5 py-1 rounded-lg font-medium"
                    >
                      {doc.emoji} {doc.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          {!kycToken && legacyIdentityDocs.length === 0 && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50/60 border border-amber-200">
              <p className="text-xs font-semibold text-amber-700">
                ⚠️ No identity documents submitted — partner has not completed CNIC verification
              </p>
            </div>
          )}

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
  { value: 'active',    label: '✅ Reinstate (Active)', icon: ShieldCheck },
  { value: 'suspended', label: '⚠️ Suspend',            icon: ShieldOff },
  { value: 'deleted',   label: '🗑️ Soft-Delete',        icon: Trash2 },
] as const

const STOREFRONT_VERIFICATION_FIELDS: Array<{
  key: OperatorVerificationFlagKey
  label: string
  description: string
  urlKey: 'businessRegistration' | 'insurance' | 'vehicleDocs' | 'guideLicense'
}> = [
  {
    key: 'businessRegistrationVerified',
    label: 'Business registration',
    description: 'Review company registration and legal business identity documents.',
    urlKey: 'businessRegistration',
  },
  {
    key: 'insuranceVerified',
    label: 'Insurance',
    description: 'Confirm the insurance document is valid and current.',
    urlKey: 'insurance',
  },
  {
    key: 'vehicleDocsVerified',
    label: 'Vehicle documents',
    description: 'Confirm vehicle ownership or operating documentation for listed fleet assets.',
    urlKey: 'vehicleDocs',
  },
  {
    key: 'guideLicenseVerified',
    label: 'Guide credentials',
    description: 'Confirm guide licensing or qualification documents.',
    urlKey: 'guideLicense',
  },
]

const MANUAL_AWARD_TEMPLATES = [
  { code: 'editor_pick', name: 'Editor Pick' },
  { code: 'premium_partner', name: 'Premium Partner' },
  { code: 'family_favorite', name: 'Family Favorite' },
  { code: 'expedition_specialist', name: 'Expedition Specialist' },
  { code: 'seasonal_highlight', name: 'Seasonal Highlight' },
] as const

function formatVerificationLabel(key: string): string {
  return key
    .replace(/Verified$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())
}

function formatPercent(value: number | null | undefined, decimals = 1) {
  if (value == null) return '—'
  const rounded = Number(value)
  if (Number.isNaN(rounded)) return '—'
  return `${Number(rounded.toFixed(decimals))}%`
}

function StorefrontVerificationDialog({
  partner,
  open,
  onOpenChange,
  onUpdated,
}: {
  partner: { id: string; name: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [submittingKey, setSubmittingKey] = useState<OperatorVerificationFlagKey | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [reviews, setReviews] = useState<AdminOperatorVerificationReview[]>([])
  const [awards, setAwards] = useState<AdminOperatorAward[]>([])
  const [awardOverrides, setAwardOverrides] = useState<AdminOperatorAwardOverride[]>([])
  const [storefrontAnalytics, setStorefrontAnalytics] = useState<AdminOperatorStorefrontAnalytics | null>(null)
  const [responseMetrics, setResponseMetrics] = useState<AdminOperatorResponseMetrics | null>(null)
  const [qualityScore, setQualityScore] = useState<AdminOperatorQualityScore | null>(null)
  const [awardForm, setAwardForm] = useState({
    awardCode: 'editor_pick',
    awardName: 'Editor Pick',
    overrideMode: 'grant' as 'grant' | 'revoke',
    expiresAt: '',
    adminNote: '',
  })
  const [notes, setNotes] = useState<Record<OperatorVerificationFlagKey, string>>({
    businessRegistrationVerified: '',
    insuranceVerified: '',
    vehicleDocsVerified: '',
    guideLicenseVerified: '',
  })

  useEffect(() => {
    if (!open || !partner?.id) return

    const loadDetails = async () => {
      setLoading(true)
      try {
        const [currentProfile, currentReviews, currentAwards, currentOverrides, currentAnalytics, currentResponseMetrics, currentQualityScore] = await Promise.all([
          fetchOperatorVerificationProfile(partner.id),
          fetchOperatorVerificationReviews(partner.id),
          fetchOperatorAwards(partner.id),
          fetchOperatorAwardOverrides(partner.id),
          fetchOperatorStorefrontAnalytics(partner.id),
          fetchOperatorResponseMetrics(partner.id),
          fetchOperatorQualityScore(partner.id),
        ])
        setProfile(currentProfile)
        setReviews(currentReviews)
        setAwards(currentAwards)
        setAwardOverrides(currentOverrides)
        setStorefrontAnalytics(currentAnalytics)
        setResponseMetrics(currentResponseMetrics)
        setQualityScore(currentQualityScore)
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load storefront verification details')
      } finally {
        setLoading(false)
      }
    }

    loadDetails()
  }, [open, partner?.id])

  const verificationDocuments = (profile?.verification_documents || {}) as Record<string, any>
  const verificationUrls = (profile?.verification_urls || {}) as Record<string, string>

  const refreshAwardData = async () => {
    if (!partner?.id) return

    const [currentAwards, currentOverrides] = await Promise.all([
      fetchOperatorAwards(partner.id),
      fetchOperatorAwardOverrides(partner.id),
    ])
    setAwards(currentAwards)
    setAwardOverrides(currentOverrides)
  }

  const handleDecision = async (key: OperatorVerificationFlagKey, verified: boolean) => {
    if (!partner?.id) return

    setSubmittingKey(key)
    try {
      await setOperatorVerificationFlag({
        operatorId: partner.id,
        verificationKey: key,
        verified,
        notes: notes[key],
      })
      toast.success(`${formatVerificationLabel(key)} ${verified ? 'verified' : 'cleared'}`)

      const [currentProfile, currentReviews, currentAwards, currentOverrides, currentAnalytics, currentResponseMetrics, currentQualityScore] = await Promise.all([
        fetchOperatorVerificationProfile(partner.id),
        fetchOperatorVerificationReviews(partner.id),
        fetchOperatorAwards(partner.id),
        fetchOperatorAwardOverrides(partner.id),
        fetchOperatorStorefrontAnalytics(partner.id),
        fetchOperatorResponseMetrics(partner.id),
        fetchOperatorQualityScore(partner.id),
      ])
      setProfile(currentProfile)
      setReviews(currentReviews)
      setAwards(currentAwards)
      setAwardOverrides(currentOverrides)
      setStorefrontAnalytics(currentAnalytics)
      setResponseMetrics(currentResponseMetrics)
      setQualityScore(currentQualityScore)
      await onUpdated()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save storefront verification decision')
    } finally {
      setSubmittingKey(null)
    }
  }

  const handleAwardOverrideSave = async () => {
    if (!partner?.id) return

    try {
      setLoading(true)
      await setOperatorAwardOverride({
        operatorId: partner.id,
        awardCode: awardForm.awardCode.trim(),
        awardName: awardForm.overrideMode === 'grant' ? awardForm.awardName.trim() : undefined,
        overrideMode: awardForm.overrideMode,
        expiresAt: awardForm.expiresAt ? new Date(`${awardForm.expiresAt}T23:59:59Z`).toISOString() : null,
        adminNote: awardForm.adminNote.trim(),
      })
      toast.success('Award override saved')
      await refreshAwardData()
      await onUpdated()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save award override')
    } finally {
      setLoading(false)
    }
  }

  const handleAwardOverrideClear = async (awardCode: string) => {
    if (!partner?.id) return

    try {
      setLoading(true)
      await clearOperatorAwardOverride({ operatorId: partner.id, awardCode })
      toast.success('Award override cleared')
      await refreshAwardData()
      await onUpdated()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clear award override')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Storefront Verification Review</DialogTitle>
          <DialogDescription>
            Review submitted storefront documents for <span className="font-semibold text-foreground">{partner?.name || 'operator'}</span> and set the public verification flags.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              {STOREFRONT_VERIFICATION_FIELDS.map((field) => {
                const docUrl = verificationUrls[field.urlKey]
                const isVerified = Boolean(verificationDocuments[field.key])
                const noteKey = `${field.key}Notes`
                const lastNote = typeof verificationDocuments[noteKey] === 'string' ? verificationDocuments[noteKey] : ''

                return (
                  <div key={field.key} className="space-y-4 rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">{field.label}</p>
                        <p className="text-sm text-muted-foreground">{field.description}</p>
                      </div>
                      <Badge variant="outline" className={isVerified ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>
                        {isVerified ? 'Verified' : 'Not verified'}
                      </Badge>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                      {docUrl ? (
                        <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Open submitted document
                        </a>
                      ) : (
                        <span>No public document URL submitted.</span>
                      )}
                    </div>

                    <Textarea
                      rows={3}
                      value={notes[field.key] || lastNote}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder="Internal review note shown in audit trail"
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDecision(field.key, true)}
                        disabled={submittingKey !== null}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {submittingKey === field.key ? 'Saving…' : 'Mark verified'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecision(field.key, false)}
                        disabled={submittingKey !== null}
                      >
                        {submittingKey === field.key ? 'Saving…' : 'Clear verification'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profile signals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div>Gallery items: {Array.isArray(profile?.gallery_media) ? profile.gallery_media.length : 0}</div>
                  <div>Fleet assets: {Array.isArray(profile?.fleet_assets) ? profile.fleet_assets.length : 0}</div>
                  <div>Guide profiles: {Array.isArray(profile?.guide_profiles) ? profile.guide_profiles.length : 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Storefront analytics (30 days)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Marketplace score</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{qualityScore?.total_score ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Profile views</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{storefrontAnalytics?.profile_views ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Unique visitors</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{storefrontAnalytics?.unique_visitors ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Engaged visitors</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{storefrontAnalytics?.engaged_visitors ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Booking starts</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{storefrontAnalytics?.booking_starts ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Bookings after profile views</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{storefrontAnalytics?.attributed_booking_starts ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Engagement rate</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{formatPercent(storefrontAnalytics?.engagement_rate, 2)}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Profile view to booking rate</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{formatPercent(storefrontAnalytics?.attributed_conversion_rate, 2)}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Response rate</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{formatPercent(responseMetrics?.response_rate, 2)}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Avg response</p>
                      <p className="mt-1 text-2xl font-black text-foreground">
                        {responseMetrics?.avg_response_minutes != null ? `${Math.round(responseMetrics.avg_response_minutes)} min` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p>
                      {(storefrontAnalytics?.engaged_visitors ?? 0)} of {(storefrontAnalytics?.unique_visitors ?? 0)} visitors clicked a CTA or tour in the selected 30-day window, and {(storefrontAnalytics?.attributed_booking_starts ?? 0)} later started a booking after viewing the profile.
                    </p>
                    <p className="mt-2 text-xs">
                      {responseMetrics?.traveler_messages ?? 0} traveler messages received, with {responseMetrics?.responded_messages ?? 0} receiving an operator reply.
                    </p>
                    <p className="mt-2 text-xs">
                      {storefrontAnalytics?.last_viewed_at
                        ? `Last public profile view: ${new Date(storefrontAnalytics.last_viewed_at).toLocaleString()}`
                        : 'No public storefront traffic recorded yet.'}
                    </p>
                  </div>
                  {qualityScore ? (
                    <div className="space-y-3 rounded-lg border border-border p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold uppercase tracking-widest text-muted-foreground">Calibration breakdown</p>
                        <Badge variant="outline">{qualityScore.score_policy_version}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>Review quality: <span className="font-semibold text-foreground">{qualityScore.review_quality_score}</span></div>
                        <div>Verification: <span className="font-semibold text-foreground">{qualityScore.verification_score}</span></div>
                        <div>Responsiveness: <span className="font-semibold text-foreground">{qualityScore.responsiveness_score}</span></div>
                        <div>Reliability: <span className="font-semibold text-foreground">{qualityScore.reliability_score}</span></div>
                        <div>Completeness: <span className="font-semibold text-foreground">{qualityScore.completeness_score}</span></div>
                        <div>Performance: <span className="font-semibold text-foreground">{qualityScore.performance_score}</span></div>
                      </div>
                      <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                        <p className="font-semibold uppercase tracking-widest text-muted-foreground">Why this score landed here</p>
                        <div className="space-y-2">
                          {Object.entries(qualityScore.score_reason_codes || {}).map(([component, codes]) => (
                            <div key={component} className="space-y-1">
                              <p className="font-medium text-foreground">{formatScoreReason(component)}</p>
                              <div className="flex flex-wrap gap-2">
                                {(codes || []).length > 0 ? (codes || []).map((code) => (
                                  <Badge key={code} variant="secondary" className="font-normal">
                                    {formatScoreReason(code)}
                                  </Badge>
                                )) : (
                                  <span className="text-muted-foreground">No notable flags</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                        <p className="font-semibold uppercase tracking-widest text-muted-foreground">Inspectable inputs</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {Object.entries(qualityScore.score_input_snapshot || {}).map(([key, value]) => (
                            <div key={key} className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2">
                              <span className="text-muted-foreground">{formatScoreReason(key)}</span>
                              <span className="text-right font-medium text-foreground">{formatScoreInputValue(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current awards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {awards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active awards.</p>
                  ) : (
                    awards.map((award) => (
                      <div key={award.id} className="rounded-lg border border-border p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-500" />
                            <span className="font-medium text-foreground">{award.award_name}</span>
                          </div>
                          <Badge variant="outline">{award.award_source}</Badge>
                        </div>
                        {award.expires_at ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Expires {new Date(award.expires_at).toLocaleDateString()}
                          </p>
                        ) : null}
                        {award.admin_note ? (
                          <p className="mt-2 text-xs text-muted-foreground">{award.admin_note}</p>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Award overrides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {MANUAL_AWARD_TEMPLATES.map((template) => (
                      <Button
                        key={template.code}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setAwardForm((prev) => ({
                            ...prev,
                            awardCode: template.code,
                            awardName: template.name,
                            overrideMode: 'grant',
                          }))
                        }
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>

                  <Input
                    value={awardForm.awardCode}
                    onChange={(e) => setAwardForm((prev) => ({ ...prev, awardCode: e.target.value }))}
                    placeholder="award_code"
                  />
                  <Input
                    value={awardForm.awardName}
                    onChange={(e) => setAwardForm((prev) => ({ ...prev, awardName: e.target.value }))}
                    placeholder="Award name"
                    disabled={awardForm.overrideMode === 'revoke'}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={awardForm.overrideMode === 'grant' ? 'default' : 'outline'}
                      onClick={() => setAwardForm((prev) => ({ ...prev, overrideMode: 'grant' }))}
                    >
                      Manual grant
                    </Button>
                    <Button
                      type="button"
                      variant={awardForm.overrideMode === 'revoke' ? 'default' : 'outline'}
                      onClick={() => setAwardForm((prev) => ({ ...prev, overrideMode: 'revoke' }))}
                    >
                      Revoke code
                    </Button>
                  </div>
                  <Input
                    type="date"
                    value={awardForm.expiresAt}
                    onChange={(e) => setAwardForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                  />
                  <Textarea
                    rows={3}
                    value={awardForm.adminNote}
                    onChange={(e) => setAwardForm((prev) => ({ ...prev, adminNote: e.target.value }))}
                    placeholder="Reason for override"
                  />
                  <Button
                    type="button"
                    onClick={handleAwardOverrideSave}
                    disabled={
                      loading ||
                      !awardForm.awardCode.trim() ||
                      (awardForm.overrideMode === 'grant' && !awardForm.awardName.trim())
                    }
                  >
                    Save override
                  </Button>

                  {awardOverrides.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No manual overrides.</p>
                  ) : (
                    <div className="space-y-2 pt-2">
                      {awardOverrides.map((override) => (
                        <div key={override.id} className="rounded-lg border border-border p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {override.award_name || override.award_code}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {override.override_mode} · {override.is_active ? 'active' : 'inactive'}
                              </p>
                            </div>
                            {override.is_active ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleAwardOverrideClear(override.award_code)}
                              >
                                Clear
                              </Button>
                            ) : null}
                          </div>
                          {override.expires_at ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Expires {new Date(override.expires_at).toLocaleDateString()}
                            </p>
                          ) : null}
                          {override.admin_note ? (
                            <p className="mt-2 text-xs text-muted-foreground">{override.admin_note}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Verification history</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No storefront verification actions yet.</p>
                  ) : (
                    reviews.slice(0, 8).map((review) => (
                      <div key={review.id} className="rounded-lg border border-border p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-foreground">{formatVerificationLabel(review.verification_key)}</span>
                          <Badge variant="outline">{review.decision}</Badge>
                        </div>
                        {review.notes ? <p className="mt-2 text-muted-foreground">{review.notes}</p> : null}
                        <p className="mt-2 text-xs text-muted-foreground">{new Date(review.reviewed_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AllPartnersTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [partners, setPartners] = useState<PartnerAdminRow[]>(
    [],
  )
  const [usersById, setUsersById] = useState<Record<string, ProfileIdentity>>({})
  const [verifyDialog, setVerifyDialog] = useState<{
    partnerId: string
    roleType: string
    partnerName: string
  } | null>(null)
  const [storefrontDialog, setStorefrontDialog] = useState<{ id: string; name: string } | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationByUserId, setVerificationByUserId] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  // Status filter: null = all
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Dialog State
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    targetStatus: StatusAction
    partnerId: string
    roleType: string
    rpcName: string
    partnerName: string
  } | null>(null)
  const [reason, setReason] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const requestedStorefrontId = searchParams.get('storefront')

  const load = async (filter: string | null = statusFilter) => {
    setLoading(true)
    try {
      const [hmData, opData] = await Promise.all([fetchHotelManagers(100, filter), fetchTourOperators(100, filter)])
      const hmRows = (hmData as PartnerRow[]).map((r) => ({
        ...r,
        roleType: 'hotel_manager',
        rpcName: 'admin_set_hotel_manager_status',
      }))
      const opRows = (opData as PartnerRow[]).map((r) => ({
        ...r,
        roleType: 'tour_operator',
        rpcName: 'admin_set_tour_operator_status',
      }))

      const allPartners = [...hmRows, ...opRows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )

      const ids = Array.from(new Set(allPartners.map((r) => r.user_id)))
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
            if (r.role_type === 'hotel_manager' || r.role_type === 'tour_operator') {
              vsMap[`${r.user_id}:${r.role_type}`] = r.verification_status
            }
          }
        }
        setVerificationByUserId(vsMap)
      }

      setPartners(allPartners)
    } catch (err: any) {
      console.error('[AdminPartnersPage] load error:', err)
      toast.error('Failed to load partners: ' + (err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(statusFilter)
  }, [statusFilter])

  useEffect(() => {
    if (!requestedStorefrontId || partners.length === 0 || storefrontDialog) return

    const target = partners.find((row) => row.user_id === requestedStorefrontId && row.roleType === 'tour_operator')
    if (!target) return

    const u = usersById[target.user_id]
    const name =
      target.business_name ||
      target.company_name ||
      [u?.first_name, u?.last_name].filter(Boolean).join(' ') ||
      u?.email ||
      target.user_id

    setStorefrontDialog({ id: target.user_id, name })
  }, [partners, requestedStorefrontId, storefrontDialog, usersById])

  const handleVerifyConfirm = async () => {
    if (!verifyDialog) return
    setIsVerifying(true)
    try {
      const { error } = await (supabase as any).rpc('admin_verify_partner_direct', {
        p_user_id:      verifyDialog.partnerId,
        p_partner_type: verifyDialog.roleType,
      })
      if (error) throw error
      toast.success(`${verifyDialog.partnerName} verified — partner notified`)
      setVerifyDialog(null)
      await load(statusFilter)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to verify partner')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleActionConfirm = async () => {
    if (!actionDialog) return

    const r = reason.trim()
    if (r.length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`)
      return
    }

    setIsBusy(true)
    try {
      const { error } = await (supabase as any).rpc(actionDialog.rpcName, {
        p_user_id: actionDialog.partnerId,
        p_status: actionDialog.targetStatus,
        p_reason: r,
      })
      if (error) throw error
      toast.success(
        `Status changed to "${actionDialog.targetStatus}" — ${actionDialog.partnerName} notified`,
      )
      setActionDialog(null)
      setReason('')
      await load()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status')
    } finally {
      setIsBusy(false)
    }
  }

  const openActionDialog = (
    row: PartnerAdminRow,
    targetStatus: StatusAction,
  ) => {
    const u = usersById[row.user_id]
    const name =
      row.business_name ||
      row.company_name ||
      [u?.first_name, u?.last_name].filter(Boolean).join(' ') ||
      u?.email ||
      row.user_id

    // Check if the current status is already the target status
    if (row.account_status === targetStatus) return

    setReason('')
    setActionDialog({
      isOpen: true,
      targetStatus,
      partnerId: row.user_id,
      roleType: row.roleType,
      rpcName: row.rpcName,
      partnerName: name,
    })
  }

  if (loading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )

  return (
    <>
      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">
          Filter:
        </span>
        {([
          { value: null,        label: 'All' },
          { value: 'active',    label: '✅ Active' },
          { value: 'suspended', label: '⚠️ Suspended' },
          { value: 'deleted',   label: '🗑️ Deleted' },
        ] as { value: string | null; label: string }[]).map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
            }`}
          >
            {opt.label}
            {loading ? '' : (() => {
              if (opt.value === null) return ` (${partners.length})`
              // Count from currently loaded list only when showing 'all'
              return ''
            })()}
          </button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-1.5 text-xs"
          onClick={() => load(statusFilter)}
          disabled={loading}
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

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

      <Card>
        <div className="p-1 border-b">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Partner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Governance</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No partners found.
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((row) => {
                  const u = usersById[row.user_id]
                  const verificationStatus = verificationByUserId[`${row.user_id}:${row.roleType}`]
                  const name =
                    row.business_name ||
                    row.company_name ||
                    [u?.first_name, u?.last_name].filter(Boolean).join(' ') ||
                    'Unknown'

                  const isSuspended = row.account_status === 'suspended'
                  const isDeleted = row.account_status === 'deleted'

                  return (
                    <TableRow
                      key={`${row.user_id}:${row.roleType}`}
                      className={
                        isSuspended ? 'bg-orange-50/30' : isDeleted ? 'opacity-60 bg-muted/30' : ''
                      }
                    >
                      <TableCell className="font-medium">
                        {name}
                        {isDeleted && (
                          <span className="ml-2 text-xs text-red-600 font-semibold uppercase tracking-wider">
                            (Deleted)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u?.email || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {row.roleType === 'hotel_manager' ? 'Hotel Manager' : 'Tour Operator'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <OperativeBadge
                          verification={verificationStatus}
                          account={row.account_status}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {/* Verify — only shown for non-approved partners */}
                            {verificationStatus !== 'approved' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const u2 = usersById[row.user_id]
                                  const pname =
                                    row.business_name ||
                                    row.company_name ||
                                    [u2?.first_name, u2?.last_name].filter(Boolean).join(' ') ||
                                    u2?.email ||
                                    row.user_id
                                  setVerifyDialog({
                                    partnerId: row.user_id,
                                    roleType: row.roleType,
                                    partnerName: pname,
                                  })
                                }}
                                className="gap-2 cursor-pointer text-green-700 focus:text-green-700"
                              >
                                <ShieldCheck className="h-4 w-4" />
                                <span>Verify Partner</span>
                              </DropdownMenuItem>
                            )}
                            {row.roleType === 'tour_operator' && (
                              <DropdownMenuItem
                                onClick={() => setStorefrontDialog({ id: row.user_id, name })}
                                className="gap-2 cursor-pointer"
                              >
                                <ShieldAlert className="h-4 w-4" />
                                <span>Review Storefront Verification</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Account Status</DropdownMenuLabel>
                            {STATUS_OPTIONS.map((opt) => {
                              const Icon = opt.icon
                              const isActive = (row.account_status || 'active') === opt.value
                              return (
                                <DropdownMenuItem
                                  key={opt.value}
                                  disabled={isActive}
                                  onClick={() => openActionDialog(row, opt.value)}
                                  className={`gap-2 cursor-pointer ${
                                    opt.value === 'deleted' && !isActive
                                      ? 'text-red-600 focus:text-red-600'
                                      : opt.value === 'suspended' && !isActive
                                        ? 'text-orange-600 focus:text-orange-600'
                                        : ''
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                  <span>{opt.label}</span>
                                  {isActive && <span className="ml-auto text-xs">(Current)</span>}
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Verify Partner Dialog */}
      <Dialog open={!!verifyDialog} onOpenChange={(open) => { if (!open && !isVerifying) setVerifyDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Partner</DialogTitle>
            <DialogDescription>
              This will mark{' '}
              <span className="font-semibold text-foreground">{verifyDialog?.partnerName}</span>{' '}
              as verified and grant them full platform access. They will be notified instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3 border border-green-200">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Verification is logged to the audit trail. The partner will be able to list tours and packages immediately.</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialog(null)} disabled={isVerifying}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              onClick={handleVerifyConfirm}
              disabled={isVerifying}
            >
              <ShieldCheck className="h-4 w-4" />
              {isVerifying ? 'Verifying…' : 'Confirm Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Status Confirmation Dialog */}
      <Dialog
        open={actionDialog?.isOpen || false}
        onOpenChange={(open) => {
          if (!open && !isBusy) setActionDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.targetStatus === 'suspended'
                ? 'Suspend Partner Account'
                : actionDialog?.targetStatus === 'deleted'
                  ? 'Soft-Delete Partner Profile'
                  : 'Reactivate Partner Account'}
            </DialogTitle>
            <DialogDescription>
              Action target:{' '}
              <span className="font-semibold text-foreground">{actionDialog?.partnerName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {(actionDialog?.targetStatus === 'suspended' ||
              actionDialog?.targetStatus === 'deleted') && (
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {actionDialog?.targetStatus === 'suspended'
                    ? 'All active listings/tours by this partner will be hidden from the marketplace. The partner will be notified.'
                    : 'The profile remains in the database but becomes inaccessible. All active listings and tours will be hidden.'}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Status Change</label>
              <Input
                placeholder="Required. E.g. Missing valid licenses, policy violation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isBusy}
                className={
                  actionDialog?.targetStatus === 'suspended'
                    ? 'border-orange-300 focus-visible:ring-orange-400'
                    : actionDialog?.targetStatus === 'deleted'
                      ? 'border-red-300 focus-visible:ring-red-400'
                      : ''
                }
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {reason.length}/{MIN_REASON_LEN} chars min
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              variant={
                actionDialog?.targetStatus === 'suspended'
                  ? 'secondary'
                  : actionDialog?.targetStatus === 'deleted'
                    ? 'destructive'
                    : 'default'
              }
              className={
                actionDialog?.targetStatus === 'suspended'
                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-200'
                  : ''
              }
              onClick={handleActionConfirm}
              disabled={isBusy || reason.trim().length < MIN_REASON_LEN}
            >
              {isBusy
                ? 'Applying...'
                : `Confirm ${actionDialog?.targetStatus === 'active' ? 'Reactivation' : actionDialog?.targetStatus}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StorefrontVerificationDialog
        partner={storefrontDialog}
        open={!!storefrontDialog}
        onOpenChange={(open) => {
          if (!open) {
            setStorefrontDialog(null)
            if (searchParams.get('storefront')) {
              const nextParams = new URLSearchParams(searchParams)
              nextParams.delete('storefront')
              setSearchParams(nextParams, { replace: true })
            }
          }
        }}
        onUpdated={async () => {
          await load(statusFilter)
        }}
      />
    </>
  )
}

function RankedOperatorsTab() {
  const [rows, setRows] = useState<Array<{
    partner: PartnerAdminRow
    identity: ProfileIdentity | null
    verificationStatus: string | null
    qualityScore: AdminOperatorQualityScore | null
  }>>([])
  const [loading, setLoading] = useState(true)

  const loadRankedOperators = async () => {
    setLoading(true)
    try {
      const operators = (await fetchTourOperators(100, 'active')) as PartnerRow[]
      const operatorRows: PartnerAdminRow[] = operators.map((row) => ({
        ...row,
        roleType: 'tour_operator',
        rpcName: 'admin_set_tour_operator_status',
      }))

      const ids = operatorRows.map((row) => row.user_id)
      const [profiles, roles, qualityScores] = await Promise.all([
        ids.length ? fetchProfilesByIds(ids) : Promise.resolve([]),
        ids.length
          ? (supabase as any)
              .from('user_roles')
              .select('user_id, role_type, verification_status')
              .in('user_id', ids)
          : Promise.resolve({ data: [] }),
        Promise.all(operatorRows.map((row) => fetchOperatorQualityScore(row.user_id, 90))),
      ])

      const identityMap = Object.fromEntries((profiles as ProfileIdentity[]).map((profile) => [profile.id, profile]))
      const verificationMap: Record<string, string | null> = {}
      for (const roleRow of ((roles as any)?.data || [])) {
        if (roleRow.role_type === 'tour_operator') {
          verificationMap[roleRow.user_id] = roleRow.verification_status
        }
      }

      const rankedRows = operatorRows.map((partner, index) => ({
        partner,
        identity: identityMap[partner.user_id] || null,
        verificationStatus: verificationMap[partner.user_id] ?? null,
        qualityScore: qualityScores[index] ?? null,
      }))

      rankedRows.sort((left, right) => {
        const rightScore = right.qualityScore?.total_score ?? -1
        const leftScore = left.qualityScore?.total_score ?? -1
        if (rightScore !== leftScore) return rightScore - leftScore
        return new Date(right.partner.created_at).getTime() - new Date(left.partner.created_at).getTime()
      })

      setRows(rankedRows)
    } catch (err: any) {
      console.error('[AdminPartnersPage] ranked load error:', err)
      toast.error('Failed to load ranked operators: ' + (err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRankedOperators()
  }, [])

  const inspectableCount = rows.filter((row) => Boolean(row.qualityScore)).length
  const lowConfidenceCount = rows.filter((row) => row.qualityScore?.score_input_snapshot?.ranking_confidence_band === 'low').length

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Calibrated operators</p>
            <p className="mt-2 text-2xl font-black text-foreground">{inspectableCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Operators with an internal marketplace score snapshot</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Low-confidence rankings</p>
            <p className="mt-2 text-2xl font-black text-foreground">{lowConfidenceCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Operators currently receiving the sparse-data calibration penalty</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ranking calibration</p>
              <p className="mt-1 text-sm text-muted-foreground">Internal-only ordering with inspectable score reasons and input buckets.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadRankedOperators()} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal ranked operator list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tour operators are available for calibration yet.</p>
          ) : rows.map((row, index) => {
            const name =
              row.partner.business_name ||
              row.partner.company_name ||
              [row.identity?.first_name, row.identity?.last_name].filter(Boolean).join(' ') ||
              row.identity?.email ||
              row.partner.user_id

            const minimumDataWarning = row.qualityScore?.score_input_snapshot?.minimum_data_warning === true
            const criticalSparseDataWarning = row.qualityScore?.score_input_snapshot?.critical_sparse_data_warning === true
            const rankingConfidenceBand = row.qualityScore?.score_input_snapshot?.ranking_confidence_band
            const rankingConfidenceMultiplier = row.qualityScore?.score_input_snapshot?.ranking_confidence_multiplier
            const rawTotalScore = row.qualityScore?.score_input_snapshot?.raw_total_score
            const reviewConfidence = row.qualityScore?.score_input_snapshot?.review_volume_confidence
            const performanceReasons = row.qualityScore?.score_reason_codes?.performance || []
            const reliabilityReasons = row.qualityScore?.score_reason_codes?.reliability || []
            const calibrationReasons = row.qualityScore?.score_reason_codes?.calibration || []

            return (
              <div key={row.partner.user_id} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <p className="font-semibold text-foreground">{name}</p>
                      <OperativeBadge verification={row.verificationStatus} account={row.partner.account_status} />
                      {criticalSparseDataWarning ? <Badge variant="outline">Low confidence ranking</Badge> : null}
                      {!criticalSparseDataWarning && minimumDataWarning ? <Badge variant="outline">Sparse data warning</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{row.identity?.email || 'No email on file'}</p>
                    <div className="flex flex-wrap gap-2">
                      {performanceReasons.map((reason) => (
                        <Badge key={`performance-${reason}`} variant="secondary" className="font-normal">
                          {formatScoreReason(reason)}
                        </Badge>
                      ))}
                      {reliabilityReasons.map((reason) => (
                        <Badge key={`reliability-${reason}`} variant="secondary" className="font-normal">
                          {formatScoreReason(reason)}
                        </Badge>
                      ))}
                      {calibrationReasons.map((reason) => (
                        <Badge key={`calibration-${reason}`} variant="secondary" className="font-normal">
                          {formatScoreReason(reason)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-w-[280px] grid-cols-2 gap-3 text-sm lg:max-w-md">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Marketplace score</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{row.qualityScore?.total_score ?? 'N/A'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.qualityScore?.score_policy_version ?? 'No policy version'}
                        {rawTotalScore !== undefined ? ` · raw ${formatScoreInputValue(rawTotalScore)}` : ''}
                        {rankingConfidenceMultiplier !== undefined ? ` x ${formatScoreInputValue(rankingConfidenceMultiplier)}` : ''}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Ranking confidence</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{formatScoreInputValue(rankingConfidenceBand)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatScoreInputValue(reviewConfidence)} review signal · {row.qualityScore?.booking_starts ?? 0} booking starts</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Response bucket</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{formatScoreInputValue(row.qualityScore?.score_input_snapshot?.response_time_bucket)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{row.qualityScore?.response_rate ?? 0}% reply rate</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Performance data</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{formatScoreInputValue(row.qualityScore?.score_input_snapshot?.performance_data_band)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{row.qualityScore?.attributed_booking_starts ?? 0} bookings after profile views</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPartnersPage() {
  const [searchParams] = useSearchParams()
  const {
    data: pendingQueue = [],
    isLoading: queueLoading,
    refetch,
  } = useVerificationQueue('pending')
  const { data: allQueue = [] } = useVerificationQueue()

  const initialTab = searchParams.get('tab') === 'all'
    ? 'all'
    : searchParams.get('tab') === 'ranking'
      ? 'ranking'
      : 'pending'
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'ranking'>(initialTab)

  useEffect(() => {
    setActiveTab(
      searchParams.get('tab') === 'all'
        ? 'all'
        : searchParams.get('tab') === 'ranking'
          ? 'ranking'
          : 'pending',
    )
  }, [searchParams])

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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'all' | 'ranking')}>
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
          <TabsTrigger value="ranking" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Ranking Calibration
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

        <TabsContent value="ranking">
          <RankedOperatorsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
