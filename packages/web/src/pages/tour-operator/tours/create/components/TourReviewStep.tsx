import {
  Calendar,
  CheckCircle,
  DollarSign,
  Info,
  MapPin,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tour } from '@/features/tour-operator/services/tourService'

interface TourReviewStepProps {
  data: Partial<Tour>
  onBack: () => void
  onPublish: () => void
}

function ReviewRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border/60 last:border-b-0">
      <span className="text-muted-foreground text-sm font-medium">{label}</span>
      <span className={highlight ? 'text-primary font-bold text-lg text-right' : 'text-foreground font-bold text-right'}>
        {value}
      </span>
    </div>
  )
}

const formatDateDisplay = (date: string) => {
  if (!date) return '—'
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function TourReviewStep({ data, onBack, onPublish }: TourReviewStepProps) {
  const schedules = Array.isArray(data.schedules) ? data.schedules : []
  const itinerary = Array.isArray(data.itinerary) ? data.itinerary : []
  const images = Array.isArray(data.images) ? data.images : []
  const highlights = Array.isArray(data.highlights) ? data.highlights : []
  const requirements = Array.isArray(data.requirements) ? data.requirements : []
  const languages = Array.isArray(data.languages) ? data.languages : []
  const inclusions = Array.isArray(data.inclusions) ? data.inclusions : []
  const exclusions = Array.isArray(data.exclusions) ? data.exclusions : []

  const schedulePreview = schedules
    .slice(0, 3)
    .map((schedule: any) => {
      const dateText = schedule?.date ? formatDateDisplay(schedule.date) : 'No date'
      const timeText = schedule?.time || 'No time'
      const capacityText = schedule?.capacity ? `${schedule.capacity} seats` : 'No capacity'
      return { dateText, timeText, capacityText }
    })

  return (
    <div className="space-y-6">
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-background/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-border/40 shadow-lg">
            <CheckCircle className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Review & Publish</h2>
            <p className="text-primary-foreground/90 text-sm font-medium">One last look before your tour goes live.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" /> Basic Information
          </h3>

          <div className="space-y-3">
            <ReviewRow label="Tour Title" value={data.title || '—'} />
            <ReviewRow
              label="Category"
              value={data.tour_type === 'Custom' ? data.custom_category_label || 'Custom' : data.tour_type || '—'}
            />
            <ReviewRow
              label="Location"
              value={data.location?.city ? `${data.location.city}${data.location.country ? `, ${data.location.country}` : ''}` : '—'}
            />
            <ReviewRow label="Duration" value={data.duration || '—'} />
            <ReviewRow label="Short Description" value={data.short_description || 'Not provided'} />
            <ReviewRow label="Detailed Description" value={data.description || 'Not provided'} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Experience Details
          </h3>

          <div className="space-y-3">
            <ReviewRow label="Media Uploaded" value={`${images.length} image${images.length === 1 ? '' : 's'}`} />
            <ReviewRow label="Highlights" value={`${highlights.length} selected`} />
            <ReviewRow label="Itinerary Days" value={`${itinerary.length} day entries`} />
            <ReviewRow label="Difficulty" value={data.difficulty_level || '—'} />
            <ReviewRow label="Capacity / Seats" value={`${data.max_participants || 1} seats`} />
            <ReviewRow
              label="Age Range"
              value={`${data.min_age || 0} - ${data.max_age || 100}`}
            />
            <ReviewRow
              label="Languages"
              value={languages.length > 0 ? languages.join(', ') : 'Not selected'}
            />
            <ReviewRow
              label="Requirements"
              value={requirements.length > 0 ? `${requirements.length} selected` : 'Not selected'}
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Pricing & Policies
          </h3>

          <div className="space-y-3">
            <ReviewRow label="Base Price" value={`${data.currency || 'USD'} ${data.price ?? 0}`} highlight />
            <ReviewRow
              label="Deposit Required"
              value={data.deposit_required ? `Yes (${data.deposit_percentage || 0}%)` : 'No'}
            />
            <ReviewRow label="Cancellation Policy" value={data.cancellation_policy || '—'} />
            <ReviewRow
              label="Inclusions"
              value={inclusions.length > 0 ? `${inclusions.length} selected` : 'Not selected'}
            />
            <ReviewRow
              label="Exclusions"
              value={exclusions.length > 0 ? `${exclusions.length} selected` : 'Not selected'}
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Scheduling
          </h3>

          <div className="space-y-3">
            <ReviewRow
              label="Departure Dates"
              value={`${schedules.length} configured`}
            />
            {schedulePreview.length > 0 ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
                {schedulePreview.map((schedule, index) => (
                  <div key={`${schedule.dateText}-${schedule.timeText}-${index}`} className="text-xs text-foreground font-semibold grid grid-cols-3 gap-2">
                    <span>{schedule.dateText}</span>
                    <span>{schedule.timeText}</span>
                    <span className="text-right">{schedule.capacityText}</span>
                  </div>
                ))}
                {schedules.length > 3 && (
                  <p className="text-xs text-muted-foreground font-medium">
                    + {schedules.length - 3} more schedule{schedules.length - 3 === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No schedules added yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-border/60">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          className="px-8 font-bold bg-background/75 border-border/60 hover:bg-background backdrop-blur-sm"
        >
          Back
        </Button>
        <Button
          onClick={onPublish}
          size="lg"
          className="px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25"
        >
          🚀 Publish Tour
        </Button>
      </div>
    </div>
  )
}
