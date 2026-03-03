import { useCallback, useEffect, useMemo, useRef } from 'react'

import { cn } from '@/lib/utils'

const WHEEL_ITEM_HEIGHT = 40

const pad2 = (value: number) => String(value).padStart(2, '0')

const formatTime24 = (hour: number, minute: number) => `${pad2(hour)}:${pad2(minute)}`

const parseTime24 = (timeString?: string) => {
  if (!timeString || !timeString.includes(':')) {
    return { hour: 9, minute: 0 }
  }

  const [hour, minute] = timeString.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return { hour: 9, minute: 0 }
  }

  return {
    hour: Math.max(0, Math.min(23, hour)),
    minute: Math.max(0, Math.min(59, minute)),
  }
}

const formatHourLabel = (hour24: number) => {
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12} ${suffix}`
}

interface WheelColumnProps {
  options: Array<{ value: number; label: string }>
  selectedValue: number
  onSelect: (value: number) => void
  ariaLabel: string
  disabled?: boolean
}

function WheelColumn({
  options,
  selectedValue,
  onSelect,
  ariaLabel,
  disabled,
}: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const snapTimeoutRef = useRef<number | null>(null)

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  )

  const snapToNearest = useCallback(() => {
    if (!scrollRef.current || disabled) return

    const rawIndex = Math.round(scrollRef.current.scrollTop / WHEEL_ITEM_HEIGHT)
    const boundedIndex = Math.max(0, Math.min(options.length - 1, rawIndex))
    const boundedOption = options[boundedIndex]

    if (!boundedOption) return

    if (boundedOption.value !== selectedValue) {
      onSelect(boundedOption.value)
    }

    scrollRef.current.scrollTo({
      top: boundedIndex * WHEEL_ITEM_HEIGHT,
      behavior: 'smooth',
    })
  }, [disabled, onSelect, options, selectedValue])

  useEffect(() => {
    if (!scrollRef.current) return

    scrollRef.current.scrollTo({
      top: selectedIndex * WHEEL_ITEM_HEIGHT,
      behavior: 'smooth',
    })
  }, [selectedIndex, options.length])

  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) {
        window.clearTimeout(snapTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className={cn(
        'relative h-40 md:h-44 rounded-xl border border-primary/20 bg-background/80 shadow-inner overflow-hidden',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 rounded-lg bg-primary/10 border border-primary/25 shadow-sm pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background via-background/85 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background via-background/85 to-transparent pointer-events-none z-10" />

      <div
        ref={scrollRef}
        role="listbox"
        aria-label={ariaLabel}
        onScroll={() => {
          if (disabled) return
          if (snapTimeoutRef.current) {
            window.clearTimeout(snapTimeoutRef.current)
          }
          snapTimeoutRef.current = window.setTimeout(snapToNearest, 80)
        }}
        className="h-full overflow-y-auto snap-y snap-mandatory py-16 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              disabled={disabled}
              className={`block w-full h-10 snap-center text-center transition-all duration-200 ${
                isSelected
                  ? 'text-primary font-bold text-base scale-[1.03]'
                  : 'text-muted-foreground text-sm hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface TimeWheelPickerProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TimeWheelPicker({ value, onChange, disabled }: TimeWheelPickerProps) {
  const parsed = useMemo(() => parseTime24(value), [value])

  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: formatHourLabel(hour) })),
    [],
  )

  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => {
        const minute = idx * 5
        return { value: minute, label: pad2(minute) }
      }),
    [],
  )

  const snappedMinute = minuteOptions.reduce((closest, option) => {
    const currentDistance = Math.abs(option.value - parsed.minute)
    const closestDistance = Math.abs(closest - parsed.minute)
    return currentDistance < closestDistance ? option.value : closest
  }, minuteOptions[0]?.value ?? 0)

  const handleHourSelect = (hour: number) => {
    onChange(formatTime24(hour, snappedMinute))
  }

  const handleMinuteSelect = (minute: number) => {
    onChange(formatTime24(parsed.hour, minute))
  }

  return (
    <div className="space-y-2 md:space-y-3">
      <div className="grid grid-cols-2 gap-2 md:gap-3 px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Hour
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Minute
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <WheelColumn
          options={hourOptions}
          selectedValue={parsed.hour}
          onSelect={handleHourSelect}
          ariaLabel="Select hour"
          disabled={disabled}
        />
        <WheelColumn
          options={minuteOptions}
          selectedValue={snappedMinute}
          onSelect={handleMinuteSelect}
          ariaLabel="Select minute"
          disabled={disabled}
        />
      </div>
      <div className="px-2.5 md:px-3 py-2 rounded-xl border border-primary/25 bg-primary/10 text-xs md:text-sm font-bold text-foreground shadow-sm">
        Selected: {formatHourLabel(parsed.hour)} : {pad2(snappedMinute)}
      </div>
    </div>
  )
}
