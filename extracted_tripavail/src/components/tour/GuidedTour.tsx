import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft, Play, Check, HelpCircle, Target } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'scroll' | 'none';
  content?: React.ReactNode;
  skippable?: boolean;
  highlight?: boolean;
}

export interface TourConfig {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

interface GuidedTourProps {
  tour: TourConfig;
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const GuidedTour = ({ tour, isActive, onComplete, onSkip }: GuidedTourProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = tour.steps[currentStepIndex];
  const isLastStep = currentStepIndex === tour.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      findTargetElement();
    } else {
      setIsVisible(false);
    }
  }, [isActive, currentStepIndex]);

  useEffect(() => {
    if (targetElement && tooltipRef.current) {
      calculateTooltipPosition();
    }
  }, [targetElement, currentStep]);

  const findTargetElement = () => {
    if (!currentStep?.target) return;

    const element = document.querySelector(currentStep.target) as HTMLElement;
    if (element) {
      setTargetElement(element);
      
      // Scroll element into view
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const calculateTooltipPosition = () => {
    if (!targetElement || !tooltipRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 20;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 20;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 20;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 20;
        break;
      case 'center':
        top = (viewport.height - tooltipRect.height) / 2;
        left = (viewport.width - tooltipRect.width) / 2;
        break;
    }

    // Keep tooltip within viewport bounds
    top = Math.max(20, Math.min(top, viewport.height - tooltipRect.height - 20));
    left = Math.max(20, Math.min(left, viewport.width - tooltipRect.width - 20));

    setTooltipPosition({ top, left });
  };

  const nextStep = () => {
    if (isLastStep) {
      completeTour();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    onComplete();
    tour.onComplete?.();
  };

  const skipTour = () => {
    setIsVisible(false);
    onSkip();
    tour.onSkip?.();
  };

  const handleTargetClick = () => {
    if (currentStep.action === 'click') {
      setTimeout(nextStep, 500);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] pointer-events-none"
          >
            {/* Highlight target element */}
            {targetElement && currentStep.highlight && (
              <motion.div
                className="absolute border-4 border-[#E11D48] rounded-lg pointer-events-none"
                style={{
                  top: targetElement.getBoundingClientRect().top - 4,
                  left: targetElement.getBoundingClientRect().left - 4,
                  width: targetElement.getBoundingClientRect().width + 8,
                  height: targetElement.getBoundingClientRect().height + 8,
                }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 #E11D4840',
                    '0 0 0 20px #E11D4820',
                    '0 0 0 0 #E11D4840'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              top: tooltipPosition.top,
              left: tooltipPosition.left
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed z-[101] pointer-events-auto"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left
            }}
          >
            <Card className="p-6 w-80 shadow-2xl border-2 border-[#E11D48]/20">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#E11D48] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {currentStepIndex + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{currentStep.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      Step {currentStepIndex + 1} of {tour.steps.length}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="p-1 h-6 w-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {currentStep.description}
                </p>
                
                {currentStep.content && (
                  <div className="mt-4">
                    {currentStep.content}
                  </div>
                )}

                {currentStep.action && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Action Required:</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {currentStep.action === 'click' && 'Click the highlighted element to continue'}
                      {currentStep.action === 'hover' && 'Hover over the highlighted element'}
                      {currentStep.action === 'scroll' && 'Scroll to see more content'}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((currentStepIndex + 1) / tour.steps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <motion.div
                    className="bg-[#E11D48] h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStepIndex + 1) / tour.steps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {!isFirstStep && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      className="flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back
                    </Button>
                  )}
                  
                  {currentStep.skippable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipTour}
                      className="text-gray-500"
                    >
                      Skip Tour
                    </Button>
                  )}
                </div>

                <Button
                  onClick={nextStep}
                  size="sm"
                  className="bg-[#E11D48] hover:bg-[#BE185D] flex items-center gap-1"
                  disabled={currentStep.action === 'click' && targetElement}
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-3 h-3" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Arrow pointing to target */}
            {targetElement && currentStep.position !== 'center' && (
              <motion.div
                className="absolute w-0 h-0"
                style={{
                  ...(currentStep.position === 'top' && {
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid white'
                  }),
                  ...(currentStep.position === 'bottom' && {
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid white'
                  }),
                  ...(currentStep.position === 'left' && {
                    right: -8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderLeft: '8px solid white'
                  }),
                  ...(currentStep.position === 'right' && {
                    left: -8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: '8px solid white'
                  })
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
            )}
          </motion.div>

          {/* Click overlay for target element */}
          {targetElement && currentStep.action === 'click' && (
            <div
              className="fixed z-[99] cursor-pointer"
              style={{
                top: targetElement.getBoundingClientRect().top,
                left: targetElement.getBoundingClientRect().left,
                width: targetElement.getBoundingClientRect().width,
                height: targetElement.getBoundingClientRect().height,
              }}
              onClick={handleTargetClick}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
};