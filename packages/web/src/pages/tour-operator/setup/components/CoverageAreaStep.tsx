import { APIProvider } from '@vis.gl/react-google-maps'
import { Check, Globe } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { Label } from '@/components/ui/label'

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

const COVERAGE_OPTIONS = [
  { id: 'city', title: 'City Only', radius: '15 km', desc: 'Tours within city limits' },
  { id: 'region', title: 'Regional', radius: '50 km', desc: 'Nearby towns & nature' },
  { id: 'province', title: 'Provincial', radius: 'Province', desc: 'Multi-day state tours' },
  { id: 'national', title: 'National', radius: 'Country', desc: 'Global packages' },
]

export function CoverageAreaStep({ onUpdate, data }: StepProps) {
  const [formData, setFormData] = useState(
    data.coverage || {
      primaryLocation: '',
      radius: '',
    },
  )

  const update = (field: string, value: string) => {
    const next = { ...formData, [field]: value }
    setFormData(next)
    onUpdate({ coverage: next })
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
      <div className="space-y-10">
        <div>
          <h3 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Coverage Area
          </h3>
          <p className="text-lg text-gray-500 leading-relaxed font-medium">
            Where do you operate your tours?
          </p>
        </div>

        <Card className="p-8 space-y-10 border-gray-100 shadow-sm rounded-[32px] bg-white ring-1 ring-black/[0.02]">
          <div className="space-y-4">
            <Label
              htmlFor="location"
              className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1"
            >
              Primary Operating City *
            </Label>
            <CityAutocomplete
              value={formData.primaryLocation}
              onCitySelect={(city) => update('primaryLocation', city)}
              placeholder="e.g. Islamabad, Pakistan"
            />
          </div>

          <div className="space-y-6">
            <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
              Service Coverage Range *
            </Label>
            <div className="grid grid-cols-2 gap-6">
              {COVERAGE_OPTIONS.map((opt) => {
                const isSelected = formData.radius === opt.id
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => update('radius', opt.id)}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-3xl border-2 text-left transition-all relative group h-full flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5'
                        : 'border-gray-50 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-black/5'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="space-y-4 w-full">
                      <div className="flex justify-between items-start">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                            isSelected
                              ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30'
                              : 'bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                          }`}
                        >
                          <Globe className="w-7 h-7" aria-hidden="true" />
                        </div>
                        {isSelected && (
                          <div className="bg-primary text-white rounded-xl p-1.5 shadow-lg border-2 border-white">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-black tracking-tight text-lg uppercase italic transition-colors ${isSelected ? 'text-primary' : 'text-gray-900'}`}
                        >
                          {opt.title}
                        </p>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.15em] mt-1 leading-none">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`mt-6 inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest self-start transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {opt.radius}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </Card>

        <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-8 flex gap-5 group transition-all hover:bg-primary/[0.07]">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-primary/10 flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-12">
            <span className="text-primary text-2xl font-black italic">?</span>
          </div>
          <div className="space-y-2">
            <span className="font-black text-primary text-sm uppercase tracking-widest italic">
              Need a custom range?
            </span>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              Don't worry, you can always update your operating areas and specific destinations for
              each individual tour package later.
            </p>
          </div>
        </div>
      </div>
    </APIProvider>
  )
}
