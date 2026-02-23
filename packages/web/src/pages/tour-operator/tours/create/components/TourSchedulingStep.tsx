import { Calendar, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tour } from '@/features/tour-operator/services/tourService'

interface TourSchedulingStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
}

export function TourSchedulingStep({ data, onUpdate, onNext, onBack }: TourSchedulingStepProps) {
  const [schedules, setSchedules] = useState(data.schedules || [])

  const addSchedule = () => {
    const newSchedule = {
      id: crypto.randomUUID(),
      date: '',
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
      <Card className="p-6 bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-600 text-white border-none shadow-xl rounded-2xl overflow-hidden relative">
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
            className="glass-card p-6 rounded-2xl border border-white/40 shadow-md hover:border-cyan-200/60 transition-all duration-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Departure Date
                </label>
                <Input
                  type="date"
                  value={schedule.date}
                  onChange={(e) => updateSchedule(schedule.id, 'date', e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={schedule.time}
                  onChange={(e) => updateSchedule(schedule.id, 'time', e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Capacity
                </label>
                <Input
                  type="number"
                  value={schedule.capacity}
                  onChange={(e) =>
                    updateSchedule(schedule.id, 'capacity', parseInt(e.target.value))
                  }
                  className="h-11"
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
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-cyan-200/60 bg-white/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-cyan-500" />
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
          className="w-full h-14 border-dashed border-2 border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50/50 hover:text-cyan-600 bg-white/40 text-muted-foreground transition-all rounded-2xl flex items-center justify-center gap-2 font-bold"
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
          className="px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold flex-1 sm:flex-none shadow-lg shadow-cyan-500/25"
          disabled={schedules.length === 0}
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
