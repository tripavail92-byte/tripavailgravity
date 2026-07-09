import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SubStepProgressProps {
  /** Stage name, e.g. "Pricing & Policies". */
  stageTitle: string
  index: number
  total: number
  /** Sub-step indices that still have missing required fields. */
  issueIndices: number[]
  onSelect: (index: number) => void
  className?: string
}

/**
 * "Pricing & Policies · 2 of 6" plus a dot per screen. A dot is filled once passed, hollow ahead,
 * and red when that screen was left with something missing — the operator can always see, and
 * reach, what they skipped.
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
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {stageTitle}
        <span className="mx-1.5 text-muted-foreground/50">·</span>
        <span className="text-foreground">
          {index + 1} of {total}
        </span>
      </p>

      <ol className="flex items-center gap-1.5">
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
