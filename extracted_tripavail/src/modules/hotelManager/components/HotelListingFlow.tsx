import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { 
  PropertyTypeIcon,
  LocationIcon,
  AmenitiesIcon,
  PhotosIcon,
  PricingIcon
} from '../../../components/icons/hotel-listing/HotelListingIcons';

interface Step {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  completed: boolean;
}

interface HotelListingFlowProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function HotelListingFlow({ onComplete, onBack }: HotelListingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps: Step[] = [
    {
      id: 1,
      title: 'Property Type',
      description: 'What kind of property are you listing?',
      component: PropertyTypeStep,
      completed: completedSteps.includes(1)
    },
    {
      id: 2,
      title: 'Location',
      description: 'Where is your property located?',
      component: LocationStep,
      completed: completedSteps.includes(2)
    },
    {
      id: 3,
      title: 'Amenities',
      description: 'What amenities do you offer?',
      component: AmenitiesStep,
      completed: completedSteps.includes(3)
    },
    {
      id: 4,
      title: 'Photos',
      description: 'Show off your property',
      component: PhotosStep,
      completed: completedSteps.includes(4)
    },
    {
      id: 5,
      title: 'Pricing',
      description: 'Set your rates',
      component: PricingStep,
      completed: completedSteps.includes(5)
    }
  ];

  const getCurrentStepIcon = (stepId: number) => {
    const isSelected = currentStep === stepId;
    const isCompleted = completedSteps.includes(stepId);

    switch (stepId) {
      case 1: return <PropertyTypeIcon isSelected={isSelected} isCompleted={isCompleted} size={40} />;
      case 2: return <LocationIcon isSelected={isSelected} isCompleted={isCompleted} size={40} />;
      case 3: return <AmenitiesIcon isSelected={isSelected} isCompleted={isCompleted} size={40} />;
      case 4: return <PhotosIcon isSelected={isSelected} isCompleted={isCompleted} size={40} />;
      case 5: return <PricingIcon isSelected={isSelected} isCompleted={isCompleted} size={40} />;
      default: return null;
    }
  };

  const handleStepComplete = (stepId: number, data: any) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    
    if (stepId < 5) {
      setCurrentStep(stepId + 1);
    } else {
      // All steps completed
      setTimeout(() => onComplete(), 1000);
    }
  };

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Progress */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-50">
        <div className="px-4 py-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Step Icon */}
                <motion.button
                  onClick={() => goToStep(step.id)}
                  className="mb-2 transition-transform hover:scale-105"
                  disabled={step.id > currentStep && !completedSteps.includes(step.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  {getCurrentStepIcon(step.id)}
                </motion.button>

                {/* Step Info */}
                <div className="text-center">
                  <h3 className={`text-sm font-medium transition-colors ${
                    currentStep === step.id 
                      ? 'text-[#ff5a5f]'
                      : completedSteps.includes(step.id)
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}>
                    {step.title}
                  </h3>
                  <div className={`text-xs mt-1 transition-colors ${
                    currentStep === step.id 
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  }`}>
                    {completedSteps.includes(step.id) ? 'Completed' : `Step ${step.id}`}
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-200 -z-10">
                    <motion.div
                      className="h-full bg-[#ff5a5f]"
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: completedSteps.includes(step.id) ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2">
            <motion.div
              className="h-2 rounded-full bg-[#ff5a5f]"
              initial={{ width: '0%' }}
              animate={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{completedSteps.length} of {steps.length} completed</span>
            <span>{Math.round((completedSteps.length / steps.length) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          {currentStepData && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-md mx-auto">
                {/* Step Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    {getCurrentStepIcon(currentStep)}
                  </motion.div>
                  <h1 className="text-2xl font-semibold text-gray-900 mt-4 mb-2">
                    {currentStepData.title}
                  </h1>
                  <p className="text-gray-600">
                    {currentStepData.description}
                  </p>
                </div>

                {/* Step Component */}
                <currentStepData.component
                  onComplete={(data: any) => handleStepComplete(currentStep, data)}
                  isCompleted={completedSteps.includes(currentStep)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Step Components
function PropertyTypeStep({ onComplete, isCompleted }: { onComplete: (data: any) => void; isCompleted: boolean }) {
  const [selectedType, setSelectedType] = useState<string>('');

  const propertyTypes = [
    { id: 'hotel', name: 'Hotel', description: 'Traditional hotel with multiple rooms' },
    { id: 'boutique', name: 'Boutique Hotel', description: 'Unique, stylish accommodation' },
    { id: 'resort', name: 'Resort', description: 'Full-service vacation destination' },
    { id: 'motel', name: 'Motel', description: 'Motor hotel for travelers' },
    { id: 'lodge', name: 'Lodge', description: 'Rustic or countryside accommodation' },
    { id: 'inn', name: 'Inn', description: 'Small, cozy accommodation' }
  ];

  const handleSelect = (typeId: string) => {
    setSelectedType(typeId);
    setTimeout(() => {
      onComplete({ propertyType: typeId });
    }, 500);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {propertyTypes.map((type, index) => (
        <motion.button
          key={type.id}
          onClick={() => handleSelect(type.id)}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            selectedType === type.id
              ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <h3 className={`font-semibold mb-1 ${
            selectedType === type.id ? 'text-[#ff5a5f]' : 'text-gray-900'
          }`}>
            {type.name}
          </h3>
          <p className="text-xs text-gray-600">{type.description}</p>
          
          {selectedType === type.id && (
            <motion.div
              className="mt-2 flex items-center gap-1 text-[#ff5a5f]"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Check size={16} />
              <span className="text-xs">Selected</span>
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

function LocationStep({ onComplete, isCompleted }: { onComplete: (data: any) => void; isCompleted: boolean }) {
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const popularLocations = [
    { id: 'lahore', name: 'Lahore', country: 'Pakistan' },
    { id: 'karachi', name: 'Karachi', country: 'Pakistan' },
    { id: 'islamabad', name: 'Islamabad', country: 'Pakistan' },
    { id: 'peshawar', name: 'Peshawar', country: 'Pakistan' },
    { id: 'multan', name: 'Multan', country: 'Pakistan' },
    { id: 'faisalabad', name: 'Faisalabad', country: 'Pakistan' }
  ];

  const handleSelect = (locationId: string) => {
    setSelectedLocation(locationId);
    setTimeout(() => {
      onComplete({ location: locationId });
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">Select your city or search for a specific location</p>
      </div>
      
      {popularLocations.map((location, index) => (
        <motion.button
          key={location.id}
          onClick={() => handleSelect(location.id)}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            selectedLocation === location.id
              ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${
                selectedLocation === location.id ? 'text-[#ff5a5f]' : 'text-gray-900'
              }`}>
                {location.name}
              </h3>
              <p className="text-sm text-gray-600">{location.country}</p>
            </div>
            
            {selectedLocation === location.id && (
              <motion.div
                className="text-[#ff5a5f]"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Check size={20} />
              </motion.div>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}

function AmenitiesStep({ onComplete, isCompleted }: { onComplete: (data: any) => void; isCompleted: boolean }) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const amenities = [
    { id: 'wifi', name: 'Free WiFi', icon: '📶' },
    { id: 'parking', name: 'Free Parking', icon: '🅿️' },
    { id: 'pool', name: 'Swimming Pool', icon: '🏊' },
    { id: 'gym', name: 'Fitness Center', icon: '💪' },
    { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
    { id: 'spa', name: 'Spa & Wellness', icon: '🧘' },
    { id: 'ac', name: 'Air Conditioning', icon: '❄️' },
    { id: 'laundry', name: 'Laundry Service', icon: '👕' },
    { id: 'room-service', name: '24/7 Room Service', icon: '🛎️' },
    { id: 'concierge', name: 'Concierge', icon: '🤵' },
    { id: 'bar', name: 'Bar/Lounge', icon: '🍸' },
    { id: 'business', name: 'Business Center', icon: '💼' }
  ];

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleContinue = () => {
    onComplete({ amenities: selectedAmenities });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">Select all amenities that apply to your property</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {amenities.map((amenity, index) => (
          <motion.button
            key={amenity.id}
            onClick={() => toggleAmenity(amenity.id)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              selectedAmenities.includes(amenity.id)
                ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{amenity.icon}</span>
              <span className={`text-sm font-medium ${
                selectedAmenities.includes(amenity.id) ? 'text-[#ff5a5f]' : 'text-gray-900'
              }`}>
                {amenity.name}
              </span>
              {selectedAmenities.includes(amenity.id) && (
                <motion.div
                  className="ml-auto text-[#ff5a5f]"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Check size={16} />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {selectedAmenities.length > 0 && (
        <motion.button
          onClick={handleContinue}
          className="w-full py-3 bg-[#ff5a5f] text-white rounded-xl font-medium hover:bg-[#ff5a5f]/90 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue with {selectedAmenities.length} amenities
        </motion.button>
      )}
    </div>
  );
}

function PhotosStep({ onComplete, isCompleted }: { onComplete: (data: any) => void; isCompleted: boolean }) {
  const [uploadedPhotos, setUploadedPhotos] = useState<number>(0);

  const photoCategories = [
    { id: 'exterior', name: 'Exterior Views', required: true, uploaded: false },
    { id: 'lobby', name: 'Lobby & Reception', required: true, uploaded: false },
    { id: 'rooms', name: 'Guest Rooms', required: true, uploaded: false },
    { id: 'amenities', name: 'Amenities', required: false, uploaded: false },
    { id: 'dining', name: 'Dining Areas', required: false, uploaded: false },
    { id: 'other', name: 'Other Features', required: false, uploaded: false }
  ];

  const handleUploadCategory = (categoryId: string) => {
    // Simulate photo upload
    setTimeout(() => {
      setUploadedPhotos(prev => prev + 1);
      if (uploadedPhotos + 1 >= 3) { // Minimum 3 categories
        setTimeout(() => {
          onComplete({ photos: uploadedPhotos + 1 });
        }, 500);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600 mb-2">Add photos to showcase your property</p>
        <p className="text-xs text-gray-500">Upload at least 3 photo categories to continue</p>
      </div>
      
      <div className="space-y-3">
        {photoCategories.map((category, index) => (
          <motion.button
            key={category.id}
            onClick={() => handleUploadCategory(category.id)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              category.uploaded
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={category.uploaded}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold flex items-center gap-2 ${
                  category.uploaded ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {category.name}
                  {category.required && (
                    <span className="text-xs bg-[#ff5a5f] text-white px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {category.uploaded ? 'Photos uploaded' : 'Tap to upload photos'}
                </p>
              </div>
              
              {category.uploaded ? (
                <div className="text-green-500">
                  <Check size={20} />
                </div>
              ) : (
                <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xl">📷</span>
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          {uploadedPhotos} of 6 categories completed
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <motion.div
            className="h-2 rounded-full bg-[#ff5a5f]"
            initial={{ width: '0%' }}
            animate={{ width: `${(uploadedPhotos / 6) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}

function PricingStep({ onComplete, isCompleted }: { onComplete: (data: any) => void; isCompleted: boolean }) {
  const [selectedPricing, setSelectedPricing] = useState<string>('');

  const pricingOptions = [
    { 
      id: 'budget', 
      name: 'Budget Friendly', 
      range: 'PKR 2,000 - 5,000/night',
      description: 'Affordable rates for budget travelers'
    },
    { 
      id: 'mid-range', 
      name: 'Mid-Range', 
      range: 'PKR 5,000 - 12,000/night',
      description: 'Balanced comfort and value'
    },
    { 
      id: 'luxury', 
      name: 'Luxury', 
      range: 'PKR 12,000 - 25,000/night',
      description: 'Premium experience and amenities'
    },
    { 
      id: 'ultra-luxury', 
      name: 'Ultra Luxury', 
      range: 'PKR 25,000+/night',
      description: 'Exclusive, high-end accommodation'
    }
  ];

  const handleSelect = (pricingId: string) => {
    setSelectedPricing(pricingId);
    setTimeout(() => {
      onComplete({ pricing: pricingId });
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">Choose your pricing tier to get started</p>
        <p className="text-xs text-gray-500 mt-1">You can adjust specific rates later</p>
      </div>
      
      {pricingOptions.map((option, index) => (
        <motion.button
          key={option.id}
          onClick={() => handleSelect(option.id)}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            selectedPricing === option.id
              ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold mb-1 ${
                selectedPricing === option.id ? 'text-[#ff5a5f]' : 'text-gray-900'
              }`}>
                {option.name}
              </h3>
              <p className="text-sm font-medium text-gray-700 mb-1">{option.range}</p>
              <p className="text-xs text-gray-600">{option.description}</p>
            </div>
            
            {selectedPricing === option.id && (
              <motion.div
                className="text-[#ff5a5f]"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Check size={20} />
              </motion.div>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}