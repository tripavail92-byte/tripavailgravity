import { cn } from '@/lib/utils'

interface UsageMeterProps {
  label: string
  used: number
  limit: number
  /** e.g. "resets 1 Aug" — rendered under the bar. */
  caption?: string | null
  unit?: string
  className?: string
}

/**
 * "Publish slots · 4 of 5 used". The bar warms from brand-rose to amber to red as the
 * operator approaches their limit, so running out is never a surprise.
 */
export function UsageMeter({ label, used, limit, caption, unit, className }: UsageMeterProps) {
  const safeLimit = Math.max(0, limit)
  const safeUsed = Math.max(0, used)
  const pct = safeLimit > 0 ? Math.min(100, Math.round((safeUsed / safeLimit) * 100)) : 0
  const exhausted = safeLimit > 0 && safeUsed >= safeLimit
  const nearlyFull = !exhausted && pct >= 80

  const barTone = exhausted
    ? 'bg-destructive'
    : nearlyFull
      ? 'bg-warning'
      : 'bg-primary'

  const valueTone = exhausted
    ? 'text-destructive'
    : nearlyFull
      ? 'text-warning'
      : 'text-foreground'

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-black tabular-nums', valueTone)}>
          {safeUsed}
          <span className="text-muted-foreground font-semibold">
            {' / '}
            {safeLimit}
            {unit ? ` ${unit}` : ''}
          </span>
        </p>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={safeUsed}
        aria-valuemin={0}
        aria-valuemax={safeLimit}
        aria-label={`${label}: ${safeUsed} of ${safeLimit} used`}
      >
        <div className={cn('h-full rounded-full transition-all duration-500', barTone)} style={{ width: `${pct}%` }} />
      </div>

      {caption ? <p className="text-[11px] text-muted-foreground">{caption}</p> : null}
    </div>
  )
}
