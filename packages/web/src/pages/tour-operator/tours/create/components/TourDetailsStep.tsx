import { Activity, Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Tour } from '@/features/tour-operator/services/tourService'
import { getTourIconComponent } from '@/features/tour-operator/assets/TourIconRegistry'

import { RequirementCategory, TOUR_REQUIREMENTS } from './RequirementsData'

interface TourDetailsStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
}

const LANGUAGES = [
  'Urdu',
  'English',
  'Arabic',
  'French',
  'Spanish',
]

const DIFFICULTY_LEVELS = [
  {
    id: 'easy',
    label: 'Easy',
    description: 'Relaxed pace',
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M5 16h14" />
        <path d="M9 16v-2a2 2 0 012-2h2a2 2 0 012 2v2" />
      </svg>
    ),
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: 'Active walking',
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M5 16h4l3-5 3 5h4" />
        <circle cx="12" cy="8" r="1.5" />
      </svg>
    ),
  },
  {
    id: 'difficult',
    label: 'Difficult',
    description: 'Strenuous effort',
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M4 18l4-10 4 6 4-8 4 12" />
      </svg>
    ),
  },
]

export function TourDetailsStep({ data, onUpdate, onNext, onBack }: TourDetailsStepProps) {
  const selectedRequirements = Array.isArray(data.requirements) ? data.requirements : []

  const [openCategories, setOpenCategories] = useState<Set<RequirementCategory>>(() => {
    const initial = new Set<RequirementCategory>()
    ;(Object.keys(TOUR_REQUIREMENTS) as RequirementCategory[]).forEach((category) => {
      const options = TOUR_REQUIREMENTS[category] || []
      const selectedCount = options.reduce(
        (count, option) => count + (selectedRequirements.includes(option.id) ? 1 : 0),
        0,
      )
      if (selectedCount > 0) initial.add(category)
    })
    return initial
  })

  const toggleLanguage = (lang: string) => {
    const current = data.languages || []
    const updated = current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang]
    onUpdate({ languages: updated })
  }

  const toggleRequirement = (reqId: string) => {
    const current = data.requirements || []
    const updated = current.includes(reqId)
      ? current.filter((id) => id !== reqId)
      : [...current, reqId]
    onUpdate({ requirements: updated })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-xl rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm" />
        <div className="relative flex items-center gap-5">
          <div className="w-12 h-12 bg-background/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-border/40 shadow-lg">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Requirements &amp; Logistics</h2>
            <p className="text-primary-foreground/90 text-sm font-medium">
              Define who can participate and the physical demands.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-8 bg-background border-none shadow-sm rounded-[24px] space-y-10">
        <div className="space-y-4">
          <Label className="text-xs font-bold text-foreground uppercase tracking-widest pl-1">
            Difficulty Level
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DIFFICULTY_LEVELS.map((level) => {
              const isSelected = data.difficulty_level === level.id
              return (
                <motion.button
                  key={level.id}
                  type="button"
                  animate={{ scale: isSelected ? 1.02 : 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    onUpdate({
                      difficulty_level: level.id as 'easy' | 'moderate' | 'difficult',
                    })
                  }
                  className={`relative flex items-center p-4 rounded-2xl border-2 transition-all duration-300 text-left group ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/60 bg-background hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors duration-300 [&_svg]:!w-4 [&_svg]:!h-4 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground group-hover:bg-muted'
                      }`}
                    >
                      <level.icon />
                    </div>
                    <div>
                      <h4
                        className={`font-bold text-[17px] leading-tight ${
                          isSelected ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {level.label}
                      </h4>
                      <span className="text-[13px] text-muted-foreground font-medium tracking-tight mt-0.5 block">
                        {level.description}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="selected-difficulty"
                      className="absolute -top-3 -right-3 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-[3px] border-background shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between pl-1">
            <Label className="text-xs font-bold text-foreground uppercase tracking-widest">
              Age Range
            </Label>
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-bold tracking-wide">
              {data.min_age || 0} - {data.max_age || 100} years
            </div>
          </div>
          <div className="px-2 pt-2">
            <Slider
              defaultValue={[data.min_age || 0, data.max_age || 100]}
              max={100}
              min={0}
              step={1}
              onValueChange={(vals) => {
                onUpdate({ min_age: vals[0], max_age: vals[1] })
              }}
              className="w-full [&_[role=slider]]:border-primary [&_[role=slider]]:border-2 [&_[role=slider]]:bg-background [&_.bg-primary]:bg-primary"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-bold px-1 tracking-wide">
            <span>0 yrs</span>
            <span>100 yrs</span>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <Label className="text-xs font-bold text-foreground uppercase tracking-widest pl-1">
            Languages Provided
          </Label>
          <div className="flex flex-wrap gap-2.5">
            <AnimatePresence>
              {LANGUAGES.map((lang) => {
                const isSelected = (data.languages || []).includes(lang)
                return (
                  <motion.button
                    key={lang}
                    animate={{ scale: isSelected ? 1.03 : 1 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-5 py-2 rounded-2xl text-[14px] font-bold transition-all duration-300 border ${
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground shadow-md'
                        : 'bg-background border-border text-muted-foreground hover:border-border/90 shadow-sm'
                    }`}
                  >
                    {lang}
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/60">
          <Label className="text-xs font-bold text-foreground uppercase tracking-widest pl-1 block">
            Tour-Specific Requirements
          </Label>
          <div className="space-y-3">
            {(Object.keys(TOUR_REQUIREMENTS) as RequirementCategory[]).map((category) => {
              const options = TOUR_REQUIREMENTS[category] || []
              const selectedCount = options.reduce(
                (count, option) => count + (selectedRequirements.includes(option.id) ? 1 : 0),
                0,
              )

              return (
                <details
                  key={category}
                  className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
                  open={openCategories.has(category)}
                  onToggle={(e) => {
                    const nextOpen = e.currentTarget.open
                    setOpenCategories((prev) => {
                      const next = new Set(prev)
                      if (nextOpen) next.add(category)
                      else next.delete(category)
                      return next
                    })
                  }}
                >
                  <summary className="list-none flex items-center justify-between gap-3 cursor-pointer select-none">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-[13px] font-black tracking-widest uppercase text-primary truncate">
                          {category}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {selectedCount > 0
                            ? `${selectedCount} selected`
                            : 'Tap to choose what travelers need'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedCount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-bold">
                          {selectedCount}
                        </span>
                      ) : null}
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </summary>

                  <div className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {options.map((req) => {
                        const isSelected = selectedRequirements.includes(req.id)
                        const RequirementIcon = getTourIconComponent(req.icon_key)
                        return (
                          <motion.button
                            key={req.id}
                            type="button"
                            animate={{ scale: isSelected ? 1.01 : 1 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => toggleRequirement(req.id)}
                            className={`relative flex items-center p-3 rounded-2xl border transition-all duration-300 text-left group min-h-[4.25rem] ${
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border bg-background hover:border-primary/40 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3 w-full pr-6">
                              <div
                                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 [&_svg]:!w-4 [&_svg]:!h-4 ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                }`}
                              >
                                <RequirementIcon />
                              </div>
                              <span
                                className={`font-bold text-[13px] leading-snug ${
                                  isSelected ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'
                                }`}
                              >
                                {req.label}
                              </span>
                            </div>

                            {isSelected && (
                              <motion.div
                                layoutId={`selected-req-${req.id}`}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-[2px] border-background shadow-sm"
                              >
                                <Check className="w-3 h-3" strokeWidth={3} />
                              </motion.div>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </div>

        <div className="space-y-4 pt-8 border-t border-border/60">
          <Label className="text-xs font-bold text-foreground uppercase tracking-widest pl-1 block">
            Additional Physical Requirements / Logistics
          </Label>
          <Textarea
            placeholder="e.g. Any custom requirements not covered above..."
            value={data.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={4}
            className="border-border focus:border-primary focus:ring-primary/20 resize-none rounded-2xl shadow-sm text-[15px] p-4 placeholder:text-muted-foreground"
          />
        </div>
      </Card>

      <div className="flex items-center justify-between pt-6 border-t border-border/60">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          className="px-8 bg-background/75 border-border/60 hover:bg-background"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="px-8 min-w-[140px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg border-0"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
