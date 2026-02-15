import {
  Plus,
  CheckCircle,
  Info,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Activity,
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
      <Card className="p-6 bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Review & Publish</h2>
            <p className="text-white/80 text-sm">One last look before your tour goes live.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6">
        <Card className="p-6 border-gray-100 bg-gray-50/50 rounded-2xl">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" /> Basic Information
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm font-medium">Tour Title</span>
              <span className="text-gray-900 font-bold">{data.title}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm font-medium">Category</span>
              <span className="text-gray-900 font-bold">{data.tour_type}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm font-medium">Duration</span>
              <span className="text-gray-900 font-bold">{data.duration}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-gray-100 bg-gray-50/50 rounded-2xl">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Pricing & Policies
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm font-medium">Base Price</span>
              <span className="text-primary font-bold text-lg">
                {data.currency} {data.price}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm font-medium">Cancellation Policy</span>
              <span className="text-gray-900 font-bold">{data.cancellation_policy}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-gray-100 bg-gray-50/50 rounded-2xl">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Scheduling
          </h3>
          <div className="text-sm text-gray-600">
            {data.schedules?.length || 0} departure dates configured.
          </div>
        </Card>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          className="px-8 font-bold border-gray-200"
        >
          Back
        </Button>
        <Button
          onClick={onPublish}
          size="lg"
          className="px-10 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20"
        >
          Publish Tour
        </Button>
      </div>
    </div>
  )
}
