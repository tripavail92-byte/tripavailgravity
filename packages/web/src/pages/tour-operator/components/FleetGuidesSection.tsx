/**
 * FleetGuidesSection — Premium enterprise-level UI for Fleet, Guides & Gallery management.
 */

import {
  Anchor,
  Award,
  Bike,
  BookOpen,
  Bus,
  Camera,
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  Image,
  Languages,
  LayoutGrid,
  Loader2,
  Mountain,
  PenLine,
  Plane,
  Plus,
  Ship,
  Star,
  Tent,
  Trash2,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type {
  OperatorFleetAsset,
  OperatorGalleryItem,
  OperatorGuideProfile,
} from '@/features/tour-operator/types/operatorProfile'

// ── Helpers ──────────────────────────────────────────────────────────────────

function splitCommaValues(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
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
  return Truck // default SUV / 4×4 / general
}

const VEHICLE_TYPE_OPTIONS = [
  'SUV / 4×4', 'Jeep', 'Land Cruiser', 'Mini Bus', 'Coaster Bus', 'Sedan Car',
  'Van', 'Hi-Ace', 'Motorbike', 'Raft / Boat', 'Helicopter', 'Camping Gear', 'Other',
]

const GALLERY_CATEGORIES: OperatorGalleryItem['category'][] = [
  'operator', 'vehicle', 'traveler', 'accommodation', 'food',
]

// ── Section Header ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ElementType
  title: string
  subtitle: string
  count: number
  onAdd: () => void
  addLabel: string
}

function SectionHeader({ icon: Icon, title, subtitle, count, onAdd, addLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground text-base">{title}</h3>
            {count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20 tabular-nums">
                {count}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-xs font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, subtitle, onAdd, addLabel }: {
  icon: React.ElementType
  title: string
  subtitle: string
  onAdd: () => void
  addLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-full group rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/40 bg-muted/10 hover:bg-primary/5 transition-all py-10 flex flex-col items-center gap-3"
    >
      <div className="w-14 h-14 rounded-2xl bg-muted/60 group-hover:bg-primary/10 border border-border/40 group-hover:border-primary/20 flex items-center justify-center transition-all">
        <Icon className="w-6 h-6 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" aria-hidden="true" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground/60 group-hover:text-foreground transition-colors">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
        <Plus className="w-3 h-3" aria-hidden="true" />
        {addLabel}
      </div>
    </button>
  )
}

// ── Fleet Asset Card ──────────────────────────────────────────────────────────

interface FleetCardProps {
  asset: OperatorFleetAsset
  index: number
  onUpdate: (updates: Partial<OperatorFleetAsset>) => void
  onRemove: () => void
}

function FleetCard({ asset, index, onUpdate, onRemove }: FleetCardProps) {
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
      {/* Card header — always visible */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
          <VehicleIcon className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{displayType}</p>
        </div>
        {/* Stats chips */}
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
            aria-label="Remove asset"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded edit fields */}
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
                {/* Type with quick-select buttons */}
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
                    placeholder="Or type custom vehicle type…"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name / Model</p>
                  <Input
                    value={asset.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="e.g. Toyota Land Cruiser 200"
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
                      onChange={(e) => onUpdate({ capacity: e.target.value ? Math.max(1, Number(e.target.value)) : null })}
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

// ── Guide Profile Card ────────────────────────────────────────────────────────

interface GuideCardProps {
  guide: OperatorGuideProfile
  index: number
  onUpdate: (updates: Partial<OperatorGuideProfile>) => void
  onRemove: () => void
}

function GuideCard({ guide, index, onUpdate, onRemove }: GuideCardProps) {
  const [expanded, setExpanded] = useState(!guide.name)
  const initials = guide.name
    ? guide.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : `G${index + 1}`

  const AVATAR_COLORS = [
    'from-violet-500/30 to-violet-900/10 border-violet-500/30',
    'from-sky-500/30 to-sky-900/10 border-sky-500/30',
    'from-emerald-500/30 to-emerald-900/10 border-emerald-500/30',
    'from-rose-500/30 to-rose-900/10 border-rose-500/30',
    'from-amber-500/30 to-amber-900/10 border-amber-500/30',
  ]
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
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor} border flex items-center justify-center flex-shrink-0 shadow-sm`}>
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
                <span key={lang} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-semibold">
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
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Star className="w-2.5 h-2.5" /> Full Name
                  </p>
                  <Input value={guide.name} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="Ahmed Khan" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Years Experience
                  </p>
                  <Input
                    type="number" min={0}
                    value={guide.yearsExperience ?? ''}
                    onChange={(e) => onUpdate({ yearsExperience: e.target.value ? Math.max(0, Number(e.target.value)) : null })}
                    placeholder="8"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Languages className="w-2.5 h-2.5" /> Languages <span className="font-normal normal-case tracking-normal">(comma-separated)</span>
                  </p>
                  <Input value={guide.languages.join(', ')} onChange={(e) => onUpdate({ languages: splitCommaValues(e.target.value) })} placeholder="Urdu, English, Balti, French" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Mountain className="w-2.5 h-2.5" /> Specialties
                  </p>
                  <Input value={guide.specialties.join(', ')} onChange={(e) => onUpdate({ specialties: splitCommaValues(e.target.value) })} placeholder="High-altitude trekking, Rock climbing" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Award className="w-2.5 h-2.5" /> Certifications
                  </p>
                  <Input value={guide.certifications.join(', ')} onChange={(e) => onUpdate({ certifications: splitCommaValues(e.target.value) })} placeholder="First Aid, PTDC, Wilderness EMT" className="h-9 text-sm" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5" /> Bio
                  </p>
                  <Textarea rows={2} value={guide.bio} onChange={(e) => onUpdate({ bio: e.target.value })} placeholder="Brief bio — terrain expertise, family support, first-aid training…" className="text-sm resize-none" />
                </div>
              </div>
              <button type="button" onClick={() => setExpanded(false)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ChevronUp className="w-3.5 h-3.5" /> Collapse
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Gallery Card ──────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<OperatorGalleryItem['category'], string> = {
  operator:      'bg-primary/10 border-primary/25 text-primary',
  vehicle:       'bg-sky-500/10 border-sky-500/25 text-sky-400',
  traveler:      'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  accommodation: 'bg-violet-500/10 border-violet-500/25 text-violet-400',
  food:          'bg-amber-500/10 border-amber-500/25 text-amber-400',
}

function GalleryCard({ item, index, onUpdate, onRemove }: {
  item: OperatorGalleryItem
  index: number
  onUpdate: (updates: Partial<OperatorGalleryItem>) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(!item.url)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border/50 bg-card overflow-hidden"
    >
      {/* Thumbnail / icon header */}
      <div className="relative">
        {item.url ? (
          <div className="h-28 overflow-hidden bg-muted/30">
            <img src={item.url} alt={item.title || 'Gallery'} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center bg-muted/20">
            <Image className="w-8 h-8 text-muted-foreground/25" aria-hidden="true" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <button type="button" onClick={() => setExpanded((v) => !v)} className="w-7 h-7 rounded-lg bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />}
          </button>
          <button type="button" onClick={onRemove} className="w-7 h-7 rounded-lg bg-destructive/20 backdrop-blur-sm border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/30 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {item.category && (
          <div className="absolute bottom-2 left-2">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${CATEGORY_COLORS[item.category]}`}>
              {item.category}
            </span>
          </div>
        )}
      </div>

      <div className="px-3 py-2">
        <p className="text-xs font-semibold text-foreground truncate">{item.title || `Media ${index + 1}`}</p>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-border/40 space-y-2.5 bg-muted/20 pt-3">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</p>
                <Input value={item.title} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Beautiful Hunza Valley" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Image URL</p>
                <Input value={item.url} onChange={(e) => onUpdate({ url: e.target.value })} placeholder="https://…" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {GALLERY_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => onUpdate({ category: cat })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border capitalize transition-all ${
                        item.category === cat
                          ? `${CATEGORY_COLORS[cat]} font-bold`
                          : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

interface FleetGuidesSectionProps {
  fleetAssets: OperatorFleetAsset[]
  guideProfiles: OperatorGuideProfile[]
  galleryMedia: OperatorGalleryItem[]
  onUpdateFleet: (index: number, updates: Partial<OperatorFleetAsset>) => void
  onAddFleet: () => void
  onRemoveFleet: (index: number) => void
  onUpdateGuide: (index: number, updates: Partial<OperatorGuideProfile>) => void
  onAddGuide: () => void
  onRemoveGuide: (index: number) => void
  onUpdateGallery: (index: number, updates: Partial<OperatorGalleryItem>) => void
  onAddGallery: () => void
  onRemoveGallery: (index: number) => void
  onSave: () => void
  isSaving: boolean
}

export function FleetGuidesSection({
  fleetAssets,
  guideProfiles,
  galleryMedia,
  onUpdateFleet,
  onAddFleet,
  onRemoveFleet,
  onUpdateGuide,
  onAddGuide,
  onRemoveGuide,
  onUpdateGallery,
  onAddGallery,
  onRemoveGallery,
  onSave,
  isSaving,
}: FleetGuidesSectionProps) {
  return (
    <div className="space-y-10">

      {/* ── Fleet Assets ── */}
      <section>
        <SectionHeader
          icon={Truck}
          title="Fleet Assets"
          subtitle="Transport & equipment travelers review before booking"
          count={fleetAssets.length}
          onAdd={onAddFleet}
          addLabel="Add vehicle"
        />
        <AnimatePresence mode="popLayout">
          {fleetAssets.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No fleet assets yet"
              subtitle="Add vehicles, 4×4s, buses, or camping gear"
              onAdd={onAddFleet}
              addLabel="Add first vehicle"
            />
          ) : (
            <div className="space-y-3">
              {fleetAssets.map((asset, i) => (
                <FleetCard
                  key={asset.id}
                  asset={asset}
                  index={i}
                  onUpdate={(u) => onUpdateFleet(i, u)}
                  onRemove={() => onRemoveFleet(i)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </section>

      <div className="border-t border-border/40" />

      {/* ── Guide Team ── */}
      <section>
        <SectionHeader
          icon={Users}
          title="Guide Team"
          subtitle="Languages, certifications & expertise that build traveler trust"
          count={guideProfiles.length}
          onAdd={onAddGuide}
          addLabel="Add guide"
        />
        <AnimatePresence mode="popLayout">
          {guideProfiles.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No guides listed yet"
              subtitle="Add guide profiles with languages, specialties & certifications"
              onAdd={onAddGuide}
              addLabel="Add first guide"
            />
          ) : (
            <div className="space-y-3">
              {guideProfiles.map((guide, i) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  index={i}
                  onUpdate={(u) => onUpdateGuide(i, u)}
                  onRemove={() => onRemoveGuide(i)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </section>

      <div className="border-t border-border/40" />

      {/* ── Gallery & Media ── */}
      <section>
        <SectionHeader
          icon={Camera}
          title="Gallery & Media"
          subtitle="Public-facing photos that strengthen trust and unlock showcase awards"
          count={galleryMedia.length}
          onAdd={onAddGallery}
          addLabel="Add photo"
        />
        <AnimatePresence mode="popLayout">
          {galleryMedia.length === 0 ? (
            <EmptyState
              icon={Image}
              title="No gallery items yet"
              subtitle="Add photos to unlock showcase awards and increase bookings"
              onAdd={onAddGallery}
              addLabel="Add first photo"
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {galleryMedia.map((item, i) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  index={i}
                  onUpdate={(u) => onUpdateGallery(i, u)}
                  onRemove={() => onRemoveGallery(i)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Save CTA ── */}
      <div className="pt-2 border-t border-border/40 flex justify-end">
        <Button onClick={onSave} disabled={isSaving} className="h-11 px-8 font-bold rounded-xl shadow-lg shadow-primary/20 gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutGrid className="w-4 h-4" />}
          Save Fleet & Guides
        </Button>
      </div>
    </div>
  )
}
