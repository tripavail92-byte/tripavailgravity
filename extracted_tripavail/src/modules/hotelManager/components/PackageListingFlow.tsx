import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { AirbnbBottomNav } from '../../../components/hotel-listing/AirbnbBottomNav';

// Import all step components
import { PackageSelectionStep } from './packageSteps/PackageSelectionStep';
import { SmallDescriptionStep } from './packageSteps/SmallDescriptionStep';
import { HighlightsStepMerged } from './packageSteps/HighlightsStepMerged';
import { CalendarStep } from './packageSteps/CalendarStep';
import { ExclusionsStep } from './packageSteps/ExclusionsStep';
import { PricingStep } from './packageSteps/PricingStep';
import { MediaStep } from './packageSteps/MediaStep';
import { PolicyStep } from './packageSteps/PolicyStep';
import { ConfirmationStep } from './packageSteps/ConfirmationStep';

export interface PackageData {
  // Package Selection
  packageType?: string;
  
  // Small Description
  smallDescription?: string;
  
  // Basics
  title?: string;
  fullDescription?: string;
  hotelName?: string;
  
  // Package Highlights (Merged - Free Inclusions + Discounts)
  freeInclusions?: Array<{
    name: string;
    icon?: string;
  }>;
  discountOffers?: Array<{
    name: string;
    originalPrice: number;
    discount: number;
    icon?: string;
  }>;
  
  // Calendar
  availability?: {
    type: 'date-ranges' | 'year-round';
    dateRanges?: Array<{ start: Date; end: Date }>;
    blackoutDates?: Date[];
    minStay?: number;
    maxStay?: number;
  };
  
  // Exclusions
  exclusions?: string[];
  
  // Pricing
  basePrice?: number;
  totalPrice?: number;
  
  // Media
  media?: {
    coverPhoto?: string;
    supportingPhotos?: string[];
    video?: string;
  };
  
  // Policy
  policies?: {
    cancellationPolicy?: string;
    noShowPolicy?: string;
    customPolicies?: string[];
  };
}

interface PackageListingFlowProps {
  onComplete: (packageData: PackageData) => void;
  onBack?: () => void;
  existingData?: PackageData;
}

export function PackageListingFlow({ onComplete, onBack, existingData }: PackageListingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [packageData, setPackageData] = useState<PackageData>(existingData || {});

  const steps = [
    { id: 'step0', title: 'Package Type', component: PackageSelectionStep, required: true },
    { id: 'step1', title: 'Description', component: SmallDescriptionStep, required: true },
    { id: 'step2', title: 'Package Highlights', component: HighlightsStepMerged, required: true },
    { id: 'step3', title: 'Availability', component: CalendarStep, required: true },
    { id: 'step4', title: 'Exclusions', component: ExclusionsStep, required: false },
    { id: 'step5', title: 'Pricing', component: PricingStep, required: true },
    { id: 'step6', title: 'Photos & Media', component: MediaStep, required: true },
    { id: 'step7', title: 'Review & Publish', component: ConfirmationStep, required: true }
  ];

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  const handleStepComplete = (stepData: any) => {
    const updatedData = { ...packageData, ...stepData };
    setPackageData(updatedData);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final step - complete the flow
      onComplete(updatedData);
    }
  };

  const handleStepUpdate = (stepData: any) => {
    const updatedData = { ...packageData, ...stepData };
    setPackageData(updatedData);
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const getStepProgress = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Scrollable Step Content */}
      <div className="flex-1 overflow-y-auto pb-64 px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <StepComponent
              onComplete={handleStepComplete}
              onUpdate={handleStepUpdate}
              existingData={packageData}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation - Airbnb Style */}
      <AirbnbBottomNav
        currentStep={currentStep + 1}
        totalSteps={steps.length}
        completedSteps={currentStep}
        onBack={() => {
          if (currentStep === 0) {
            onBack?.(); // Exit to packages list on first step
          } else {
            setCurrentStep(prev => prev - 1); // Go to previous step
          }
        }}
        onNext={() => {
          // Move to next step
          if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
          }
        }}
        showBack={true}
        showNext={currentStep < steps.length - 1}
        backLabel="Back"
        nextLabel={currentStep === steps.length - 1 ? 'Publish' : 'Next'}
      />
    </div>
  );
}