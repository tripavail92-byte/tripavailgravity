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
  const toggleLanguage = (lang: string) => {
    const current = data.languages || []
    const updated = current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang]
    onUpdate({ languages: updated })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <Card className="p-6 bg-gradient-to-r from-[#FF7A70] to-[#FF6B60] text-white border-none shadow-sm rounded-[24px] overflow-hidden relative">
        <div className="relative flex items-center gap-5">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-[22px] font-bold tracking-tight">Requirements &amp; Logistics</h2>
            <p className="text-white/90 text-[15px] font-medium mt-0.5">
              Define who can participate and the physical demands.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-8 bg-white border-none shadow-sm rounded-[24px] space-y-10">
        <div className="space-y-4">
          <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">
            Difficulty Level
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                  className={`relative flex items-center p-4 rounded-2xl border-2 transition-all duration-300 text-left group ${
                    isSelected
                      ? 'border-[#FF7167] bg-[#FFF8F7] shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                        isSelected
                          ? 'bg-[#FF7167] text-white'
                          : 'bg-slate-50 text-gray-600 group-hover:bg-slate-100'
                      }`}
                    >
                      <level.icon />
                    </div>
                    <div>
                      <h4
                        className={`font-bold text-[17px] leading-tight ${
                          isSelected ? 'text-[#FF7167]' : 'text-gray-900'
                        }`}
                      >
                        {level.label}
                      </h4>
                      <span className="text-[13px] text-gray-500 font-medium tracking-tight mt-0.5 block">
                        {level.description}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="selected-difficulty"
                      className="absolute -top-3 -right-3 w-7 h-7 bg-[#FF7167] text-white rounded-full flex items-center justify-center border-[3px] border-white shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-5">
            <div className="flex items-center justify-between pl-1">
              <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                Age Range
              </Label>
              <div className="px-3 py-1 bg-[#FFF0ED] text-[#FF7167] rounded-full text-[11px] font-bold tracking-wide">
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
                className="w-full [&_[role=slider]]:border-[#FF7167] [&_[role=slider]]:border-2 [&_[role=slider]]:bg-white [&_.bg-primary]:bg-[#FF7167]"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-bold px-1 tracking-wide">
              <span>0 yrs</span>
              <span>100 yrs</span>
            </div>
          </div>

          <div className="space-y-5">
            <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1 block">
              Participants Count
            </Label>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">
                  Min
                </Label>
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-[20px] p-1.5 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full hover:bg-slate-50"
                    onClick={() =>
                      onUpdate({
                        min_participants: Math.max(1, (data.min_participants || 1) - 1),
                      })
                    }
                  >
                    <Minus className="w-4 h-4 text-slate-400 hover:text-slate-900" />
                  </Button>
                  <div className="text-center font-bold text-[19px] text-gray-900 w-10">
                    {data.min_participants || 1}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full hover:bg-slate-50"
                    onClick={() => onUpdate({ min_participants: (data.min_participants || 1) + 1 })}
                  >
                    <Plus className="w-4 h-4 text-slate-400 hover:text-slate-900" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">
                  Max People
                </Label>
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-[20px] p-1.5 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full hover:bg-slate-50"
                    onClick={() =>
                      onUpdate({
                        max_participants: Math.max(1, (data.max_participants || 10) - 1),
                      })
                    }
                  >
                    <Minus className="w-4 h-4 text-slate-400 hover:text-slate-900" />
                  </Button>
                  <div className="text-center font-bold text-[19px] text-gray-900 w-10">
                    {data.max_participants || 10}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full hover:bg-slate-50"
                    onClick={() =>
                      onUpdate({ max_participants: (data.max_participants || 10) + 1 })
                    }
                  >
                    <Plus className="w-4 h-4 text-slate-400 hover:text-slate-900" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">
            Languages Provided
          </Label>
          <div className="flex flex-wrap gap-2.5">
            <AnimatePresence>
              {LANGUAGES.map((lang) => {
                const isSelected = (data.languages || []).includes(lang)
                return (
                  <motion.button
                    key={lang}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-5 py-2 rounded-2xl text-[14px] font-bold transition-all duration-300 border ${
                      isSelected
                        ? 'bg-[#FF7167] border-[#FF7167] text-white shadow-md shadow-[#FF7167]/20'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    {lang}
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <Label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1 block">
            Physical Requirements / Logistics
          </Label>
          <Textarea
            placeholder="e.g. Requires 2km of walking on uneven terrain. Please bring comfortable shoes..."
            value={data.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={4}
            className="border-gray-200 focus:border-[#FF7167] focus:ring-[#FF7167]/20 resize-none rounded-2xl shadow-sm text-[15px] p-4 placeholder:text-gray-400"
          />
        </div>
      </Card>

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
