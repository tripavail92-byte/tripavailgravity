import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { getUserCached } from '@/lib/authCache'
import { supabase } from '@/lib/supabase'

import { publishPackage, savePackageDraft } from '../services/packageService'
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

/**
 * Which step to open on when resuming a draft: the first one whose data is still missing.
 *
 * Mirrors calculateStartingStep in the hotel flow. Order matches STEPS above — a gap early in the
 * wizard is where the partner needs to be, even if they had filled in later steps before going
 * back.
 */
export function calculateStartingStep(data?: PackageData): number {
  if (!data) return 1
  if (!data.hotelId) return 1
  if (!data.packageType) return 2
  if (!data.name || !data.description) return 3
  if (!data.photos || data.photos.length === 0) return 4
  if (!data.highlights || data.highlights.length === 0) return 5
  if (!data.inclusions || data.inclusions.length === 0) return 6
  if (!data.exclusions || data.exclusions.length === 0) return 7
  if (!data.selectedRooms || Object.keys(data.selectedRooms).length === 0) return 8
  if (!data.cancellationPolicy) return 10
  return 11
}

interface CompletePackageCreationFlowProps {
  /** Called once, after a package has been successfully published. The host decides where to go
   *  next (dashboard, the new listing). Publish is otherwise self-contained. */
  onPublished?: (pkg: { id?: string; name?: string }) => void
  /** Wizard state restored from a saved draft. */
  initialData?: PackageData
  /** The packages row this draft lives in. Publishing promotes THIS row rather than inserting a
   *  second one. */
  initialDraftId?: string
  /** Called after Save & Exit stores the draft. */
  onSavedAndExit?: (draftId?: string) => void
}

export function CompletePackageCreationFlow({
  onPublished,
  initialData,
  initialDraftId,
  onSavedAndExit,
}: CompletePackageCreationFlowProps = {}) {
  const [currentStep, setCurrentStep] = useState(() => calculateStartingStep(initialData))
  // Furthest step reached — decides which progress segments are navigable. Tracked with an effect
  // so every route into setCurrentStep (Next, Back, and the Review step's Edit links) is covered.
  const [maxStepReached, setMaxStepReached] = useState(() => calculateStartingStep(initialData))
  useEffect(() => {
    setMaxStepReached((prev) => Math.max(prev, currentStep))
  }, [currentStep])
  const [packageData, setPackageData] = useState<PackageData>(initialData ?? {})
  const [isPublishing, setIsPublishing] = useState(false)
  // Latches true on the first successful publish and never resets. The button is disabled on
  // `isPublishing || isPublished`, so the window between success and navigating away cannot be used
  // to publish the same package a second time. Before this, `setIsPublishing(false)` in the finally
  // re-enabled the button on the same review screen, and partners — seeing no redirect — clicked
  // again and created duplicate listings.
  const [isPublished, setIsPublished] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  // ── Draft autosave ────────────────────────────────────────────────────────
  // The row this wizard owns. Starts as the resumed draft, or is filled in by the first save.
  const draftIdRef = useRef<string | undefined>(initialDraftId)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  // Guards against a second write landing while the first is still in flight. Without it, the very
  // first autosave could race itself and insert two draft rows before either returned an id.
  const savingRef = useRef(false)

  const saveDraft = useCallback(async (data: PackageData, opts?: { silent?: boolean }) => {
    const user = await getUserCached()
    if (!user) return undefined
    // Nothing worth persisting yet — an empty row would show up on the dashboard as a phantom
    // "Untitled Package" the partner never created.
    if (!data.hotelId && !data.packageType && !data.name) return undefined
    if (savingRef.current) return draftIdRef.current

    savingRef.current = true
    if (!opts?.silent) setIsSavingDraft(true)
    try {
      const result = await savePackageDraft(data, user.id, draftIdRef.current)
      if (result.success) {
        draftIdRef.current = result.draftId
        setSavedAt(new Date())
        setDraftError(null)
      } else {
        setDraftError('Couldn’t save your progress')
      }
      return result.draftId
    } finally {
      savingRef.current = false
      setIsSavingDraft(false)
    }
  }, [])

  // Debounced: the wizard's steps push state up on every keystroke, so writing per change would
  // hammer the database. 2s after the partner stops, the draft is stored.
  useEffect(() => {
    if (isPublished) return
    const t = window.setTimeout(() => {
      void saveDraft(packageData, { silent: true })
    }, 2000)
    return () => window.clearTimeout(t)
  }, [packageData, isPublished, saveDraft])

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

  const handleSaveAndExit = async () => {
    const id = await saveDraft(packageData)
    // Hand back the id even when nothing was saved (empty wizard) — the host just leaves.
    onSavedAndExit?.(id ?? draftIdRef.current)
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

      // Promote the draft row if this wizard owns one — otherwise publishing a resumed draft would
      // leave it orphaned and create a second listing alongside it.
      const publishedPackage = await publishPackage(packageData, user.id, draftIdRef.current)

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
          {/* A hardcoded "Saved 2 mins ago" used to sit here and was removed, because nothing
              autosaved this flow — it told the partner their work was safe when it was not. Now
              that drafts are real, the indicator is too: it only claims a save that actually
              happened, and reports a failure rather than staying quiet. */}
          <div className="flex items-center gap-3">
            {draftError ? (
              <span className="text-xs font-medium text-destructive">{draftError}</span>
            ) : isSavingDraft ? (
              <span className="text-xs text-muted-foreground">Saving…</span>
            ) : savedAt ? (
              <span className="text-xs text-muted-foreground">
                Draft saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}

            {!isPublished && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleSaveAndExit()}
                disabled={isSavingDraft}
              >
                Save &amp; exit
              </Button>
            )}
          </div>
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
