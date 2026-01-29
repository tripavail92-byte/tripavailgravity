import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface ModernVerificationBadgeProps {
  verified: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ModernVerificationBadge({ 
  verified, 
  className = '', 
  size = 'md' 
}: ModernVerificationBadgeProps) {
  if (!verified) return null;

  const sizeConfig = {
    sm: {
      badge: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      gap: 'gap-1'
    },
    md: {
      badge: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      gap: 'gap-2'
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      gap: 'gap-2'
    }
  };

  const config = sizeConfig[size];

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        delay: 0.3,
        type: "spring", 
        stiffness: 200,
        damping: 15
      }}
      className={`inline-flex items-center ${config.gap} ${config.badge} bg-blue-500 dark:bg-blue-600 text-white rounded-full font-medium shadow-lg ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        className={`${config.icon} bg-white text-blue-500 dark:text-blue-600 rounded-full flex items-center justify-center flex-shrink-0`}
      >
        <Check className="w-full h-full p-0.5" strokeWidth={3} />
      </motion.div>
      <span>Verified</span>
    </motion.div>
  );
}