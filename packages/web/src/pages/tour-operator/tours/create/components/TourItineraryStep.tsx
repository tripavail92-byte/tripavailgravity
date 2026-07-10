import { AnimatePresence, motion } from 'motion/react'
import {
  BedDouble,
  Bus,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
  Coffee,
  Compass,
  Hourglass,
  Landmark,
  type LucideIcon,
  MapPin,
  Mountain,
  Pencil,
  Plane,
  Plus,
  ShoppingBag,
  Sparkles,
  Utensils,
  Waves,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tour } from '@/features/tour-operator/services/tourService'
import { RevealStage } from '@/features/wizard/RevealStage'

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
const ACTIVITY_TYPES: { type: ActivityType; Icon: LucideIcon; label: string; color: string }[] = [
  { type: 'transport', Icon: Bus, label: 'Transport', color: 'bg-primary/10 text-primary border-primary/25' },
  { type: 'departure_arrival', Icon: Plane, label: 'Departure/Arrival', color: 'bg-accent text-accent-foreground border-border' },
  { type: 'meal', Icon: Utensils, label: 'Meal', color: 'bg-muted text-foreground border-border' },
  { type: 'tea_break', Icon: Coffee, label: 'Tea/Snack Break', color: 'bg-muted text-muted-foreground border-border' },
  { type: 'sightseeing', Icon: Mountain, label: 'Sightseeing', color: 'bg-primary/10 text-primary border-primary/25' },
  { type: 'guided_tour', Icon: Compass, label: 'Guided Tour', color: 'bg-accent text-accent-foreground border-border' },
  { type: 'adventure', Icon: Waves, label: 'Adventure', color: 'bg-primary/10 text-primary border-primary/25' },
  { type: 'photo_stop', Icon: Camera, label: 'Photo Stop', color: 'bg-accent text-accent-foreground border-border' },
  { type: 'shopping', Icon: ShoppingBag, label: 'Shopping', color: 'bg-muted text-muted-foreground border-border' },
  { type: 'cultural', Icon: Landmark, label: 'Cultural', color: 'bg-accent text-accent-foreground border-border' },
  { type: 'free_time', Icon: Hourglass, label: 'Free Time', color: 'bg-muted text-muted-foreground border-border' },
  { type: 'accommodation', Icon: BedDouble, label: 'Hotel/Stay', color: 'bg-primary/10 text-primary border-primary/25' },
  { type: 'custom', Icon: Pencil, label: 'Custom', color: 'bg-muted text-muted-foreground border-border' },
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
      }

  const cancelAdd = () => {
    setAddingFor(null)
    setDraft(blankDraft())
      }

  const openAdd = (dayNum: number) => {
    setAddingFor(dayNum)
    setDraft(blankDraft())
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

  // Progressive reveal inside the draft. `custom` needs its label before it counts as chosen.
  const draftHasType = Boolean(draft.type) && (draft.type !== 'custom' || Boolean(draft.custom_type_label?.trim()))
  const draftHasTitle = draftHasType && Boolean(draft.title?.trim())
  const draftHasTime = draftHasTitle && Boolean(draft.time)

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
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-background/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-border/40 shadow-lg flex-shrink-0">
              <CalendarDays className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Day-by-Day Itinerary</h2>
              <p className="text-primary-foreground/80 text-sm font-medium">
                {durationDays} day{durationDays !== 1 ? 's' : ''} &middot; {filledDays}/{durationDays} filled &middot; {totalActivities} activities
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAISuggest}
            disabled={suggesting}
            className="bg-background/20 hover:bg-background/30 text-primary-foreground border border-border/40 backdrop-blur-sm font-bold gap-2 rounded-xl transition-all"
          >
            <Sparkles className={`w-4 h-4 ${suggesting ? 'animate-spin' : ''}`} />
            {suggesting ? 'Generating…' : '✨ Suggest Plan'}
          </Button>
        </div>
        {destination && (
          <div className="relative mt-3 flex items-center gap-1.5 text-primary-foreground/70 text-xs font-medium">
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
              className="glass-card rounded-2xl overflow-hidden border border-border/60"
            >
              {/* Collapsible day header */}
              <button
                type="button"
                onClick={() => toggleDay(day.day)}
                className="w-full flex items-center gap-3 px-5 py-3.5 bg-primary/10 border-b border-primary/20 hover:bg-primary/15 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/30">
                  <span className="text-xs font-black text-primary-foreground">{day.day}</span>
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
                          className="bg-background/80 backdrop-blur-sm border-border/60 font-medium"
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
                                className="flex items-start gap-3 p-3 rounded-xl bg-background/75 border border-border/60"
                              >
                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg border flex-shrink-0 ${cfg.color}`}>
                                  <cfg.Icon className="w-4 h-4" aria-hidden="true" />
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

                          {/* One question at a time — the type unlocks the title, the title unlocks
                              the time, and the time unlocks the optional description. */}
                          <RevealStage index={1} title="What kind of activity is it?" complete={draftHasType}>
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
                                      : 'bg-background/80 border-border/60 text-muted-foreground hover:border-primary/30'
                                  }`}
                                >
                                  <t.Icon className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{t.label}</span>
                                </button>
                              ))}
                            </div>
                            {draft.type === 'custom' && (
                              <Input
                                className="mt-2 bg-background/80 border-border/60"
                                placeholder="Enter custom activity type name…"
                                value={draft.custom_type_label ?? ''}
                                onChange={(e) => setDraft((prev) => ({ ...prev, custom_type_label: e.target.value }))}
                              />
                            )}
                          </div>
                          </RevealStage>

                          {draftHasType ? (
                            <RevealStage index={2} title="What is it called?" complete={draftHasTitle}>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                              Activity Title <span className="text-destructive">*</span>
                            </label>
                            <Input
                              value={draft.title ?? ''}
                              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                              placeholder="e.g. Drive to Siran Valley, Welcome Lunch…"
                              className="bg-background/80 backdrop-blur-sm border-border/60 font-medium"
                            />
                          </div>
                            </RevealStage>
                          ) : null}

                          {draftHasTitle ? (
                            <RevealStage
                              index={3}
                              title="When does it happen?"
                              description="Travellers see this on their booking confirmation."
                              complete={draftHasTime}
                            >
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                              Time <span className="text-destructive">*</span>
                            </label>
                            <div className="p-3 rounded-xl bg-background/80 border border-border/60">
                              <TimeWheelPicker
                                value={draft.time}
                                onChange={(t) => setDraft((prev) => ({ ...prev, time: t }))}
                              />
                            </div>
                            {!draft.time ? (
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                Set a start time so travellers know when this activity happens.
                              </p>
                            ) : null}
                          </div>
                            </RevealStage>
                          ) : null}

                          {draftHasTime ? (
                            <RevealStage index={4} title="Anything travellers should know?">
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
                              className="bg-background/80 backdrop-blur-sm border-border/60 resize-none text-sm"
                            />
                          </div>
                            </RevealStage>
                          ) : null}

                          {/* Actions live OUTSIDE the reveal: an operator who has not set a time yet
                              must still be able to abandon the activity. Add stays disabled until
                              the required title and time exist. */}
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={cancelAdd}
                              className="bg-background/75 border-border/60"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => commitActivity(day.day)}
                              disabled={!draft.title?.trim() || !draft.time}
                              className="bg-primary text-primary-foreground font-bold"
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
      <div className="flex justify-between pt-4 border-t border-border/60">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          className="px-8 bg-background/75 border-border/60 hover:bg-background backdrop-blur-sm"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25"
        >
          Next Step
        </Button>
      </div>
    </motion.div>
  )
}