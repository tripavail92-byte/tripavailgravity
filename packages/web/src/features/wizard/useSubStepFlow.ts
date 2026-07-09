import { useCallback, useMemo, useState } from 'react'

import type { FieldIssue, SubStepDef } from './types'

interface UseSubStepFlowArgs<TData> {
  subSteps: SubStepDef<TData>[]
  data: TData
  /** Restored position, e.g. from the persisted workflow snapshot. */
  initialIndex?: number
  /** Called whenever the visible screen changes, so the parent can persist it. */
  onIndexChange?: (index: number) => void
  /** Called when Continue is pressed on the LAST sub-step. */
  onExitForward: () => void
  /** Called when Back is pressed on the FIRST sub-step. */
  onExitBack: () => void
}

export interface SubStepFlow<TData> {
  index: number
  total: number
  current: SubStepDef<TData>
  isFirst: boolean
  isLast: boolean

  /** Issues on the CURRENT screen. */
  issues: FieldIssue[]
  /** Only show red once the operator has tried to leave the screen (or jumped here from a summary). */
  showIssues: boolean
  /** Issues across every sub-step, keyed by sub-step index. */
  issuesByIndex: Record<number, FieldIssue[]>
  /** True when any non-optional sub-step still has issues. */
  hasOutstandingIssues: boolean

  goNext: () => void
  goBack: () => void
  goTo: (index: number, opts?: { reveal?: boolean }) => void
  /** Jump to the first sub-step with an outstanding issue and focus the offending field. */
  jumpToFirstIssue: () => boolean
  focusField: (field: string) => void
}

function focusById(field: string) {
  const attempt = () => {
    const el = document.getElementById(field)
    if (!el) return false
    // Focus first, then scroll: a smooth scroll must not race the focus call.
    if (typeof el.focus === 'function') el.focus({ preventScroll: true })
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return true
  }

  // Focus synchronously when the field is already on screen. Deferring via requestAnimationFrame
  // is unreliable — rAF is throttled to zero in background/offscreen tabs, so the focus never lands.
  if (attempt()) return

  // Otherwise the target screen is still rendering; retry on the next macrotask, then once more.
  window.setTimeout(() => {
    if (!attempt()) window.setTimeout(attempt, 50)
  }, 0)
}

/**
 * Drives one stage's sub-steps.
 *
 * Continue is never blocked — an operator can move past a screen with missing fields. The screen
 * turns its issues red, the parent stage reports "needs attention", and `jumpToFirstIssue()` (wired
 * to Submit) walks the operator straight to the first missing field.
 */
export function useSubStepFlow<TData>({
  subSteps,
  data,
  initialIndex = 0,
  onIndexChange,
  onExitForward,
  onExitBack,
}: UseSubStepFlowArgs<TData>): SubStepFlow<TData> {
  const clamp = useCallback(
    (value: number) => Math.min(Math.max(0, value), Math.max(0, subSteps.length - 1)),
    [subSteps.length],
  )

  const [index, setIndex] = useState(() => clamp(initialIndex))
  /** Sub-steps the operator has tried to leave — only those show red. */
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set())

  const issuesByIndex = useMemo(() => {
    const map: Record<number, FieldIssue[]> = {}
    subSteps.forEach((step, i) => {
      map[i] = step.validate ? step.validate(data) : []
    })
    return map
  }, [subSteps, data])

  const hasOutstandingIssues = useMemo(
    () => subSteps.some((step, i) => !step.optional && (issuesByIndex[i]?.length ?? 0) > 0),
    [subSteps, issuesByIndex],
  )

  const commitIndex = useCallback(
    (next: number) => {
      const clamped = clamp(next)
      setIndex(clamped)
      onIndexChange?.(clamped)
      // Start the new screen at the top. setTimeout, not rAF — see focusById.
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
    },
    [clamp, onIndexChange],
  )

  const goTo = useCallback(
    (next: number, opts?: { reveal?: boolean }) => {
      if (opts?.reveal) setRevealed((prev) => new Set(prev).add(clamp(next)))
      commitIndex(next)
    },
    [clamp, commitIndex],
  )

  const goNext = useCallback(() => {
    // Reveal this screen's issues before leaving, so the operator sees what they skipped.
    if ((issuesByIndex[index]?.length ?? 0) > 0) {
      setRevealed((prev) => new Set(prev).add(index))
    }

    if (index >= subSteps.length - 1) {
      onExitForward()
      return
    }
    commitIndex(index + 1)
  }, [index, issuesByIndex, subSteps.length, onExitForward, commitIndex])

  const goBack = useCallback(() => {
    if (index <= 0) {
      onExitBack()
      return
    }
    commitIndex(index - 1)
  }, [index, onExitBack, commitIndex])

  const jumpToFirstIssue = useCallback(() => {
    const target = subSteps.findIndex(
      (step, i) => !step.optional && (issuesByIndex[i]?.length ?? 0) > 0,
    )
    if (target < 0) return false

    setRevealed((prev) => new Set(prev).add(target))
    commitIndex(target)
    const firstField = issuesByIndex[target]?.[0]?.field
    if (firstField) focusById(firstField)
    return true
  }, [subSteps, issuesByIndex, commitIndex])

  return {
    index,
    total: subSteps.length,
    current: subSteps[index],
    isFirst: index === 0,
    isLast: index === subSteps.length - 1,

    issues: issuesByIndex[index] ?? [],
    showIssues: revealed.has(index),
    issuesByIndex,
    hasOutstandingIssues,

    goNext,
    goBack,
    goTo,
    jumpToFirstIssue,
    focusField: focusById,
  }
}
