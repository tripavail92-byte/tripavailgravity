import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, ChevronDown, ChevronUp, Clock, MapPin, Plus, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tour } from '@/features/tour-operator/services/tourService'
import { TimeWheelPicker } from './TimeWheelPicker'

// ─── Types ────────────────────────────────────────────────────────────────────
type ActivityType =
  | 'transport'
  | 'departure_arrival'
  | 'meal'
  | 'tea_break'
  | 'sightseeing'
  | 'guided_tour'
  | 'adventure'
  | 'photo_stop'
  | 'shopping'
  | 'cultural'
  | 'free_time'
  | 'accommodation'
  | 'custom'

interface Activity {
  id: string
  type: ActivityType
  custom_type_label?: string
  title: string
  time?: string
  description?: string
}

interface ItineraryDay {
  day: number
  title?: string
  activities: Activity[]
}

// ─── Activity Type Config ─────────────────────────────────────────────────────
const ACTIVITY_TYPES: { type: ActivityType; emoji: string; label: string; color: string }[] = [
  { type: 'transport', emoji: '🚐', label: 'Transport', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { type: 'departure_arrival', emoji: '✈️', label: 'Departure/Arrival', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { type: 'meal', emoji: '🍽️', label: 'Meal', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { type: 'tea_break', emoji: '🍵', label: 'Tea/Snack Break', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { type: 'sightseeing', emoji: '🏞️', label: 'Sightseeing', color: 'bg-green-100 text-green-700 border-green-200' },
  { type: 'guided_tour', emoji: '🧭', label: 'Guided Tour', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { type: 'adventure', emoji: '🏄', label: 'Adventure', color: 'bg-red-100 text-red-700 border-red-200' },
  { type: 'photo_stop', emoji: '📸', label: 'Photo Stop', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { type: 'shopping', emoji: '🛍️', label: 'Shopping', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { type: 'cultural', emoji: '🎭', label: 'Cultural', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { type: 'free_time', emoji: '⏳', label: 'Free Time', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { type: 'accommodation', emoji: '🏨', label: 'Hotel/Stay', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { type: 'custom', emoji: '✏️', label: 'Custom', color: 'bg-muted text-muted-foreground border-border' },
]

const getTypeConfig = (type: ActivityType) =>
  ACTIVITY_TYPES.find((t) => t.type === type) ?? ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1]

// ─── AI template generator (offline, no API call needed) ─────────────────────
function generateAIPlan(durationDays: number, destination: string): ItineraryDay[] {
  const dest = destination || 'the destination'

  return Array.from({ length: durationDays }, (_, i) => {
    const dayNum = i + 1
    const isFirst = dayNum === 1
    const isLast = dayNum === durationDays

    if (isFirst) {
      return {
        day: dayNum,
        title: 'Arrival Day',
        activities: [
          { id: crypto.randomUUID(), type: 'departure_arrival' as ActivityType, title: `Arrival at ${dest}`, time: '10:00', description: 'Transfer from airport/station to hotel' },
          { id: crypto.randomUUID(), type: 'accommodation' as ActivityType, title: 'Hotel check-in', time: '12:00', description: 'Check-in and freshen up' },
          { id: crypto.randomUUID(), type: 'guided_tour' as ActivityType, title: 'Orientation & welcome briefing', time: '17:00', description: 'Meet your guide, overview of the journey' },
          { id: crypto.randomUUID(), type: 'meal' as ActivityType, title: 'Welcome dinner', time: '20:00', description: 'Group dinner at local restaurant' },
        ],
      }
    }

    if (isLast) {
      return {
        day: dayNum,
        title: 'Departure Day',
        activities: [
          { id: crypto.randomUUID(), type: 'meal' as ActivityType, title: 'Final breakfast', time: '08:00', description: 'Breakfast at hotel' },
          { id: crypto.randomUUID(), type: 'free_time' as ActivityType, title: 'Last-minute exploration', time: '10:00', description: 'Optional shopping or sightseeing' },
          { id: crypto.randomUUID(), type: 'accommodation' as ActivityType, title: 'Hotel check-out', time: '12:00', description: 'Luggage collection and check-out' },
          { id: crypto.randomUUID(), type: 'transport' as ActivityType, title: 'Transfer to departure point', time: '14:00', description: 'End of tour services' },
        ],
      }
    }

    const midTemplates = [
      [
        { type: 'meal' as ActivityType, title: 'Breakfast', time: '08:00', description: 'Buffet breakfast at hotel' },
        { type: 'sightseeing' as ActivityType, title: `Explore ${dest} highlights`, time: '10:00', description: 'Visit key attractions and landmarks' },
        { type: 'tea_break' as ActivityType, title: 'Tea & snack break', time: '12:30', description: 'Refreshments stop' },
        { type: 'meal' as ActivityType, title: 'Lunch', time: '13:30', description: 'Lunch at local restaurant' },
        { type: 'sightseeing' as ActivityType, title: 'Afternoon sightseeing', time: '15:00', description: 'Markets, cultural sites, local walks' },
        { type: 'meal' as ActivityType, title: 'Dinner', time: '20:00', description: 'Dinner at hotel or local restaurant' },
      ],
      [
        { type: 'meal' as ActivityType, title: 'Breakfast', time: '08:00', description: 'Breakfast at hotel' },
        { type: 'transport' as ActivityType, title: `Day excursion from ${dest}`, time: '09:00', description: 'Scenic drive to nearby area' },
        { type: 'adventure' as ActivityType, title: 'Nature & adventure activities', time: '11:00', description: 'Hiking, walks, or water activities' },
        { type: 'photo_stop' as ActivityType, title: 'Scenic photo stop', time: '13:00', description: 'Group photos at viewpoint' },
        { type: 'meal' as ActivityType, title: 'Outdoor lunch', time: '14:00', description: 'Lunch at scenic spot' },
        { type: 'free_time' as ActivityType, title: 'Free time & relaxation', time: '16:00', description: 'Unwind and explore at your own pace' },
      ],
      [
        { type: 'meal' as ActivityType, title: 'Breakfast', time: '08:00', description: 'Breakfast at hotel' },
        { type: 'cultural' as ActivityType, title: 'Cultural experience', time: '09:30', description: `Local community visit and heritage sites in ${dest}` },
        { type: 'guided_tour' as ActivityType, title: 'Guided local tour', time: '11:30', description: 'Walk through historic areas with guide' },
        { type: 'meal' as ActivityType, title: 'Traditional lunch', time: '13:30', description: 'Authentic local cuisine' },
        { type: 'shopping' as ActivityType, title: 'Local market visit', time: '15:30', description: 'Browse local crafts, souvenirs, spices' },
        { type: 'meal' as ActivityType, title: 'Dinner', time: '20:00', description: 'Restaurant dinner' },
      ],
    ]

    const template = midTemplates[(dayNum - 2) % midTemplates.length]
    return {
      day: dayNum,
      title: `Day ${dayNum} — ${dest} Exploration`,
      activities: template.map((act) => ({ ...act, id: crypto.randomUUID() })),
    }
  })
}
// ─────────────────────────────────────────────────────────────────────────────

const blankDraft = (): Partial<Activity> => ({ type: 'sightseeing', title: '', description: '', time: undefined })

interface TourItineraryStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
}

export function TourItineraryStep({ data, onUpdate, onNext, onBack }: TourItineraryStepProps) {
  const durationDays = Math.max(1, data.duration_days ?? 1)
  const destination =
    (data.destination_cities as string[] | undefined)?.[0] ||
    (data as any).location?.city ||
    ''

  const buildDays = (n: number, existing?: any[]): ItineraryDay[] =>
    Array.from({ length: n }, (_, i) => {
      const saved = Array.isArray(existing) ? existing.find((d: any) => d.day === i + 1) : null
      return {
        day: i + 1,
        title: saved?.title ?? '',
        activities: Array.isArray(saved?.activities) ? saved.activities : [],
      }
    })

  const [days, setDays] = useState<ItineraryDay[]>(() =>
    buildDays(durationDays, (data as any).itinerary),
  )
  const [expandedDays, setExpandedDays] = useState<Set<number>>(() => new Set([1]))
  const [addingFor, setAddingFor] = useState<number | null>(null)
  const [draft, setDraft] = useState<Partial<Activity>>(blankDraft())
  const [showTimePicker, setShowTimePicker] = useState(false)
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

  const toggleDay = (dayNum: number) =>
    setExpandedDays((prev) => {
      const next = new Set(prev)
      next.has(dayNum) ? next.delete(dayNum) : next.add(dayNum)
      return next
    })

  const updateDayTitle = (dayNum: number, title: string) =>
    setDays((prev) => prev.map((d) => (d.day === dayNum ? { ...d, title } : d)))

  const removeActivity = (dayNum: number, actId: string) =>
    setDays((prev) =>
      prev.map((d) =>
        d.day === dayNum ? { ...d, activities: d.activities.filter((a) => a.id !== actId) } : d,
      ),
    )

  const commitActivity = (dayNum: number) => {
    if (!draft.title?.trim() || !draft.type) return
    const newAct: Activity = {
      id: crypto.randomUUID(),
      type: draft.type as ActivityType,
      custom_type_label: draft.custom_type_label,
      title: draft.title.trim(),
      time: draft.time,
      description: draft.description?.trim() || undefined,
    }
    setDays((prev) =>
      prev.map((d) =>
        d.day === dayNum ? { ...d, activities: [...d.activities, newAct] } : d,
      ),
    )
    setAddingFor(null)
    setDraft(blankDraft())
    setShowTimePicker(false)
  }

  const cancelAdd = () => {
    setAddingFor(null)
    setDraft(blankDraft())
    setShowTimePicker(false)
  }

  const openAdd = (dayNum: number) => {
    setAddingFor(dayNum)
    setDraft(blankDraft())
    setShowTimePicker(false)
    setExpandedDays((prev) => new Set([...prev, dayNum]))
  }

  const handleAISuggest = () => {
    setSuggesting(true)
    setTimeout(() => {
      const plan = generateAIPlan(durationDays, destination)
      setDays(plan)
      setExpandedDays(new Set([1]))
      setSuggesting(false)
      toast.success('Itinerary plan generated!')
    }, 800)
  }

  const totalActivities = days.reduce((sum, d) => sum + d.activities.length, 0)
  const filledDays = days.filter((d) => d.activities.length > 0).length

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
                {durationDays} day{durationDays !== 1 ? 's' : ''} &middot; {filledDays}/{durationDays} filled &middot; {totalActivities} activities
              </p>
            </div>
          </div>
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
        {destination && (
          <div className="relative mt-3 flex items-center gap-1.5 text-white/70 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5" />
            {destination}
          </div>
        )}
      </div>

      {/* ── Day Cards ── */}
      <div className="space-y-3">
        {days.map((day) => {
          const isExpanded = expandedDays.has(day.day)
          const isAdding = addingFor === day.day

          return (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl overflow-hidden border border-white/40"
            >
              {/* Collapsible day header */}
              <button
                type="button"
                onClick={() => toggleDay(day.day)}
                className="w-full flex items-center gap-3 px-5 py-3.5 bg-primary/10 border-b border-primary/20 hover:bg-primary/15 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/30">
                  <span className="text-xs font-black text-white">{day.day}</span>
                </div>
                <span className="text-sm font-black text-primary uppercase tracking-wide flex-1">
                  Day {day.day}{day.title ? ` — ${day.title}` : ''}
                </span>
                <span className="text-xs text-primary/50 font-semibold mr-1">
                  {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-primary/60 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-primary/60 flex-shrink-0" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 space-y-4">
                      {/* Optional day title */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Day Title{' '}
                          <span className="normal-case font-normal text-muted-foreground/50">(optional)</span>
                        </label>
                        <Input
                          value={day.title ?? ''}
                          onChange={(e) => updateDayTitle(day.day, e.target.value)}
                          placeholder="e.g. Arrival Day, Siran Valley Exploration…"
                          className="bg-white/60 backdrop-blur-sm border-white/60 font-medium"
                        />
                      </div>

                      {/* Activity list */}
                      {day.activities.length > 0 && (
                        <div className="space-y-2">
                          {day.activities.map((act) => {
                            const cfg = getTypeConfig(act.type)
                            return (
                              <div
                                key={act.id}
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-white/60"
                              >
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold flex-shrink-0 ${cfg.color}`}>
                                  {cfg.emoji}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-foreground">{act.title}</span>
                                    {act.type === 'custom' && act.custom_type_label && (
                                      <span className="text-xs text-muted-foreground">({act.custom_type_label})</span>
                                    )}
                                    {act.time && (
                                      <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {act.time}
                                      </span>
                                    )}
                                  </div>
                                  {act.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{act.description}</p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeActivity(day.day, act.id)}
                                  className="text-muted-foreground/40 hover:text-destructive transition-colors flex-shrink-0 p-0.5"
                                  aria-label="Remove activity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Inline add form */}
                      {isAdding ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4"
                        >
                          <p className="text-xs font-black uppercase tracking-wider text-primary">New Activity</p>

                          {/* Type picker */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                              Activity Type
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {ACTIVITY_TYPES.map((t) => (
                                <button
                                  key={t.type}
                                  type="button"
                                  onClick={() => setDraft((prev) => ({ ...prev, type: t.type, custom_type_label: undefined }))}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                    draft.type === t.type
                                      ? t.color + ' ring-2 ring-primary/40 scale-105'
                                      : 'bg-white/60 border-white/60 text-muted-foreground hover:border-primary/30'
                                  }`}
                                >
                                  <span>{t.emoji}</span>
                                  <span>{t.label}</span>
                                </button>
                              ))}
                            </div>
                            {draft.type === 'custom' && (
                              <Input
                                className="mt-2 bg-white/60 border-white/60"
                                placeholder="Enter custom activity type name…"
                                value={draft.custom_type_label ?? ''}
                                onChange={(e) => setDraft((prev) => ({ ...prev, custom_type_label: e.target.value }))}
                              />
                            )}
                          </div>

                          {/* Title */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                              Activity Title <span className="text-destructive">*</span>
                            </label>
                            <Input
                              value={draft.title ?? ''}
                              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                              placeholder="e.g. Drive to Siran Valley, Welcome Lunch…"
                              className="bg-white/60 backdrop-blur-sm border-white/60 font-medium"
                            />
                          </div>

                          {/* Time (optional) */}
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Time
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  if (showTimePicker) {
                                    setDraft((prev) => ({ ...prev, time: undefined }))
                                  }
                                  setShowTimePicker((p) => !p)
                                }}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                {showTimePicker ? '− Remove time' : '+ Add time (optional)'}
                              </button>
                              {draft.time && !showTimePicker && (
                                <span className="text-xs font-bold text-primary">{draft.time}</span>
                              )}
                            </div>
                            {showTimePicker && (
                              <div className="p-3 rounded-xl bg-white/60 border border-white/60">
                                <TimeWheelPicker
                                  value={draft.time}
                                  onChange={(t) => setDraft((prev) => ({ ...prev, time: t }))}
                                />
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                              Description{' '}
                              <span className="normal-case font-normal text-muted-foreground/50">(optional)</span>
                            </label>
                            <Textarea
                              value={draft.description ?? ''}
                              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                              placeholder="Brief details — scenic route, what's included, highlights…"
                              rows={2}
                              className="bg-white/60 backdrop-blur-sm border-white/60 resize-none text-sm"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={cancelAdd}
                              className="bg-white/50 border-white/60"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => commitActivity(day.day)}
                              disabled={!draft.title?.trim()}
                              className="bg-primary text-white font-bold"
                            >
                              Add Activity
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAdd(day.day)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary/60 hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all text-sm font-bold"
                        >
                          <Plus className="w-4 h-4" />
                          Add Activity
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
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