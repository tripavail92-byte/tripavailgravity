import { motion } from 'motion/react';
import { Building, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/card';

interface PropertiesScreenProps {
  onNavigate: (screen: string) => void;
}

export default function PropertiesScreen({ onNavigate }: PropertiesScreenProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Properties</h2>
        
        <Card className="p-6 border-2 border-dashed border-[#ff5a5f] border-opacity-30">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#ff5a5f] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-[#ff5a5f]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Your First Property</h3>
            <p className="text-gray-600 mb-4">
              Start by adding your hotel or property to begin receiving bookings
            </p>
            <button className="px-6 py-2 bg-[#ff5a5f] text-white rounded-lg hover:bg-[#ff5a5f]/90 transition-colors">
              Add Property
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}