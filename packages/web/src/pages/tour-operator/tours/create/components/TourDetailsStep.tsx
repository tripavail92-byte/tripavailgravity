import { Activity, Check, Minus, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Tour } from '@/features/tour-operator/services/tourService'

interface TourDetailsStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
}

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Chinese',
  'Japanese',
  'Arabic',
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <path d="M4 18h16" />
        <path d="M8 18v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <path d="M4 18h4l3-5 3 5h6" />
        <circle cx="11" cy="8" r="2" />
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        <path d="M4 20h16M7 20l4-12 3 4M13 12l2-6 4 14" />
      </svg>
    ),
  },
]

export function TourDetailsStep({ data, onUpdate, onNext, onBack }: TourDetailsStepProps) {
  const toggleLanguage = (lang: string) => {
    const current = data.languages || []
    const updated = current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang]
    onUpdate({ languages: updated })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white border-none shadow-xl rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-background/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Requirements &amp; Logistics</h2>
            <p className="text-white/80 text-sm">
              Define who can participate and the physical demands.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
                Difficulty Level
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DIFFICULTY_LEVELS.map((level) => {
                  const isSelected = data.difficulty_level === level.id
                  return (
                    <motion.button
                      key={level.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        onUpdate({
                          difficulty_level: level.id as 'easy' | 'moderate' | 'difficult',
                        })
                      }
                      className={`relative flex flex-col p-4 rounded-2xl border-2 transition-all duration-300 text-left group ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                          : 'border-border bg-background hover:border-primary/30 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                          }`}
                        >
                          <level.icon />
                        </div>
                        <div>
                          <h4
                            className={`font-bold leading-none ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {level.label}
                          </h4>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {level.description}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <motion.div
                          layoutId="selected-difficulty"
                          className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Age Range
                </Label>
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold w-fit">
                  {data.min_age || 0} - {data.max_age || 100} years
                </div>
              </div>
              <div className="pt-6 pb-2 px-2">
                <Slider
                  defaultValue={[data.min_age || 0, data.max_age || 100]}
                  max={100}
                  min={0}
                  step={1}
                  onValueChange={(vals) => {
                    onUpdate({ min_age: vals[0], max_age: vals[1] })
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                <span>0 yrs</span>
                <span>100 yrs</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
                Participants Count
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-bold uppercase">
                    Min
                  </Label>
                  <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl hover:bg-background hover:shadow-sm transition-all"
                      onClick={() =>
                        onUpdate({
                          min_participants: Math.max(1, (data.min_participants || 1) - 1),
                        })
                      }
                    >
                      <Minus className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <div className="flex-1 text-center font-bold text-lg">
                      {data.min_participants || 1}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl hover:bg-background hover:shadow-sm transition-all"
                      onClick={() =>
                        onUpdate({ min_participants: (data.min_participants || 1) + 1 })
                      }
                    >
                      <Plus className="w-4 h-4 text-foreground" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider pl-1">
                    Max People
                  </Label>
                  <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl hover:bg-background hover:shadow-sm transition-all"
                      onClick={() =>
                        onUpdate({
                          max_participants: Math.max(1, (data.max_participants || 10) - 1),
                        })
                      }
                    >
                      <Minus className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <div className="flex-1 text-center font-bold text-lg">
                      {data.max_participants || 10}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl hover:bg-background hover:shadow-sm transition-all"
                      onClick={() =>
                        onUpdate({ max_participants: (data.max_participants || 10) + 1 })
                      }
                    >
                      <Plus className="w-4 h-4 text-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
                Languages Provided
              </Label>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {LANGUAGES.map((lang) => {
                    const isSelected = (data.languages || []).includes(lang)
                    return (
                      <motion.button
                        key={lang}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors duration-300 border-2 ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
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
        </div>

        <div className="glass-card rounded-2xl p-6">
          <Label className="text-sm font-bold text-foreground uppercase tracking-wide mb-4 block">
            Physical Requirements / Logistics
          </Label>
          <Textarea
            placeholder="e.g. Requires 2km of walking on uneven terrain. Please bring comfortable shoes..."
            value={data.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={4}
            className="border-input focus:border-primary/50 focus:ring-primary/20 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/30">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          className="px-8 bg-white/50 border-white/60 hover:bg-white/70"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="px-8 min-w-[140px] bg-primary hover:bg-primary/90 text-white font-bold shadow-lg border-0"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
