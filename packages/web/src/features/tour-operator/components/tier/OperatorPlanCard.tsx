import { formatMoney } from '@tripavail/shared/utils/money'
import { AlertTriangle, ArrowUpRight, RefreshCw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import type { OperatorCommercialGate } from '@/features/tour-operator/hooks/useOperatorCommercialGate'

import { TierBadge } from './TierBadge'
import { UsageMeter } from './UsageMeter'
import { formatCycleReset } from './cycle'

interface OperatorPlanCardProps {
  gate: OperatorCommercialGate
  className?: string
}

/**
 * The operator's plan at a glance, on the page they see every day. Before this card, the only
 * place a limit appeared was the commercial page — so operators discovered the publish cap by
 * being blocked at the end of the tour wizard.
 */
export function OperatorPlanCard({ gate, className }: OperatorPlanCardProps) {
  if (gate.status === 'error') {
    return (
      <GlassCard variant="card" className={`rounded-2xl p-5 ${className ?? ''}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold text-foreground">Couldn&apos;t load your plan</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your membership limits are still enforced — we just couldn&apos;t show them here.
            </p>
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={gate.refresh}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        </div>
      </GlassCard>
    )
  }

  const isLoading = gate.status === 'loading'
  const resetCaption = formatCycleReset(gate.cycleEndDate)
  const showAiMeter = gate.aiItineraryEnabled && gate.aiMonthlyCredits > 0

  return (
    <GlassCard variant="card" className={`rounded-2xl p-5 ${className ?? ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Your plan</p>
          <div className="mt-2">
            <TierBadge label={gate.tierLabel} badgeHex={gate.tier.badgeHex} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Commission</p>
          <p className="mt-1 text-2xl font-black tabular-nums leading-none text-foreground">
            {gate.commissionRate}%
          </p>
        </div>
      </div>

      <div className={`mt-5 space-y-4 ${isLoading ? 'animate-pulse opacity-60' : ''}`}>
        <UsageMeter
          label="Publish slots"
          used={gate.publishedToursThisCycle}
          limit={gate.monthlyPublishLimit}
          caption={resetCaption ? `This billing cycle · ${resetCaption}` : 'This billing cycle'}
        />

        {showAiMeter ? (
          <UsageMeter
            label="AI credits"
            used={gate.aiCreditsUsed}
            limit={gate.aiMonthlyCredits}
            caption={resetCaption ? `This billing cycle · ${resetCaption}` : 'This billing cycle'}
          />
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-xs text-muted-foreground">
          {formatMoney(gate.monthlyFee, gate.currency)}
          <span className="text-muted-foreground/70"> / month</span>
        </p>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link to="/operator/commercial">
            {gate.canPublish ? 'View plan' : 'Upgrade'}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {!gate.canPublish ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-destructive">
            You&apos;ve used every publish slot this cycle. You can keep building drafts —
            publishing unlocks {resetCaption ?? 'next cycle'} or with an upgrade.
          </p>
        </div>
      ) : null}
    </GlassCard>
  )
}
