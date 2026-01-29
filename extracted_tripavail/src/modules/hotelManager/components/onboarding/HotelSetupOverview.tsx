import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronRight, MapPin, Camera, Bed, DollarSign, Shield, Hotel } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  required: boolean;
}

interface HotelSetupOverviewProps {
  onStartStep: (stepId: string) => void;
  onGetStarted: () => void;
  completedSteps: string[];
}

// Map step IDs from onboarding to overview cards
const STEP_MAPPING: Record<string, string> = {
  'welcome': 'basic-info',
  'hotel-info': 'basic-info',
  'location': 'basic-info',
  'amenities': 'property-photos',
  'rules': 'pricing-policies',
  'rooms': 'room-details',
  'review': 'verification',
};

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Hotel name, location, contact details',
    icon: MapPin,
    completed: false,
    required: true,
  },
  {
    id: 'property-photos',
    title: 'Property Photos',
    description: 'Upload high-quality images',
    icon: Camera,
    completed: false,
    required: true,
  },
  {
    id: 'room-details',
    title: 'Room Details',
    description: 'Room types, amenities, capacity',
    icon: Bed,
    completed: false,
    required: true,
  },
  {
    id: 'pricing-policies',
    title: 'Pricing & Policies',
    description: 'Room rates, cancellation policy',
    icon: DollarSign,
    completed: false,
    required: true,
  },
  {
    id: 'verification',
    title: 'Verification',
    description: 'Document verification',
    icon: Shield,
    completed: false,
    required: true,
  },
];

export function HotelSetupOverview({ onStartStep, onGetStarted, completedSteps }: HotelSetupOverviewProps) {
  const [steps, setSteps] = useState(() =>
    SETUP_STEPS.map(step => {
      // Check if any of the mapped onboarding steps are completed
      const mappedSteps = Object.entries(STEP_MAPPING)
        .filter(([_, overviewId]) => overviewId === step.id)
        .map(([onboardingId, _]) => onboardingId);
      
      const isCompleted = mappedSteps.some(stepId => completedSteps.includes(stepId));
      
      return {
        ...step,
        completed: isCompleted,
      };
    })
  );

  const completedCount = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const handleStepClick = (overviewStepId: string) => {
    // Map overview step to actual onboarding step
    const onboardingStep = Object.entries(STEP_MAPPING).find(
      ([_, overviewId]) => overviewId === overviewStepId
    );
    
    if (onboardingStep) {
      onStartStep(onboardingStep[0]); // Use onboarding step ID
    } else {
      // Default mapping
      switch (overviewStepId) {
        case 'basic-info':
          onStartStep('welcome');
          break;
        case 'property-photos':
          onStartStep('amenities');
          break;
        case 'room-details':
          onStartStep('rooms');
          break;
        case 'pricing-policies':
          onStartStep('rules');
          break;
        case 'verification':
          onStartStep('review');
          break;
        default:
          onGetStarted();
      }
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="px-6 py-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center"
        >
          <Hotel className="w-8 h-8 text-white" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-semibold text-gray-900 mb-2"
        >
          List Your Hotel
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6"
        >
          Get your property online and start receiving bookings
        </motion.p>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Setup Progress</span>
            <span className="text-red-600 font-medium">
              {completedCount} of {totalSteps} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Steps */}
      <div className="px-6 space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  step.completed
                    ? 'border-green-200 bg-green-50 hover:bg-green-100'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md'
                }`}
                onClick={() => handleStepClick(step.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Step Number / Check */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {step.completed ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Arrow or Status */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        step.completed
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          step.completed
                            ? 'text-green-600'
                            : 'text-gray-600'
                        }`}
                      />
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 ${
                        step.completed
                          ? 'text-green-500'
                          : 'text-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* CTA Button */}
      <div className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">+</span>
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2">
            Start Hotel Setup
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Begin the 5-step process to list your property
          </p>
          
          <Button
            onClick={onGetStarted}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-medium"
          >
            Get Started
          </Button>
        </motion.div>
      </div>

      {/* Bottom Encouragement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="px-6 pb-6"
      >
        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-blue-600">⚡</span>
            <span className="font-medium text-blue-900">Quick Setup</span>
          </div>
          <p className="text-sm text-blue-800">
            Most hotels complete setup in under 15 minutes
          </p>
        </div>
      </motion.div>
    </div>
  );
}