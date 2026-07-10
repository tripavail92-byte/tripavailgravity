import {
  Anchor,
  Bike,
  Bus,
  Car,
  Mountain,
  Pencil,
  Plane,
  Plus,
  Save,
  Ship,
  Tent,
  Trash2,
  Truck,
  Users,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RevealStage } from '@/features/wizard/RevealStage'
import type { OperatorFleetAsset } from '@/features/tour-operator/types/operatorProfile'
import { cn } from '@/lib/utils'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

function newAsset(): OperatorFleetAsset {
  return {
    id: crypto.randomUUID(),
    type: '',
    name: '',
    quantity: 1,
    capacity: null,
    details: '',
  }
}

function getVehicleIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes('bus') || t.includes('coach') || t.includes('minibus')) return Bus
  if (t.includes('car') || t.includes('sedan') || t.includes('saloon')) return Car
  if (t.includes('bike') || t.includes('motorcycle') || t.includes('cycle')) return Bike
  if (t.includes('boat') || t.includes('raft') || t.includes('kayak')) return Anchor
  if (t.includes('ship') || t.includes('ferry') || t.includes('cruise')) return Ship
  if (t.includes('heli') || t.includes('plane') || t.includes('aircraft')) return Plane
  if (t.includes('tent') || t.includes('camp')) return Tent
  if (t.includes('atv') || t.includes('quad')) return Mountain
  return Truck
}

const VEHICLE_TYPE_OPTIONS = [
  'SUV / 4×4', 'Jeep', 'Land Cruiser', 'Mini Bus', 'Coaster Bus', 'Sedan Car',
  'Van', 'Hi-Ace', 'Motorbike', 'Raft / Boat', 'Helicopter', 'Camping Gear', 'Other',
]

/** A vehicle already saved, shown as a compact card once the editor collapses. */
function FleetSummaryCard({
  asset,
  onEdit,
  onRemove,
}: {
  asset: OperatorFleetAsset
  onEdit: () => void
  onRemove: () => void
}) {
  const Icon = getVehicleIcon(asset.type || asset.name)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background p-4 shadow-sm"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold tracking-tight text-foreground">
          {asset.name?.trim() || asset.type || 'Unnamed vehicle'}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {asset.type ? (
            <span className="font-semibold uppercase tracking-widest">{asset.type}</span>
          ) : null}
          <span>×{asset.quantity}</span>
          {typeof asset.capacity === 'number' ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              {asset.capacity} seats
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
          aria-label={`Edit ${asset.name || 'vehicle'}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove ${asset.name || 'vehicle'}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </motion.article>
  )
}

/**
 * Fleet is a repeater, so it takes the progressive pattern rather than sub-steps: ask one question,
 * reveal the next once it is answered, save the vehicle, collapse to a summary card, then offer
 * "Add another". Splitting a repeater across sub-steps becomes torture on the third vehicle.
 *
 * This also stops persisting on every keystroke. Before, a half-typed vehicle was already written
 * into the operator's profile and every card sat expanded as a six-field form.
 */
export function FleetStep({ onNext, onUpdate, data }: StepProps) {
  const [assets, setAssets] = useState<OperatorFleetAsset[]>(data.fleetAssets ?? [])
  const [draft, setDraft] = useState<OperatorFleetAsset>(newAsset)
  const [isEditorOpen, setIsEditorOpen] = useState(() => (data.fleetAssets?.length ?? 0) === 0)

  const commit = (next: OperatorFleetAsset[]) => {
    setAssets(next)
    onUpdate({ fleetAssets: next })
  }

  const update = (updates: Partial<OperatorFleetAsset>) =>
    setDraft((prev) => ({ ...prev, ...updates }))

  // Each answer unlocks the next question.
  const hasType = Boolean(draft.type?.trim())
  const hasName = hasType && Boolean(draft.name?.trim())
  const hasCounts = hasName && Number(draft.quantity) > 0

  const isEditingExisting = assets.some((asset) => asset.id === draft.id)

  const saveDraft = () => {
    if (!hasName) return
    commit(
      isEditingExisting
        ? assets.map((asset) => (asset.id === draft.id ? draft : asset))
        : [...assets, draft],
    )
    setDraft(newAsset())
    setIsEditorOpen(false)
  }

  const editAsset = (id: string) => {
    const found = assets.find((asset) => asset.id === id)
    if (!found) return
    setDraft(found)
    setIsEditorOpen(true)
  }

  const removeAsset = (id: string) => {
    commit(assets.filter((asset) => asset.id !== id))
    if (draft.id === id) {
      setDraft(newAsset())
      setIsEditorOpen(assets.length <= 1)
    }
  }

  const cancelEditor = () => {
    setDraft(newAsset())
    setIsEditorOpen(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-1.5 text-2xl font-black tracking-tight text-foreground">Fleet & Vehicles</h3>
        <p className="font-medium leading-relaxed text-muted-foreground">
          What vehicles do you use for your tours? This helps travellers know what to expect.
        </p>
      </div>

      {assets.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {assets.map((asset) => (
              <FleetSummaryCard
                key={asset.id}
                asset={asset}
                onEdit={() => editAsset(asset.id)}
                onRemove={() => removeAsset(asset.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : null}

      {isEditorOpen ? (
        <div className="space-y-3">
          <RevealStage index={1} title="What kind of vehicle is it?" complete={hasType}>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_TYPE_OPTIONS.map((option) => {
                const selected = draft.type === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => update({ type: option })}
                    aria-pressed={selected}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            <Input
              value={VEHICLE_TYPE_OPTIONS.includes(draft.type) ? '' : draft.type}
              onChange={(e) => update({ type: e.target.value })}
              placeholder="Or type a custom vehicle type…"
              className="rounded-xl"
            />
          </RevealStage>

          {hasType ? (
            <RevealStage
              index={2}
              title="What is it called?"
              description="The model travellers will see."
              complete={hasName}
            >
              <Input
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Toyota Land Cruiser 200"
                className="rounded-xl"
              />
            </RevealStage>
          ) : null}

          {hasName ? (
            <RevealStage index={3} title="How many, and how many seats?" complete={hasCounts}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    How many of these
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.quantity}
                    onChange={(e) => update({ quantity: Math.max(1, Number(e.target.value) || 1) })}
                    placeholder="1"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Seats each (optional)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.capacity ?? ''}
                    onChange={(e) =>
                      update({
                        capacity: e.target.value.trim() === '' ? null : Number(e.target.value),
                      })
                    }
                    placeholder="7"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </RevealStage>
          ) : null}

          {hasCounts ? (
            <RevealStage
              index={4}
              title="Anything else worth mentioning?"
              description="Optional — features, equipment, condition."
            >
              <Textarea
                value={draft.details}
                onChange={(e) => update({ details: e.target.value })}
                placeholder="4×4, AC, roof carrier, camping equipment, first aid kit…"
                rows={3}
                className="resize-none rounded-xl"
              />

              <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {isEditingExisting
                    ? 'Updating an existing vehicle.'
                    : 'This will be added to your fleet.'}
                </p>
                <div className="flex gap-2">
                  {assets.length > 0 ? (
                    <Button type="button" variant="ghost" onClick={cancelEditor}>
                      Cancel
                    </Button>
                  ) : null}
                  <Button type="button" onClick={saveDraft} className="gap-2 font-bold">
                    <Save className="h-4 w-4" />
                    Save vehicle
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
              setDraft(newAsset())
              setIsEditorOpen(true)
            }}
            className="gap-2 rounded-2xl border-dashed"
          >
            <Plus className="h-4 w-4" />
            Add another vehicle
          </Button>
        </div>
      )}

      {/* Navigation lives in the page footer — this step only offers the escape hatch. */}
      {assets.length === 0 ? (
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
