import type { MembershipTierCode, MembershipTierConfig } from '@tripavail/shared/commercial/engine'
import { formatMoney } from '@tripavail/shared/utils/money'
import { AlertTriangle, Gem, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  membershipTierService,
  type TierConfigPatch,
} from '@/features/commercial/services/membershipTierService'

/**
 * Every membership-tier variable, editable by an admin. The values written here are the same
 * ones the operator wizards gate on and the operator's plan card renders — there is no second,
 * hardcoded copy to keep in sync. Changes take effect for operators on their next page load.
 */

/** A tier being edited. Numbers are held as strings so a half-typed "1" isn't coerced to 0. */
type TierDraft = {
  display_name: string
  tagline: string
  badge_hex: string
  monthly_fee: string
  commission_rate: string
  minimum_deposit_percent: string
  monthly_publish_limit: string
  ai_monthly_credits: string
  support_priority: string
  ranking_weight: string
  pickup_multi_city_enabled: boolean
  google_maps_enabled: boolean
  ai_itinerary_enabled: boolean
  perks: string[]
  is_active: boolean
  is_publicly_listed: boolean
}

function toDraft(tier: MembershipTierConfig): TierDraft {
  return {
    display_name: tier.label,
    tagline: tier.tagline ?? '',
    badge_hex: tier.badgeHex ?? '',
    monthly_fee: String(tier.monthlyFee),
    commission_rate: String(tier.commissionRate),
    minimum_deposit_percent: String(tier.minimumDepositPercent),
    monthly_publish_limit: String(tier.monthlyPublishLimit),
    ai_monthly_credits: String(tier.aiMonthlyCredits),
    support_priority: String(tier.supportPriority),
    ranking_weight: String(tier.rankingWeight),
    pickup_multi_city_enabled: tier.pickupMultiCityEnabled,
    google_maps_enabled: tier.googleMapsEnabled,
    ai_itinerary_enabled: tier.aiItineraryEnabled,
    perks: tier.perks ?? [],
    is_active: tier.isActive ?? true,
    is_publicly_listed: tier.isPubliclyListed ?? true,
  }
}

const NUMERIC_FIELDS = [
  'monthly_fee',
  'commission_rate',
  'minimum_deposit_percent',
  'monthly_publish_limit',
  'ai_monthly_credits',
  'support_priority',
  'ranking_weight',
] as const

function validate(draft: TierDraft): string | null {
  if (!draft.display_name.trim()) return 'Tier name cannot be empty.'

  for (const field of NUMERIC_FIELDS) {
    const value = Number(draft[field])
    if (!Number.isFinite(value) || value < 0) return `${field.replace(/_/g, ' ')} must be a number of 0 or more.`
  }

  if (Number(draft.commission_rate) > 100) return 'Commission rate cannot exceed 100%.'
  if (Number(draft.minimum_deposit_percent) > 100) return 'Minimum deposit cannot exceed 100%.'
  if (Number(draft.support_priority) < 1) return 'Support priority must be at least 1.'
  if (draft.badge_hex && !/^#[0-9a-fA-F]{6}$/.test(draft.badge_hex)) {
    return 'Badge colour must be a 6-digit hex value like #D4A056.'
  }
  if (draft.ai_itinerary_enabled && Number(draft.ai_monthly_credits) === 0) {
    return 'AI itinerary is enabled but the tier grants 0 credits — operators would see the tool and be unable to use it.'
  }
  return null
}

function toPatch(draft: TierDraft): TierConfigPatch {
  return {
    display_name: draft.display_name.trim(),
    tagline: draft.tagline.trim() || null,
    badge_hex: draft.badge_hex.trim() || null,
    monthly_fee: Number(draft.monthly_fee),
    commission_rate: Number(draft.commission_rate),
    minimum_deposit_percent: Number(draft.minimum_deposit_percent),
    monthly_publish_limit: Number(draft.monthly_publish_limit),
    ai_monthly_credits: Number(draft.ai_monthly_credits),
    support_priority: Number(draft.support_priority),
    ranking_weight: Number(draft.ranking_weight),
    pickup_multi_city_enabled: draft.pickup_multi_city_enabled,
    google_maps_enabled: draft.google_maps_enabled,
    ai_itinerary_enabled: draft.ai_itinerary_enabled,
    perks: draft.perks.map((p) => p.trim()).filter(Boolean),
    is_active: draft.is_active,
    is_publicly_listed: draft.is_publicly_listed,
  }
}

function NumberField({
  label,
  suffix,
  value,
  onChange,
  hint,
}: {
  label: string
  suffix?: string
  value: string
  onChange: (value: string) => void
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={suffix ? 'pr-12' : undefined}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 flex-shrink-0" />
    </div>
  )
}

function PerksEditor({ perks, onChange }: { perks: string[]; onChange: (perks: string[]) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Extra perks (shown as bullets on the operator&apos;s plan comparison)
      </Label>
      {perks.map((perk, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={perk}
            placeholder="e.g. Dedicated account manager"
            onChange={(e) => {
              const next = [...perks]
              next[index] = e.target.value
              onChange(next)
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove perk ${index + 1}`}
            onClick={() => onChange(perks.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => onChange([...perks, ''])}>
        <Plus className="h-3.5 w-3.5" />
        Add perk
      </Button>
    </div>
  )
}

function TierCard({
  tier,
  onSaved,
}: {
  tier: MembershipTierConfig
  onSaved: (tier: MembershipTierConfig) => void
}) {
  const [draft, setDraft] = useState<TierDraft>(() => toDraft(tier))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => setDraft(toDraft(tier)), [tier])

  const set = useCallback(<K extends keyof TierDraft>(key: K, value: TierDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(toDraft(tier)), [draft, tier])
  const validationError = useMemo(() => (isDirty ? validate(draft) : null), [draft, isDirty])

  const handleSave = async () => {
    const error = validate(draft)
    if (error) {
      toast.error(error)
      return
    }

    setIsSaving(true)
    try {
      const saved = await membershipTierService.updateTier(tier.code as MembershipTierCode, toPatch(draft))
      onSaved(saved)
      toast.success(`${saved.label} updated — operators see the new limits on their next load.`)
    } catch (err) {
      console.error('[AdminTierEditor] Failed to save tier', err)
      toast.error(err instanceof Error ? err.message : 'Could not save this tier.')
    } finally {
      setIsSaving(false)
    }
  }

  const accent = draft.badge_hex && /^#[0-9a-fA-F]{6}$/.test(draft.badge_hex) ? draft.badge_hex : undefined

  return (
    <Card className={`rounded-3xl ${draft.is_active ? '' : 'opacity-70'}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: accent ? `${accent}22` : undefined, color: accent }}
          >
            <Gem className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-lg">{draft.display_name || tier.code}</CardTitle>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{tier.code}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {!draft.is_active ? <Badge variant="outline">Inactive</Badge> : null}
          {draft.is_active && !draft.is_publicly_listed ? <Badge variant="outline">Unlisted</Badge> : null}
          {isDirty ? <Badge className="border-0 bg-warning/15 text-warning">Unsaved</Badge> : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tier name</Label>
            <Input value={draft.display_name} onChange={(e) => set('display_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Badge colour
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={draft.badge_hex}
                placeholder="#D4A056"
                onChange={(e) => set('badge_hex', e.target.value)}
              />
              <span
                className="h-9 w-9 flex-shrink-0 rounded-lg border border-border"
                style={{ backgroundColor: accent ?? 'transparent' }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tagline</Label>
          <Input
            value={draft.tagline}
            placeholder="One line an operator reads when comparing plans"
            onChange={(e) => set('tagline', e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            label="Monthly fee"
            suffix="PKR"
            value={draft.monthly_fee}
            onChange={(v) => set('monthly_fee', v)}
          />
          <NumberField
            label="Commission"
            suffix="%"
            value={draft.commission_rate}
            onChange={(v) => set('commission_rate', v)}
            hint="Taken from each booking."
          />
          <NumberField
            label="Minimum deposit"
            suffix="%"
            value={draft.minimum_deposit_percent}
            onChange={(v) => set('minimum_deposit_percent', v)}
            hint="Lowest deposit an operator may ask for."
          />
          <NumberField
            label="Publish limit"
            suffix="/mo"
            value={draft.monthly_publish_limit}
            onChange={(v) => set('monthly_publish_limit', v)}
            hint="Tours publishable per billing cycle."
          />
          <NumberField
            label="AI credits"
            suffix="/mo"
            value={draft.ai_monthly_credits}
            onChange={(v) => set('ai_monthly_credits', v)}
          />
          <NumberField
            label="Ranking weight"
            value={draft.ranking_weight}
            onChange={(v) => set('ranking_weight', v)}
            hint="Higher lifts this tier's tours in search."
          />
          <NumberField
            label="Support priority"
            value={draft.support_priority}
            onChange={(v) => set('support_priority', v)}
            hint="1 standard · 2 priority · 3 dedicated."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Multi-city pickups"
            description="More than one pickup point per tour."
            checked={draft.pickup_multi_city_enabled}
            onChange={(v) => set('pickup_multi_city_enabled', v)}
          />
          <ToggleRow
            label="Google Maps tools"
            description="Map search and pickup pin placement."
            checked={draft.google_maps_enabled}
            onChange={(v) => set('google_maps_enabled', v)}
          />
          <ToggleRow
            label="AI itinerary tools"
            description="AI-suggested itineraries and templates."
            checked={draft.ai_itinerary_enabled}
            onChange={(v) => set('ai_itinerary_enabled', v)}
          />
          <ToggleRow
            label="Listed publicly"
            description="Appears as an upgrade option to operators."
            checked={draft.is_publicly_listed}
            onChange={(v) => set('is_publicly_listed', v)}
          />
        </div>

        <PerksEditor perks={draft.perks} onChange={(perks) => set('perks', perks)} />

        <ToggleRow
          label="Tier is active"
          description="Turning this off hides the tier. Blocked while operators are still assigned to it."
          checked={draft.is_active}
          onChange={(v) => set('is_active', v)}
        />

        {validationError ? (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-xs text-destructive">{validationError}</p>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground">
            {formatMoney(Number(draft.monthly_fee) || 0, 'PKR')} / mo ·{' '}
            {draft.monthly_publish_limit || 0} tours · {draft.commission_rate || 0}% commission
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              disabled={!isDirty || isSaving}
              onClick={() => setDraft(toDraft(tier))}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button size="sm" className="gap-1.5" disabled={!isDirty || isSaving || Boolean(validationError)} onClick={handleSave}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminTierEditor() {
  const [tiers, setTiers] = useState<MembershipTierConfig[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setTiers(await membershipTierService.listTiers())
    } catch (err) {
      console.error('[AdminTierEditor] Failed to load tiers', err)
      setError(err instanceof Error ? err.message : 'Could not load membership tiers.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSaved = useCallback((saved: MembershipTierConfig) => {
    setTiers((prev) => prev?.map((tier) => (tier.code === saved.code ? saved : tier)) ?? null)
  }, [])

  if (error) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="flex items-center justify-between gap-4 py-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Couldn&apos;t load membership tiers</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!tiers) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading membership tiers…
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
        <p className="text-sm font-semibold text-foreground">Membership tiers</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          These values drive what every operator can do — publish limits, commission, deposits, and
          feature access — and what they see on their plan card and upgrade comparison. Publish limits
          are also enforced in the database, so saving here changes enforcement, not just the copy.
          Every edit is recorded in the tier change log.
        </p>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        {tiers.map((tier) => (
          <TierCard key={tier.code} tier={tier} onSaved={handleSaved} />
        ))}
      </div>
    </div>
  )
}
