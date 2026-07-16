import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import {
  PropertyTypeIcon,
  // LocationIcon,
  // AmenitiesIcon,
  // PhotosIcon,
  // PricingIcon
} from '@/features/hotel-listing/assets/HotelListingIcons'
// import {
//   BasicInfoIcon,
//   ModernLocationIcon,
//   ModernAmenitiesIcon,
//   ModernRoomsIcon,
//   ModernPoliciesIcon,
//   ModernPhotosIcon,
//   ModernServicesIcon,
//   ModernReviewIcon
// } from '../assets/modern/ModernStepIcons';
import { PremiumPropertyVector } from '@/features/hotel-listing/assets/PremiumPropertyVectors'

import { AirbnbBottomNav } from './ui/AirbnbBottomNav'

// Placeholder steps for Phase 3+
const PlaceholderStep = () => <div>Step content coming soon</div>

// Step Components
import { useAuth } from '@/hooks/useAuth'

import { hotelService } from '../services/hotelService'
import { AmenitiesStep } from './steps/AmenitiesStep'
import { LocationStep } from './steps/LocationStep'
import { PhotosStep } from './steps/PhotosStep'
import { PoliciesStep } from './steps/PoliciesStep'
import { PropertyDetailsStep } from './steps/PropertyDetailsStep'
import { PropertyTypeStep } from './steps/PropertyTypeStep'
import { ReviewStep } from './steps/ReviewStep'
import { RoomsStep } from './steps/RoomsStep'
import { ServicesStep } from './steps/ServicesStep'

interface Step {
  id: number
  title: string
  description: string
  component: React.ComponentType<any>
  completed: boolean
  required: boolean
}

export interface HotelData {
  // Basic Info
  propertyType: string
  hotelName: string
  description: string
  contactEmail: string
  contactPhone: string
  starRating?: number

  // Location
  country: string
  city: string
  area: string
  address: string
  zipCode: string
  location?: { address: string; lat: number; lng: number }

  // Amenities
  amenities: string[]

  // Rooms
  rooms: Array<{
    id: string
    type: string
    name: string
    description: string
    count: number
    maxGuests: number
    beds: any // BedConfig[] from RoomsStep
    size: number
    amenities?: string[]
    pricing: {
      basePrice: number
      currency: string
    }
  }>

  // Policies
  policies?: {
    checkIn: string
    checkOut: string
    cancellationPolicy: 'flexible' | 'moderate' | 'strict' | 'non-refundable'
    customCancellationText?: string
    houseRules: {
      petsAllowed: boolean
      smokingAllowed: boolean
      eventsAllowed: boolean
      childrenAllowed: boolean
      quietHoursStart?: string
      quietHoursEnd?: string
      additionalRules?: string
    }
    guestRequirements: {
      minimumAge: number
      idRequired: boolean
      creditCardRequired: boolean
    }
  }

  // Photos
  photos?: {
    propertyPhotos: Array<{
      id: string
      url: string
      fileName: string
      size: number
      uploadedAt: string
      order: number
      isCover?: boolean
    }>
  }

  // Services
  services?: {
    breakfast: 'included' | 'optional' | 'none'
    parking: 'free' | 'paid' | 'none'
    wifi: 'free' | 'paid' | 'none'
    facilities: {
      pool: boolean
      gym: boolean
      spa: boolean
      restaurant: boolean
      roomService: boolean
      airportShuttle: boolean
      evCharging: boolean
    }
    accessibility: {
      wheelchairAccessible: boolean
      elevator: boolean
    }
  }
}

// Shared type for step component props - allows partial updates
export type StepData = Partial<HotelData> & {
  // LocationStep uses these additional fields during selection
  locationData?: unknown
  coordinates?: { lat: number; lng: number }

  // Extra address hints captured in LocationStep
  buildingName?: string
  floor?: string
  landmark?: string
  instructions?: string
}

interface CompleteHotelListingFlowProps {
  onComplete?: (data: Partial<HotelData>) => void
  onBack: () => void
  onSaveAndExit?: (data: Partial<HotelData>) => void
  initialPropertyType?: string
  initialData?: Partial<HotelData>
  initialDraftId?: string
}

// Calculate which step to start on based on completed data
function calculateStartingStep(data?: Partial<HotelData>): number {
  if (!data) return 1

  // Step 1: Property Type
  if (!data.propertyType) return 1

  // Step 2: Property Details (hotelName, description, etc.)
  if (!data.hotelName || !data.description) return 2

  // Step 3: Location
  if (!data.location?.address) return 3

  // Step 4: Amenities
  if (!data.amenities || data.amenities.length === 0) return 4

  // Step 5: Rooms
  if (!data.rooms || data.rooms.length === 0) return 5

  // Step 6: Policies
  if (!data.policies) return 6

  // Step 7: Photos
  if (!data.photos?.propertyPhotos || data.photos.propertyPhotos.length === 0) return 7

  // Step 8: Services (optional, skip to review if empty)
  if (!data.services) return 8

  // Step 9: Review
  return 9
}

// Calculate completed steps based on data
function calculateCompletedSteps(data?: Partial<HotelData>): number[] {
  if (!data) return []

  const completed: number[] = []

  if (data.propertyType) completed.push(1)
  if (data.hotelName && data.description) completed.push(2)
  if (data.location?.address) completed.push(3)
  if (data.amenities && data.amenities.length > 0) completed.push(4)
  if (data.rooms && data.rooms.length > 0) completed.push(5)
  if (data.policies) completed.push(6)
  if (data.photos?.propertyPhotos && data.photos.propertyPhotos.length > 0) completed.push(7)
  if (data.services) completed.push(8)

  return completed
}

export default function CompleteHotelListingFlow({
  onComplete,
  onBack,
  onSaveAndExit,
  initialPropertyType,
  initialData,
  initialDraftId,
}: CompleteHotelListingFlowProps) {
  const [currentStep, setCurrentStep] = useState(calculateStartingStep(initialData))
  const [completedSteps, setCompletedSteps] = useState<number[]>(
    calculateCompletedSteps(initialData),
  )
  const [hotelData, setHotelData] = useState<StepData>(
    initialData || {
      propertyType: initialPropertyType || '',
      amenities: [],
      rooms: [],
      policies: undefined,
      photos: { propertyPhotos: [] },
      services: undefined,
    },
  )
  const [isPublishing, setIsPublishing] = useState(false)
  // Latches true after a successful publish and never resets, so the Publish button cannot fire
  // twice even in the moment before we navigate away.
  const [isPublished, setIsPublished] = useState(false)
  // The hotels row this flow has already created. Set on the first publish attempt — including one
  // that later throws — so a retry UPDATEs that row instead of inserting a second hotel. A ref, not
  // state: the retry reads it in the same handler, and it must not trigger a render.
  const publishedRowIdRef = useRef<string | undefined>(initialDraftId)
  const { user } = useAuth()

  const steps: Step[] = [
    {
      id: 1,
      title: 'Property Type',
      description: 'What type of property are you listing?',
      component: PropertyTypeStep,
      completed: completedSteps.includes(1),
      required: true,
    },
    {
      id: 2,
      title: hotelData.propertyType ? `${hotelData.propertyType} Details` : 'Property Details',
      description: 'Tell us about your property',
      component: PropertyDetailsStep,
      completed: completedSteps.includes(2),
      required: true,
    },
    {
      id: 3,
      title: 'Location Details',
      description: 'Where is your property located?',
      component: LocationStep,
      completed: completedSteps.includes(3),
      required: true,
    },
    {
      id: 4,
      title: 'Amenities & Features',
      description: 'What facilities do you offer?',
      component: AmenitiesStep,
      completed: completedSteps.includes(4),
      required: true,
    },
    {
      id: 5,
      title: 'Room Types & Pricing',
      description: 'Configure your room types',
      component: RoomsStep,
      completed: completedSteps.includes(5),
      required: true,
    },
    {
      id: 6,
      title: 'Policies & Rules',
      description: 'Set your property policies',
      component: PoliciesStep,
      completed: completedSteps.includes(6),
      required: true,
    },
    {
      id: 7,
      title: 'Photos & Media',
      description: 'Showcase your property',
      component: PhotosStep,
      completed: completedSteps.includes(7),
      required: true,
    },
    {
      id: 8,
      title: 'Additional Services',
      description: 'Extra services and accessibility',
      component: ServicesStep,
      completed: completedSteps.includes(8),
      required: false,
    },
    {
      id: 9,
      title: 'Review & Publish',
      description: 'Review your listing before going live',
      component: ReviewStep,
      completed: completedSteps.includes(9),
      required: true,
    },
  ]

  const getCurrentStepIcon = (stepId: number, size: number = 56) => {
    const isActive = currentStep === stepId

    // For step 1, show the property type selection icon
    if (stepId === 1) {
      return <PropertyTypeIcon isSelected={isActive} size={size} />
    }

    // For all other steps (2-9), show the premium 3D property vector
    const propertyType = hotelData.propertyType || 'hotel'
    return (
      <motion.div
        key={`${propertyType}-${stepId}`}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 10 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
      >
        <PremiumPropertyVector propertyType={propertyType as any} size={size * 1.8} />
      </motion.div>
    )
  }

  const handleStepComplete = (stepId: number, data: any) => {
    // Update hotel data
    setHotelData((prev) => ({ ...prev, ...data }))

    // Mark step as completed
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId])
    }

    // Special handling for Room Summary step (step 9)
    // If "addAnother" is true, go back to step 5 (Room Basic Info) to add another room
    if (stepId === 9 && data.addAnother) {
      setCurrentStep(5)
      return
    }

    // Move to next step or complete
    if (stepId < steps.length) {
      setCurrentStep(stepId + 1)
    } else {
      // All steps completed
      onComplete?.({ ...hotelData, ...data } as HotelData)
    }
  }

  const handleSaveAndExit = () => {
    // Deliberately does NOT call onComplete. Saving a draft is not completing the flow, and
    // onComplete now navigates away with replace:true — firing it here would unmount the wizard
    // before saveDraft resolves and regardless of whether it succeeded, so a failed save would
    // strand the manager on the dashboard with their work gone and no way back. The owner of
    // onSaveAndExit navigates on the success branch itself.
    if (onSaveAndExit) {
      onSaveAndExit(hotelData)
    } else {
      onBack()
    }
  }

  const handlePublish = async () => {
    // Hard guard against double-submit: every extra click used to INSERT another hotel + rooms.
    if (isPublishing || isPublished) return

    if (!user?.id) {
      toast.error('You must be logged in to publish. Please log in and try again.')
      return
    }

    setIsPublishing(true)

    try {
      // Pass the draft id so republishing updates that row instead of creating a new one.
      // On a retry, publishedRowIdRef holds the row the previous attempt created — without it the
      // retry would take the INSERT branch again and duplicate the hotel, which is the whole bug.
      await hotelService.publishListing(hotelData, user.id, publishedRowIdRef.current, (hotelId) => {
        publishedRowIdRef.current = hotelId
      })
      setIsPublished(true)
      toast.success('Your hotel listing has been published successfully.')
      onComplete?.(hotelData)
    } catch (error) {
      console.error('Publish error:', error)
      toast.error(
        `Failed to publish hotel: ${error instanceof Error ? error.message : 'Please try again.'}`,
      )
      // Only re-enable on failure. On success the button stays dead until we navigate away —
      // re-enabling in `finally` is exactly what let the duplicate clicks through.
      setIsPublishing(false)
    }
  }

  const currentStepData = steps.find((step) => step.id === currentStep)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Save and Exit Button - Top Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-4 py-3"
      >
        <Button
          variant="ghost"
          onClick={handleSaveAndExit}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 group"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-medium">Save & Exit</span>
        </Button>
      </motion.div>

      {/* Scrollable Step Content */}
      <div className="flex-1 overflow-y-auto pb-64 px-4 py-6">
        <AnimatePresence mode="wait">
          {currentStepData && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-2xl mx-auto">
                {/* Step Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.1,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="mb-4 flex justify-center"
                  >
                    {getCurrentStepIcon(currentStep, 72)}
                  </motion.div>
                  <motion.h1
                    className="text-2xl font-semibold text-gray-900 mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {currentStepData.title}
                  </motion.h1>
                  <motion.p
                    className="text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {currentStepData.description}
                  </motion.p>
                </div>

                {/* Step Component */}
                <currentStepData.component
                  onComplete={(data: any) => handleStepComplete(currentStep, data)}
                  isCompleted={completedSteps.includes(currentStep)}
                  existingData={hotelData}
                  onUpdate={(data: any) => {
                    console.log('🏨 CompleteHotelListingFlow: onUpdate called with', data)
                    const updatedData = { ...hotelData, ...data }
                    console.log('🏨 CompleteHotelListingFlow: Updated hotelData', updatedData)
                    console.log(
                      '🏨 CompleteHotelListingFlow: Coordinates:',
                      updatedData.coordinates,
                    )
                    setHotelData(updatedData)
                  }}
                  onBack={currentStep === 1 ? onBack : () => setCurrentStep(currentStep - 1)}
                  // Props for ReviewStep
                  data={hotelData}
                  onEditStep={(stepId: number) => setCurrentStep(stepId)}
                  onPublish={handlePublish}
                  // Stays disabled after a successful publish too — we're about to navigate away,
                  // and a re-enabled button here is what produced duplicate hotels.
                  isPublishing={isPublishing || isPublished}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation - Airbnb Style */}
      <AirbnbBottomNav
        currentStep={currentStep}
        totalSteps={steps.length}
        completedSteps={completedSteps.length}
        onBack={() => {
          if (currentStep === 1) {
            onBack() // Exit to dashboard on first step
          } else {
            setCurrentStep(currentStep - 1) // Go to previous step
          }
        }}
        onNext={() => {
          const currentStepData = steps.find((s) => s.id === currentStep)
          // Manually trigger component validation/submission if needed
          // For now, we assume step components update state and we check basic validity
          // In a real app, we might need a ref to trigger submit on the child

          // Temporary automatic progress for demo if data exists
          if (currentStepData?.id === 1 && hotelData.propertyType) {
            handleStepComplete(1, { propertyType: hotelData.propertyType })
          } else if (currentStepData?.id === 2 && hotelData.hotelName) {
            handleStepComplete(2, { hotelName: hotelData.hotelName })
          } else if (currentStepData?.id === 3 && hotelData.coordinates) {
            handleStepComplete(3, { coordinates: hotelData.coordinates })
          } else if (
            currentStepData?.id === 4 &&
            hotelData.amenities &&
            hotelData.amenities.length > 0
          ) {
            handleStepComplete(4, { amenities: hotelData.amenities })
          } else if (currentStep < steps.length) {
            // For placeholder steps
            setCurrentStep(currentStep + 1)
          }
        }}
        showBack={true}
        showNext={currentStep < steps.length}
        backLabel="Back"
        nextLabel={currentStep === steps.length ? 'Publish' : 'Next'}
        nextDisabled={
          (currentStep === 1 && !hotelData.propertyType) ||
          (currentStep === 2 &&
            (!hotelData.hotelName || !hotelData.description || !hotelData.contactEmail)) ||
          (currentStep === 3 && !hotelData.coordinates) ||
          (currentStep === 4 && (!hotelData.amenities || hotelData.amenities.length === 0)) ||
          (currentStep === 5 && (!hotelData.rooms || hotelData.rooms.length === 0)) ||
          (currentStep === 6 && !hotelData.policies) ||
          (currentStep === 7 &&
            (!hotelData.photos?.propertyPhotos || hotelData.photos.propertyPhotos.length < 5))
        }
      />
    </div>
  )
}
