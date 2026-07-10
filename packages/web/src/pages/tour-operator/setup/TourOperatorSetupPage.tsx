import { ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { RoleBasedDrawer } from '@/components/navigation/RoleBasedDrawer'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Button } from '@/components/ui/button'
import {
  TourOperatorOnboardingData,
  tourOperatorService,
} from '@/features/tour-operator/services/tourOperatorService'
import { useOperatorCommercialGate } from '@/features/tour-operator/hooks/useOperatorCommercialGate'
import { SETUP_STEP_SLUGS, type SetupStepSlug } from '@/features/tour-operator/constants/setupSteps'
import { celebrateStage } from '@/features/wizard/celebrateStage'
import { SubStepProgress } from '@/features/wizard/SubStepProgress'
import { WizardScreen } from '@/features/wizard/WizardScreen'
import { useSubStepFlow } from '@/features/wizard/useSubStepFlow'
import type { SubStepDef } from '@/features/wizard/types'

import { SETUP_SUB_STEPS } from './subSteps'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

import { BusinessInfoStep, registrationNumberError } from './components/BusinessInfoStep'
import { CompletionStep } from './components/CompletionStep'
import { LockedSetupView } from './components/LockedSetupView'
import { CoverageAreaStep } from './components/CoverageAreaStep'
import { FleetStep } from './components/FleetStep'
import { GuidesStep } from './components/GuidesStep'
import { PersonalInfoStep } from './components/PersonalInfoStep'
import { PoliciesStep } from './components/PoliciesStep'
import { ProfilePictureStep } from './components/ProfilePictureStep'
import { ServicesStep } from './components/ServicesStep'
import { WelcomeStep } from './components/WelcomeStep'

const STEPS: Array<{ id: SetupStepSlug; title: string; component: any }> = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'personal', title: 'Personal Info', component: PersonalInfoStep },
  { id: 'profile-pic', title: 'Profile Picture', component: ProfilePictureStep },
  { id: 'business', title: 'Business Info', component: BusinessInfoStep },
  { id: 'services', title: 'Tour Services', component: ServicesStep },
  { id: 'coverage', title: 'Coverage Area', component: CoverageAreaStep },
  { id: 'fleet', title: 'Fleet & Vehicles', component: FleetStep },
  { id: 'guides', title: 'Meet Your Guides', component: GuidesStep },
  { id: 'policies', title: 'Policies', component: PoliciesStep },
  { id: 'completion', title: 'Complete', component: CompletionStep },
]

// The dashboard turns a saved step index into a deep link using SETUP_STEP_SLUGS. If these two
// ever diverge again, "Resume Setup" silently lands the operator on the wrong step — so fail loudly.
if (import.meta.env.DEV) {
  const drift = STEPS.map((s) => s.id).join(',') !== SETUP_STEP_SLUGS.join(',')
  if (drift) {
    throw new Error(
      'Setup wizard STEPS no longer match SETUP_STEP_SLUGS. Update features/tour-operator/constants/setupSteps.ts.',
    )
  }
}

export default function TourOperatorSetupPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [setupData, setSetupData] = useState<Partial<TourOperatorOnboardingData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  // Furthest step the operator has reached — the progress bar lets them jump back to any
  // already-visited step, but not skip ahead past steps they haven't validated yet.
  const [maxStepReached, setMaxStepReached] = useState(0)
  const { user, activeRole } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // Same tier gate the tour-creation wizard reads, so a feature (e.g. Google Maps) doesn't
  // appear to work during onboarding and then vanish once the operator starts creating tours.
  const commercialGate = useOperatorCommercialGate(user?.id)

  // Handle deep linking to specific steps (and, optionally, a sub-step within them)
  useEffect(() => {
    const stepId = searchParams.get('step')
    if (!stepId) return
    const idx = STEPS.findIndex((s) => s.id === stepId)
    if (idx >= 0) setCurrentStep(idx)
  }, [searchParams])

  /**
   * The sub-step index lives in the URL rather than the database: `setup_current_step` stores the
   * STAGE, and adding a column would need a migration for something a query param already survives
   * (reload, back button, and the dashboard's "Resume Setup" deep link).
   */
  const subStepFromUrl = Math.max(0, Number(searchParams.get('sub') ?? 0) || 0)

  /**
   * Writes BOTH the stage and the sub-step. Writing only the sub-step used to leave a stale
   * `?step=` behind, which the deep-link effect above would then replay — bouncing the operator
   * back to the stage they had just left.
   */
  const syncUrl = useCallback(
    (stageIndex: number, subIndex: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('step', STEPS[stageIndex]?.id ?? 'welcome')
          if (subIndex > 0) next.set('sub', String(subIndex))
          else next.delete('sub')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // Scroll to top whenever the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentStep])

  // Remember the furthest step visited (covers resume + deep-link + normal advance)
  useEffect(() => {
    setMaxStepReached((m) => Math.max(m, currentStep))
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
        // If setup is already completed, show the locked read-only view
        const { data: profile } = await supabase
          .from('tour_operator_profiles')
          .select('setup_completed')
          .eq('user_id', user.id)
          .maybeSingle()
        if (profile?.setup_completed === true) {
          const fullData = await tourOperatorService.getOnboardingData(user.id)
          if (fullData) setSetupData(fullData)
          setIsLocked(true)
          setIsLoading(false)
          return
        }

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

  /** Required-field check for the current step — the wizard previously advanced even with
   * starred fields empty. Only enforces fields visibly marked required (*) in each step. */
  const stepValidationError = (stepId: string): string | null => {
    const d = setupData as any
    switch (stepId) {
      case 'personal': {
        const p = d.personalInfo || {}
        if (!p.operatorName?.trim()) return 'Please enter your full name before continuing.'
        if (!p.phone?.trim()) return 'Please add your phone number before continuing.'
        return null
      }
      case 'business': {
        const b = d.businessInfo || {}
        if (!b.businessName?.trim())
          return 'Please enter your registered business name before continuing.'
        const regError = registrationNumberError(b.registrationNumber)
        if (regError) return regError
        return null
      }
      case 'coverage': {
        const c = d.coverage || {}
        if (!c.primaryLocation?.trim())
          return 'Please enter your primary operating city before continuing.'
        return null
      }
      default:
        return null
    }
  }

  /** Where to land after leaving the setup wizard */
  const exitDestination =
    activeRole?.role_type === 'tour_operator' ? '/operator/dashboard' : '/'

  const stageId = STEPS[currentStep].id
  const stageSubSteps = useMemo<SubStepDef<any>[]>(
    () =>
      SETUP_SUB_STEPS[stageId] ?? [
        { id: 'main', title: STEPS[currentStep].title },
      ],
    [stageId, currentStep],
  )

  const advanceStage = useCallback(async () => {
    const nextStep = currentStep + 1
    const isFinal = currentStep === STEPS.length - 2
    await saveProgress(setupData, isFinal, isFinal ? 0 : nextStep)
    if (currentStep < STEPS.length - 1) {
      syncUrl(nextStep, 0)
      setCurrentStep(nextStep)
    }
  }, [currentStep, setupData, saveProgress, syncUrl])

  const retreatStage = useCallback(() => {
    if (currentStep > 0) {
      syncUrl(currentStep - 1, 0)
      setCurrentStep(currentStep - 1)
    } else {
      navigate(exitDestination)
    }
  }, [currentStep, navigate, exitDestination, syncUrl])

  const flow = useSubStepFlow<any>({
    subSteps: stageSubSteps,
    data: setupData,
    initialIndex: subStepFromUrl,
    onIndexChange: (index) => syncUrl(currentStep, index),
    // Within a stage, Continue never blocks. Leaving the stage does: setup collects the identity
    // and consent a marketplace legally needs, so we walk the operator to the missing field
    // instead of letting an incomplete profile through.
    onExitForward: () => {
      if (flowRef.current?.hasOutstandingIssues) {
        flowRef.current.jumpToFirstIssue()
        toast.error('Please complete the highlighted field before continuing.')
        return
      }
      // Backstop: the page has had a per-stage rule since before sub-steps existed.
      const validationError = stepValidationError(STEPS[currentStep].id)
      if (validationError) {
        toast.error(validationError)
        return
      }
      celebrateStage(STEPS[currentStep].title, STEPS.length - 1 - currentStep)
      void advanceStage()
    },
    onExitBack: retreatStage,
  })

  const flowRef = useRef<typeof flow | null>(null)
  flowRef.current = flow

  /** Continue: advance one screen, or leave the stage from the last one. */
  const handleNext = () => flow.goNext()

  /** Back: retreat one screen, or leave the stage from the first one. */
  const handleBack = () => flow.goBack()

  /** Jump straight to a step by tapping the progress bar — only to steps already reached. */
  const goToStep = (index: number) => {
    if (index === currentStep || index > maxStepReached) return
    syncUrl(index, 0)
    setCurrentStep(index)
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
          <img
            src="/brand/logo-emblem-256.png"
            alt=""
            width={56}
            height={56}
            className="block h-14 w-14 rounded-2xl shadow-lg"
          />
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
  const hideHeaderActions = isCompletionStep || isLocked

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/brand/logo-emblem-256.png"
              alt=""
              width={36}
              height={36}
              className="block h-9 w-9 shrink-0 rounded-[8px]"
            />
            <div className="min-w-0">
              <h1
                className="text-lg leading-none tracking-tight"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600 }}
              >
                <span className="text-foreground">trip</span>
                <span className="text-primary">avail</span>
              </h1>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">
                {isLocked ? 'Operator Profile' : 'Operator Setup'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!hideHeaderActions && (
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
                <span className="hidden sm:inline">Save &amp; Exit</span>
              </Button>
            )}
            <ThemeToggle />
            <RoleBasedDrawer />
          </div>
        </div>
      </div>

      {/* Step progress bar */}
      {!isCompletionStep && !isLocked && (
        <div className="max-w-2xl mx-auto w-full px-6 pt-5 pb-1">
          <div className="flex gap-1.5 mb-2">
            {STEPS.slice(0, STEPS.length - 1).map((step, i) => {
              const reached = i <= maxStepReached
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(i)}
                  disabled={!reached}
                  aria-label={`Go to ${step.title}`}
                  aria-current={i === currentStep ? 'step' : undefined}
                  title={reached ? step.title : undefined}
                  className={`group flex-1 py-2.5 -my-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    reached ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span
                    className={`block h-1 rounded-full transition-all duration-300 ${
                      i < currentStep
                        ? 'bg-primary shadow-sm shadow-primary/30 group-hover:brightness-110'
                        : i === currentStep
                          ? 'bg-primary/50 group-hover:bg-primary/70'
                          : 'bg-muted'
                    } ${reached ? 'group-hover:h-1.5' : ''}`}
                  />
                </button>
              )
            })}
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
                  {isLocked ? (
                    <LockedSetupView data={setupData} onEdit={() => setIsLocked(false)} />
                  ) : (
                    flow.total <= 1 ? (
                      <CurrentStepComponent
                        onNext={handleNext}
                        onUpdate={updateData}
                        data={setupData}
                        subStep={0}
                        allowGoogleMaps={commercialGate.googleMapsEnabled}
                      />
                    ) : (
                    <>
                      <SubStepProgress
                        stageTitle={STEPS[currentStep].title}
                        index={flow.index}
                        total={flow.total}
                        issueIndices={Object.entries(flow.issuesByIndex)
                          .filter(([, issues]) => issues.length > 0)
                          .map(([index]) => Number(index))}
                        onSelect={(index) => flow.goTo(index)}
                        className="mb-6"
                      />

                      {/* The page owns Back/Continue, so the screen shell renders only its heading
                          and error summary — two footers would be worse than one. */}
                      <WizardScreen
                        index={flow.index}
                        total={flow.total}
                        title={flow.current.title}
                        description={flow.current.description}
                        issues={flow.issues}
                        showIssues={flow.showIssues}
                        onIssueClick={flow.focusField}
                        onBack={handleBack}
                        onNext={handleNext}
                        hideFooter
                      >
                        <CurrentStepComponent
                          onNext={handleNext}
                          onUpdate={updateData}
                          data={setupData}
                          subStep={flow.index}
                          allowGoogleMaps={commercialGate.googleMapsEnabled}
                        />
                      </WizardScreen>
                    </>
                    )
                  )}
                </div>

                {/* Inline footer navigation */}
                {!isCompletionStep && !isLocked && (
                  <div className="px-8 pb-8 flex items-center justify-between gap-4 border-t border-border/50 pt-6">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl h-12 px-6 font-semibold transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1.5" />
                      {currentStep === 0 && flow.isFirst ? 'Dashboard' : 'Back'}
                    </Button>

                    <Button
                      onClick={handleNext}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20 flex-1 max-w-[220px] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      {isLastContentStep && flow.isLast ? 'Finish Setup' : 'Continue'}
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
