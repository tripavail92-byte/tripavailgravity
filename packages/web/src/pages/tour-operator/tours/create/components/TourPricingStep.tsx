import {
  DollarSign,
  Info,
  Percent,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  CANCELLATION_ICON_BY_POLICY,
  EXCLUDED_FEATURE_OPTIONS,
  getTourIconComponent,
  INCLUDED_FEATURE_OPTIONS,
  TourFeatureItem,
} from '@/features/tour-operator/assets/TourIconRegistry'
import { Tour } from '@/features/tour-operator/services/tourService'
import { clampDepositPercentage, getTourPaymentTerms } from '@/features/booking/utils/tourPaymentTerms'
import {
  DEFAULT_TOUR_PRICING_PROMO_DRAFT,
  getTourPricingPromoDraft,
  validateTourPricingPromoDraft,
} from '../promoDraft'

interface TourPricingStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
  membershipTierLabel?: string
  minimumDepositPercent?: number
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED']

const CANCELLATION_POLICIES = [
  {
    value: 'flexible',
    title: 'Free Cancellation',
    description: 'Cancel up to 48 hours before departure.',
    iconKey: CANCELLATION_ICON_BY_POLICY.flexible,
  },
  {
    value: 'moderate',
    title: 'Moderate Policy',
    description: 'Cancel up to 5 days before departure for free.',
    iconKey: CANCELLATION_ICON_BY_POLICY.moderate,
  },
  {
    value: 'strict',
    title: 'Strict Policy',
    description: '50% refund when cancelled at least 14 days before departure.',
    iconKey: CANCELLATION_ICON_BY_POLICY.strict,
  },
  {
    value: 'non-refundable',
    title: 'Non-Refundable',
    description: 'No refund after booking confirmation.',
    iconKey: CANCELLATION_ICON_BY_POLICY['non-refundable'],
  },
] as const

const DEPOSIT_OPTIONS = [10, 20, 30, 40, 50]

export function TourPricingStep({
  data,
  onUpdate,
  onNext,
  onBack,
  membershipTierLabel = 'Gold',
  minimumDepositPercent = 0,
}: TourPricingStepProps) {
  const [pricingTiers, setPricingTiers] = useState(data.pricing_tiers || [])
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [depositPolicyAcknowledged, setDepositPolicyAcknowledged] = useState(false)
  const [depositPolicyConfirmed, setDepositPolicyConfirmed] = useState(false)
  const promoDraft = getTourPricingPromoDraft(data.draft_data)
  const selectedInclusionLabels = new Set([
    ...(Array.isArray(data.inclusions) ? data.inclusions : []),
    ...((Array.isArray((data as any).included_features)
      ? (data as any).included_features.map((item: TourFeatureItem) => item.label)
      : []) as string[]),
  ])
  const selectedExclusionLabels = new Set([
    ...(Array.isArray(data.exclusions) ? data.exclusions : []),
    ...((Array.isArray((data as any).excluded_features)
      ? (data as any).excluded_features.map((item: TourFeatureItem) => item.label)
      : []) as string[]),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (field: keyof Tour, value: any) => {
    onUpdate({ [field]: value })
  }

  const basePrice = Number(data.price || 0)
  const depositRequired = true
  const effectiveMinimumDeposit = clampDepositPercentage(Number(minimumDepositPercent || 0))
  const rawDepositPercentage = Number(data.deposit_percentage)
  const hasSavedDepositPercentage = Number.isFinite(rawDepositPercentage) && rawDepositPercentage > 0
  const normalizedDepositPercentage = clampDepositPercentage(
    hasSavedDepositPercentage ? rawDepositPercentage : effectiveMinimumDeposit,
  )
  const isDepositBelowTierMinimum = normalizedDepositPercentage < effectiveMinimumDeposit
  const promoValidationError = validateTourPricingPromoDraft(promoDraft)
  const availableDepositOptions = Array.from(
    new Set(
      [...DEPOSIT_OPTIONS, effectiveMinimumDeposit].filter(
        (option) => option >= effectiveMinimumDeposit && option > 0 && option <= 50,
      ),
    ),
  ).sort((left, right) => left - right)
  const standardDepositPreview = getTourPaymentTerms({
    basePrice,
    guestCount: 1,
    depositRequired,
    depositPercentage: normalizedDepositPercentage,
  })
  const tierDepositPreviews = pricingTiers.map((tier) => ({
    tier,
    payment: getTourPaymentTerms({
      basePrice,
      guestCount: Math.max(1, Number(tier.minPeople || 1)),
      pricingTiers,
      depositRequired,
      depositPercentage: normalizedDepositPercentage,
    }),
  }))

  useEffect(() => {
    setDepositPolicyConfirmed(false)
    setDepositPolicyAcknowledged(false)
  }, [normalizedDepositPercentage, basePrice, pricingTiers])

  useEffect(() => {
    if (data.deposit_required !== true) {
      handleInputChange('deposit_required', true)
    }

    if (!hasSavedDepositPercentage || rawDepositPercentage < effectiveMinimumDeposit) {
      handleInputChange('deposit_percentage', normalizedDepositPercentage)
    }
  }, [
    data.deposit_required,
    effectiveMinimumDeposit,
    hasSavedDepositPercentage,
    normalizedDepositPercentage,
    rawDepositPercentage,
  ])

  const updatePromoDraft = (updates: Partial<typeof DEFAULT_TOUR_PRICING_PROMO_DRAFT>) => {
    onUpdate({
      draft_data: {
        ...(data.draft_data && typeof data.draft_data === 'object' ? data.draft_data : {}),
        pricing_promo: {
          ...promoDraft,
          ...updates,
        },
      },
    } as Partial<Tour>)
  }

  const addPricingTier = () => {
    const defaultDiscount = 10 // 10% default
    const basePrice = data.price || 0
    const discountedPrice = Math.round(basePrice * (1 - defaultDiscount / 100))

    const newTier = {
      id: Date.now().toString(),
      name: `Tier ${pricingTiers.length + 1}`,
      minPeople:
        pricingTiers.length === 0 ? 5 : pricingTiers[pricingTiers.length - 1].minPeople + 1,
      maxPeople: 0,
      pricePerPerson: discountedPrice,
      discountPercentage: defaultDiscount,
    }
    const updated = [...pricingTiers, newTier]
    setPricingTiers(updated)
    onUpdate({ pricing_tiers: updated })
  }

  const updateTierDiscount = (id: string, discountPercentage: number) => {
    const basePrice = data.price || 0
    // Ensure discount is between 0 and 100
    const validDiscount = Math.max(0, Math.min(100, discountPercentage))
    const newPrice = Math.round(basePrice * (1 - validDiscount / 100))

    const updated = pricingTiers.map((t) =>
      t.id === id ? { ...t, discountPercentage: validDiscount, pricePerPerson: newPrice } : t,
    )
    setPricingTiers(updated)
    onUpdate({ pricing_tiers: updated })
  }

  const updatePricingTier = (id: string, field: string, value: string | number) => {
    const updated = pricingTiers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    setPricingTiers(updated)
    onUpdate({ pricing_tiers: updated })
  }

  const removePricingTier = (id: string) => {
    const updated = pricingTiers.filter((t) => t.id !== id)
    setPricingTiers(updated)
    onUpdate({ pricing_tiers: updated })
  }

  const toggleInclude = (item: string) => {
    const current = Array.from(selectedInclusionLabels)
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item]
    const includedFeatures = INCLUDED_FEATURE_OPTIONS.filter((feature) => next.includes(feature.label))
    onUpdate({ inclusions: next, included_features: includedFeatures } as Partial<Tour>)
  }

  const toggleExclude = (item: string) => {
    const current = Array.from(selectedExclusionLabels)
    const next = current.includes(item) ? current.filter((e) => e !== item) : [...current, item]
    const excludedFeatures = EXCLUDED_FEATURE_OPTIONS.filter((feature) =>
      next.includes(feature.label),
    )
    onUpdate({ exclusions: next, excluded_features: excludedFeatures } as Partial<Tour>)
  }

  const handleDepositPercentageChange = (value: number) => {
    handleInputChange('deposit_percentage', Math.max(effectiveMinimumDeposit, clampDepositPercentage(value)))
  }

  const handleContinue = () => {
    if (isDepositBelowTierMinimum) {
      return
    }

    if (!depositPolicyConfirmed) {
      setIsDepositDialogOpen(true)
      return
    }

    if (promoValidationError) {
      return
    }

    onNext()
  }

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('en-PK', {
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Legend Header */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-background/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-border/40 shadow-lg">
            <DollarSign className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Tour Pricing</h2>
            <p className="text-primary-foreground/90 text-sm font-medium">
              Set competitive pricing and booking policies for your tour.
            </p>
          </div>
        </div>
      </div>

      {/* Base Pricing */}
      <div className="glass-card rounded-[24px] p-8 shadow-sm border border-border/60 bg-background">
        <h3 className="text-[14px] font-bold text-foreground uppercase tracking-widest pl-1 mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" /> Base Pricing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Base Price Per Person *
            </label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-muted text-muted-foreground border border-border flex items-center justify-center text-xs font-bold pointer-events-none">
                {data.currency || 'PKR'}
              </div>
              <Input
                type="number"
                className="pl-16 h-12 rounded-xl border-border bg-muted/40 focus:border-primary focus:ring-primary/20 text-lg font-medium"
                placeholder="0.00"
                value={data.price || ''}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Currency
            </label>
            <Select
              value={data.currency || 'PKR'}
              onValueChange={(v) => handleInputChange('currency', v)}
            >
              <SelectTrigger className="h-12 rounded-xl border-border bg-muted/40 text-base font-medium focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[24px] p-8 shadow-sm border border-border/60 bg-background">
        <h3 className="text-[14px] font-bold text-foreground uppercase tracking-widest pl-1 mb-8 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" /> Booking Terms
        </h3>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="pl-2">
              <label className="text-sm font-bold text-foreground">Deposit Collection</label>
              <p className="text-xs text-muted-foreground font-medium">
                Partial payment upfront is always required to confirm the booking.
              </p>
              <p className="mt-1 text-xs text-primary font-semibold">
                {membershipTierLabel} tier minimum upfront collection: {effectiveMinimumDeposit}%
              </p>
            </div>
          </div>

          <div className="space-y-5">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase font-bold tracking-wider text-primary">Deposit Percentage</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Choose what percentage the traveler must pay now. {membershipTierLabel} requires at least {effectiveMinimumDeposit}%.
                      </p>
                    </div>
                    <div className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                      {normalizedDepositPercentage}%
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {availableDepositOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleDepositPercentageChange(option)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                          normalizedDepositPercentage === option
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:border-primary/50'
                        }`}
                      >
                        {option}%
                      </button>
                    ))}
                    <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
                      <span className="text-sm font-semibold text-muted-foreground">Custom</span>
                      <Input
                        type="number"
                        min={effectiveMinimumDeposit}
                        max={50}
                        value={normalizedDepositPercentage}
                        onChange={(event) => handleDepositPercentageChange(Number(event.target.value || 0))}
                        className="h-7 w-20 border-0 bg-transparent p-0 text-right font-semibold shadow-none focus-visible:ring-0"
                      />
                      <span className="text-sm font-semibold text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                {isDepositBelowTierMinimum ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                    {membershipTierLabel} membership requires at least {effectiveMinimumDeposit}% upfront. Increase the deposit percentage or upgrade tiers before continuing.
                  </div>
                ) : null}

                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-primary">Payment Preview</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Pay now</p>
                      <p className="mt-2 text-xl font-black text-foreground">
                        {data.currency || 'PKR'} {formatMoney(standardDepositPreview.upfrontAmount)} per traveler
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Pay later</p>
                      <p className="mt-2 text-xl font-black text-foreground">
                        {data.currency || 'PKR'} {formatMoney(standardDepositPreview.remainingAmount)} per traveler
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Collection timing: Remaining balance will be paid directly to the tour operator before departure.
                  </p>
                </div>

                {data.group_discounts && tierDepositPreviews.length > 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-primary">Group discount perspective</p>
                    <div className="mt-4 space-y-3">
                      {tierDepositPreviews.map(({ tier, payment }) => (
                        <div key={tier.id} className="rounded-2xl border border-border/60 bg-background p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">{tier.name}</p>
                              <p className="text-xs text-muted-foreground">{tier.minPeople}+ travelers · {data.currency || 'PKR'} {formatMoney(payment.effectiveUnitPrice)} per traveler</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-semibold text-foreground">Pay now: {data.currency || 'PKR'} {formatMoney(payment.upfrontAmount)}</p>
                              <p className="text-muted-foreground">Pay later: {data.currency || 'PKR'} {formatMoney(payment.remainingAmount)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-info/20 bg-info/10 p-4 text-sm text-info">
                  Only the upfront amount will be charged online. The remaining amount must be collected from the traveler before departure.
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant={depositPolicyConfirmed ? 'outline' : 'default'}
                    className="rounded-2xl"
                    onClick={() => setIsDepositDialogOpen(true)}
                    disabled={basePrice <= 0}
                  >
                    {depositPolicyConfirmed ? 'Deposit Policy Confirmed' : 'Confirm Deposit Policy'}
                  </Button>
                  {depositPolicyConfirmed ? (
                    <p className="text-sm font-medium text-success">
                      Deposit policy confirmed for {normalizedDepositPercentage}% upfront collection.
                    </p>
                  ) : null}
                </div>
              </div>

          <Separator className="bg-border/60" />

          <div className="space-y-5 px-2">
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div>
                <label className="text-sm font-bold text-foreground">Launch Promo</label>
                <p className="text-xs text-muted-foreground font-medium">
                  Create an operator-funded promo for this tour as part of publish.
                </p>
              </div>
              <Switch
                checked={promoDraft.enabled}
                onCheckedChange={(enabled) => updatePromoDraft({ enabled })}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <AnimatePresence>
              {promoDraft.enabled ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Promo Title
                      </label>
                      <Input
                        value={promoDraft.title}
                        onChange={(event) => updatePromoDraft({ title: event.target.value })}
                        placeholder="Summer launch discount"
                        className="h-11 rounded-xl border-border bg-muted/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Promo Code
                      </label>
                      <Input
                        value={promoDraft.code}
                        onChange={(event) => updatePromoDraft({ code: event.target.value.toUpperCase() })}
                        placeholder="SUMMER25"
                        className="h-11 rounded-xl border-border bg-muted/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Discount Type
                      </label>
                      <Select
                        value={promoDraft.discountType}
                        onValueChange={(value) => updatePromoDraft({ discountType: value as 'fixed_amount' | 'percentage' })}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border bg-muted/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed_amount">Fixed amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Discount Value
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          value={promoDraft.discountValue}
                          onChange={(event) => updatePromoDraft({ discountValue: event.target.value })}
                          placeholder={promoDraft.discountType === 'percentage' ? '15' : '5000'}
                          className="h-11 rounded-xl border-border bg-muted/40 pr-10"
                        />
                        {promoDraft.discountType === 'percentage' ? (
                          <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        ) : null}
                      </div>
                    </div>
                    {promoDraft.discountType === 'percentage' ? (
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                          Max Discount
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={promoDraft.maxDiscountValue}
                          onChange={(event) => updatePromoDraft({ maxDiscountValue: event.target.value })}
                          placeholder="Optional PKR cap"
                          className="h-11 rounded-xl border-border bg-muted/40"
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Description
                      </label>
                      <Input
                        value={promoDraft.description}
                        onChange={(event) => updatePromoDraft({ description: event.target.value })}
                        placeholder="Explain the traveler-facing offer for this tour."
                        className="h-11 rounded-xl border-border bg-muted/40"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                    This promo will be created as an operator-funded campaign and scoped to this tour when you publish.
                  </div>

                  {promoValidationError ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                      {promoValidationError}
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <Separator className="bg-border/60" />

          <div className="space-y-3 px-2">
            <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
              Cancellation Policy
            </label>
            <div className="space-y-3">
              {CANCELLATION_POLICIES.map((policy) => {
                const Icon = getTourIconComponent(policy.iconKey)
                const isSelected = (data.cancellation_policy || 'flexible') === policy.value

                return (
                  <button
                    key={policy.value}
                    type="button"
                    onClick={() => handleInputChange('cancellation_policy', policy.value)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ease-out flex items-start gap-4 ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-lg scale-[1.02]'
                        : 'bg-background border-border hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{policy.title}</p>
                      <p className="text-sm text-muted-foreground">{policy.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Group Discounts */}
      <div className="glass-card rounded-[24px] p-8 shadow-sm border border-border/60 bg-background">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-[14px] font-bold text-foreground uppercase tracking-widest pl-1 mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Group Discounts
            </h3>
            <p className="text-sm text-muted-foreground pl-8">
              Offer percentage-based lower rates for larger groups.
            </p>
          </div>
          <Switch
            checked={data.group_discounts}
            onCheckedChange={(v) => handleInputChange('group_discounts', v)}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <AnimatePresence>
          {data.group_discounts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">Pricing Tiers</span>
                <Button
                  variant="outline"
                  onClick={addPricingTier}
                  className="rounded-xl border-border text-foreground/80 hover:text-primary hover:border-primary hover:bg-primary/10 font-semibold gap-2 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Discount Tier
                </Button>
              </div>

              {pricingTiers.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-border rounded-2xl bg-muted/30 text-muted-foreground text-sm">
                  Click &apos;Add Discount Tier&apos; to start offering group rates.
                </div>
              )}

              {pricingTiers.map((tier) => {
                const discountPct =
                  tier.discountPercentage !== undefined
                    ? tier.discountPercentage
                    : data.price
                      ? Math.round((1 - tier.pricePerPerson / data.price) * 100)
                      : 0
                return (
                  <div
                    key={tier.id}
                    className="flex flex-col md:flex-row items-center gap-4 p-5 bg-background border border-border rounded-2xl shadow-sm relative group hover:border-primary/30 transition-all"
                  >
                    <div className="w-full md:w-24 flex-shrink-0 space-y-1">
                      <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Tier Name
                      </label>
                      <div className="h-11 flex items-center font-bold text-foreground text-base">
                        {tier.name}
                      </div>
                    </div>

                    <div className="w-full md:w-32 flex-shrink-0 space-y-1">
                      <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block whitespace-nowrap">
                        Group Size
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={tier.minPeople}
                          min={1}
                          onChange={(e) => {
                            updatePricingTier(tier.id, 'minPeople', parseInt(e.target.value) || 1)
                          }}
                          className="h-11 w-full pr-12 rounded-xl bg-muted/40 border-border focus:border-primary font-bold text-base"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                          pax
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex-1 flex items-end gap-4">
                      <div className="space-y-1 w-28 flex-shrink-0">
                        <label className="text-[11px] uppercase font-bold text-primary tracking-wider block">
                          Discount %
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={discountPct === 0 ? '' : discountPct}
                            onChange={(e) => {
                              const val = e.target.value
                              updateTierDiscount(tier.id, val === '' ? 0 : parseInt(val))
                            }}
                            className="h-11 pl-4 pr-8 rounded-xl border-primary/40 bg-primary/10 text-primary focus:border-primary focus:ring-primary/20 font-bold text-lg"
                          />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-[120px] mb-[2px]">
                        <div className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                          Preview
                        </div>
                        <div className="h-11 flex items-center text-lg font-bold text-emerald-600 bg-emerald-50/50 px-3 rounded-xl border border-emerald-100/50 flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {data.currency || '$'} {tier.pricePerPerson}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center absolute right-3 top-3 md:relative md:right-0 md:top-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePricingTier(tier.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              {pricingTiers.length > 0 && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={addPricingTier}
                    className="rounded-xl border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 font-semibold gap-2 transition-all shadow-sm w-full h-14"
                  >
                    <Plus className="w-5 h-5" /> Add Another Discount Tier
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Seasonal Pricing */}
      <div className="glass-card rounded-[24px] p-8 shadow-sm border border-border/60 bg-background">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-foreground uppercase tracking-widest pl-1 mb-1 flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary" /> Seasonal Pricing
            </h3>
            <p className="text-sm text-muted-foreground pl-8">
              Dynamically adjust rates for peak or off-peak seasons.
            </p>
          </div>
          <Switch
            checked={data.seasonal_pricing}
            onCheckedChange={(v) => handleInputChange('seasonal_pricing', v)}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <AnimatePresence>
          {data.seasonal_pricing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden grid grid-cols-2 gap-4 mt-4"
            >
              <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/60">
                <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Peak Multiplier
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={data.peak_season_multiplier || 1.2}
                  onChange={(e) =>
                    handleInputChange('peak_season_multiplier', parseFloat(e.target.value))
                  }
                  className="h-11 rounded-xl bg-background border-border focus:border-primary font-medium"
                />
                <p className="text-[11px] text-muted-foreground font-medium">
                  e.g. 1.2 = 20% increase during peak season
                </p>
              </div>
              <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/60">
                <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Off-Season Multiplier
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={data.off_season_multiplier || 0.8}
                  onChange={(e) =>
                    handleInputChange('off_season_multiplier', parseFloat(e.target.value))
                  }
                  className="h-11 rounded-xl bg-background border-border focus:border-primary font-medium"
                />
                <p className="text-[11px] text-muted-foreground font-medium">
                  e.g. 0.8 = 20% decrease during off-season
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Inclusions & Exclusions - Vertically Stacked Sections */}
      <div className="space-y-8">
        {/* What's Included */}
        <div className="rounded-[24px] p-8 border border-border/60 bg-background">
          <h3 className="text-xl font-bold text-foreground mb-6 font-display">
            What&apos;s Included
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INCLUDED_FEATURE_OPTIONS.map((item) => {
              const Icon = getTourIconComponent(item.icon_key)
              const isSelected = selectedInclusionLabels.has(item.label)
              return (
                <label
                  key={item.label}
                  className={`flex items-center gap-3 cursor-pointer group p-4 rounded-[16px] border-2 transition-all duration-200 ease-out ${
                    isSelected
                      ? 'scale-105 shadow-md border-primary bg-primary/10'
                      : 'border-border bg-background hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => toggleInclude(item.label)}
                  />
                  <Icon
                    className={`w-6 h-6 flex-shrink-0 transition-colors duration-200 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`block text-[15px] font-medium leading-snug transition-colors duration-200 ${
                      isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                      {item.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* What's Excluded */}
        <div className="rounded-[24px] p-8 border border-border/60 bg-background">
          <h3 className="text-xl font-bold text-foreground mb-6 font-display">
            What&apos;s Excluded
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXCLUDED_FEATURE_OPTIONS.map((item) => {
              const Icon = getTourIconComponent(item.icon_key)
              const isSelected = selectedExclusionLabels.has(item.label)
              return (
                <label
                  key={item.label}
                  className={`flex items-center gap-3 cursor-pointer group p-4 rounded-[16px] border-2 transition-all duration-200 ease-out ${
                    isSelected
                      ? 'scale-105 shadow-md border-primary bg-primary/10'
                      : 'border-border bg-background hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => toggleExclude(item.label)}
                  />
                  <Icon
                    className={`w-6 h-6 flex-shrink-0 transition-colors duration-200 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`block text-[15px] font-medium leading-snug transition-colors duration-200 ${
                      isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                      {item.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-border/60">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-8 h-12 rounded-xl text-muted-foreground font-bold border-border hover:bg-muted/30 transition-all shadow-sm"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={isDepositBelowTierMinimum || Boolean(promoValidationError)}
          className="px-8 h-12 rounded-xl min-w-[140px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all shadow-lg shadow-primary/25 border-0"
        >
          Continue
        </Button>
      </div>

      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="rounded-3xl border-border/60 bg-background/95 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Confirm deposit policy</DialogTitle>
            <DialogDescription>
              Only {normalizedDepositPercentage}% of the booking amount will be charged online at the time of booking confirmation. The remaining {100 - normalizedDepositPercentage}% must be collected from the traveler by the tour operator before departure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">Charged now per traveler</span>
                <span className="font-bold text-foreground">{data.currency || 'PKR'} {formatMoney(standardDepositPreview.upfrontAmount)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">Remaining per traveler</span>
                <span className="font-bold text-foreground">{data.currency || 'PKR'} {formatMoney(standardDepositPreview.remainingAmount)}</span>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={depositPolicyAcknowledged}
                onChange={(event) => setDepositPolicyAcknowledged(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-foreground">
                I understand that only the upfront percentage will be collected online.
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setIsDepositDialogOpen(false)}>
              Back
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              disabled={!depositPolicyAcknowledged}
              onClick={() => {
                setDepositPolicyConfirmed(true)
                setIsDepositDialogOpen(false)
              }}
            >
              Confirm policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
