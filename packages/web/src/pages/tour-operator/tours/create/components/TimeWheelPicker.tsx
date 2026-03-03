import { useMemo } from 'react'

import { WheelColumn } from './WheelColumn'

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
