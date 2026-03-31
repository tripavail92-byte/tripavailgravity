import {
  Award,
  ChevronUp,
  Clock,
  Globe,
  PenLine,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { OperatorGuideProfile } from '@/features/tour-operator/types/operatorProfile'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

const AVATAR_COLORS = [
  'from-violet-500/30 to-violet-900/10 border-violet-500/30',
  'from-sky-500/30 to-sky-900/10 border-sky-500/30',
  'from-emerald-500/30 to-emerald-900/10 border-emerald-500/30',
  'from-rose-500/30 to-rose-900/10 border-rose-500/30',
  'from-amber-500/30 to-amber-900/10 border-amber-500/30',
]

function newGuide(): OperatorGuideProfile {
  return {
    id: crypto.randomUUID(),
    name: '',
    languages: [],
    specialties: [],
    certifications: [],
    yearsExperience: null,
    bio: '',
  }
}

function splitCommaValues(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

// ── Guide Profile Card ────────────────────────────────────────────────────────

function GuideCard({
  guide,
  index,
  onUpdate,
  onRemove,
}: {
  guide: OperatorGuideProfile
  index: number
  onUpdate: (updates: Partial<OperatorGuideProfile>) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(!guide.name)
  const initials = guide.name
    ? guide.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : `G${index + 1}`
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-border/50 bg-card overflow-hidden"
    >
      <div className="flex items-start gap-4 p-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor} border flex items-center justify-center flex-shrink-0 shadow-sm`}
        >
          <span className="text-sm font-black text-foreground/80">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm">{guide.name || `Guide ${index + 1}`}</p>
          {guide.yearsExperience != null && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">{guide.yearsExperience} yrs experience</span>
            </div>
          )}
          {guide.languages.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {guide.languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-semibold"
                >
                  <Globe className="w-2.5 h-2.5" aria-hidden="true" />
                  {lang}
                </span>
              ))}
            </div>
          )}
          {guide.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {guide.specialties.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
                  {s}
                </span>
              ))}
            </div>
          )}
          {guide.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {guide.certifications.map((c) => (
                <span key={c} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                  <Award className="w-2.5 h-2.5" aria-hidden="true" />
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            aria-label={expanded ? 'Collapse' : 'Edit guide'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-8 h-8 rounded-lg bg-destructive/5 hover:bg-destructive/15 border border-destructive/20 flex items-center justify-center text-destructive/60 hover:text-destructive transition-all"
            aria-label="Remove guide"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3 bg-muted/20">
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</p>
                  <Input
                    value={guide.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="Ahmed Khan"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Years Experience</p>
                  <Input
                    type="number"
                    min={0}
                    value={guide.yearsExperience ?? ''}
                    onChange={(e) =>
                      onUpdate({ yearsExperience: e.target.value ? Number(e.target.value) : null })
                    }
                    placeholder="5"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Languages (comma-separated)</p>
                  <Input
                    value={guide.languages.join(', ')}
                    onChange={(e) => onUpdate({ languages: splitCommaValues(e.target.value) })}
                    placeholder="English, Urdu, Punjabi"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Specialties (comma-separated)</p>
                  <Input
                    value={guide.specialties.join(', ')}
                    onChange={(e) => onUpdate({ specialties: splitCommaValues(e.target.value) })}
                    placeholder="Hiking, Wildlife, Cultural Tours"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Certifications (comma-separated)</p>
                  <Input
                    value={guide.certifications.join(', ')}
                    onChange={(e) => onUpdate({ certifications: splitCommaValues(e.target.value) })}
                    placeholder="First Aid, Wilderness Rescue, PTDC Licensed"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bio</p>
                  <Textarea
                    rows={2}
                    value={guide.bio}
                    onChange={(e) => onUpdate({ bio: e.target.value })}
                    placeholder="A short bio about this guide's background and passion for travel…"
                    className="text-sm resize-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" /> Collapse
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Step ──────────────────────────────────────────────────────────────────────

export function GuidesStep({ onNext, onUpdate, data }: StepProps) {
  const [guides, setGuides] = useState<OperatorGuideProfile[]>(data.guideProfiles ?? [])

  function updateGuides(next: OperatorGuideProfile[]) {
    setGuides(next)
    onUpdate({ guideProfiles: next })
  }

  function addGuide() {
    updateGuides([...guides, newGuide()])
  }

  function updateGuide(id: string, updates: Partial<OperatorGuideProfile>) {
    updateGuides(guides.map((g) => (g.id === id ? { ...g, ...updates } : g)))
  }

  function removeGuide(id: string) {
    updateGuides(guides.filter((g) => g.id !== id))
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-black text-foreground mb-1.5 tracking-tight">
          Meet Your Guides
        </h3>
        <p className="text-muted-foreground leading-relaxed font-medium">
          Introduce your team. Travellers love knowing who they'll adventure with.
        </p>
      </div>

      {/* Guide list */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {guides.map((guide, i) => (
            <GuideCard
              key={guide.id}
              guide={guide}
              index={i}
              onUpdate={(updates) => updateGuide(guide.id, updates)}
              onRemove={() => removeGuide(guide.id)}
            />
          ))}
        </AnimatePresence>

        {guides.length === 0 ? (
          <button
            type="button"
            onClick={addGuide}
            className="w-full group rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/40 bg-muted/10 hover:bg-primary/5 transition-all py-10 flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted/60 group-hover:bg-primary/10 border border-border/40 group-hover:border-primary/20 flex items-center justify-center transition-all">
              <Users className="w-6 h-6 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground/60 group-hover:text-foreground transition-colors">No guides added yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tap to introduce your first guide</p>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <Plus className="w-3 h-3" aria-hidden="true" />
              Add Guide
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={addGuide}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Another Guide
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <button
          type="button"
          onClick={onNext}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
        >
          Skip for now →
        </button>
        {guides.length > 0 && (
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Save & Continue
          </button>
        )}
      </div>
    </div>
  )
}
