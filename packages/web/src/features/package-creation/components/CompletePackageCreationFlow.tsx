import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import { getUserCached } from '@/lib/authCache'
import { supabase } from '@/lib/supabase'

import { publishPackage } from '../services/packageService'
import { PackageData, StepData } from '../types'
import { AvailabilityStep } from './steps/AvailabilityStep'
import { BasicsStep } from './steps/BasicsStep'
import { ExclusionsStep } from './steps/ExclusionsStep'
import { HighlightsStep } from './steps/HighlightsStep'
import { HotelSelectionStep } from './steps/HotelSelectionStep'
import { InclusionsStep } from './steps/InclusionsStep'
import { MediaStep } from './steps/MediaStep'
import { PackageTypeStep } from './steps/PackageTypeStep'
import { PoliciesStep } from './steps/PoliciesStep'
import { PricingStep } from './steps/PricingStep'
import { ReviewStep } from './steps/ReviewStep'

const STEPS = [
  { id: 1, title: 'Select Hotel', component: HotelSelectionStep },
  { id: 2, title: 'Package Type', component: PackageTypeStep },
  { id: 3, title: 'Basics', component: BasicsStep },
  { id: 4, title: 'Media', component: MediaStep },
  { id: 5, title: 'Highlights', component: HighlightsStep },
  { id: 6, title: 'Inclusions', component: InclusionsStep },
  { id: 7, title: 'Exclusions', component: ExclusionsStep },
  { id: 8, title: 'Pricing', component: PricingStep },
  { id: 9, title: 'Availability', component: AvailabilityStep },
  { id: 10, title: 'Policies', component: PoliciesStep },
  { id: 11, title: 'Review', component: ReviewStep },
]

interface CompletePackageCreationFlowProps {
  /** Called once, after a package has been successfully published. The host decides where to go
   *  next (dashboard, the new listing). Publish is otherwise self-contained. */
  onPublished?: (pkg: { id?: string; name?: string }) => void
}

export function CompletePackageCreationFlow({
  onPublished,
}: CompletePackageCreationFlowProps = {}) {
  const [currentStep, setCurrentStep] = useState(1)
  // Furthest step reached — decides which progress segments are navigable. Tracked with an effect
  // so every route into setCurrentStep (Next, Back, and the Review step's Edit links) is covered.
  const [maxStepReached, setMaxStepReached] = useState(1)
  useEffect(() => {
    setMaxStepReached((prev) => Math.max(prev, currentStep))
  }, [currentStep])
  const [packageData, setPackageData] = useState<PackageData>({})
  const [isPublishing, setIsPublishing] = useState(false)
  // Latches true on the first successful publish and never resets. The button is disabled on
  // `isPublishing || isPublished`, so the window between success and navigating away cannot be used
  // to publish the same package a second time. Before this, `setIsPublishing(false)` in the finally
  // re-enabled the button on the same review screen, and partners — seeing no redirect — clicked
  // again and created duplicate listings.
  const [isPublished, setIsPublished] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  // useCallback with no deps: both use the functional setState form, so they need none. Without it
  // these were fresh function identities on every render, and any step with a sync-to-parent effect
  // that depends on onUpdate re-fired forever. BasicsStep did exactly that.
  const handleStepComplete = useCallback((stepData: StepData) => {
    setPackageData((prev) => ({ ...prev, ...stepData }))
    setCurrentStep((prev) => (prev < STEPS.length ? prev + 1 : prev))
  }, [])

  const handleStepUpdate = useCallback((stepData: StepData) => {
    setPackageData((prev) => ({ ...prev, ...stepData }))
  }, [])

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleEdit = (stepId: number) => {
    setCurrentStep(stepId)
  }

  const handleSubmit = async () => {
    console.log('📦 Publishing package:', packageData)
    setIsPublishing(true)
    setPublishError(null)

    try {
      // Get current user
      const user = await getUserCached()

      if (!user) {
        throw new Error('You must be logged in to publish packages')
      }

      console.log('👤 User ID:', user.id)

      // Publish package (uploads media + saves to DB)
      const publishedPackage = await publishPackage(packageData, user.id)

      console.log('✅ Package published successfully!', publishedPackage)

      // Latch BEFORE handing control to the host. The host navigates away, but until it does the
      // button must stay disabled — this is the guard against the double-publish.
      setIsPublished(true)
      toast.success(`Package "${publishedPackage.name}" published successfully.`)
      onPublished?.({ id: publishedPackage?.id, name: publishedPackage?.name })
    } catch (error: any) {
      console.error('❌ Failed to publish package:', error)
      const errorMessage = error.message || 'Failed to publish package. Please try again.'
      setPublishError(errorMessage)
      toast.error(errorMessage)
      // Only re-enable on FAILURE — a failed publish is safe to retry, a successful one is not.
      setIsPublishing(false)
    }
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component as any
  const isReviewStep = currentStep === STEPS.length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header / Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">
            Create New Package
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
            </span>
          </h1>
          {/* "Saved 2 mins ago" used to sit here, hardcoded. Nothing autosaves this flow, so it was
              telling the user their work was safe when it was not. Removed rather than faked. */}
        </div>

        {/* One segment per step, and every step already visited is a jump target. Previously this
            was a single width-% bar, so correcting an early step meant clicking Next through every
            remaining one to get back to Review. Steps beyond the furthest reached stay inert —
            skipping ahead would bypass the data those steps collect. */}
        <div className="flex gap-[3px]" role="tablist" aria-label="Package creation steps">
          {STEPS.map((step, i) => {
            const n = i + 1
            const isDone = n < currentStep
            const isCurrent = n === currentStep
            const canJump = n <= maxStepReached && !isCurrent

            const bar = (
              <span
                className={[
                  'block h-2 w-full transition-colors duration-300',
                  isDone || isCurrent ? 'bg-primary' : 'bg-muted',
                  canJump ? 'group-hover:bg-primary/60' : '',
                  i === 0 ? 'rounded-l-full' : '',
                  i === STEPS.length - 1 ? 'rounded-r-full' : '',
                ].join(' ')}
              />
            )

            return canJump ? (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(n)}
                title={`Go to: ${step.title}`}
                aria-label={`Go to step ${n}: ${step.title}`}
                className="group flex-1 cursor-pointer py-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {bar}
              </button>
            ) : (
              <span
                key={step.id}
                className="flex-1 py-1"
                title={step.title}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {bar}
              </span>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-8 min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {!isReviewStep ? (
              <CurrentStepComponent
                existingData={packageData}
                onComplete={handleStepComplete}
                onUpdate={handleStepUpdate}
                onBack={handleBack}
              />
            ) : (
              <CurrentStepComponent
                packageData={packageData}
                onBack={handleBack}
                onEdit={handleEdit}
                onSubmit={handleSubmit}
                // Stays busy after a successful publish too — we are about to navigate away, and a
                // re-enabled button here is what produced duplicate packages.
                isPublishing={isPublishing || isPublished}
                publishError={publishError}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
