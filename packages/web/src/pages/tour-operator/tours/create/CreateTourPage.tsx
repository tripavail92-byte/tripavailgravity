import { AlertCircle, AlertTriangle, BookmarkCheck, Loader2, LogOut, Send } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { canPublishAnotherTrip } from '@tripavail/shared/commercial/engine'

import { celebrateStage } from '@/features/wizard/celebrateStage'
import { supabase } from '@/lib/supabase'
import {
  Tour,
  calculateCompletionPercentage,
  tourService,
} from '@/features/tour-operator/services/tourService'
import { useOperatorCommercialGate } from '@/features/tour-operator/hooks/useOperatorCommercialGate'
import { PublishLimitBanner } from '@/features/tour-operator/components/tier/PublishLimitBanner'
import { hasCompletedTourOperatorSetup } from '@/features/tour-operator/utils/operatorAccess'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

import { TourBasicsStep } from './components/TourBasicsStep'
import { TourDetailsStep } from './components/TourDetailsStep'
import { TourItineraryStep } from './components/TourItineraryStep'
import { TourMediaStep } from './components/TourMediaStep'
import { TourPricingStep } from './components/TourPricingStep'
import { TourReviewStep } from './components/TourReviewStep'
import { deriveStepWorkflow, StepId } from './stepWorkflow'

const LazyTourPickupLocationsStep = lazy(() =>
  import('./components/TourPickupLocationsStep').then((m) => ({
    default: m.TourPickupLocationsStep,
  })),
)

/** Index of the deposit screen inside the Pricing stage's sub-steps (price, deposit, ...). */
const PRICING_DEPOSIT_SUBSTEP = 1

/**
 * Where each submit-time requirement actually lives, now that stages have sub-steps. Submit used to
 * name the missing fields in a toast and leave the operator to hunt for them; it now walks them to
 * the exact screen and focuses the control.
 */
const SUBMIT_FIELD_ROUTES: Record<string, { stage: StepId; subStep: number; focus?: string }> = {
  title: { stage: 'basics', subStep: 0, focus: 'wz-title' },
  schedules: { stage: 'basics', subStep: 3, focus: 'wz-departure' },
  pickup_locations: { stage: 'pickup', subStep: 0 },
  itinerary: { stage: 'itinerary', subStep: 0 },
  price: { stage: 'pricing', subStep: 0, focus: 'wz-price' },
  cancellation_policy: { stage: 'pricing', subStep: 2, focus: 'wz-cancellation' },
  images: { stage: 'media', subStep: 0 },
}

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

/** Turn a raw backend code like "MINIMUM_DEPOSIT_NOT_MET" into "Minimum deposit not met." */
function humanizeBackendCode(raw: string): string {
  const words = raw.trim().replace(/[_-]+/g, ' ').toLowerCase()
  if (!words) return ''
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}.`
}

/** Known backend/RPC error codes → friendly, operator-facing sentences. */
const TOUR_ERROR_MESSAGES: Array<{ match: string; message: string }> = [
  { match: 'publish_limit_reached', message: 'You’ve reached the maximum number of published tours for your membership tier this cycle. Upgrade your plan or unpublish another tour to add more.' },
  { match: 'minimum_deposit_not_met', message: 'Your deposit percentage is below the minimum required for your membership tier. Raise it on the Pricing & Policies step, then try again.' },
  { match: 'setup_not_completed', message: 'Finish your operator setup before publishing tours.' },
  { match: 'tour_not_found', message: 'We couldn’t find this tour. Reload the page and try again.' },
  { match: 'not_authorized', message: 'You don’t have permission to make this change.' },
  { match: 'unauthorized', message: 'You don’t have permission to make this change.' },
  { match: 'row-level security', message: 'You don’t have permission to make this change.' },
]

/** Postgres error code, when the failure came from the database rather than the network. */
function errorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) return ''
  return String((error as { code?: string }).code ?? '')
}

function errorText(error: unknown): string {
  if (typeof error !== 'object' || error === null) return ''
  const e = error as { message?: string; details?: string; hint?: string }
  return [e.message, e.details, e.hint].filter(Boolean).join(' ').toLowerCase()
}

/**
 * Does retrying this save stand any chance of succeeding?
 *
 * Autosave fires on a timer, so a permanent failure means an endless loop of red flashes. Two
 * failures are permanent: the database refused on a permission rule (42501), or the row cannot be
 * linked to this user at all (23503 on tours.operator_id, whose FK points at public.users — a
 * user with no row there can never own a tour until one is created).
 *
 * This used to read `code === '42501' || message includes 'row-level security'` and then tell the
 * operator their account was pending verification. That was wrong twice over: production's
 * permissive FOR ALL policy on tours means an owner's INSERT is authorised whatever their
 * verification status, and any unrelated 42501 — from an RPC, from another table — was reported as
 * a verification problem. Never infer a cause from a code that has many causes.
 */
function isPermanentSaveError(error: unknown): boolean {
  const code = errorCode(error)
  return code === '42501' || code === '23503'
}

function getTourMutationErrorMessage(error: unknown, fallbackMessage: string): string {
  const code = errorCode(error)
  const text = errorText(error)

  // Name the failure. Do NOT guess at verification status — see isPermanentSaveError.
  if (code === '23503' && text.includes('operator_id')) {
    return 'Your account is missing its user record, so a tour cannot be linked to you yet. Contact support — retrying will not help.'
  }
  if (code === '42501') {
    return 'The database refused this save under a permission rule (42501). Retrying will not help.'
  }

  const details =
    typeof error === 'object' && error !== null
      ? [
          (error as { message?: string }).message,
          (error as { details?: string }).details,
          (error as { hint?: string }).hint,
        ].filter((value): value is string => Boolean(value))
      : []

  const normalizedMessage = details.join(' ').toLowerCase()

  if (normalizedMessage.includes('publish limit')) {
    return TOUR_ERROR_MESSAGES[0].message
  }
  if (normalizedMessage.includes('deposit') && normalizedMessage.includes('membership')) {
    return TOUR_ERROR_MESSAGES[1].message
  }

  for (const { match, message } of TOUR_ERROR_MESSAGES) {
    if (normalizedMessage.includes(match)) return message
  }

  // Never surface a raw SNAKE_CASE code to the operator — humanize it as a last resort.
  const firstDetail = details[0]?.trim()
  if (firstDetail && /^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(firstDetail)) {
    return humanizeBackendCode(firstDetail)
  }

  return fallbackMessage
}

function createDraftClientId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
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
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)
  /** Raw Postgres code + message, surfaced on the label so a screenshot is enough to diagnose. */
  const [saveErrorCode, setSaveErrorCode] = useState<string | null>(null)
  const [saveErrorDetail, setSaveErrorDetail] = useState<string | null>(null)
  /** Sub-step position within each stage, keyed by stage id. Persisted in the workflow snapshot. */
  const [subStepByStage, setSubStepByStage] = useState<Record<string, number>>({})
  /** Set when the failure can't be fixed by retrying (e.g. the account isn't verified yet). */
  const autosaveBlockedRef = useRef(false)
  const verificationToastShownRef = useRef(false)
  const [isVerificationBlocked, setIsVerificationBlocked] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]))
  const commercialGate = useOperatorCommercialGate(user?.id)
  const ignoreDirtyRef = useRef(false)
  const didMountDirtyRef = useRef(false)
  const autosaveDebounceRef = useRef<number | null>(null)
  const saveInFlightRef = useRef<Promise<boolean> | null>(null)
  const currentTourIdRef = useRef<string | null>(null)
  const draftClientIdRef = useRef<string>(createDraftClientId())

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

  const isEditingPublishedTour = Boolean(tourIdToEdit && tourData.is_published === true)
  const publishGate = useMemo(
    () =>
      isEditingPublishedTour
        ? { allowed: true, reason: null }
        : // Pass the resolved tier (not just its code) so an admin-edited publish limit
          // applies immediately, without a client deploy.
          canPublishAnotherTrip(commercialGate.tier, commercialGate.publishedToursThisCycle),
    [commercialGate.publishedToursThisCycle, commercialGate.tier, isEditingPublishedTour],
  )

  const ensureDepositPolicySatisfied = useCallback(() => {
    const depositPercentage = Number(tourData.deposit_percentage || 0)
    if (depositPercentage >= commercialGate.minimumDepositPercent) {
      return true
    }

    toast.error(
      `Deposit must be at least ${commercialGate.minimumDepositPercent}% for ${commercialGate.tierLabel} membership.`,
    )
    const pricingIndex = STEPS.findIndex((step) => step.id === 'pricing')
    setVisitedSteps((prev) => new Set(prev).add(pricingIndex))
    setCurrentStep(pricingIndex)
    // Land on the deposit screen itself, not wherever the operator last left the pricing stage.
    setSubStepByStage((prev) => ({ ...prev, pricing: PRICING_DEPOSIT_SUBSTEP }))
    return false
  }, [commercialGate.minimumDepositPercent, commercialGate.tierLabel, tourData.deposit_percentage])

  useEffect(() => {
    const loadTourForEdit = async () => {
      if (!user?.id || !tourIdToEdit) return
      try {
        ignoreDirtyRef.current = true
        setIsSaving(true)
        const existing = await tourService.getOperatorTourById(user.id, tourIdToEdit)
        const existingDraftClientId =
          existing.draft_data && typeof existing.draft_data === 'object'
            ? (existing.draft_data as Record<string, unknown>)._clientDraftId
            : null

        if (typeof existingDraftClientId === 'string' && existingDraftClientId.trim().length > 0) {
          draftClientIdRef.current = existingDraftClientId
        }

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

          // v2 snapshots carry the sub-step within each stage. A v1 snapshot has none, and
          // defaulting to 0 lands the operator at the top of the correct stage — safe, not wrong.
          if (workflow.subSteps && typeof workflow.subSteps === 'object') {
            const sanitized: Record<string, number> = {}
            for (const [stageId, value] of Object.entries(workflow.subSteps)) {
              const index = Number(value)
              if (Number.isInteger(index) && index >= 0) sanitized[stageId] = index
            }
            setSubStepByStage(sanitized)
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
      // v2 adds `subSteps`. Stage indices are unchanged, so a v1 reader still resumes correctly.
      version: 2,
      currentStep,
      currentStepId: STEPS[currentStep]?.id,
      visitedSteps: Array.from(visitedSteps),
      subSteps: subStepByStage,
      stepStatuses: stepWorkflow.map((step) => ({
        id: step.id,
        status: step.status,
        requiredCount: step.requiredCount,
        filledCount: step.filledCount,
      })),
      updatedAt: new Date().toISOString(),
    }),
    [currentStep, visitedSteps, subStepByStage, stepWorkflow],
  )

  const handleSubStepChange = useCallback((stageId: string, index: number) => {
    setSubStepByStage((prev) => (prev[stageId] === index ? prev : { ...prev, [stageId]: index }))
  }, [])

  // Initialise currentTourId from route/param
  useEffect(() => {
    if (!tourIdToEdit) return
    currentTourIdRef.current = tourIdToEdit
    setCurrentTourId(tourIdToEdit)
  }, [tourIdToEdit])

  const rememberTourId = useCallback((tourId: string) => {
    currentTourIdRef.current = tourId
    setCurrentTourId(tourId)
    setTourData((prev) => {
      const previousDraftData =
        prev.draft_data && typeof prev.draft_data === 'object'
          ? (prev.draft_data as Record<string, unknown>)
          : {}

      return {
        ...prev,
        id: tourId,
        draft_data: {
          ...previousDraftData,
          _clientDraftId: draftClientIdRef.current,
        },
      } as Partial<Tour>
    })

    if (!routeTourId) {
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.set('tour_id', tourId)
      navigate({ search: `?${nextSearchParams.toString()}` }, { replace: true })
    }
  }, [navigate, routeTourId, searchParams])

  const buildDraftPayload = useCallback(
    (sourceData: Partial<Tour>): Partial<Tour> => ({
      ...sourceData,
      draft_data: {
        ...(sourceData.draft_data && typeof sourceData.draft_data === 'object'
          ? sourceData.draft_data
          : {}),
        _clientDraftId: draftClientIdRef.current,
      },
    }),
    [],
  )

  const saveDraft = useCallback(
    async (options?: { redirectAfter?: string; showOverlay?: boolean; source?: 'manual' | 'auto' }): Promise<boolean> => {
      if (!user) return false

      if (saveInFlightRef.current) return saveInFlightRef.current

      const promise = (async (): Promise<boolean> => {
        const showOverlay = options?.showOverlay === true
        const source = options?.source ?? 'auto'

        // A verification block never clears by retrying; only an explicit save attempt should.
        if (autosaveBlockedRef.current && source === 'auto') return false
        if (source === 'manual') autosaveBlockedRef.current = false

        if (showOverlay) setIsSaving(true)
        setAutosaveStatus('saving')

        try {
          const draftPayload = buildDraftPayload(tourData)
          const pct = calculateCompletionPercentage(draftPayload)
          const result = await tourService.saveWorkflowDraft(
            draftPayload,
            user.id,
            currentTourIdRef.current,
            pct,
            createWorkflowSnapshot(),
          )

          const savedId = result.tourId
          if (currentTourIdRef.current !== savedId) rememberTourId(savedId)
          setLastSavedAt(new Date())
          setHasUnsaved(false)
          setSaveErrorMessage(null)
          setSaveErrorCode(null)
          setSaveErrorDetail(null)
          setIsVerificationBlocked(false)
          setAutosaveStatus('saved')
          setTimeout(() => setAutosaveStatus('idle'), 3000)

          if (options?.redirectAfter) navigate(options.redirectAfter)
          return true
        } catch (error) {
          console.error('Error saving draft:', error)
          setAutosaveStatus('error')

          const message = getTourMutationErrorMessage(error, 'Failed to save. Please try again.')
          setSaveErrorMessage(message)
          const code = errorCode(error)
          setSaveErrorCode(code || null)
          setSaveErrorDetail(
            [code, (error as { message?: string })?.message].filter(Boolean).join(' — ') || null,
          )

          if (isPermanentSaveError(error)) {
            // Retrying every few seconds cannot succeed. Stop the loop and say so once, rather
            // than flashing a silent "Save failed" forever.
            autosaveBlockedRef.current = true
            setIsVerificationBlocked(true)
            if (!verificationToastShownRef.current) {
              verificationToastShownRef.current = true
              toast.error(message, { duration: 8000 })
            }
          } else if (source === 'manual') {
            toast.error(message)
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
    [user, tourData, navigate, createWorkflowSnapshot, rememberTourId, buildDraftPayload],
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

  /**
   * Navigate to the screen that owns `field`, and focus the control once it has rendered.
   *
   * A plain function, deliberately. This sits below the `setupCompleted === null` early return, so
   * a useCallback here runs on some renders and not others — React counts one more hook after the
   * setup check resolves and throws "Rendered more hooks than during the previous render". Only
   * event handlers call this, so there is nothing to memoise for anyway.
   */
  const goToMissingField = (field: string) => {
    const route = SUBMIT_FIELD_ROUTES[field]
    if (!route) return

    const stageIndex = STEPS.findIndex((step) => step.id === route.stage)
    if (stageIndex < 0) return

    setVisitedSteps((prev) => new Set(prev).add(stageIndex))
    setSubStepByStage((prev) => ({ ...prev, [route.stage]: route.subStep }))
    setCurrentStep(stageIndex)

    if (!route.focus) return
    // The target stage mounts on the next commit; retry rather than guess a delay.
    const focus = () => {
      const el = document.getElementById(route.focus as string)
      if (!el) return false
      el.focus({ preventScroll: true })
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return true
    }
    window.setTimeout(() => {
      if (!focus()) window.setTimeout(focus, 120)
    }, 0)
  }

  const performSubmitForReview = async () => {
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
    // Read the actual saved pickup array too — the count field can lag behind if the
    // operator saved a pickup and jumped straight here without advancing step-by-step.
    const draftForCheck = (tourData as any)?.draft_data ?? {}
    const pickupArrCount = Array.isArray(draftForCheck.pickup_locations)
      ? draftForCheck.pickup_locations.length
      : 0
    const pickupCount = Math.max(Number(draftForCheck.pickup_locations_count ?? 0), pickupArrCount)
    if (pickupCount <= 0) missing.push({ field: 'pickup_locations', label: 'Pickup locations' })
    if ((tourData.images?.length ?? 0) === 0) missing.push({ field: 'images', label: 'At least one image' })
    if ((tourData.itinerary?.length ?? 0) === 0) missing.push({ field: 'itinerary', label: 'Itinerary' })
    if (!hasValidSchedule) missing.push({ field: 'schedules', label: 'Availability dates' })
    if (missing.length > 0) {
      const [first, ...rest] = missing
      toast.error(
        rest.length > 0
          ? `${first.label} is missing — ${rest.length} more to complete.`
          : `${first.label} is missing.`,
      )
      goToMissingField(first.field)
      return
    }
    if (!ensureDepositPolicySatisfied()) return
    setIsSubmitting(true)
    try {
      // First save everything
      const draftPayload = buildDraftPayload(tourData)
      const pct = calculateCompletionPercentage(draftPayload)
      const result = await tourService.saveWorkflowDraft(
        draftPayload,
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

  const reviewStepIndex = STEPS.findIndex((step) => step.id === 'review')

  // The header "Submit for Review" first sends the operator to the Review step so they can
  // check & confirm every field; the actual submit fires from that screen's confirm button.
  const handleSubmitForReview = () => {
    if (reviewStepIndex >= 0 && currentStep !== reviewStepIndex) {
      setVisitedSteps((prev) => new Set(prev).add(reviewStepIndex))
      setCurrentStep(reviewStepIndex)
      toast('Give everything a final check, then confirm your submission.', { icon: '📋' })
      return
    }
    void performSubmitForReview()
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1
      // Only on the way out to new ground — re-walking a finished draft is not an achievement.
      if (!visitedSteps.has(nextStep)) {
        celebrateStage(STEPS[currentStep].title, STEPS.length - 1 - currentStep)
      }
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
    if (!publishGate.allowed) {
      toast.error(publishGate.reason || 'Your membership tier has reached its publish limit for this cycle.')
      return
    }
    if (!ensureDepositPolicySatisfied()) return

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

      setHasUnsaved(false)
      toast.success(hadExistingTourId ? 'Tour updated successfully!' : 'Tour published successfully!')
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

    const draftPayload = buildDraftPayload(tourData)
    const pct = calculateCompletionPercentage(draftPayload)
    const result = await tourService.saveWorkflowDraft(
      draftPayload,
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
                <span
                  className="flex items-center gap-1 text-xs text-destructive shrink-0"
                  title={saveErrorDetail ?? saveErrorMessage ?? undefined}
                >
                  <AlertCircle className="w-3 h-3" /> Save failed
                  {saveErrorCode ? (
                    <code className="font-mono text-[10px] opacity-70">{saveErrorCode}</code>
                  ) : null}
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
        {/* A save that can never succeed by retrying. Say what actually failed, and show the raw
            Postgres code — guessing at the cause is what produced the wrong diagnosis before. */}
        {isVerificationBlocked ? (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" aria-hidden="true" />
              <div>
                <p className="font-semibold text-destructive">Nothing is being saved</p>
                <p className="mt-0.5 text-sm text-destructive/90">
                  {saveErrorMessage ?? 'This save cannot succeed by retrying.'}
                </p>
                {saveErrorDetail ? (
                  <p className="mt-1 font-mono text-xs text-destructive/70">{saveErrorDetail}</p>
                ) : null}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 border-destructive/40"
              onClick={() => navigate('/operator/verification')}
            >
              Check verification
            </Button>
          </div>
        ) : null}

        {/* Surfaced before any work is invested — not after the operator finishes step 7. */}
        {!isEditingPublishedTour ? (
          <PublishLimitBanner gate={commercialGate} className="mb-6" />
        ) : null}

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
                onSubmitForReview={performSubmitForReview}
                isSubmitting={isSubmitting}
                membershipTierLabel={commercialGate.tierLabel}
                minimumDepositPercent={commercialGate.minimumDepositPercent}
                allowGoogleMaps={commercialGate.googleMapsEnabled}
                allowPickupMultiCity={commercialGate.pickupMultiCityEnabled}
                allowAiItinerary={commercialGate.aiItineraryEnabled}
                canPublish={publishGate.allowed}
                publishLimitReason={publishGate.reason}
                publishLimit={commercialGate.monthlyPublishLimit}
                publishedTripsThisCycle={commercialGate.publishedToursThisCycle}
                isEditingPublishedTour={isEditingPublishedTour}
                tourId={currentTourId}
                ensureTourDraft={ensureTourDraftForMedia}
                subStep={subStepByStage[STEPS[currentStep].id] ?? 0}
                onSubStepChange={(index: number) =>
                  handleSubStepChange(STEPS[currentStep].id, index)
                }
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
