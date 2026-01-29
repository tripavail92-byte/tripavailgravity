import { motion } from 'motion/react';

interface SimpleTourIconProps {
  className?: string;
  isActive?: boolean;
}

export function SimpleTourIcon({ className = "w-6 h-6", isActive = false }: SimpleTourIconProps) {
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
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </motion.svg>
  );
}