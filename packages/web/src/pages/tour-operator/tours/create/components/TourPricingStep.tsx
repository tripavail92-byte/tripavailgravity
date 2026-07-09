import {
  DollarSign,
  Percent,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { useFxRates } from '@/queries/fxQueries'
import { SubStepProgress } from '@/features/wizard/SubStepProgress'
import { WizardScreen } from '@/features/wizard/WizardScreen'
import { useSubStepFlow } from '@/features/wizard/useSubStepFlow'
import { fieldId, type SubStepDef } from '@/features/wizard/types'
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

interface TourPricingStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
  membershipTierLabel?: string
  minimumDepositPercent?: number
  /** Restored sub-step index, persisted in the tour draft's workflow snapshot. */
  subStep?: number
  onSubStepChange?: (index: number) => void
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
  subStep = 0,
  onSubStepChange,
}: TourPricingStepProps) {
  const [pricingTiers, setPricingTiers] = useState(data.pricing_tiers || [])
  const { data: fxRates, isLoading: isLoadingFx } = useFxRates()
  const hasFxRates = Boolean(fxRates && Object.keys(fxRates).length > 0)
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [depositPolicyAcknowledged, setDepositPolicyAcknowledged] = useState(false)
  const [depositPolicyConfirmed, setDepositPolicyConfirmed] = useState(false)
  /** True when the dialog was opened by pressing Next, so confirming should also advance. */
  const [advanceAfterConfirm, setAdvanceAfterConfirm] = useState(false)
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

  /**
   * Switching currency converts the money the operator already typed, rather than silently
   * relabelling it — "30,000 PKR" must not become "30,000 USD". Group-tier prices are recomputed
   * from the converted base so their discount percentages stay exact.
   */
  const handleCurrencyChange = (nextCurrency: string) => {
    const fromCurrency = data.currency || 'PKR'
    if (nextCurrency === fromCurrency) return

    const currentPrice = Number(data.price || 0)

    if (!currentPrice) {
      handleInputChange('currency', nextCurrency)
      return
    }

    const rate = fxRates?.[`${fromCurrency}->${nextCurrency}`]
    if (!rate || !Number.isFinite(rate)) {
      // Never guess a rate. Switch the label and tell the operator the amount is unchanged.
      handleInputChange('currency', nextCurrency)
      toast(`No ${fromCurrency}→${nextCurrency} rate available — please re-enter the price.`, {
        icon: '⚠️',
      })
      return
    }

    const convertedPrice = Math.round(currentPrice * rate * 100) / 100
    const convertedTiers = pricingTiers.map((tier: any) => ({
      ...tier,
      pricePerPerson: Math.round(convertedPrice * (1 - (Number(tier.discountPercentage) || 0) / 100)),
    }))

    setPricingTiers(convertedTiers)
    onUpdate({
      currency: nextCurrency,
      price: convertedPrice,
      ...(convertedTiers.length ? { pricing_tiers: convertedTiers } : {}),
    } as Partial<Tour>)

    toast.success(
      `Converted ${fromCurrency} ${currentPrice.toLocaleString()} → ${nextCurrency} ${convertedPrice.toLocaleString()}`,
    )
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
  const hasGroupDiscounts = Boolean(data.group_discounts)
  const hasSeasonalPricing = Boolean(data.seasonal_pricing)
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

  /**
   * Continue is never blocked on a missing field — those are surfaced as issues and the stage
   * reports "needs attention". The deposit acknowledgement is different: it is an explicit
   * confirmation of a money policy, so it is asked for as the operator leaves the deposit screen.
   */
  const handleContinue = () => {
    onNext()
  }

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('en-PK', {
      maximumFractionDigits: 2,
    }).format(value)
  }

  const subSteps = useMemo<SubStepDef<Partial<Tour>>[]>(
    () => [
      {
        id: 'price',
        title: 'What does this tour cost?',
        description: 'The base price one traveller pays, in the currency you are paid in.',
        validate: (d) =>
          Number(d.price) > 0
            ? []
            : [{ field: fieldId('price'), message: 'Enter a base price per person' }],
      },
      {
        id: 'deposit',
        title: 'How much is due when they book?',
        description: 'Travellers pay this share upfront; you collect the rest before departure.',
        validate: (d) =>
          clampDepositPercentage(Number(d.deposit_percentage || 0)) >= effectiveMinimumDeposit
            ? []
            : [
                {
                  field: fieldId('deposit'),
                  message: `Deposit must be at least ${effectiveMinimumDeposit}% on ${membershipTierLabel}`,
                },
              ],
      },
      {
        id: 'cancellation',
        title: 'What happens if a traveller cancels?',
        description: 'This policy is shown before anyone books.',
        validate: (d) =>
          d.cancellation_policy
            ? []
            : [{ field: fieldId('cancellation'), message: 'Choose a cancellation policy' }],
      },
      {
        id: 'groups',
        title: 'Do you offer group discounts?',
        description: 'Optional. Lower the per-person price as the group grows.',
        optional: true,
      },
      {
        id: 'seasonal',
        title: 'Does your price change by season?',
        description: 'Optional. Set peak and off-season multipliers.',
        optional: true,
      },
      {
        id: 'inclusions',
        title: "What's included, and what isn't?",
        description: 'Travellers compare on this more than on price.',
        optional: true,
      },
    ],
    [effectiveMinimumDeposit, membershipTierLabel],
  )

  const flow = useSubStepFlow<Partial<Tour>>({
    subSteps,
    data,
    initialIndex: subStep,
    onIndexChange: onSubStepChange,
    onExitForward: handleContinue,
    onExitBack: onBack,
  })

  /**
   * The deposit acknowledgement is asked for as the operator leaves the deposit screen — not
   * four screens later on "What's included?", which is where a stage-exit hook would surface it.
   */
  const handleNext = () => {
    if (flow.current.id === 'deposit' && basePrice > 0 && !depositPolicyConfirmed) {
      setAdvanceAfterConfirm(true)
      setIsDepositDialogOpen(true)
      return
    }
    flow.goNext()
  }

  const issueIndices = Object.entries(flow.issuesByIndex)
    .filter(([, issues]) => issues.length > 0)
    .map(([index]) => Number(index))

  const invalidFields = new Set(flow.showIssues ? flow.issues.map((issue) => issue.field) : [])
  const isInvalid = (name: string) => invalidFields.has(fieldId(name))
  const stepId = flow.current.id

  return (
    <div className="space-y-6">
      <SubStepProgress
        stageTitle="Pricing & Policies"
        index={flow.index}
        total={flow.total}
        issueIndices={issueIndices}
        onSelect={(index) => flow.goTo(index)}
      />

      <WizardScreen
        index={flow.index}
        total={flow.total}
        title={flow.current.title}
        description={flow.current.description}
        issues={flow.issues}
        showIssues={flow.showIssues}
        onIssueClick={flow.focusField}
        onBack={flow.goBack}
        onNext={handleNext}
        nextLabel={flow.isLast ? 'Continue' : undefined}
      >
        {stepId === 'price' ? (
          <>
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
                id={fieldId('price')}
                type="number"
                aria-invalid={isInvalid('price') || undefined}
                className={`pl-16 h-12 rounded-xl bg-muted/40 text-lg font-medium focus:border-primary focus:ring-primary/20 ${
                  isInvalid('price') ? 'border-destructive ring-1 ring-destructive/30' : 'border-border'
                }`}
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
            <Select value={data.currency || 'PKR'} onValueChange={handleCurrencyChange}>
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
            <p className="mt-2 text-xs text-muted-foreground">
              {isLoadingFx
                ? 'Loading exchange rates…'
                : hasFxRates
                  ? 'Changing currency converts the price you entered.'
                  : 'Exchange rates unavailable — changing currency will not convert the price.'}
            </p>
          </div>
        </div>
      </div>
          </>
        ) : null}

        {stepId === 'deposit' ? (
          <>
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
                        id={fieldId('deposit')}
                        type="number"
                        min={effectiveMinimumDeposit}
                        max={50}
                        aria-invalid={isInvalid('deposit') || undefined}
                        value={normalizedDepositPercentage}
                        onChange={(event) => handleDepositPercentageChange(Number(event.target.value || 0))}
                        className={`h-7 w-20 border-0 bg-transparent p-0 text-right font-semibold shadow-none focus-visible:ring-0 ${
                          isInvalid('deposit') ? 'text-destructive' : ''
                        }`}
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
                    onClick={() => {
                      setAdvanceAfterConfirm(false)
                      setIsDepositDialogOpen(true)
                    }}
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
          </>
        ) : null}

        {stepId === 'cancellation' ? (
          <>
          <div className="space-y-3 px-2">
            <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
              Cancellation Policy
            </label>
            {/* No pre-selection: the old UI highlighted "flexible" before the operator had chosen
                anything, so a required choice looked already made. */}
            <div
              id={fieldId('cancellation')}
              tabIndex={-1}
              className="space-y-3 outline-none"
              role="radiogroup"
              aria-label="Cancellation policy"
              aria-invalid={isInvalid('cancellation') || undefined}
            >
              {CANCELLATION_POLICIES.map((policy) => {
                const Icon = getTourIconComponent(policy.iconKey)
                const isSelected = data.cancellation_policy === policy.value

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
          </>
        ) : null}

        {stepId === 'groups' ? (
          <>
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
            checked={hasGroupDiscounts}
            onCheckedChange={(v) => handleInputChange('group_discounts', v)}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <AnimatePresence>
          {hasGroupDiscounts && (
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
                        <div className="h-11 flex items-center text-lg font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 px-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/40 flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">
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
          </>
        ) : null}

        {stepId === 'seasonal' ? (
          <>
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
            checked={hasSeasonalPricing}
            onCheckedChange={(v) => handleInputChange('seasonal_pricing', v)}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <AnimatePresence>
          {hasSeasonalPricing && (
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
          </>
        ) : null}

        {stepId === 'inclusions' ? (
          <>
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
          </>
        ) : null}
      </WizardScreen>

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
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                setAdvanceAfterConfirm(false)
                setIsDepositDialogOpen(false)
              }}
            >
              Back
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              disabled={!depositPolicyAcknowledged}
              onClick={() => {
                setDepositPolicyConfirmed(true)
                setIsDepositDialogOpen(false)
                // Confirming after pressing Next means "yes, continue" — don't demand a second press.
                if (advanceAfterConfirm) {
                  setAdvanceAfterConfirm(false)
                  flow.goNext()
                }
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

