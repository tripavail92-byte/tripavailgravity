import { AlertCircle, AlertTriangle, BookmarkCheck, Loader2, LogOut, Send } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getMembershipTierConfig, type MembershipTierCode } from '@tripavail/shared/commercial/engine'

import { supabase } from '@/lib/supabase'
import {
  Tour,
  calculateCompletionPercentage,
  tourService,
} from '@/features/tour-operator/services/tourService'
import { hasCompletedTourOperatorSetup } from '@/features/tour-operator/utils/operatorAccess'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { commercialService } from '@/features/commercial/services/commercialService'

import { TourBasicsStep } from './components/TourBasicsStep'
import { TourDetailsStep } from './components/TourDetailsStep'
import { TourItineraryStep } from './components/TourItineraryStep'
import { TourMediaStep } from './components/TourMediaStep'
import { TourPricingStep } from './components/TourPricingStep'
import { TourReviewStep } from './components/TourReviewStep'
import { getTourPricingPromoDraft, validateTourPricingPromoDraft } from './promoDraft'
import { deriveStepWorkflow, StepId } from './stepWorkflow'

const LazyTourPickupLocationsStep = lazy(() =>
  import('./components/TourPickupLocationsStep').then((m) => ({
    default: m.TourPickupLocationsStep,
  })),
)

const STEPS: Array<{ id: StepId; title: string; component: any }> = [
  { id: 'basics', title: 'Basics', component: TourBasicsStep },
  { id: 'pickup', title: 'Pickup Locations', component: LazyTourPickupLocationsStep },
  { id: 'itinerary', title: 'Itinerary', component: TourItineraryStep },
  { id: 'pricing', title: 'Pricing & Policies', component: TourPricingStep },
  { id: 'details', title: 'Requirements', component: TourDetailsStep },
  { id: 'media', title: 'Media', component: TourMediaStep },
  { id: 'review', title: 'Review', component: TourReviewStep },
]

const DEFAULT_OPERATOR_RETURN_PATH = '/operator/dashboard'
const OPERATOR_RETURN_PATHS = new Set([
  DEFAULT_OPERATOR_RETURN_PATH,
  '/operator/calendar',
  '/operator/bookings',
])

function getTourMutationErrorMessage(error: unknown, fallbackMessage: string): string {
  const details =
    typeof error === 'object' && error !== null
      ? [
          (error as { message?: string }).message,
          (error as { details?: string }).details,
          (error as { hint?: string }).hint,
        ].filter((value): value is string => Boolean(value))
      : []

  const normalizedMessage = details.join(' ').toLowerCase()

  if (
    normalizedMessage.includes('publish_limit_reached')
    || normalizedMessage.includes('publish limit')
  ) {
    return 'You have reached the maximum number of published trips for your membership tier.'
  }

  if (
    normalizedMessage.includes('minimum_deposit_not_met')
    || (normalizedMessage.includes('deposit') && normalizedMessage.includes('membership'))
  ) {
    return details[1] || details[2] || 'Deposit percentage is below the minimum required for your membership tier.'
  }

  return fallbackMessage
}

export default function CreateTourPage() {
  const navigate = useNavigate()
  const { user, activeRole } = useAuth()
  const [searchParams] = useSearchParams()
  const { id: routeTourId } = useParams() // Capture path param
  const [currentStep, setCurrentStep] = useState(0)
  const [tourData, setTourData] = useState<Partial<Tour>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [gateLoading, setGateLoading] = useState(true)
  // Draft workflow state
  const [currentTourId, setCurrentTourId] = useState<string | null>(null)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showExitModal, setShowExitModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]))
  const [depositTierPolicy, setDepositTierPolicy] = useState(() => {
    const fallback = getMembershipTierConfig('gold')
    return {
      tierCode: fallback.code,
      tierLabel: fallback.label,
      minimumDepositPercent: fallback.minimumDepositPercent,
    }
  })
  const ignoreDirtyRef = useRef(false)
  const didMountDirtyRef = useRef(false)
  const autosaveDebounceRef = useRef<number | null>(null)
  const saveInFlightRef = useRef<Promise<boolean> | null>(null)
  const currentTourIdRef = useRef<string | null>(null)

  // Support both ?tour_id= and /edit/:id
  const tourIdToEdit = useMemo(() => {
    if (routeTourId) return routeTourId
    const raw = searchParams.get('tour_id')
    return raw && raw.trim().length > 0 ? raw.trim() : null
  }, [searchParams, routeTourId])

  const returnPath = useMemo(() => {
    const raw = searchParams.get('returnTo')
    return raw && OPERATOR_RETURN_PATHS.has(raw) ? raw : DEFAULT_OPERATOR_RETURN_PATH
  }, [searchParams])

  useEffect(() => {
    const checkSetup = async () => {
      if (!user?.id) {
        setGateLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('tour_operator_profiles')
          .select(
            'setup_completed, account_status, company_name, contact_person, phone_number, primary_city, categories, verification_documents',
          )
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        if (!hasCompletedTourOperatorSetup(data, activeRole?.verification_status)) {
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
  }, [activeRole?.verification_status, navigate, user?.id])

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    const loadDepositTierPolicy = async () => {
      try {
        const { data, error } = await (supabase.from('operator_commercial_profiles' as any) as any)
          .select('membership_tier_code')
          .eq('operator_user_id', user.id)
          .maybeSingle()

        if (error) throw error

        const tierCode = (data?.membership_tier_code ?? 'gold') as MembershipTierCode
        const tierConfig = getMembershipTierConfig(tierCode)

        if (!cancelled) {
          setDepositTierPolicy({
            tierCode,
            tierLabel: tierConfig.label,
            minimumDepositPercent: tierConfig.minimumDepositPercent,
          })
        }
      } catch (error) {
        console.error('[CreateTourPage] Failed to load commercial tier for deposit policy', error)
        if (!cancelled) {
          const fallback = getMembershipTierConfig('gold')
          setDepositTierPolicy({
            tierCode: fallback.code,
            tierLabel: fallback.label,
            minimumDepositPercent: fallback.minimumDepositPercent,
          })
        }
      }
    }

    void loadDepositTierPolicy()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    const loadTourForEdit = async () => {
      if (!user?.id || !tourIdToEdit) return
      try {
        ignoreDirtyRef.current = true
        setIsSaving(true)
        const existing = await tourService.getOperatorTourById(user.id, tourIdToEdit)
        setTourData(existing)

        // Load pickup locations into draft_data for the Pickup step
        try {
          const { data: pickups, error: pickupError } = await supabase
            .from('tour_pickup_locations')
            .select('*')
            .eq('tour_id', tourIdToEdit)
            .order('created_at', { ascending: true })

          if (pickupError) throw pickupError

          setTourData((prev) => ({
            ...prev,
            draft_data: {
              ...((prev as any)?.draft_data ?? {}),
              pickup_locations: pickups ?? [],
              pickup_locations_count: (pickups ?? []).length,
            },
          }))
        } catch (e) {
          console.error('[CreateTourPage] Failed to load pickup locations', e)
        }

        const workflow = (existing as any)?.draft_data?._workflow
        if (workflow && typeof workflow === 'object') {
          const savedCurrentStep = Number(workflow.currentStep)
          if (Number.isInteger(savedCurrentStep) && savedCurrentStep >= 0 && savedCurrentStep < STEPS.length) {
            setCurrentStep(savedCurrentStep)
          }

          if (Array.isArray(workflow.visitedSteps)) {
            const sanitized = workflow.visitedSteps
              .map((value: unknown) => Number(value))
              .filter((value: number) => Number.isInteger(value) && value >= 0 && value < STEPS.length)

            if (sanitized.length > 0) {
              setVisitedSteps(new Set(sanitized))
            }
          }
        }
      } catch (error) {
        console.error('Error loading tour for edit:', error)
        toast.error('Failed to load tour for editing')
      } finally {
        setIsSaving(false)
        ignoreDirtyRef.current = false
      }
    }

    loadTourForEdit()
    // Only load when switching to a new id
  }, [user?.id, tourIdToEdit])

  const stepWorkflow = useMemo(
    () =>
      deriveStepWorkflow(
        tourData,
        STEPS.map((step) => step.id),
        currentStep,
        visitedSteps,
        submitAttempted,
      ),
    [tourData, currentStep, visitedSteps, submitAttempted],
  )

  const createWorkflowSnapshot = useCallback(
    () => ({
      version: 1,
      currentStep,
      currentStepId: STEPS[currentStep]?.id,
      visitedSteps: Array.from(visitedSteps),
      stepStatuses: stepWorkflow.map((step) => ({
        id: step.id,
        status: step.status,
        requiredCount: step.requiredCount,
        filledCount: step.filledCount,
      })),
      updatedAt: new Date().toISOString(),
    }),
    [currentStep, visitedSteps, stepWorkflow],
  )

  // Initialise currentTourId from route/param
  useEffect(() => {
    if (!tourIdToEdit) return
    currentTourIdRef.current = tourIdToEdit
    setCurrentTourId(tourIdToEdit)
  }, [tourIdToEdit])

  const rememberTourId = useCallback((tourId: string) => {
    currentTourIdRef.current = tourId
    setCurrentTourId(tourId)
    setTourData((prev) => (prev.id === tourId ? prev : ({ ...prev, id: tourId } as Partial<Tour>)))
  }, [])

  const saveDraft = useCallback(
    async (options?: { redirectAfter?: string; showOverlay?: boolean; source?: 'manual' | 'auto' }): Promise<boolean> => {
      if (!user) return false

      if (saveInFlightRef.current) return saveInFlightRef.current

      const promise = (async (): Promise<boolean> => {
        const showOverlay = options?.showOverlay === true
        const source = options?.source ?? 'auto'

        if (showOverlay) setIsSaving(true)
        setAutosaveStatus('saving')

        try {
          const pct = calculateCompletionPercentage(tourData)
          const result = await tourService.saveWorkflowDraft(
            tourData,
            user.id,
            currentTourIdRef.current,
            pct,
            createWorkflowSnapshot(),
          )

          const savedId = result.tourId
          if (currentTourIdRef.current !== savedId) rememberTourId(savedId)
          setLastSavedAt(new Date())
          setHasUnsaved(false)
          setAutosaveStatus('saved')
          setTimeout(() => setAutosaveStatus('idle'), 3000)

          if (options?.redirectAfter) navigate(options.redirectAfter)
          return true
        } catch (error) {
          console.error('Error saving draft:', error)
          setAutosaveStatus('error')
          if (source === 'manual') {
            toast.error(getTourMutationErrorMessage(error, 'Failed to save. Please try again.'))
          }
          return false
        } finally {
          if (showOverlay) setIsSaving(false)
        }
      })()

      saveInFlightRef.current = promise
      try {
        return await promise
      } finally {
        saveInFlightRef.current = null
      }
    },
    [user, tourData, navigate, createWorkflowSnapshot, rememberTourId],
  )

  // Mark unsaved whenever tour data or workflow navigation changes
  useEffect(() => {
    if (!didMountDirtyRef.current) {
      didMountDirtyRef.current = true
      return
    }
    if (ignoreDirtyRef.current) return
    setHasUnsaved(true)
  }, [tourData, currentStep, visitedSteps])

  // Debounced autosave shortly after changes (prevents refresh restoring old step)
  useEffect(() => {
    if (!user?.id) return
    if (!hasUnsaved) return

    if (autosaveDebounceRef.current) {
      window.clearTimeout(autosaveDebounceRef.current)
      autosaveDebounceRef.current = null
    }

    autosaveDebounceRef.current = window.setTimeout(() => {
      void saveDraft({ source: 'auto', showOverlay: false })
    }, 2000)

    return () => {
      if (autosaveDebounceRef.current) {
        window.clearTimeout(autosaveDebounceRef.current)
        autosaveDebounceRef.current = null
      }
    }
  }, [user?.id, hasUnsaved, tourData, currentStep, visitedSteps, saveDraft])

  // Autosave: every 30s when there are unsaved changes
  useEffect(() => {
    if (!user?.id) return
    const interval = setInterval(async () => {
      if (!hasUnsaved) return
      await saveDraft({ source: 'auto', showOverlay: false })
    }, 30_000)
    return () => clearInterval(interval)
  }, [user?.id, hasUnsaved, saveDraft])

  // Warn before unload if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsaved) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsaved])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [currentStep])

  const performSave = useCallback(
    async (redirectAfter?: string): Promise<boolean> =>
      saveDraft({ redirectAfter, showOverlay: true, source: 'manual' }),
    [saveDraft],
  )

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

  const handleSaveDraft = async () => {
    const ok = await performSave()
    if (ok) toast.success('Draft saved')
  }

  const handleSaveExit = async () => {
    setShowExitModal(false)
    await performSave(returnPath)
  }

  const REQUIRED_FOR_SUBMIT = [
    { field: 'title',    label: 'Tour title' },
    { field: 'price',    label: 'Pricing' },
    { field: 'cancellation_policy', label: 'Cancellation policy' },
  ]

  const handleSubmitForReview = async () => {
    if (!user) return
    setSubmitAttempted(true)
    const schedules = Array.isArray(tourData.schedules) ? tourData.schedules : []
    const hasValidSchedule = schedules.some(
      (schedule: any) =>
        typeof schedule?.date === 'string' &&
        schedule.date.trim().length > 0 &&
        typeof schedule?.time === 'string' &&
        schedule.time.trim().length > 0,
    )

    const missing = REQUIRED_FOR_SUBMIT.filter(
      ({ field }) => !(tourData as any)[field]
    )
    const pickupCount = Number((tourData as any)?.draft_data?.pickup_locations_count ?? 0)
    if (pickupCount <= 0) missing.push({ field: 'pickup_locations', label: 'Pickup locations' })
    if ((tourData.images?.length ?? 0) === 0) missing.push({ field: 'images', label: 'At least one image' })
    if ((tourData.itinerary?.length ?? 0) === 0) missing.push({ field: 'itinerary', label: 'Itinerary' })
    if (!hasValidSchedule) missing.push({ field: 'schedules', label: 'Availability dates' })
    if (missing.length > 0) {
      toast.error(`Please complete: ${missing.map(m => m.label).join(', ')}`)
      return
    }
    setIsSubmitting(true)
    try {
      // First save everything
      const pct = calculateCompletionPercentage(tourData)
      const result = await tourService.saveWorkflowDraft(
        tourData,
        user.id,
        currentTourIdRef.current,
        pct,
        createWorkflowSnapshot(),
      )
      const savedId = currentTourIdRef.current ?? result.tourId
      if (currentTourIdRef.current !== savedId) rememberTourId(savedId)
      // Then flip status
      await tourService.submitForReview(savedId, user.id)
      setHasUnsaved(false)
      toast.success('Tour submitted for review! We\'ll notify you once approved.')
      navigate(returnPath)
    } catch (error) {
      console.error('Error submitting for review:', error)
      toast.error(getTourMutationErrorMessage(error, 'Submission failed. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1
      setVisitedSteps((prev) => {
        const copy = new Set(prev)
        copy.add(currentStep)
        copy.add(nextStep)
        return copy
      })
      setCurrentStep(nextStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      const previousStep = currentStep - 1
      setVisitedSteps((prev) => {
        const copy = new Set(prev)
        copy.add(previousStep)
        return copy
      })
      setCurrentStep(previousStep)
    } else {
      navigate(returnPath)
    }
  }

  const handlePublish = async () => {
    if (!user) return
    const promoDraft = getTourPricingPromoDraft(tourData.draft_data)
    const promoValidationError = validateTourPricingPromoDraft(promoDraft)

    if (promoValidationError) {
      toast.error(promoValidationError)
      setVisitedSteps((prev) => new Set(prev).add(3))
      setCurrentStep(3)
      return
    }

    setIsSaving(true)
    try {
      const hadExistingTourId = Boolean(currentTourIdRef.current)
      const dataToSave: any = {
        ...tourData,
        operator_id: user.id,
        deposit_required: true,
        is_active: true,
        is_published: true,
        is_verified: false,
        is_featured: false,
        workflow_status: 'approved',
        approved_at: new Date().toISOString(),
      }
      delete dataToSave.id
      if ((dataToSave as any).difficulty) delete (dataToSave as any).difficulty

      let savedTour: Tour
      if (currentTourIdRef.current) {
        savedTour = await tourService.updateTour(currentTourIdRef.current, dataToSave)
      } else {
        savedTour = await tourService.createTour(dataToSave)
        rememberTourId(savedTour.id)
      }

      if (promoDraft.enabled) {
        const promoPayload = {
          operator_user_id: user.id,
          applicable_tour_id: savedTour.id,
          title: promoDraft.title.trim(),
          code: promoDraft.code.trim().toUpperCase(),
          description: promoDraft.description.trim() || null,
          owner_label: promoDraft.code.trim().toUpperCase(),
          funding_source: 'operator' as const,
          discount_type: promoDraft.discountType,
          discount_value: Number(promoDraft.discountValue),
          max_discount_value:
            promoDraft.discountType === 'percentage' && promoDraft.maxDiscountValue.trim().length > 0
              ? Number(promoDraft.maxDiscountValue)
              : null,
          is_active: promoDraft.isActive,
        }

        let promotionId = promoDraft.promotionId

        if (promotionId) {
          await commercialService.updatePromotion(promotionId, promoPayload)
        } else {
          const createdPromotion = await commercialService.createPromotion(promoPayload)
          promotionId = createdPromotion.id
        }

        const nextDraftData = {
          ...(tourData.draft_data && typeof tourData.draft_data === 'object' ? tourData.draft_data : {}),
          pricing_promo: {
            ...promoDraft,
            promotionId,
          },
        }

        const { error: draftUpdateError } = await supabase
          .from('tours')
          .update({
            draft_data: nextDraftData,
            updated_at: new Date().toISOString(),
            last_edited_at: new Date().toISOString(),
          } as any)
          .eq('id', savedTour.id)
          .eq('operator_id', user.id)

        if (draftUpdateError) {
          throw draftUpdateError
        }
      }

      setHasUnsaved(false)
  toast.success(promoDraft.enabled ? 'Tour and promo published successfully!' : hadExistingTourId ? 'Tour updated successfully!' : 'Tour published successfully!')
      navigate(returnPath)
    } catch (error) {
      console.error('Error publishing tour:', error)
      toast.error(getTourMutationErrorMessage(error, 'Failed to publish tour. Please check all fields.'))
    } finally {
      setIsSaving(false)
    }
  }

  const ensureTourDraftForMedia = async (): Promise<string> => {
    if (!user) throw new Error('Authentication required')
    if (currentTourIdRef.current) return currentTourIdRef.current

    const pct = calculateCompletionPercentage(tourData)
    const result = await tourService.saveWorkflowDraft(
      tourData,
      user.id,
      null,
      pct,
      createWorkflowSnapshot(),
    )

    rememberTourId(result.tourId)
    return result.tourId
  }

  const CurrentStepComponent = STEPS[currentStep].component

  return (
    <div className="min-h-screen flex flex-col bg-card">
      {/* Decorative orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -top-20 right-20 w-72 h-72 bg-secondary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-accent/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/85 px-6 py-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-5xl mx-auto space-y-3">
          {/* Title row */}
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                {tourData.title || 'Create New Tour'}
              </h1>
              {/* Autosave indicator */}
              {autosaveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                </span>
              )}
              {autosaveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-xs text-primary shrink-0">
                  <BookmarkCheck className="w-3 h-3" />
                  Saved {lastSavedAt ? lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              )}
              {autosaveStatus === 'error' && (
                <span className="flex items-center gap-1 text-xs text-destructive shrink-0">
                  <AlertCircle className="w-3 h-3" /> Save failed
                </span>
              )}
              {hasUnsaved && autosaveStatus === 'idle' && (
                <span className="w-2 h-2 rounded-full bg-primary/70 shrink-0" title="Unsaved changes" />
              )}
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting}
                className="h-11 px-6 rounded-xl text-sm font-semibold gap-2"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Draft</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => hasUnsaved ? setShowExitModal(true) : navigate(returnPath)}
                disabled={isSaving || isSubmitting}
                className="h-11 px-6 rounded-xl text-sm font-semibold gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save & Exit</span>
              </Button>
              <Button
                onClick={handleSubmitForReview}
                disabled={isSaving || isSubmitting}
                className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold gap-2 shadow-md shadow-primary/25"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Submit for Review</span>
              </Button>
            </div>
          </div>

          {/* Visual stepper */}
          <div className="flex items-center justify-center overflow-x-auto pb-1 gap-0">
            {STEPS.map((step, idx) => {
              const workflow = stepWorkflow[idx]
              const isCompleted = workflow?.status === 'complete'
              const isNeedsAttention = workflow?.status === 'needs_attention'
              const isInProgress = workflow?.status === 'in_progress'
              const isCurrent = idx === currentStep
              return (
                <div key={step.title} className="flex items-center shrink-0">
                  {/* Circle + label */}
                  <button
                    type="button"
                    onClick={() => {
                      setVisitedSteps((prev) => {
                        const copy = new Set(prev)
                        copy.add(idx)
                        return copy
                      })
                      setCurrentStep(idx)
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : isNeedsAttention
                            ? 'bg-destructive/10 text-destructive border-2 border-destructive/40'
                            : isCurrent || isInProgress
                              ? 'bg-primary/15 text-primary border-2 border-primary'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <svg viewBox="0 0 12 12" className="w-3.5 h-3.5" fill="currentColor">
                          <path d="M1.5 6 L4.5 9 L10.5 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : isNeedsAttention ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${
                        isNeedsAttention
                          ? 'text-destructive'
                          : isCurrent || isInProgress
                            ? 'text-primary'
                            : isCompleted
                              ? 'text-primary/70'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-wide font-semibold ${
                        isNeedsAttention
                          ? 'text-destructive/80'
                          : isCompleted
                            ? 'text-primary/70'
                            : isCurrent || isInProgress
                              ? 'text-primary/70'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? 'Complete' : isNeedsAttention ? 'Needs attention' : isCurrent || isInProgress ? 'In progress' : 'Not started'}
                    </span>
                  </button>

                  {/* Connector line (not after last step) */}
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-8 mx-1 mb-7 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-primary'
                          : isNeedsAttention
                            ? 'bg-destructive/40'
                            : isCurrent
                              ? 'bg-primary/30'
                              : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto flex-1 w-full max-w-5xl p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-xl backdrop-blur-xl md:p-8"
          >
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <div className="mt-3 text-sm font-medium text-muted-foreground">
                    Loading step…
                  </div>
                </div>
              }
            >
              <CurrentStepComponent
                data={tourData}
                onUpdate={handleUpdate}
                onNext={handleNext}
                onBack={handleBack}
                onPublish={handlePublish}
                membershipTierLabel={depositTierPolicy.tierLabel}
                minimumDepositPercent={depositTierPolicy.minimumDepositPercent}
                tourId={currentTourId}
                ensureTourDraft={ensureTourDraftForMedia}
              />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Simple Overlay Loader */}
      {isSaving && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <span className="mt-2 font-medium text-muted-foreground">
              {currentTourId ? 'Saving…' : 'Saving draft…'}
            </span>
          </div>
        </div>
      )}

      {/* Exit Warning Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-border/60 bg-background/85 p-8 text-center shadow-2xl backdrop-blur-xl"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Unsaved Changes</h2>
              <p className="text-sm text-muted-foreground mb-6">
                You have unsaved changes. Save your progress before leaving?
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSaveExit}
                  disabled={isSaving}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/25"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save & Exit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setHasUnsaved(false); setShowExitModal(false); navigate(returnPath) }}
                  className="w-full"
                >
                  Discard Changes
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowExitModal(false)}
                  className="w-full text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
