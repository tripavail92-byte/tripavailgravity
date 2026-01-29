import { motion } from 'motion/react';

interface SimpleHomeIconProps {
  className?: string;
  isActive?: boolean;
}

export function SimpleHomeIcon({ className = "w-6 h-6", isActive = false }: SimpleHomeIconProps) {
  return (
    <motion.svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={isActive ? 2.5 : 2}
      animate={{ scale: isActive ? 1.1 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </motion.svg>
  );
}