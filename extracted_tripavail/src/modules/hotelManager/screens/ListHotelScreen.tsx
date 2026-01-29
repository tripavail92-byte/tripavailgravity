import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Clock, Sparkles, Zap, ArrowLeft } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import CompleteHotelListingFlow from '../components/CompleteHotelListingFlow';
import { 
  PropertyTypeIcon,
  LocationIcon,
  AmenitiesIcon,
  PhotosIcon,
  PricingIcon
} from '../../../components/icons/hotel-listing/HotelListingIcons';
import { PremiumPropertyVector } from '../../../components/icons/hotel-listing/PremiumPropertyVectors';
import {
  PremiumPropertyTypeIcon,
  PremiumLocationIcon,
  PremiumAmenitiesIcon,
  PremiumPhotosIcon,
  PremiumPricingIcon
} from '../../../components/icons/hotel-listing/PremiumStepIcons';

interface ListHotelScreenProps {
  onNavigate: (screen: string) => void;
  onDetailScreenChange?: (isDetailActive: boolean) => void;
}

// Helper function to get display name for property types
const getPropertyDisplayName = (type: string): string => {
  const displayNames: { [key: string]: string } = {
    'hotel': 'Hotel',
    'boutique': 'Boutique Hotel',
    'resort': 'Resort',
    'motel': 'Motel',
    'lodge': 'Lodge',
    'inn': 'Inn',
    'guesthouse': 'Guest House',
    'hostel': 'Hostel'
  };
  return displayNames[type] || 'Property';
};

export default function ListHotelScreen({ onNavigate, onDetailScreenChange }: ListHotelScreenProps) {
  const [showFlow, setShowFlow] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState<'hotel' | 'boutique' | 'resort' | 'motel' | 'lodge' | 'inn' | 'guesthouse' | 'hostel' | ''>('hotel');
  
  // Always treat this screen as a detail screen to hide the header
  useEffect(() => {
    if (onDetailScreenChange) {
      onDetailScreenChange(true);
    }
    
    // Cleanup: reset when component unmounts
    return () => {
      if (onDetailScreenChange) {
        onDetailScreenChange(false);
      }
    };
  }, [onDetailScreenChange]);

  const hotelSteps = [
    { 
      id: 1, 
      title: 'Property Type', 
      description: 'Select your property category', 
      completed: false,
      icon: PremiumPropertyTypeIcon,
      duration: '1 min',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      id: 2, 
      title: 'Location', 
      description: 'Pin your exact location', 
      completed: false,
      icon: PremiumLocationIcon,
      duration: '2 min',
      color: 'from-cyan-500 to-blue-500'
    },
    { 
      id: 3, 
      title: 'Amenities', 
      description: 'Highlight your facilities', 
      completed: false,
      icon: PremiumAmenitiesIcon,
      duration: '3 min',
      color: 'from-purple-500 to-cyan-500'
    },
    { 
      id: 4, 
      title: 'Photos', 
      description: 'Showcase your spaces', 
      completed: false,
      icon: PremiumPhotosIcon,
      duration: '4 min',
      color: 'from-indigo-500 to-purple-600'
    },
    { 
      id: 5, 
      title: 'Pricing', 
      description: 'Set your rates', 
      completed: false,
      icon: PremiumPricingIcon,
      duration: '2 min',
      color: 'from-amber-500 to-orange-500'
    },
  ];

  const handleStartFlow = () => {
    setShowFlow(true);
  };

  const handleBackFromFlow = () => {
    setShowFlow(false);
  };

  const handleFlowUpdate = (data: any) => {
    // Update the selected property type when user selects it in the flow
    if (data.propertyType) {
      setSelectedPropertyType(data.propertyType);
    }
  };

  const handleSaveAndExitToDashboard = () => {
    setShowFlow(false);
    onNavigate('dashboard');
  };

  if (showFlow) {
    return (
      <CompleteHotelListingFlow 
        onBack={handleBackFromFlow} 
        onComplete={handleFlowUpdate}
        onSaveAndExit={handleSaveAndExitToDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col pb-8">
      {/* Back Arrow Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 pt-6 pb-2"
      >
        <motion.button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-900 dark:text-white hover:opacity-70 transition-opacity"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-base">Back to Dashboard</span>
        </motion.button>
      </motion.div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="px-6 py-6 mb-4"
      >
        <div className="flex flex-col items-center">
          {/* Premium Property Vector Icon */}
          <AnimatePresence mode="wait">
            <motion.button
              key={selectedPropertyType}
              onClick={handleStartFlow}
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
              className="mb-6 cursor-pointer"
              whileHover={{ scale: 1.08, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <PremiumPropertyVector propertyType={selectedPropertyType} size={140} />
            </motion.button>
          </AnimatePresence>

          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.h1 
              key={selectedPropertyType}
              className="text-3xl text-gray-900 dark:text-white mb-3 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              List Your {getPropertyDisplayName(selectedPropertyType)}
            </motion.h1>
          </AnimatePresence>
          
          <motion.p 
            className="text-gray-600 dark:text-gray-400 text-center text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Complete each step at your own pace
          </motion.p>
        </div>
      </motion.div>

      {/* Steps Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex-1 px-6 pb-32"
      >
        <div className="max-w-xl mx-auto">
          <div className="space-y-4 mb-8">
            {hotelSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                onMouseEnter={() => setHoveredStep(step.id)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div 
                    className="relative p-5 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden"
                    style={{
                      background: hoveredStep === step.id 
                        ? 'linear-gradient(135deg, rgba(157, 78, 221, 0.03) 0%, rgba(0, 212, 255, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(157, 78, 221, 0.015) 0%, rgba(0, 212, 255, 0.015) 100%)',
                    }}
                  >
                    {/* Gradient Border */}
                    <div 
                      className="absolute inset-0 rounded-2xl" 
                      style={{
                        background: 'linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%)',
                        padding: '2px',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                      }}
                    />
                    
                    {/* Content Container */}
                    <div className="relative z-10">
                      <div className="flex items-center gap-5">
                        {/* Premium Icon */}
                        <motion.div 
                          whileHover={{ rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <step.icon 
                            size={80} 
                            isActive={hoveredStep === step.id}
                          />
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-lg text-gray-900 dark:text-white mb-1">
                            {step.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {step.description}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs text-white dark:text-gray-900 bg-gray-900 dark:bg-white px-2 py-0.5 rounded-full">
                              {step.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Total Time Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-5 py-2.5 rounded-full">
              <motion.div 
                className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm text-gray-900 dark:text-white">
                Total time: ~12 minutes
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Fixed Bottom CTA - Floating */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="fixed bottom-0 left-0 right-0 px-6 py-5 z-50"
      >
        <div className="max-w-xl mx-auto">
          <motion.button
            onClick={handleStartFlow}
            className="w-full bg-gradient-to-r from-[#9D4EDD] to-[#00D4FF] text-white py-4 rounded-xl flex items-center justify-center gap-3 group shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-lg font-medium">
              List Your Hotel
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          <motion.p 
            className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            Save progress anytime • Get support 24/7
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
