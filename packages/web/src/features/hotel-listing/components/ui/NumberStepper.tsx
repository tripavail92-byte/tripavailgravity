import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Shown after the number, e.g. "m²" or "guests". */
  suffix?: string
  'aria-label'?: string
}

/**
 * A number field with real +/- controls.
 *
 * The room wizard used bare <input type="number"> for room count, guest count and size. On a phone
 * those give you a fiddly spinner (or nothing at all, depending on the browser) and a keyboard that
 * covers half the form — which is what "adding a scroller for choosing number of rooms guest etc."
 * was about.
 *
 * The text input stays editable so a large value can still be typed rather than tapped 40 times.
 */
export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
  suffix,
  'aria-label': ariaLabel,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const set = (n: number) => onChange(clamp(Number.isFinite(n) ? n : min))

  return (
    <div className="flex items-center rounded-lg border border-input bg-background">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-r-none"
        onClick={() => set(value - step)}
        disabled={value <= min}
        aria-label={ariaLabel ? `Decrease ${ariaLabel}` : 'Decrease'}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-1 px-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          aria-label={ariaLabel}
          // Committing on blur rather than on every keystroke: mid-typing values like "" or "1"
          // (on the way to "12") would otherwise be clamped to the minimum under the user's cursor.
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '')
            if (raw === '') return
            onChange(Number(raw))
          }}
          onBlur={(e) => set(parseInt(e.target.value, 10))}
          className="w-full min-w-0 border-0 bg-transparent p-0 text-center text-sm font-medium tabular-nums text-foreground focus:outline-none focus:ring-0"
        />
        {suffix && <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-l-none"
        onClick={() => set(value + step)}
        disabled={value >= max}
        aria-label={ariaLabel ? `Increase ${ariaLabel}` : 'Increase'}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
