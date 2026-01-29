import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

interface VerifiedPillProps {
  isVerified: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3'
  },
  md: {
    container: 'px-2.5 py-1.5 text-sm',
    icon: 'w-4 h-4'
  }
};

export function VerifiedPill({ isVerified, size = 'sm', className = '' }: VerifiedPillProps) {
  if (!isVerified) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        inline-flex items-center gap-1 bg-green-100 text-green-800 rounded-full font-medium
        ${sizeClasses[size].container}
        ${className}
      `}
    >
      <ShieldCheck className={sizeClasses[size].icon} />
      <span>Verified</span>
    </motion.div>
  );
}