import { motion } from 'motion/react';

interface SimpleHotelIconProps {
  className?: string;
  isActive?: boolean;
}

export function SimpleHotelIcon({ className = "w-6 h-6", isActive = false }: SimpleHotelIconProps) {
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
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </motion.svg>
  );
}