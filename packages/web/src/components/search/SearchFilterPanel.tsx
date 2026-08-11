import { BASE_CURRENCY } from '@tripavail/shared/utils/money'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Slider } from '@/components/ui/slider'
import { useMoney } from '@/hooks/useMoney'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import type { SearchFacets } from '@/queries/searchQueries'

/**
 * SearchFilterPanel — the faceted filter controls for /search, rendered BOTH
 * as a sticky desktop sidebar and inside the mobile filter sheet (same
 * component, the parent decides the wrapper width). It is deliberately
 * layout-agnostic: no fixed width, no sticky, just the sections.
 *
 * IMPORTANT — every control here maps to a filter the search RPCs actually
 * honour, so nothing is a dead placeholder:
 *   • Price (min/max)  → p_min_price / p_max_price   (hotels + tours)
 *   • Rating           → p_min_rating                (hotels + tours)
 *   • Country          → p_country                   (hotels + tours)
 *   • Category         → p_category (matched against a listing's badge)
 *                        — TOURS ONLY; the hotel RPC has no category param,
 *                        so the section is hidden unless the Tours tab is
 *                        active. Options are the distinct badges present in
 *                        the tour results, which is exactly what p_category
 *                        matches, so a click always narrows correctly.
 *
 * Amenities/features are intentionally absent: there is no server-side
 * amenity filter yet, and a control that does not filter would be worse than
 * none. Add it here the moment the RPC grows an amenity param.
 */

const RATINGS = [0, 3, 4, 4.5] as const

export interface SearchFilterPanelProps {
  activeType: 'all' | 'hotel' | 'tour'
  minPrice: number | null
  maxPrice: number | null
  minRating: number | null
  country: string
  category: string
  facets?: SearchFacets
  /** Distinct tour badges → category chips. Empty for hotels. */
  categoryOptions: { label: string; count: number }[]
  activeFilterCount: number
  onSetParam: (key: string, value: string | null) => void
  /** Writes minPrice + maxPrice in a SINGLE router update (avoids the
   *  double-setParam clobber). null = clear that bound. */
  onSetPrice: (min: number | null, max: number | null) => void
  onClearAll: () => void
}

export function SearchFilterPanel({
  activeType,
  minPrice,
  maxPrice,
  minRating,
  country,
  category,
  facets,
  categoryOptions,
  activeFilterCount,
  onSetParam,
  onSetPrice,
  onClearAll,
}: SearchFilterPanelProps): JSX.Element {
  const t = useT()
  const showCategory = activeType === 'tour' && categoryOptions.length > 0
  const isTopRated = (minRating ?? 0) >= 4.5

  return (
    <div className="flex flex-col">
      {/* Header — title + clear-all, mirrors Airbnb's filter rail top. */}
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-base font-bold text-foreground">{t('search.filters')}</h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            {t('search.clearAll')}
          </button>
        )}
      </div>

      {/* Popular filters — one real quick-toggle: top rated (min 4.5). */}
      <Section title={t('search.popular')}>
        <button
          type="button"
          aria-pressed={isTopRated}
          onClick={() => onSetParam('minRating', isTopRated ? null : '4.5')}
          className={cn(
            'inline-flex w-full items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors',
            isTopRated
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border bg-background hover:bg-muted',
          )}
        >
          <span
            className={cn(
              'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
              isTopRated ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
            )}
          >
            <Star className="h-4 w-4 fill-current" />
          </span>
          {t('search.topRatedFilter')}
        </button>
      </Section>

      <Divider />

      {/* Price range — a two-thumb slider (no typing), labelled in the
          traveller's display currency (PKR in Pakistan). Only shown when the
          facet actually reports a spendable range. */}
      {facets?.priceMin != null && facets?.priceMax != null && facets.priceMax > facets.priceMin && (
        <Section title={t('search.priceRange')}>
          <PriceSlider
            minPrice={minPrice}
            maxPrice={maxPrice}
            facetMin={facets.priceMin}
            facetMax={facets.priceMax}
            onSetPrice={onSetPrice}
          />
        </Section>
      )}

      <Divider />

      {/* Minimum rating */}
      <Section title={t('search.minRating')}>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((r) => {
            const active = (minRating ?? 0) === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => onSetParam('minRating', r > 0 ? String(r) : null)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                )}
              >
                {r === 0 ? (
                  t('search.any')
                ) : (
                  <>
                    {r}
                    <Star className="h-3.5 w-3.5 fill-current" />+
                  </>
                )}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Category — tours only (real: matched against listing badge). */}
      {showCategory && (
        <>
          <Divider />
          <Section title={t('search.category')}>
            <div className="flex flex-wrap gap-2">
              <ChipButton active={!category} onClick={() => onSetParam('category', null)}>
                {t('search.allCategories')}
              </ChipButton>
              {categoryOptions.map((c) => (
                <ChipButton
                  key={c.label}
                  active={category.toLowerCase() === c.label.toLowerCase()}
                  onClick={() => onSetParam('category', c.label)}
                >
                  {c.label} <span className="opacity-60">({c.count})</span>
                </ChipButton>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Country — from facet counts, works for both surfaces. */}
      {facets && facets.countries.length > 0 && (
        <>
          <Divider />
          <Section title={t('search.country')}>
            <div className="flex flex-wrap gap-2">
              <ChipButton active={!country} onClick={() => onSetParam('country', null)}>
                {t('search.all')}
              </ChipButton>
              {facets.countries.map((c) => (
                <ChipButton
                  key={c.country}
                  active={country === c.country}
                  onClick={() => onSetParam('country', c.country)}
                >
                  {c.country} <span className="opacity-60">({c.count})</span>
                </ChipButton>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="space-y-3 py-4">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {children}
    </div>
  )
}

function Divider(): JSX.Element {
  return <div className="h-px w-full bg-border" />
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

/** A "nice" step so drags snap to round numbers (~100 stops across the range). */
function niceStep(range: number): number {
  if (range <= 0) return 1
  const raw = range / 100
  const pow = 10 ** Math.floor(Math.log10(raw))
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * pow >= raw) return m * pow
  }
  return pow * 10
}

/**
 * Two-thumb price range slider — the whole point is NO typing. Operates in the
 * search's base currency (the facet min/max are already base-normalised), and
 * labels the thumbs via useMoney so a Pakistani traveller sees ₨ while the
 * underlying filter value stays in base units. Bounds are snapped outward to a
 * round step so the ends read cleanly (e.g. 7,000 – 69,000).
 *
 * onValueChange updates the labels live during the drag; onValueCommit (fires
 * once on release) is what actually writes the URL + refetches — one query per
 * gesture, not per pixel. A thumb parked at a bound clears that filter so the
 * range never over-constrains the result set.
 */
function PriceSlider({
  minPrice,
  maxPrice,
  facetMin,
  facetMax,
  onSetPrice,
}: {
  minPrice: number | null
  maxPrice: number | null
  facetMin: number
  facetMax: number
  onSetPrice: (min: number | null, max: number | null) => void
}): JSX.Element {
  const money = useMoney()
  const step = niceStep(facetMax - facetMin)
  // Snap the ceiling up to a clean step multiple (e.g. 69,000). For the floor,
  // prefer a clean step multiple too — but if the cheapest listing is below one
  // step it would collapse to a misleading "0", so fall back to the real
  // minimum in that case (shows "PKR 500", not "PKR 0").
  const hi = Math.ceil(facetMax / step) * step
  const lo = Math.floor(facetMin / step) * step || Math.floor(facetMin)

  const clamp = (n: number): number => Math.min(hi, Math.max(lo, n))
  const [local, setLocal] = useState<[number, number]>([
    clamp(minPrice ?? lo),
    clamp(maxPrice ?? hi),
  ])
  // Re-seed from the URL whenever it changes (Clear all, back/forward, or a
  // filter that shifts the facet bounds) so the thumbs never drift.
  useEffect(() => {
    setLocal([clamp(minPrice ?? lo), clamp(maxPrice ?? hi)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice, lo, hi])

  const commit = (vals: number[]): void => {
    const [a, b] = vals
    onSetPrice(a <= lo ? null : a, b >= hi ? null : b)
  }

  return (
    <div className="space-y-3 pt-1">
      <Slider
        min={lo}
        max={hi}
        step={step}
        value={local}
        onValueChange={(v) => setLocal([v[0] ?? lo, v[1] ?? hi])}
        onValueCommit={commit}
        aria-label="Price range"
      />
      <div className="flex items-center justify-between text-sm font-semibold text-foreground">
        <span className="tabular-nums">{money(local[0], BASE_CURRENCY).text}</span>
        <span className="tabular-nums">{money(local[1], BASE_CURRENCY).text}</span>
      </div>
    </div>
  )
}
