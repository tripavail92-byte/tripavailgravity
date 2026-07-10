import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { FieldIssue } from './types'

interface WizardScreenProps {
  /** 0-based index of this screen within its stage. */
  index: number
  total: number
  title: string
  description?: string

  issues: FieldIssue[]
  /** Only true once the operator has tried to leave this screen. */
  showIssues: boolean
  onIssueClick: (field: string) => void

  onBack: () => void
  onNext: () => void
  backLabel?: string
  nextLabel?: string
  /**
   * The setup wizard already owns a page-level Back/Continue footer, and two footers is worse
   * than one. It renders the heading + error summary and drives the flow from its own buttons.
   */
  hideFooter?: boolean

  children: ReactNode
}

/**
 * One question per screen. The heading receives focus on every screen change so screen readers
 * announce where they are, and Back/Continue sit in a sticky footer — the operator never has to
 * scroll to find the way forward, which was the original complaint.
 */
export function WizardScreen({
  index,
  total,
  title,
  description,
  issues,
  showIssues,
  onIssueClick,
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel,
  hideFooter = false,
  children,
}: WizardScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // W3C multi-page forms: move focus to the new step's heading so a keyboard or screen-reader
    // user is told where they landed, instead of being left on the previous Continue button.
    headingRef.current?.focus()
  }, [index])

  const hasIssues = showIssues && issues.length > 0

  useEffect(() => {
    if (!hasIssues) return
    // GOV.UK error-summary pattern: with several errors, focus the summary. With exactly one,
    // focus the field itself — its own label + error announce it, and the summary would be noise.
    if (issues.length === 1) {
      onIssueClick(issues[0].field)
    } else {
      summaryRef.current?.focus()
    }
    // Re-run only when the set of problems changes, not on every keystroke.
  }, [hasIssues, issues.length, index]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLast = index === total - 1

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Step {index + 1} of {total}
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-black tracking-tight text-foreground outline-none"
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </header>

      {/* GOV.UK error summary: focusable container, links jump to each field. No aria-live —
          focus does the announcing, and a live region here would double-speak. */}
      {hasIssues ? (
        <div
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
          className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            There is a problem
          </p>
          <ul className="mt-2 space-y-1">
            {issues.map((issue) => (
              <li key={issue.field}>
                <button
                  type="button"
                  onClick={() => onIssueClick(issue.field)}
                  className="text-sm text-destructive underline underline-offset-2 hover:opacity-80"
                >
                  {issue.message}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-destructive/80">
            You can continue and come back — this step will stay marked as needing attention.
          </p>
        </div>
      ) : null}

      <div className="space-y-6">{children}</div>

      {hideFooter ? null : (
      <footer
        className={cn(
          'sticky bottom-0 -mx-6 flex items-center justify-between gap-3 border-t border-border/60',
          'bg-background/85 px-6 py-4 backdrop-blur-xl md:-mx-8 md:px-8',
        )}
      >
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2 px-6">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>

        <div className="flex items-center gap-3">
          {hasIssues ? (
            <span className="hidden text-xs font-semibold text-destructive sm:inline">
              Needs attention
            </span>
          ) : null}
          <Button
            size="lg"
            onClick={onNext}
            className="gap-2 border-0 bg-primary px-8 font-bold text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            {nextLabel ?? (isLast ? 'Continue' : 'Next')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
      )}
    </div>
  )
}
