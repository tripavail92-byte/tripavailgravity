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
      <Card className="p-6 bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-md">
        <div className="flex items-center gap-4">
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
          <Card
            key={schedule.id}
            className="p-6 border-border shadow-sm rounded-2xl hover:border-primary/20 transition-colors"
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
          </Card>
        ))}

        {schedules.length === 0 && (
          <div className="text-center py-12 bg-muted rounded-2xl border-2 border-dashed border-border">
            <Calendar className="w-12 h-12 text-muted mx-auto mb-3" />
            <h3 className="text-foreground font-bold">No dates scheduled</h3>
            <p className="text-sm text-muted-foreground">
              Add departure dates to let travelers book your tour.
            </p>
          </div>
        )}

        <Button
          onClick={addSchedule}
          variant="outline"
          className="w-full h-14 border-dashed border-2 border-input hover:border-primary hover:bg-primary/5 hover:text-primary transition-all rounded-2xl flex items-center justify-center gap-2 font-bold"
        >
          <Plus className="w-5 h-5" />
          Add Departure Date
        </Button>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onBack} size="lg" className="px-8 flex-1 sm:flex-none">
          Back
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="px-8 bg-primary hover:bg-primary/90 text-white font-bold flex-1 sm:flex-none"
          disabled={schedules.length === 0}
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
