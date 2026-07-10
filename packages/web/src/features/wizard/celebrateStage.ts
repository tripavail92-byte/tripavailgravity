import { toast } from 'react-hot-toast'

/**
 * The stage-complete beat.
 *
 * Micro-steps only feel like progress if finishing one is acknowledged — a silent jump to the next
 * stage reads as "did that even save?". A toast, not confetti: this fires on every stage of every
 * tour, and an operator publishing their fourth trip should not be congratulated at.
 *
 * @param title      The stage that just closed, e.g. "Basics".
 * @param remaining  Stages still ahead. Zero renders the plain form.
 */
export function celebrateStage(title: string, remaining: number) {
  const message =
    remaining > 0
      ? `${title} complete — ${remaining} step${remaining === 1 ? '' : 's'} to go`
      : `${title} complete`

  // A stable id per stage: re-walking a finished wizard must not stack toasts.
  toast.success(message, { id: `wizard-stage-${title}`, duration: 2200 })
}
