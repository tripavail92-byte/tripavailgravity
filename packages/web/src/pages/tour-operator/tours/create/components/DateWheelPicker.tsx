import { useMemo } from 'react'

import { WheelColumn } from './WheelColumn'

const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
] as const

const pad2 = (value: number) => String(value).padStart(2, '0')

const formatIsoDate = (year: number, month: number, day: number) =>
  `${year}-${pad2(month)}-${pad2(day)}`

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

const parseIsoDate = (dateString?: string) => {
  const fallback = new Date()

  if (!dateString) {
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth() + 1,
      day: fallback.getDate(),
    }
  }

  const [year, month, day] = dateString.split('-').map(Number)

  if (!year || !month || !day) {
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth() + 1,
      day: fallback.getDate(),
    }
  }

  return { year, month, day }
}

export interface DateWheelPickerProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function DateWheelPicker({ value, onChange, disabled }: DateWheelPickerProps) {
  const parsed = useMemo(() => parseIsoDate(value), [value])

  const yearOptions = useMemo(() => {
    const baseYear = new Date().getFullYear()
    return Array.from({ length: 13 }, (_, index) => {
      const nextYear = baseYear - 1 + index
      return { value: nextYear, label: String(nextYear) }
    })
  }, [])

  const dayOptions = useMemo(() => {
    const count = getDaysInMonth(parsed.year, parsed.month)
    return Array.from({ length: count }, (_, index) => {
      const day = index + 1
      return { value: day, label: String(day) }
    })
  }, [parsed.year, parsed.month])

  const handleMonthSelect = (month: number) => {
    const adjustedDay = Math.min(parsed.day, getDaysInMonth(parsed.year, month))
    onChange(formatIsoDate(parsed.year, month, adjustedDay))
  }

  const handleDaySelect = (day: number) => {
    onChange(formatIsoDate(parsed.year, parsed.month, day))
  }

  const handleYearSelect = (year: number) => {
    const adjustedDay = Math.min(parsed.day, getDaysInMonth(year, parsed.month))
    onChange(formatIsoDate(year, parsed.month, adjustedDay))
  }

  return (
    <div className="space-y-2 md:space-y-3">
      <div className="grid grid-cols-3 gap-2 md:gap-3 px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Month
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Day
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Year
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <WheelColumn
          options={[...MONTH_OPTIONS]}
          selectedValue={parsed.month}
          onSelect={handleMonthSelect}
          ariaLabel="Select month"
          disabled={disabled}
        />
        <WheelColumn
          options={dayOptions}
          selectedValue={parsed.day}
          onSelect={handleDaySelect}
          ariaLabel="Select day"
          disabled={disabled}
        />
        <WheelColumn
          options={yearOptions}
          selectedValue={parsed.year}
          onSelect={handleYearSelect}
          ariaLabel="Select year"
          disabled={disabled}
        />
      </div>
      <div className="px-2.5 md:px-3 py-2 rounded-xl border border-primary/25 bg-primary/10 text-xs md:text-sm font-bold text-foreground shadow-sm">
        Selected: {MONTH_OPTIONS[parsed.month - 1]?.label} {parsed.day}, {parsed.year}
      </div>
    </div>
  )
}
