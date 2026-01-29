import { motion } from 'motion/react';
import { HelpCircle } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import type { UserRole } from '../../../lib/types';

interface HelpScreenProps {
  role: UserRole;
  onNavigate: (screen: string) => void;
}

export default function HelpScreen({ role, onNavigate }: HelpScreenProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Help & Support</h2>
        <Card className="p-6 text-center">
          <HelpCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600">
            Contact our support team for assistance
          </p>
        </Card>
      </motion.div>
    </div>
  );
}