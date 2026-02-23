import { ChevronLeft, ChevronRight, Loader2, Plane, Save } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  TourOperatorOnboardingData,
  tourOperatorService,
} from '@/features/tour-operator/services/tourOperatorService'
import { useAuth } from '@/hooks/useAuth'

import { BusinessInfoStep } from './components/BusinessInfoStep'
import { CompletionStep } from './components/CompletionStep'
import { CoverageAreaStep } from './components/CoverageAreaStep'
import { PersonalInfoStep } from './components/PersonalInfoStep'
import { PoliciesStep } from './components/PoliciesStep'
import { ProfilePictureStep } from './components/ProfilePictureStep'
import { ServicesStep } from './components/ServicesStep'
import { WelcomeStep } from './components/WelcomeStep'

const STEPS = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'personal', title: 'Personal Info', component: PersonalInfoStep },
  { id: 'profile-pic', title: 'Profile Picture', component: ProfilePictureStep },
  { id: 'business', title: 'Business Info', component: BusinessInfoStep },
  { id: 'services', title: 'Tour Services', component: ServicesStep },
  { id: 'coverage', title: 'Coverage Area', component: CoverageAreaStep },
  { id: 'policies', title: 'Policies', component: PoliciesStep },
  { id: 'completion', title: 'Complete', component: CompletionStep },
]

export default function TourOperatorSetupPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [setupData, setSetupData] = useState<Partial<TourOperatorOnboardingData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Handle deep linking to specific steps
  useEffect(() => {
    const stepId = searchParams.get('step')
    if (!stepId) return
    const idx = STEPS.findIndex((s) => s.id === stepId)
    if (idx >= 0) setCurrentStep(idx)
  }, [searchParams])

  // Enforce Tour Operator theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'tour_operator')
    return () => {
      // Revert will be handled by App.tsx base on auth state,
      // but we can be explicit if we wanted to.
    }
  }, [])

  // Load existing data + resume step on mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user?.id) return
      try {
        const data = await tourOperatorService.getOnboardingData(user.id)
        if (data) {
          setSetupData(data)
          // Resume from last saved step unless deep-link overrides it
          const urlStep = searchParams.get('step')
          if (!urlStep && typeof data.setupCurrentStep === 'number' && data.setupCurrentStep > 0) {
            setCurrentStep(data.setupCurrentStep)
          }
        }
      } catch (error) {
        console.error('Error loading onboarding data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadExistingData()
  }, [user?.id])

  const saveProgress = useCallback(
    async (dataToSave: any, isFinal: boolean = false, stepIndex?: number) => {
      if (!user?.id) return
      setIsSaving(true)
      try {
        await tourOperatorService.saveOnboardingData(
          user.id,
          dataToSave,
          isFinal,
          stepIndex ?? currentStep,
        )
        if (isFinal) {
          toast.success('Onboarding completed!')
        }
      } catch (error) {
        console.error('Error saving progress:', error)
        toast.error('Failed to save progress')
      } finally {
        setIsSaving(false)
      }
    },
    [user?.id, currentStep],
  )

  const handleNext = async () => {
    const nextStep = currentStep + 1
    const isFinal = currentStep === STEPS.length - 2
    // Save data + the step we're advancing TO so resume lands on the right step
    await saveProgress(setupData, isFinal, isFinal ? 0 : nextStep)

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(nextStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate('/operator/dashboard')
    }
  }

  const handleSaveAndExit = async () => {
    // Persist current step index so wizard resumes here
    await saveProgress(setupData, false, currentStep)
    toast.success('Progress saved — you can resume anytime')
    navigate('/operator/dashboard')
  }

  const updateData = (data: any) => {
    setSetupData((prev: any) => ({ ...prev, ...data }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-red-950/30 to-gray-950 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 flex flex-col items-center gap-5"
        >
          <div className="w-16 h-16 bg-primary/20 backdrop-blur-xl border border-primary/30 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20">
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <p className="text-white/60 font-semibold tracking-widest text-sm uppercase">
            Loading your profile…
          </p>
        </motion.div>
      </div>
    )
  }

  const CurrentStepComponent = STEPS[currentStep].component
  const isLastContentStep = currentStep === STEPS.length - 2
  const isCompletionStep = currentStep === STEPS.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-red-950/30 to-gray-950 relative overflow-hidden flex flex-col">
      {/* Decorative floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary/25 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-primary/8 rounded-full blur-[80px]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Top Nav Header */}
      <div className="sticky top-0 z-40 bg-white/[0.04] backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40 ring-2 ring-primary/20">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-white tracking-tight text-sm leading-none">
                TripAvail
              </h1>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                Operator Setup
              </p>
            </div>
          </div>

          {!isCompletionStep && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10 border border-white/15 rounded-xl h-9 px-4 font-semibold transition-all"
              onClick={handleSaveAndExit}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-2" />
              )}
              Save & Exit
            </Button>
          )}
        </div>
      </div>

      {/* Step progress bar */}
      {!isCompletionStep && (
        <div className="max-w-2xl mx-auto w-full px-6 pt-5 pb-1 relative z-10">
          <div className="flex gap-1.5 mb-2">
            {STEPS.slice(0, STEPS.length - 1).map((step, i) => (
              <div
                key={step.id}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < currentStep
                    ? 'bg-primary shadow-sm shadow-primary/50'
                    : i === currentStep
                      ? 'bg-primary/60'
                      : 'bg-white/15'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
              {STEPS[currentStep].title}
            </p>
            <p className="text-white/35 text-[10px] font-semibold">
              {currentStep + 1} of {STEPS.length - 1}
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-2xl mx-auto w-full px-6 py-6 pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.99 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {/* Glass card shell */}
              <div className="rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="p-8">
                  <CurrentStepComponent onNext={handleNext} onUpdate={updateData} data={setupData} />
                </div>

                {/* Inline footer navigation */}
                {!isCompletionStep && (
                  <div className="px-8 pb-8 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-12 px-6 font-semibold transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1.5" />
                      {currentStep === 0 ? 'Dashboard' : 'Back'}
                    </Button>

                    <Button
                      onClick={handleNext}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/30 flex-1 max-w-[220px] transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      {isLastContentStep ? 'Finish Setup' : 'Continue'}
                      {!isSaving && <ChevronRight className="w-4 h-4 ml-1.5" />}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
