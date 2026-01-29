import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { AirbnbBottomNav } from '../../../components/hotel-listing/AirbnbBottomNav';

// Import step components
import { HotelSetupOverview } from '../components/onboarding/HotelSetupOverview';
import { StepCompletionTracker } from '../components/onboarding/StepCompletionTracker';
import { CompletionCelebration } from '../components/onboarding/CompletionCelebration';
import { MotivationalBadge } from '../components/onboarding/MotivationalBadge';
import { WelcomeStep } from '../components/onboarding/WelcomeStep';
import { HotelInfoStep } from '../components/onboarding/HotelInfoStep';
import { LocationStep } from '../components/onboarding/LocationStep';
import { AmenitiesStep } from '../components/onboarding/AmenitiesStep';
import { RulesStep } from '../components/onboarding/RulesStep';
import { RoomDetailsStep } from '../components/onboarding/RoomDetailsStep';
import { ReviewStep } from '../components/onboarding/ReviewStep';
import { SuccessStep } from '../components/onboarding/SuccessStep';

interface HotelOnboardingScreenProps {
  onNavigate: (screen: string) => void;
}

interface OnboardingData {
  // Personal Info
  fullName: string;
  email: string;
  phone: string;
  
  // Hotel Info
  hotelName: string;
  hotelAddress: string;
  coordinates: { lat: number; lng: number } | null;
  
  // Amenities
  selectedAmenities: string[];
  
  // Rules & Policies
  checkIn: string;
  checkOut: string;
  childrenPolicy: boolean;
  childrenAgeLimit: number;
  petPolicy: boolean;
  petTypes: string[];
  petFee: number;
  otherRules: string;
  
  // Room Details
  rooms: Array<{
    id: string;
    name: string;
    description: string;
    maxOccupancy: number;
    bedType: string;
    basePrice: number;
    roomSize: number;
    amenities: string[];
    photos: string[];
  }>;
}

const STEPS = [
  { id: 'overview', title: 'Overview', component: HotelSetupOverview },
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'hotel-info', title: 'Hotel Info', component: HotelInfoStep },
  { id: 'location', title: 'Location', component: LocationStep },
  { id: 'amenities', title: 'Amenities', component: AmenitiesStep },
  { id: 'rules', title: 'Rules', component: RulesStep },
  { id: 'rooms', title: 'Rooms', component: RoomDetailsStep },
  { id: 'review', title: 'Review', component: ReviewStep },
  { id: 'success', title: 'Success', component: SuccessStep },
];

export default function HotelOnboardingScreen({ onNavigate }: HotelOnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    fullName: '',
    email: '',
    phone: '',
    hotelName: '',
    hotelAddress: '',
    coordinates: null,
    selectedAmenities: [],
    checkIn: '14:00',
    checkOut: '12:00',
    childrenPolicy: true,
    childrenAgeLimit: 12,
    petPolicy: false,
    petTypes: [],
    petFee: 0,
    otherRules: '',
    rooms: [],
  });

  const currentStepData = STEPS[currentStep];
  const StepComponent = currentStepData?.component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
    
    // Mark step as completed
    const currentStepId = STEPS[currentStep].id;
    if (!completedSteps.includes(currentStepId)) {
      setCompletedSteps(prev => [...prev, currentStepId]);
      
      // Show celebration for meaningful steps
      if (!['overview', 'success'].includes(currentStepId)) {
        setShowCelebration(STEPS[currentStep].title);
        
        // Auto-hide celebration and proceed
        setTimeout(() => {
          setShowCelebration(null);
          handleNext();
        }, 2000);
        return;
      }
    }
    
    handleNext();
  };

  // Handle starting a specific step from overview
  const handleStartStep = (stepId: string) => {
    const stepIndex = STEPS.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      // Find corresponding actual step (skip overview)
      const actualStepIndex = stepIndex === 0 ? 1 : stepIndex; 
      setCurrentStep(actualStepIndex);
    }
  };

  // Handle getting started from overview
  const handleGetStarted = () => {
    setCurrentStep(1); // Start with welcome step
  };

  // Handle returning to overview
  const handleReturnToOverview = () => {
    setCurrentStep(0);
  };

  const handleSubmit = () => {
    // Handle final submission
    console.log('Onboarding completed:', onboardingData);
    // Navigate to success or dashboard
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Scrollable Step Content */}
      <div className="flex-1 overflow-y-auto pb-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-4"
          >
            {currentStep === 0 ? (
              <HotelSetupOverview
                onStartStep={handleStartStep}
                onGetStarted={handleGetStarted}
                completedSteps={completedSteps}
              />
            ) : (
              <>
                {/* Motivational Badge */}
                {currentStep > 0 && currentStep < STEPS.length - 1 && completedSteps.length > 0 && (
                  <MotivationalBadge
                    completedSteps={completedSteps.length}
                    totalSteps={STEPS.length - 2} // Exclude overview and success
                  />
                )}

                {/* Step Progress Tracker - Show on non-overview steps */}
                {currentStep > 0 && currentStep < STEPS.length - 1 && (
                  <StepCompletionTracker
                    currentStep={STEPS[currentStep].id}
                    completedSteps={completedSteps}
                    totalSteps={STEPS.length - 2} // Exclude overview and success
                    onReturnToOverview={handleReturnToOverview}
                  />
                )}
                
                {StepComponent && StepComponent !== HotelSetupOverview && (
                  <StepComponent
                    data={onboardingData}
                    onComplete={handleStepComplete}
                    onNext={handleNext}
                    onSubmit={handleSubmit}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step Indicators - Hide on overview and success */}
      {currentStep > 0 && currentStep < STEPS.length - 1 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
            {STEPS.slice(1, -1).map((step, index) => (
              <motion.div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index <= currentStep - 1
                    ? 'bg-green-600' 
                    : 'bg-gray-300'
                }`}
                animate={index <= currentStep - 1 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completion Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <CompletionCelebration
            stepName={showCelebration}
            onContinue={() => {
              setShowCelebration(null);
              handleNext();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}