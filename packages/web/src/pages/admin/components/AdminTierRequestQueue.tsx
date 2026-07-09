import { format } from 'date-fns'
import { ArrowRight, Check, Inbox, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  tierChangeRequestService,
  type AdminTierChangeRequest,
} from '@/features/commercial/services/tierChangeRequestService'

/**
 * The upgrade queue. Approving calls `admin_review_membership_tier_change`, which reuses the
 * existing assign RPC — so the tier moves, commission and fee re-sync, and both the tier change
 * log and the admin action log are written, exactly as with a manual assignment.
 */

const STATUS_TONE: Record<string, string> = {
  pending: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
}

function RequestRow({
  request,
  onReviewed,
}: {
  request: AdminTierChangeRequest
  onReviewed: () => void
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)

  const review = async (approve: boolean) => {
    if (!approve && !note.trim()) {
      toast.error('Add a short reason so the operator knows why.')
      return
    }

    setBusy(approve ? 'approve' : 'reject')
    try {
      await tierChangeRequestService.review(request.id, approve, note)
      toast.success(approve ? 'Tier changed and operator notified.' : 'Request rejected.')
      onReviewed()
    } catch (error) {
      console.error('[AdminTierRequestQueue] Review failed', error)
      toast.error(error instanceof Error ? error.message : 'Could not review this request.')
    } finally {
      setBusy(null)
    }
  }

  const isPending = request.status === 'pending'

  return (
    <div className="rounded-2xl border border-border/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {request.business_name ?? 'Unnamed operator'}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="capitalize">{request.current_tier_code}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-semibold capitalize text-foreground">
              {request.requested_tier_code}
            </span>
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {request.operator_user_id}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={`border-0 capitalize ${STATUS_TONE[request.status] ?? ''}`}>
            {request.status}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(request.created_at), 'd MMM yyyy, HH:mm')}
          </span>
        </div>
      </div>

      {request.operator_note ? (
        <p className="mt-3 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
          “{request.operator_note}”
        </p>
      ) : null}

      {!isPending && request.admin_note ? (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-semibold">Reviewer note:</span> {request.admin_note}
        </p>
      ) : null}

      {isPending ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (required to reject, optional to approve)"
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={busy !== null}
              onClick={() => review(false)}
            >
              {busy === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Reject
            </Button>
            <Button size="sm" className="gap-1.5" disabled={busy !== null} onClick={() => review(true)}>
              {busy === 'approve' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Approve
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function AdminTierRequestQueue() {
  const [requests, setRequests] = useState<AdminTierChangeRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setRequests(await tierChangeRequestService.listForAdmin())
    } catch (err) {
      console.error('[AdminTierRequestQueue] Failed to load requests', err)
      setError(err instanceof Error ? err.message : 'Could not load tier change requests.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pending = (requests ?? []).filter((r) => r.status === 'pending')
  const resolved = (requests ?? []).filter((r) => r.status !== 'pending')

  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Inbox className="h-5 w-5" aria-hidden="true" />
          Tier change requests
          {pending.length > 0 ? (
            <Badge className="border-0 bg-warning/15 text-warning">{pending.length} pending</Badge>
          ) : null}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !requests ? (
          <div className="flex items-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading requests…
          </div>
        ) : requests.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No tier change requests yet. Operators can request one from their commercial page.
          </p>
        ) : (
          <>
            {pending.map((request) => (
              <RequestRow key={request.id} request={request} onReviewed={load} />
            ))}
            {resolved.length > 0 ? (
              <div className="space-y-3 pt-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  History
                </p>
                {resolved.slice(0, 10).map((request) => (
                  <RequestRow key={request.id} request={request} onReviewed={load} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
