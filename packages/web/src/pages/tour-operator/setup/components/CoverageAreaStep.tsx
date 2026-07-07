import { APIProvider } from '@vis.gl/react-google-maps'
import { Building2, Check, Compass, Globe, Map, MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
  /** Membership-tier feature gate — same one the tour-creation wizard reads. Defaults to
   * true so this step still works if a caller doesn't pass it. */
  allowGoogleMaps?: boolean
}

const COVERAGE_OPTIONS = [
  { id: 'city', title: 'City Only', radius: '15 km', desc: 'Tours within city limits', icon: Building2 },
  { id: 'region', title: 'Regional', radius: '50 km', desc: 'Nearby towns & nature', icon: MapPin },
  { id: 'province', title: 'Provincial', radius: 'Province', desc: 'Multi-day state tours', icon: Map },
  { id: 'national', title: 'National', radius: 'Country', desc: 'Global packages', icon: Globe },
]

export function CoverageAreaStep({ onUpdate, data, allowGoogleMaps = true }: StepProps) {
  const [formData, setFormData] = useState(
    data.coverage || {
      primaryLocation: '',
      radii: [] as string[],
    },
  )

  const update = (field: string, value: any) => {
    const next = { ...formData, [field]: value }
    setFormData(next)
    onUpdate({ coverage: next })
  }

  const toggleRadius = (id: string) => {
    const current: string[] = formData.radii || []
    const next = current.includes(id) ? current.filter((r: string) => r !== id) : [...current, id]
    update('radii', next)
  }

  const content = (
      <div className="space-y-10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Map className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-foreground mb-1.5 tracking-tight">
              Coverage Area
            </h3>
            <p className="text-muted-foreground leading-relaxed font-medium">
              Where do you operate your tours?
            </p>
          </div>
        </div>

          <div className="space-y-10 p-6 rounded-2xl bg-muted/30 border border-border/50">
          <div className="space-y-4">
            <Label
              htmlFor="location"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
            >
              <Building2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Primary Operating City *
            </Label>
            {allowGoogleMaps ? (
              <CityAutocomplete
                value={formData.primaryLocation}
                onCitySelect={(city) => update('primaryLocation', city)}
                placeholder="e.g. Islamabad, Pakistan"
              />
            ) : (
              <Input
                value={formData.primaryLocation}
                onChange={(e) => update('primaryLocation', e.target.value)}
                placeholder="e.g. Islamabad, Pakistan"
                className="h-12 border-input focus:border-primary/50 focus:ring-primary/20"
              />
            )}
            {!allowGoogleMaps ? (
              <p className="text-xs text-muted-foreground">
                Google Maps search is not enabled for your current membership tier. Enter the city name manually.
              </p>
            ) : null}
          </div>

          <div className="space-y-6">
            <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              <Compass className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Service Coverage Range — select all that apply
            </Label>
            <div className="grid grid-cols-2 gap-6">
              {COVERAGE_OPTIONS.map((opt) => {
                const isSelected = (formData.radii || []).includes(opt.id)
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => toggleRadius(opt.id)}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-2xl border text-left transition-all relative group h-full flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'border-primary bg-primary/20 shadow-xl shadow-primary/10'
                        : 'border-border/60 bg-background hover:border-border hover:bg-muted/30'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="space-y-4 w-full">
                      <div className="flex justify-between items-start">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30'
                              : 'bg-muted text-muted-foreground/60 group-hover:bg-primary/20 group-hover:text-primary'
                          }`}
                        >
                          <opt.icon className="w-7 h-7" aria-hidden="true" />
                        </div>
                        {isSelected && (
                          <div className="bg-primary text-primary-foreground rounded-xl p-1.5 shadow-lg border-2 border-background/30">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-black tracking-tight text-lg uppercase italic transition-colors ${isSelected ? 'text-primary' : 'text-foreground'}`}
                        >
                          {opt.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 font-black uppercase tracking-[0.15em] mt-1 leading-none">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                    <div
                          className={`mt-6 inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest self-start transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    >
                      {opt.radius}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex gap-5 group transition-all hover:bg-primary/15">
          <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-12">
            <span className="text-primary text-xl font-black italic">?</span>
          </div>
          <div className="space-y-1.5">
            <span className="font-bold text-primary text-sm uppercase tracking-widest">
              Need a custom range?
            </span>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Don't worry, you can always update your operating areas and specific destinations for
              each individual tour package later.
            </p>
          </div>
        </div>
      </div>
  )

  if (allowGoogleMaps) {
    return (
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
        {content}
      </APIProvider>
    )
  }

  return content
}
