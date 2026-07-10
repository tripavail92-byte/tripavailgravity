import { Award, Clock, Globe, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RevealStage } from '@/features/wizard/RevealStage'
import type { OperatorGuideProfile } from '@/features/tour-operator/types/operatorProfile'
import { cn } from '@/lib/utils'

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

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

/** A guide already saved, shown as a compact card once the editor collapses. */
function GuideSummaryCard({
  guide,
  colorIndex,
  onEdit,
  onRemove,
}: {
  guide: OperatorGuideProfile
  colorIndex: number
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background p-4 shadow-sm"
    >
      <div
        className={cn(
          'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br text-sm font-black text-foreground',
          AVATAR_COLORS[colorIndex % AVATAR_COLORS.length],
        )}
      >
        {initialsOf(guide.name)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold tracking-tight text-foreground">
          {guide.name?.trim() || 'Unnamed guide'}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {typeof guide.yearsExperience === 'number' ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {guide.yearsExperience} yrs
            </span>
          ) : null}
          {guide.languages.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" aria-hidden="true" />
              {guide.languages.join(', ')}
            </span>
          ) : null}
          {guide.certifications.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Award className="h-3 w-3" aria-hidden="true" />
              {guide.certifications.length}
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEdit}
          aria-label={`Edit ${guide.name || 'guide'}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove ${guide.name || 'guide'}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </motion.article>
  )
}

/**
 * Guides is a repeater, so it uses the progressive pattern rather than sub-steps: one question at a
 * time, save the guide, collapse to a summary card, then "Add another". It also no longer persists
 * on every keystroke — a half-typed guide used to be written straight into the operator's profile.
 */
export function GuidesStep({ onNext, onUpdate, data }: StepProps) {
  const [guides, setGuides] = useState<OperatorGuideProfile[]>(data.guideProfiles ?? [])
  const [draft, setDraft] = useState<OperatorGuideProfile>(newGuide)
  const [isEditorOpen, setIsEditorOpen] = useState(() => (data.guideProfiles?.length ?? 0) === 0)

  const commit = (next: OperatorGuideProfile[]) => {
    setGuides(next)
    onUpdate({ guideProfiles: next })
  }

  const update = (updates: Partial<OperatorGuideProfile>) =>
    setDraft((prev) => ({ ...prev, ...updates }))

  const hasName = Boolean(draft.name?.trim())
  const hasLanguages = hasName && draft.languages.length > 0

  const isEditingExisting = guides.some((guide) => guide.id === draft.id)

  const saveDraft = () => {
    if (!hasName) return
    commit(
      isEditingExisting
        ? guides.map((guide) => (guide.id === draft.id ? draft : guide))
        : [...guides, draft],
    )
    setDraft(newGuide())
    setIsEditorOpen(false)
  }

  const editGuide = (id: string) => {
    const found = guides.find((guide) => guide.id === id)
    if (!found) return
    setDraft(found)
    setIsEditorOpen(true)
  }

  const removeGuide = (id: string) => {
    commit(guides.filter((guide) => guide.id !== id))
    if (draft.id === id) {
      setDraft(newGuide())
      setIsEditorOpen(guides.length <= 1)
    }
  }

  const cancelEditor = () => {
    setDraft(newGuide())
    setIsEditorOpen(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-1.5 text-2xl font-black tracking-tight text-foreground">Meet Your Guides</h3>
        <p className="font-medium leading-relaxed text-muted-foreground">
          Travellers book people, not itineraries. Introduce the guides who run your tours.
        </p>
      </div>

      {guides.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {guides.map((guide, index) => (
              <GuideSummaryCard
                key={guide.id}
                guide={guide}
                colorIndex={index}
                onEdit={() => editGuide(guide.id)}
                onRemove={() => removeGuide(guide.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : null}

      {isEditorOpen ? (
        <div className="space-y-3">
          <RevealStage index={1} title="Who is this guide?" complete={hasName}>
            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Full name
                </Label>
                <Input
                  value={draft.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Ahmed Khan"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Years guiding
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.yearsExperience ?? ''}
                  onChange={(e) =>
                    update({
                      yearsExperience: e.target.value.trim() === '' ? null : Number(e.target.value),
                    })
                  }
                  placeholder="5"
                  className="rounded-xl"
                />
              </div>
            </div>
          </RevealStage>

          {hasName ? (
            <RevealStage
              index={2}
              title="What languages do they speak?"
              description="Separate with commas. This is what travellers filter on."
              complete={hasLanguages}
            >
              <Input
                value={draft.languages.join(', ')}
                onChange={(e) => update({ languages: splitCommaValues(e.target.value) })}
                placeholder="English, Urdu, Punjabi"
                className="rounded-xl"
              />
            </RevealStage>
          ) : null}

          {hasLanguages ? (
            <RevealStage
              index={3}
              title="What are they known for?"
              description="Optional — specialities, certifications, and a short bio."
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Specialities
                  </Label>
                  <Input
                    value={draft.specialties.join(', ')}
                    onChange={(e) => update({ specialties: splitCommaValues(e.target.value) })}
                    placeholder="Hiking, Wildlife, Cultural Tours"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Certifications
                  </Label>
                  <Input
                    value={draft.certifications.join(', ')}
                    onChange={(e) => update({ certifications: splitCommaValues(e.target.value) })}
                    placeholder="First Aid, Wilderness Rescue, PTDC Licensed"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Short bio
                  </Label>
                  <Textarea
                    value={draft.bio}
                    onChange={(e) => update({ bio: e.target.value })}
                    placeholder="A short bio about this guide's background and passion for travel…"
                    rows={3}
                    className="resize-none rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {isEditingExisting ? 'Updating an existing guide.' : 'This guide will be added to your team.'}
                </p>
                <div className="flex gap-2">
                  {guides.length > 0 ? (
                    <Button type="button" variant="ghost" onClick={cancelEditor}>
                      Cancel
                    </Button>
                  ) : null}
                  <Button type="button" onClick={saveDraft} className="gap-2 font-bold">
                    <Save className="h-4 w-4" />
                    Save guide
                  </Button>
                </div>
              </div>
            </RevealStage>
          ) : null}
        </div>
      ) : (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(newGuide())
              setIsEditorOpen(true)
            }}
            className="gap-2 rounded-2xl border-dashed"
          >
            <Plus className="h-4 w-4" />
            Add another guide
          </Button>
        </div>
      )}

      {/* Navigation lives in the page footer — this step only offers the escape hatch. */}
      {guides.length === 0 ? (
        <div className="flex justify-end border-t border-border/30 pt-4">
          <button
            type="button"
            onClick={onNext}
            className="text-sm text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Skip for now →
          </button>
        </div>
      ) : null}
    </div>
  )
}
