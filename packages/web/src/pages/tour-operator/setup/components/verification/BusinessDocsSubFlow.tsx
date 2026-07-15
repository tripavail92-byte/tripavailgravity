import {
  ArrowLeft,
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
  const [subStep, setSubStep] = useState<1 | 2>(1)

  const REQUIRED_DOCS: RequiredDoc[] = useMemo(() => requiredBusinessDocs(country), [country])
  const step1Docs = useMemo(() => REQUIRED_DOCS.filter((d) => d.step === 1), [REQUIRED_DOCS])
  const step2Docs = useMemo(() => REQUIRED_DOCS.filter((d) => d.step === 2), [REQUIRED_DOCS])
  const activeDocs = subStep === 1 ? step1Docs : step2Docs

  // Step 1 needs its required doc(s); Step 2 is optional and never blocks Finalize.
  const step1Complete = step1Docs.filter((d) => !d.optional).every((d) => !!urls[d.id])

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

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={cn(
              'h-1.5 w-8 rounded-full transition-all',
              subStep === s ? 'bg-primary' : s < subStep ? 'bg-primary/40' : 'bg-muted',
            )}
          />
        ))}
      </div>

      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
          <Briefcase className="w-8 h-8" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-primary/70 mb-1">
          Step {subStep} of 2
        </p>
        <h4 className="text-2xl font-black text-foreground tracking-tight italic uppercase">
          {subStep === 1 ? 'Business Registration' : 'Tour Licence'}
        </h4>
        <p className="text-muted-foreground mt-2 font-medium">
          {subStep === 1
            ? 'Upload your official company registration document to verify your business.'
            : 'Add your tourism / travel licence if you have one. This step is optional — you can finish without it.'}
        </p>
      </div>

      <div className="space-y-4">
        {activeDocs.map((doc) => {
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
                    accept="image/jpeg,image/png,image/webp,application/pdf"
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

      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
        {subStep === 2 && (
          <Button
            variant="outline"
            className="rounded-2xl h-14 w-full sm:w-auto px-8 font-black uppercase tracking-widest"
            onClick={() => setSubStep(1)}
          >
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
        )}
        {subStep === 1 ? (
          <Button
            className="rounded-2xl h-14 w-full sm:w-auto sm:min-w-[300px] bg-primary-gradient text-primary-foreground px-6 sm:px-12 font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20"
            disabled={!step1Complete}
            onClick={() => setSubStep(2)}
          >
            Continue <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        ) : (
          <Button
            className="rounded-2xl h-14 w-full sm:w-auto sm:min-w-[300px] bg-primary-gradient text-primary-foreground px-6 sm:px-12 font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20"
            onClick={() => onComplete(urls)}
          >
            Finalize Verification <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
