import { Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { supabase } from '@tripavail/shared/core/client'
import { Tour, tourService } from '@/features/tour-operator/services/tourService'
import { useAuth } from '@/hooks/useAuth'

import { TourBasicsStep } from './components/TourBasicsStep'
import { TourDetailsStep } from './components/TourDetailsStep'
import { TourItineraryStep } from './components/TourItineraryStep'
import { TourMediaStep } from './components/TourMediaStep'
import { TourPricingStep } from './components/TourPricingStep'
import { TourReviewStep } from './components/TourReviewStep'
import { TourSchedulingStep } from './components/TourSchedulingStep'

const STEPS = [
  { id: 'basics', title: 'Basics', component: TourBasicsStep },
  { id: 'media', title: 'Media', component: TourMediaStep },
  { id: 'itinerary', title: 'Itinerary', component: TourItineraryStep },
  { id: 'details', title: 'Requirements', component: TourDetailsStep },
  { id: 'pricing', title: 'Pricing & Policies', component: TourPricingStep },
  { id: 'scheduling', title: 'Dates & Availability', component: TourSchedulingStep },
  { id: 'review', title: 'Review', component: TourReviewStep },
]

export default function CreateTourPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const { id: routeTourId } = useParams() // Capture path param
  const [currentStep, setCurrentStep] = useState(0)
  const [tourData, setTourData] = useState<Partial<Tour>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [gateLoading, setGateLoading] = useState(true)

  // Support both ?tour_id= and /edit/:id
  const tourIdToEdit = useMemo(() => {
    if (routeTourId) return routeTourId
    const raw = searchParams.get('tour_id')
    return raw && raw.trim().length > 0 ? raw.trim() : null
  }, [searchParams, routeTourId])

  useEffect(() => {
    const checkSetup = async () => {
      if (!user?.id) {
        setGateLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('tour_operator_profiles')
          .select('setup_completed')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        if (data?.setup_completed !== true) {
          toast.error('Complete Tour Operator Setup before creating tours')
          navigate('/operator/setup', { replace: true })
          return
        }
      } catch (e) {
        console.error('[CreateTourPage] Failed to check setup completion', e)
        toast.error('Unable to verify setup status')
        navigate('/operator/setup', { replace: true })
        return
      } finally {
        setGateLoading(false)
      }
    }

    checkSetup()
  }, [navigate, user?.id])

  useEffect(() => {
    const loadTourForEdit = async () => {
      if (!user?.id || !tourIdToEdit) return
      try {
        setIsSaving(true)
        const existing = await tourService.getOperatorTourById(user.id, tourIdToEdit)
        setTourData(existing)
      } catch (error) {
        console.error('Error loading tour for edit:', error)
        toast.error('Failed to load tour for editing')
      } finally {
        setIsSaving(false)
      }
    }

    loadTourForEdit()
    // Only load when switching to a new id
  }, [user?.id, tourIdToEdit])

  if (gateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium tracking-tight">
            Checking setup status...
          </p>
        </div>
      </div>
    )
  }

  const handleUpdate = (data: Partial<Tour>) => {
    setTourData((prev) => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    } else {
      navigate('/operator/dashboard')
    }
  }

  const handlePublish = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      // Clean up and ensure required fields
      const dataToSave: any = {
        ...tourData,
        operator_id: user.id,
        is_active: true,
        is_published: true,
        is_verified: false, // Default for new tours
        is_featured: false, // Default for new tours
      }

      // Prevent accidental primary key overwrite during updates
      delete dataToSave.id

      // Remove any legacy fields that might cause schema mismatch
      if ((dataToSave as any).difficulty) {
        delete (dataToSave as any).difficulty
      }

      if (tourIdToEdit) {
        await tourService.updateTour(tourIdToEdit, dataToSave)
        toast.success('Tour updated successfully!')
      } else {
        await tourService.createTour(dataToSave)
        toast.success('Tour published successfully!')
      }

      navigate('/operator/dashboard')
    } catch (error) {
      console.error('Error publishing tour:', error)
      toast.error('Failed to publish tour. Please check all fields.')
    } finally {
      setIsSaving(false)
    }
  }

  const CurrentStepComponent = STEPS[currentStep].component

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground">Create New Tour</h1>
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}:{' '}
            <span className="font-medium text-foreground">{STEPS[currentStep].title}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-background rounded-lg shadow-sm border border-border p-8"
          >
            <CurrentStepComponent
              data={tourData}
              onUpdate={handleUpdate}
              onNext={handleNext}
              onBack={handleBack}
              onPublish={handlePublish}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Simple Overlay Loader */}
      {isSaving && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <span className="mt-2 font-medium text-muted-foreground">
              {tourIdToEdit ? 'Loading/Updating...' : 'Publishing...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
