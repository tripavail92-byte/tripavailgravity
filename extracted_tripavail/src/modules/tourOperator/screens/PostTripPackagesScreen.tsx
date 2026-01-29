import { motion } from 'motion/react';
import { Package, Plus, Map, Users, Clock, Camera } from 'lucide-react';
import { Card } from '../../../components/ui/card';

interface PostTripPackagesScreenProps {
  onNavigate: (screen: string) => void;
}

export default function PostTripPackagesScreen({ onNavigate }: PostTripPackagesScreenProps) {
  const tripTypes = [
    {
      id: 'adventure',
      title: 'Adventure Tours',
      description: 'Hiking, trekking, outdoor activities',
      icon: Map,
      color: '#9D6777',
      popular: true
    },
    {
      id: 'cultural',
      title: 'Cultural Experience',
      description: 'Heritage sites, local traditions',
      icon: Users,
      color: '#4a5568',
      popular: false
    },
    {
      id: 'city',
      title: 'City Tours',
      description: 'Urban exploration, sightseeing',
      icon: Package,
      color: '#38a169',
      popular: true
    },
    {
      id: 'photography',
      title: 'Photography Tours',
      description: 'Scenic locations, photo workshops',
      icon: Camera,
      color: '#d69e2e',
      popular: false
    }
  ];

  const packageFeatures = [
    { icon: Clock, title: 'Flexible Duration', desc: '1-15 days' },
    { icon: Users, title: 'Group Sizes', desc: '2-50 people' },
    { icon: Map, title: 'Custom Routes', desc: 'Plan unique itineraries' },
    { icon: Package, title: 'All Inclusive', desc: 'Hotels, meals, transport' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#9D6777] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-[#9D6777]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Post Trip Packages</h2>
          <p className="text-gray-600">Create amazing travel experiences for your customers</p>
        </div>
      </motion.div>

      {/* Package Features */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {packageFeatures.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="p-3 text-center">
              <feature.icon className="w-6 h-6 text-[#9D6777] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-xs text-gray-600">{feature.desc}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Trip Types */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="font-semibold text-gray-900">Choose Trip Type</h3>
        
        {tripTypes.map((tripType, index) => (
          <motion.div
            key={tripType.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow relative">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${tripType.color}20` }}
                >
                  <tripType.icon 
                    className="w-6 h-6"
                    style={{ color: tripType.color }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{tripType.title}</h3>
                    {tripType.popular && (
                      <span className="px-2 py-0.5 bg-[#9D6777] text-white text-xs rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{tripType.description}</p>
                </div>
                <div className="text-[#9D6777]">→</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Create Custom Package */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <Card className="p-6 border-2 border-dashed border-[#9D6777] border-opacity-30 cursor-pointer hover:border-opacity-50 transition-colors">
          <div className="text-center">
            <Plus className="w-12 h-12 text-[#9D6777] mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Create Custom Trip</h3>
            <p className="text-sm text-gray-600 mb-4">Design a unique travel experience from scratch</p>
            <button className="px-6 py-2 bg-[#9D6777] text-white rounded-lg hover:bg-[#9D6777]/90 transition-colors">
              Start Creating
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Success Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Card className="p-4 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">Success Tips</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Highlight unique experiences and local insights</li>
            <li>• Include professional photos and detailed itineraries</li>
            <li>• Offer competitive pricing with clear value propositions</li>
            <li>• Provide 24/7 support and emergency assistance</li>
          </ul>
        </Card>
      </motion.div>
    </div>
  );
}