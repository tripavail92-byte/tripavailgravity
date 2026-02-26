import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  failure_code: string | null
  failure_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
}

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
    expired: { label: 'Expired', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  }

  const s = cfg[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' }
  return (
    <span className={cn('text-xs font-semibold px-2 py-1 rounded-md border', s.className)}>
      {s.label}
    </span>
  )
}

export default function AdminKYCPage() {
  const [rows, setRows] = useState<KycRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<
    Record<string, { front?: string; back?: string; loading?: boolean }>
  >({})

  const pending = useMemo(
    () => rows.filter((r) => r.status === 'pending_admin_review'),
    [rows],
  )

  const load = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await (supabase
        .from('kyc_sessions' as any)
        .select(
          'id,user_id,role,status,created_at,expires_at,id_front_path,id_back_path,cnic_number,full_name,father_name,date_of_birth,expiry_date,failure_code,failure_reason,reviewed_by,reviewed_at,review_notes',
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

  useEffect(() => {
    load()
  }, [])

  const sign = async (sessionId: string, field: 'id_front' | 'id_back') => {
    const { data, error } = await supabase.functions.invoke('kyc-signed-url', {
      body: { session_id: sessionId, field },
    })
    if (error) throw error
    if (!data?.signedUrl) throw new Error('Signed URL missing')
    return data.signedUrl as string
  }

  const loadImages = async (row: KycRow) => {
    setImageUrls((prev) => ({ ...prev, [row.id]: { ...prev[row.id], loading: true } }))
    try {
      const [front, back] = await Promise.all([
        row.id_front_path ? sign(row.id, 'id_front') : Promise.resolve(undefined),
        row.id_back_path ? sign(row.id, 'id_back') : Promise.resolve(undefined),
      ])
      setImageUrls((prev) => ({
        ...prev,
        [row.id]: { front, back, loading: false },
      }))
    } catch (err: any) {
      console.error('[AdminKYCPage] loadImages failed', err)
      toast.error(err?.message || 'Failed to load images')
      setImageUrls((prev) => ({ ...prev, [row.id]: { ...prev[row.id], loading: false } }))
    }
  }

  const mark = async (row: KycRow, nextStatus: 'approved' | 'rejected', notes?: string) => {
    setBusyId(row.id)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const reviewerId = authData?.user?.id ?? null

      const payload: Record<string, any> = {
        status: nextStatus,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes ?? null,
      }

      const { error } = await (supabase
        .from('kyc_sessions' as any)
        .update(payload)
        .eq('id', row.id) as any)

      if (error) throw error

      toast.success(nextStatus === 'approved' ? 'KYC approved' : 'KYC rejected')
      await load()
    } catch (err: any) {
      console.error('[AdminKYCPage] mark failed', err)
      toast.error(err?.message || 'Failed to update status')
    } finally {
      setBusyId(null)
    }
  }

  const blockCnic = async (row: KycRow) => {
    if (!row.cnic_number) {
      toast.error('No CNIC extracted to block')
      return
    }

    setBusyId(row.id)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const adminId = authData?.user?.id ?? null

      const { error: insertErr } = await (supabase
        .from('kyc_blocked_cnics' as any)
        .insert({
          cnic_number: row.cnic_number,
          reason: 'Blocked by admin',
          created_by: adminId,
        }) as any)

      // Duplicate blocks should not prevent rejecting the session.
      if (insertErr) {
        console.warn('[AdminKYCPage] block insert failed', insertErr)
      }

      try {
        const { error: blockErr } = await supabase.functions.invoke('kyc-block-cnic', {
          body: { cnic_number: row.cnic_number, reason: 'Blocked by admin' },
        })
        if (blockErr) {
          console.warn('[AdminKYCPage] kyc-block-cnic failed', blockErr)
        }
      } catch (e) {
        console.warn('[AdminKYCPage] kyc-block-cnic threw', e)
      }

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
      console.error('[AdminKYCPage] blockCnic failed', err)
      toast.error(err?.message || 'Failed to block CNIC')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Review</h1>
          <p className="text-sm text-muted-foreground">
            Review CNIC submissions and approve or reject.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Admin Review</CardTitle>
          <span className="text-sm text-muted-foreground">{pending.length} pending</span>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : pending.length === 0 ? (
            <div className="text-sm text-muted-foreground">No pending sessions.</div>
          ) : (
            pending.map((row) => {
              const images = imageUrls[row.id]
              const isBusy = busyId === row.id

              return (
                <Card key={row.id} className="border border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {statusPill(row.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(row.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm font-semibold">User: {row.user_id}</div>
                        <div className="text-xs text-muted-foreground">
                          Role: {row.role ?? '—'} · Expires:{' '}
                          {row.expires_at ? new Date(row.expires_at).toLocaleString() : '—'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadImages(row)}
                          disabled={Boolean(images?.loading) || isBusy}
                        >
                          {images?.loading ? 'Loading…' : 'Load Images'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => mark(row, 'approved')}
                          disabled={isBusy}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => mark(row, 'rejected')}
                          disabled={isBusy}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          <span className="font-semibold text-foreground">CNIC:</span>{' '}
                          {row.cnic_number ?? '—'}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Name:</span>{' '}
                          {row.full_name ?? '—'}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Father:</span>{' '}
                          {row.father_name ?? '—'}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">DOB:</span>{' '}
                          {row.date_of_birth ?? '—'}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Expiry:</span>{' '}
                          {row.expiry_date ?? '—'}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          <span className="font-semibold text-foreground">Upload:</span>{' '}
                          {row.id_front_path ? 'front' : '—'} / {row.id_back_path ? 'back' : '—'}
                        </div>
                        {row.failure_reason ? (
                          <div className="text-red-600">
                            <span className="font-semibold">Failure:</span> {row.failure_reason}
                          </div>
                        ) : null}
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => blockCnic(row)}
                            disabled={isBusy || !row.cnic_number}
                          >
                            Block CNIC
                          </Button>
                        </div>
                      </div>
                    </div>

                    {images?.front || images?.back ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="space-y-2">
                          <div className="text-xs font-semibold">Front</div>
                          {images?.front ? (
                            <img
                              src={images.front}
                              alt="CNIC front"
                              className="w-full rounded-md border border-border"
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground">Not available</div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-semibold">Back</div>
                          {images?.back ? (
                            <img
                              src={images.back}
                              alt="CNIC back"
                              className="w-full rounded-md border border-border"
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground">Not available</div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
