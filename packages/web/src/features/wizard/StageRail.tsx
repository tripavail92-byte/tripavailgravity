import { AlertTriangle, Check } from 'lucide-react'

import { cn } from '@/lib/utils'

export type StageStatus = 'complete' | 'needs_attention' | 'in_progress' | 'not_started'

export interface StageRailItem {
  title: string
  status: StageStatus
}

interface StageRailProps {
  stages: StageRailItem[]
  currentIndex: number
  onSelect: (index: number) => void
  /** Stages the operator may jump to. Anything ahead of them is usually off-limits. */
  canSelect?: (index: number) => boolean
  className?: string
}

const STATUS_LABEL: Record<StageStatus, string> = {
  complete: 'Complete',
  needs_attention: 'Needs attention',
  in_progress: 'In progress',
  not_started: 'Not started',
}

/**
 * The stage indicator: the CURRENT stage, named once, in the middle of the page.
 *
 * It used to be a row of seven numbered circles. Between that, the sub-step dots, and the screen
 * heading, an operator filling in one field was shown three different numbers at once. Now the
 * rail carries no digits at all — the only count on the page is "Step 3 of 5" inside the card, and
 * it describes the screen in front of you rather than the wizard as a whole.
 *
 * The segments stay clickable, because collapsing the rail must not cost stage navigation. Each
 * one names its stage and status for screen readers, which is where the removed text went.
 */
export function StageRail({
  stages,
  currentIndex,
  onSelect,
  canSelect,
  className,
}: StageRailProps) {
  const current = stages[currentIndex]
  if (!current) return null

  const isAttention = current.status === 'needs_attention'
  const isComplete = current.status === 'complete'

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <ol className="flex items-center justify-center gap-1.5" aria-label="Wizard stages">
        {stages.map((stage, idx) => {
          const selectable = canSelect ? canSelect(idx) : true
          const isCurrent = idx === currentIndex

          return (
            <li key={stage.title}>
              <button
                type="button"
                disabled={!selectable}
                onClick={() => onSelect(idx)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${stage.title} — ${STATUS_LABEL[stage.status]}`}
                className={cn(
                  'block h-1.5 rounded-full transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  isCurrent ? 'w-8' : 'w-5',
                  selectable ? 'cursor-pointer' : 'cursor-default',
                  // Current wins over status, exactly as the sub-step dots do — the operator must
                  // never lose track of where they are.
                  isCurrent
                    ? stage.status === 'needs_attention'
                      ? 'bg-destructive'
                      : 'bg-primary'
                    : stage.status === 'complete'
                      ? 'bg-primary/50'
                      : stage.status === 'needs_attention'
                        ? 'bg-destructive/50'
                        : 'bg-muted',
                )}
              />
            </li>
          )
        })}
      </ol>

      <div className="flex items-center gap-1.5">
        {isAttention ? (
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
        ) : isComplete ? (
          <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        ) : null}
        <p
          className={cn(
            'text-sm font-bold uppercase tracking-widest',
            isAttention ? 'text-destructive' : 'text-primary',
          )}
        >
          {current.title}
        </p>
      </div>

      <p
        className={cn(
          'text-[10px] font-semibold uppercase tracking-widest',
          isAttention ? 'text-destructive/80' : 'text-muted-foreground',
        )}
      >
        {STATUS_LABEL[current.status]}
      </p>
    </div>
  )
}
