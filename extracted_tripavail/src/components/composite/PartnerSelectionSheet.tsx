import { motion } from 'motion/react';
import { X, Building, Plane, ArrowRight, Star, TrendingUp } from 'lucide-react';
import { Card } from '../ui/card';

interface PartnerSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPartnerMode: (mode: 'hotel_manager' | 'tour_operator') => void;
}

export function PartnerSelectionSheet({ isOpen, onClose, onSelectPartnerMode }: PartnerSelectionSheetProps) {
  if (!isOpen) return null;

  const partnerOptions = [
    {
      id: 'hotel_manager',
      title: 'Hotel Manager',
      description: 'List your properties and manage bookings',
      icon: Building,
      color: '#ff5a5f',
      benefits: [
        'Showcase your property',
        'Manage reservations',
        'Set pricing & availability',
        'Track revenue & analytics'
      ],
      stats: '50K+ hotels partnered'
    },
    {
      id: 'tour_operator',
      title: 'Tour Operator',
      description: 'Create and manage tour experiences',
      icon: Plane,
      color: '#9D6777',
      benefits: [
        'Design unique experiences',
        'Manage tour schedules',
        'Handle group bookings',
        'Build your reputation'
      ],
      stats: '15K+ operators active'
    }
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Partner Type</h2>
              <p className="text-gray-600 mt-1">Select how you want to earn with TripAvail</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">$2.5M+</p>
              <p className="text-sm text-gray-600">Monthly partner earnings</p>
            </Card>
            <Card className="p-4 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-gray-600">Average partner rating</p>
            </Card>
            <Card className="p-4 text-center">
              <Building className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">65K+</p>
              <p className="text-sm text-gray-600">Active partners worldwide</p>
            </Card>
          </div>

          {/* Partner Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partnerOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-gray-200">
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${option.color}20` }}
                    >
                      <option.icon 
                        className="w-6 h-6"
                        style={{ color: option.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{option.title}</h3>
                      <p className="text-gray-600 text-sm">{option.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {option.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center gap-2 text-sm text-gray-700">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">{option.stats}</span>
                    <motion.button
                      onClick={() => onSelectPartnerMode(option.id as 'hotel_manager' | 'tour_operator')}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
                      style={{ backgroundColor: option.color }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Partner with TripAvail?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Grow Your Business</h4>
                <p className="text-sm text-gray-600">Reach millions of travelers worldwide</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Build Your Brand</h4>
                <p className="text-sm text-gray-600">Showcase your unique offerings</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Manage Everything</h4>
                <p className="text-sm text-gray-600">Powerful tools for seamless operations</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}