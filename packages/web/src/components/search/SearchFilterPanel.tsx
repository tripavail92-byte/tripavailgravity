import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
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

      {/* Price range */}
      <Section title={t('search.priceRange')}>
        <PriceInputs
          minPrice={minPrice}
          maxPrice={maxPrice}
          onSetParam={onSetParam}
        />
        {facets?.priceMin != null && facets?.priceMax != null && (
          <p className="text-xs text-muted-foreground">
            {t('search.available')}: {Math.round(facets.priceMin).toLocaleString()} –{' '}
            {Math.round(facets.priceMax).toLocaleString()}
          </p>
        )}
      </Section>

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

/**
 * Controlled-with-local-buffer price inputs. Committing on blur/Enter (not per
 * keystroke) avoids a query per digit; a useEffect re-seeds the local buffer
 * whenever the URL-driven props change (e.g. "Clear all" zeroes them) so the
 * inputs never drift from the actual applied filter.
 */
function PriceInputs({
  minPrice,
  maxPrice,
  onSetParam,
}: {
  minPrice: number | null
  maxPrice: number | null
  onSetParam: (key: string, value: string | null) => void
}): JSX.Element {
  const t = useT()
  const [minL, setMinL] = useState<string>(minPrice != null ? String(minPrice) : '')
  const [maxL, setMaxL] = useState<string>(maxPrice != null ? String(maxPrice) : '')
  useEffect(() => setMinL(minPrice != null ? String(minPrice) : ''), [minPrice])
  useEffect(() => setMaxL(maxPrice != null ? String(maxPrice) : ''), [maxPrice])

  const commit = (key: 'minPrice' | 'maxPrice', v: string): void => {
    onSetParam(key, v.trim() || null)
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        inputMode="numeric"
        aria-label={t('search.min')}
        placeholder={t('search.min')}
        value={minL}
        onChange={(e) => setMinL(e.target.value)}
        onBlur={(e) => commit('minPrice', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit('minPrice', (e.target as HTMLInputElement).value)
        }}
      />
      <span className="text-muted-foreground">–</span>
      <Input
        type="number"
        inputMode="numeric"
        aria-label={t('search.max')}
        placeholder={t('search.max')}
        value={maxL}
        onChange={(e) => setMaxL(e.target.value)}
        onBlur={(e) => commit('maxPrice', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit('maxPrice', (e.target as HTMLInputElement).value)
        }}
      />
    </div>
  )
}
