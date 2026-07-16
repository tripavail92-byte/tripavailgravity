import {
  Calendar,
  Check,
  Edit2,
  FileText,
  Image,
  Lightbulb,
  Loader2,
  Package,
  PlusCircle,
  XCircle,
} from 'lucide-react'
import { motion } from 'motion/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { PackageData } from '../../types'

interface ReviewStepProps {
  packageData: PackageData
  onBack: () => void
  onEdit: (stepId: number) => void
  onSubmit: () => void
  isPublishing?: boolean
}

export function ReviewStep({
  packageData,
  onBack,
  onEdit,
  onSubmit,
  isPublishing = false,
}: ReviewStepProps) {
  // We use parent's isPublishing state and onSubmit callback directly
  // No need for local handleSubmit wrapper

  // NOTE: these ids must match the step ids in CompletePackageCreationFlow's STEPS list.
  // They were one low — they still encoded the numbering from before HotelSelectionStep was
  // inserted at position 1 — so every "Edit" button dropped the user on the PREVIOUS step.
  // (There is intentionally no card for step 8, Pricing.)
  const sections = [
    {
      id: 2,
      title: 'Package Type',
      icon: Package,
      optional: false,
      data: packageData.packageType,
      render: () => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 border-primary/30 text-primary">
            {packageData.packageType}
          </Badge>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Basic Information',
      icon: FileText,
      optional: false,
      data: packageData.name,
      render: () => (
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Name:</span>
            <p className="font-medium">{packageData.name}</p>
          </div>
          {packageData.description && (
            <div>
              <span className="text-sm text-gray-500">Description:</span>
              <p className="text-gray-700 text-sm">{packageData.description}</p>
            </div>
          )}
          <div className="flex gap-4 text-sm">
            {packageData.durationDays && (
              <div>
                <span className="text-gray-500">Duration:</span>
                <span className="ml-1 font-medium">{packageData.durationDays} days</span>
              </div>
            )}
            {packageData.maxGuests && (
              <div>
                <span className="text-gray-500">Max Guests:</span>
                <span className="ml-1 font-medium">{packageData.maxGuests} people</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Media',
      icon: Image,
      optional: false, // Media is REQUIRED - minimum 4 photos
      data: packageData.photos?.length ?? 0, // Ensure 0 instead of undefined
      render: () => (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            {packageData.photos?.length || 0} photo(s) uploaded
            {(!packageData.photos || packageData.photos.length < 4) && (
              <span className="ml-2 text-error font-medium">(Minimum 4 required)</span>
            )}
          </p>
          {packageData.photos && packageData.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {packageData.photos.slice(0, 4).map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Package ${idx + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 5,
      title: 'Highlights',
      icon: Lightbulb,
      optional: true, // Highlights are optional
      // HighlightsStep writes freeInclusions + discountOffers. Nothing anywhere writes
      // packageData.highlights, so reading it made this card permanently say "No highlights added"
      // even right after the operator added some.
      data: (packageData.freeInclusions?.length ?? 0) + (packageData.discountOffers?.length ?? 0),
      render: () => {
        const inclusions = packageData.freeInclusions ?? []
        const discounts = packageData.discountOffers ?? []
        // Explicit length check: [].map() returns [] which is TRUTHY, so a `|| fallback` would
        // never fire for an empty list.
        if (inclusions.length === 0 && discounts.length === 0) {
          return <p className="text-sm text-gray-500">No highlights added</p>
        }
        return (
          <div className="space-y-2">
            {inclusions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {inclusions.map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-success/5 border-success/30 text-success"
                  >
                    {item.name}
                  </Badge>
                ))}
              </div>
            )}
            {discounts.map((offer, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <Check size={16} className="text-success mt-0.5 flex-shrink-0" />
                <span>
                  {offer.name}
                  {offer.discount ? ` — ${offer.discount}% off` : ''}
                </span>
              </div>
            ))}
          </div>
        )
      },
    },
    {
      id: 6,
      title: 'Inclusions',
      icon: PlusCircle,
      optional: false,
      data: packageData.inclusions?.length,
      render: () => (
        <div className="flex flex-wrap gap-2">
          {packageData.inclusions?.map((item, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="bg-success/5 border-success/30 text-success"
            >
              {item}
            </Badge>
          )) || <p className="text-sm text-gray-500">No inclusions specified</p>}
        </div>
      ),
    },
    {
      id: 7,
      title: 'Exclusions',
      icon: XCircle,
      optional: false,
      data: packageData.exclusions?.length,
      render: () => (
        <div className="flex flex-wrap gap-2">
          {packageData.exclusions?.map((item, idx) => (
            <Badge key={idx} variant="outline" className="bg-error/5 border-error/30 text-error">
              {item}
            </Badge>
          )) || <p className="text-sm text-gray-500">No exclusions specified</p>}
        </div>
      ),
    },
    {
      id: 9,
      title: 'Availability',
      icon: Calendar,
      optional: false,
      data: packageData.availabilityType,
      render: () => (
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Type:</span>
            <span className="ml-2 font-medium capitalize">
              {packageData.availabilityType?.replace('-', ' ')}
            </span>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-500">Min Stay:</span>
              <span className="ml-1 font-medium">{packageData.minStay} nights</span>
            </div>
            <div>
              <span className="text-gray-500">Max Stay:</span>
              <span className="ml-1 font-medium">{packageData.maxStay} nights</span>
            </div>
          </div>
          {packageData.blackoutDates && packageData.blackoutDates.length > 0 && (
            <div>
              <span className="text-sm text-gray-500">Blackout Dates:</span>
              <span className="ml-2 text-sm font-medium">
                {packageData.blackoutDates.length} dates blocked
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 10,
      title: 'Policies',
      icon: FileText,
      optional: false,
      data: packageData.cancellationPolicy,
      render: () => (
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Cancellation:</span>
            <span className="ml-2 font-medium capitalize">{packageData.cancellationPolicy}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Payment:</span>
            <span className="ml-2 font-medium capitalize">
              {packageData.paymentTerms?.replace('-', ' ')}
            </span>
          </div>
        </div>
      ),
    },
  ]

  // Helper function to check if field has valid data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasValidData = (data: any, sectionId?: number) => {
    if (data === undefined || data === null) return false

    // Special case: Media section requires minimum 4 photos (step 4)
    if (sectionId === 4) {
      return typeof data === 'number' && data >= 4
    }

    if (typeof data === 'number') return data >= 0 // 0 is valid for counts/lengths
    if (typeof data === 'string') return data.length > 0
    if (Array.isArray(data)) return true // Empty arrays are valid
    return Boolean(data)
  }

  // Only count required sections for completion percentage
  const requiredSections = sections.filter((s) => !s.optional)
  const completedRequired = requiredSections.filter((s) => hasValidData(s.data, s.id))
  const completionPercentage = Math.round(
    (completedRequired.length / requiredSections.length) * 100,
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Review Your Package</h2>
        <p className="text-gray-600 text-lg">Review all details before publishing your package</p>
      </motion.div>

      {/* Completion Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">Completion Status</span>
            <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {completedRequired.length} of {requiredSections.length} required sections completed
          </p>
        </Card>
      </motion.div>

      {/* Sections Review */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4"
      >
        {sections.map((section) => {
          const IconComponent = section.icon
          const isComplete = hasValidData(section.data, section.id)

          return (
            <Card
              key={section.id}
              className={cn(
                'p-6 shadow-sm hover:shadow-md transition-shadow',
                !isComplete && 'bg-gray-50',
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      isComplete ? 'bg-primary/10' : 'bg-gray-200',
                    )}
                  >
                    <IconComponent
                      size={20}
                      className={isComplete ? 'text-primary' : 'text-gray-400'}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {section.title}
                      {section.optional && (
                        <span className="ml-2 text-xs text-gray-500">(Optional)</span>
                      )}
                    </h3>
                    {!isComplete && <p className="text-sm text-gray-500">Not completed</p>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(section.id)}
                  className="text-primary hover:text-primary"
                >
                  <Edit2 size={16} className="mr-1" />
                  Edit
                </Button>
              </div>
              {isComplete && <div>{section.render()}</div>}
            </Card>
          )
        })}
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        className="flex justify-between pt-8 border-t border-border mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={onBack}
          disabled={isPublishing}
          className="px-6 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={completionPercentage < 100 || isPublishing}
          className={cn(
            'px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 hover:bg-primary/90 flex items-center justify-center min-w-[170px]',
            (completionPercentage < 100 || isPublishing) &&
              'opacity-50 cursor-not-allowed hover:transform-none',
          )}
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Publish Package
            </>
          )}
        </button>
      </motion.div>
    </div>
  )
}
