import {
  ArrowRight,
  Briefcase,
  Check,
  FileCheck,
  FileText,
  Loader2,
  ScrollText,
  Upload,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService'
import { type RequiredDoc, requiredBusinessDocs } from '@/features/verification/partnerCountry'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface BusinessDocsSubFlowProps {
  onComplete: (data: Record<string, string>) => void
  initialData?: any
  /** ISO-3166 alpha-2 of the partner's country; NULL/PK → Pakistan document set. */
  country?: string | null
}

const DOC_ICONS = {
  incorporation: ScrollText,
  license: FileCheck,
  tax: FileText,
} as const

export function BusinessDocsSubFlow({ onComplete, initialData, country }: BusinessDocsSubFlowProps) {
  const { user } = useAuth()
  const [urls, setUrls] = useState<Record<string, string>>(initialData || {})
  const [isUploading, setIsUploading] = useState<string | null>(null)

  const REQUIRED_DOCS: RequiredDoc[] = useMemo(() => requiredBusinessDocs(country), [country])

  const handleUpload = async (id: string, file: File) => {
    if (!user?.id) return
    setIsUploading(id)
    try {
      // `id` (secp_certificate, business_registration, tourism_license, …) is a valid kyc_documents
      // document_type. Upload to the PRIVATE kyc bucket — never a public URL. We track presence with a
      // marker; the actual file is read later via a signed URL by owner/admin.
      await tourOperatorService.uploadTrustDoc(file, id, 'tour_operator')
      const nextUrls = { ...urls, [id]: 'uploaded' }
      setUrls(nextUrls)
      toast.success('Document uploaded!')
    } catch (error: any) {
      toast.error(error?.message || 'Upload failed')
    } finally {
      setIsUploading(null)
    }
  }

  const isAllComplete = REQUIRED_DOCS.filter((doc) => !doc.optional).every((doc) => !!urls[doc.id])

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
          <Briefcase className="w-8 h-8" />
        </div>
        <h4 className="text-2xl font-black text-foreground tracking-tight italic uppercase">
          Business Credentials
        </h4>
        <p className="text-muted-foreground mt-2 font-medium">
          Please provide your official registration documents to verify your business status.
        </p>
      </div>

      <div className="space-y-4">
        {REQUIRED_DOCS.map((doc) => {
          const Icon = DOC_ICONS[doc.icon]
          return (
          <Card
            key={doc.id}
            className={cn(
              'p-6 rounded-[32px] border-border/50 transition-all',
              urls[doc.id] ? 'bg-primary/[0.03] border-primary/20' : 'bg-background',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center',
                    urls[doc.id]
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground/70',
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-foreground text-base">
                    {doc.title}
                    {doc.optional && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        Optional
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest leading-none mt-1">
                    {doc.desc}
                  </p>
                </div>
              </div>

              <div className="relative">
                <input
                  type="file"
                  id={`doc-${doc.id}`}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(doc.id, e.target.files[0])}
                  disabled={!!isUploading}
                />
                {urls[doc.id] ? (
                  <div className="bg-background text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/10 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Complete
                  </div>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border/60 hover:border-primary font-black uppercase tracking-widest h-10 px-6"
                  >
                    <label htmlFor={`doc-${doc.id}`} className="cursor-pointer">
                      {isUploading === doc.id ? (
                        <Loader2 className="animate-spin mr-2 w-4 h-4" />
                      ) : (
                        <Upload className="mr-2 w-4 h-4" />
                      )}
                      Upload
                    </label>
                  </Button>
                )}
              </div>
            </div>
          </Card>
          )
        })}
      </div>

      <div className="mt-12 flex justify-center">
        <Button
          className="rounded-2xl h-14 w-full sm:w-auto sm:min-w-[300px] bg-primary-gradient text-primary-foreground px-6 sm:px-12 font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20"
          disabled={!isAllComplete}
          onClick={() => onComplete(urls)}
        >
          Finalize Verification <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
