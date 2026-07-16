import { Check, ChevronDown, Footprints, Mountain, MountainSnow } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

import { SubStepProgress } from '@/features/wizard/SubStepProgress'
import { WizardScreen } from '@/features/wizard/WizardScreen'
import { useSubStepFlow } from '@/features/wizard/useSubStepFlow'
import { fieldId, type SubStepDef } from '@/features/wizard/types'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Tour } from '@/features/tour-operator/services/tourService'
import { getTourIconComponent } from '@/features/tour-operator/assets/TourIconRegistry'

import { RequirementCategory, TOUR_REQUIREMENTS } from './RequirementsData'

/**
 * The slider used `defaultValue`, so it displayed a range while `min_age`/`max_age` stayed
 * undefined — the operator saw "0 - 100 years" on a step the wizard considered incomplete.
 * It is now controlled, and the range is seeded on mount so what is shown is what is stored.
 */
const DEFAULT_MIN_AGE = 5
const DEFAULT_MAX_AGE = 80

interface TourDetailsStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
  /** Restored sub-step index, persisted in the tour draft's workflow snapshot. */
  subStep?: number
  onSubStepChange?: (index: number) => void
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
    icon: Footprints,
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: 'Active walking',
    icon: Mountain,
  },
  {
    id: 'difficult',
    label: 'Difficult',
    description: 'Strenuous effort',
    icon: MountainSnow,
  },
]

export function TourDetailsStep({
  data,
  onUpdate,
  onNext,
  onBack,
  subStep = 0,
  onSubStepChange,
}: TourDetailsStepProps) {
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

  useEffect(() => {
    if (typeof data.min_age === 'number' && typeof data.max_age === 'number') return
    onUpdate({
      min_age: data.min_age ?? DEFAULT_MIN_AGE,
      max_age: data.max_age ?? DEFAULT_MAX_AGE,
    })
    // Seed once; afterwards the slider owns the values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Mirrors `evaluateDetails` in stepWorkflow.ts — difficulty, an age band, at least one
  // language, and the requirements text are what count this stage as complete.
  const subSteps = useMemo<SubStepDef<Partial<Tour>>[]>(
    () => [
      {
        id: 'difficulty',
        title: 'How demanding is this tour?',
        description: 'Travellers use this to judge whether it suits them.',
        validate: (d) =>
          d.difficulty_level
            ? []
            : [{ field: fieldId('difficulty'), message: 'Choose a difficulty level' }],
      },
      {
        id: 'audience',
        title: 'Who can join?',
        description: 'The age range you accept, and the languages your guides speak.',
        validate: (d) => {
          const issues = []
          const hasAgeBand =
            typeof d.min_age === 'number' &&
            typeof d.max_age === 'number' &&
            Number(d.max_age) >= Number(d.min_age)
          if (!hasAgeBand) {
            issues.push({ field: fieldId('age'), message: 'Set an age range' })
          }
          if ((d.languages?.length ?? 0) === 0) {
            issues.push({ field: fieldId('languages'), message: 'Pick at least one language' })
          }
          return issues
        },
      },
      {
        id: 'requirements',
        title: 'What should travellers prepare for?',
        description: 'Kit, fitness, permits — anything they need to know before booking.',
        // Gate on physical_requirements — this step's field — not description, which belongs to
        // the Basics step and is a different thing entirely.
        validate: (d) =>
          (d as any).physical_requirements?.trim()
            ? []
            : [
                {
                  field: fieldId('extraRequirements'),
                  message: 'Describe the physical requirements or logistics',
                },
              ],
      },
    ],
    [],
  )

  const flow = useSubStepFlow<Partial<Tour>>({
    subSteps,
    data,
    initialIndex: subStep,
    onIndexChange: onSubStepChange,
    onExitForward: onNext,
    onExitBack: onBack,
  })

  const issueIndices = Object.entries(flow.issuesByIndex)
    .filter(([, issues]) => issues.length > 0)
    .map(([index]) => Number(index))

  const invalidFields = new Set(flow.showIssues ? flow.issues.map((issue) => issue.field) : [])
  const isInvalid = (name: string) => invalidFields.has(fieldId(name))
  const stepId = flow.current.id

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <SubStepProgress
        stageTitle="Requirements"
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
        onNext={flow.goNext}
      >
        <Card className="p-8 bg-background border-none shadow-sm rounded-[24px] space-y-10">
          {stepId === 'difficulty' ? (
            <div
              id={fieldId('difficulty')}
              tabIndex={-1}
              className="outline-none"
              aria-invalid={isInvalid('difficulty') || undefined}
            >
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
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors duration-300 [&_svg]:!w-5 [&_svg]:!h-5 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/60 text-foreground/70 group-hover:bg-muted group-hover:text-foreground'
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
            </div>
          ) : null}

          {stepId === 'audience' ? (
            <>
              <div
                id={fieldId('age')}
                tabIndex={-1}
                className="outline-none"
                aria-invalid={isInvalid('age') || undefined}
              >
        <div className="space-y-5">
          <div className="flex items-center justify-between pl-1">
            <Label className="text-xs font-bold text-foreground uppercase tracking-widest">
              Age Range
            </Label>
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-bold tracking-wide">
              {data.min_age ?? DEFAULT_MIN_AGE} - {data.max_age ?? DEFAULT_MAX_AGE} years
            </div>
          </div>
          <div className="px-2 pt-2">
            <Slider
              value={[data.min_age ?? DEFAULT_MIN_AGE, data.max_age ?? DEFAULT_MAX_AGE]}
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
              </div>
              <div
                id={fieldId('languages')}
                tabIndex={-1}
                className="outline-none"
                aria-invalid={isInvalid('languages') || undefined}
              >
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
              </div>
            </>
          ) : null}

          {stepId === 'requirements' ? (
            <>
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
              <div aria-invalid={isInvalid('extraRequirements') || undefined}>
        <div className="space-y-4 pt-8 border-t border-border/60">
          <Label className="text-xs font-bold text-foreground uppercase tracking-widest pl-1 block">
            Additional Physical Requirements / Logistics
          </Label>
          <Textarea
            id={fieldId('extraRequirements')}
            placeholder="e.g. Any custom requirements not covered above..."
            // Writes to physical_requirements, NOT description. This used to bind to
            // data.description, so it silently overwrote the tour description and surfaced on the
            // live page under "About the Journey".
            value={(data as any).physical_requirements || ''}
            onChange={(e) => onUpdate({ physical_requirements: e.target.value.slice(0, 600) } as any)}
            rows={4}
            maxLength={600}
            className="border-border focus:border-primary focus:ring-primary/20 resize-none rounded-2xl shadow-sm text-[15px] p-4 placeholder:text-muted-foreground"
          />
          <p className="text-[11px] text-muted-foreground text-right tabular-nums">
            {((data as any).physical_requirements || '').length}/600
          </p>
        </div>
              </div>
            </>
          ) : null}
        </Card>
      </WizardScreen>
    </div>
  )
}
