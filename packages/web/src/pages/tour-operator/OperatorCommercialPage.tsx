import { format } from 'date-fns'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Download,
  Gem,
  Rocket,
  Scale,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/PageHeader'
import { motion } from 'motion/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  type CommercialPromotion,
  commercialService,
  type CommercialTourOption,
  type OperatorBillingReportRow,
  type OperatorPayoutDisputeCase,
  type OperatorPayoutReportRow,
} from '@/features/commercial/services/commercialService'
import { useAuth } from '@/hooks/useAuth'

function formatMoney(value: number) {
  return `PKR ${value.toLocaleString()}`
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return format(new Date(value), 'MMM d, yyyy')
}

function formatTimestamp(value?: string | null) {
  if (!value) return '—'
  return format(new Date(value), 'MMM d, yyyy h:mm a')
}

function formatPromoAttribution(
  owner?: string | null,
  fundingSource?: string | null,
  discountValue?: number,
) {
  if (!discountValue || discountValue <= 0) return '—'
  const parts = [owner, fundingSource].filter(Boolean)
  return `${formatMoney(discountValue)}${parts.length ? ` · ${parts.join(' / ')}` : ''}`
}

function statusTone(status: string) {
  if (status === 'eligible' || status === 'paid') return 'text-emerald-600'
  if (status === 'scheduled') return 'text-sky-600'
  if (status === 'on_hold') return 'text-amber-600'
  return 'text-muted-foreground'
}

type OperatorPromoFormState = {
  title: string
  code: string
  description: string
  applicableTourId: string
  discountType: 'fixed_amount' | 'percentage'
  discountValue: string
  maxDiscountValue: string
  startsAt: string
  endsAt: string
  isActive: 'active' | 'inactive'
}

type OperatorDisputeFormState = {
  payoutItemId: string
  disputeCategory: string
  requestedAction: string
  reasonSummary: string
  evidenceNotes: string
}

function createEmptyOperatorPromoForm(): OperatorPromoFormState {
  return {
    title: '',
    code: '',
    description: '',
    applicableTourId: 'all',
    discountType: 'fixed_amount',
    discountValue: '',
    maxDiscountValue: '',
    startsAt: '',
    endsAt: '',
    isActive: 'active',
  }
}

function createEmptyDisputeForm(): OperatorDisputeFormState {
  return {
    payoutItemId: '',
    disputeCategory: 'other',
    requestedAction: 'manual_reconciliation',
    reasonSummary: '',
    evidenceNotes: '',
  }
}

function suggestedDisputeCategory(row: OperatorPayoutReportRow) {
  if (row.payout_status === 'on_hold') return 'payout_hold'
  if (row.payout_status === 'recovery_pending' || row.recovery_deduction_amount > 0) {
    return 'recovery_deduction'
  }
  if (row.refund_amount > 0) return 'refund_mismatch'
  if (row.promo_funding_source === 'operator' && row.promo_discount_value > 0) {
    return 'promo_funding_mismatch'
  }
  if (row.commission_remaining > 0) return 'commission_mismatch'
  return 'missing_payout'
}

function suggestedRequestedAction(row: OperatorPayoutReportRow) {
  if (row.payout_status === 'on_hold') return 'release_payout'
  if (row.payout_status === 'recovery_pending' || row.recovery_deduction_amount > 0) {
    return 'review_recovery'
  }
  if (row.refund_amount > 0) return 'review_refund'
  if (row.promo_funding_source === 'operator' && row.promo_discount_value > 0) {
    return 'review_promo_funding'
  }
  if (row.commission_remaining > 0) return 'review_commission'
  return 'manual_reconciliation'
}

function toDateTimeInputValue(value?: string | null) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const offset = parsed.getTimezoneOffset()
  const normalized = new Date(parsed.getTime() - offset * 60_000)
  return normalized.toISOString().slice(0, 16)
}

function formatPromoWindow(startsAt?: string | null, endsAt?: string | null) {
  if (!startsAt && !endsAt) return 'Always on'
  if (startsAt && endsAt) return `${formatTimestamp(startsAt)} to ${formatTimestamp(endsAt)}`
  if (startsAt) return `Starts ${formatTimestamp(startsAt)}`
  return `Ends ${formatTimestamp(endsAt)}`
}

function formatStatusLabel(value?: string | null) {
  if (!value) return '—'
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatTierName(value?: string | null) {
  if (!value) return '—'
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toCsvCell(value: unknown) {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

function downloadCsvFile(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const csvContent = [headers, ...rows]
    .map((row) => row.map((value) => toCsvCell(value)).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function payoutStatusExplanation(status?: string | null) {
  switch (status) {
    case 'eligible':
      return 'Completed bookings cleared the settlement window and are ready for the next payout batch.'
    case 'scheduled':
      return 'This payout item is assigned to a batch and is waiting for its scheduled release date.'
    case 'paid':
      return 'Funds have been released to the operator and recorded as paid in the payout ledger.'
    case 'on_hold':
      return 'Finance has paused release because of a manual review, risk state, or unresolved operator issue.'
    case 'recovery_pending':
      return 'A prior recovery balance is being deducted before the remaining payable amount can be released.'
    case 'reversed':
      return 'This payout item was reversed after batch creation and no operator funds remain scheduled for it.'
    case 'not_ready':
      return 'The booking has not yet become payout-eligible, usually because travel or settlement completion is still pending.'
    default:
      return 'This payout state will update automatically as the booking clears settlement, review, and recovery checkpoints.'
  }
}

function exportFeedbackToneClass(tone: 'success' | 'error') {
  return tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-destructive/30 bg-destructive/5 text-destructive'
}

function disputeCaseSummary(row: OperatorPayoutReportRow) {
  if (row.payout_status === 'on_hold') {
    return {
      label: 'Payout hold',
      detail: row.hold_reason ?? 'Finance review is blocking this payout item.',
      nextStep: 'Review finance hold reason and keep booking evidence ready.',
    }
  }

  if (row.payout_status === 'recovery_pending' || row.recovery_deduction_amount > 0) {
    return {
      label: 'Recovery deduction',
      detail:
        row.recovery_deduction_amount > 0
          ? `${formatMoney(row.recovery_deduction_amount)} is still being offset from this payout item.`
          : 'A recovery balance must be resolved before full payout release.',
      nextStep: 'Match the recovery deduction against refund or offline collection records.',
    }
  }

  if (row.refund_amount > 0) {
    return {
      label: 'Refund / dispute exposure',
      detail: `${formatMoney(row.refund_amount)} has been refunded or disputed against this booking.`,
      nextStep: 'Confirm traveler outcome and preserve the decision trail in the booking thread.',
    }
  }

  if (row.commission_remaining > 0) {
    return {
      label: 'Commission still outstanding',
      detail: `${formatMoney(row.commission_remaining)} remains in commission settlement for this booking.`,
      nextStep: 'Wait for settlement to complete before expecting full operator release.',
    }
  }

  return {
    label: 'Reconciliation review',
    detail:
      'This booking should be checked against payout, refund, and promo records before escalation.',
    nextStep: 'Verify payout status, promo source, and traveler outcome.',
  }
}

function buildPayoutTimelineEvents(
  row: OperatorPayoutReportRow,
  selectedBatch?: { batch_reference: string; scheduled_for: string } | null,
) {
  const events: Array<{
    label: string
    timestamp: string | null
    detail: string
    tone: 'default' | 'warning' | 'success'
  }> = []

  if (row.travel_date) {
    events.push({
      label: 'Travel date',
      timestamp: row.travel_date,
      detail: 'The booking reached its service date and entered post-trip settlement checks.',
      tone: 'default',
    })
  }

  if (row.payout_due_at) {
    events.push({
      label: 'Eligible checkpoint',
      timestamp: row.payout_due_at,
      detail: 'This is the payout readiness date after the settlement window clears.',
      tone: 'default',
    })
  }

  if (
    selectedBatch?.batch_reference &&
    row.batch_reference &&
    row.batch_reference === selectedBatch.batch_reference
  ) {
    events.push({
      label: 'Assigned to batch',
      timestamp: selectedBatch.scheduled_for,
      detail: `${selectedBatch.batch_reference} is the scheduled release batch for this payout item.`,
      tone: 'default',
    })
  }

  if (row.payout_status === 'paid') {
    events.push({
      label: 'Paid out',
      timestamp: row.paid_at ?? selectedBatch?.scheduled_for ?? null,
      detail: 'Funds were released to the operator and this payout item is closed.',
      tone: 'success',
    })
  } else if (row.payout_status === 'on_hold') {
    events.push({
      label: 'Manual hold',
      timestamp: row.payout_due_at ?? selectedBatch?.scheduled_for ?? null,
      detail: row.hold_reason ?? 'Finance paused this payout item for manual review.',
      tone: 'warning',
    })
  } else if (row.payout_status === 'recovery_pending') {
    events.push({
      label: 'Recovery deduction',
      timestamp: row.payout_due_at ?? selectedBatch?.scheduled_for ?? null,
      detail:
        row.recovery_deduction_amount > 0
          ? `${formatMoney(row.recovery_deduction_amount)} is being deducted before release.`
          : 'Recovery settlement is still pending on this booking.',
      tone: 'warning',
    })
  } else if (row.payout_status === 'scheduled') {
    events.push({
      label: 'Awaiting release',
      timestamp: selectedBatch?.scheduled_for ?? row.payout_batch_scheduled_for,
      detail: 'This payout item is queued inside a scheduled batch and waiting for release.',
      tone: 'default',
    })
  }

  if (row.refund_amount > 0) {
    events.push({
      label: 'Refund impact',
      timestamp: row.paid_at ?? row.payout_due_at ?? null,
      detail: `${formatMoney(row.refund_amount)} reduced the payout path for this booking.`,
      tone: 'warning',
    })
  }

  return events
}

function toOperatorPromoForm(promotion: CommercialPromotion): OperatorPromoFormState {
  return {
    title: promotion.title,
    code: promotion.code,
    description: promotion.description ?? '',
    applicableTourId: promotion.applicable_tour_id ?? 'all',
    discountType: promotion.discount_type,
    discountValue: promotion.discount_value ? promotion.discount_value.toString() : '',
    maxDiscountValue: promotion.max_discount_value ? promotion.max_discount_value.toString() : '',
    startsAt: toDateTimeInputValue(promotion.starts_at),
    endsAt: toDateTimeInputValue(promotion.ends_at),
    isActive: promotion.is_active ? 'active' : 'inactive',
  }
}

export default function OperatorCommercialPage() {
  const { user } = useAuth()

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'tour_operator')
    return () => document.documentElement.removeAttribute('data-role')
  }, [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingRows, setBillingRows] = useState<OperatorBillingReportRow[]>([])
  const [payoutRows, setPayoutRows] = useState<OperatorPayoutReportRow[]>([])
  const [selectedBillingCycleId, setSelectedBillingCycleId] = useState<string | null>(null)
  const [selectedPayoutBatchId, setSelectedPayoutBatchId] = useState<string | null>(null)
  const [profile, setProfile] =
    useState<
      Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['profile']
    >(null)
  const [tier, setTier] =
    useState<Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['tier']>(
      null,
    )
  const [performance, setPerformance] =
    useState<
      Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['performance']
    >(null)
  const [payoutBatches, setPayoutBatches] = useState<
    Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['payoutBatches']
  >([])
  const [promotions, setPromotions] = useState<CommercialPromotion[]>([])
  const [promotionTours, setPromotionTours] = useState<CommercialTourOption[]>([])
  const [promoForm, setPromoForm] = useState<OperatorPromoFormState>(() =>
    createEmptyOperatorPromoForm(),
  )
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null)
  const [promoSubmitting, setPromoSubmitting] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [disputeCases, setDisputeCases] = useState<OperatorPayoutDisputeCase[]>([])
  const [disputeForm, setDisputeForm] = useState<OperatorDisputeFormState>(() =>
    createEmptyDisputeForm(),
  )
  const [disputeSubmitting, setDisputeSubmitting] = useState(false)
  const [disputeFeedback, setDisputeFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)
  const [invoiceExportFeedback, setInvoiceExportFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)
  const [payoutExportFeedback, setPayoutExportFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)
  const [reconciliationExportFeedback, setReconciliationExportFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const [overview, nextPromotions, nextTours, nextDisputeCases] = await Promise.all([
          commercialService.getOperatorCommercialOverview(user.id),
          commercialService.listOperatorPromotions(user.id),
          commercialService.listCommercialTours(user.id),
          commercialService.listOperatorPayoutDisputeCases(user.id),
        ])
        if (cancelled) return

        setProfile(overview.profile)
        setTier(overview.tier)
        setPerformance(overview.performance)
        setBillingRows(overview.billingRows)
        setPayoutRows(overview.payoutRows)
        setPayoutBatches(overview.payoutBatches)
        setSelectedBillingCycleId((current) => {
          if (current && overview.billingRows.some((row) => row.billing_cycle_id === current)) {
            return current
          }
          return overview.billingRows[0]?.billing_cycle_id ?? null
        })
        setSelectedPayoutBatchId((current) => {
          if (current && overview.payoutBatches.some((batch) => batch.id === current)) {
            return current
          }
          return overview.payoutBatches[0]?.id ?? null
        })
        setPromotions(nextPromotions)
        setPromotionTours(nextTours)
        setDisputeCases(nextDisputeCases)
        setError(null)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Failed to load commercial data',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const handlePromoFormChange = (field: keyof OperatorPromoFormState, value: string) => {
    setPromoForm((current) => ({ ...current, [field]: value }))
  }

  const resetPromoForm = () => {
    setPromoForm(createEmptyOperatorPromoForm())
    setEditingPromotionId(null)
    setPromoError(null)
  }

  const handleEditPromotion = (promotion: CommercialPromotion) => {
    setEditingPromotionId(promotion.id)
    setPromoForm(toOperatorPromoForm(promotion))
    setPromoError(null)
  }

  const handleSavePromotion = async () => {
    if (!user?.id) return

    const title = promoForm.title.trim()
    const code = promoForm.code.trim().toUpperCase()
    const discountValue = Number(promoForm.discountValue)
    const maxDiscountValue = promoForm.maxDiscountValue.trim()
      ? Number(promoForm.maxDiscountValue)
      : null

    if (!title || !code) {
      setPromoError('Title and promo code are required')
      return
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setPromoError('Discount value must be greater than zero')
      return
    }

    if (promoForm.discountType === 'percentage' && discountValue > 100) {
      setPromoError('Percentage discounts cannot exceed 100')
      return
    }

    if (
      maxDiscountValue !== null &&
      (!Number.isFinite(maxDiscountValue) || maxDiscountValue <= 0)
    ) {
      setPromoError('Max discount must be greater than zero when provided')
      return
    }

    try {
      setPromoSubmitting(true)
      setPromoError(null)

      const payload = {
        operator_user_id: user.id,
        applicable_tour_id:
          promoForm.applicableTourId === 'all' ? null : promoForm.applicableTourId,
        title,
        code,
        description: promoForm.description.trim() || null,
        owner_label: code,
        funding_source: 'operator' as const,
        discount_type: promoForm.discountType,
        discount_value: discountValue,
        max_discount_value: promoForm.discountType === 'percentage' ? maxDiscountValue : null,
        is_active: promoForm.isActive === 'active',
        starts_at: promoForm.startsAt ? new Date(promoForm.startsAt).toISOString() : null,
        ends_at: promoForm.endsAt ? new Date(promoForm.endsAt).toISOString() : null,
      }

      if (editingPromotionId) {
        await commercialService.updatePromotion(editingPromotionId, payload)
      } else {
        await commercialService.createPromotion(payload)
      }

      const [nextPromotions, nextTours] = await Promise.all([
        commercialService.listOperatorPromotions(user.id),
        commercialService.listCommercialTours(user.id),
      ])
      setPromotions(nextPromotions)
      setPromotionTours(nextTours)
      resetPromoForm()
    } catch (actionError) {
      setPromoError(actionError instanceof Error ? actionError.message : 'Failed to save promotion')
    } finally {
      setPromoSubmitting(false)
    }
  }

  const eligibleBalance = useMemo(
    () =>
      payoutRows
        .filter((row) => row.payout_status === 'eligible')
        .reduce((sum, row) => sum + row.net_operator_payable_amount, 0),
    [payoutRows],
  )

  const outstandingRecovery = useMemo(
    () =>
      payoutRows
        .filter((row) => row.payout_status === 'recovery_pending')
        .reduce((sum, row) => sum + row.recovery_amount, 0),
    [payoutRows],
  )

  const resolvedTierName =
    tier?.display_name ??
    formatTierName(profile?.membership_tier_code) ??
    formatTierName(billingRows[0]?.membership_tier_code)
  const resolvedCommissionRate = tier?.commission_rate ?? profile?.commission_rate ?? 0
  const resolvedPublishLimit = tier?.monthly_publish_limit ?? null
  const publishedTripsThisCycle =
    profile?.monthly_published_tours_count ?? performance?.published_trips ?? 0
  const publishLimitCaption =
    typeof resolvedPublishLimit === 'number' && resolvedPublishLimit > 0
      ? `${publishedTripsThisCycle}/${resolvedPublishLimit} publish slots used`
      : publishedTripsThisCycle > 0
        ? `${publishedTripsThisCycle} published trip${publishedTripsThisCycle === 1 ? '' : 's'} this cycle`
        : 'Publish limit not configured yet'

  const stats = [
    {
      label: 'Current tier',
      value: resolvedTierName,
      icon: Gem,
      caption: `${resolvedCommissionRate}% platform fee rate`,
    },
    {
      label: 'Cycle GMV',
      value: formatMoney(performance?.gmv ?? 0),
      icon: Rocket,
      caption: `${performance?.published_trips ?? 0} published trips`,
    },
    {
      label: 'Eligible payouts',
      value: formatMoney(eligibleBalance),
      icon: Wallet,
      caption: `${payoutRows.filter((row) => row.payout_status === 'eligible').length} items ready after deductions`,
    },
    {
      label: 'Next billing date',
      value: formatDate(profile?.next_billing_date),
      icon: CreditCard,
      caption: publishLimitCaption,
    },
  ]

  const activePromotionCount = useMemo(
    () => promotions.filter((promotion) => promotion.is_active).length,
    [promotions],
  )
  const latestBillingRow = billingRows[0] ?? null
  const nextPendingBatch =
    payoutBatches.find((batch) => batch.status !== 'paid' && batch.status !== 'reversed') ?? null
  const selectedBillingRow =
    billingRows.find((row) => row.billing_cycle_id === selectedBillingCycleId) ?? latestBillingRow
  const selectedPayoutBatch =
    payoutBatches.find((batch) => batch.id === selectedPayoutBatchId) ?? payoutBatches[0] ?? null
  const scheduledPayoutTotal = useMemo(
    () =>
      payoutRows
        .filter((row) => row.payout_status === 'scheduled')
        .reduce((sum, row) => sum + row.net_operator_payable_amount, 0),
    [payoutRows],
  )
  const onHoldExposure = useMemo(
    () =>
      payoutRows
        .filter((row) => row.payout_status === 'on_hold')
        .reduce((sum, row) => sum + row.net_operator_payable_amount, 0),
    [payoutRows],
  )
  const recoveryItemCount = useMemo(
    () => payoutRows.filter((row) => row.payout_status === 'recovery_pending').length,
    [payoutRows],
  )
  const selectedBatchRows = useMemo(() => {
    if (!selectedPayoutBatch?.batch_reference) return []

    return payoutRows
      .filter((row) => row.batch_reference === selectedPayoutBatch.batch_reference)
      .sort((left, right) => {
        const leftDate = left.payout_due_at ? new Date(left.payout_due_at).getTime() : 0
        const rightDate = right.payout_due_at ? new Date(right.payout_due_at).getTime() : 0
        return rightDate - leftDate
      })
  }, [payoutRows, selectedPayoutBatch])

  const billingHighlights = [
    {
      label: 'Current tier',
      value: resolvedTierName,
      caption: `Membership status: ${formatStatusLabel(profile?.membership_status)}`,
    },
    {
      label: 'Monthly membership fee',
      value: formatMoney(
        profile?.monthly_membership_fee ??
          latestBillingRow?.membership_fee ??
          tier?.monthly_fee ??
          0,
      ),
      caption: `Next billing date: ${formatDate(profile?.next_billing_date)}`,
    },
    {
      label: 'Prior-cycle commission credit',
      value: formatMoney(latestBillingRow?.prior_cycle_commission_credit ?? 0),
      caption: latestBillingRow?.invoice_number
        ? `Applied against ${latestBillingRow.invoice_number}`
        : 'No invoice has been generated for the current cycle yet',
    },
    {
      label: 'Latest invoice status',
      value: formatStatusLabel(latestBillingRow?.invoice_status),
      caption: latestBillingRow
        ? `${latestBillingRow.invoice_number ?? 'Draft pending'} · Due ${formatDate(latestBillingRow.due_date)}`
        : 'Billing cycle snapshots will appear here once invoicing runs',
    },
  ]

  const payoutHighlights = [
    {
      label: 'Eligible now',
      value: formatMoney(eligibleBalance),
      caption: `${payoutRows.filter((row) => row.payout_status === 'eligible').length} payout item(s) ready for batching`,
    },
    {
      label: 'Next payout batch',
      value: nextPendingBatch ? formatDate(nextPendingBatch.scheduled_for) : 'Unscheduled',
      caption: nextPendingBatch
        ? `${nextPendingBatch.batch_reference} · ${formatMoney(nextPendingBatch.total_operator_payable)}`
        : 'No scheduled batch is currently waiting for release',
    },
    {
      label: 'On-hold exposure',
      value: formatMoney(onHoldExposure),
      caption: profile?.payout_hold
        ? (profile.payout_hold_reason ?? 'Finance has placed this operator on payout hold')
        : 'No payout hold is active right now',
    },
    {
      label: 'Recovery balance',
      value: formatMoney(outstandingRecovery),
      caption:
        recoveryItemCount > 0
          ? `${recoveryItemCount} payout item(s) still carrying recovery deductions`
          : 'No recovery balance is pending against upcoming payouts',
    },
  ]
  const payoutExceptionStates = useMemo(() => {
    const items: Array<{
      title: string
      detail: string
      tone: 'warning' | 'default' | 'destructive'
    }> = []

    if (profile?.payout_hold) {
      items.push({
        title: 'Payout hold active',
        detail: profile.payout_hold_reason ?? 'Finance review is preventing new payout releases.',
        tone: 'destructive',
      })
    }

    if (outstandingRecovery > 0) {
      items.push({
        title: 'Recovery balance outstanding',
        detail: `${formatMoney(outstandingRecovery)} is still being deducted from future eligible payouts.`,
        tone: 'warning',
      })
    }

    if (onHoldExposure > 0) {
      items.push({
        title: 'On-hold payout exposure',
        detail: `${formatMoney(onHoldExposure)} is sitting in payout items marked on hold.`,
        tone: 'warning',
      })
    }

    if (recoveryItemCount === 0 && !profile?.payout_hold && onHoldExposure === 0) {
      items.push({
        title: 'No active payout exceptions',
        detail: 'Your payout history is clear of holds and recovery deductions right now.',
        tone: 'default',
      })
    }

    return items
  }, [
    onHoldExposure,
    outstandingRecovery,
    profile?.payout_hold,
    profile?.payout_hold_reason,
    recoveryItemCount,
  ])
  const payoutDisputeCases = useMemo(
    () =>
      payoutRows
        .filter(
          (row) =>
            row.payout_status === 'on_hold' ||
            row.payout_status === 'recovery_pending' ||
            row.refund_amount > 0 ||
            row.commission_remaining > 0,
        )
        .sort((left, right) => {
          const leftTime = new Date(left.payout_due_at ?? left.travel_date ?? 0).getTime()
          const rightTime = new Date(right.payout_due_at ?? right.travel_date ?? 0).getTime()
          return rightTime - leftTime
        })
        .slice(0, 6),
    [payoutRows],
  )
  const reconciliationSnapshot = useMemo(() => {
    const totalGross = payoutRows.reduce((sum, row) => sum + row.gross_amount, 0)
    const totalRefunds = payoutRows.reduce((sum, row) => sum + row.refund_amount, 0)
    const totalCommissionOutstanding = payoutRows.reduce(
      (sum, row) => sum + row.commission_remaining,
      0,
    )
    const operatorFundedPromoExposure = payoutRows.reduce(
      (sum, row) =>
        row.promo_funding_source === 'operator' ? sum + row.promo_discount_value : sum,
      0,
    )

    return {
      totalGross,
      totalRefunds,
      totalCommissionOutstanding,
      operatorFundedPromoExposure,
      reviewRequired:
        Boolean(profile?.payout_hold) ||
        onHoldExposure > 0 ||
        outstandingRecovery > 0 ||
        totalRefunds > 0 ||
        totalCommissionOutstanding > 0,
    }
  }, [onHoldExposure, outstandingRecovery, payoutRows, profile?.payout_hold])
  const payoutDisputeCandidates = useMemo(() => {
    const seen = new Set<string>()

    return [...payoutDisputeCases, ...payoutRows]
      .filter((row) => {
        if (seen.has(row.payout_item_id)) return false
        seen.add(row.payout_item_id)
        return true
      })
      .slice(0, 24)
  }, [payoutDisputeCases, payoutRows])
  const selectedDisputeRow =
    payoutDisputeCandidates.find((row) => row.payout_item_id === disputeForm.payoutItemId) ?? null
  const selectedDisputeSummary = selectedDisputeRow ? disputeCaseSummary(selectedDisputeRow) : null
  const latestDisputeCaseByPayoutItem = useMemo(() => {
    const next = new Map<string, OperatorPayoutDisputeCase>()

    for (const disputeCase of disputeCases) {
      if (!next.has(disputeCase.payout_item_id)) {
        next.set(disputeCase.payout_item_id, disputeCase)
      }
    }

    return next
  }, [disputeCases])

  useEffect(() => {
    setInvoiceExportFeedback(null)
  }, [selectedBillingCycleId])

  useEffect(() => {
    setPayoutExportFeedback(null)
  }, [selectedPayoutBatchId])

  useEffect(() => {
    setReconciliationExportFeedback(null)
  }, [disputeCases, payoutRows])

  useEffect(() => {
    if (payoutDisputeCandidates.length === 0) return

    const hasCurrentSelection = payoutDisputeCandidates.some(
      (row) => row.payout_item_id === disputeForm.payoutItemId,
    )

    if (hasCurrentSelection) return

    const preferredRow = payoutDisputeCandidates[0]
    setDisputeForm((current) => ({
      ...current,
      payoutItemId: preferredRow.payout_item_id,
      disputeCategory: suggestedDisputeCategory(preferredRow),
      requestedAction: suggestedRequestedAction(preferredRow),
    }))
  }, [disputeForm.payoutItemId, payoutDisputeCandidates])

  const handleDisputeFormChange = (field: keyof OperatorDisputeFormState, value: string) => {
    setDisputeForm((current) => ({ ...current, [field]: value }))
  }

  const handleDisputePayoutSelection = (payoutItemId: string) => {
    const selectedRow = payoutDisputeCandidates.find((row) => row.payout_item_id === payoutItemId)

    setDisputeForm((current) => ({
      ...current,
      payoutItemId,
      disputeCategory: selectedRow
        ? suggestedDisputeCategory(selectedRow)
        : current.disputeCategory,
      requestedAction: selectedRow
        ? suggestedRequestedAction(selectedRow)
        : current.requestedAction,
    }))
    setDisputeFeedback(null)
  }

  const handleSubmitDisputeCase = async () => {
    if (!user?.id) return

    if (!selectedDisputeRow) {
      setDisputeFeedback({
        tone: 'error',
        message: 'Choose a payout item before submitting a dispute case.',
      })
      return
    }

    const reasonSummary = disputeForm.reasonSummary.trim()
    if (!reasonSummary) {
      setDisputeFeedback({
        tone: 'error',
        message: 'A short dispute summary is required before submitting the case.',
      })
      return
    }

    try {
      setDisputeSubmitting(true)
      setDisputeFeedback(null)

      const submissionResult = await commercialService.submitOperatorPayoutDisputeCase({
        operator_user_id: user.id,
        payout_item_id: selectedDisputeRow.payout_item_id,
        booking_id: selectedDisputeRow.booking_id,
        dispute_category: disputeForm.disputeCategory,
        requested_action: disputeForm.requestedAction,
        reason_summary: reasonSummary,
        evidence_notes: disputeForm.evidenceNotes.trim() || null,
        reconciliation_report: {
          payout_status: selectedDisputeRow.payout_status,
          gross_amount: selectedDisputeRow.gross_amount,
          refund_amount: selectedDisputeRow.refund_amount,
          commission_retained_by_tripavail: selectedDisputeRow.commission_retained_by_tripavail,
          commission_remaining: selectedDisputeRow.commission_remaining,
          recovery_deduction_amount: selectedDisputeRow.recovery_deduction_amount,
          net_operator_payable_amount: selectedDisputeRow.net_operator_payable_amount,
          promo_owner: selectedDisputeRow.promo_owner,
          promo_funding_source: selectedDisputeRow.promo_funding_source,
          promo_discount_value: selectedDisputeRow.promo_discount_value,
          hold_reason: selectedDisputeRow.hold_reason,
          batch_reference: selectedDisputeRow.batch_reference,
          payout_due_at: selectedDisputeRow.payout_due_at,
          paid_at: selectedDisputeRow.paid_at,
        },
      })

      setDisputeCases((current) => [submissionResult.disputeCase, ...current])
      setDisputeFeedback({
        tone: submissionResult.supportEscalationError ? 'error' : 'success',
        message: submissionResult.supportEscalationError
          ? 'Dispute case submitted, but automatic booking-thread escalation failed. Finance and support can still triage it from Admin Commercial.'
          : 'Dispute case submitted and escalated to TripAvail support through the booking conversation.',
      })
      setDisputeForm((current) => ({
        ...current,
        reasonSummary: '',
        evidenceNotes: '',
      }))
    } catch (submitError) {
      setDisputeFeedback({
        tone: 'error',
        message:
          submitError instanceof Error
            ? submitError.message
            : 'Failed to submit the payout dispute case.',
      })
    } finally {
      setDisputeSubmitting(false)
    }
  }

  const exportReconciliationReportCsv = () => {
    if (payoutRows.length === 0) {
      setReconciliationExportFeedback({
        tone: 'error',
        message: 'No payout rows are loaded, so there is no reconciliation report to export.',
      })
      return
    }

    const filename = `operator-reconciliation-report-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`

    try {
      downloadCsvFile(
        filename,
        [
          'payout_item_id',
          'booking_id',
          'trip_name',
          'travel_date',
          'payout_status',
          'gross_amount',
          'refund_amount',
          'commission_amount',
          'commission_remaining',
          'recovery_deduction_amount',
          'net_operator_payable_amount',
          'promo_owner',
          'promo_funding_source',
          'promo_discount_value',
          'hold_reason',
          'batch_reference',
          'payout_due_at',
          'paid_at',
          'latest_dispute_status',
          'latest_dispute_category',
          'latest_dispute_reason',
          'latest_dispute_created_at',
          'support_escalated_at',
        ],
        payoutRows.map((row) => {
          const disputeCase = latestDisputeCaseByPayoutItem.get(row.payout_item_id)

          return [
            row.payout_item_id,
            row.booking_id,
            row.trip_name,
            row.travel_date,
            row.payout_status,
            row.gross_amount,
            row.refund_amount,
            row.commission_retained_by_tripavail,
            row.commission_remaining,
            row.recovery_deduction_amount,
            row.net_operator_payable_amount,
            row.promo_owner,
            row.promo_funding_source,
            row.promo_discount_value,
            row.hold_reason,
            row.batch_reference,
            row.payout_due_at,
            row.paid_at,
            disputeCase?.status,
            disputeCase?.dispute_category,
            disputeCase?.reason_summary,
            disputeCase?.created_at,
            disputeCase?.support_escalated_at,
          ]
        }),
      )
      setReconciliationExportFeedback({
        tone: 'success',
        message: `${filename} downloaded with payout, promo funding, refund, and dispute evidence columns.`,
      })
    } catch (exportError) {
      setReconciliationExportFeedback({
        tone: 'error',
        message:
          exportError instanceof Error
            ? exportError.message
            : 'Failed to export the reconciliation report.',
      })
    }
  }

  const exportSelectedInvoiceCsv = () => {
    if (!selectedBillingRow) {
      setInvoiceExportFeedback({
        tone: 'error',
        message: 'No invoice is selected yet, so there is nothing to export.',
      })
      return
    }

    const filename = `operator-invoice-${selectedBillingRow.invoice_number ?? selectedBillingRow.billing_cycle_id}.csv`

    try {
      downloadCsvFile(
        filename,
        [
          'billing_cycle_id',
          'invoice_number',
          'membership_tier_code',
          'cycle_start',
          'cycle_end',
          'membership_fee',
          'prior_cycle_commission_credit',
          'adjustment_applied',
          'final_membership_charge',
          'invoice_status',
          'payment_status',
          'issued_at',
          'due_date',
          'paid_at',
        ],
        [
          [
            selectedBillingRow.billing_cycle_id,
            selectedBillingRow.invoice_number,
            selectedBillingRow.membership_tier_code,
            selectedBillingRow.cycle_start,
            selectedBillingRow.cycle_end,
            selectedBillingRow.membership_fee,
            selectedBillingRow.prior_cycle_commission_credit,
            selectedBillingRow.adjustment_applied,
            selectedBillingRow.final_membership_charge,
            selectedBillingRow.invoice_status,
            selectedBillingRow.payment_status,
            selectedBillingRow.issued_at,
            selectedBillingRow.due_date,
            selectedBillingRow.paid_at,
          ],
        ],
      )
      setInvoiceExportFeedback({
        tone: 'success',
        message: `${filename} downloaded with the selected invoice detail.`,
      })
    } catch (exportError) {
      setInvoiceExportFeedback({
        tone: 'error',
        message:
          exportError instanceof Error
            ? exportError.message
            : 'Invoice export failed. Try again after reloading the page.',
      })
    }
  }

  const exportSelectedPayoutBatchCsv = () => {
    if (!selectedPayoutBatch) {
      setPayoutExportFeedback({
        tone: 'error',
        message: 'No payout batch is selected yet, so there is nothing to export.',
      })
      return
    }

    if (selectedBatchRows.length === 0) {
      setPayoutExportFeedback({
        tone: 'error',
        message:
          'This payout batch does not have booking-level payout rows yet, so CSV export is unavailable.',
      })
      return
    }

    const filename = `operator-payout-batch-${selectedPayoutBatch.batch_reference}.csv`

    try {
      downloadCsvFile(
        filename,
        [
          'batch_reference',
          'scheduled_for',
          'batch_status',
          'booking_id',
          'trip_name',
          'travel_date',
          'payout_status',
          'gross_amount',
          'commission_amount',
          'recovery_deduction_amount',
          'net_operator_payable_amount',
        ],
        selectedBatchRows.map((row) => [
          selectedPayoutBatch.batch_reference,
          selectedPayoutBatch.scheduled_for,
          selectedPayoutBatch.status,
          row.booking_id,
          row.trip_name,
          row.travel_date,
          row.payout_status,
          row.gross_amount,
          row.commission_retained_by_tripavail,
          row.recovery_deduction_amount,
          row.net_operator_payable_amount,
        ]),
      )
      setPayoutExportFeedback({
        tone: 'success',
        message: `${filename} downloaded with ${selectedBatchRows.length} payout item(s).`,
      })
    } catch (exportError) {
      setPayoutExportFeedback({
        tone: 'error',
        message:
          exportError instanceof Error
            ? exportError.message
            : 'Payout batch export failed. Try again after reloading the page.',
      })
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-amber-500/10 blur-[110px] opacity-60" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <PageHeader
            title="Commercial"
            subtitle="Track your tier, billing, payout readiness, and cycle performance from the database-backed commercial layer."
            showBackButton={false}
            actions={
              <Button asChild variant="outline" className="rounded-2xl">
                <Link to="/operator/tours/new">Create trip</Link>
              </Button>
            }
          />
        </motion.div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card border border-border/50 rounded-2xl p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">{stat.label}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/40">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-3xl font-black text-foreground">{loading ? '…' : stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.caption}</p>
            </div>
          ))}
        </motion.div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="h-auto rounded-2xl bg-muted/70 p-1">
            <TabsTrigger value="overview" className="rounded-2xl">
              Overview
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-2xl">
              Billing
            </TabsTrigger>
            <TabsTrigger value="payouts" className="rounded-2xl">
              Payouts
            </TabsTrigger>
            <TabsTrigger value="promos" className="rounded-2xl">
              Promos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <Card className="glass-card rounded-3xl border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5" />
                    Cycle performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Metric
                    label="Confirmed bookings"
                    value={String(performance?.confirmed_bookings ?? 0)}
                  />
                  <Metric
                    label="Payouts received"
                    value={formatMoney(performance?.payouts_received ?? 0)}
                  />
                  <Metric
                    label="AI credits used"
                    value={`${profile?.ai_credits_used_current_cycle ?? 0}/${tier?.ai_monthly_credits ?? 0}`}
                  />
                </CardContent>
              </Card>

              <Card className="glass-card rounded-3xl border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Tier entitlements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <Entitlement
                    label="Multi-city pickup"
                    enabled={Boolean(tier?.pickup_multi_city_enabled)}
                  />
                  <Entitlement
                    label="Google Maps support"
                    enabled={Boolean(tier?.google_maps_enabled)}
                  />
                  <Entitlement
                    label="AI itinerary tools"
                    enabled={Boolean(tier?.ai_itinerary_enabled)}
                  />
                  <Entitlement
                    label="Cycle publish limit"
                    enabled={Boolean(resolvedPublishLimit && resolvedPublishLimit > 0)}
                    description={
                      typeof resolvedPublishLimit === 'number' && resolvedPublishLimit > 0
                        ? `${resolvedPublishLimit} trips`
                        : 'Not configured yet'
                    }
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card className="glass-card rounded-3xl border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Finance safeguards</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Metric label="Outstanding recovery" value={formatMoney(outstandingRecovery)} />
                  <Metric
                    label="Cancellation penalty"
                    value={profile?.cancellation_penalty_active ? 'Active' : 'Clear'}
                  />
                  <Metric
                    label="Fraud review"
                    value={profile?.fraud_review_required ? 'Required' : 'Clear'}
                  />
                  <Metric
                    label="Operator-fault cancellations"
                    value={String(profile?.operator_fault_cancellation_count ?? 0)}
                  />
                  <Metric label="Payout hold" value={profile?.payout_hold ? 'Held' : 'Clear'} />
                </CardContent>
              </Card>

              <Card className="glass-card rounded-3xl border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldAlert className="h-5 w-5" />
                    Fraud review status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={profile?.fraud_review_required ? 'destructive' : 'outline'}
                      className={
                        profile?.fraud_review_required
                          ? 'border-0'
                          : 'border-border/60 bg-background/60 text-muted-foreground'
                      }
                    >
                      {profile?.fraud_review_required
                        ? 'Review required'
                        : 'No active fraud review'}
                    </Badge>
                    {profile?.payout_hold ? (
                      <Badge className="border-0 bg-amber-500 text-white hover:bg-amber-500">
                        Payout hold active
                      </Badge>
                    ) : null}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Metric
                      label="Triggered"
                      value={formatTimestamp(profile?.fraud_review_triggered_at)}
                    />
                    <Metric label="Operational status" value={profile?.operational_status ?? '—'} />
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Review reason
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      {profile?.fraud_review_reason ??
                        'No fraud review trigger is active on your commercial profile.'}
                    </p>
                  </div>
                  {profile?.payout_hold_reason ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      {profile.payout_hold_reason}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Recent payout batches</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Recovery offset</TableHead>
                      <TableHead className="text-right">Operator payable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutBatches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No payout batches yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payoutBatches.slice(0, 5).map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batch_reference}</TableCell>
                          <TableCell>{formatDate(batch.scheduled_for)}</TableCell>
                          <TableCell className={statusTone(batch.status)}>{batch.status}</TableCell>
                          <TableCell className="text-right">
                            {formatMoney(batch.total_recovery_deduction_amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMoney(batch.total_operator_payable)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="pt-4">
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {billingHighlights.map((item) => (
                <Card key={item.label} className="glass-card rounded-3xl border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {loading ? 'Loading…' : item.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.caption}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass-card rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Billing cycles and invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Final charge</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No billing cycles available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      billingRows.map((row) => (
                        <TableRow
                          key={row.billing_cycle_id}
                          className={
                            row.billing_cycle_id === selectedBillingCycleId
                              ? 'bg-muted/30'
                              : undefined
                          }
                        >
                          <TableCell>
                            {formatDate(row.cycle_start)} to {formatDate(row.cycle_end)}
                          </TableCell>
                          <TableCell className="capitalize">{row.membership_tier_code}</TableCell>
                          <TableCell>{row.invoice_number ?? 'Draft pending'}</TableCell>
                          <TableCell>{formatStatusLabel(row.invoice_status)}</TableCell>
                          <TableCell className="text-right">
                            {formatMoney(row.final_membership_charge)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={
                                row.billing_cycle_id === selectedBillingCycleId
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              className="rounded-2xl"
                              onClick={() => setSelectedBillingCycleId(row.billing_cycle_id)}
                            >
                              View details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {selectedBillingRow ? (
              <Card className="glass-card mt-6 rounded-3xl border-border/50">
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-lg">Invoice detail</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-2xl"
                      onClick={exportSelectedInvoiceCsv}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export invoice CSV
                    </Button>
                  </div>
                </CardHeader>
                {invoiceExportFeedback ? (
                  <CardContent className="pb-0">
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm ${exportFeedbackToneClass(invoiceExportFeedback.tone)}`}
                    >
                      {invoiceExportFeedback.message}
                    </div>
                  </CardContent>
                ) : null}
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    label="Invoice reference"
                    value={selectedBillingRow.invoice_number ?? 'Draft pending'}
                  />
                  <Metric
                    label="Membership fee"
                    value={formatMoney(selectedBillingRow.membership_fee)}
                  />
                  <Metric
                    label="Commission credit"
                    value={formatMoney(selectedBillingRow.prior_cycle_commission_credit)}
                  />
                  <Metric
                    label="Final charge"
                    value={formatMoney(selectedBillingRow.final_membership_charge)}
                  />
                </CardContent>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 pt-0">
                  <Metric
                    label="Adjustment applied"
                    value={formatMoney(selectedBillingRow.adjustment_applied)}
                  />
                  <Metric
                    label="Invoice status"
                    value={formatStatusLabel(selectedBillingRow.invoice_status)}
                  />
                  <Metric label="Issued" value={formatTimestamp(selectedBillingRow.issued_at)} />
                  <Metric label="Due" value={formatTimestamp(selectedBillingRow.due_date)} />
                </CardContent>
                <CardContent className="pt-0">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    <p>
                      Cycle window: {formatDate(selectedBillingRow.cycle_start)} to{' '}
                      {formatDate(selectedBillingRow.cycle_end)}
                    </p>
                    <p className="mt-2">
                      Payment state: {formatStatusLabel(selectedBillingRow.payment_status)}
                      {selectedBillingRow.paid_at
                        ? ` · Paid ${formatTimestamp(selectedBillingRow.paid_at)}`
                        : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="payouts" className="pt-4">
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {payoutHighlights.map((item) => (
                <Card key={item.label} className="glass-card rounded-3xl border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {loading ? 'Loading…' : item.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.caption}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass-card mb-6 rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Payout timeline</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <Metric label="Completed and eligible" value={formatMoney(eligibleBalance)} />
                <Metric label="Already scheduled" value={formatMoney(scheduledPayoutTotal)} />
                <Metric label="Paid out" value={formatMoney(performance?.payouts_received ?? 0)} />
              </CardContent>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {profile?.payout_hold
                  ? `Payout releases are currently blocked. Finance reason: ${profile.payout_hold_reason ?? 'manual review in progress'}`
                  : outstandingRecovery > 0
                    ? 'Recovery balances are automatically deducted from future eligible payouts before a batch is released.'
                    : 'Completed bookings become eligible after the settlement window, then move into the next payout batch automatically.'}
              </CardContent>
            </Card>

            <Card className="glass-card mb-6 rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Payout history and exception states</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    How payout history moves
                  </p>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Eligible means the booking completed and cleared the settlement wait before
                      batching.
                    </p>
                    <p>
                      Scheduled means the item is already inside a payout batch and waiting for
                      release.
                    </p>
                    <p>
                      Paid means the operator transfer has been released and the item is closed.
                    </p>
                    <p>
                      On Hold and Recovery Pending are the two primary exception states that delay
                      or reduce payout release.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {payoutExceptionStates.map((item) => (
                    <div
                      key={item.title}
                      className={
                        item.tone === 'destructive'
                          ? 'rounded-2xl border border-destructive/30 bg-destructive/5 p-4'
                          : item.tone === 'warning'
                            ? 'rounded-2xl border border-warning/30 bg-warning/5 p-4'
                            : 'rounded-2xl border border-border/60 bg-background/70 p-4'
                      }
                    >
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card mb-6 rounded-3xl border-border/50">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scale className="h-5 w-5" />
                    Payout disputes and reconciliation workflow
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl"
                    onClick={exportReconciliationReportCsv}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export reconciliation CSV
                  </Button>
                </div>
              </CardHeader>
              {reconciliationExportFeedback ? (
                <CardContent className="pb-0">
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${exportFeedbackToneClass(reconciliationExportFeedback.tone)}`}
                  >
                    {reconciliationExportFeedback.message}
                  </div>
                </CardContent>
              ) : null}
              <CardContent className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-3">
                  <div
                    className={`rounded-2xl border p-4 ${reconciliationSnapshot.reviewRequired ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {reconciliationSnapshot.reviewRequired
                        ? 'Review required before the next release'
                        : 'No active reconciliation blockers'}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Keep payout evidence aligned across traveler outcomes, refund actions, promo
                      funding, and finance holds before raising a formal dispute.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Metric
                      label="Refund / dispute exposure"
                      value={formatMoney(reconciliationSnapshot.totalRefunds)}
                    />
                    <Metric
                      label="Commission still settling"
                      value={formatMoney(reconciliationSnapshot.totalCommissionOutstanding)}
                    />
                    <Metric
                      label="Operator-funded promo exposure"
                      value={formatMoney(reconciliationSnapshot.operatorFundedPromoExposure)}
                    />
                    <Metric
                      label="Tracked payout gross"
                      value={formatMoney(reconciliationSnapshot.totalGross)}
                    />
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Operator workflow</p>
                    <p className="mt-2">
                      1. Open the affected booking and confirm traveler, refund, and trip outcome
                      details.
                    </p>
                    <p className="mt-2">
                      2. Reconcile the payout row against promo funding, recovery deductions, and
                      any offline collection proof.
                    </p>
                    <p className="mt-2">
                      3. Escalate only after the booking thread contains the evidence finance will
                      need to clear a hold or close a dispute.
                    </p>
                  </div>
                  {selectedDisputeSummary ? (
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Selected case context</p>
                      <p className="mt-2">{selectedDisputeSummary.detail}</p>
                      <p className="mt-2 text-foreground">
                        Recommended next step: {selectedDisputeSummary.nextStep}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Submit payout dispute case
                    </p>
                    <div className="mt-4 grid gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Payout item
                        </label>
                        <Select
                          value={disputeForm.payoutItemId}
                          onValueChange={handleDisputePayoutSelection}
                        >
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select payout item" />
                          </SelectTrigger>
                          <SelectContent>
                            {payoutDisputeCandidates.map((row) => (
                              <SelectItem key={row.payout_item_id} value={row.payout_item_id}>
                                {(row.trip_name ?? 'Trip booking').slice(0, 48)} ·{' '}
                                {formatStatusLabel(row.payout_status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Category
                          </label>
                          <Select
                            value={disputeForm.disputeCategory}
                            onValueChange={(value) =>
                              handleDisputeFormChange('disputeCategory', value)
                            }
                          >
                            <SelectTrigger className="rounded-2xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="payout_hold">Payout hold</SelectItem>
                              <SelectItem value="recovery_deduction">Recovery deduction</SelectItem>
                              <SelectItem value="refund_mismatch">Refund mismatch</SelectItem>
                              <SelectItem value="promo_funding_mismatch">
                                Promo funding mismatch
                              </SelectItem>
                              <SelectItem value="commission_mismatch">
                                Commission mismatch
                              </SelectItem>
                              <SelectItem value="missing_payout">Missing payout</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Requested action
                          </label>
                          <Select
                            value={disputeForm.requestedAction}
                            onValueChange={(value) =>
                              handleDisputeFormChange('requestedAction', value)
                            }
                          >
                            <SelectTrigger className="rounded-2xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="release_payout">Release payout</SelectItem>
                              <SelectItem value="review_recovery">Review recovery</SelectItem>
                              <SelectItem value="review_refund">Review refund</SelectItem>
                              <SelectItem value="review_promo_funding">
                                Review promo funding
                              </SelectItem>
                              <SelectItem value="review_commission">Review commission</SelectItem>
                              <SelectItem value="manual_reconciliation">
                                Manual reconciliation
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Summary for support
                        </label>
                        <Input
                          value={disputeForm.reasonSummary}
                          onChange={(event) =>
                            handleDisputeFormChange('reasonSummary', event.target.value)
                          }
                          placeholder="Summarize the payout mismatch or blocker"
                          className="rounded-2xl"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Evidence notes
                        </label>
                        <Textarea
                          value={disputeForm.evidenceNotes}
                          onChange={(event) =>
                            handleDisputeFormChange('evidenceNotes', event.target.value)
                          }
                          placeholder="Add refund proof, promo funding evidence, offline payment notes, or finance context"
                          className="min-h-[120px] rounded-2xl border-border/60 bg-background/80"
                        />
                      </div>
                      {disputeFeedback ? (
                        <div
                          className={`rounded-2xl border px-4 py-3 text-sm ${exportFeedbackToneClass(disputeFeedback.tone)}`}
                        >
                          {disputeFeedback.message}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {selectedDisputeRow ? (
                          <Button asChild variant="link" className="h-auto p-0 text-primary">
                            <Link
                              to={`/operator/bookings?bookingId=${encodeURIComponent(selectedDisputeRow.booking_id)}`}
                            >
                              Open booking evidence
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No payout item selected.
                          </span>
                        )}
                        <Button
                          className="rounded-2xl"
                          onClick={handleSubmitDisputeCase}
                          disabled={disputeSubmitting || payoutDisputeCandidates.length === 0}
                        >
                          {disputeSubmitting ? 'Submitting…' : 'Submit dispute case'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Submitted cases
                    </p>
                    {disputeCases.length === 0 ? (
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                        No payout dispute cases have been submitted yet.
                      </div>
                    ) : (
                      disputeCases.map((disputeCase) => {
                        const row = payoutRows.find(
                          (candidate) => candidate.payout_item_id === disputeCase.payout_item_id,
                        )

                        return (
                          <div
                            key={disputeCase.id}
                            className="rounded-2xl border border-border/60 bg-background/70 p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium text-foreground">
                                  {row?.trip_name ?? 'Trip booking'}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatStatusLabel(disputeCase.dispute_category)} · Submitted{' '}
                                  {formatTimestamp(disputeCase.created_at)}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="border-border/60 bg-background/70"
                              >
                                {formatStatusLabel(disputeCase.status)}
                              </Badge>
                            </div>
                            <p className="mt-3 text-sm text-foreground">
                              {disputeCase.reason_summary}
                            </p>
                            {disputeCase.evidence_notes ? (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {disputeCase.evidence_notes}
                              </p>
                            ) : null}
                            <p className="mt-2 text-xs text-muted-foreground">
                              Requested action: {formatStatusLabel(disputeCase.requested_action)}
                              {disputeCase.support_escalated_at
                                ? ` · Support escalated ${formatTimestamp(disputeCase.support_escalated_at)}`
                                : ''}
                            </p>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card mb-6 rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Payout batches</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Recovery offset</TableHead>
                      <TableHead className="text-right">Operator payable</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutBatches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No payout batches yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payoutBatches.map((batch) => (
                        <TableRow
                          key={batch.id}
                          className={batch.id === selectedPayoutBatchId ? 'bg-muted/30' : undefined}
                        >
                          <TableCell className="font-medium">{batch.batch_reference}</TableCell>
                          <TableCell>{formatDate(batch.scheduled_for)}</TableCell>
                          <TableCell className={statusTone(batch.status)}>
                            {formatStatusLabel(batch.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMoney(batch.total_recovery_deduction_amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMoney(batch.total_operator_payable)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={batch.id === selectedPayoutBatchId ? 'default' : 'outline'}
                              size="sm"
                              className="rounded-2xl"
                              onClick={() => setSelectedPayoutBatchId(batch.id)}
                            >
                              View details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {selectedPayoutBatch ? (
              <Card className="glass-card mb-6 rounded-3xl border-border/50">
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-lg">Payout batch detail</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-2xl"
                      onClick={exportSelectedPayoutBatchCsv}
                      disabled={selectedBatchRows.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export batch CSV
                    </Button>
                  </div>
                </CardHeader>
                {payoutExportFeedback ? (
                  <CardContent className="pb-0">
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm ${exportFeedbackToneClass(payoutExportFeedback.tone)}`}
                    >
                      {payoutExportFeedback.message}
                    </div>
                  </CardContent>
                ) : null}
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Batch reference" value={selectedPayoutBatch.batch_reference} />
                  <Metric
                    label="Scheduled release"
                    value={formatTimestamp(selectedPayoutBatch.scheduled_for)}
                  />
                  <Metric
                    label="Batch status"
                    value={formatStatusLabel(selectedPayoutBatch.status)}
                  />
                  <Metric label="Booking items" value={String(selectedBatchRows.length)} />
                </CardContent>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 pt-0">
                  <Metric
                    label="Gross amount"
                    value={formatMoney(selectedPayoutBatch.total_gross_amount)}
                  />
                  <Metric
                    label="Commission"
                    value={formatMoney(selectedPayoutBatch.total_commission_amount)}
                  />
                  <Metric
                    label="Recovery deductions"
                    value={formatMoney(selectedPayoutBatch.total_recovery_deduction_amount)}
                  />
                  <Metric
                    label="Net operator payable"
                    value={formatMoney(selectedPayoutBatch.total_operator_payable)}
                  />
                </CardContent>
                <CardContent className="pt-0">
                  <div className="mb-4 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    {payoutStatusExplanation(selectedPayoutBatch.status)}
                  </div>
                  {selectedBatchRows.length === 0 ? (
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                      Booking-level payout items have not been attached to this batch summary yet.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Included bookings
                      </p>
                      <div className="space-y-3">
                        {selectedBatchRows.map((row) => {
                          const timelineEvents = buildPayoutTimelineEvents(row, selectedPayoutBatch)

                          return (
                            <div
                              key={row.payout_item_id}
                              className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {row.trip_name ?? 'Trip booking'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Booking {row.booking_id.slice(0, 8).toUpperCase()} · Travel{' '}
                                    {formatDate(row.travel_date)}
                                  </p>
                                </div>
                                <div className="text-sm text-muted-foreground md:text-right">
                                  <p>{formatStatusLabel(row.payout_status)}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {payoutStatusExplanation(row.payout_status)}
                                  </p>
                                  <p className="font-medium text-foreground">
                                    {formatMoney(row.net_operator_payable_amount)}
                                  </p>
                                  <Button
                                    asChild
                                    variant="link"
                                    className="mt-1 h-auto p-0 text-primary"
                                  >
                                    <Link
                                      to={`/operator/bookings?bookingId=${encodeURIComponent(row.booking_id)}`}
                                    >
                                      Open booking
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                                {timelineEvents.map((event) => (
                                  <div
                                    key={`${row.payout_item_id}-${event.label}`}
                                    className={
                                      event.tone === 'success'
                                        ? 'rounded-2xl border border-emerald-200 bg-emerald-50 p-3'
                                        : event.tone === 'warning'
                                          ? 'rounded-2xl border border-amber-200 bg-amber-50 p-3'
                                          : 'rounded-2xl border border-border/60 bg-muted/20 p-3'
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      {event.tone === 'success' ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                      ) : event.tone === 'warning' ? (
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                      ) : (
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <p className="text-sm font-medium text-foreground">
                                        {event.label}
                                      </p>
                                    </div>
                                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                                      {event.timestamp
                                        ? formatTimestamp(event.timestamp)
                                        : 'Awaiting timestamp'}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {event.detail}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card className="glass-card rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Booking-level payout queue</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip</TableHead>
                      <TableHead>Travel date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Promo</TableHead>
                      <TableHead className="text-right">Recovery offset</TableHead>
                      <TableHead className="text-right">Net payable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No payout items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payoutRows.map((row) => (
                        <TableRow key={row.payout_item_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {row.trip_name ?? 'Trip booking'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Booking {row.booking_id.slice(0, 8).toUpperCase()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(row.travel_date)}</TableCell>
                          <TableCell className={statusTone(row.payout_status)}>
                            {row.payout_status}
                          </TableCell>
                          <TableCell>{row.batch_reference ?? 'Unbatched'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatPromoAttribution(
                              row.promo_owner,
                              row.promo_funding_source,
                              row.promo_discount_value,
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMoney(row.recovery_deduction_amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatMoney(row.net_operator_payable_amount)}
                            <Button asChild variant="link" className="mt-1 h-auto p-0 text-primary">
                              <Link
                                to={`/operator/bookings?bookingId=${encodeURIComponent(row.booking_id)}`}
                              >
                                Open booking
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promos" className="space-y-6 pt-4">
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="glass-card rounded-3xl border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Operator-funded promos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Active promos:{' '}
                    <span className="font-semibold text-foreground">{activePromotionCount}</span>.
                    Platform-funded campaigns are reserved for admin finance controls.
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Title
                      </label>
                      <Input
                        value={promoForm.title}
                        onChange={(event) => handlePromoFormChange('title', event.target.value)}
                        placeholder="Summer launch discount"
                        className="rounded-2xl"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Promo code
                      </label>
                      <Input
                        value={promoForm.code}
                        onChange={(event) =>
                          handlePromoFormChange('code', event.target.value.toUpperCase())
                        }
                        placeholder="SUMMER25"
                        className="rounded-2xl"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Applies to
                      </label>
                      <Select
                        value={promoForm.applicableTourId}
                        onValueChange={(value) => handlePromoFormChange('applicableTourId', value)}
                      >
                        <SelectTrigger className="rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All trips</SelectItem>
                          {promotionTours.map((tour) => (
                            <SelectItem key={tour.id} value={tour.id}>
                              {tour.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Status
                      </label>
                      <Select
                        value={promoForm.isActive}
                        onValueChange={(value) => handlePromoFormChange('isActive', value)}
                      >
                        <SelectTrigger className="rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Discount type
                      </label>
                      <Select
                        value={promoForm.discountType}
                        onValueChange={(value) => handlePromoFormChange('discountType', value)}
                      >
                        <SelectTrigger className="rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed_amount">Fixed amount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Discount value
                      </label>
                      <Input
                        value={promoForm.discountValue}
                        onChange={(event) =>
                          handlePromoFormChange('discountValue', event.target.value)
                        }
                        placeholder={promoForm.discountType === 'percentage' ? '15' : '5000'}
                        type="number"
                        min="0"
                        className="rounded-2xl"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Max discount
                      </label>
                      <Input
                        value={promoForm.maxDiscountValue}
                        onChange={(event) =>
                          handlePromoFormChange('maxDiscountValue', event.target.value)
                        }
                        placeholder="Optional cap"
                        type="number"
                        min="0"
                        className="rounded-2xl"
                        disabled={promoForm.discountType !== 'percentage'}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Starts at
                      </label>
                      <Input
                        value={promoForm.startsAt}
                        onChange={(event) => handlePromoFormChange('startsAt', event.target.value)}
                        type="datetime-local"
                        className="rounded-2xl"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Ends at
                      </label>
                      <Input
                        value={promoForm.endsAt}
                        onChange={(event) => handlePromoFormChange('endsAt', event.target.value)}
                        type="datetime-local"
                        className="rounded-2xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Description
                    </label>
                    <Textarea
                      value={promoForm.description}
                      onChange={(event) => handlePromoFormChange('description', event.target.value)}
                      placeholder="Traveller-facing context for why this discount exists."
                      className="min-h-[96px] rounded-2xl"
                    />
                  </div>

                  {promoError ? (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                      {promoError}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleSavePromotion}
                      disabled={promoSubmitting}
                      className="rounded-2xl"
                    >
                      {promoSubmitting
                        ? 'Saving...'
                        : editingPromotionId
                          ? 'Update promo'
                          : 'Create promo'}
                    </Button>
                    {editingPromotionId ? (
                      <Button
                        variant="outline"
                        onClick={resetPromoForm}
                        disabled={promoSubmitting}
                        className="rounded-2xl"
                      >
                        Cancel edit
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card rounded-3xl border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Promo inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Promo</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Window</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No promos configured yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        promotions.map((promotion) => (
                          <TableRow key={promotion.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{promotion.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {promotion.code} · operator funded
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{promotion.applicable_tour?.title ?? 'All trips'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatPromoWindow(promotion.starts_at, promotion.ends_at)}
                            </TableCell>
                            <TableCell>{promotion.is_active ? 'Active' : 'Inactive'}</TableCell>
                            <TableCell className="text-right">
                              {promotion.discount_type === 'percentage'
                                ? `${promotion.discount_value}%${promotion.max_discount_value ? ` capped at PKR ${promotion.max_discount_value.toLocaleString()}` : ''}`
                                : `PKR ${promotion.discount_value.toLocaleString()}`}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl"
                                onClick={() => handleEditPromotion(promotion)}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function Entitlement({
  label,
  enabled,
  description,
}: {
  label: string
  enabled: boolean
  description?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <span className={enabled ? 'text-emerald-600' : 'text-muted-foreground'}>
        {enabled ? 'Enabled' : 'Locked'}
      </span>
    </div>
  )
}
