import React from 'react'

interface StepsProgressBarProps {
  currentStep: number
  totalSteps: number
  completedSteps?: number
  showLabels?: boolean
  variant?: 'default' | 'compact'
  className?: string
  /** Step titles, used for the tooltip and the screen-reader label on each segment. */
  stepTitles?: string[]
  /** Furthest step the user has reached. Anything up to this is navigable; later steps are not. */
  maxStepReached?: number
  /** When supplied, each reachable segment becomes a button that jumps straight to that step. */
  onStepClick?: (step: number) => void
}

export function StepsProgressBar({
  currentStep,
  totalSteps,
  completedSteps,
  showLabels = true,
  variant = 'default',
  className = '',
  stepTitles,
  maxStepReached,
  onStepClick,
}: StepsProgressBarProps) {
  // Navigating backwards used to mean clicking Next through every remaining step to get back to
  // Review. Each segment is now a jump target for any step already visited. Steps ahead of
  // maxStepReached stay inert — skipping forward would bypass the data those steps collect.
  const furthest = maxStepReached ?? currentStep
  const interactive = typeof onStepClick === 'function'

  return (
    <div className={`w-full ${className}`}>
      {/* One segment per step. The bar itself stays thin; the button wrapper supplies a real
          touch target so this is usable on a phone. */}
      <div className="relative flex w-full gap-[2px]">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isDone = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const canJump = interactive && stepNumber <= furthest && !isCurrent
          const title = stepTitles?.[index]

          const bar = (
            <span
              className={[
                'block h-1.5 w-full transition-colors duration-300 ease-out',
                isDone || isCurrent ? 'bg-primary' : 'bg-muted',
                canJump ? 'group-hover:bg-primary/60' : '',
                index === 0 ? 'rounded-l-full' : '',
                index === totalSteps - 1 ? 'rounded-r-full' : '',
              ].join(' ')}
            />
          )

          if (!canJump) {
            return (
              <span
                key={index}
                className="flex-1 py-2"
                aria-current={isCurrent ? 'step' : undefined}
                title={title}
              >
                {bar}
              </span>
            )
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => onStepClick!(stepNumber)}
              title={title ? `Go to: ${title}` : `Go to step ${stepNumber}`}
              aria-label={title ? `Go to step ${stepNumber}: ${title}` : `Go to step ${stepNumber}`}
              className="group flex-1 cursor-pointer py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
            >
              {bar}
            </button>
          )
        })}
      </div>

      {showLabels && stepTitles?.[currentStep - 1] && (
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Step {currentStep} of {totalSteps} — {stepTitles[currentStep - 1]}
        </p>
      )}
    </div>
  )
}

// Compact variant for use in headers
export function CompactStepsProgress({
  currentStep,
  totalSteps,
  className = '',
}: Omit<StepsProgressBarProps, 'variant' | 'showLabels'>) {
  const percentage = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Step badge */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
        <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center">
          <span className="text-white dark:text-black text-xs font-bold">{currentStep}</span>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* Percentage */}
      <span className="text-sm font-bold text-black dark:text-white">{percentage}%</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">Complete</span>
    </div>
  )
}

// Minimal variant for inline use
export function MinimalStepsIndicator({
  currentStep,
  totalSteps,
  className = '',
}: Omit<StepsProgressBarProps, 'variant' | 'showLabels'>) {
  const percentage = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center">
          <span className="text-white dark:text-black text-xs font-bold">{currentStep}</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">/ {totalSteps}</span>
      </div>
      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-black dark:bg-white rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
