import { Camera, Check, Heart, Map, Mountain, PartyPopper, Plane, Plus, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

const SERVICES = [
  { id: 'day-trip', name: 'Day Trips', icon: Plane, desc: 'Single-day excursions' },
  { id: 'weekend', name: 'Weekend Getaways', icon: Map, desc: '2-3 day short trips' },
  { id: 'hiking', name: 'Hiking & Trekking', icon: Mountain, desc: 'Mountain & nature trails' },
  { id: 'sightseeing', name: 'Sightseeing', icon: Camera, desc: 'Cultural & city tours' },
  { id: 'festivals', name: 'Festivals', icon: PartyPopper, desc: 'Events & celebrations' },
  { id: 'leisure', name: 'Leisure', icon: Heart, desc: 'Wellness & relaxation' },
]

export function ServicesStep({ onUpdate, data }: StepProps) {
  const [selected, setSelected] = useState<string[]>(data.services?.selected || [])
  const [custom, setCustom] = useState<string[]>(data.services?.custom || [])
  const [customInput, setCustomInput] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    setSelected(next)
    onUpdate({ services: { selected: next, custom } })
  }

  const addCustom = () => {
    if (customInput && !custom.includes(customInput)) {
      const next = [...custom, customInput]
      setCustom(next)
      setCustomInput('')
      setIsAdding(false)
      onUpdate({ services: { selected, custom: next } })
    }
  }

  const removeCustom = (item: string) => {
    const next = custom.filter((c) => c !== item)
    setCustom(next)
    onUpdate({ services: { selected, custom: next } })
  }

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Tour Services</h3>
        <p className="text-lg text-gray-500 leading-relaxed font-medium">
          What types of tours do you specialize in? Select all that apply.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {SERVICES.map((s) => {
          const isSelected = selected.includes(s.id)
          return (
            <motion.button
              key={s.id}
              onClick={() => toggle(s.id)}
              whileTap={{ scale: 0.98 }}
              className={`p-8 rounded-[32px] border-2 text-left transition-all relative group flex flex-col items-center text-center space-y-4 ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-black/5'
              }`}
              aria-pressed={isSelected}
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isSelected
                    ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30'
                    : 'bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105'
                }`}
              >
                <s.icon className={`${isSelected ? 'w-8 h-8' : 'w-7 h-7'}`} aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p
                  className={`font-black tracking-tight text-lg uppercase italic transition-colors ${isSelected ? 'text-primary' : 'text-gray-900'}`}
                >
                  {s.name}
                </p>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-none">
                  {s.desc}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-4 right-4 bg-primary text-white rounded-xl p-1.5 shadow-lg border-2 border-white">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      <div className="space-y-6 pt-10 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Custom Categories
            </h4>
            <p className="text-sm text-gray-500 font-medium">
              Add any other niche specialties you offer.
            </p>
          </div>
          {!isAdding && (
            <Button
              variant="outline"
              size="sm"
              className="text-primary border-primary/20 hover:bg-primary/5 rounded-2xl font-bold h-11 px-6 transition-all hover:scale-105 active:scale-95"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-5 h-5 mr-2" /> Add Specialty
            </Button>
          )}
        </div>

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 bg-gray-50 p-4 rounded-3xl border border-gray-100"
          >
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. Desert Safari, Food Tour..."
              className="rounded-2xl border-gray-200 h-14 bg-white text-base focus-visible:ring-primary/20"
              autoFocus
            />
            <Button onClick={addCustom} className="rounded-2xl px-8 h-14 font-bold">
              Add
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsAdding(false)}
              className="rounded-2xl h-14 font-bold text-gray-500"
            >
              Cancel
            </Button>
          </motion.div>
        )}

        <div className="flex flex-wrap gap-3">
          {custom.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-2xl text-sm font-bold border-2 border-primary/10 shadow-sm transition-all hover:border-primary/30"
            >
              {c}
              <button
                onClick={() => removeCustom(c)}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label={`Remove ${c}`}
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
