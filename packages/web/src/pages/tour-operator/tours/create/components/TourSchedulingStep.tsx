import { Calendar, Clock3, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tour } from '@/features/tour-operator/services/tourService'

import { DateWheelPicker } from './DateWheelPicker'
import { TimeWheelPicker } from './TimeWheelPicker'

interface TourSchedulingStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
}

const pad = (value: number) => String(value).padStart(2, '0')

const formatIsoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`

const getTodayIsoDate = () => {
  const now = new Date()
  return formatIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
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
            className="glass-card p-6 rounded-2xl border border-white/50 shadow-lg hover:border-primary/30 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Schedule {schedules.findIndex((s) => s.id === schedule.id) + 1}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/70 border border-primary/20 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <label className="text-xs font-black text-foreground uppercase tracking-wider">
                    Departure Date
                  </label>
                </div>
                <DateWheelPicker
                  value={schedule.date}
                  onChange={(date) => updateSchedule(schedule.id, 'date', date)}
                />
              </div>
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/70 border border-primary/20 shadow-sm">
                  <Clock3 className="w-3.5 h-3.5 text-primary" />
                  <label className="text-xs font-black text-foreground uppercase tracking-wider">
                    Start Time
                  </label>
                </div>
                <TimeWheelPicker
                  value={schedule.time}
                  onChange={(time) => updateSchedule(schedule.id, 'time', time)}
                />
              </div>
              <div className="lg:col-span-2 flex justify-end pb-1">
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
