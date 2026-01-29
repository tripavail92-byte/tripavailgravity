import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Star, TrendingUp, Users } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Modern3DHotelIcon } from '../../../components/icons/partner-selection/Modern3DHotelIcon';
import { Modern3DTourIcon } from '../../../components/icons/partner-selection/Modern3DTourIcon';
import { useState } from 'react';

interface PartnerSelectionScreenProps {
  onSelectPartnerMode: (mode: 'hotel_manager' | 'tour_operator') => void;
  onBack: () => void;
}

function PartnerSelectionScreen({ onSelectPartnerMode, onBack }: PartnerSelectionScreenProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  
  const partnerOptions = [
    {
      id: 'hotel_manager',
      title: 'Hotel Manager',
      description: 'Create and manage your experiences',
      icon: Modern3DHotelIcon,
      stats: '50K+ hotels partnered'
    },
    {
      id: 'tour_operator',
      title: 'Tour Operator',
      description: 'Create and manage your experiences',
      icon: Modern3DTourIcon,
      stats: '15K+ operators active'
    }
  ];

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl text-gray-900">Choose Your Partner Type</h1>
            <p className="text-sm text-gray-600">Select how you want to earn with TripAvail</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8">
        {/* Partner Options - Clean Design */}
        <div className="space-y-4 mb-8">
          {partnerOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (index * 0.1) }}
            >
              <Card 
                className="p-8 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300"
                onMouseEnter={() => setHoveredOption(option.id)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                {/* Clean Modern Icon */}
                <motion.div 
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <option.icon 
                    size={48} 
                    isSelected={hoveredOption === option.id}
                  />
                </motion.div>

                {/* Title and Description */}
                <div className="text-center mb-4">
                  <h3 className="text-xl text-gray-900 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-gray-600">
                    {option.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-center mb-6">
                  <p className="text-primary text-sm">
                    {option.stats}
                  </p>
                </div>

                {/* Get Started Button */}
                <div className="flex justify-center">
                  <motion.button
                    onClick={() => onSelectPartnerMode(option.id as 'hotel_manager' | 'tour_operator')}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-xl text-white transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Why Partner with TripAvail - Teal Green Design */}
        <motion.div
          className="p-6 bg-primary/5 rounded-2xl border border-primary/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-gray-900 mb-4">Why Partner with TripAvail?</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <TrendingUp className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h4 className="text-gray-900 text-sm mb-1">Grow Your Business</h4>
                <p className="text-xs text-gray-600">Reach millions of travelers worldwide</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h4 className="text-gray-900 text-sm mb-1">Build Your Brand</h4>
                <p className="text-xs text-gray-600">Showcase your unique offerings</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h4 className="text-gray-900 text-sm mb-1">Manage Everything</h4>
                <p className="text-xs text-gray-600">Powerful tools for seamless operations</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default PartnerSelectionScreen;