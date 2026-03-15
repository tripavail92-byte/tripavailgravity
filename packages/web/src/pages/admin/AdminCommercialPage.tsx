import { format } from 'date-fns'
import { Banknote, CircleDollarSign, ShieldAlert, Users, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  commercialService,
  type CommercialPromotion,
  type CommercialTourOption,
  type MembershipTierCode,
  type OperatorCommercialProfile,
} from '@/features/commercial/services/commercialService'

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

function formatPromoAttribution(owner?: string | null, fundingSource?: string | null, discountValue?: number) {
  if (!discountValue || discountValue <= 0) return '—'
  const parts = [owner, fundingSource].filter(Boolean)
  return `${formatMoney(discountValue)}${parts.length ? ` · ${parts.join(' / ')}` : ''}`
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
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof commercialService.getAdminCommercialOverview>> | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const [nextOverview, nextPromotions, nextTours] = await Promise.all([
        commercialService.getAdminCommercialOverview(),
        commercialService.listAdminPromotions(),
        commercialService.listCommercialTours(),
      ])
      setOverview(nextOverview)
      setPromotions(nextPromotions)
      setPromotionTours(nextTours)
      if (!selectedOperatorId && nextOverview.operatorProfiles[0]?.operator_user_id) {
        const firstOperator = nextOverview.operatorProfiles[0]
        setSelectedOperatorId(firstOperator.operator_user_id)
        setTierCode(firstOperator.membership_tier_code)
        setHoldReason(firstOperator.payout_hold_reason ?? '')
        setPromoForm((current) => ({ ...current, operatorUserId: current.operatorUserId || firstOperator.operator_user_id }))
      }
      if (!selectedBatchId && nextOverview.payoutBatches[0]?.id) {
        setSelectedBatchId(nextOverview.payoutBatches[0].id)
      }
      if (!selectedRecoveryItemId) {
        const firstRecoveryItem = nextOverview.payoutRows.find((row) => row.payout_status === 'recovery_pending')
        if (firstRecoveryItem) {
          setSelectedRecoveryItemId(firstRecoveryItem.payout_item_id)
          setRecoveryAmount(firstRecoveryItem.recovery_amount.toString())
        }
      }
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load commercial admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selectedOperator = useMemo<OperatorCommercialProfile | null>(() => {
    return overview?.operatorProfiles.find((profile) => profile.operator_user_id === selectedOperatorId) ?? null
  }, [overview?.operatorProfiles, selectedOperatorId])

  useEffect(() => {
    if (!selectedOperator) return
    setTierCode(selectedOperator.membership_tier_code)
    setHoldReason(selectedOperator.payout_hold_reason ?? '')
  }, [selectedOperator])

  const summaryCards = overview?.financeSummary
    ? [
        { label: 'Customer payments', value: formatMoney(overview.financeSummary.total_customer_payments_collected), icon: CircleDollarSign },
        { label: 'Commission accrued', value: formatMoney(overview.financeSummary.total_commission_earned), icon: Banknote },
        { label: 'Held payouts', value: formatMoney(overview.financeSummary.total_held_amounts), icon: ShieldAlert },
        { label: 'Operator payouts', value: formatMoney(overview.financeSummary.total_operator_payouts), icon: Wallet },
        { label: 'Recovery offsets', value: formatMoney(overview.financeSummary.total_recovery_deductions), icon: ShieldAlert },
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
        profile.tour_operator_profiles?.company_name
          || profile.tour_operator_profiles?.contact_person
          || profile.operator_user_id.slice(0, 8),
      ]),
    )
  }, [overview?.operatorProfiles])

  const selectedRecoveryRow = useMemo(() => {
    return filteredPayoutRows.find((row) => row.payout_item_id === selectedRecoveryItemId) ?? null
  }, [filteredPayoutRows, selectedRecoveryItemId])

  useEffect(() => {
    if (!selectedRecoveryRow) return
    setRecoveryAmount(selectedRecoveryRow.recovery_amount.toString())
  }, [selectedRecoveryRow])

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
    const maxDiscountValue = promoForm.maxDiscountValue.trim() ? Number(promoForm.maxDiscountValue) : null

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

    if (maxDiscountValue !== null && (!Number.isFinite(maxDiscountValue) || maxDiscountValue <= 0)) {
      setPromoError('Max discount must be greater than zero when provided')
      return
    }

    try {
      setPromoSubmitting(true)
      setPromoError(null)

      const payload = {
        operator_user_id: operatorUserId,
        applicable_tour_id: promoForm.applicableTourId === 'all' ? null : promoForm.applicableTourId,
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

    try {
      setSubmitting(true)
      await commercialService.updateOperatorPayoutHold(
        selectedOperator.operator_user_id,
        !selectedOperator.payout_hold,
        holdReason,
      )
      toast.success(selectedOperator.payout_hold ? 'Payout hold released' : 'Payout hold applied')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to update payout hold')
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
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to close billing cycle')
    } finally {
      setSubmitting(false)
    }
  }

  const handleScheduleBatch = async () => {
    try {
      setSubmitting(true)
      const batch = await commercialService.schedulePayoutBatch()
      toast.success(batch ? `Scheduled ${batch.batch_reference}` : 'No eligible payout items to batch')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to schedule payout batch')
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

    try {
      setSubmitting(true)
      const result = await commercialService.reversePayoutBatch(selectedBatchId, batchActionReason)
      if (result?.previous_status === 'paid') {
        toast.success(`${result.batch_reference} reversed into recovery`) 
      } else {
        toast.success(`${result?.batch_reference ?? 'Batch'} unscheduled and returned to eligible`) 
      }
      setBatchActionReason('')
      await load()
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Failed to reverse payout batch')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolveRecovery = async () => {
    if (!selectedRecoveryItemId) return

    try {
      setSubmitting(true)
      const amount = recoveryAmount.trim() ? Number(recoveryAmount) : undefined
      const result = await commercialService.resolvePayoutRecovery(selectedRecoveryItemId, amount, recoveryReason)
      if (result?.remaining_recovery_amount) {
        toast.success(`Recovery updated. PKR ${result.remaining_recovery_amount.toLocaleString()} still outstanding`)
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

  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commercial</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Finance overview, operator commercial controls, billing cycle actions, and payout batch management.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleScheduleBatch} disabled={submitting || loading}>Create payout batch</Button>
          <Button onClick={handleMarkBatchPaid} disabled={submitting || loading || !selectedBatchId}>Mark batch paid</Button>
        </div>
      </div>

      {error ? <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <card.icon className="h-4 w-4" />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{loading ? 'Loading…' : card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="h-auto p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operators">Operators</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="promos">Promos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
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
                              {profile.tour_operator_profiles?.company_name || profile.tour_operator_profiles?.contact_person || profile.operator_user_id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground">{profile.operator_user_id.slice(0, 8).toUpperCase()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="border-0 bg-amber-500 text-white hover:bg-amber-500">Review required</Badge>
                        </TableCell>
                        <TableCell>{formatTimestamp(profile.fraud_review_triggered_at)}</TableCell>
                        <TableCell>{profile.fraud_review_reason ?? 'Manual review required'}</TableCell>
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
                      <TableCell className="text-right">{formatMoney(row.average_payout)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Finance health</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <HealthMetric label="Customer payments" value={formatMoney(overview?.financeHealth?.total_customer_payments_collected ?? 0)} />
                <HealthMetric label="Commission collected" value={formatMoney(overview?.financeHealth?.total_commission_collected ?? 0)} />
                <HealthMetric label="Not-ready operator liability" value={formatMoney(overview?.financeHealth?.total_operator_liability_not_ready ?? 0)} />
                <HealthMetric label="Reconciliation RHS" value={formatMoney(overview?.financeHealth?.reconciliation_rhs ?? 0)} />
                <HealthMetric label="Eligible unbatched" value={formatMoney(overview?.financeHealth?.total_payouts_eligible_unbatched ?? 0)} />
                <HealthMetric label="Recovery exposure" value={formatMoney(overview?.financeHealth?.outstanding_recovery_balances ?? 0)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reconciliation status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Delta</p>
                  <p className={Math.abs(overview?.financeHealth?.reconciliation_delta ?? 0) <= 0.01 ? 'mt-2 text-2xl font-bold text-emerald-600' : 'mt-2 text-2xl font-bold text-amber-600'}>
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
                    <p className="mt-2 text-xl font-bold text-foreground">{formatMoney(overview?.financeHealth?.total_commission_earned ?? 0)}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Commission still outstanding</p>
                    <p className="mt-2 text-xl font-bold text-foreground">{formatMoney(overview?.financeHealth?.total_commission_remaining ?? 0)}</p>
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
                      <TableCell className="text-right">{formatMoney(overview?.financeHealth?.total_operator_liability_not_ready ?? 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Eligible unbatched payouts</TableCell>
                      <TableCell className="text-right">{formatMoney(overview?.financeHealth?.total_payouts_eligible_unbatched ?? 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Payouts completed</TableCell>
                      <TableCell className="text-right">{formatMoney(overview?.financeHealth?.total_payouts_completed ?? 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Payouts scheduled</TableCell>
                      <TableCell className="text-right">{formatMoney(overview?.financeHealth?.total_payouts_scheduled ?? 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Payouts on hold</TableCell>
                      <TableCell className="text-right">{formatMoney(overview?.financeHealth?.total_payouts_on_hold ?? 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>TripAvail commission collected</TableCell>
                      <TableCell className="text-right">{formatMoney(overview?.financeHealth?.total_commission_collected ?? 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Refunds</TableCell>
                      <TableCell className="text-right">{formatMoney(overview?.financeHealth?.total_refunds ?? 0)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
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
                        {profile.tour_operator_profiles?.company_name || profile.tour_operator_profiles?.contact_person || profile.operator_user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedOperator ? (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{selectedOperator.tour_operator_profiles?.company_name || 'Unnamed operator'}</p>
                      <Badge
                        variant={selectedOperator.fraud_review_required ? 'destructive' : 'outline'}
                        className={selectedOperator.fraud_review_required ? 'border-0' : 'border-border/60 bg-background/60 text-muted-foreground'}
                      >
                        {selectedOperator.fraud_review_required ? 'Fraud review required' : 'Fraud review clear'}
                      </Badge>
                    </div>
                    <p>City: {selectedOperator.tour_operator_profiles?.primary_city || '—'}</p>
                    <p>KYC: {selectedOperator.kyc_status}</p>
                    <p>Operational status: {selectedOperator.operational_status}</p>
                    <p>Operator-fault cancellations: {selectedOperator.operator_fault_cancellation_count}</p>
                    <p>Cancellation penalty: {selectedOperator.cancellation_penalty_active ? 'Active' : 'Clear'}</p>
                    <p>Penalty triggered: {formatDate(selectedOperator.cancellation_penalty_triggered_at)}</p>
                    <p>Fraud review triggered: {formatTimestamp(selectedOperator.fraud_review_triggered_at)}</p>
                    <p>Fraud review reason: {selectedOperator.fraud_review_reason ?? '—'}</p>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">Membership tier</p>
                  <Select value={tierCode} onValueChange={(value) => setTierCode(value as MembershipTierCode)}>
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
                  <Button onClick={handleAssignTier} disabled={submitting || !selectedOperatorId}>Apply tier change</Button>
                </div>

                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="font-medium text-foreground">Payout hold</p>
                  <Input
                    value={holdReason}
                    onChange={(event) => setHoldReason(event.target.value)}
                    placeholder="Hold reason shown on payout items"
                  />
                  <Button variant="outline" onClick={handleToggleHold} disabled={submitting || !selectedOperator}>
                    {selectedOperator?.payout_hold ? 'Release payout hold' : 'Apply payout hold'}
                  </Button>
                  <Button onClick={handleCloseBillingCycle} disabled={submitting || !selectedOperatorId}>
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
              <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5" />Billing cycles</CardTitle>
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
                      <TableCell>{formatDate(row.cycle_start)} to {formatDate(row.cycle_end)}</TableCell>
                      <TableCell>{row.invoice_status}</TableCell>
                      <TableCell className="text-right">{formatMoney(row.final_membership_charge)}</TableCell>
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
                <Button variant="outline" onClick={handleReverseBatch} disabled={submitting || loading || !selectedBatchId || selectedBatch?.status === 'reversed'}>
                  Reverse batch
                </Button>
                <Button onClick={handleMarkBatchPaid} disabled={submitting || loading || !selectedBatchId || selectedBatch?.status === 'paid' || selectedBatch?.status === 'reversed'}>
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
                      <TableCell className="text-right">{formatMoney(batch.total_recovery_deduction_amount)}</TableCell>
                      <TableCell className="text-right">{formatMoney(batch.total_operator_payable)}</TableCell>
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
                        {(row.trip_name ?? row.booking_id.slice(0, 8))} · {formatMoney(row.recovery_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRecoveryRow ? (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{selectedRecoveryRow.trip_name ?? selectedRecoveryRow.booking_id.slice(0, 8)}</p>
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
                <Button onClick={handleResolveRecovery} disabled={submitting || !selectedRecoveryItemId}>
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
                        {formatPromoAttribution(row.promo_owner, row.promo_funding_source, row.promo_discount_value)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatMoney(row.commission_collected)} / {formatMoney(row.commission_remaining)}
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(row.recovery_deduction_amount)}</TableCell>
                      <TableCell className="text-right">{formatMoney(row.net_operator_payable_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    <label className="mb-2 block text-sm font-medium text-foreground">Operator</label>
                    <Select value={promoForm.operatorUserId || selectedOperatorId} onValueChange={(value) => handlePromoFormChange('operatorUserId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {(overview?.operatorProfiles ?? []).map((profile) => (
                          <SelectItem key={profile.operator_user_id} value={profile.operator_user_id}>
                            {profile.tour_operator_profiles?.company_name || profile.tour_operator_profiles?.contact_person || profile.operator_user_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Scope</label>
                    <Select value={promoForm.applicableTourId} onValueChange={(value) => handlePromoFormChange('applicableTourId', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All operator trips</SelectItem>
                        {promoScopedTours.map((tour) => (
                          <SelectItem key={tour.id} value={tour.id}>{tour.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                    <Input value={promoForm.title} onChange={(event) => handlePromoFormChange('title', event.target.value)} placeholder="TripAvail launch support" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Promo code</label>
                    <Input value={promoForm.code} onChange={(event) => handlePromoFormChange('code', event.target.value.toUpperCase())} placeholder="LAUNCH10K" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Funding source</label>
                    <Select value={promoForm.fundingSource} onValueChange={(value) => handlePromoFormChange('fundingSource', value)}>
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
                    <Select value={promoForm.isActive} onValueChange={(value) => handlePromoFormChange('isActive', value)}>
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
                    <label className="mb-2 block text-sm font-medium text-foreground">Discount type</label>
                    <Select value={promoForm.discountType} onValueChange={(value) => handlePromoFormChange('discountType', value)}>
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
                    <label className="mb-2 block text-sm font-medium text-foreground">Discount value</label>
                    <Input value={promoForm.discountValue} onChange={(event) => handlePromoFormChange('discountValue', event.target.value)} type="number" min="0" placeholder={promoForm.discountType === 'percentage' ? '15' : '10000'} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Max discount</label>
                    <Input value={promoForm.maxDiscountValue} onChange={(event) => handlePromoFormChange('maxDiscountValue', event.target.value)} type="number" min="0" placeholder="Optional cap" disabled={promoForm.discountType !== 'percentage'} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Starts at</label>
                    <Input value={promoForm.startsAt} onChange={(event) => handlePromoFormChange('startsAt', event.target.value)} type="datetime-local" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Ends at</label>
                    <Input value={promoForm.endsAt} onChange={(event) => handlePromoFormChange('endsAt', event.target.value)} type="datetime-local" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                  <Textarea value={promoForm.description} onChange={(event) => handlePromoFormChange('description', event.target.value)} placeholder="Explain the campaign and intended margin owner." />
                </div>

                {promoError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{promoError}</div>
                ) : null}

                <div className="flex gap-3">
                  <Button onClick={handleSavePromotion} disabled={promoSubmitting}>
                    {promoSubmitting ? 'Saving...' : editingPromotionId ? 'Update promo' : 'Create promo'}
                  </Button>
                  {editingPromotionId ? (
                    <Button variant="outline" onClick={() => resetPromoForm(promoForm.operatorUserId || selectedOperatorId)} disabled={promoSubmitting}>
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
                        <TableCell colSpan={7} className="text-center text-muted-foreground">No promotions configured.</TableCell>
                      </TableRow>
                    ) : (
                      promotions.map((promotion) => (
                        <TableRow key={promotion.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{promotion.title}</p>
                              <p className="text-xs text-muted-foreground">{promotion.code} · {promotion.funding_source}</p>
                            </div>
                          </TableCell>
                          <TableCell>{operatorNameById.get(promotion.operator_user_id) ?? promotion.operator_user_id.slice(0, 8)}</TableCell>
                          <TableCell>{promotion.applicable_tour?.title ?? 'All operator trips'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatPromoWindow(promotion.starts_at, promotion.ends_at)}</TableCell>
                          <TableCell>{promotion.is_active ? 'Active' : 'Inactive'}</TableCell>
                          <TableCell className="text-right">
                            {promotion.discount_type === 'percentage'
                              ? `${promotion.discount_value}%${promotion.max_discount_value ? ` capped at PKR ${promotion.max_discount_value.toLocaleString()}` : ''}`
                              : `PKR ${promotion.discount_value.toLocaleString()}`}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleEditPromotion(promotion)}>
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