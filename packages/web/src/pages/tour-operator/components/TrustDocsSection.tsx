import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { CheckCircle2, Clock, Eye, Loader2, Upload, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService'

/**
 * Trust-document uploader for the Business Profile page. Uploads go to the PRIVATE kyc bucket via
 * the operator-doc-upload edge function (never a public URL); the current status per type is read
 * from kyc_documents, and viewing a document uses a short-lived signed URL. Replaces the old
 * "paste a public URL" inputs.
 */

const TRUST_DOCS: Array<{ type: string; label: string; desc: string }> = [
  { type: 'business_registration', label: 'Business registration', desc: 'Company registration / trade licence' },
  { type: 'insurance', label: 'Insurance', desc: 'Valid liability / travel insurance document' },
  { type: 'vehicle_docs', label: 'Vehicle documents', desc: 'Ownership or operating docs for listed fleet' },
  { type: 'guide_license', label: 'Guide licence', desc: 'Guide licensing or qualification document' },
]

type DocState = { status: string; version: number }

const STATUS_STYLES: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  approved: { label: 'Approved', cls: 'text-emerald-600', Icon: CheckCircle2 },
  pending: { label: 'Pending review', cls: 'text-amber-600', Icon: Clock },
  rejected: { label: 'Rejected — re-upload', cls: 'text-destructive', Icon: XCircle },
}

export function TrustDocsSection({ userId }: { userId: string }) {
  const [docs, setDocs] = useState<Record<string, DocState>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = async () => {
    try {
      const rows = await tourOperatorService.listTrustDocs(userId)
      const map: Record<string, DocState> = {}
      for (const r of rows) map[r.document_type] = { status: r.status, version: r.version }
      setDocs(map)
    } catch {
      /* non-fatal — the section still renders with upload controls */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleUpload = async (type: string, file: File) => {
    setBusy(type)
    try {
      await tourOperatorService.uploadTrustDoc(file, type, 'tour_operator')
      toast.success('Document uploaded — pending admin review')
      await load()
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setBusy(null)
    }
  }

  const handleView = async (type: string) => {
    setBusy(type)
    try {
      const url = await tourOperatorService.getTrustDocUrl(userId, type)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      else toast.error('Could not open document')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 p-4">
      <div>
        <h3 className="font-semibold text-foreground">Verification documents</h3>
        <p className="text-sm text-muted-foreground">
          Uploaded privately and shared only with the TripAvail review team — never shown publicly. Approved
          documents light up the trust badges on your storefront.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {TRUST_DOCS.map((doc) => {
          const state = docs[doc.type]
          const status = state ? STATUS_STYLES[state.status] ?? STATUS_STYLES.pending : null
          const isBusy = busy === doc.type
          const inputId = `trustdoc-${doc.type}`
          return (
            <div key={doc.type} className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{doc.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{doc.desc}</p>
                </div>
                {status ? (
                  <span className={`flex items-center gap-1 text-[11px] font-semibold ${status.cls}`}>
                    <status.Icon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground/60">Not uploaded</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id={inputId}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  disabled={isBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handleUpload(doc.type, f)
                    e.target.value = '' // allow re-selecting the same file
                  }}
                />
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <label htmlFor={inputId} className="cursor-pointer">
                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {state ? 'Replace' : 'Upload'}
                  </label>
                </Button>
                {state && (
                  <Button variant="ghost" size="sm" className="gap-2" disabled={isBusy} onClick={() => void handleView(doc.type)}>
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading your documents…</p>}
    </div>
  )
}
