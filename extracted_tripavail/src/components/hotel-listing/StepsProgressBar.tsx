import React from 'react';

interface StepsProgressBarProps {
  currentStep: number;
  totalSteps: number;
  completedSteps?: number;
  showLabels?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export function StepsProgressBar({ 
  currentStep, 
  totalSteps, 
  completedSteps,
  showLabels = true,
  variant = 'default',
  className = ''
}: StepsProgressBarProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);
  const stepsCompleted = completedSteps ?? currentStep - 1;
  const stepsRemaining = totalSteps - currentStep;

  return (
    <div className={`w-full ${className}`}>
      {/* Segmented Progress bar - Divided into steps */}
      <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex gap-[2px]">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          return (
            <div
              key={index}
              className="h-full flex-1 transition-all duration-300 ease-out"
              style={{
                backgroundColor: isCompleted 
                  ? '#000000' 
                  : index === currentStep 
                    ? '#E5E5E5' 
                    : 'transparent',
                borderRadius: index === 0 
                  ? '9999px 0 0 9999px' 
                  : index === totalSteps - 1 
                    ? '0 9999px 9999px 0' 
                    : '0'
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Compact variant for use in headers
export function CompactStepsProgress({ 
  currentStep, 
  totalSteps,
  className = ''
}: Omit<StepsProgressBarProps, 'variant' | 'showLabels'>) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

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
      <span className="text-sm font-bold text-black dark:text-white">
        {percentage}%
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">Complete</span>
    </div>
  );
}

// Minimal variant for inline use
export function MinimalStepsIndicator({ 
  currentStep, 
  totalSteps,
  className = ''
}: Omit<StepsProgressBarProps, 'variant' | 'showLabels'>) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

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
  );
}
