import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  }
  const s = cfg[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' }
  return (
    <span className={cn('text-xs font-semibold px-2 py-1 rounded-md border', s.className)}>
      {s.label}
    </span>
  )
}

// ─── Single KYC session card ──────────────────────────────────────────────────

function KycCard({
  row,
  busyId,
  onMark,
  onBlockCnic,
}: {
  row: KycRow
  busyId: string | null
  onMark: (row: KycRow, s: 'approved' | 'rejected') => void
  onBlockCnic: (row: KycRow) => void
}) {
  const [images, setImages] = useState<{ front?: string; back?: string; loading?: boolean }>({})
  const isBusy = busyId === row.id
  const isPending = row.status === 'pending_admin_review'

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
          {isPending && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => onMark(row, 'approved')}
                disabled={isBusy}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onMark(row, 'rejected')}
                disabled={isBusy}
              >
                Reject
              </Button>
            </div>
          )}
        </div>

        {/* Structured OCR fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
          {([
            ['CNIC', row.cnic_number],
            ['Full Name', row.full_name],
            ['Father Name', row.father_name],
            ['Date of Birth', row.date_of_birth],
            ['Expiry Date', row.expiry_date],
            ['Gender', row.gender],
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
          {row.failure_reason && (
            <div className="col-span-2 text-red-600">
              <span className="font-semibold">⚠ Failure: </span>
              {row.failure_code ? `[${row.failure_code}] ` : ''}
              {row.failure_reason}
            </div>
          )}
          {row.review_notes && (
            <div className="col-span-2 text-muted-foreground">
              <span className="font-semibold text-foreground">Review Notes: </span>
              {row.review_notes}
            </div>
          )}
        </div>

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
  const inProcess = useMemo(
    () => rows.filter((r) => ['pending', 'uploading', 'processing'].includes(r.status)),
    [rows],
  )

  const load = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await (supabase
        .from('kyc_sessions' as any)
        .select(
          'id,user_id,role,status,created_at,expires_at,' +
          'id_front_path,id_back_path,' +
          'cnic_number,full_name,father_name,date_of_birth,expiry_date,gender,address,' +
          'failure_code,failure_reason,reviewed_by,reviewed_at,review_notes',
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

  const mark = async (row: KycRow, nextStatus: 'approved' | 'rejected', notes?: string) => {
    setBusyId(row.id)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const reviewerId = authData?.user?.id ?? null
      const { error } = await (supabase
        .from('kyc_sessions' as any)
        .update({
          status: nextStatus,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes ?? null,
        })
        .eq('id', row.id) as any)
      if (error) throw error
      toast.success(nextStatus === 'approved' ? '✅ KYC approved' : '❌ KYC rejected')
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
      const { data: authData } = await supabase.auth.getUser()
      const adminId = authData?.user?.id ?? null

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: pending.length,   color: 'text-amber-600' },
          { label: 'Approved',       value: approved.length,  color: 'text-green-600' },
          { label: 'Rejected',       value: rejected.length,  color: 'text-red-600' },
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
