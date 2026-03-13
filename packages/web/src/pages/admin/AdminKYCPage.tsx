import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Download, Pencil, RefreshCw, RotateCcw, ShieldCheck, ShieldOff, ShieldX, Upload, UserX } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getUserCached } from '@/lib/authCache'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type KycRow = {
  id: string
  user_id: string
  role: string | null
  status: string
  created_at: string
  expires_at: string | null
  id_front_path: string | null
  id_back_path: string | null
  cnic_number: string | null
  full_name: string | null
  father_name: string | null
  date_of_birth: string | null
  expiry_date: string | null
  gender: string | null
  address: string | null
  failure_code: string | null
  failure_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
}

// Manual OCR entry (used when OCR fails or fields are incomplete)
type ManualFields = {
  cnic_number:   string
  full_name:     string
  father_name:   string
  date_of_birth: string
  expiry_date:   string
  gender:        string
}

type AuditEntry = {
  id: string
  session_id: string
  user_id: string
  old_status: string | null
  new_status: string
  changed_by: string | null
  notes: string | null
  created_at: string
}

// ─── Status pill ─────────────────────────────────────────────────────────────

function statusPill(status: string) {
  const cfg: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    uploading: { label: 'Uploading', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    pending_admin_review: {
      label: 'Pending Admin Review',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-800 border-red-200' },
    expired: { label: 'Expired', className: 'bg-slate-100 text-slate-700' },
    revoked: { label: 'Revoked', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  }
  const s = cfg[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' }
  return (
    <span className={cn('text-xs font-semibold px-2 py-1 rounded-md border', s.className)}>
      {s.label}
    </span>
  )
}

// ─── Single KYC session card ──────────────────────────────────────────────────

type EnforceAction = 'revoke' | 're_review' | 'suspend_account' | 'reinstate_account' | 'request_reupload'

const ENFORCE_ACTIONS: Record<EnforceAction, {
  label: string
  icon: React.ElementType
  className: string
  placeholder: string
  availableFor: string[]
}> = {
  revoke: {
    label: 'Revoke KYC',
    icon: UserX,
    className: 'border-red-300 text-red-700 hover:bg-red-50',
    placeholder: 'Reason for revoking (fraud, expired doc, violation…)',
    availableFor: ['approved'],
  },
  re_review: {
    label: 'Re-open for Review',
    icon: RotateCcw,
    className: 'border-amber-300 text-amber-700 hover:bg-amber-50',
    placeholder: 'Reason for re-opening…',
    availableFor: ['approved', 'rejected', 'revoked', 'failed'],
  },
  suspend_account: {
    label: 'Suspend Account',
    icon: ShieldOff,
    className: 'border-orange-300 text-orange-700 hover:bg-orange-50',
    placeholder: 'Reason for suspension (min 10 chars)…',
    availableFor: ['approved', 'rejected', 'revoked', 'failed', 'pending_admin_review'],
  },
  reinstate_account: {
    label: 'Reinstate Account',
    icon: ShieldCheck,
    className: 'border-green-300 text-green-700 hover:bg-green-50',
    placeholder: 'Reason for reinstatement…',
    availableFor: ['approved', 'rejected', 'revoked', 'failed', 'pending_admin_review'],
  },
  request_reupload: {
    label: 'Request Re-upload',
    icon: Upload,
    className: 'border-blue-300 text-blue-700 hover:bg-blue-50',
    placeholder: 'Tell the user what to fix — they will see this message (min 10 chars)…',
    availableFor: ['pending_admin_review', 'approved', 'revoked', 'failed', 'expired'],
  },
}

function KycCard({
  row,
  busyId,
  onMark,
  onBlockCnic,
  onEnforce,
}: {
  row: KycRow
  busyId: string | null
  onMark: (row: KycRow, s: 'approved' | 'rejected', notes?: string, manualFields?: ManualFields) => void
  onBlockCnic: (row: KycRow) => void
  onEnforce: (row: KycRow, action: EnforceAction, reason: string) => Promise<void>
}) {
  const [images, setImages] = useState<{ front?: string; back?: string; loading?: boolean }>({})
  const isBusy = busyId === row.id
  const isPending = row.status === 'pending_admin_review'

  // Manual OCR fields — pre-populated from whatever OCR managed to extract
  const [manualFields, setManualFields] = useState<ManualFields>({
    cnic_number:   row.cnic_number   ?? '',
    full_name:     row.full_name     ?? '',
    father_name:   row.father_name   ?? '',
    date_of_birth: row.date_of_birth ?? '',
    expiry_date:   row.expiry_date   ?? '',
    gender:        row.gender        ?? '',
  })

  const ocrFailed  = Boolean(row.failure_code === 'ocr_failed' || row.failure_reason)
  const hasEmptyFields = !manualFields.cnic_number || !manualFields.full_name

  const setField = (k: keyof ManualFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setManualFields((prev) => ({ ...prev, [k]: e.target.value }))

  // Rejection notes inline state
  const [rejecting, setRejecting] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')

  // Post-approval enforcement actions
  const [activeEnforce, setActiveEnforce] = useState<EnforceAction | null>(null)
  const [enforceReason, setEnforceReason] = useState('')
  const [enforcing, setEnforcing] = useState(false)

  const availableActions = Object.entries(ENFORCE_ACTIONS)
    .filter(([, cfg]) => cfg.availableFor.includes(row.status))
    .map(([key]) => key as EnforceAction)

  const submitEnforce = async (action: EnforceAction) => {
    if (!enforceReason.trim()) return
    setEnforcing(true)
    try {
      await onEnforce(row, action, enforceReason.trim())
      setActiveEnforce(null)
      setEnforceReason('')
    } catch { /* onEnforce shows toast */ } finally {
      setEnforcing(false)
    }
  }

  // Audit trail
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [showAudit, setShowAudit] = useState(false)
  const [auditLoading, setAuditLoading] = useState(false)

  const toggleAudit = async () => {
    if (showAudit) { setShowAudit(false); return }
    setShowAudit(true)
    if (auditLog.length > 0) return
    setAuditLoading(true)
    try {
      const { data } = await (supabase
        .from('kyc_audit_log' as any)
        .select('id,old_status,new_status,changed_by,notes,created_at')
        .eq('session_id', row.id)
        .order('created_at', { ascending: true }) as any)
      setAuditLog((data ?? []) as AuditEntry[])
    } catch { /* non-fatal */ } finally {
      setAuditLoading(false)
    }
  }

  const sign = async (field: 'id_front' | 'id_back') => {
    const { data, error } = await supabase.functions.invoke('kyc-signed-url', {
      body: { session_id: row.id, field },
    })
    if (error) throw error
    if (!data?.signedUrl) throw new Error('Signed URL missing')
    return data.signedUrl as string
  }

  /** Open signed URL in new tab (browser will show/download the image) */
  const downloadImage = async (field: 'id_front' | 'id_back', label: string) => {
    setImages((p) => ({ ...p, loading: true }))
    try {
      const url = await sign(field)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      toast.error(`Failed to download ${label}: ${err?.message || 'Unknown error'}`)
    } finally {
      setImages((p) => ({ ...p, loading: false }))
    }
  }

  const loadImages = async () => {
    setImages({ loading: true })
    try {
      const [front, back] = await Promise.all([
        row.id_front_path ? sign('id_front') : Promise.resolve(undefined),
        row.id_back_path ? sign('id_back') : Promise.resolve(undefined),
      ])
      setImages({ front, back, loading: false })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load images')
      setImages({ loading: false })
    }
  }

  return (
    <Card className={cn('border border-border', isPending && 'border-l-4 border-l-amber-400')}>
      <CardContent className="p-4 space-y-3">
        {/* Header: status + actions */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {statusPill(row.status)}
              <span className="text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString()}
              </span>
            </div>
            <div className="text-sm font-semibold truncate">User: {row.user_id}</div>
            <div className="text-xs text-muted-foreground">
              Role: {row.role ?? '—'} · Expires:{' '}
              {row.expires_at ? new Date(row.expires_at).toLocaleString() : '—'}
            </div>
          </div>
          {/* Post-approval enforcement action buttons */}
          {availableActions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mr-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Admin Actions
              </span>
              {availableActions.map((action) => {
                const cfg = ENFORCE_ACTIONS[action]
                const Icon = cfg.icon
                const isActive = activeEnforce === action
                return (
                  <div key={action} className="flex items-center gap-1.5 flex-wrap">
                    {!isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn('text-xs gap-1', cfg.className)}
                        onClick={() => { setActiveEnforce(action); setEnforceReason('') }}
                        disabled={isBusy || enforcing || activeEnforce !== null}
                      >
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </Button>
                    ) : (
                      <>
                        <input
                          autoFocus
                          type="text"
                          placeholder={cfg.placeholder}
                          value={enforceReason}
                          onChange={(e) => setEnforceReason(e.target.value)}
                          className="border rounded-md px-2 py-1 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && enforceReason.trim()) submitEnforce(action)
                            if (e.key === 'Escape') { setActiveEnforce(null); setEnforceReason('') }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn('text-xs', cfg.className)}
                          disabled={!enforceReason.trim() || enforcing}
                          onClick={() => submitEnforce(action)}
                        >
                          {enforcing ? 'Working…' : 'Confirm'}
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="text-xs"
                          onClick={() => { setActiveEnforce(null); setEnforceReason('') }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => onMark(row, 'approved', undefined, manualFields)}
                disabled={isBusy || rejecting || hasEmptyFields}
                title={hasEmptyFields ? 'Fill in CNIC number and Full Name below before approving' : ''}
                className="bg-green-600 hover:bg-green-700 text-white gap-1 disabled:opacity-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Approve
              </Button>
              {!rejecting ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejecting(true)}
                  disabled={isBusy}
                  className="gap-1"
                >
                  <ShieldX className="h-3.5 w-3.5" />
                  Reject
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Rejection reason (required)"
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="border rounded-md px-2 py-1 text-xs w-52 focus:outline-none focus:ring-2 focus:ring-red-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && rejectNotes.trim()) {
                        onMark(row, 'rejected', rejectNotes.trim())
                        setRejecting(false)
                        setRejectNotes('')
                      }
                      if (e.key === 'Escape') { setRejecting(false); setRejectNotes('') }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!rejectNotes.trim() || isBusy}
                    onClick={() => {
                      onMark(row, 'rejected', rejectNotes.trim())
                      setRejecting(false)
                      setRejectNotes('')
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => { setRejecting(false); setRejectNotes('') }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* OCR failure banner */}
        {ocrFailed && (
          <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
            <span>
              <strong>OCR failed</strong> — automatic extraction did not produce results.
              {isPending
                ? ' Please download the images, read the CNIC manually, and fill in the fields below before approving.'
                : ` [${row.failure_code ?? 'ocr_failed'}] ${row.failure_reason ?? ''}`}
            </span>
          </div>
        )}

        {/* Structured OCR fields — editable when pending, read-only otherwise */}
        {isPending ? (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Pencil className="h-3 w-3" />
              Identity Fields
              {hasEmptyFields && (
                <span className="ml-1 text-amber-600">— CNIC and Full Name required to approve</span>
              )}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {([
                { key: 'cnic_number',   label: 'CNIC Number',   placeholder: '12345-6789012-3', required: true  },
                { key: 'full_name',     label: 'Full Name',     placeholder: 'As on CNIC',      required: true  },
                { key: 'father_name',   label: 'Father Name',   placeholder: 'As on CNIC',      required: false },
                { key: 'date_of_birth', label: 'Date of Birth', placeholder: 'DD.MM.YYYY',      required: false },
                { key: 'expiry_date',   label: 'Expiry Date',   placeholder: 'DD.MM.YYYY',      required: false },
              ] as { key: keyof ManualFields; label: string; placeholder: string; required: boolean }[]).map(({ key, label, placeholder, required }) => (
                <label key={key} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                  </span>
                  <input
                    type="text"
                    value={manualFields[key]}
                    onChange={setField(key)}
                    placeholder={placeholder}
                    className={cn(
                      'border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50',
                      required && !manualFields[key] ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-border',
                    )}
                  />
                </label>
              ))}
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Gender</span>
                <select
                  value={manualFields.gender}
                  onChange={setField('gender')}
                  className="border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                >
                  <option value="">— select —</option>
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </select>
              </label>
            </div>
            {row.address && (
              <div className="text-xs">
                <span className="font-semibold text-foreground">Address: </span>
                <span className="text-muted-foreground">{row.address}</span>
              </div>
            )}
            {row.review_notes && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Review Notes: </span>
                {row.review_notes}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {([['CNIC', row.cnic_number], ['Full Name', row.full_name], ['Father Name', row.father_name],
               ['Date of Birth', row.date_of_birth], ['Expiry Date', row.expiry_date], ['Gender', row.gender],
            ] as [string, string | null][]).map(([label, val]) => (
              <div key={label}>
                <span className="font-semibold text-foreground">{label}: </span>
                <span className="text-muted-foreground">{val ?? '—'}</span>
              </div>
            ))}
            {row.address && (
              <div className="col-span-2">
                <span className="font-semibold text-foreground">Address: </span>
                <span className="text-muted-foreground">{row.address}</span>
              </div>
            )}
            {row.failure_reason && !ocrFailed && (
              <div className="col-span-2 text-red-600">
                <span className="font-semibold">⚠ Failure: </span>
                {row.failure_code ? `[${row.failure_code}] ` : ''}{row.failure_reason}
              </div>
            )}
            {row.review_notes && (
              <div className="col-span-2 text-muted-foreground">
                <span className="font-semibold text-foreground">Review Notes: </span>
                {row.review_notes}
              </div>
            )}
          </div>
        )}

        {/* Document buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {row.id_front_path && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => downloadImage('id_front', 'CNIC Front')}
              disabled={Boolean(images.loading)}
            >
              <Download className="h-3 w-3" />
              Download CNIC Front
            </Button>
          )}
          {row.id_back_path && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => downloadImage('id_back', 'CNIC Back')}
              disabled={Boolean(images.loading)}
            >
              <Download className="h-3 w-3" />
              Download CNIC Back
            </Button>
          )}
          {(row.id_front_path || row.id_back_path) && !images.front && !images.back && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={loadImages}
              disabled={Boolean(images.loading)}
            >
              {images.loading ? 'Loading…' : 'Preview Inline'}
            </Button>
          )}
          {isPending && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => onBlockCnic(row)}
              disabled={isBusy || !row.cnic_number}
            >
              Block CNIC
            </Button>
          )}
        </div>

        {/* Inline image preview (only after clicking Preview Inline) */}
        {(images.front || images.back) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold">CNIC Front</p>
              {images.front ? (
                <img src={images.front} alt="CNIC front" className="w-full rounded-md border" />
              ) : (
                <p className="text-xs text-muted-foreground">Not available</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold">CNIC Back</p>
              {images.back ? (
                <img src={images.back} alt="CNIC back" className="w-full rounded-md border" />
              ) : (
                <p className="text-xs text-muted-foreground">Not available</p>
              )}
            </div>
          </div>
        )}

        {/* Audit trail */}
        <div className="pt-1 border-t border-border/50">
          <button
            onClick={toggleAudit}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAudit ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Audit Trail
          </button>
          {showAudit && (
            <div className="mt-2 space-y-1.5">
              {auditLoading && (
                <p className="text-xs text-muted-foreground">Loading…</p>
              )}
              {!auditLoading && auditLog.length === 0 && (
                <p className="text-xs text-muted-foreground">No audit entries yet.</p>
              )}
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground shrink-0 w-32">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {entry.old_status ?? '—'} →
                  </span>
                  <span className={cn(
                    'font-semibold shrink-0',
                    entry.new_status === 'approved' ? 'text-green-700' :
                    entry.new_status === 'rejected' ? 'text-red-700' : 'text-foreground'
                  )}>
                    {entry.new_status}
                  </span>
                  {entry.notes && (
                    <span className="text-muted-foreground truncate">· {entry.notes}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminKYCPage() {
  const [rows, setRows] = useState<KycRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const pending   = useMemo(() => rows.filter((r) => r.status === 'pending_admin_review'), [rows])
  const approved  = useMemo(() => rows.filter((r) => r.status === 'approved'), [rows])
  const rejected  = useMemo(() => rows.filter((r) => r.status === 'rejected'), [rows])
  const revoked   = useMemo(() => rows.filter((r) => r.status === 'revoked'), [rows])
  const inProcess = useMemo(
    () => rows.filter((r) => ['pending', 'uploading', 'processing'].includes(r.status)),
    [rows],
  )

  const load = async () => {
    setIsLoading(true)
    try {
      const now = new Date().toISOString()
      // Terminal statuses always show; active-only statuses only show if not expired
      const { data, error } = await (supabase
        .from('kyc_sessions' as any)
        .select(
          'id,user_id,role,status,created_at,expires_at,' +
          'id_front_path,id_back_path,' +
          'cnic_number,full_name,father_name,date_of_birth,expiry_date,gender,address,' +
          'failure_code,failure_reason,reviewed_by,reviewed_at,review_notes',
        )
        .or(
          `status.in.(pending_admin_review,approved,rejected,failed,revoked),` +
          `and(status.in.(uploading,pending,processing),expires_at.gt.${now})`,
        )
        .order('created_at', { ascending: false }) as any)

      if (error) throw error
      setRows((data ?? []) as KycRow[])
    } catch (err: any) {
      console.error('[AdminKYCPage] load failed', err)
      toast.error(err?.message || 'Failed to load KYC queue')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const mark = async (
    row: KycRow,
    nextStatus: 'approved' | 'rejected',
    notes?: string,
    manualFields?: ManualFields,
  ) => {
    if (nextStatus === 'rejected' && !notes?.trim()) {
      toast.error('A rejection reason is required')
      return
    }
    setBusyId(row.id)
    try {
      const user = await getUserCached()
      const reviewerId = user?.id ?? null

      // Build the patch — include manually-entered OCR fields on approval
      // so the trigger promotes them to tour_operator_profiles immediately.
      const patch: Record<string, any> = {
        status:      nextStatus,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes?.trim() ?? null,
      }

      if (nextStatus === 'approved' && manualFields) {
        if (manualFields.cnic_number.trim())    patch.cnic_number   = manualFields.cnic_number.trim()
        if (manualFields.full_name.trim())      patch.full_name     = manualFields.full_name.trim()
        if (manualFields.father_name.trim())    patch.father_name   = manualFields.father_name.trim()
        if (manualFields.date_of_birth.trim())  patch.date_of_birth = manualFields.date_of_birth.trim()
        if (manualFields.expiry_date.trim())    patch.expiry_date   = manualFields.expiry_date.trim()
        if (manualFields.gender.trim())         patch.gender        = manualFields.gender.trim()
      }

      const { error } = await (supabase
        .from('kyc_sessions' as any)
        .update(patch)
        .eq('id', row.id) as any)
      if (error) throw error

      // ── Notify the operator immediately via in-app notification (triggers email webhook) ──
      if (nextStatus === 'rejected') {
        await (supabase.from('notifications' as any).insert({
          user_id: row.user_id,
          type: 'verification_rejected',
          title: 'KYC Verification Rejected',
          body: notes?.trim()
            ? `Your identity documents were reviewed and could not be approved. Reason: ${notes.trim()}. Please re-upload clearer photos of your CNIC.`
            : 'Your identity documents were reviewed and could not be approved. Please re-upload clearer photos of your CNIC.',
          read: false,
        }) as any)
      } else if (nextStatus === 'approved') {
        await (supabase.from('notifications' as any).insert({
          user_id: row.user_id,
          type: 'verification_approved',
          title: 'KYC Verification Approved',
          body: 'Congratulations! Your identity has been verified. You can now publish tour packages.',
          read: false,
        }) as any)
      }

      // DB trigger handles: audit log + profile promotion + user_roles update
      toast.success(
        nextStatus === 'approved'
          ? '✅ KYC approved — operator notified'
          : '❌ KYC rejected — operator notified',
      )
      await load()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status')
    } finally {
      setBusyId(null)
    }
  }

  const blockCnic = async (row: KycRow) => {
    if (!row.cnic_number) { toast.error('No CNIC extracted to block'); return }
    setBusyId(row.id)
    try {
      const user = await getUserCached()
      const adminId = user?.id ?? null

      const { error: insertErr } = await (supabase
        .from('kyc_blocked_cnics' as any)
        .insert({ cnic_number: row.cnic_number, reason: 'Blocked by admin', created_by: adminId }) as any)
      if (insertErr) console.warn('[AdminKYCPage] block insert failed', insertErr)

      try {
        await supabase.functions.invoke('kyc-block-cnic', {
          body: { cnic_number: row.cnic_number, reason: 'Blocked by admin' },
        })
      } catch { /* non-fatal */ }

      const { error: updateErr } = await (supabase
        .from('kyc_sessions' as any)
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          review_notes: 'CNIC blocked by admin',
        })
        .eq('id', row.id) as any)
      if (updateErr) throw updateErr

      toast.success('CNIC blocked and session rejected')
      await load()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to block CNIC')
    } finally {
      setBusyId(null)
    }
  }

  const enforce = async (row: KycRow, action: EnforceAction, reason: string) => {
    setBusyId(row.id)
    try {
      if (action === 'request_reupload') {
        // Separate RPC — marks session rejected with admin's message → PartnerVerificationHub
        // shows the red appeal banner + review_notes so user knows exactly what to fix.
        const { error } = await (supabase.rpc('admin_request_kyc_reupload' as any, {
          p_session_id: row.id,
          p_message: reason,
        }) as any)
        if (error) throw error
        toast.success('📤 Re-upload requested — user will be notified to re-upload their documents')
      } else {
        const { error } = await (supabase.rpc('admin_enforce_kyc_action' as any, {
          p_session_id: row.id,
          p_action: action,
          p_reason: reason,
        }) as any)
        if (error) throw error
        const messages: Record<Exclude<EnforceAction, 'request_reupload'>, string> = {
          revoke: '🚫 KYC revoked — operator must re-submit',
          re_review: '🔄 Session re-opened for review',
          suspend_account: '⚠️ Account suspended',
          reinstate_account: '✅ Account reinstated',
        }
        toast.success(messages[action as Exclude<EnforceAction, 'request_reupload'>])
      }
      await load()
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${action}`)
    } finally {
      setBusyId(null)
    }
  }

  const renderList = (list: KycRow[], emptyMsg: string) => {
    if (isLoading) return <div className="text-sm text-muted-foreground py-6">Loading…</div>
    if (list.length === 0)
      return <div className="text-sm text-muted-foreground py-6">{emptyMsg}</div>
    return (
      <div className="space-y-4">
        {list.map((row) => (
          <KycCard
            key={row.id}
            row={row}
            busyId={busyId}
            onMark={mark}
            onBlockCnic={blockCnic}
            onEnforce={enforce}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Review</h1>
          <p className="text-sm text-muted-foreground">
            Review CNIC submissions. OCR fields are extracted automatically after upload.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={isLoading} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Pending Review', value: pending.length,   color: 'text-amber-600' },
          { label: 'Approved',       value: approved.length,  color: 'text-green-600' },
          { label: 'Rejected',       value: rejected.length,  color: 'text-red-600' },
          { label: 'Revoked',        value: revoked.length,   color: 'text-purple-600' },
          { label: 'In Progress',    value: inProcess.length, color: 'text-blue-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed queue */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            Pending Review
            {pending.length > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="revoked">Revoked</TabsTrigger>
          <TabsTrigger value="inprocess">In Progress</TabsTrigger>
          <TabsTrigger value="all">All Sessions</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="pending">
            {renderList(pending, '✅ No pending sessions — all clear!')}
          </TabsContent>
          <TabsContent value="approved">
            {renderList(approved, 'No approved sessions yet.')}
          </TabsContent>
          <TabsContent value="rejected">
            {renderList(rejected, 'No rejected sessions.')}
          </TabsContent>
          <TabsContent value="revoked">
            {renderList(revoked, 'No revoked sessions.')}
          </TabsContent>
          <TabsContent value="inprocess">
            {renderList(inProcess, 'No sessions currently in progress.')}
          </TabsContent>
          <TabsContent value="all">
            {renderList(rows, 'No KYC sessions found.')}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
