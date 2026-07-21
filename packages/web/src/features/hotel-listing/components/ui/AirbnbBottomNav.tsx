import { Button } from '@/components/ui/button'

import { StepsProgressBar } from './StepsProgressBar'

interface AirbnbBottomNavProps {
  currentStep: number
  totalSteps: number
  completedSteps: number
  onBack?: () => void
  onNext?: () => void
  showBack?: boolean
  showNext?: boolean
  nextDisabled?: boolean
  nextLabel?: string
  backLabel?: string
  /** Step titles for the progress bar's tooltips and label. */
  stepTitles?: string[]
  /** Furthest step reached — anything up to it is directly navigable. */
  maxStepReached?: number
  /** Jump straight to an already-visited step instead of clicking Next through the rest. */
  onStepClick?: (step: number) => void
}

export function AirbnbBottomNav({
  currentStep,
  totalSteps,
  completedSteps,
  onBack,
  onNext,
  showBack = true,
  showNext = true,
  nextDisabled = false,
  nextLabel = 'Next',
  backLabel = 'Back',
  stepTitles,
  maxStepReached,
  onStepClick,
}: AirbnbBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pt-4">
      {/* Steps Progress Bar - Absolutely no padding/margin above */}
      <div className="px-4 -mt-4">
        <StepsProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          completedSteps={completedSteps}
          showLabels={true}
          stepTitles={stepTitles}
          maxStepReached={maxStepReached}
          onStepClick={onStepClick}
        />
      </div>

      {/* Back and Next Buttons */}
      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          {/* Back Button - Airbnb style text with underline */}
          {showBack ? (
            <Button
              variant="link"
              onClick={onBack}
              className="text-foreground font-semibold underline decoration-2 underline-offset-4 hover:text-foreground/80 p-0"
            >
              {backLabel}
            </Button>
          ) : (
            <div />
          )}

          {/* Next Button - Airbnb style black rounded button */}
          {showNext && (
            <Button
              onClick={onNext}
              disabled={nextDisabled}
              className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              {nextLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
