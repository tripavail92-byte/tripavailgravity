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
 * One dot per screen: filled once passed, hollow ahead, red when that screen was left with
 * something missing — the operator can always see, and reach, what they skipped.
 *
 * Deliberately carries no text and no digits. The stage name lives in the stage rail, and the only
 * count on the page is "Step 2 of 6" in WizardScreen's heading block. This component used to print
 * the stage name, the count, AND a number inside every dot, so one card showed the same figure
 * three times over.
 *
 * A skipped screen is therefore signalled by colour alone here, which is not enough on its own —
 * so its dot is also larger and ringed, it announces "needs attention" to screen readers, and the
 * footer says so in words when you are standing on it.
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
                  'block rounded-full transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  // "You are here" must always win over "this one is missing something", otherwise
                  // the operator loses track of the screen they are actually on.
                  isCurrent ? 'h-2.5 w-6' : hasIssue ? 'h-2.5 w-2.5' : 'h-2 w-2',
                  isCurrent
                    ? hasIssue
                      ? 'bg-destructive'
                      : 'bg-primary'
                    : hasIssue
                      ? 'bg-destructive ring-2 ring-destructive/30'
                      : isPassed
                        ? 'bg-primary/50'
                        : 'bg-muted',
                )}
              />
            </li>
          )
        })}
      </ol>
    </div>
  )
}
