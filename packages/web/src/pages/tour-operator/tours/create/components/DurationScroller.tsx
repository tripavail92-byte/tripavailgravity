import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface DurationScrollerProps {
  value: number
  onChange: (days: number) => void
  min?: number
  max?: number
}

export function DurationScroller({ value, onChange, min = 1, max = 30 }: DurationScrollerProps) {
  const nights = Math.max(0, value - 1)

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      {/* Counter display */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-5xl font-black text-foreground tabular-nums">{value}</span>
          <span className="text-xl font-bold text-muted-foreground ml-2">
            {value === 1 ? 'day' : 'days'}
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-foreground">{nights} {nights === 1 ? 'night' : 'nights'}</div>
          <div className="text-xs text-muted-foreground">derived automatically</div>
        </div>
      </div>

      {/* Slider */}
      <Slider
        min={min}
        max={max}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />

      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground font-medium">{min} day</span>

        {/* Stepper buttons */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full shrink-0 border-border"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          <span className="text-sm font-black text-foreground w-6 text-center tabular-nums">
            {value}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full shrink-0 border-border"
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <span className="text-xs text-muted-foreground font-medium">{max} days</span>
      </div>
    </div>
  )
}
