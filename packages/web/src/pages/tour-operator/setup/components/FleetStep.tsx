import {
  Anchor,
  Bike,
  Bus,
  Car,
  ChevronUp,
  Mountain,
  PenLine,
  Plane,
  Plus,
  Ship,
  Tent,
  Trash2,
  Truck,
  Users,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { OperatorFleetAsset } from '@/features/tour-operator/types/operatorProfile'

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

// ── Fleet Asset Card ──────────────────────────────────────────────────────────

function FleetCard({
  asset,
  index,
  onUpdate,
  onRemove,
}: {
  asset: OperatorFleetAsset
  index: number
  onUpdate: (updates: Partial<OperatorFleetAsset>) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(!asset.name && !asset.type)
  const VehicleIcon = getVehicleIcon(asset.type || '')
  const displayName = asset.name || asset.type || `Vehicle ${index + 1}`
  const displayType = asset.type || 'Transport Asset'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-border/50 bg-card overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
          <VehicleIcon className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{displayType}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {(asset.capacity ?? 0) > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/60 border border-border/50">
              <Users className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
              <span className="text-[10px] font-bold text-foreground tabular-nums">{asset.capacity}</span>
            </div>
          )}
          {asset.quantity > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/60 border border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium">×</span>
              <span className="text-[10px] font-bold text-foreground tabular-nums">{asset.quantity}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            aria-label={expanded ? 'Collapse' : 'Edit'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-8 h-8 rounded-lg bg-destructive/5 hover:bg-destructive/15 border border-destructive/20 flex items-center justify-center text-destructive/60 hover:text-destructive transition-all"
            aria-label="Remove vehicle"
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
                <div className="col-span-2 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle Type</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {VEHICLE_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onUpdate({ type: opt })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                          asset.type === opt
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={asset.type}
                    onChange={(e) => onUpdate({ type: e.target.value })}
                    placeholder="Or type a custom vehicle type…"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name / Model</p>
                  <Input
                    value={asset.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="Toyota Land Cruiser 200"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quantity</p>
                    <Input
                      type="number"
                      min={1}
                      value={asset.quantity}
                      onChange={(e) => onUpdate({ quantity: Math.max(1, Number(e.target.value || 1)) })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Capacity</p>
                    <Input
                      type="number"
                      min={1}
                      value={asset.capacity ?? ''}
                      onChange={(e) =>
                        onUpdate({ capacity: e.target.value ? Math.max(1, Number(e.target.value)) : null })
                      }
                      placeholder="7"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Details & Features</p>
                  <Textarea
                    rows={2}
                    value={asset.details}
                    onChange={(e) => onUpdate({ details: e.target.value })}
                    placeholder="4×4, AC, roof carrier, camping equipment, first aid kit…"
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

export function FleetStep({ onNext, onUpdate, data }: StepProps) {
  const [assets, setAssets] = useState<OperatorFleetAsset[]>(data.fleetAssets ?? [])

  function updateAssets(next: OperatorFleetAsset[]) {
    setAssets(next)
    onUpdate({ fleetAssets: next })
  }

  function addAsset() {
    updateAssets([...assets, newAsset()])
  }

  function updateAsset(id: string, updates: Partial<OperatorFleetAsset>) {
    updateAssets(assets.map((a) => (a.id === id ? { ...a, ...updates } : a)))
  }

  function removeAsset(id: string) {
    updateAssets(assets.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-black text-foreground mb-1.5 tracking-tight">
          Fleet & Vehicles
        </h3>
        <p className="text-muted-foreground leading-relaxed font-medium">
          What vehicles do you use for your tours? This helps travellers know what to expect.
        </p>
      </div>

      {/* Asset list */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {assets.map((asset, i) => (
            <FleetCard
              key={asset.id}
              asset={asset}
              index={i}
              onUpdate={(updates) => updateAsset(asset.id, updates)}
              onRemove={() => removeAsset(asset.id)}
            />
          ))}
        </AnimatePresence>

        {/* Empty state / Add button */}
        {assets.length === 0 ? (
          <button
            type="button"
            onClick={addAsset}
            className="w-full group rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/40 bg-muted/10 hover:bg-primary/5 transition-all py-10 flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted/60 group-hover:bg-primary/10 border border-border/40 group-hover:border-primary/20 flex items-center justify-center transition-all">
              <Truck className="w-6 h-6 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground/60 group-hover:text-foreground transition-colors">No vehicles added yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tap to add your first vehicle</p>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <Plus className="w-3 h-3" aria-hidden="true" />
              Add Vehicle
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={addAsset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Another Vehicle
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
        {assets.length > 0 && (
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
