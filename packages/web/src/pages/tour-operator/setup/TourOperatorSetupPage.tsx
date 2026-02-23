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
  const { user, activeRole } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Handle deep linking to specific steps
  useEffect(() => {
    const stepId = searchParams.get('step')
    if (!stepId) return
    const idx = STEPS.findIndex((s) => s.id === stepId)
    if (idx >= 0) setCurrentStep(idx)
  }, [searchParams])

  // Scroll to top whenever the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentStep])

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
    async (dataToSave: any, isFinal: boolean = false, stepIndex?: number): Promise<boolean> => {
      if (!user?.id) return false
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
        return true
      } catch (error) {
        console.error('Error saving progress:', error)
        toast.error('Failed to save progress')
        return false
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

  /** Where to land after leaving the setup wizard */
  const exitDestination =
    activeRole?.role_type === 'tour_operator' ? '/operator/dashboard' : '/'

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate(exitDestination)
    }
  }

  const handleSaveAndExit = async () => {
    const saved = await saveProgress(setupData, false, currentStep)
    if (saved) toast.success('Progress saved — you can resume anytime')
    // Always navigate — don't trap the user on the page if save fails
    navigate(exitDestination)
  }

  const updateData = (data: any) => {
    setSetupData((prev: any) => ({ ...prev, ...data }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-5"
        >
          <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-lg">
            <Plane className="w-7 h-7 text-primary" />
          </div>
          <p className="text-muted-foreground font-semibold tracking-widest text-sm uppercase">
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30 ring-2 ring-primary/20">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-black text-foreground tracking-tight text-sm leading-none">
                TripAvail
              </h1>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-0.5">
                Operator Setup
              </p>
            </div>
          </div>

          {!isCompletionStep && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 rounded-xl h-9 px-4 font-semibold transition-all"
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
        <div className="max-w-2xl mx-auto w-full px-6 pt-5 pb-1">
          <div className="flex gap-1.5 mb-2">
            {STEPS.slice(0, STEPS.length - 1).map((step, i) => (
              <div
                key={step.id}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < currentStep
                    ? 'bg-primary shadow-sm shadow-primary/30'
                    : i === currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              {STEPS[currentStep].title}
            </p>
            <p className="text-muted-foreground/70 text-[10px] font-semibold">
              {currentStep + 1} of {STEPS.length - 1}
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
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
              <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-xl overflow-hidden">
                <div className="p-8">
                  <CurrentStepComponent onNext={handleNext} onUpdate={updateData} data={setupData} />
                </div>

                {/* Inline footer navigation */}
                {!isCompletionStep && (
                  <div className="px-8 pb-8 flex items-center justify-between gap-4 border-t border-border/50 pt-6">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl h-12 px-6 font-semibold transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1.5" />
                      {currentStep === 0 ? 'Dashboard' : 'Back'}
                    </Button>

                    <Button
                      onClick={handleNext}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20 flex-1 max-w-[220px] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
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
