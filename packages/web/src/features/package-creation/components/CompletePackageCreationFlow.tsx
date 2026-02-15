import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { HotelSelectionStep } from './steps/HotelSelectionStep'
import { PackageTypeStep } from './steps/PackageTypeStep'
import { BasicsStep } from './steps/BasicsStep'
import { MediaStep } from './steps/MediaStep'
import { HighlightsStep } from './steps/HighlightsStep'
import { AvailabilityStep } from './steps/AvailabilityStep'
import { InclusionsStep } from './steps/InclusionsStep'
import { ExclusionsStep } from './steps/ExclusionsStep'
import { PoliciesStep } from './steps/PoliciesStep'
import { ReviewStep } from './steps/ReviewStep'
import { PricingStep } from './steps/PricingStep'
import { PackageData, StepData } from '../types'
import { publishPackage } from '../services/packageService'
import { supabase } from '@/lib/supabase'

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

export function CompletePackageCreationFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [packageData, setPackageData] = useState<PackageData>({})
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const handleStepComplete = (stepData: StepData) => {
    setPackageData((prev) => ({ ...prev, ...stepData }))
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1)
    } else {
      console.log('Package Creation Completed', packageData)
      // Handle completion (submit to backend)
    }
  }

  const handleStepUpdate = (stepData: StepData) => {
    setPackageData((prev) => ({ ...prev, ...stepData }))
  }

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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('You must be logged in to publish packages')
      }

      console.log('👤 User ID:', user.id)

      // Publish package (uploads media + saves to DB)
      const publishedPackage = await publishPackage(packageData, user.id)

      console.log('✅ Package published successfully!', publishedPackage)

      // Success feedback
      alert(
        `✅ Package "${publishedPackage.name}" published successfully with ID: ${publishedPackage.id}`,
      )

      // TODO: Redirect to dashboard or package detail page
      // window.location.href = `/hotel-manager/packages/${publishedPackage.id}`;
    } catch (error: any) {
      console.error('❌ Failed to publish package:', error)
      const errorMessage = error.message || 'Failed to publish package. Please try again.'
      setPublishError(errorMessage)
      alert(`❌ Error: ${errorMessage}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component
  const isReviewStep = currentStep === STEPS.length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header / Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Package
            <span className="ml-2 text-sm font-normal text-gray-500">
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
            </span>
          </h1>
          <div className="text-sm text-gray-500">Saved 2 mins ago</div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[600px]">
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
              />
            ) : (
              <CurrentStepComponent
                packageData={packageData}
                onBack={handleBack}
                onEdit={handleEdit}
                onSubmit={handleSubmit}
                isPublishing={isPublishing}
                publishError={publishError}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
