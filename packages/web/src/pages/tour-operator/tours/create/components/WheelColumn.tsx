import { useCallback, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

const WHEEL_ITEM_HEIGHT = 40

export interface WheelColumnOption {
  value: number
  label: string
}

export interface WheelColumnProps {
  options: WheelColumnOption[]
  selectedValue: number
  onSelect: (value: number) => void
  ariaLabel: string
  disabled?: boolean
}

export function WheelColumn({
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
