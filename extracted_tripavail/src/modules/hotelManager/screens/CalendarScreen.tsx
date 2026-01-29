import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';
import { Card } from '../../../components/ui/card';

interface CalendarScreenProps {
  onNavigate: (screen: string) => void;
}

export default function CalendarScreen({ onNavigate }: CalendarScreenProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendar & Availability</h2>
        <Card className="p-6 text-center">
          <Calendar className="w-16 h-16 text-[#E11D48] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Availability</h3>
          <p className="text-gray-600">
            Set room availability, pricing, and manage your booking calendar
          </p>
        </Card>
      </motion.div>
    </div>
  );
}