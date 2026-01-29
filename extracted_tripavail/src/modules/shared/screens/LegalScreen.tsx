import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import type { UserRole } from '../../../lib/types';

interface LegalScreenProps {
  role: UserRole;
  onNavigate: (screen: string) => void;
}

export default function LegalScreen({ role, onNavigate }: LegalScreenProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Legal & Policies</h2>
        <Card className="p-6 text-center">
          <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms & Policies</h3>
          <p className="text-gray-600">
            View our terms of service and privacy policy
          </p>
        </Card>
      </motion.div>
    </div>
  );
}