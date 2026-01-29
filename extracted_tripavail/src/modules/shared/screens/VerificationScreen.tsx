import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import type { UserRole } from '../../../lib/types';

interface VerificationScreenProps {
  role: UserRole;
  onNavigate: (screen: string) => void;
}

export default function VerificationScreen({ role, onNavigate }: VerificationScreenProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Center</h2>
        <Card className="p-6 text-center">
          <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Verification</h3>
          <p className="text-gray-600">
            Complete your verification to unlock all partner features
          </p>
        </Card>
      </motion.div>
    </div>
  );
}