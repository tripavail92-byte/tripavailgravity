import { motion } from 'motion/react';

interface SimpleMessageIconProps {
  className?: string;
  isActive?: boolean;
}

export function SimpleMessageIcon({ className = "w-6 h-6", isActive = false }: SimpleMessageIconProps) {
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
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </motion.svg>
  );
}