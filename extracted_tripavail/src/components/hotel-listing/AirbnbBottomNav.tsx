import React from 'react';
import { StepsProgressBar } from './StepsProgressBar';

interface AirbnbBottomNavProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  showBack?: boolean;
  showNext?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
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
  backLabel = 'Back'
}: AirbnbBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white z-50 pt-4">
      {/* Steps Progress Bar - Absolutely no padding/margin above */}
      <div className="px-4 -mt-4">
        <StepsProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          completedSteps={completedSteps}
          showLabels={true}
        />
      </div>

      {/* Back and Next Buttons */}
      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          {/* Back Button - Airbnb style text with underline */}
          {showBack ? (
            <button
              onClick={onBack}
              className="text-gray-900 font-semibold underline decoration-2 underline-offset-4 hover:text-gray-700 transition-colors"
            >
              {backLabel}
            </button>
          ) : (
            <div />
          )}

          {/* Next Button - Airbnb style black rounded button */}
          {showNext && (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                nextDisabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
