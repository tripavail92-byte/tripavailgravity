import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronRight } from 'lucide-react';

interface StepProgress {
  stepId: string;
  completed: boolean;
  data?: any;
}

interface StepCompletionTrackerProps {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  onReturnToOverview: () => void;
}

export function StepCompletionTracker({ 
  currentStep, 
  completedSteps, 
  totalSteps, 
  onReturnToOverview 
}: StepCompletionTrackerProps) {
  const completedCount = completedSteps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            {completedCount === totalSteps ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <span className="text-sm font-medium text-green-600">
                {completedCount}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {completedCount} of {totalSteps} completed
            </p>
            <p className="text-sm text-gray-600">
              {completedCount === totalSteps 
                ? 'Setup complete!' 
                : `${totalSteps - completedCount} steps remaining`
              }
            </p>
          </div>
        </div>
        
        <button
          onClick={onReturnToOverview}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          View all steps
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Mini Progress Bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-1.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}