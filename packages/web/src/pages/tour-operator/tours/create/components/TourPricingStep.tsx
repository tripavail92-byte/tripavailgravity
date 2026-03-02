import {
  DollarSign,
  Info,
  Percent,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
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

interface TourPricingStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
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

export function TourPricingStep({ data, onUpdate, onNext, onBack }: TourPricingStepProps) {
  const [pricingTiers, setPricingTiers] = useState(data.pricing_tiers || [])
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

  return (
    <div className="space-y-6">
      {/* Legend Header */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white border-none shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Tour Pricing</h2>
            <p className="text-white/90 text-sm font-medium">
              Set competitive pricing and booking policies for your tour.
            </p>
          </div>
        </div>
      </div>

      {/* Base Pricing */}
      <div className="glass-card rounded-[24px] p-8 shadow-sm border border-gray-100 bg-white">
        <h3 className="text-[14px] font-bold text-gray-900 uppercase tracking-widest pl-1 mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#FF7167]" /> Base Pricing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Base Price Per Person *
            </label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-muted text-muted-foreground border border-border flex items-center justify-center text-xs font-bold pointer-events-none">
                {data.currency || 'PKR'}
              </div>
              <Input
                type="number"
                className="pl-16 h-12 rounded-xl border-gray-200 bg-slate-50 focus:border-[#FF7167] focus:ring-[#FF7167]/20 text-lg font-medium"
                placeholder="0.00"
                value={data.price || ''}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Currency
            </label>
            <Select
              value={data.currency || 'USD'}
              onValueChange={(v) => handleInputChange('currency', v)}
            >
              <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-slate-50 text-base font-medium focus:ring-[#FF7167]/20">
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

      {/* Group Discounts */}
      <div className="glass-card rounded-[24px] p-8 shadow-sm border border-gray-100 bg-white">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 uppercase tracking-widest pl-1 mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF7167]" /> Group Discounts
            </h3>
            <p className="text-sm text-gray-500 pl-8">
              Offer percentage-based lower rates for larger groups.
            </p>
          </div>
          <Switch
            checked={data.group_discounts}
            onCheckedChange={(v) => handleInputChange('group_discounts', v)}
            className="data-[state=checked]:bg-[#FF7167]"
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
                  className="rounded-xl border-gray-200 text-gray-700 hover:text-[#FF7167] hover:border-[#FF7167] hover:bg-[#FFF8F7] font-semibold gap-2 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Discount Tier
                </Button>
              </div>

              {pricingTiers.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-slate-50 text-gray-500 text-sm">
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
                    className="flex flex-col md:flex-row items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm relative group hover:border-[#FF7167]/30 transition-all"
                  >
                    <div className="w-full md:w-24 flex-shrink-0 space-y-1">
                      <label className="text-[11px] uppercase font-bold text-gray-500 tracking-wider block">
                        Tier Name
                      </label>
                      <div className="h-11 flex items-center font-bold text-gray-900 text-base">
                        {tier.name}
                      </div>
                    </div>

                    <div className="w-full md:w-32 flex-shrink-0 space-y-1">
                      <label className="text-[11px] uppercase font-bold text-gray-500 tracking-wider block whitespace-nowrap">
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
                          className="h-11 w-full pr-12 rounded-xl bg-slate-50 border-gray-200 focus:border-[#FF7167] font-bold text-base"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                          pax
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex-1 flex items-end gap-4">
                      <div className="space-y-1 w-28 flex-shrink-0">
                        <label className="text-[11px] uppercase font-bold text-[#FF7167] tracking-wider block">
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
                            className="h-11 pl-4 pr-8 rounded-xl border-[#FF7167]/40 bg-[#FFF8F7] text-[#FF7167] focus:border-[#FF7167] focus:ring-[#FF7167]/20 font-bold text-lg"
                          />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF7167]" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-[120px] mb-[2px]">
                        <div className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-1">
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
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl h-10 w-10 transition-colors"
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
                    className="rounded-xl border-dashed border-gray-300 text-gray-500 hover:text-[#FF7167] hover:border-[#FF7167] hover:bg-[#FFF8F7] font-semibold gap-2 transition-all shadow-sm w-full h-14"
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
      <div className="glass-card rounded-[24px] p-8 shadow-sm border border-gray-100 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 uppercase tracking-widest pl-1 mb-1 flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#FF7167]" /> Seasonal Pricing
            </h3>
            <p className="text-sm text-gray-500 pl-8">
              Dynamically adjust rates for peak or off-peak seasons.
            </p>
          </div>
          <Switch
            checked={data.seasonal_pricing}
            onCheckedChange={(v) => handleInputChange('seasonal_pricing', v)}
            className="data-[state=checked]:bg-[#FF7167]"
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
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-gray-100">
                <label className="text-[11px] uppercase font-bold text-gray-500 tracking-wider block">
                  Peak Multiplier
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={data.peak_season_multiplier || 1.2}
                  onChange={(e) =>
                    handleInputChange('peak_season_multiplier', parseFloat(e.target.value))
                  }
                  className="h-11 rounded-xl bg-white border-gray-200 focus:border-[#FF7167] font-medium"
                />
                <p className="text-[11px] text-gray-400 font-medium">
                  e.g. 1.2 = 20% increase during peak season
                </p>
              </div>
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-gray-100">
                <label className="text-[11px] uppercase font-bold text-gray-500 tracking-wider block">
                  Off-Season Multiplier
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={data.off_season_multiplier || 0.8}
                  onChange={(e) =>
                    handleInputChange('off_season_multiplier', parseFloat(e.target.value))
                  }
                  className="h-11 rounded-xl bg-white border-gray-200 focus:border-[#FF7167] font-medium"
                />
                <p className="text-[11px] text-gray-400 font-medium">
                  e.g. 0.8 = 20% decrease during off-season
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Terms */}
      <div className="glass-card rounded-[24px] p-8 shadow-sm border border-gray-100 bg-white">
        <h3 className="text-[14px] font-bold text-gray-900 uppercase tracking-widest pl-1 mb-8 flex items-center gap-2">
          <Info className="w-5 h-5 text-[#FF7167]" /> Booking Terms
        </h3>

        <div className="space-y-8">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-gray-100">
            <div className="pl-2">
              <label className="text-sm font-bold text-gray-900">Require Deposit</label>
              <p className="text-xs text-gray-500 font-medium">
                Require partial payment upfront to secure the booking.
              </p>
            </div>
            <Switch
              checked={data.deposit_required}
              onCheckedChange={(v) => handleInputChange('deposit_required', v)}
              className="data-[state=checked]:bg-[#FF7167]"
            />
          </div>

          <AnimatePresence>
            {data.deposit_required && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden p-5 rounded-2xl border border-primary/30 bg-primary/10 space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[11px] uppercase font-bold text-primary tracking-wider block">
                    Deposit Percentage
                  </label>
                  <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
                    {Math.max(0, Math.min(50, data.deposit_percentage || 25))}%
                  </div>
                </div>
                <Slider
                  min={0}
                  max={50}
                  step={1}
                  value={[Math.max(0, Math.min(50, data.deposit_percentage || 25))]}
                  onValueChange={(value) => handleInputChange('deposit_percentage', value[0] ?? 25)}
                  className="[&_[data-slot=slider-track]]:h-3 [&_[data-slot=slider-track]]:bg-primary/20 [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-thumb]]:shadow-lg"
                />
                <p className="text-xs text-muted-foreground font-medium">
                  Travelers pay {Math.round(((data.price || 0) * (data.deposit_percentage || 25)) / 100)}{' '}
                  {data.currency || 'PKR'} today per person.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Separator className="bg-gray-100" />

          <div className="space-y-3 px-2">
            <label className="text-[11px] uppercase font-bold text-gray-500 tracking-wider block">
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

      {/* Inclusions & Exclusions - Vertically Stacked Sections */}
      <div className="space-y-8">
        {/* What's Included */}
        <div className="rounded-[24px] p-8 border border-gray-200 bg-white">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-display">
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
                      : 'border-gray-200 bg-white hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => toggleInclude(item.label)}
                  />
                  <Icon
                    className={`w-6 h-6 flex-shrink-0 transition-colors duration-200 ${isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`block text-[15px] font-medium leading-snug transition-colors duration-200 ${
                      isSelected ? 'text-foreground' : 'text-gray-600 group-hover:text-foreground'
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
        <div className="rounded-[24px] p-8 border border-gray-200 bg-white">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-display">
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
                      : 'border-gray-200 bg-white hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => toggleExclude(item.label)}
                  />
                  <Icon
                    className={`w-6 h-6 flex-shrink-0 transition-colors duration-200 ${isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`block text-[15px] font-medium leading-snug transition-colors duration-200 ${
                      isSelected ? 'text-foreground' : 'text-gray-600 group-hover:text-foreground'
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
      <div className="flex items-center justify-between pt-8 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-8 h-12 rounded-xl text-gray-600 font-bold border-gray-200 hover:bg-slate-50 transition-all shadow-sm"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="px-8 h-12 rounded-xl min-w-[140px] bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/25 border-0"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
