import { ArrowUpRight, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface TierLockedFeatureProps {
  /** What the operator can't do yet, e.g. "Multi-city pickup locations". */
  feature: string
  /** The plan they're on today. */
  currentTierLabel: string
  /** What upgrading gives them, e.g. "Add pickup points in more than one city". */
  description: string
  className?: string
}

/**
 * An inline, up-front explanation that a feature belongs to a higher plan — rendered where the
 * feature would be, *before* the operator tries to use it. This replaces the pattern of letting
 * them act and then firing an error toast.
 */
export function TierLockedFeature({
  feature,
  currentTierLabel,
  description,
  className,
}: TierLockedFeatureProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{feature}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {description} Not included on {currentTierLabel}.
          </p>
        </div>
      </div>
      <Link
        to="/operator/commercial"
        className="inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-xl border border-primary/30 bg-background px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10 sm:self-auto"
      >
        View plans
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
