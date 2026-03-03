import { APIProvider } from '@vis.gl/react-google-maps'
import { Calendar, Check, ChevronDown, Clock3, Info, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tour } from '@/features/tour-operator/services/tourService'
import { supabase } from '@/lib/supabase'

import {
  AdventureIcon,
  BeachIcon,
  BudgetIcon,
  CityIcon,
  CulturalIcon,
  CustomIcon,
  FamilyIcon,
  FoodIcon,
  HistoricalIcon,
  HoneymoonIcon,
  LuxuryIcon,
  NatureIcon,
  PhotographyIcon,
  ReligiousIcon,
  WellnessIcon,
} from './CategoryIcons'
import { DurationScroller } from './DurationScroller'
import { TimeWheelPicker } from './TimeWheelPicker'

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''

interface TourBasicsStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
}

const CATEGORIES = [
  { id: 'Adventure', icon: AdventureIcon, label: 'Adventure' },
  { id: 'Cultural', icon: CulturalIcon, label: 'Cultural' },
  { id: 'Nature', icon: NatureIcon, label: 'Nature' },
  { id: 'City Tour', icon: CityIcon, label: 'City Tour' },
  { id: 'Food & Drink', icon: FoodIcon, label: 'Food & Drink' },
  { id: 'Beach', icon: BeachIcon, label: 'Beach' },
  { id: 'Historical', icon: HistoricalIcon, label: 'Historical' },
  { id: 'Religious', icon: ReligiousIcon, label: 'Religious' },
  { id: 'Honeymoon', icon: HoneymoonIcon, label: 'Honeymoon' },
  { id: 'Family', icon: FamilyIcon, label: 'Family' },
  { id: 'Photography', icon: PhotographyIcon, label: 'Photography' },
  { id: 'Wellness', icon: WellnessIcon, label: 'Wellness' },
  { id: 'Luxury', icon: LuxuryIcon, label: 'Luxury' },
  { id: 'Budget', icon: BudgetIcon, label: 'Budget' },
  { id: 'Custom', icon: CustomIcon, label: 'Custom' },
] as const

const TONES = [
  { id: 'luxury', label: 'Luxury' },
  { id: 'budget', label: 'Budget' },
  { id: 'family', label: 'Family' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'general', label: 'General' },
] as const

const MAX_CAPACITY = 300
const DEFAULT_START_TIME = '09:00'
const WHEEL_ITEM_HEIGHT = 40

const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
]

const pad = (value: number) => String(value).padStart(2, '0')

const formatIsoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`

const getTodayIsoDate = () => {
  const now = new Date()
  return formatIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

const parseIsoDate = (dateString?: string) => {
  const fallback = new Date()

  if (!dateString) {
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth() + 1,
      day: fallback.getDate(),
    }
  }

  const [year, month, day] = dateString.split('-').map(Number)

  if (!year || !month || !day) {
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth() + 1,
      day: fallback.getDate(),
    }
  }

  return { year, month, day }
}

 

interface WheelColumnProps {
  options: Array<{ value: number; label: string }>
  selectedValue: number
  onSelect: (value: number) => void
  ariaLabel: string
}

function WheelColumn({ options, selectedValue, onSelect, ariaLabel }: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const snapTimeoutRef = useRef<number | null>(null)

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  )

  const snapToNearest = useCallback(() => {
    if (!scrollRef.current) return

    const rawIndex = Math.round(scrollRef.current.scrollTop / WHEEL_ITEM_HEIGHT)
    const boundedIndex = Math.max(0, Math.min(options.length - 1, rawIndex))
    const boundedOption = options[boundedIndex]

    if (!boundedOption) return

    if (boundedOption.value !== selectedValue) {
      onSelect(boundedOption.value)
    }

    scrollRef.current.scrollTo({
      top: boundedIndex * WHEEL_ITEM_HEIGHT,
      behavior: 'smooth',
    })
  }, [onSelect, options, selectedValue])

  useEffect(() => {
    if (!scrollRef.current) return

    scrollRef.current.scrollTo({
      top: selectedIndex * WHEEL_ITEM_HEIGHT,
      behavior: 'smooth',
    })
  }, [selectedIndex, options.length])

  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) {
        window.clearTimeout(snapTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative h-40 md:h-44 rounded-xl border border-primary/20 bg-background/80 shadow-inner overflow-hidden">
      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 rounded-lg bg-primary/10 border border-primary/25 shadow-sm pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background via-background/85 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background via-background/85 to-transparent pointer-events-none z-10" />

      <div
        ref={scrollRef}
        role="listbox"
        aria-label={ariaLabel}
        onScroll={() => {
          if (snapTimeoutRef.current) {
            window.clearTimeout(snapTimeoutRef.current)
          }
          snapTimeoutRef.current = window.setTimeout(snapToNearest, 80)
        }}
        className="h-full overflow-y-auto snap-y snap-mandatory py-16 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`block w-full h-10 snap-center text-center transition-all duration-200 ${
                isSelected
                  ? 'text-primary font-bold text-base scale-[1.03]'
                  : 'text-muted-foreground text-sm hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface DateWheelPickerProps {
  value?: string
  onChange: (value: string) => void
}

function DateWheelPicker({ value, onChange }: DateWheelPickerProps) {
  const parsed = useMemo(() => parseIsoDate(value), [value])

  const yearOptions = useMemo(() => {
    const baseYear = new Date().getFullYear()
    return Array.from({ length: 13 }, (_, index) => {
      const nextYear = baseYear - 1 + index
      return { value: nextYear, label: String(nextYear) }
    })
  }, [])

  const dayOptions = useMemo(() => {
    const count = getDaysInMonth(parsed.year, parsed.month)
    return Array.from({ length: count }, (_, index) => {
      const day = index + 1
      return { value: day, label: String(day) }
    })
  }, [parsed.year, parsed.month])

  const handleMonthSelect = (month: number) => {
    const adjustedDay = Math.min(parsed.day, getDaysInMonth(parsed.year, month))
    onChange(formatIsoDate(parsed.year, month, adjustedDay))
  }

  const handleDaySelect = (day: number) => {
    onChange(formatIsoDate(parsed.year, parsed.month, day))
  }

  const handleYearSelect = (year: number) => {
    const adjustedDay = Math.min(parsed.day, getDaysInMonth(year, parsed.month))
    onChange(formatIsoDate(year, parsed.month, adjustedDay))
  }

  return (
    <div className="space-y-2 md:space-y-3">
      <div className="grid grid-cols-3 gap-2 md:gap-3 px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Month
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Day
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Year
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <WheelColumn
          options={MONTH_OPTIONS}
          selectedValue={parsed.month}
          onSelect={handleMonthSelect}
          ariaLabel="Select month"
        />
        <WheelColumn
          options={dayOptions}
          selectedValue={parsed.day}
          onSelect={handleDaySelect}
          ariaLabel="Select day"
        />
        <WheelColumn
          options={yearOptions}
          selectedValue={parsed.year}
          onSelect={handleYearSelect}
          ariaLabel="Select year"
        />
      </div>
      <div className="px-2.5 md:px-3 py-2 rounded-xl border border-primary/25 bg-primary/10 text-xs md:text-sm font-bold text-foreground shadow-sm">
        Selected: {MONTH_OPTIONS[parsed.month - 1]?.label} {parsed.day}, {parsed.year}
      </div>
    </div>
  )
}



interface Template {
  id: string
  text: string
  tone: string
  length_class: string
}

export function TourBasicsStep({ data, onUpdate, onNext }: TourBasicsStepProps) {
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [selectedTone, setSelectedTone] = useState<string>('general')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(true)
  const [isDatesAvailabilityOpen, setIsDatesAvailabilityOpen] = useState(true)

  const schedules = Array.isArray(data.schedules) ? data.schedules : []
  const primarySchedule = schedules[0] || {}

  const updatePrimarySchedule = (updates: Record<string, unknown>) => {
    const mergedPrimary = {
      id: primarySchedule?.id || crypto.randomUUID(),
      date: primarySchedule?.date || '',
      time: primarySchedule?.time || DEFAULT_START_TIME,
      capacity: data.max_participants || primarySchedule?.capacity || 10,
      ...primarySchedule,
      ...updates,
    }

    const nextSchedules = [mergedPrimary, ...schedules.slice(1)]
    onUpdate({ schedules: nextSchedules })
  }

  const hasPrimarySchedule =
    typeof primarySchedule?.date === 'string' &&
    primarySchedule.date.trim().length > 0 &&
    typeof primarySchedule?.time === 'string' &&
    primarySchedule.time.trim().length > 0

  useEffect(() => {
    if (hasPrimarySchedule) return

    updatePrimarySchedule({
      date: primarySchedule?.date || getTodayIsoDate(),
      time: primarySchedule?.time || DEFAULT_START_TIME,
    })
  }, [hasPrimarySchedule, primarySchedule?.date, primarySchedule?.time])

  const isValid =
    !!data.title &&
    !!(data.tour_type || data.custom_category_label) &&
    !!data.duration_days &&
    !!data.location?.city &&
    !!data.max_participants &&
    data.max_participants > 0 &&
    hasPrimarySchedule

  // Fetch templates whenever the panel opens, tone, or tour_type changes
  useEffect(() => {
    if (!showAiPanel) return
    const tourType = data.tour_type && data.tour_type !== 'Custom' ? data.tour_type : undefined

    setLoadingTemplates(true)

    let query = supabase
      .from('tour_description_templates')
      .select('id, text, tone, length_class')
      .eq('is_active', true)
      .eq('tone', selectedTone)

    if (tourType) {
      query = query.eq('tour_type', tourType) as typeof query
    }

    query.limit(8).then(({ data: rows }) => {
      setTemplates((rows ?? []) as Template[])
      setLoadingTemplates(false)
    })
  }, [showAiPanel, selectedTone, data.tour_type])

  function applyTemplate(text: string) {
    onUpdate({ short_description: text })
    setShowAiPanel(false)
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
      <div className="space-y-6">
        {/* Header card */}
        <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white border-none shadow-xl rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-background/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Tour Basics</h2>
              <p className="text-white/80 text-sm">
                Start with the fundamental details of your tour package.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          {/* Tour Title */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
              Tour Title *
            </Label>
            <Input
              placeholder="e.g. Historic City Walk"
              value={data.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="h-12 border-input focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          <div className="glass-card rounded-2xl border border-white/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsCategoryOpen((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between bg-white/40 backdrop-blur-md hover:bg-white/60 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-base font-bold text-foreground">Tour Category *</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Choose the experience type travelers will see first.
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-primary transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isCategoryOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {CATEGORIES.map((cat) => (
                        <motion.button
                          key={cat.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            onUpdate({
                              tour_type: cat.id,
                              custom_category_label:
                                cat.id === 'Custom' ? data.custom_category_label : undefined,
                            })
                          }
                          className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 group ${
                            data.tour_type === cat.id
                              ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                              : 'border-border bg-background hover:border-primary/30 hover:shadow-md'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-background transition-colors duration-300">
                            <cat.icon />
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest text-center leading-tight ${
                              data.tour_type === cat.id
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-foreground'
                            }`}
                          >
                            {cat.label}
                          </span>
                          {data.tour_type === cat.id && (
                            <motion.div
                              layoutId="selected-category"
                              className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center shadow-md"
                            >
                              <Check className="w-3 h-3" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    <AnimatePresence>
                      {data.tour_type === 'Custom' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Describe your custom category
                            </Label>
                            <Input
                              placeholder="e.g. Night Safari, Glacier Trek, Rooftop Cinema"
                              value={data.custom_category_label || ''}
                              onChange={(e) => onUpdate({ custom_category_label: e.target.value })}
                              className="h-10 text-sm"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="glass-card rounded-2xl border border-white/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsDatesAvailabilityOpen((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between bg-white/40 backdrop-blur-md hover:bg-white/60 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-base font-bold text-foreground">Dates & Availability *</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Set primary departure date, start time, and seats.
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-primary transition-transform duration-200 ${isDatesAvailabilityOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isDatesAvailabilityOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 md:p-4 space-y-4 md:space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
                        Duration *
                      </Label>
                      <DurationScroller
                        value={data.duration_days ?? 1}
                        onChange={(days) =>
                          onUpdate({
                            duration_days: days,
                            duration: `${days} day${days !== 1 ? 's' : ''}`,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
                        Location (City) *
                      </Label>
                      <CityAutocomplete
                        value={data.location?.city || ''}
                        onCitySelect={(city) =>
                          onUpdate({
                            location: {
                              ...data.location,
                              city,
                              country: data.location?.country || '',
                            },
                          })
                        }
                        placeholder="Search for a city..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
                        Capacity / Seats *
                      </Label>
                      <div className="relative max-w-xs">
                        <Input
                          type="number"
                          min={1}
                          max={MAX_CAPACITY}
                          placeholder="e.g. 30"
                          value={data.max_participants || ''}
                          onChange={(e) => {
                            const next = Math.max(
                              1,
                              Math.min(MAX_CAPACITY, parseInt(e.target.value || '1', 10) || 1),
                            )
                            const mergedPrimary = {
                              id: primarySchedule?.id || crypto.randomUUID(),
                              date: primarySchedule?.date || '',
                              time: primarySchedule?.time || DEFAULT_START_TIME,
                              ...primarySchedule,
                              capacity: next,
                            }
                            onUpdate({
                              max_participants: next,
                              min_participants: 1,
                              schedules: [mergedPrimary, ...schedules.slice(1)],
                            })
                          }}
                          className="h-12 border-input focus:border-primary/50 focus:ring-primary/20"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Set your default total seats (1–{MAX_CAPACITY}).
                      </p>
                    </div>

                    <div className="space-y-4 md:space-y-5">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-xl bg-background/70 border border-primary/20 shadow-sm">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <Label className="text-xs font-black text-foreground uppercase tracking-wider">
                            Departure Date *
                          </Label>
                        </div>
                        <DateWheelPicker
                          value={primarySchedule?.date}
                          onChange={(date) => updatePrimarySchedule({ date })}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-xl bg-background/70 border border-primary/20 shadow-sm">
                          <Clock3 className="w-3.5 h-3.5 text-primary" />
                          <Label className="text-xs font-black text-foreground uppercase tracking-wider">
                            Start Time *
                          </Label>
                        </div>
                        <TimeWheelPicker
                          value={primarySchedule?.time || DEFAULT_START_TIME}
                          onChange={(time) => updatePrimarySchedule({ time })}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground font-medium">
                      Add your primary departure slot here. You can extend multi-date support later.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Short Description + AI Suggest */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
                Short Description
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7 px-3 border-primary/40 text-primary hover:bg-primary/5"
                onClick={() => setShowAiPanel((v) => !v)}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Suggest
              </Button>
            </div>

            <Textarea
              placeholder="A brief teaser for the tour card"
              value={data.short_description || ''}
              onChange={(e) => onUpdate({ short_description: e.target.value })}
              rows={3}
              className="border-input focus:border-primary/50 focus:ring-primary/20 resize-none"
            />

            {/* AI Suggest panel */}
            <AnimatePresence>
              {showAiPanel && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-border bg-card shadow-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                      Pick a tone &amp; select a template
                    </p>
                    <button
                      onClick={() => setShowAiPanel(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tone chips */}
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTone(t.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${
                          selectedTone === t.id
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Template list */}
                  {loadingTemplates ? (
                    <div className="text-sm text-muted-foreground text-center py-4 animate-pulse">
                      Loading suggestions...
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No templates for this combination yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {templates.map((tmpl) => (
                        <motion.button
                          key={tmpl.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => applyTemplate(tmpl.text)}
                          className="w-full text-left p-3 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
                        >
                          <p className="text-xs text-muted-foreground mb-1 flex gap-2">
                            <span className="uppercase font-semibold text-primary/70">
                              {tmpl.tone}
                            </span>
                            <span>•</span>
                            <span>{tmpl.length_class}</span>
                          </p>
                          <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                            {tmpl.text}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Next button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={onNext}
            size="lg"
            className="px-8 min-w-[140px] bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/30 border-0"
            disabled={!isValid}
          >
            Next Step
          </Button>
        </div>
      </div>
    </APIProvider>
  )
}
