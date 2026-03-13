import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  RefreshCw,
  Upload,
  XCircle,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GlassCard } from '@/components/ui/glass'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

import { PartnerVerificationHub } from './verification/PartnerVerificationHub'

// ─── Required business docs (tour operators only) ───────────────────────────

const REQUIRED_TOUR_OP_DOCS: { id: string; title: string }[] = [
  { id: 'secp_certificate', title: 'SECP Certificate' },
  { id: 'tourism_license',  title: 'Tourism License (DTS)' },
  { id: 'tax_certificate',  title: 'Tax Registration (NTN)' },
]

async function fetchProfileVerificationUrls(
  userId: string,
  roleType: string,
): Promise<Record<string, string>> {
  if (roleType !== 'tour_operator') return {}
  const { data } = await supabase
    .from('tour_operator_profiles')
    .select('verification_urls')
    .eq('user_id', userId)
    .maybeSingle()
  return (data?.verification_urls as Record<string, string>) ?? {}
}

// ─── Fetch latest request for this user ──────────────────────────────────────

async function fetchMyLatestRequest(userId: string, roleType: string) {
  const { data, error } = await supabase
    .from('partner_verification_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('partner_type', roleType)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// ─── Step indicator ───────────────────────────────────────────────────────────

type StepState = 'complete' | 'active' | 'waiting'

function Step({ label, state }: { label: string; state: StepState }) {
  const icon =
    state === 'complete' ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : state === 'active' ? (
      <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
    ) : (
      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
    )

  return (
    <div className={`flex items-center gap-3 ${state === 'waiting' ? 'opacity-40' : ''}`}>
      {icon}
      <span
        className={`text-sm font-medium ${state === 'complete' ? 'text-foreground' : state === 'active' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}
      >
        {label}
      </span>
    </div>
  )
}

// ─── Status Views ─────────────────────────────────────────────────────────────

function PendingView({ roleLabel, submittedAt }: { roleLabel: string; submittedAt: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <GlassCard className="p-8 flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Application Under Review</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Submitted{' '}
            {new Date(submittedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <p className="text-sm text-muted-foreground max-w-md">
          Our compliance team is reviewing your {roleLabel} application. You'll receive an in-app
          notification the moment a decision is made.
        </p>

        {/* Progress steps */}
        <div className="w-full max-w-xs space-y-3 mt-2 text-left">
          <Step label="Application submitted" state="complete" />
          <Step label="Under review" state="active" />
          <Step label="Decision" state="waiting" />
        </div>

        <p className="text-xs text-muted-foreground">Typical review time: 1–3 business days</p>
      </GlassCard>
    </motion.div>
  )
}

function RejectedView({
  reason,
  roleLabel,
  onResubmit,
}: {
  reason: string | null
  roleLabel: string
  onResubmit: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <GlassCard className="p-8 flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Application Not Approved</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Please review the feedback below and re-submit
          </p>
        </div>

        {reason && (
          <div className="w-full text-left p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
              Reason from review team
            </p>
            <p className="text-sm text-foreground">{reason}</p>
          </div>
        )}

        <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={onResubmit}>
          Re-submit Application <ChevronRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Fix the issues mentioned above and re-submit. Your application will go back into the
          review queue.
        </p>
      </GlassCard>
    </motion.div>
  )
}

function InfoRequestedView({
  message,
  onResubmit,
}: {
  message: string | null
  onResubmit: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <GlassCard className="p-8 flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <MessageSquare className="h-10 w-10 text-purple-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Additional Information Needed</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Our team has a question about your application
          </p>
        </div>

        {message && (
          <div className="w-full text-left p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
              Message from review team
            </p>
            <p className="text-sm text-foreground">{message}</p>
          </div>
        )}

        <Button className="gap-2" onClick={onResubmit}>
          Update & Re-submit <ChevronRight className="h-4 w-4" />
        </Button>
      </GlassCard>
    </motion.div>
  )
}

function ApprovedView({
  roleLabel,
  missingDocs,
  onUploadDocs,
}: {
  roleLabel: string
  missingDocs: { id: string; title: string }[]
  onUploadDocs: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <GlassCard className="p-8 flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Verified Partner ✓</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your {roleLabel} account is active
          </p>
        </div>
        <div className="w-full max-w-xs space-y-3 text-left">
          <Step label="Application submitted" state="complete" />
          <Step label="Under review" state="complete" />
          <Step label="Approved" state="complete" />
        </div>
        <p className="text-sm text-muted-foreground">
          You have full access to all {roleLabel} features — listings, tours, and analytics.
        </p>
      </GlassCard>

      {/* Missing business documents — always shown until all are uploaded */}
      {missingDocs.length > 0 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Business documents still required
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Your identity (CNIC) is verified, but the following compliance documents are
                missing. Please upload them to remain in good standing.
              </p>
            </div>
          </div>

          <ul className="space-y-2 pl-1">
            {missingDocs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                {doc.title}
              </li>
            ))}
          </ul>

          <Button
            size="sm"
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white border-0"
            onClick={onUploadDocs}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Missing Documents
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VerificationStatusPage() {
  const { user, activeRole } = useAuth()

  const roleType = activeRole?.role_type ?? ''
  const roleLabel = roleType === 'hotel_manager' ? 'Hotel Manager' : 'Tour Operator'
  const verificationStatus = activeRole?.verification_status ?? 'incomplete'

  const {
    data: latestRequest,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['my-verification-request', user?.id, roleType],
    queryFn: () => fetchMyLatestRequest(user!.id, roleType),
    enabled: !!user && !!roleType && roleType !== 'traveller',
    staleTime: 30_000,
  })

  const { data: uploadedDocUrls = {} } = useQuery({
    queryKey: ['my-verification-urls', user?.id, roleType],
    queryFn: () => fetchProfileVerificationUrls(user!.id, roleType),
    enabled: !!user && roleType === 'tour_operator',
    staleTime: 30_000,
  })

  const missingDocs = REQUIRED_TOUR_OP_DOCS.filter(
    (doc) => !uploadedDocUrls[doc.id],
  )

  const showHub =
    verificationStatus === 'incomplete' ||
    verificationStatus === 'rejected' ||
    latestRequest?.status === 'rejected' ||
    latestRequest?.status === 'info_requested'

  const effectiveStatus = latestRequest?.status ?? verificationStatus

  const [resubmitting, setResubmitting] = useState(false)
  const handleResubmit = () => setResubmitting(true)

  // For rejected users: go straight to the re-upload hub immediately.
  // The hub shows the rejection reason banner + fresh upload widgets.
  // No extra "Re-submit Application" click needed.
  const isRejected =
    verificationStatus === 'rejected' ||
    latestRequest?.status === 'rejected'

  if (isRejected || resubmitting) {
    return <PartnerVerificationHub />
  }

  return (
    <div className="min-h-screen bg-muted/30 font-sans pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-black text-foreground tracking-tighter text-xl uppercase italic">
              Verification Status
            </h1>
            <p className="text-sm text-muted-foreground">
              {roleLabel} · {user?.email}
            </p>
          </div>
          {!isLoading && (
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : effectiveStatus === 'approved' ? (
          <ApprovedView
            roleLabel={roleLabel}
            missingDocs={missingDocs}
            onUploadDocs={() => setResubmitting(true)}
          />
        ) : effectiveStatus === 'pending' || effectiveStatus === 'under_review' ? (
          <PendingView
            roleLabel={roleLabel}
            submittedAt={latestRequest?.submitted_at ?? new Date().toISOString()}
          />
        ) : effectiveStatus === 'rejected' ? (
          <RejectedView
            reason={latestRequest?.decision_reason ?? null}
            roleLabel={roleLabel}
            onResubmit={handleResubmit}
          />
        ) : effectiveStatus === 'info_requested' ? (
          <InfoRequestedView
            message={latestRequest?.decision_reason ?? null}
            onResubmit={handleResubmit}
          />
        ) : (
          /* incomplete — show the full hub */
          <PartnerVerificationHub />
        )}
      </div>
    </div>
  )
}
