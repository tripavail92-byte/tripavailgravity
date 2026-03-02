import { Calendar, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tour } from '@/features/tour-operator/services/tourService'

interface TourSchedulingStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
}

const WHEEL_ITEM_HEIGHT = 40
const MAX_SCHEDULE_CAPACITY = 300

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
]

const pad = (value: number) => String(value).padStart(2, '0')

const formatIsoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

const getTodayIsoDate = () => {
  const now = new Date()
  return formatIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

const formatTime24 = (hour: number, minute: number) => `${pad(hour)}:${pad(minute)}`

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

interface WheelColumnProps {
  options: Array<{ value: number; label: string }>
  selectedValue: number
  onSelect: (value: number) => void
  ariaLabel: string
}

function WheelColumn({ options, selectedValue, onSelect, ariaLabel }: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const snapTimeoutRef = useRef<number | null>(null)

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  )

  const snapToNearest = useCallback(() => {
    if (!scrollRef.current) return

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
  }, [onSelect, options, selectedValue])

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
    <div className="relative h-44 rounded-xl border border-primary/20 bg-background/80 shadow-inner overflow-hidden">
      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 rounded-lg bg-primary/10 border border-primary/25 shadow-sm pointer-events-none" />

      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background via-background/85 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background via-background/85 to-transparent pointer-events-none z-10" />

      <div
        ref={scrollRef}
        role="listbox"
        aria-label={ariaLabel}
        onScroll={() => {
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
              className={`w-full h-10 snap-center text-center transition-all duration-200 ${
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

interface DateWheelPickerProps {
  value?: string
  onChange: (value: string) => void
}

function DateWheelPicker({ value, onChange }: DateWheelPickerProps) {
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
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 px-1">
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
      <div className="grid grid-cols-3 gap-3">
        <WheelColumn
          options={MONTH_OPTIONS}
          selectedValue={parsed.month}
          onSelect={handleMonthSelect}
          ariaLabel="Select month"
        />
        <WheelColumn
          options={dayOptions}
          selectedValue={parsed.day}
          onSelect={handleDaySelect}
          ariaLabel="Select day"
        />
        <WheelColumn
          options={yearOptions}
          selectedValue={parsed.year}
          onSelect={handleYearSelect}
          ariaLabel="Select year"
        />
      </div>
      <div className="px-3 py-2 rounded-xl border border-primary/25 bg-primary/10 text-sm font-bold text-foreground shadow-sm">
        Selected: {MONTH_OPTIONS[parsed.month - 1]?.label} {parsed.day}, {parsed.year}
      </div>
    </div>
  )
}

interface TimeWheelPickerProps {
  value?: string
  onChange: (value: string) => void
}

function TimeWheelPicker({ value, onChange }: TimeWheelPickerProps) {
  const parsed = useMemo(() => parseTime24(value), [value])

  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: formatHourLabel(hour) })),
    [],
  )

  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => {
        const minute = idx * 5
        return { value: minute, label: pad(minute) }
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
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Hour
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
          Minute
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <WheelColumn
          options={hourOptions}
          selectedValue={parsed.hour}
          onSelect={handleHourSelect}
          ariaLabel="Select hour"
        />
        <WheelColumn
          options={minuteOptions}
          selectedValue={snappedMinute}
          onSelect={handleMinuteSelect}
          ariaLabel="Select minute"
        />
      </div>
      <div className="px-3 py-2 rounded-xl border border-primary/25 bg-primary/10 text-sm font-bold text-foreground shadow-sm">
        Selected: {formatHourLabel(parsed.hour)} : {pad(snappedMinute)}
      </div>
    </div>
  )
}

interface CapacityWheelPickerProps {
  value: number
  maxValue?: number
  onChange: (value: number) => void
}

function CapacityWheelPicker({ value, maxValue = MAX_SCHEDULE_CAPACITY, onChange }: CapacityWheelPickerProps) {
  const options = useMemo(
    () =>
      Array.from({ length: maxValue }, (_, index) => {
        const seats = index + 1
        return { value: seats, label: String(seats) }
      }),
    [maxValue],
  )

  const selected = Math.max(1, Math.min(maxValue, Number.isFinite(value) ? value : 1))

  return (
    <div className="space-y-3">
      <div className="px-1 text-[11px] font-black uppercase tracking-wider text-foreground/90 text-center">
        Seats
      </div>
      <WheelColumn
        options={options}
        selectedValue={selected}
        onSelect={onChange}
        ariaLabel="Select capacity"
      />
      <div className="px-3 py-2 rounded-xl border border-primary/25 bg-primary/10 text-sm font-bold text-foreground shadow-sm">
        Selected: {selected} seats
      </div>
    </div>
  )
}

export function TourSchedulingStep({ data, onUpdate, onNext, onBack }: TourSchedulingStepProps) {
  const [schedules, setSchedules] = useState(data.schedules || [])

  const addSchedule = () => {
    const newSchedule = {
      id: crypto.randomUUID(),
      date: getTodayIsoDate(),
      time: '',
      capacity: data.max_participants || 10,
    }
    const updated = [...schedules, newSchedule]
    setSchedules(updated)
    onUpdate({ schedules: updated })
  }

  const removeSchedule = (id: string) => {
    const updated = schedules.filter((s) => s.id !== id)
    setSchedules(updated)
    onUpdate({ schedules: updated })
  }

  const updateSchedule = (id: string, field: string, value: any) => {
    const updated = schedules.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    setSchedules(updated)
    onUpdate({ schedules: updated })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white border-none shadow-xl rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-background/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Departure Dates</h2>
            <p className="text-white/80 text-sm">
              Add the specific dates and times when this tour will run.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="glass-card p-6 rounded-2xl border border-white/40 shadow-md hover:border-primary/20 transition-all duration-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-4 space-y-2">
                <label className="text-[11px] font-black text-foreground uppercase tracking-wider">
                  Departure Date
                </label>
                <DateWheelPicker
                  value={schedule.date}
                  onChange={(date) => updateSchedule(schedule.id, 'date', date)}
                />
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-[11px] font-black text-foreground uppercase tracking-wider">
                  Start Time
                </label>
                <TimeWheelPicker
                  value={schedule.time}
                  onChange={(time) => updateSchedule(schedule.id, 'time', time)}
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-[11px] font-black text-foreground uppercase tracking-wider">
                  Capacity
                </label>
                <CapacityWheelPicker
                  value={schedule.capacity || 1}
                  maxValue={MAX_SCHEDULE_CAPACITY}
                  onChange={(capacity) => updateSchedule(schedule.id, 'capacity', capacity)}
                />
              </div>
              <div className="md:col-span-1 flex justify-end pb-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSchedule(schedule.id)}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-11 w-11"
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-primary/20 bg-white/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-foreground font-bold text-lg">No dates scheduled yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add departure dates to let travelers book your tour.
            </p>
          </div>
        )}

        <Button
          onClick={addSchedule}
          variant="outline"
          className="w-full h-14 border-dashed border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-primary bg-white/40 text-muted-foreground transition-all rounded-2xl flex items-center justify-center gap-2 font-bold"
        >
          <Plus className="w-5 h-5" />
          Add Departure Date
        </Button>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/30">
        <Button variant="outline" onClick={onBack} size="lg" className="px-8 flex-1 sm:flex-none bg-white/50 border-white/60 hover:bg-white/70 backdrop-blur-sm">
          Back
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="px-8 bg-primary hover:bg-primary/90 text-white font-bold flex-1 sm:flex-none shadow-lg shadow-primary/25"
          disabled={schedules.length === 0}
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
