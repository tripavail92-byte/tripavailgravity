import { motion } from 'motion/react';
import { Map, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/card';

interface ToursScreenProps {
  onNavigate: (screen: string) => void;
}

export default function ToursScreen({ onNavigate }: ToursScreenProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Tours</h2>
        
        <Card className="p-6 border-2 border-dashed border-[#9D6777] border-opacity-30">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#9D6777] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-[#9D6777]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Your First Tour</h3>
            <p className="text-gray-600 mb-4">
              Start by creating your first tour experience to attract travelers
            </p>
            <button 
              onClick={() => onNavigate('create-tour')}
              className="px-6 py-2 bg-[#5FAD43] text-white rounded-lg hover:bg-[#5FAD43]/90 transition-colors"
            >
              Create Tour
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}