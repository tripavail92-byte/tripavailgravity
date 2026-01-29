import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { AirbnbBottomNav } from '../../../components/hotel-listing/AirbnbBottomNav';

// Import tour creation steps
import { TourBasicsStep } from '../components/tourSteps/TourBasicsStep';
import { TourItineraryStep } from '../components/tourSteps/TourItineraryStep';
import { TourPricingStep } from '../components/tourSteps/TourPricingStep';
import { TourMediaStep } from '../components/tourSteps/TourMediaStep';
import { TourPoliciesStep } from '../components/tourSteps/TourPoliciesStep';
import { TourCalendarStep } from '../components/tourSteps/TourCalendarStep';
import { TourConfirmationStep } from '../components/tourSteps/TourConfirmationStep';

interface TourCreationScreenProps {
  onNavigate: (screen: string) => void;
}

const TOUR_CREATION_STEPS = [
  { id: 'basics', title: 'Tour Basics', component: TourBasicsStep },
  { id: 'itinerary', title: 'Itinerary', component: TourItineraryStep },
  { id: 'pricing', title: 'Pricing', component: TourPricingStep },
  { id: 'media', title: 'Media', component: TourMediaStep },
  { id: 'policies', title: 'Policies', component: TourPoliciesStep },
  { id: 'calendar', title: 'Schedule', component: TourCalendarStep },
  { id: 'confirmation', title: 'Review', component: TourConfirmationStep }
];

export default function TourCreationScreen({ onNavigate }: TourCreationScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tourData, setTourData] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);

  const progress = ((currentStep + 1) / TOUR_CREATION_STEPS.length) * 100;
  const CurrentStepComponent = TOUR_CREATION_STEPS[currentStep].component;

  const handleNext = () => {
    if (currentStep < TOUR_CREATION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCompleting(false);
    onNavigate('tours');
  };

  const updateTourData = (stepData: any) => {
    setTourData(prev => ({ ...prev, ...stepData }));
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
            <CurrentStepComponent
              data={tourData}
              onUpdate={updateTourData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isFirst={currentStep === 0}
              isLast={currentStep === TOUR_CREATION_STEPS.length - 1}
              isCompleting={isCompleting}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation - Airbnb Style */}
      <AirbnbBottomNav
        currentStep={currentStep + 1}
        totalSteps={TOUR_CREATION_STEPS.length}
        completedSteps={currentStep}
        onBack={() => {
          if (currentStep === 0) {
            onNavigate('tours'); // Exit to tours list on first step
          } else {
            handlePrevious(); // Go to previous step
          }
        }}
        onNext={handleNext}
        showBack={true}
        showNext={true}
        backLabel="Back"
        nextLabel={currentStep === TOUR_CREATION_STEPS.length - 1 ? 'Complete Tour' : 'Next'}
        nextDisabled={isCompleting}
      />
    </div>
  );
}