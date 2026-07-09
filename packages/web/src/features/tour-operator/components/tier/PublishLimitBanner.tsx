import { AlertTriangle, ArrowUpRight, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import type { OperatorCommercialGate } from '@/features/tour-operator/hooks/useOperatorCommercialGate'

import { formatCycleReset } from './cycle'

interface PublishLimitBannerProps {
  gate: OperatorCommercialGate
  className?: string
}

/**
 * Shown at the TOP of the tour-creation wizard, before any work is invested. Silent while the
 * operator has comfortable headroom; warns at 80%; explains (without blocking) once the cycle's
 * slots are gone. Drafting is always allowed — only publishing is capped.
 */
export function PublishLimitBanner({ gate, className }: PublishLimitBannerProps) {
  if (gate.status !== 'ready' || gate.monthlyPublishLimit <= 0) return null

  const { publishedToursThisCycle: used, monthlyPublishLimit: limit } = gate
  const exhausted = used >= limit
  const nearLimit = !exhausted && used / limit >= 0.8

  if (!exhausted && !nearLimit) return null

  const resetCaption = formatCycleReset(gate.cycleEndDate)

  if (exhausted) {
    return (
      <div
        className={`flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}
        role="status"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-semibold text-destructive">
              Publish limit reached — {used} of {limit} tours this cycle
            </p>
            <p className="mt-0.5 text-sm text-destructive/90">
              You can still build and save this tour as a draft. Publishing unlocks{' '}
              {resetCaption ?? 'next billing cycle'}, or immediately on a higher plan.
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="flex-shrink-0 gap-1.5 border-destructive/40">
          <Link to="/operator/commercial">
            See plans
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" aria-hidden="true" />
        <div>
          <p className="font-semibold text-warning">
            {limit - used} publish {limit - used === 1 ? 'slot' : 'slots'} left this cycle
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            You&apos;ve published {used} of {limit} tours on {gate.tierLabel}
            {resetCaption ? ` · ${resetCaption}` : ''}.
          </p>
        </div>
      </div>
      <Button asChild size="sm" variant="ghost" className="flex-shrink-0 gap-1.5 text-warning hover:bg-warning/15">
        <Link to="/operator/commercial">
          Compare plans
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  )
}
