import {
  AlertTriangle,
  Check,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useRejectPartner, useRequestPartnerInfo } from '@/queries/adminQueries'

export const MIN_VERIFY_REASON_LEN = 12

export type PartnerRole = 'hotel_manager' | 'tour_operator'

/**
 * The shape of admin_get_partner_evidence (20260717000002).
 *
 * Verdicts and booleans only — no CNIC, no name, no DOB, no storage paths. That omission is the
 * point, not an oversight: raw identity data stays quarantined behind /admin/kyc, which is one
 * deep link away. If this interface ever needs `cnic_number`, the answer is the link.
 */
export interface PartnerEvidence {
  kyc_status: string | null
  kyc_session_id: string | null
  kyc_failure_code: string | null
  kyc_failure_reason: string | null
  kyc_reviewed_at: string | null
  kyc_reviewed_by_is_admin: boolean | null
  country_code: string | null
  required_business_doc: string | null
  has_business_doc: boolean | null
  has_optional_license: boolean | null
  ownership_type: string | null
  property_name: string | null
  property_address: string | null
  has_title_deed: boolean | null
  has_utility_bill: boolean | null
  has_property_photo: boolean | null
  has_submission: boolean | null
  submission_id: string | null
  submission_status: string | null
  submitted_at: string | null
  submission_version: number | null
  verification_status: string | null
  account_status: string | null
}

/** What the admin is attesting they had in front of them. Logged with the approval. */
type EvidenceAck = 'submission' | 'kyc_only' | 'none'

const DOC_LABELS: Record<string, string> = {
  secp_certificate: 'SECP certificate',
  business_registration: 'Business registration',
  tourism_license: 'Tourism licence',
  tour_license: 'Tourism licence',
}

function docLabel(id: string | null): string {
  if (!id) return 'Business registration'
  return DOC_LABELS[id] ?? id.replace(/_/g, ' ')
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** One line of the evidence checklist. A missing item is STATED, never omitted. */
function CheckLine({
  ok,
  label,
  detail,
}: {
  ok: boolean | null | undefined
  label: string
  detail?: string | null
}) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {ok ? (
        <Check className="h-4 w-4 shrink-0 mt-0.5 text-success" />
      ) : (
        <X className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/50" />
      )}
      <div className="min-w-0">
        <span className={ok ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
          {label}
        </span>
        {detail ? <p className="text-xs text-muted-foreground/80 mt-0.5">{detail}</p> : null}
      </div>
    </div>
  )
}

/** What actually happened, so the caller can say so. A single onVerified() callback meant Reject
 *  reported "verified — partner notified" — telling the admin the opposite of the truth. */
export type VerifyOutcome = 'approved' | 'rejected' | 'info_requested'

interface Props {
  open: boolean
  partnerId: string
  partnerName: string
  roleType: PartnerRole
  onClose: () => void
  onResolved: (outcome: VerifyOutcome) => void
}

/**
 * Approve a partner — with the evidence in front of you.
 *
 * The dialog this replaces asked "Verify Partner?" over a green reassurance box and called a
 * two-argument RPC. It showed the admin nothing about whether the person had ever been verified,
 * took no reason, and made approving a reviewed submission look identical to vouching for a
 * stranger. Since admin_verify_partner_direct approves with no documents on file, that meant the
 * platform's entire verification story could be bypassed by a confident click.
 */
export function PartnerVerifyDialog({
  open,
  partnerId,
  partnerName,
  roleType,
  onClose,
  onResolved,
}: Props) {
  const [evidence, setEvidence] = useState<PartnerEvidence | null>(null)
  const [loading, setLoading] = useState(true)
  // loadError = "we could not fetch the evidence", and it REPLACES the body (fail closed).
  // actionError = "your action failed", and it must NOT — reusing loadError for a failed reject
  // destroyed the checklist and dead-ended the dialog with no way back to the evidence.
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [ack, setAck] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Reject and Request-info used to live only on PendingReviewCard, on the permanently-empty
  // pending tab. That tab is gone, so they live here — next to the evidence they are a judgement
  // about. Without them an admin could only ever say yes.
  const rejectPartner = useRejectPartner()
  const requestInfo = useRequestPartnerInfo()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setActionError(null)
    setEvidence(null)
    setReason('')
    setAck(false)
    ;(async () => {
      const { data, error } = await (supabase as any).rpc('admin_get_partner_evidence', {
        p_user_id: partnerId,
        p_partner_type: roleType,
      })
      if (cancelled) return
      if (error) {
        // Fail closed and SAY so. Never quietly render an empty checklist — an admin would read
        // blank rows as "nothing on file" and approve on the strength of a failed query.
        setLoadError(error.message ?? 'Could not load this partner’s evidence')
      } else {
        const row = (Array.isArray(data) ? data[0] : data) ?? null
        if (!row) {
          // Zero rows means no user_roles row for this partner+type — the RPC's WHERE matched
          // nothing. Rendering the checklist with everything undefined would look identical to a
          // genuine "nothing on file", which is the one reading that must never be faked.
          setLoadError(
            `No ${roleType.replace('_', ' ')} role exists for this user — there is nothing to approve here.`,
          )
        } else {
          setEvidence(row)
        }
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [open, partnerId, roleType])

  const isManager = roleType === 'hotel_manager'

  // "Approved" is not enough. A kyc_sessions row can read approved with NO admin recorded as the
  // reviewer — that is the exact fingerprint of the self-approval hole 20260717000001 closed, and
  // treating it as verified identity would put a green "Identity verified" panel over precisely the
  // case the guard exists for. An unvouched approval is not evidence.
  const identityApproved =
    evidence?.kyc_status === 'approved' && evidence?.kyc_reviewed_by_is_admin !== false

  // Does a submission EXIST? A fact, reported as-is on the checklist.
  const hasSubmission = !!evidence?.has_submission

  // Is it evidence FOR APPROVING? Different question. A submission that was already REJECTED is
  // not — otherwise the dialog says "Reviewing a submission on file" over a rejection and logs
  // evidence_ack='submission' for it. Note verify_direct only looks up requests in
  // ('pending','under_review','info_requested'); against a closed one it writes a synthetic
  // "no submission on file" record, so claiming 'submission' there would misdescribe what the RPC
  // actually did.
  const submissionUsable =
    hasSubmission &&
    ['pending', 'under_review', 'info_requested', 'approved'].includes(
      evidence?.submission_status ?? '',
    )

  // Documents can exist without a submission — a partner who uploaded their SECP certificate but
  // never pressed Finish. Calling that "No evidence on file" and logging evidence_ack='none' would
  // be false, and would force an attestation for a partner whose paperwork is sitting right there.
  const hasAnyDoc = !!(
    evidence?.has_business_doc ||
    evidence?.has_title_deed ||
    evidence?.has_utility_bill ||
    evidence?.has_property_photo
  )

  const identityConflict =
    evidence?.kyc_status === 'rejected' || evidence?.kyc_status === 'revoked'

  // Which of the three shapes are we in? This is what the whole dialog turns on.
  const ackValue: EvidenceAck = submissionUsable
    ? 'submission'
    : identityApproved || hasAnyDoc
      ? 'kyc_only'
      : 'none'
  const isBlindVouch = ackValue === 'none'

  const reasonOk = reason.trim().length >= MIN_VERIFY_REASON_LEN
  const canSubmit = !loading && !loadError && reasonOk && (!isBlindVouch || ack) && !submitting

  const handleConfirm = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setActionError(null)
    try {
      const { error } = await (supabase as any).rpc('admin_verify_partner_direct', {
        p_user_id: partnerId,
        p_partner_type: roleType,
        p_reason: reason.trim(),
        p_evidence_ack: ackValue,
      })
      if (error) throw error
      onResolved('approved')
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to verify partner')
    } finally {
      setSubmitting(false)
    }
  }

  // Both need a request row to act on — you cannot reject a submission that was never made. So
  // these only render when one exists, which is also why they can't replace Approve.
  const submissionId = evidence?.submission_id ?? null

  const handleReject = async () => {
    if (!submissionId || !reasonOk) return
    setSubmitting(true)
    setActionError(null)
    try {
      await rejectPartner.mutateAsync({
        userId: partnerId,
        partnerType: roleType,
        requestId: submissionId,
        reason: reason.trim(),
      })
      onResolved('rejected')
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to reject partner')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestInfo = async () => {
    if (!submissionId || !reasonOk) return
    setSubmitting(true)
    setActionError(null)
    try {
      await requestInfo.mutateAsync({
        userId: partnerId,
        partnerType: roleType,
        requestId: submissionId,
        message: reason.trim(),
      })
      onResolved('info_requested')
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to request more information')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !submitting) onClose()
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-4rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Verify {partnerName}</DialogTitle>
          <DialogDescription>
            {isManager ? 'Hotel manager' : 'Tour operator'} — approving lets them publish and take
            bookings immediately.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading evidence…
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {loadError}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Identity contradicts governance — the case the two admin pages could never show
                together. Worth shouting about: this partner's identity was rejected or withdrawn. */}
            {identityConflict && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                <p className="text-sm text-destructive">
                  Identity was <strong>{evidence?.kyc_status}</strong> on{' '}
                  {fmtDate(evidence?.kyc_reviewed_at ?? null)}. Approving now overrides that
                  decision.
                </p>
              </div>
            )}

            {/* IDENTITY — verdict only. The documents themselves live on /admin/kyc. */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Identity
              </h4>
              <div className="mt-1">
                <CheckLine
                  ok={identityApproved}
                  label={
                    evidence?.kyc_status
                      ? `Identity check: ${evidence.kyc_status.replace(/_/g, ' ')}`
                      : 'No identity check on file'
                  }
                  detail={
                    evidence?.kyc_failure_code
                      ? `${evidence.kyc_failure_code === 'name_mismatch' || evidence.kyc_failure_code === 'duplicate_cnic' ? '⚠ Possible fraud signal — ' : ''}${evidence.kyc_failure_reason ?? evidence.kyc_failure_code}`
                      : identityApproved && evidence?.kyc_reviewed_by_is_admin === false
                        ? '⚠ Marked approved, but no admin is recorded as the reviewer'
                        : identityApproved
                          ? `Reviewed ${fmtDate(evidence?.kyc_reviewed_at ?? null)}`
                          : null
                  }
                />
                {evidence?.kyc_session_id && (
                  <Button asChild variant="link" size="sm" className="h-auto px-0 text-xs">
                    <Link to={`/admin/kyc?session=${evidence.kyc_session_id}`}>
                      Open documents in KYC <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </section>

            {/* BUSINESS — the country-conditional set they were actually asked for. */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Business
              </h4>
              <div className="mt-1">
                <CheckLine
                  ok={evidence?.has_business_doc}
                  label={`${docLabel(evidence?.required_business_doc ?? null)} on file`}
                  detail={`Required for ${evidence?.country_code ?? 'PK'}`}
                />
                <CheckLine
                  ok={evidence?.has_optional_license}
                  label="Tourism licence on file"
                  detail="Optional"
                />
              </div>
            </section>

            {/* PROPERTY — hotel managers only. This is the whole reason the roles need separate
                flows: an operator has no analogue for any of it. */}
            {isManager && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Property
                </h4>
                <div className="mt-1">
                  <CheckLine
                    ok={evidence?.has_title_deed}
                    label="Title deed or lease"
                    detail={
                      evidence?.ownership_type
                        ? `Claims to be: ${evidence.ownership_type}${evidence.ownership_type === 'lease' ? ' — a lease is not ownership; check what the deed actually proves' : ''}`
                        : 'Ownership type not stated'
                    }
                  />
                  <CheckLine
                    ok={evidence?.has_utility_bill}
                    label="Utility bill"
                    detail={
                      evidence?.property_address
                        ? `Should match: ${evidence.property_address}`
                        : 'No property address on the profile to compare against'
                    }
                  />
                  <CheckLine
                    ok={evidence?.has_property_photo}
                    label="Live property photo"
                    detail={evidence?.property_name ? `Property: ${evidence.property_name}` : null}
                  />
                </div>
              </section>
            )}

            {/* SUBMISSION */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Submission
              </h4>
              <div className="mt-1">
                <CheckLine
                  ok={hasSubmission}
                  label={
                    hasSubmission
                      ? `Submitted ${fmtDate(evidence?.submitted_at ?? null)}`
                      : 'Never submitted for review'
                  }
                  detail={
                    hasSubmission
                      ? `Status: ${evidence?.submission_status} · version ${evidence?.submission_version}`
                      : 'This partner has not applied — nothing was ever sent to the review queue'
                  }
                />
              </div>
            </section>

            {/* THE BLIND VOUCH. Deliberately not a primary button — the admin is about to make a
                claim the platform has nothing to back. */}
            {isBlindVouch ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">No evidence on file</p>
                    <p className="mt-1 text-sm text-destructive/90">
                      You are vouching for this partner with nothing to back it. They will be able
                      to publish and take payments immediately. This is logged against your account.
                    </p>
                  </div>
                </div>
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-destructive">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-destructive"
                  />
                  I have verified this partner outside the platform
                </label>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-foreground">
                <FileText className="h-4 w-4 shrink-0 mt-0.5 text-success" />
                <span>
                  {submissionUsable
                    ? 'Reviewing a submission on file.'
                    : hasAnyDoc
                      ? 'Documents are on file, but were never submitted for review.'
                      : 'Identity verified, but no business documents were submitted.'}
                </span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reason
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isBlindVouch
                    ? 'How did you verify this partner? (min 12 characters)'
                    : 'Why are you approving? (min 12 characters)'
                }
                className="mt-1.5 min-h-[72px]"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {reason.trim().length}/{MIN_VERIFY_REASON_LEN} — recorded in the audit log.
              </p>
            </div>
          </div>
        )}

        {/* An action failure keeps the evidence on screen — it is not a load failure and must not
            be dressed as one. */}
        {actionError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <p className="text-sm text-destructive">{actionError}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            {/* Only meaningful against a real submission. */}
            {submissionId && !loading && !loadError && (
              <>
                <Button
                  variant="ghost"
                  onClick={handleRequestInfo}
                  disabled={!reasonOk || submitting}
                  title={!reasonOk ? `Add a reason (min ${MIN_VERIFY_REASON_LEN} chars)` : undefined}
                >
                  Request info
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={handleReject}
                  disabled={!reasonOk || submitting}
                  title={!reasonOk ? `Add a reason (min ${MIN_VERIFY_REASON_LEN} chars)` : undefined}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
          <Button
            variant={isBlindVouch ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="gap-1.5"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {submitting
              ? 'Verifying…'
              : isBlindVouch
                ? 'Approve without documents'
                : 'Approve partner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
