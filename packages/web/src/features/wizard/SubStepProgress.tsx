import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SubStepProgressProps {
  /** Stage name, e.g. "Pricing & Policies". Labels the rail for screen readers only — the visible
   *  stage name already lives in the page's stage rail, and printing it twice is noise. */
  stageTitle: string
  index: number
  total: number
  /** Sub-step indices that still have missing required fields. */
  issueIndices: number[]
  onSelect: (index: number) => void
  className?: string
}

/**
 * One dot per screen: checked once passed, hollow ahead, red when that screen was left with
 * something missing — the operator can always see, and reach, what they skipped.
 *
 * Deliberately carries NO text. The stage name is already in the page's stage rail and the
 * "Step 2 of 6" count is already in WizardScreen's heading block; this component used to print
 * both again, so the same number appeared three times on one card.
 */
export function SubStepProgress({
  stageTitle,
  index,
  total,
  issueIndices,
  onSelect,
  className,
}: SubStepProgressProps) {
  if (total <= 1) return null
  const issues = new Set(issueIndices)

  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-3', className)}>
      <ol className="flex items-center gap-1.5" aria-label={`${stageTitle} steps`}>
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === index
          const isPassed = i < index
          const hasIssue = issues.has(i)

          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Go to step ${i + 1} of ${total}${hasIssue ? ' — needs attention' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  // "You are here" must always win over "this one is missing something", otherwise
                  // the operator loses track of the screen they are actually on.
                  isCurrent
                    ? 'bg-primary text-primary-foreground scale-110'
                    : hasIssue
                      ? 'bg-destructive/15 text-destructive'
                      : isPassed
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground/60',
                  hasIssue && 'ring-1 ring-destructive/50',
                )}
              >
                {isPassed && !hasIssue ? <Check className="h-3 w-3" /> : i + 1}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
