import { format } from 'date-fns'
import { Banknote, CircleDollarSign, Download, ShieldAlert, Users, Wallet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  type CommercialAuditLogRow,
  type CommercialPromotion,
  commercialService,
  type CommercialTourOption,
  type MembershipTierCode,
  type OperatorCommercialProfile,
  type OperatorPayoutDisputeCase,
} from '@/features/commercial/services/commercialService'

const MIN_ADMIN_ACTION_REASON_LENGTH = 10

function formatMoney(value: number) {
  return `PKR ${value.toLocaleString()}`
}

function formatSignedMoney(value: number) {
  const prefix = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${prefix}PKR ${Math.abs(value).toLocaleString()}`
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

function formatAuditAction(actionType: string) {
  switch (actionType) {
    case 'membership_tier_changed':
      return 'Tier changed'
    case 'promotion_created':
      return 'Promo created'
    case 'promotion_updated':
      return 'Promo updated'
    case 'payout_hold_applied':
      return 'Payout hold applied'
    case 'payout_hold_released':
      return 'Payout hold released'
    case 'payout_batch_reversed':
      return 'Payout batch reversed'
    case 'payout_recovery_resolved':
      return 'Recovery resolved'
    default:
      return actionType.replace(/_/g, ' ')
  }
}

function asObject(value: Record<string, unknown> | null) {
  return value && typeof value === 'object' ? value : null
}

function getAuditOperatorIds(row: CommercialAuditLogRow) {
  if (row.entity_type === 'commercial_profile') return [row.entity_id]

  const previousState = asObject(row.previous_state)
  const nextState = asObject(row.new_state)
  const directOperatorId = nextState?.operator_user_id ?? previousState?.operator_user_id
  if (typeof directOperatorId === 'string' && directOperatorId.length > 0) {
    return [directOperatorId]
  }

  const operatorIds = nextState?.operator_user_ids ?? previousState?.operator_user_ids
  if (Array.isArray(operatorIds)) {
    return operatorIds.filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    )
  }

  return []
}

function formatAuditEntityType(entityType: string) {
  switch (entityType) {
    case 'commercial_profile':
      return 'Operator profile'
    case 'payout_batch':
      return 'Payout batch'
    case 'payout_item':
      return 'Payout item'
    case 'promotion':
      return 'Promotion'
    default:
      return entityType.replace(/_/g, ' ')
  }
}

function isWithinDateRange(value: string | null | undefined, startDate: string, endDate: string) {
  if (!value) return true

  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) return true

  if (startDate) {
    const startBoundary = new Date(`${startDate}T00:00:00`)
    if (parsedValue < startBoundary) {
      return false
    }
  }

  if (endDate) {
    const endBoundary = new Date(`${endDate}T23:59:59.999`)
    if (parsedValue > endBoundary) {
      return false
    }
  }

  return true
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

function formatRiskState(riskState: string) {
  switch (riskState) {
    case 'fraud_review':
      return 'Fraud review'
    case 'payout_hold':
      return 'Payout hold'
    case 'recovery_pending':
      return 'Recovery pending'
    case 'kyc_blocked':
      return 'KYC blocker'
    case 'cancellation_penalty':
      return 'Cancellation penalty'
    default:
      return 'Clear'
  }
}

function getPrimaryRiskState(
  profile: OperatorCommercialProfile,
  recoveryExposure: number,
  onHoldExposure: number,
) {
  if (profile.fraud_review_required) return 'fraud_review'
  if (profile.payout_hold || onHoldExposure > 0) return 'payout_hold'
  if (recoveryExposure > 0) return 'recovery_pending'
  if (profile.kyc_status !== 'approved') return 'kyc_blocked'
  if (profile.cancellation_penalty_active) return 'cancellation_penalty'
  return 'clear'
}

type OperatorRiskReviewRow = {
  operator_user_id: string
  operator_name: string
  membership_tier_code: MembershipTierCode
  kyc_status: string
  primary_risk: string
  risk_signals: string[]
  payout_hold: boolean
  fraud_review_required: boolean
  recovery_exposure: number
  on_hold_exposure: number
  operator_fault_cancellation_count: number
}

type PromoPerformanceRow = {
  promotion_id: string
  operator_user_id: string
  operator_name: string
  title: string
  code: string
  funding_source: 'operator' | 'platform'
  is_active: boolean
  bookings_count: number
  discount_total: number
  operator_funded_discount_total: number
  platform_funded_discount_total: number
  commission_remaining_exposure: number
  operator_payable_total: number
}

type CommercialTrendRow = {
  month_key: string
  month_label: string
  billing_cycles_closed: number
  invoiced_total: number
  commission_credit_total: number
  payouts_paid_total: number
  payouts_scheduled_total: number
  promo_discount_total: number
  recovery_pending_total: number
}

type AdminPromoFormState = {
  operatorUserId: string
  title: string
  code: string
  description: string
  applicableTourId: string
  fundingSource: 'operator' | 'platform'
  discountType: 'fixed_amount' | 'percentage'
  discountValue: string
  maxDiscountValue: string
  startsAt: string
  endsAt: string
  isActive: 'active' | 'inactive'
}

function createEmptyAdminPromoForm(operatorUserId = ''): AdminPromoFormState {
  return {
    operatorUserId,
    title: '',
    code: '',
    description: '',
    applicableTourId: 'all',
    fundingSource: 'platform',
    discountType: 'fixed_amount',
    discountValue: '',
    maxDiscountValue: '',
    startsAt: '',
    endsAt: '',
    isActive: 'active',
  }
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

function toAdminPromoForm(promotion: CommercialPromotion): AdminPromoFormState {
  return {
    operatorUserId: promotion.operator_user_id,
    title: promotion.title,
    code: promotion.code,
    description: promotion.description ?? '',
    applicableTourId: promotion.applicable_tour_id ?? 'all',
    fundingSource: promotion.funding_source,
    discountType: promotion.discount_type,
    discountValue: promotion.discount_value ? promotion.discount_value.toString() : '',
    maxDiscountValue: promotion.max_discount_value ? promotion.max_discount_value.toString() : '',
    startsAt: toDateTimeInputValue(promotion.starts_at),
    endsAt: toDateTimeInputValue(promotion.ends_at),
    isActive: promotion.is_active ? 'active' : 'inactive',
  }
}

export default function AdminCommercialPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('')
  const [tierCode, setTierCode] = useState<MembershipTierCode>('gold')
  const [tierReason, setTierReason] = useState('')
  const [holdReason, setHoldReason] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [batchActionReason, setBatchActionReason] = useState('')
  const [selectedRecoveryItemId, setSelectedRecoveryItemId] = useState('')
  const [recoveryAmount, setRecoveryAmount] = useState('')
  const [recoveryReason, setRecoveryReason] = useState('')
  const [promotions, setPromotions] = useState<CommercialPromotion[]>([])
  const [promotionTours, setPromotionTours] = useState<CommercialTourOption[]>([])
  const [promoForm, setPromoForm] = useState<AdminPromoFormState>(() => createEmptyAdminPromoForm())
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null)
  const [promoSubmitting, setPromoSubmitting] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [overview, setOverview] = useState<Awaited<
    ReturnType<typeof commercialService.getAdminCommercialOverview>
  > | null>(null)
  const [auditRows, setAuditRows] = useState<CommercialAuditLogRow[]>([])
  const [disputeCases, setDisputeCases] = useState<OperatorPayoutDisputeCase[]>([])
  const [disputeStatusById, setDisputeStatusById] = useState<
    Record<string, OperatorPayoutDisputeCase['status']>
  >({})
  const [historyOperatorFilter, setHistoryOperatorFilter] = useState('all')
  const [historyEntityTypeFilter, setHistoryEntityTypeFilter] = useState('all')
  const [historyActionTypeFilter, setHistoryActionTypeFilter] = useState('all')
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [reportOperatorFilter, setReportOperatorFilter] = useState('all')
  const [billingStatusFilter, setBillingStatusFilter] = useState('all')
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('all')
  const [promoFundingFilter, setPromoFundingFilter] = useState('all')
  const [riskStateFilter, setRiskStateFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [kycFilter, setKycFilter] = useState('all')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [nextOverview, nextPromotions, nextTours, nextAuditRows, nextDisputeCases] =
        await Promise.all([
          commercialService.getAdminCommercialOverview(),
          commercialService.listAdminPromotions(),
          commercialService.listCommercialTours(),
          commercialService.listCommercialAuditHistory(100),
          commercialService.listAdminPayoutDisputeCases(),
        ])
      setOverview(nextOverview)
      setPromotions(nextPromotions)
      setPromotionTours(nextTours)
      setAuditRows(nextAuditRows)
      setDisputeCases(nextDisputeCases)
      setDisputeStatusById(
        Object.fromEntries(nextDisputeCases.map((row) => [row.id, row.status])) as Record<
          string,
          OperatorPayoutDisputeCase['status']
        >,
      )
      if (!selectedOperatorId && nextOverview.operatorProfiles[0]?.operator_user_id) {
        const firstOperator = nextOverview.operatorProfiles[0]
        setSelectedOperatorId(firstOperator.operator_user_id)
        setTierCode(firstOperator.membership_tier_code)
        setHoldReason(firstOperator.payout_hold_reason ?? '')
        setPromoForm((current) => ({
          ...current,
          operatorUserId: current.operatorUserId || firstOperator.operator_user_id,
        }))
      }
      if (!selectedBatchId && nextOverview.payoutBatches[0]?.id) {
        setSelectedBatchId(nextOverview.payoutBatches[0].id)
      }
      if (!selectedRecoveryItemId) {
        const firstRecoveryItem = nextOverview.payoutRows.find(
          (row) => row.payout_status === 'recovery_pending',
        )
        if (firstRecoveryItem) {
          setSelectedRecoveryItemId(firstRecoveryItem.payout_item_id)
          setRecoveryAmount(firstRecoveryItem.recovery_amount.toString())
        }
      }
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load commercial admin data',
      )
    } finally {
      setLoading(false)
    }
  }, [selectedBatchId, selectedOperatorId, selectedRecoveryItemId])

  useEffect(() => {
    load()
  }, [load])

  const selectedOperator = useMemo<OperatorCommercialProfile | null>(() => {
    return (
      overview?.operatorProfiles.find(
        (profile) => profile.operator_user_id === selectedOperatorId,
      ) ?? null
    )
  }, [overview?.operatorProfiles, selectedOperatorId])

  useEffect(() => {
    if (!selectedOperator) return
    setTierCode(selectedOperator.membership_tier_code)
    setHoldReason(selectedOperator.payout_hold_reason ?? '')
  }, [selectedOperator])

  const openReportSlice = (options?: {
    operatorId?: string
    billingStatus?: string
    payoutStatus?: string
    promoFundingSource?: string
    riskState?: string
    tierCode?: string
    kycStatus?: string
  }) => {
    setActiveTab('reports')
    setReportOperatorFilter(options?.operatorId ?? 'all')
    setBillingStatusFilter(options?.billingStatus ?? 'all')
    setPayoutStatusFilter(options?.payoutStatus ?? 'all')
    setPromoFundingFilter(options?.promoFundingSource ?? 'all')
    setRiskStateFilter(options?.riskState ?? 'all')
    setTierFilter(options?.tierCode ?? 'all')
    setKycFilter(options?.kycStatus ?? 'all')
  }

  const resetReportFilters = () => {
    setReportStartDate('')
    setReportEndDate('')
    setReportOperatorFilter('all')
    setBillingStatusFilter('all')
    setPayoutStatusFilter('all')
    setPromoFundingFilter('all')
    setRiskStateFilter('all')
    setTierFilter('all')
    setKycFilter('all')
  }

  const handleSummaryDrillDown = (cardId: string) => {
    switch (cardId) {
      case 'held_payouts':
        openReportSlice({ payoutStatus: 'on_hold', riskState: 'payout_hold' })
        return
      case 'operator_payouts_cleared':
        openReportSlice({ payoutStatus: 'paid' })
        return
      case 'not_ready_liability':
        openReportSlice({ payoutStatus: 'not_ready' })
        return
      default:
        openReportSlice()
    }
  }

  const operatorPayoutsCleared = useMemo(() => {
    if (!overview?.financeHealth) return overview?.financeSummary?.total_operator_payouts ?? 0

    return (
      overview.financeHealth.total_payouts_completed +
      overview.financeHealth.total_payouts_scheduled +
      overview.financeHealth.total_payouts_on_hold
    )
  }, [overview?.financeHealth, overview?.financeSummary?.total_operator_payouts])

  const summaryCards = overview?.financeSummary
    ? [
        {
          id: 'customer_payments',
          label: 'Customer payments',
          value: formatMoney(overview.financeSummary.total_customer_payments_collected),
          icon: CircleDollarSign,
        },
        {
          id: 'commission_accrued',
          label: 'Commission accrued',
          value: formatMoney(overview.financeSummary.total_commission_earned),
          icon: Banknote,
        },
        {
          id: 'held_payouts',
          label: 'Held payouts',
          value: formatMoney(overview.financeSummary.total_held_amounts),
          icon: ShieldAlert,
        },
        {
          id: 'operator_payouts_cleared',
          label: 'Operator payouts cleared',
          value: formatMoney(operatorPayoutsCleared),
          icon: Wallet,
        },
        {
          id: 'not_ready_liability',
          label: 'Not-ready liability',
          value: formatMoney(overview.financeHealth?.total_operator_liability_not_ready ?? 0),
          icon: Users,
        },
      ]
    : []

  const filteredBillingRows = useMemo(() => {
    if (!overview) return []
    if (!selectedOperatorId) return overview.billingRows
    return overview.billingRows.filter((row) => row.operator_user_id === selectedOperatorId)
  }, [overview, selectedOperatorId])

  const filteredPayoutRows = useMemo(() => {
    if (!overview) return []
    if (!selectedOperatorId) return overview.payoutRows
    return overview.payoutRows.filter((row) => row.operator_user_id === selectedOperatorId)
  }, [overview, selectedOperatorId])

  const selectedBatch = useMemo(() => {
    return overview?.payoutBatches.find((batch) => batch.id === selectedBatchId) ?? null
  }, [overview?.payoutBatches, selectedBatchId])

  const recoveryRows = useMemo(() => {
    return filteredPayoutRows.filter((row) => row.payout_status === 'recovery_pending')
  }, [filteredPayoutRows])

  const flaggedOperators = useMemo(() => {
    return (overview?.operatorProfiles ?? []).filter((profile) => profile.fraud_review_required)
  }, [overview?.operatorProfiles])

  const promoScopedTours = useMemo(() => {
    const operatorUserId = promoForm.operatorUserId || selectedOperatorId
    if (!operatorUserId) return promotionTours
    return promotionTours.filter((tour) => tour.operator_id === operatorUserId)
  }, [promoForm.operatorUserId, promotionTours, selectedOperatorId])

  const operatorNameById = useMemo(() => {
    return new Map(
      (overview?.operatorProfiles ?? []).map((profile) => [
        profile.operator_user_id,
        profile.tour_operator_profiles?.company_name ||
          profile.tour_operator_profiles?.contact_person ||
          profile.operator_user_id.slice(0, 8),
      ]),
    )
  }, [overview?.operatorProfiles])

  const selectedRecoveryRow = useMemo(() => {
    return filteredPayoutRows.find((row) => row.payout_item_id === selectedRecoveryItemId) ?? null
  }, [filteredPayoutRows, selectedRecoveryItemId])

  const filteredDisputeCases = useMemo(() => {
    if (!selectedOperatorId) return disputeCases
    return disputeCases.filter((row) => row.operator_user_id === selectedOperatorId)
  }, [disputeCases, selectedOperatorId])

  const historyEntityTypeOptions = useMemo(() => {
    return Array.from(new Set(auditRows.map((row) => row.entity_type))).sort()
  }, [auditRows])

  const historyActionTypeOptions = useMemo(() => {
    return Array.from(new Set(auditRows.map((row) => row.action_type))).sort()
  }, [auditRows])

  const billingStatusOptions = useMemo(() => {
    return Array.from(
      new Set((overview?.billingRows ?? []).map((row) => row.invoice_status)),
    ).sort()
  }, [overview?.billingRows])

  const payoutStatusOptions = useMemo(() => {
    return Array.from(new Set((overview?.payoutRows ?? []).map((row) => row.payout_status))).sort()
  }, [overview?.payoutRows])

  const tierOptions = useMemo(() => {
    return Array.from(
      new Set((overview?.operatorProfiles ?? []).map((row) => row.membership_tier_code)),
    ).sort()
  }, [overview?.operatorProfiles])

  const kycOptions = useMemo(() => {
    return Array.from(
      new Set((overview?.operatorProfiles ?? []).map((row) => row.kyc_status)),
    ).sort()
  }, [overview?.operatorProfiles])

  const reportBillingRows = useMemo(() => {
    return (overview?.billingRows ?? []).filter((row) => {
      if (reportOperatorFilter !== 'all' && row.operator_user_id !== reportOperatorFilter) {
        return false
      }

      if (billingStatusFilter !== 'all' && row.invoice_status !== billingStatusFilter) {
        return false
      }

      return isWithinDateRange(
        row.issued_at ?? row.cycle_end ?? row.cycle_start,
        reportStartDate,
        reportEndDate,
      )
    })
  }, [
    billingStatusFilter,
    overview?.billingRows,
    reportEndDate,
    reportOperatorFilter,
    reportStartDate,
  ])

  const reportPayoutRows = useMemo(() => {
    return (overview?.payoutRows ?? []).filter((row) => {
      if (reportOperatorFilter !== 'all' && row.operator_user_id !== reportOperatorFilter) {
        return false
      }

      if (payoutStatusFilter !== 'all' && row.payout_status !== payoutStatusFilter) {
        return false
      }

      return isWithinDateRange(
        row.paid_at ?? row.payout_due_at ?? row.travel_date,
        reportStartDate,
        reportEndDate,
      )
    })
  }, [
    overview?.payoutRows,
    payoutStatusFilter,
    reportEndDate,
    reportOperatorFilter,
    reportStartDate,
  ])

  const reportPromotions = useMemo(() => {
    return promotions.filter((promotion) => {
      if (reportOperatorFilter !== 'all' && promotion.operator_user_id !== reportOperatorFilter) {
        return false
      }

      if (promoFundingFilter !== 'all' && promotion.funding_source !== promoFundingFilter) {
        return false
      }

      return isWithinDateRange(
        promotion.updated_at ?? promotion.created_at,
        reportStartDate,
        reportEndDate,
      )
    })
  }, [promoFundingFilter, promotions, reportEndDate, reportOperatorFilter, reportStartDate])

  const payoutImpactByPromoCode = useMemo(() => {
    const nextMap = new Map<
      string,
      {
        bookings_count: number
        discount_total: number
        operator_funded_discount_total: number
        platform_funded_discount_total: number
        commission_remaining_exposure: number
        operator_payable_total: number
      }
    >()

    for (const row of reportPayoutRows) {
      if (!row.promo_owner || row.promo_discount_value <= 0) continue

      const current = nextMap.get(row.promo_owner) ?? {
        bookings_count: 0,
        discount_total: 0,
        operator_funded_discount_total: 0,
        platform_funded_discount_total: 0,
        commission_remaining_exposure: 0,
        operator_payable_total: 0,
      }

      current.bookings_count += 1
      current.discount_total += row.promo_discount_value
      current.commission_remaining_exposure += row.commission_remaining
      current.operator_payable_total += row.operator_payable_amount

      if (row.promo_funding_source === 'operator') {
        current.operator_funded_discount_total += row.promo_discount_value
      } else {
        current.platform_funded_discount_total += row.promo_discount_value
      }

      nextMap.set(row.promo_owner, current)
    }

    return nextMap
  }, [reportPayoutRows])

  const promoPerformanceRows = useMemo<PromoPerformanceRow[]>(() => {
    return reportPromotions
      .map((promotion) => {
        const impact = payoutImpactByPromoCode.get(promotion.code) ?? {
          bookings_count: 0,
          discount_total: 0,
          operator_funded_discount_total: 0,
          platform_funded_discount_total: 0,
          commission_remaining_exposure: 0,
          operator_payable_total: 0,
        }

        return {
          promotion_id: promotion.id,
          operator_user_id: promotion.operator_user_id,
          operator_name:
            operatorNameById.get(promotion.operator_user_id) ??
            promotion.operator_user_id.slice(0, 8),
          title: promotion.title,
          code: promotion.code,
          funding_source: promotion.funding_source,
          is_active: promotion.is_active,
          bookings_count: impact.bookings_count,
          discount_total: impact.discount_total,
          operator_funded_discount_total: impact.operator_funded_discount_total,
          platform_funded_discount_total: impact.platform_funded_discount_total,
          commission_remaining_exposure: impact.commission_remaining_exposure,
          operator_payable_total: impact.operator_payable_total,
        }
      })
      .sort(
        (left, right) =>
          right.discount_total - left.discount_total || left.title.localeCompare(right.title),
      )
  }, [operatorNameById, payoutImpactByPromoCode, reportPromotions])

  const recoveryExposureByOperator = useMemo(() => {
    const nextMap = new Map<string, number>()

    for (const row of overview?.payoutRows ?? []) {
      if (row.recovery_amount <= 0) continue
      nextMap.set(
        row.operator_user_id,
        (nextMap.get(row.operator_user_id) ?? 0) + row.recovery_amount,
      )
    }

    return nextMap
  }, [overview?.payoutRows])

  const onHoldExposureByOperator = useMemo(() => {
    const nextMap = new Map<string, number>()

    for (const row of overview?.payoutRows ?? []) {
      if (row.payout_status !== 'on_hold') continue
      nextMap.set(
        row.operator_user_id,
        (nextMap.get(row.operator_user_id) ?? 0) + row.operator_payable_amount,
      )
    }

    return nextMap
  }, [overview?.payoutRows])

  const operatorRiskRows = useMemo<OperatorRiskReviewRow[]>(() => {
    return (overview?.operatorProfiles ?? [])
      .filter((profile) => {
        if (reportOperatorFilter !== 'all' && profile.operator_user_id !== reportOperatorFilter) {
          return false
        }

        if (tierFilter !== 'all' && profile.membership_tier_code !== tierFilter) {
          return false
        }

        if (kycFilter !== 'all' && profile.kyc_status !== kycFilter) {
          return false
        }

        const recoveryExposure = recoveryExposureByOperator.get(profile.operator_user_id) ?? 0
        const onHoldExposure = onHoldExposureByOperator.get(profile.operator_user_id) ?? 0
        const primaryRisk = getPrimaryRiskState(profile, recoveryExposure, onHoldExposure)

        if (riskStateFilter !== 'all' && primaryRisk !== riskStateFilter) {
          return false
        }

        return true
      })
      .map((profile) => {
        const recoveryExposure = recoveryExposureByOperator.get(profile.operator_user_id) ?? 0
        const onHoldExposure = onHoldExposureByOperator.get(profile.operator_user_id) ?? 0
        const riskSignals: string[] = []

        if (profile.payout_hold || onHoldExposure > 0) riskSignals.push('Payout hold')
        if (profile.fraud_review_required) riskSignals.push('Fraud review')
        if (profile.kyc_status !== 'approved') riskSignals.push('KYC blocker')
        if (recoveryExposure > 0) riskSignals.push('Recovery pending')
        if (profile.cancellation_penalty_active) riskSignals.push('Cancellation penalty')

        return {
          operator_user_id: profile.operator_user_id,
          operator_name:
            operatorNameById.get(profile.operator_user_id) ?? profile.operator_user_id.slice(0, 8),
          membership_tier_code: profile.membership_tier_code,
          kyc_status: profile.kyc_status,
          primary_risk: getPrimaryRiskState(profile, recoveryExposure, onHoldExposure),
          risk_signals: riskSignals.length > 0 ? riskSignals : ['Clear'],
          payout_hold: profile.payout_hold,
          fraud_review_required: profile.fraud_review_required,
          recovery_exposure: recoveryExposure,
          on_hold_exposure: onHoldExposure,
          operator_fault_cancellation_count: profile.operator_fault_cancellation_count,
        }
      })
      .sort((left, right) => {
        const riskComparison = left.primary_risk.localeCompare(right.primary_risk)
        if (riskComparison !== 0) return riskComparison
        return right.recovery_exposure - left.recovery_exposure
      })
  }, [
    kycFilter,
    onHoldExposureByOperator,
    operatorNameById,
    overview?.operatorProfiles,
    recoveryExposureByOperator,
    reportOperatorFilter,
    riskStateFilter,
    tierFilter,
  ])

  const trendRows = useMemo<CommercialTrendRow[]>(() => {
    const monthMap = new Map<string, CommercialTrendRow>()

    const ensureMonth = (value: string | null | undefined) => {
      if (!value) return null
      const parsedValue = new Date(value)
      if (Number.isNaN(parsedValue.getTime())) return null

      const monthKey = format(parsedValue, 'yyyy-MM')
      const existing = monthMap.get(monthKey)
      if (existing) return existing

      const nextValue: CommercialTrendRow = {
        month_key: monthKey,
        month_label: format(parsedValue, 'MMM yyyy'),
        billing_cycles_closed: 0,
        invoiced_total: 0,
        commission_credit_total: 0,
        payouts_paid_total: 0,
        payouts_scheduled_total: 0,
        promo_discount_total: 0,
        recovery_pending_total: 0,
      }

      monthMap.set(monthKey, nextValue)
      return nextValue
    }

    for (const row of reportBillingRows) {
      const month = ensureMonth(row.cycle_end ?? row.issued_at ?? row.cycle_start)
      if (!month) continue
      month.billing_cycles_closed += 1
      month.invoiced_total += row.final_membership_charge
      month.commission_credit_total += row.prior_cycle_commission_credit
    }

    for (const row of reportPayoutRows) {
      const month = ensureMonth(row.paid_at ?? row.payout_due_at ?? row.travel_date)
      if (!month) continue

      if (row.payout_status === 'paid') {
        month.payouts_paid_total += row.operator_payable_amount
      }

      if (row.payout_status === 'scheduled') {
        month.payouts_scheduled_total += row.operator_payable_amount
      }

      month.promo_discount_total += row.promo_discount_value

      if (row.payout_status === 'recovery_pending') {
        month.recovery_pending_total += row.recovery_amount
      }
    }

    return Array.from(monthMap.values())
      .sort((left, right) => right.month_key.localeCompare(left.month_key))
      .slice(0, 6)
  }, [reportBillingRows, reportPayoutRows])

  const reconciliationChecks = useMemo(() => {
    const financeSnapshotRows = overview?.financeSnapshotRows ?? []
    const allPayoutRows = overview?.payoutRows ?? []
    const allBillingRows = overview?.billingRows ?? []

    const derived = {
      total_operator_liability_not_ready: 0,
      total_payouts_eligible_unbatched: 0,
      total_payouts_scheduled: 0,
      total_payouts_completed: 0,
      total_payouts_on_hold: 0,
      total_commission_collected: 0,
      total_refunds: 0,
      total_payouts_recovery_pending: 0,
      outstanding_recovery_balances: 0,
      total_membership_fees_charged: 0,
      total_membership_adjustments: 0,
      total_prior_commission_credit: 0,
      total_final_membership_charge: 0,
    }

    for (const row of financeSnapshotRows) {
      const commissionCollected = Number.isFinite(row.commission_collected)
        ? row.commission_collected
        : row.commission_amount
      const cashBucketValue = Math.max(
        row.payment_collected - row.refund_amount - commissionCollected,
        0,
      )

      derived.total_commission_collected += commissionCollected
      derived.total_refunds += row.refund_amount

      if (row.payout_status === 'not_ready')
        derived.total_operator_liability_not_ready += cashBucketValue
      if (row.payout_status === 'eligible')
        derived.total_payouts_eligible_unbatched += cashBucketValue
      if (row.payout_status === 'scheduled') derived.total_payouts_scheduled += cashBucketValue
      if (row.payout_status === 'paid') derived.total_payouts_completed += cashBucketValue
      if (row.payout_status === 'on_hold') derived.total_payouts_on_hold += cashBucketValue
    }

    for (const row of allPayoutRows) {
      derived.outstanding_recovery_balances += row.recovery_amount
      if (row.payout_status === 'recovery_pending')
        derived.total_payouts_recovery_pending += row.recovery_amount
    }

    for (const row of allBillingRows) {
      derived.total_membership_fees_charged += row.membership_fee
      derived.total_membership_adjustments += row.adjustment_applied
      derived.total_prior_commission_credit += row.prior_cycle_commission_credit
      derived.total_final_membership_charge += row.final_membership_charge
    }

    const derivedReconciliationRhs =
      derived.total_operator_liability_not_ready +
      derived.total_payouts_completed +
      derived.total_payouts_scheduled +
      derived.total_payouts_on_hold +
      derived.total_payouts_eligible_unbatched +
      derived.total_commission_collected +
      derived.total_refunds

    const financeHealth = overview?.financeHealth
    const financeSummary = overview?.financeSummary

    const payoutComparisons = [
      {
        label: 'Not-ready liability',
        source: financeHealth?.total_operator_liability_not_ready ?? 0,
        derived: derived.total_operator_liability_not_ready,
      },
      {
        label: 'Eligible unbatched payouts',
        source: financeHealth?.total_payouts_eligible_unbatched ?? 0,
        derived: derived.total_payouts_eligible_unbatched,
      },
      {
        label: 'Scheduled payouts',
        source: financeHealth?.total_payouts_scheduled ?? 0,
        derived: derived.total_payouts_scheduled,
      },
      {
        label: 'Paid payouts',
        source: financeHealth?.total_payouts_completed ?? 0,
        derived: derived.total_payouts_completed,
      },
      {
        label: 'On-hold payouts',
        source: financeHealth?.total_payouts_on_hold ?? 0,
        derived: derived.total_payouts_on_hold,
      },
      {
        label: 'Commission collected',
        source: financeHealth?.total_commission_collected ?? 0,
        derived: derived.total_commission_collected,
      },
      {
        label: 'Refunds',
        source: financeHealth?.total_refunds ?? 0,
        derived: derived.total_refunds,
      },
      {
        label: 'Reconciliation RHS',
        source: financeHealth?.reconciliation_rhs ?? 0,
        derived: derivedReconciliationRhs,
      },
      {
        label: 'Recovery pending',
        source: financeHealth?.total_payouts_recovery_pending ?? 0,
        derived: derived.total_payouts_recovery_pending,
      },
      {
        label: 'Outstanding recoveries',
        source: financeHealth?.outstanding_recovery_balances ?? 0,
        derived: derived.outstanding_recovery_balances,
      },
    ].map((row) => ({ ...row, delta: row.source - row.derived }))

    const billingComparisons = [
      {
        label: 'Membership fees charged',
        source: financeSummary?.total_membership_fees_charged ?? 0,
        derived: derived.total_membership_fees_charged,
      },
      {
        label: 'Adjustments and waivers',
        source: financeSummary?.total_membership_fees_waived_adjusted ?? 0,
        derived: derived.total_membership_adjustments,
      },
      {
        label: 'Recovery pending summary',
        source: financeSummary?.total_recovery_pending ?? 0,
        derived: derived.total_payouts_recovery_pending,
      },
    ].map((row) => ({ ...row, delta: row.source - row.derived }))

    const formulaBreaks = allBillingRows.filter((row) => {
      return (
        Math.abs(
          row.membership_fee -
            row.prior_cycle_commission_credit -
            row.adjustment_applied -
            row.final_membership_charge,
        ) > 0.01
      )
    })

    const operatorFundedPromoDiscountTotal = allPayoutRows.reduce((sum, row) => {
      return row.promo_funding_source === 'operator' ? sum + row.promo_discount_value : sum
    }, 0)

    const platformFundedPromoDiscountTotal = allPayoutRows.reduce((sum, row) => {
      return row.promo_funding_source === 'platform' ? sum + row.promo_discount_value : sum
    }, 0)

    const releaseBlocker =
      payoutComparisons.some((row) => Math.abs(row.delta) > 0.01) ||
      billingComparisons.some((row) => Math.abs(row.delta) > 0.01) ||
      formulaBreaks.length > 0

    return {
      payoutComparisons,
      billingComparisons,
      formulaBreakCount: formulaBreaks.length,
      operatorFundedPromoDiscountTotal,
      platformFundedPromoDiscountTotal,
      totalPriorCommissionCredit: derived.total_prior_commission_credit,
      totalFinalMembershipCharge: derived.total_final_membership_charge,
      releaseBlocker,
    }
  }, [
    overview?.billingRows,
    overview?.financeHealth,
    overview?.financeSnapshotRows,
    overview?.financeSummary,
    overview?.payoutRows,
  ])

  const opsReviewSummary = useMemo(() => {
    return {
      payoutHolds: operatorRiskRows.filter((row) => row.payout_hold || row.on_hold_exposure > 0)
        .length,
      fraudReview: operatorRiskRows.filter((row) => row.fraud_review_required).length,
      kycBlocked: operatorRiskRows.filter((row) => row.kyc_status !== 'approved').length,
      recoveryPending: operatorRiskRows.filter((row) => row.recovery_exposure > 0).length,
    }
  }, [operatorRiskRows])

  const visibleAuditRows = useMemo(() => {
    return auditRows.filter((row) => {
      if (historyEntityTypeFilter !== 'all' && row.entity_type !== historyEntityTypeFilter) {
        return false
      }

      if (historyActionTypeFilter !== 'all' && row.action_type !== historyActionTypeFilter) {
        return false
      }

      if (historyOperatorFilter !== 'all') {
        const operatorIds = getAuditOperatorIds(row)
        if (!operatorIds.includes(historyOperatorFilter)) {
          return false
        }
      }

      return true
    })
  }, [auditRows, historyActionTypeFilter, historyEntityTypeFilter, historyOperatorFilter])

  useEffect(() => {
    if (!selectedRecoveryRow) return
    setRecoveryAmount(selectedRecoveryRow.recovery_amount.toString())
  }, [selectedRecoveryRow])

  const exportBillingLifecycleCsv = () => {
    downloadCsvFile(
      'commercial-billing-lifecycle.csv',
      [
        'Operator',
        'Tier',
        'Cycle start',
        'Cycle end',
        'Invoice status',
        'Membership fee',
        'Commission credit',
        'Adjustment',
        'Final charge',
        'Invoice number',
        'Issued at',
        'Due date',
        'Paid at',
      ],
      reportBillingRows.map((row) => [
        operatorNameById.get(row.operator_user_id) ?? row.operator_user_id,
        row.membership_tier_code,
        row.cycle_start,
        row.cycle_end,
        row.invoice_status,
        row.membership_fee,
        row.prior_cycle_commission_credit,
        row.adjustment_applied,
        row.final_membership_charge,
        row.invoice_number,
        row.issued_at,
        row.due_date,
        row.paid_at,
      ]),
    )
  }

  const exportPayoutOperationsCsv = () => {
    downloadCsvFile(
      'commercial-payout-operations.csv',
      [
        'Operator',
        'Trip',
        'Batch',
        'Status',
        'Travel date',
        'Due at',
        'Paid at',
        'Gross amount',
        'Refund amount',
        'Commission collected',
        'Commission remaining',
        'Operator payable',
        'Recovery amount',
        'Promo owner',
        'Promo funding',
        'Promo discount',
      ],
      reportPayoutRows.map((row) => [
        operatorNameById.get(row.operator_user_id) ?? row.operator_user_id,
        row.trip_name ?? row.booking_id,
        row.batch_reference,
        row.payout_status,
        row.travel_date,
        row.payout_due_at,
        row.paid_at,
        row.gross_amount,
        row.refund_amount,
        row.commission_collected,
        row.commission_remaining,
        row.operator_payable_amount,
        row.recovery_amount,
        row.promo_owner,
        row.promo_funding_source,
        row.promo_discount_value,
      ]),
    )
  }

  const exportPromoPerformanceCsv = () => {
    downloadCsvFile(
      'commercial-promo-performance.csv',
      [
        'Operator',
        'Promo',
        'Code',
        'Funding source',
        'Status',
        'Bookings',
        'Discount total',
        'Operator-funded discount',
        'Platform-funded discount',
        'Commission remaining exposure',
        'Operator payable total',
      ],
      promoPerformanceRows.map((row) => [
        row.operator_name,
        row.title,
        row.code,
        row.funding_source,
        row.is_active ? 'active' : 'inactive',
        row.bookings_count,
        row.discount_total,
        row.operator_funded_discount_total,
        row.platform_funded_discount_total,
        row.commission_remaining_exposure,
        row.operator_payable_total,
      ]),
    )
  }

  const exportRiskReviewCsv = () => {
    downloadCsvFile(
      'commercial-risk-review.csv',
      [
        'Operator',
        'Tier',
        'KYC status',
        'Primary risk',
        'Signals',
        'On-hold exposure',
        'Recovery exposure',
        'Cancellation count',
      ],
      operatorRiskRows.map((row) => [
        row.operator_name,
        row.membership_tier_code,
        row.kyc_status,
        formatRiskState(row.primary_risk),
        row.risk_signals.join(' | '),
        row.on_hold_exposure,
        row.recovery_exposure,
        row.operator_fault_cancellation_count,
      ]),
    )
  }

  const exportAuditHistoryCsv = () => {
    downloadCsvFile(
      'commercial-audit-history.csv',
      ['When', 'Action', 'Entity type', 'Entity id', 'Actor email', 'Actor role', 'Reason'],
      visibleAuditRows.map((row) => [
        row.created_at,
        row.action_type,
        row.entity_type,
        row.entity_id,
        row.admin_email,
        row.admin_role,
        row.reason,
      ]),
    )
  }

  const handlePromoFormChange = (field: keyof AdminPromoFormState, value: string) => {
    setPromoForm((current) => ({ ...current, [field]: value }))
  }

  const resetPromoForm = (operatorUserId = selectedOperatorId) => {
    setPromoForm(createEmptyAdminPromoForm(operatorUserId))
    setEditingPromotionId(null)
    setPromoError(null)
  }

  const handleEditPromotion = (promotion: CommercialPromotion) => {
    setEditingPromotionId(promotion.id)
    setPromoForm(toAdminPromoForm(promotion))
    setPromoError(null)
  }

  const handleSavePromotion = async () => {
    const operatorUserId = promoForm.operatorUserId || selectedOperatorId
    const title = promoForm.title.trim()
    const code = promoForm.code.trim().toUpperCase()
    const discountValue = Number(promoForm.discountValue)
    const maxDiscountValue = promoForm.maxDiscountValue.trim()
      ? Number(promoForm.maxDiscountValue)
      : null

    if (!operatorUserId) {
      setPromoError('Select an operator for this promotion')
      return
    }

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
        operator_user_id: operatorUserId,
        applicable_tour_id:
          promoForm.applicableTourId === 'all' ? null : promoForm.applicableTourId,
        title,
        code,
        description: promoForm.description.trim() || null,
        owner_label: code,
        funding_source: promoForm.fundingSource,
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

      await load()
      resetPromoForm(operatorUserId)
    } catch (actionError) {
      setPromoError(actionError instanceof Error ? actionError.message : 'Failed to save promotion')
    } finally {
      setPromoSubmitting(false)
    }
  }

  const handleAssignTier = async () => {
    if (!selectedOperatorId) return

    try {
      setSubmitting(true)
      await commercialService.assignOperatorTier(selectedOperatorId, tierCode, tierReason)
      toast.success('Operator membership tier updated')
      setTierReason('')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to update tier')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleHold = async () => {
    if (!selectedOperator) return

    const reasonText = holdReason.trim()
    if (reasonText.length < MIN_ADMIN_ACTION_REASON_LENGTH) {
      toast.error('Hold or release reason must be at least 10 characters')
      return
    }

    try {
      setSubmitting(true)
      await commercialService.updateOperatorPayoutHold(
        selectedOperator.operator_user_id,
        !selectedOperator.payout_hold,
        reasonText,
      )
      toast.success(selectedOperator.payout_hold ? 'Payout hold released' : 'Payout hold applied')
      setHoldReason('')
      await load()
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : 'Failed to update payout hold',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseBillingCycle = async () => {
    if (!selectedOperatorId) return

    try {
      setSubmitting(true)
      await commercialService.closeBillingCycle(selectedOperatorId)
      toast.success('Billing cycle closed and next invoice generated')
      await load()
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : 'Failed to close billing cycle',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleScheduleBatch = async () => {
    try {
      setSubmitting(true)
      const batch = await commercialService.schedulePayoutBatch()
      toast.success(
        batch ? `Scheduled ${batch.batch_reference}` : 'No eligible payout items to batch',
      )
      await load()
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : 'Failed to schedule payout batch',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkBatchPaid = async () => {
    if (!selectedBatchId) return

    try {
      setSubmitting(true)
      const batch = await commercialService.markPayoutBatchPaid(selectedBatchId)
      toast.success(batch ? `${batch.batch_reference} marked paid` : 'Batch paid')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to mark batch paid')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReverseBatch = async () => {
    if (!selectedBatchId) return

    const reasonText = batchActionReason.trim()
    if (reasonText.length < MIN_ADMIN_ACTION_REASON_LENGTH) {
      toast.error('Batch reversal reason must be at least 10 characters')
      return
    }

    try {
      setSubmitting(true)
      const result = await commercialService.reversePayoutBatch(selectedBatchId, reasonText)
      if (result?.previous_status === 'paid') {
        toast.success(`${result.batch_reference} reversed into recovery`)
      } else {
        toast.success(`${result?.batch_reference ?? 'Batch'} unscheduled and returned to eligible`)
      }
      setBatchActionReason('')
      await load()
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : 'Failed to reverse payout batch',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolveRecovery = async () => {
    if (!selectedRecoveryItemId) return

    const reasonText = recoveryReason.trim()
    if (reasonText.length < MIN_ADMIN_ACTION_REASON_LENGTH) {
      toast.error('Recovery resolution reason must be at least 10 characters')
      return
    }

    try {
      setSubmitting(true)
      const amount = recoveryAmount.trim() ? Number(recoveryAmount) : undefined
      const result = await commercialService.resolvePayoutRecovery(
        selectedRecoveryItemId,
        amount,
        reasonText,
      )
      if (result?.remaining_recovery_amount) {
        toast.success(
          `Recovery updated. PKR ${result.remaining_recovery_amount.toLocaleString()} still outstanding`,
        )
      } else {
        toast.success('Recovery completed and payout item closed')
      }
      setRecoveryReason('')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to resolve recovery')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApplyDisputeStatus = async (disputeCase: OperatorPayoutDisputeCase) => {
    const nextStatus = disputeStatusById[disputeCase.id] || disputeCase.status
    if (nextStatus === disputeCase.status) return

    try {
      setSubmitting(true)
      const updatedCase = await commercialService.updateOperatorPayoutDisputeCaseStatus(
        disputeCase.id,
        nextStatus,
      )
      setDisputeCases((current) =>
        current.map((row) => (row.id === updatedCase.id ? updatedCase : row)),
      )
      setDisputeStatusById((current) => ({ ...current, [updatedCase.id]: updatedCase.status }))
      toast.success('Dispute case status updated')
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : 'Failed to update dispute status',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commercial</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Finance overview, operator commercial controls, billing cycle actions, and payout batch
            management.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleScheduleBatch} disabled={submitting || loading}>
            Create payout batch
          </Button>
          <Button
            onClick={handleMarkBatchPaid}
            disabled={submitting || loading || !selectedBatchId}
          >
            Mark batch paid
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <Card key={card.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <card.icon className="h-4 w-4" />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {loading ? 'Loading…' : card.value}
              </p>
              <Button
                variant="ghost"
                className="mt-3 h-auto px-0 text-xs text-muted-foreground"
                onClick={() => handleSummaryDrillDown(card.id)}
              >
                Drill into report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="h-auto p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operators">Operators</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="promos">Promos</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Finance health</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <HealthMetric
                  label="Customer payments"
                  value={formatMoney(
                    overview?.financeHealth?.total_customer_payments_collected ?? 0,
                  )}
                />
                <HealthMetric
                  label="Commission collected"
                  value={formatMoney(overview?.financeHealth?.total_commission_collected ?? 0)}
                />
                <HealthMetric
                  label="Not-ready operator liability"
                  value={formatMoney(
                    overview?.financeHealth?.total_operator_liability_not_ready ?? 0,
                  )}
                />
                <HealthMetric
                  label="Reconciliation RHS"
                  value={formatMoney(overview?.financeHealth?.reconciliation_rhs ?? 0)}
                />
                <HealthMetric
                  label="Eligible unbatched"
                  value={formatMoney(
                    overview?.financeHealth?.total_payouts_eligible_unbatched ?? 0,
                  )}
                />
                <HealthMetric
                  label="Recovery exposure"
                  value={formatMoney(overview?.financeHealth?.outstanding_recovery_balances ?? 0)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reconciliation status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Delta</p>
                  <p
                    className={
                      Math.abs(overview?.financeHealth?.reconciliation_delta ?? 0) <= 0.01
                        ? 'mt-2 text-2xl font-bold text-emerald-600'
                        : 'mt-2 text-2xl font-bold text-amber-600'
                    }
                  >
                    {formatSignedMoney(overview?.financeHealth?.reconciliation_delta ?? 0)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {Math.abs(overview?.financeHealth?.reconciliation_delta ?? 0) <= 0.01
                      ? 'Marketplace reconciliation is balanced within tolerance.'
                      : 'Reconciliation needs review because collected cash does not match its commission, refund, and operator-liability buckets.'}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Commission accrued</p>
                    <p className="mt-2 text-xl font-bold text-foreground">
                      {formatMoney(overview?.financeHealth?.total_commission_earned ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Commission still outstanding</p>
                    <p className="mt-2 text-xl font-bold text-foreground">
                      {formatMoney(overview?.financeHealth?.total_commission_remaining ?? 0)}
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bucket</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Operator liability not ready for payout</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(
                          overview?.financeHealth?.total_operator_liability_not_ready ?? 0,
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Eligible unbatched payouts</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(
                          overview?.financeHealth?.total_payouts_eligible_unbatched ?? 0,
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Payouts completed</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(overview?.financeHealth?.total_payouts_completed ?? 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Payouts scheduled</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(overview?.financeHealth?.total_payouts_scheduled ?? 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Payouts on hold</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(overview?.financeHealth?.total_payouts_on_hold ?? 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>TripAvail commission collected</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(overview?.financeHealth?.total_commission_collected ?? 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Refunds</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(overview?.financeHealth?.total_refunds ?? 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fraud review queue</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triggered</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedOperators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No operators currently require fraud review.
                      </TableCell>
                    </TableRow>
                  ) : (
                    flaggedOperators.map((profile) => (
                      <TableRow key={profile.operator_user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {profile.tour_operator_profiles?.company_name ||
                                profile.tour_operator_profiles?.contact_person ||
                                profile.operator_user_id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {profile.operator_user_id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="border-0 bg-amber-500 text-white hover:bg-amber-500">
                            Review required
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTimestamp(profile.fraud_review_triggered_at)}</TableCell>
                        <TableCell>
                          {profile.fraud_review_reason ?? 'Manual review required'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tier performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Operators</TableHead>
                    <TableHead className="text-right">Average GMV</TableHead>
                    <TableHead className="text-right">Average payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(overview?.tierReportRows ?? []).map((row) => (
                    <TableRow key={row.membership_tier_code}>
                      <TableCell>{row.display_name}</TableCell>
                      <TableCell>{row.operators_count}</TableCell>
                      <TableCell className="text-right">{formatMoney(row.average_gmv)}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.average_payout)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operators" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operator finance controls</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Select operator</label>
                <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {(overview?.operatorProfiles ?? []).map((profile) => (
                      <SelectItem key={profile.operator_user_id} value={profile.operator_user_id}>
                        {profile.tour_operator_profiles?.company_name ||
                          profile.tour_operator_profiles?.contact_person ||
                          profile.operator_user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedOperator ? (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">
                        {selectedOperator.tour_operator_profiles?.company_name ||
                          'Unnamed operator'}
                      </p>
                      <Badge
                        variant={selectedOperator.fraud_review_required ? 'destructive' : 'outline'}
                        className={
                          selectedOperator.fraud_review_required
                            ? 'border-0'
                            : 'border-border/60 bg-background/60 text-muted-foreground'
                        }
                      >
                        {selectedOperator.fraud_review_required
                          ? 'Fraud review required'
                          : 'Fraud review clear'}
                      </Badge>
                    </div>
                    <p>City: {selectedOperator.tour_operator_profiles?.primary_city || '—'}</p>
                    <p>KYC: {selectedOperator.kyc_status}</p>
                    <p>Operational status: {selectedOperator.operational_status}</p>
                    <p>
                      Operator-fault cancellations:{' '}
                      {selectedOperator.operator_fault_cancellation_count}
                    </p>
                    <p>
                      Cancellation penalty:{' '}
                      {selectedOperator.cancellation_penalty_active ? 'Active' : 'Clear'}
                    </p>
                    <p>
                      Penalty triggered:{' '}
                      {formatDate(selectedOperator.cancellation_penalty_triggered_at)}
                    </p>
                    <p>
                      Fraud review triggered:{' '}
                      {formatTimestamp(selectedOperator.fraud_review_triggered_at)}
                    </p>
                    <p>Fraud review reason: {selectedOperator.fraud_review_reason ?? '—'}</p>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">Membership tier</p>
                  <Select
                    value={tierCode}
                    onValueChange={(value) => setTierCode(value as MembershipTierCode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={tierReason}
                    onChange={(event) => setTierReason(event.target.value)}
                    placeholder="Reason for tier change"
                  />
                  <Button onClick={handleAssignTier} disabled={submitting || !selectedOperatorId}>
                    Apply tier change
                  </Button>
                </div>

                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">Payout hold</p>
                  <Input
                    value={holdReason}
                    onChange={(event) => setHoldReason(event.target.value)}
                    placeholder="Hold reason shown on payout items"
                  />
                  <Button
                    variant="outline"
                    onClick={handleToggleHold}
                    disabled={submitting || !selectedOperator}
                  >
                    {selectedOperator?.payout_hold ? 'Release payout hold' : 'Apply payout hold'}
                  </Button>
                  <Button
                    onClick={handleCloseBillingCycle}
                    disabled={submitting || !selectedOperatorId}
                  >
                    Close billing cycle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Billing cycles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Final charge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBillingRows.map((row) => (
                    <TableRow key={row.billing_cycle_id}>
                      <TableCell>{row.operator_user_id.slice(0, 8)}</TableCell>
                      <TableCell>
                        {formatDate(row.cycle_start)} to {formatDate(row.cycle_end)}
                      </TableCell>
                      <TableCell>{row.invoice_status}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.final_membership_charge)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payout batches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose payout batch" />
                </SelectTrigger>
                <SelectContent>
                  {(overview?.payoutBatches ?? []).map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_reference} · {batch.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-[1fr_auto_auto] md:items-end">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Batch reversal reason</p>
                  <Textarea
                    value={batchActionReason}
                    onChange={(event) => setBatchActionReason(event.target.value)}
                    placeholder="Explain why this batch is being reversed or unscheduled"
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedBatch?.status === 'paid'
                      ? 'Paid batches move items into recovery_pending with full recovery amounts.'
                      : 'Scheduled batches are unwound back to eligible so they can be re-batched.'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReverseBatch}
                  disabled={
                    submitting ||
                    loading ||
                    !selectedBatchId ||
                    selectedBatch?.status === 'reversed'
                  }
                >
                  Reverse batch
                </Button>
                <Button
                  onClick={handleMarkBatchPaid}
                  disabled={
                    submitting ||
                    loading ||
                    !selectedBatchId ||
                    selectedBatch?.status === 'paid' ||
                    selectedBatch?.status === 'reversed'
                  }
                >
                  Mark batch paid
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Recovery offset</TableHead>
                    <TableHead className="text-right">Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(overview?.payoutBatches ?? []).map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>{batch.batch_reference}</TableCell>
                      <TableCell>{formatDate(batch.scheduled_for)}</TableCell>
                      <TableCell>{batch.status}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(batch.total_recovery_deduction_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(batch.total_operator_payable)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recovery resolution</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Recovery item</label>
                <Select value={selectedRecoveryItemId} onValueChange={setSelectedRecoveryItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose recovery item" />
                  </SelectTrigger>
                  <SelectContent>
                    {recoveryRows.map((row) => (
                      <SelectItem key={row.payout_item_id} value={row.payout_item_id}>
                        {row.trip_name ?? row.booking_id.slice(0, 8)} ·{' '}
                        {formatMoney(row.recovery_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRecoveryRow ? (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {selectedRecoveryRow.trip_name ?? selectedRecoveryRow.booking_id.slice(0, 8)}
                    </p>
                    <p>Outstanding recovery: {formatMoney(selectedRecoveryRow.recovery_amount)}</p>
                    <p>Batch: {selectedRecoveryRow.batch_reference ?? '—'}</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No recovery items are waiting for settlement.
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-border p-4">
                <p className="font-medium text-foreground">Resolve recovery</p>
                <Input
                  value={recoveryAmount}
                  onChange={(event) => setRecoveryAmount(event.target.value)}
                  placeholder="Amount recovered in PKR"
                />
                <Textarea
                  value={recoveryReason}
                  onChange={(event) => setRecoveryReason(event.target.value)}
                  placeholder="Recovery note or evidence reference"
                />
                <Button
                  onClick={handleResolveRecovery}
                  disabled={submitting || !selectedRecoveryItemId}
                >
                  Apply recovery settlement
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payout queue</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Promo</TableHead>
                    <TableHead className="text-right">Commission split</TableHead>
                    <TableHead className="text-right">Recovery offset</TableHead>
                    <TableHead className="text-right">Net payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayoutRows.map((row) => (
                    <TableRow key={row.payout_item_id}>
                      <TableCell>{row.trip_name ?? row.booking_id.slice(0, 8)}</TableCell>
                      <TableCell>{row.batch_reference ?? 'Unbatched'}</TableCell>
                      <TableCell>{row.payout_status}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatPromoAttribution(
                          row.promo_owner,
                          row.promo_funding_source,
                          row.promo_discount_value,
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatMoney(row.commission_collected)} /{' '}
                        {formatMoney(row.commission_remaining)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.recovery_deduction_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.net_operator_payable_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operator payout dispute cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                These cases are submitted from the operator commercial page and escalated through
                the booking conversation. Finance and support can triage them here without leaving
                the commercial console.
              </div>

              {filteredDisputeCases.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No payout dispute cases match the current operator filter.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operator</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Requested action</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Support</TableHead>
                      <TableHead className="text-right">Apply</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisputeCases.map((disputeCase) => {
                      const payoutRow = overview?.payoutRows.find(
                        (row) => row.payout_item_id === disputeCase.payout_item_id,
                      )
                      const disputeReport = asObject(disputeCase.reconciliation_report)

                      return (
                        <TableRow key={disputeCase.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {operatorNameById.get(disputeCase.operator_user_id) ??
                                  disputeCase.operator_user_id.slice(0, 8)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {formatTimestamp(disputeCase.created_at)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {payoutRow?.trip_name ?? disputeCase.booking_id.slice(0, 8)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Booking {disputeCase.booking_id.slice(0, 8).toUpperCase()} ·{' '}
                                {String(
                                  payoutRow?.payout_status ?? disputeReport?.payout_status ?? '—',
                                )}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Promo:{' '}
                                {formatPromoAttribution(
                                  payoutRow?.promo_owner,
                                  payoutRow?.promo_funding_source,
                                  payoutRow?.promo_discount_value,
                                )}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Refund:{' '}
                                {formatMoney(
                                  Number(
                                    disputeReport?.refund_amount ?? payoutRow?.refund_amount ?? 0,
                                  ),
                                )}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {formatAuditAction(disputeCase.dispute_category)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {disputeCase.reason_summary}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{formatAuditAction(disputeCase.requested_action)}</TableCell>
                          <TableCell>
                            <Select
                              value={disputeStatusById[disputeCase.id] || disputeCase.status}
                              onValueChange={(value) =>
                                setDisputeStatusById((current) => ({
                                  ...current,
                                  [disputeCase.id]: value as OperatorPayoutDisputeCase['status'],
                                }))
                              }
                              disabled={submitting}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="in_review">In review</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {disputeCase.support_escalated_at
                              ? formatTimestamp(disputeCase.support_escalated_at)
                              : 'Not escalated'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              onClick={() => handleApplyDisputeStatus(disputeCase)}
                              disabled={
                                submitting ||
                                (disputeStatusById[disputeCase.id] || disputeCase.status) ===
                                  disputeCase.status
                              }
                            >
                              Apply
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promos" className="space-y-6 pt-4">
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create or edit promo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Operator
                    </label>
                    <Select
                      value={promoForm.operatorUserId || selectedOperatorId}
                      onValueChange={(value) => handlePromoFormChange('operatorUserId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {(overview?.operatorProfiles ?? []).map((profile) => (
                          <SelectItem
                            key={profile.operator_user_id}
                            value={profile.operator_user_id}
                          >
                            {profile.tour_operator_profiles?.company_name ||
                              profile.tour_operator_profiles?.contact_person ||
                              profile.operator_user_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Scope</label>
                    <Select
                      value={promoForm.applicableTourId}
                      onValueChange={(value) => handlePromoFormChange('applicableTourId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All operator trips</SelectItem>
                        {promoScopedTours.map((tour) => (
                          <SelectItem key={tour.id} value={tour.id}>
                            {tour.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                    <Input
                      value={promoForm.title}
                      onChange={(event) => handlePromoFormChange('title', event.target.value)}
                      placeholder="TripAvail launch support"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Promo code
                    </label>
                    <Input
                      value={promoForm.code}
                      onChange={(event) =>
                        handlePromoFormChange('code', event.target.value.toUpperCase())
                      }
                      placeholder="LAUNCH10K"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Funding source
                    </label>
                    <Select
                      value={promoForm.fundingSource}
                      onValueChange={(value) => handlePromoFormChange('fundingSource', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="platform">Platform-funded</SelectItem>
                        <SelectItem value="operator">Operator-funded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Status</label>
                    <Select
                      value={promoForm.isActive}
                      onValueChange={(value) => handlePromoFormChange('isActive', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Discount type
                    </label>
                    <Select
                      value={promoForm.discountType}
                      onValueChange={(value) => handlePromoFormChange('discountType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed_amount">Fixed amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Discount value
                    </label>
                    <Input
                      value={promoForm.discountValue}
                      onChange={(event) =>
                        handlePromoFormChange('discountValue', event.target.value)
                      }
                      type="number"
                      min="0"
                      placeholder={promoForm.discountType === 'percentage' ? '15' : '10000'}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Max discount
                    </label>
                    <Input
                      value={promoForm.maxDiscountValue}
                      onChange={(event) =>
                        handlePromoFormChange('maxDiscountValue', event.target.value)
                      }
                      type="number"
                      min="0"
                      placeholder="Optional cap"
                      disabled={promoForm.discountType !== 'percentage'}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Starts at
                    </label>
                    <Input
                      value={promoForm.startsAt}
                      onChange={(event) => handlePromoFormChange('startsAt', event.target.value)}
                      type="datetime-local"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Ends at
                    </label>
                    <Input
                      value={promoForm.endsAt}
                      onChange={(event) => handlePromoFormChange('endsAt', event.target.value)}
                      type="datetime-local"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Description
                  </label>
                  <Textarea
                    value={promoForm.description}
                    onChange={(event) => handlePromoFormChange('description', event.target.value)}
                    placeholder="Explain the campaign and intended margin owner."
                  />
                </div>

                {promoError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {promoError}
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <Button onClick={handleSavePromotion} disabled={promoSubmitting}>
                    {promoSubmitting
                      ? 'Saving...'
                      : editingPromotionId
                        ? 'Update promo'
                        : 'Create promo'}
                  </Button>
                  {editingPromotionId ? (
                    <Button
                      variant="outline"
                      onClick={() => resetPromoForm(promoForm.operatorUserId || selectedOperatorId)}
                      disabled={promoSubmitting}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promo inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Promo</TableHead>
                      <TableHead>Operator</TableHead>
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
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No promotions configured.
                        </TableCell>
                      </TableRow>
                    ) : (
                      promotions.map((promotion) => (
                        <TableRow key={promotion.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{promotion.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {promotion.code} · {promotion.funding_source}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {operatorNameById.get(promotion.operator_user_id) ??
                              promotion.operator_user_id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            {promotion.applicable_tour?.title ?? 'All operator trips'}
                          </TableCell>
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

        <TabsContent value="reports" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Start date</label>
                  <Input
                    type="date"
                    value={reportStartDate}
                    onChange={(event) => setReportStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">End date</label>
                  <Input
                    type="date"
                    value={reportEndDate}
                    onChange={(event) => setReportEndDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Operator</label>
                  <Select value={reportOperatorFilter} onValueChange={setReportOperatorFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All operators</SelectItem>
                      {(overview?.operatorProfiles ?? []).map((profile) => (
                        <SelectItem key={profile.operator_user_id} value={profile.operator_user_id}>
                          {operatorNameById.get(profile.operator_user_id) ??
                            profile.operator_user_id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Billing status</label>
                  <Select value={billingStatusFilter} onValueChange={setBillingStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All billing statuses</SelectItem>
                      {billingStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Payout status</label>
                  <Select value={payoutStatusFilter} onValueChange={setPayoutStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All payout statuses</SelectItem>
                      {payoutStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Promo funding</label>
                  <Select value={promoFundingFilter} onValueChange={setPromoFundingFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All funding sources</SelectItem>
                      <SelectItem value="platform">Platform-funded</SelectItem>
                      <SelectItem value="operator">Operator-funded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Risk state</label>
                  <Select value={riskStateFilter} onValueChange={setRiskStateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All risk states</SelectItem>
                      <SelectItem value="fraud_review">Fraud review</SelectItem>
                      <SelectItem value="payout_hold">Payout hold</SelectItem>
                      <SelectItem value="recovery_pending">Recovery pending</SelectItem>
                      <SelectItem value="kyc_blocked">KYC blocker</SelectItem>
                      <SelectItem value="cancellation_penalty">Cancellation penalty</SelectItem>
                      <SelectItem value="clear">Clear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tier</label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tiers</SelectItem>
                      {tierOptions.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">KYC status</label>
                  <Select value={kycFilter} onValueChange={setKycFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All KYC states</SelectItem>
                      {kycOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={resetReportFilters}>
                  Reset filters
                </Button>
                <p className="text-xs text-muted-foreground">
                  Exports use the filters and date window currently applied here.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly ops review pack</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <HealthMetric label="Payout holds" value={String(opsReviewSummary.payoutHolds)} />
                  <HealthMetric label="Fraud review" value={String(opsReviewSummary.fraudReview)} />
                  <HealthMetric label="KYC blockers" value={String(opsReviewSummary.kycBlocked)} />
                  <HealthMetric
                    label="Recovery pending"
                    value={String(opsReviewSummary.recoveryPending)}
                  />
                </div>

                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Minimum review evidence</p>
                  <p className="mt-2">
                    Release holds only after KYC is approved, recovery exposure is explained, and
                    the hold reason is already preserved in audit history.
                  </p>
                  <p className="mt-2">
                    Resolve recoveries only after external payment proof, refund context, or finance
                    approval is referenced in the resolution reason.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      openReportSlice({ payoutStatus: 'on_hold', riskState: 'payout_hold' })
                    }
                  >
                    Review payout holds
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openReportSlice({ riskState: 'kyc_blocked' })}
                  >
                    Review KYC blockers
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      openReportSlice({
                        riskState: 'recovery_pending',
                        payoutStatus: 'recovery_pending',
                      })
                    }
                  >
                    Review recoveries
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reconciliation alignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`rounded-lg border p-4 ${reconciliationChecks.releaseBlocker ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
                >
                  <p className="text-sm font-medium text-foreground">
                    {reconciliationChecks.releaseBlocker
                      ? 'Release blocker: admin totals and row-backed totals diverge and should be reviewed before money-state changes.'
                      : 'Admin finance totals align with the loaded billing and payout views.'}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Billing formula breaks: {reconciliationChecks.formulaBreakCount}. Prior-cycle
                    commission credit:{' '}
                    {formatMoney(reconciliationChecks.totalPriorCommissionCredit)}. Final invoice
                    charges: {formatMoney(reconciliationChecks.totalFinalMembershipCharge)}.
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Check</TableHead>
                      <TableHead className="text-right">SQL / view</TableHead>
                      <TableHead className="text-right">Row-derived</TableHead>
                      <TableHead className="text-right">Delta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliationChecks.payoutComparisons.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell className="text-right">{formatMoney(row.source)}</TableCell>
                        <TableCell className="text-right">{formatMoney(row.derived)}</TableCell>
                        <TableCell
                          className={`text-right ${Math.abs(row.delta) <= 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}
                        >
                          {formatSignedMoney(row.delta)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reconciliationChecks.billingComparisons.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell className="text-right">{formatMoney(row.source)}</TableCell>
                        <TableCell className="text-right">{formatMoney(row.derived)}</TableCell>
                        <TableCell
                          className={`text-right ${Math.abs(row.delta) <= 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}
                        >
                          {formatSignedMoney(row.delta)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Operator-funded promo discounts</p>
                    <p className="mt-2 text-xl font-bold text-foreground">
                      {formatMoney(reconciliationChecks.operatorFundedPromoDiscountTotal)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Platform-funded promo discounts</p>
                    <p className="mt-2 text-xl font-bold text-foreground">
                      {formatMoney(reconciliationChecks.platformFundedPromoDiscountTotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg">Billing lifecycle</CardTitle>
              <Button variant="outline" size="sm" onClick={exportBillingLifecycleCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Membership fee</TableHead>
                    <TableHead className="text-right">Commission credit</TableHead>
                    <TableHead className="text-right">Adjustment</TableHead>
                    <TableHead className="text-right">Final charge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportBillingRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No billing cycles match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportBillingRows.map((row) => (
                      <TableRow key={row.billing_cycle_id}>
                        <TableCell>
                          {operatorNameById.get(row.operator_user_id) ??
                            row.operator_user_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {formatDate(row.cycle_start)} to {formatDate(row.cycle_end)}
                        </TableCell>
                        <TableCell>{row.invoice_status}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.membership_fee)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.prior_cycle_commission_credit)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.adjustment_applied)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.final_membership_charge)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg">Payout operations</CardTitle>
              <Button variant="outline" size="sm" onClick={exportPayoutOperationsCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-right">Operator payable</TableHead>
                    <TableHead className="text-right">Commission remaining</TableHead>
                    <TableHead className="text-right">Recovery</TableHead>
                    <TableHead className="text-right">Promo discount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportPayoutRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No payout items match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportPayoutRows.map((row) => (
                      <TableRow key={row.payout_item_id}>
                        <TableCell>
                          {operatorNameById.get(row.operator_user_id) ??
                            row.operator_user_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{row.trip_name ?? row.booking_id.slice(0, 8)}</TableCell>
                        <TableCell>{row.payout_status}</TableCell>
                        <TableCell>{row.batch_reference ?? 'Unbatched'}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.operator_payable_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.commission_remaining)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.recovery_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.promo_discount_value)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg">Promo performance</CardTitle>
              <Button variant="outline" size="sm" onClick={exportPromoPerformanceCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Promo</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Funding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Discount total</TableHead>
                    <TableHead className="text-right">Commission remaining</TableHead>
                    <TableHead className="text-right">Operator payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoPerformanceRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No promotions match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    promoPerformanceRows.map((row) => (
                      <TableRow key={row.promotion_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{row.title}</p>
                            <p className="text-xs text-muted-foreground">{row.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.operator_name}</TableCell>
                        <TableCell>{row.funding_source}</TableCell>
                        <TableCell>{row.is_active ? 'Active' : 'Inactive'}</TableCell>
                        <TableCell className="text-right">{row.bookings_count}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.discount_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.commission_remaining_exposure)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.operator_payable_total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg">Operator risk signals</CardTitle>
              <Button variant="outline" size="sm" onClick={exportRiskReviewCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Primary risk</TableHead>
                    <TableHead>Signals</TableHead>
                    <TableHead className="text-right">On-hold exposure</TableHead>
                    <TableHead className="text-right">Recovery exposure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operatorRiskRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No operators match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    operatorRiskRows.map((row) => (
                      <TableRow key={row.operator_user_id}>
                        <TableCell>{row.operator_name}</TableCell>
                        <TableCell>{row.membership_tier_code}</TableCell>
                        <TableCell>{row.kyc_status}</TableCell>
                        <TableCell>{formatRiskState(row.primary_risk)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.risk_signals.join(' · ')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.on_hold_exposure)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.recovery_exposure)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Commercial trend monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Cycles closed</TableHead>
                    <TableHead className="text-right">Invoiced</TableHead>
                    <TableHead className="text-right">Commission credit</TableHead>
                    <TableHead className="text-right">Payouts paid</TableHead>
                    <TableHead className="text-right">Payouts scheduled</TableHead>
                    <TableHead className="text-right">Promo discounts</TableHead>
                    <TableHead className="text-right">Recovery pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trendRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No trend data is available for the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trendRows.map((row) => (
                      <TableRow key={row.month_key}>
                        <TableCell>{row.month_label}</TableCell>
                        <TableCell className="text-right">{row.billing_cycles_closed}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.invoiced_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.commission_credit_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.payouts_paid_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.payouts_scheduled_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.promo_discount_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.recovery_pending_total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg">Commercial audit history</CardTitle>
              <Button variant="outline" size="sm" onClick={exportAuditHistoryCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Operator</label>
                  <Select value={historyOperatorFilter} onValueChange={setHistoryOperatorFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All operators</SelectItem>
                      {(overview?.operatorProfiles ?? []).map((profile) => (
                        <SelectItem key={profile.operator_user_id} value={profile.operator_user_id}>
                          {operatorNameById.get(profile.operator_user_id) ??
                            profile.operator_user_id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Entity type</label>
                  <Select
                    value={historyEntityTypeFilter}
                    onValueChange={setHistoryEntityTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All entity types</SelectItem>
                      {historyEntityTypeOptions.map((entityType) => (
                        <SelectItem key={entityType} value={entityType}>
                          {formatAuditEntityType(entityType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Action type</label>
                  <Select
                    value={historyActionTypeFilter}
                    onValueChange={setHistoryActionTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      {historyActionTypeOptions.map((actionType) => (
                        <SelectItem key={actionType} value={actionType}>
                          {formatAuditAction(actionType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>State change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleAuditRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No commercial audit events recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleAuditRows.map((row) => {
                      const previousState = asObject(row.previous_state)
                      const nextState = asObject(row.new_state)
                      const entityLabel =
                        row.entity_type === 'commercial_profile'
                          ? (operatorNameById.get(row.entity_id) ?? row.entity_id.slice(0, 8))
                          : row.entity_type === 'promotion'
                            ? String(
                                nextState?.title ??
                                  previousState?.title ??
                                  nextState?.code ??
                                  previousState?.code ??
                                  row.entity_id.slice(0, 8),
                              )
                            : row.entity_type === 'payout_batch'
                              ? String(
                                  nextState?.batch_reference ??
                                    previousState?.batch_reference ??
                                    row.entity_id.slice(0, 8),
                                )
                              : String(
                                  nextState?.booking_id ??
                                    previousState?.booking_id ??
                                    row.entity_id.slice(0, 8),
                                )
                      const stateSummary =
                        row.action_type === 'membership_tier_changed'
                          ? `${String(previousState?.previous_tier_code ?? '—')} -> ${String(nextState?.new_tier_code ?? '—')}`
                          : row.action_type === 'payout_hold_applied' ||
                              row.action_type === 'payout_hold_released'
                            ? `${String(previousState?.payout_hold ?? '—')} -> ${String(nextState?.payout_hold ?? '—')}`
                            : row.action_type === 'payout_batch_reversed'
                              ? `${String(previousState?.status ?? '—')} -> ${String(nextState?.status ?? '—')}`
                              : row.action_type === 'payout_recovery_resolved'
                                ? `${String(previousState?.recovery_amount ?? '—')} -> ${String(nextState?.remaining_recovery_amount ?? '—')}`
                                : row.action_type === 'promotion_created' ||
                                    row.action_type === 'promotion_updated'
                                  ? `${String(previousState?.code ?? 'new')} -> ${String(nextState?.code ?? previousState?.code ?? '—')}`
                                  : '—'

                      return (
                        <TableRow key={row.id}>
                          <TableCell>{formatTimestamp(row.created_at)}</TableCell>
                          <TableCell>{formatAuditAction(row.action_type)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{entityLabel}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatAuditEntityType(row.entity_type)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {row.admin_email ?? row.admin_id.slice(0, 8)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {row.admin_role ?? 'admin'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                            {row.reason ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {stateSummary}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function HealthMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
