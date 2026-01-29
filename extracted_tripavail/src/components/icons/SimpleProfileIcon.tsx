import { motion } from 'motion/react';

interface SimpleProfileIconProps {
  className?: string;
  isActive?: boolean;
}

export function SimpleProfileIcon({ className = "w-6 h-6", isActive = false }: SimpleProfileIconProps) {
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </motion.svg>
  );
}