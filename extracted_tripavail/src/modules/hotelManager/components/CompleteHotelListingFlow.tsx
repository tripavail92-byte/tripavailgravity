import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Plus, Minus, Upload, X } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { 
  PropertyTypeIcon,
  LocationIcon,
  AmenitiesIcon,
  PhotosIcon,
  PricingIcon
} from '../../../components/icons/hotel-listing/HotelListingIcons';
import {
  BasicInfoIcon,
  ModernLocationIcon,
  ModernAmenitiesIcon,
  ModernRoomsIcon,
  ModernPoliciesIcon,
  ModernPhotosIcon,
  ModernServicesIcon,
  ModernReviewIcon
} from '../../../components/icons/hotel-listing/ModernStepIcons';
import { AnimatedPropertyTypeIcons } from '../../../components/icons/hotel-listing/AnimatedPropertyTypeIcons';
import { PremiumPropertyVector } from '../../../components/icons/hotel-listing/PremiumPropertyVectors';
import { PropertyDescriptionAI } from '../../../components/ai/PropertyDescriptionAI';
import { AirbnbBottomNav } from '../../../components/hotel-listing/AirbnbBottomNav';
import { 
  PhotosStep as ComprehensivePhotosStep,
  ReviewStep
} from './CompleteHotelListingFlowSteps';
import { ModernLocationStep } from './ModernLocationStep';
import { ModernAmenitiesStep } from './ModernAmenitiesStep';
import { ModernRoomsStep } from './ModernRoomsStep';
import { ModernPoliciesStep } from './ModernPoliciesStep';
import { ModernPhotosStep } from './ModernPhotosStep';
import { ModernServicesStep } from './ModernServicesStep';
import { RoomBasicInfoStep } from './steps/RoomBasicInfoStep';
import { RoomTypeSelectionStep } from './steps/RoomTypeSelectionStep';
import { BedConfigurationStep } from './steps/BedConfigurationStep';
import { RoomAmenitiesStep } from './steps/RoomAmenitiesStep';
import { RoomSummaryStep } from './steps/RoomSummaryStep';

interface Step {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
}

interface HotelData {
  // Basic Info
  hotelName: string;
  propertyType: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  
  // Location
  country: string;
  city: string;
  area: string;
  address: string;
  zipCode: string;
  coordinates?: { lat: number; lng: number };
  
  // Amenities
  amenities: string[];
  
  // Rooms
  rooms: Array<{
    id: string;
    type: string;
    capacity: number;
    beds: string;
    size: number;
    amenities: string[];
    basePrice: number;
    currency: string;
  }>;
  
  // Policies
  checkIn: string;
  checkOut: string;
  cancellationPolicy: string;
  houseRules: string[];
  childrenPolicy: string;
  petPolicy: string;
  smokingPolicy: string;
  
  // Photos
  photos: {
    exterior: string[];
    lobby: string[];
    rooms: string[];
    amenities: string[];
    dining: string[];
    other: string[];
  };
  
  // Additional Services
  services: string[];
  languages: string[];
  accessibility: string[];
}

interface CompleteHotelListingFlowProps {
  onComplete?: (data: Partial<HotelData>) => void;
  onBack: () => void;
  onSaveAndExit?: () => void;
}

export default function CompleteHotelListingFlow({ onComplete, onBack, onSaveAndExit }: CompleteHotelListingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [hotelData, setHotelData] = useState<Partial<HotelData>>({
    amenities: [],
    rooms: [],
    houseRules: [],
    photos: {
      exterior: [],
      lobby: [],
      rooms: [],
      amenities: [],
      dining: [],
      other: []
    },
    services: [],
    languages: [],
    accessibility: []
  });

  const steps: Step[] = [
    {
      id: 1,
      title: 'Property Type',
      description: 'What type of property are you listing?',
      component: PropertyTypeStep,
      completed: completedSteps.includes(1),
      required: true
    },
    {
      id: 2,
      title: hotelData.propertyType 
        ? `${hotelData.propertyType} Details` 
        : 'Property Details',
      description: 'Tell us about your property',
      component: PropertyDetailsStep,
      completed: completedSteps.includes(2),
      required: true
    },
    {
      id: 3,
      title: 'Location Details',
      description: 'Where is your property located?',
      component: ModernLocationStep,
      completed: completedSteps.includes(3),
      required: true
    },
    {
      id: 4,
      title: 'Amenities & Features',
      description: 'What facilities do you offer?',
      component: ModernAmenitiesStep,
      completed: completedSteps.includes(4),
      required: true
    },
    {
      id: 5,
      title: 'Room Type',
      description: 'Choose room category',
      component: RoomTypeSelectionStep,
      completed: completedSteps.includes(5),
      required: true
    },
    {
      id: 6,
      title: 'Room Basic Info',
      description: 'Tell us about your room',
      component: RoomBasicInfoStep,
      completed: completedSteps.includes(6),
      required: true
    },
    {
      id: 7,
      title: 'Bed Configuration',
      description: 'Select bed types',
      component: BedConfigurationStep,
      completed: completedSteps.includes(7),
      required: true
    },
    {
      id: 8,
      title: 'Room Amenities',
      description: 'Room-specific amenities',
      component: RoomAmenitiesStep,
      completed: completedSteps.includes(8),
      required: true
    },
    {
      id: 9,
      title: 'Room Summary',
      description: 'Review and save room',
      component: RoomSummaryStep,
      completed: completedSteps.includes(9),
      required: true
    },
    {
      id: 10,
      title: 'Policies & Rules',
      description: 'Set your property policies',
      component: ModernPoliciesStep,
      completed: completedSteps.includes(10),
      required: true
    },
    {
      id: 11,
      title: 'Photos & Media',
      description: 'Showcase your property',
      component: ModernPhotosStep,
      completed: completedSteps.includes(11),
      required: true
    },
    {
      id: 12,
      title: 'Additional Services',
      description: 'Extra services and accessibility',
      component: ModernServicesStep,
      completed: completedSteps.includes(12),
      required: false
    },
    {
      id: 13,
      title: 'Review & Publish',
      description: 'Review your listing before going live',
      component: ReviewStep,
      completed: completedSteps.includes(13),
      required: true
    }
  ];

  const getCurrentStepIcon = (stepId: number, size: number = 56) => {
    const isActive = currentStep === stepId;
    
    // For step 1, show the property type selection icon
    if (stepId === 1) {
      return <PropertyTypeIcon isActive={isActive} isSelected={isActive} size={size} />;
    }
    
    // For all other steps (2-9), show the premium 3D property vector
    const propertyType = hotelData.propertyType || 'hotel';
    return (
      <motion.div
        key={`${propertyType}-${stepId}`}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 10 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
      >
        <PremiumPropertyVector 
          propertyType={propertyType as any} 
          size={size * 1.8} 
        />
      </motion.div>
    );
  };

  const handleStepComplete = (stepId: number, data: any) => {
    // Update hotel data
    setHotelData(prev => ({ ...prev, ...data }));
    
    // Mark step as completed
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    
    // Special handling for Room Summary step (step 9)
    // If "addAnother" is true, go back to step 5 (Room Basic Info) to add another room
    if (stepId === 9 && data.addAnother) {
      setCurrentStep(5);
      return;
    }
    
    // Move to next step or complete
    if (stepId < steps.length) {
      setCurrentStep(stepId + 1);
    } else {
      // All steps completed
      onComplete({ ...hotelData, ...data } as HotelData);
    }
  };

  const goToStep = (stepId: number) => {
    if (stepId <= Math.max(...completedSteps) + 1) {
      setCurrentStep(stepId);
    }
  };

  const handleSaveAndExit = () => {
    // Save current progress
    if (onComplete) {
      onComplete(hotelData);
    }
    // Exit to dashboard if handler provided, otherwise go back
    if (onSaveAndExit) {
      onSaveAndExit();
    } else {
      onBack();
    }
  };

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Save and Exit Button - Top Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-4 py-3"
      >
        <button
          onClick={handleSaveAndExit}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-medium">Save & Exit</span>
        </button>
      </motion.div>

      {/* Scrollable Step Content */}
      <div className="flex-1 overflow-y-auto pb-64 px-4 py-6">
        <AnimatePresence mode="wait">
          {currentStepData && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-2xl mx-auto">
                {/* Step Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.1, 
                      type: "spring", 
                      stiffness: 200,
                      damping: 15
                    }}
                    className="mb-4 flex justify-center"
                  >
                    {getCurrentStepIcon(currentStep, 72)}
                  </motion.div>
                  <motion.h1 
                    className="text-2xl font-semibold text-gray-900 mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {currentStepData.title}
                  </motion.h1>
                  <motion.p 
                    className="text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {currentStepData.description}
                  </motion.p>
                </div>

                {/* Step Component */}
                <currentStepData.component
                  onComplete={(data: any) => handleStepComplete(currentStep, data)}
                  isCompleted={completedSteps.includes(currentStep)}
                  existingData={hotelData}
                  onUpdate={(data: any) => {
                    const updatedData = { ...hotelData, ...data };
                    setHotelData(updatedData);
                    // Call parent's onComplete to update the icon
                    if (onComplete) {
                      onComplete(updatedData);
                    }
                  }}
                  onBack={currentStep === 1 ? onBack : () => setCurrentStep(currentStep - 1)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation - Airbnb Style */}
      <AirbnbBottomNav
        currentStep={currentStep}
        totalSteps={steps.length}
        completedSteps={completedSteps.length}
        onBack={() => {
          if (currentStep === 1) {
            onBack(); // Exit to dashboard on first step
          } else {
            setCurrentStep(currentStep - 1); // Go to previous step
          }
        }}
        onNext={() => {
          // Move to next step (step components handle their own validation)
          if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
          }
        }}
        showBack={true}
        showNext={currentStep < steps.length}
        backLabel="Back"
        nextLabel={currentStep === steps.length ? 'Publish' : 'Next'}
      />
    </div>
  );
}

// Step Components

// Step 1: Property Type Selection
function PropertyTypeStep({ onComplete, existingData, onUpdate, onBack }: any) {
  const [selectedType, setSelectedType] = useState(existingData?.propertyType || '');

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    onUpdate({ propertyType: type });
  };

  const handleContinue = () => {
    if (selectedType) {
      onComplete({ propertyType: selectedType });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
          Select your property type to get started
        </label>
        <AnimatedPropertyTypeIcons
          selectedType={selectedType}
          onTypeSelect={handleTypeSelect}
          className="mb-6"
        />
      </motion.div>

      {/* Info Card */}
      {selectedType && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-50 to-cyan-50 p-4 rounded-xl border border-purple-100"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-hotel-manager rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                {selectedType} Selected
              </h4>
              <p className="text-sm text-gray-600">
                Perfect! Next, we'll gather specific details about your {selectedType.toLowerCase()}.
              </p>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}

// Step 2: Property Details (Dynamic based on property type)
function PropertyDetailsStep({ onComplete, existingData, onUpdate, onBack }: any) {
  const [formData, setFormData] = useState({
    hotelName: existingData?.hotelName || '',
    description: existingData?.description || '',
    contactEmail: existingData?.contactEmail || '',
    contactPhone: existingData?.contactPhone || ''
  });

  const [showAISuggestions, setShowAISuggestions] = useState(false);
  
  const propertyType = existingData?.propertyType || 'Property';

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const handleAISuggestionSelect = (suggestion: string) => {
    handleInputChange('description', suggestion);
    setShowAISuggestions(false);
  };

  const handleContinue = () => {
    if (formData.hotelName && formData.description && formData.contactEmail) {
      onComplete(formData);
    }
  };

  const isValid = formData.hotelName && formData.description && formData.contactEmail;

  return (
    <div className="space-y-6">
      {/* Property Type Indicator - Black Airbnb Style */}
      <div className="bg-black p-4 rounded-lg -mx-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-black text-xs font-bold">✓</span>
          </div>
          <span className="text-sm font-medium text-white">
            Listing a <span className="font-bold">{propertyType}</span>
          </span>
        </div>
      </div>

      {/* Property Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {propertyType} Name *
        </label>
        <Input
          type="text"
          placeholder={`Enter your ${propertyType.toLowerCase()} name`}
          value={formData.hotelName}
          onChange={(e) => handleInputChange('hotelName', e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Example: Sunset View {propertyType}, Paradise {propertyType}
        </p>
      </div>

      {/* Description with AI Assistant */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {propertyType} Description *
          </label>
          <button
            onClick={() => setShowAISuggestions(!showAISuggestions)}
            className="text-xs text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
          >
            <motion.div
              animate={{ rotate: showAISuggestions ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ✨
            </motion.div>
            AI Assistant
          </button>
        </div>
        
        <Textarea
          placeholder={`Describe your ${propertyType.toLowerCase()}, its unique features, and what makes it special...`}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full min-h-[120px] mb-2"
        />
        <p className="text-xs text-gray-500 mb-3">
          {formData.description.length}/500 characters
        </p>

        {/* AI Suggestions */}
        <AnimatePresence>
          {showAISuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PropertyDescriptionAI
                propertyType={propertyType}
                hotelName={formData.hotelName}
                onSuggestionSelect={handleAISuggestionSelect}
                className="mb-4"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email *
          </label>
          <Input
            type="email"
            placeholder="contact@yourhotel.com"
            value={formData.contactEmail}
            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <Input
            type="tel"
            placeholder="+92 300 1234567"
            value={formData.contactPhone}
            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
          />
        </div>
      </div>

    </div>
  );
}





