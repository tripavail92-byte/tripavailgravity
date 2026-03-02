import { CalendarDays, MapPin, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tour } from '@/features/tour-operator/services/tourService'

interface TourItineraryStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
}

interface ItineraryDay {
  day: number
  title: string
  description: string
}

// ─── AI template generator (offline, no API call needed) ─────────────────────
function generateAIPlan(
  durationDays: number,
  destination: string,
): ItineraryDay[] {
  const dest = destination || 'the destination'

  return Array.from({ length: durationDays }, (_, i) => {
    const dayNum = i + 1
    const isFirst = dayNum === 1
    const isLast = dayNum === durationDays

    if (isFirst) {
      return {
        day: dayNum,
        title: 'Arrival Day',
        description: `Arrival at ${dest}. Transfer to hotel and check-in. Evening orientation briefing with your guide. Welcome dinner and overview of the journey ahead.`,
      }
    }
    if (isLast) {
      return {
        day: dayNum,
        title: 'Departure Day',
        description: `Enjoy a final breakfast at the hotel. Last-minute shopping or sightseeing around ${dest}. Check-out and transfer to departure point. End of tour services.`,
      }
    }

    const midDescriptions = [
      `Full-day exploration of ${dest}'s key highlights. Visit local attractions, markets, and cultural sites. Guided commentary throughout. Lunch at a local restaurant.`,
      `Excursion day to nearby areas around ${dest}. Scenic drive, nature walks, and photography stops. Return to hotel by evening.`,
      `Cultural immersion day in ${dest}. Meet local communities, explore historical sites, and enjoy authentic cuisine experiences.`,
      `Leisure and adventure day. Optional activities available — hiking, sightseeing, or city walks. Flexible schedule for personal exploration.`,
      `Guided tour of ${dest}'s must-see landmarks. Morning visits to major sites, afternoon free time, evening group activity.`,
    ]

    return {
      day: dayNum,
      title: `Day ${dayNum} — ${dest} Exploration`,
      description: midDescriptions[(dayNum - 2) % midDescriptions.length],
    }
  })
}
// ─────────────────────────────────────────────────────────────────────────────

export function TourItineraryStep({ data, onUpdate, onNext, onBack }: TourItineraryStepProps) {
  const durationDays = Math.max(1, data.duration_days ?? 1)
  const destination = (data as any).location?.city || (data as any).destination || ''
  const tourType = data.tour_type || ''

  // Build the days array; pre-fill from data.itinerary when editing an existing tour
  const buildDays = (n: number, existing?: any[]): ItineraryDay[] =>
    Array.from({ length: n }, (_, i) => {
      const saved = Array.isArray(existing) ? existing.find((d: any) => d.day === i + 1) : null
      return {
        day: i + 1,
        title: saved?.title ?? '',
        description: saved?.description ?? '',
      }
    })

  const [days, setDays] = useState<ItineraryDay[]>(() =>
    buildDays(durationDays, (data as any).itinerary),
  )
  const [suggesting, setSuggesting] = useState(false)
  const prevDuration = useRef(durationDays)

  // Resize array when operator changes duration_days in Step 1
  useEffect(() => {
    if (prevDuration.current !== durationDays) {
      prevDuration.current = durationDays
      setDays((prev) => buildDays(durationDays, prev))
    }
  }, [durationDays])

  // Sync to parent on every change
  useEffect(() => {
    onUpdate({ itinerary: days } as any)
  }, [days])

  const updateDay = (dayNum: number, field: 'title' | 'description', value: string) => {
    setDays((prev) => prev.map((d) => (d.day === dayNum ? { ...d, [field]: value } : d)))
  }

  const handleAISuggest = () => {
    setSuggesting(true)
    setTimeout(() => {
      const plan = generateAIPlan(durationDays, destination)
      setDays(plan)
      setSuggesting(false)
      toast.success('AI itinerary plan generated!')
    }, 800)
  }

  const filledDays = days.filter((d) => d.description.trim().length > 0).length

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* ── Header ── */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg flex-shrink-0">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Day-by-Day Itinerary</h2>
              <p className="text-white/80 text-sm font-medium">
                {durationDays} day{durationDays !== 1 ? 's' : ''} &middot; {filledDays}/{durationDays} filled
              </p>
            </div>
          </div>

          {/* AI Suggest button */}
          <Button
            type="button"
            size="sm"
            onClick={handleAISuggest}
            disabled={suggesting}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm font-bold gap-2 rounded-xl transition-all"
          >
            <Sparkles className={`w-4 h-4 ${suggesting ? 'animate-spin' : ''}`} />
            {suggesting ? 'Generating…' : '✨ Suggest Plan'}
          </Button>
        </div>

        {(destination || tourType) && (
          <div className="relative mt-3 flex items-center gap-1.5 text-white/70 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5" />
            {destination}
            {tourType && <span className="ml-1 opacity-60">· {tourType}</span>}
          </div>
        )}
      </div>

      {/* ── Day Cards (auto-generated from duration_days) ── */}
      <div className="space-y-4">
        {days.map((day, idx) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card rounded-2xl overflow-hidden border border-white/40"
          >
            {/* Day label bar */}
            <div className="flex items-center gap-3 px-5 py-3 bg-primary/10 border-b border-primary/20">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/30">
                <span className="text-xs font-black text-white">{day.day}</span>
              </div>
              <span className="text-sm font-black text-primary uppercase tracking-wide">
                Day {day.day}
              </span>
              {day.description.trim().length > 0 && (
                <span className="ml-auto text-[10px] font-bold text-primary/60 uppercase tracking-wider">
                  ✓ Filled
                </span>
              )}
            </div>

            <div className="p-5 space-y-3">
              {/* Title (optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Day Title{' '}
                  <span className="text-muted-foreground/50 normal-case font-medium">(optional)</span>
                </label>
                <Input
                  value={day.title}
                  onChange={(e) => updateDay(day.day, 'title', e.target.value)}
                  placeholder={`e.g. Arrival & Transfer to ${destination || 'City'}`}
                  className="bg-white/60 backdrop-blur-sm border-white/60 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Day Description
                </label>
                <Textarea
                  value={day.description}
                  onChange={(e) => updateDay(day.day, 'description', e.target.value)}
                  placeholder={`Describe what happens on Day ${day.day}… transfers, sightseeing, meals, accommodation check-in, etc.`}
                  rows={4}
                  className="bg-white/60 backdrop-blur-sm border-white/60 resize-none text-sm leading-relaxed"
                />
                <p className="text-right text-[10px] text-muted-foreground mt-1">
                  {day.description.length} chars
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Navigation Footer ── */}
      <div className="flex justify-between pt-4 border-t border-white/30">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          className="px-8 bg-white/50 border-white/60 hover:bg-white/70 backdrop-blur-sm"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="px-8 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25"
        >
          Next Step
        </Button>
      </div>
    </motion.div>
  )
}