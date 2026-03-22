import { format } from 'date-fns'
import { BarChart3, CreditCard, Gem, Rocket, ShieldAlert, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import {
  commercialService,
  type CommercialPromotion,
  type CommercialTourOption,
  type OperatorBillingReportRow,
  type OperatorPayoutReportRow,
} from '@/features/commercial/services/commercialService'

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

function formatPromoAttribution(owner?: string | null, fundingSource?: string | null, discountValue?: number) {
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

function formatTierName(value?: string | null) {
  if (!value) return '—'
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingRows, setBillingRows] = useState<OperatorBillingReportRow[]>([])
  const [payoutRows, setPayoutRows] = useState<OperatorPayoutReportRow[]>([])
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['profile']>(null)
  const [tier, setTier] = useState<Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['tier']>(null)
  const [performance, setPerformance] = useState<Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['performance']>(null)
  const [payoutBatches, setPayoutBatches] = useState<Awaited<ReturnType<typeof commercialService.getOperatorCommercialOverview>>['payoutBatches']>([])
  const [promotions, setPromotions] = useState<CommercialPromotion[]>([])
  const [promotionTours, setPromotionTours] = useState<CommercialTourOption[]>([])
  const [promoForm, setPromoForm] = useState<OperatorPromoFormState>(() => createEmptyOperatorPromoForm())
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null)
  const [promoSubmitting, setPromoSubmitting] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const [overview, nextPromotions, nextTours] = await Promise.all([
          commercialService.getOperatorCommercialOverview(user.id),
          commercialService.listOperatorPromotions(user.id),
          commercialService.listCommercialTours(user.id),
        ])
        if (cancelled) return

        setProfile(overview.profile)
        setTier(overview.tier)
        setPerformance(overview.performance)
        setBillingRows(overview.billingRows)
        setPayoutRows(overview.payoutRows)
        setPayoutBatches(overview.payoutBatches)
        setPromotions(nextPromotions)
        setPromotionTours(nextTours)
        setError(null)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load commercial data')
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
    const maxDiscountValue = promoForm.maxDiscountValue.trim() ? Number(promoForm.maxDiscountValue) : null

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
        operator_user_id: user.id,
        applicable_tour_id: promoForm.applicableTourId === 'all' ? null : promoForm.applicableTourId,
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
    () => payoutRows.filter((row) => row.payout_status === 'eligible').reduce((sum, row) => sum + row.net_operator_payable_amount, 0),
    [payoutRows],
  )

  const outstandingRecovery = useMemo(
    () => payoutRows.filter((row) => row.payout_status === 'recovery_pending').reduce((sum, row) => sum + row.recovery_amount, 0),
    [payoutRows],
  )

  const resolvedTierName =
    tier?.display_name
    ?? formatTierName(profile?.membership_tier_code)
    ?? formatTierName(billingRows[0]?.membership_tier_code)
  const resolvedCommissionRate = tier?.commission_rate ?? profile?.commission_rate ?? 0
  const resolvedPublishLimit = tier?.monthly_publish_limit ?? null
  const publishedTripsThisCycle = profile?.monthly_published_tours_count ?? performance?.published_trips ?? 0
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

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

        {error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-3xl border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <stat.icon className="h-4 w-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{loading ? 'Loading…' : stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.caption}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="h-auto rounded-2xl bg-muted/70 p-1">
            <TabsTrigger value="overview" className="rounded-2xl">Overview</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-2xl">Billing</TabsTrigger>
            <TabsTrigger value="payouts" className="rounded-2xl">Payouts</TabsTrigger>
            <TabsTrigger value="promos" className="rounded-2xl">Promos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <Card className="rounded-3xl border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5" />Cycle performance</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Metric label="Confirmed bookings" value={String(performance?.confirmed_bookings ?? 0)} />
                  <Metric label="Payouts received" value={formatMoney(performance?.payouts_received ?? 0)} />
                  <Metric label="AI credits used" value={`${profile?.ai_credits_used_current_cycle ?? 0}/${tier?.ai_monthly_credits ?? 0}`} />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Tier entitlements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <Entitlement label="Multi-city pickup" enabled={Boolean(tier?.pickup_multi_city_enabled)} />
                  <Entitlement label="Google Maps support" enabled={Boolean(tier?.google_maps_enabled)} />
                  <Entitlement label="AI itinerary tools" enabled={Boolean(tier?.ai_itinerary_enabled)} />
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
              <Card className="rounded-3xl border-border/60">
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
                  <Metric
                    label="Payout hold"
                    value={profile?.payout_hold ? 'Held' : 'Clear'}
                  />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><ShieldAlert className="h-5 w-5" />Fraud review status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={profile?.fraud_review_required ? 'destructive' : 'outline'}
                      className={profile?.fraud_review_required ? 'border-0' : 'border-border/60 bg-background/60 text-muted-foreground'}
                    >
                      {profile?.fraud_review_required ? 'Review required' : 'No active fraud review'}
                    </Badge>
                    {profile?.payout_hold ? (
                      <Badge className="border-0 bg-amber-500 text-white hover:bg-amber-500">Payout hold active</Badge>
                    ) : null}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Metric label="Triggered" value={formatTimestamp(profile?.fraud_review_triggered_at)} />
                    <Metric label="Operational status" value={profile?.operational_status ?? '—'} />
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Review reason</p>
                    <p className="mt-2 text-sm text-foreground">{profile?.fraud_review_reason ?? 'No fraud review trigger is active on your commercial profile.'}</p>
                  </div>
                  {profile?.payout_hold_reason ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      {profile.payout_hold_reason}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

            </div>

            <Card className="rounded-3xl border-border/60">
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
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No payout batches yet.</TableCell>
                      </TableRow>
                    ) : (
                      payoutBatches.slice(0, 5).map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batch_reference}</TableCell>
                          <TableCell>{formatDate(batch.scheduled_for)}</TableCell>
                          <TableCell className={statusTone(batch.status)}>{batch.status}</TableCell>
                          <TableCell className="text-right">{formatMoney(batch.total_recovery_deduction_amount)}</TableCell>
                          <TableCell className="text-right">{formatMoney(batch.total_operator_payable)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="pt-4">
            <Card className="rounded-3xl border-border/60">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No billing cycles available.</TableCell>
                      </TableRow>
                    ) : (
                      billingRows.map((row) => (
                        <TableRow key={row.billing_cycle_id}>
                          <TableCell>{formatDate(row.cycle_start)} to {formatDate(row.cycle_end)}</TableCell>
                          <TableCell className="capitalize">{row.membership_tier_code}</TableCell>
                          <TableCell>{row.invoice_number ?? 'Draft pending'}</TableCell>
                          <TableCell className="capitalize">{row.invoice_status}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.final_membership_charge)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="pt-4">
            <Card className="rounded-3xl border-border/60">
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
                        <TableCell colSpan={7} className="text-center text-muted-foreground">No payout items found.</TableCell>
                      </TableRow>
                    ) : (
                      payoutRows.map((row) => (
                        <TableRow key={row.payout_item_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{row.trip_name ?? 'Trip booking'}</p>
                              <p className="text-xs text-muted-foreground">Booking {row.booking_id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(row.travel_date)}</TableCell>
                          <TableCell className={statusTone(row.payout_status)}>{row.payout_status}</TableCell>
                          <TableCell>{row.batch_reference ?? 'Unbatched'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatPromoAttribution(row.promo_owner, row.promo_funding_source, row.promo_discount_value)}
                          </TableCell>
                          <TableCell className="text-right">{formatMoney(row.recovery_deduction_amount)}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.net_operator_payable_amount)}</TableCell>
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
              <Card className="rounded-3xl border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Operator-funded promos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Active promos: <span className="font-semibold text-foreground">{activePromotionCount}</span>. Platform-funded campaigns are reserved for admin finance controls.
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Title</label>
                      <Input value={promoForm.title} onChange={(event) => handlePromoFormChange('title', event.target.value)} placeholder="Summer launch discount" className="rounded-2xl" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Promo code</label>
                      <Input value={promoForm.code} onChange={(event) => handlePromoFormChange('code', event.target.value.toUpperCase())} placeholder="SUMMER25" className="rounded-2xl" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Applies to</label>
                      <Select value={promoForm.applicableTourId} onValueChange={(value) => handlePromoFormChange('applicableTourId', value)}>
                        <SelectTrigger className="rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All trips</SelectItem>
                          {promotionTours.map((tour) => (
                            <SelectItem key={tour.id} value={tour.id}>{tour.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</label>
                      <Select value={promoForm.isActive} onValueChange={(value) => handlePromoFormChange('isActive', value)}>
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
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Discount type</label>
                      <Select value={promoForm.discountType} onValueChange={(value) => handlePromoFormChange('discountType', value)}>
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
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Discount value</label>
                      <Input value={promoForm.discountValue} onChange={(event) => handlePromoFormChange('discountValue', event.target.value)} placeholder={promoForm.discountType === 'percentage' ? '15' : '5000'} type="number" min="0" className="rounded-2xl" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Max discount</label>
                      <Input value={promoForm.maxDiscountValue} onChange={(event) => handlePromoFormChange('maxDiscountValue', event.target.value)} placeholder="Optional cap" type="number" min="0" className="rounded-2xl" disabled={promoForm.discountType !== 'percentage'} />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Starts at</label>
                      <Input value={promoForm.startsAt} onChange={(event) => handlePromoFormChange('startsAt', event.target.value)} type="datetime-local" className="rounded-2xl" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ends at</label>
                      <Input value={promoForm.endsAt} onChange={(event) => handlePromoFormChange('endsAt', event.target.value)} type="datetime-local" className="rounded-2xl" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Description</label>
                    <Textarea value={promoForm.description} onChange={(event) => handlePromoFormChange('description', event.target.value)} placeholder="Traveller-facing context for why this discount exists." className="min-h-[96px] rounded-2xl" />
                  </div>

                  {promoError ? (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{promoError}</div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleSavePromotion} disabled={promoSubmitting} className="rounded-2xl">
                      {promoSubmitting ? 'Saving...' : editingPromotionId ? 'Update promo' : 'Create promo'}
                    </Button>
                    {editingPromotionId ? (
                      <Button variant="outline" onClick={resetPromoForm} disabled={promoSubmitting} className="rounded-2xl">
                        Cancel edit
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/60">
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
                          <TableCell colSpan={6} className="text-center text-muted-foreground">No promos configured yet.</TableCell>
                        </TableRow>
                      ) : (
                        promotions.map((promotion) => (
                          <TableRow key={promotion.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{promotion.title}</p>
                                <p className="text-xs text-muted-foreground">{promotion.code} · operator funded</p>
                              </div>
                            </TableCell>
                            <TableCell>{promotion.applicable_tour?.title ?? 'All trips'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatPromoWindow(promotion.starts_at, promotion.ends_at)}</TableCell>
                            <TableCell>{promotion.is_active ? 'Active' : 'Inactive'}</TableCell>
                            <TableCell className="text-right">
                              {promotion.discount_type === 'percentage'
                                ? `${promotion.discount_value}%${promotion.max_discount_value ? ` capped at PKR ${promotion.max_discount_value.toLocaleString()}` : ''}`
                                : `PKR ${promotion.discount_value.toLocaleString()}`}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => handleEditPromotion(promotion)}>
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

function Entitlement({ label, enabled, description }: { label: string; enabled: boolean; description?: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <span className={enabled ? 'text-emerald-600' : 'text-muted-foreground'}>{enabled ? 'Enabled' : 'Locked'}</span>
    </div>
  )
}