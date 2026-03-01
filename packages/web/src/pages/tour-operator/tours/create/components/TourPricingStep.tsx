import {
  BadgeCheck,
  Bed,
  Bus,
  Camera,
  Coins,
  DollarSign,
  FileText,
  HeartPulse,
  Info,
  Map,
  Percent,
  Plane,
  Plus,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Trash2,
  Users,
  Utensils,
  Wallet,
  Wine,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
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
import { Tour } from '@/features/tour-operator/services/tourService'

interface TourPricingStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
}

const COMMON_INCLUDES = [
  { id: 'Professional Tour Guide', icon: BadgeCheck },
  { id: 'Transportation', icon: Bus },
  { id: 'Entrance Fees', icon: Ticket },
  { id: 'Meals (as specified)', icon: Utensils },
  { id: 'Accommodation', icon: Bed },
  { id: 'Travel Insurance', icon: ShieldCheck },
  { id: 'Photography', icon: Camera },
  { id: 'Local Taxes', icon: Receipt },
]

const COMMON_EXCLUDES = [
  { id: 'Personal Expenses', icon: Wallet },
  { id: 'Tips and Gratuities', icon: Coins },
  { id: 'International Flights', icon: Plane },
  { id: 'Visa Fees', icon: FileText },
  { id: 'Optional Activities', icon: Map },
  { id: 'Alcoholic Beverages', icon: Wine },
  { id: 'Shopping', icon: ShoppingBag },
  { id: 'Emergency Expenses', icon: HeartPulse },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED']

export function TourPricingStep({ data, onUpdate, onNext, onBack }: TourPricingStepProps) {
  const [pricingTiers, setPricingTiers] = useState(data.pricing_tiers || [])

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
      maxPeople:
        pricingTiers.length === 0 ? 5 : pricingTiers[pricingTiers.length - 1].minPeople + 1,
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
    const current = data.inclusions || []
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item]
    onUpdate({ inclusions: next })
  }

  const toggleExclude = (item: string) => {
    const current = data.exclusions || []
    const next = current.includes(item) ? current.filter((e) => e !== item) : [...current, item]
    onUpdate({ exclusions: next })
  }

  return (
    <div className="space-y-6">
      {/* Legend Header */}
      <div className="relative p-8 rounded-[24px] bg-gradient-to-r from-[#FF7A70] to-[#FF6B60] text-white border-none shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg shrink-0">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Tour Pricing</h2>
            <p className="text-white/90 text-sm font-medium mt-1">
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
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                {data.currency || '$'}
              </span>
              <Input
                type="number"
                className="pl-10 h-12 rounded-xl border-gray-200 bg-slate-50 focus:border-[#FF7167] focus:ring-[#FF7167]/20 text-lg font-medium"
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
                className="overflow-hidden p-4 rounded-2xl border border-[#FF7167]/30 bg-[#FFF8F7] space-y-2"
              >
                <label className="text-[11px] uppercase font-bold text-[#FF7167] tracking-wider block pl-2">
                  Deposit Percentage
                </label>
                <Select
                  value={String(data.deposit_percentage || 25)}
                  onValueChange={(v) => handleInputChange('deposit_percentage', parseInt(v))}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white border-white shadow-sm text-[#FF7167] font-bold focus:ring-[#FF7167]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10% Deposit</SelectItem>
                    <SelectItem value="25">25% Deposit</SelectItem>
                    <SelectItem value="50">50% Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </AnimatePresence>

          <Separator className="bg-gray-100" />

          <div className="space-y-3 px-2">
            <label className="text-[11px] uppercase font-bold text-gray-500 tracking-wider block">
              Cancellation Policy
            </label>
            <Select
              value={data.cancellation_policy || 'flexible'}
              onValueChange={(v: string) => handleInputChange('cancellation_policy', v)}
            >
              <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-slate-50 focus:border-[#FF7167] focus:ring-[#FF7167]/20 text-sm font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">Flexible (Free cancellation 24h before)</SelectItem>
                <SelectItem value="moderate">Moderate (Free cancellation 5 days before)</SelectItem>
                <SelectItem value="strict">
                  Strict (50% refund if cancelled 14 days before)
                </SelectItem>
                <SelectItem value="non-refundable">Non-refundable</SelectItem>
              </SelectContent>
            </Select>
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
            {COMMON_INCLUDES.map((item) => {
              const Icon = item.icon
              const isSelected = (data.inclusions || []).includes(item.id)
              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 cursor-pointer group p-4 rounded-[16px] border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-gray-900 bg-slate-50'
                      : 'border-gray-200 bg-white hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => toggleInclude(item.id)}
                  />
                  <Icon
                    className={`w-6 h-6 flex-shrink-0 transition-colors duration-200 ${isSelected ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-900'}`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`block text-[15px] font-medium leading-snug transition-colors duration-200 ${
                      isSelected ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'
                    }`}
                  >
                    {item.id}
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
            {COMMON_EXCLUDES.map((item) => {
              const Icon = item.icon
              const isSelected = (data.exclusions || []).includes(item.id)
              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 cursor-pointer group p-4 rounded-[16px] border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-gray-900 bg-slate-50'
                      : 'border-gray-200 bg-white hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => toggleExclude(item.id)}
                  />
                  <Icon
                    className={`w-6 h-6 flex-shrink-0 transition-colors duration-200 ${isSelected ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-900'}`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`block text-[15px] font-medium leading-snug transition-colors duration-200 ${
                      isSelected ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'
                    }`}
                  >
                    {item.id}
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
          className="px-8 h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
