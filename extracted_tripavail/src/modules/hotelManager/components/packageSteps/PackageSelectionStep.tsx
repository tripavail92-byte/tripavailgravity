import { useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import {
  WeekendGetawayVector,
  RomanticEscapeVector,
  FamilyAdventureVector,
  BusinessEliteVector,
  AdventurePackageVector,
  CulinaryJourneyVector,
  WellnessRetreatVector,
  LuxuryExperienceVector,
  CustomPackageVector
} from '../../../../components/icons/packages/AnimatedPackageTypeVectors';

interface PackageSelectionStepProps {
  onComplete: (data: { packageType: string }) => void;
  onUpdate: (data: { packageType: string }) => void;
  existingData?: { packageType?: string };
}

export function PackageSelectionStep({ onComplete, onUpdate, existingData }: PackageSelectionStepProps) {
  const [selectedType, setSelectedType] = useState(existingData?.packageType || '');

  const packageTypes = [
    {
      id: 'weekend',
      title: 'Weekend Getaway',
      description: 'Perfect for 2-3 day short trips',
      VectorComponent: WeekendGetawayVector,
      color: '#5FAD43',
      gradient: 'from-[#5FAD43] to-[#4A9C39]',
      features: ['Flexible check-in', 'Late checkout', 'Weekend specials']
    },
    {
      id: 'romantic',
      title: 'Romantic Escape',
      description: 'Intimate packages for couples',
      VectorComponent: RomanticEscapeVector,
      color: '#E91E63',
      gradient: 'from-[#E91E63] to-[#C2185B]',
      features: ['Couples amenities', 'Private dining', 'Spa treatments']
    },
    {
      id: 'family',
      title: 'Family Adventure',
      description: 'Fun-filled packages for families',
      VectorComponent: FamilyAdventureVector,
      color: '#2196F3',
      gradient: 'from-[#2196F3] to-[#1976D2]',
      features: ['Kid-friendly activities', 'Family rooms', 'Entertainment']
    },
    {
      id: 'business',
      title: 'Business Elite',
      description: 'Corporate rates and amenities',
      VectorComponent: BusinessEliteVector,
      color: '#607D8B',
      gradient: 'from-[#607D8B] to-[#455A64]',
      features: ['Meeting rooms', 'Business center', 'Express services']
    },
    {
      id: 'adventure',
      title: 'Adventure Package',
      description: 'Outdoor experiences and thrills',
      VectorComponent: AdventurePackageVector,
      color: '#FF5722',
      gradient: 'from-[#FF5722] to-[#D84315]',
      features: ['Outdoor activities', 'Equipment rental', 'Guided tours']
    },
    {
      id: 'culinary',
      title: 'Culinary Journey',
      description: 'Gourmet dining experiences',
      VectorComponent: CulinaryJourneyVector,
      color: '#FF9800',
      gradient: 'from-[#FF9800] to-[#F57C00]',
      features: ['Chef specials', 'Wine pairings', 'Cooking classes']
    },
    {
      id: 'wellness',
      title: 'Wellness Retreat',
      description: 'Spa and wellness focused',
      VectorComponent: WellnessRetreatVector,
      color: '#9C27B0',
      gradient: 'from-[#9C27B0] to-[#7B1FA2]',
      features: ['Spa treatments', 'Yoga sessions', 'Healthy cuisine']
    },
    {
      id: 'luxury',
      title: 'Luxury Experience',
      description: 'Ultra-premium VIP service',
      VectorComponent: LuxuryExperienceVector,
      color: '#FFD700',
      gradient: 'from-[#FFD700] to-[#FFC107]',
      features: ['Concierge service', 'Premium amenities', 'Exclusive access']
    }
  ];

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    onUpdate({ packageType: typeId });
  };

  const handleContinue = () => {
    if (selectedType) {
      onComplete({ packageType: selectedType });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Package Type</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Select the type of package that best represents your offering. This will help us suggest relevant features and pricing.
        </p>
      </motion.div>

      {/* Package Type Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {packageTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card 
              className={`p-5 cursor-pointer border-2 transition-all duration-300 hover:shadow-xl ${
                selectedType === type.id 
                  ? 'border-[#9D4EDD] bg-gradient-to-br from-purple-50 to-cyan-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <div className="flex flex-col items-center gap-4">
                {/* Animated Vector Icon */}
                <motion.div 
                  className="flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <type.VectorComponent 
                    size={80}
                    isActive={selectedType === type.id}
                  />
                </motion.div>
                
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{type.title}</h3>
                    {selectedType === type.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-gradient-to-br from-[#9D4EDD] to-[#00D4FF] rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                  
                  <div className="space-y-1">
                    {type.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Custom Package Option */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card 
          className={`p-5 cursor-pointer border-2 border-dashed transition-all duration-300 hover:shadow-xl ${
            selectedType === 'custom' 
              ? 'border-[#9D4EDD] bg-gradient-to-br from-purple-50 to-cyan-50 shadow-md' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => handleTypeSelect('custom')}
        >
          <div className="flex flex-col items-center gap-4">
            {/* Custom Package Vector */}
            <motion.div 
              className="flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <CustomPackageVector 
                size={80}
                isActive={selectedType === 'custom'}
              />
            </motion.div>
            
            <div className="flex-1 min-w-0 w-full text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="font-bold text-gray-900">Create Custom Package</h3>
                {selectedType === 'custom' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 bg-gradient-to-br from-[#9D4EDD] to-[#00D4FF] rounded-full flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                Build your own unique package from scratch
              </p>
              
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <span className="text-xs text-gray-500 px-3 py-1 bg-white rounded-full border border-gray-200">✨ Fully customizable</span>
                <span className="text-xs text-gray-500 px-3 py-1 bg-white rounded-full border border-gray-200">🎨 Your vision</span>
                <span className="text-xs text-gray-500 px-3 py-1 bg-white rounded-full border border-gray-200">🚀 Unlimited creativity</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-100"
      >
        <Button
          onClick={handleContinue}
          disabled={!selectedType}
          className="w-full gradient-hotel-manager text-white py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedType ? 'Continue to Description' : 'Select a Package Type'}
        </Button>
      </motion.div>
    </div>
  );
}