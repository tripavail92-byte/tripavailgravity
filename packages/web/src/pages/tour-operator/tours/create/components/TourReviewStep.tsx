import {
  Activity,
  Calendar,
  CheckCircle,
  DollarSign,
  Info,
  MapPin,
  Plus,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tour } from '@/features/tour-operator/services/tourService'

interface TourReviewStepProps {
  data: Partial<Tour>
  onBack: () => void
  onPublish: () => void
}

export function TourReviewStep({ data, onBack, onPublish }: TourReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="relative p-6 rounded-2xl bg-primary text-white border-none shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Review & Publish</h2>
            <p className="text-white/90 text-sm font-medium">One last look before your tour goes live.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" /> Basic Information
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-white/40">
              <span className="text-muted-foreground text-sm font-medium">Tour Title</span>
              <span className="text-foreground font-bold">{data.title}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/40">
              <span className="text-muted-foreground text-sm font-medium">Category</span>
              <span className="text-foreground font-bold">{data.tour_type}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/40">
              <span className="text-muted-foreground text-sm font-medium">Duration</span>
              <span className="text-foreground font-bold">{data.duration}</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Pricing & Policies
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-white/40">
              <span className="text-muted-foreground text-sm font-medium">Base Price</span>
              <span className="text-primary font-bold text-lg">
                {data.currency} {data.price}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/40">
              <span className="text-muted-foreground text-sm font-medium">Cancellation Policy</span>
              <span className="text-foreground font-bold">{data.cancellation_policy}</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Scheduling
          </h3>
          <div className="text-sm text-muted-foreground">
            {data.schedules?.length || 0} departure dates configured.
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-white/30">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          className="px-8 font-bold bg-white/50 border-white/60 hover:bg-white/70 backdrop-blur-sm"
        >
          Back
        </Button>
        <Button
          onClick={onPublish}
          size="lg"
          className="px-10 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25"
        >
          🚀 Publish Tour
        </Button>
      </div>
    </div>
  )
}
