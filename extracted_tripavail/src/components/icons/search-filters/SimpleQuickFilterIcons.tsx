import { motion } from 'motion/react';

// Simple Beach Icon
export const SimpleBeachIcon = ({ isActive = false, className = "w-4 h-4" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Palm tree */}
      <path
        d="M8 22V12c0-1 0-2 1-2s1 1 1 2v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Palm leaves */}
      <path d="M9 12c-2-2-4-2-6-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 12c2-2 4-2 6-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 12c0-3 1-5 3-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Waves */}
      <path
        d="M2 19c2-1 4-1 6 0s4 1 6 0 4-1 6 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 21c2-1 4-1 6 0s4 1 6 0 4-1 6 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
};

// Simple City Icon
export const SimpleCityIcon = ({ isActive = false, className = "w-4 h-4" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Buildings */}
      <rect
        x="3"
        y="6"
        width="4"
        height="16"
        rx="1"
        fill="currentColor"
        opacity="0.8"
      />
      
      <rect
        x="9"
        y="2"
        width="4"
        height="20"
        rx="1"
        fill="currentColor"
      />
      
      <rect
        x="15"
        y="8"
        width="4"
        height="14"
        rx="1"
        fill="currentColor"
        opacity="0.7"
      />
      
      {/* Windows */}
      <rect x="4" y="8" width="1" height="1" fill="white" rx="0.2" />
      <rect x="6" y="8" width="1" height="1" fill="white" rx="0.2" />
      <rect x="4" y="11" width="1" height="1" fill="white" rx="0.2" />
      <rect x="6" y="11" width="1" height="1" fill="white" rx="0.2" />
      
      <rect x="10" y="4" width="1" height="1" fill="white" rx="0.2" />
      <rect x="12" y="4" width="1" height="1" fill="white" rx="0.2" />
      <rect x="10" y="7" width="1" height="1" fill="white" rx="0.2" />
      <rect x="12" y="7" width="1" height="1" fill="white" rx="0.2" />
      
      <rect x="16" y="10" width="1" height="1" fill="white" rx="0.2" />
      <rect x="18" y="10" width="1" height="1" fill="white" rx="0.2" />
      <rect x="16" y="13" width="1" height="1" fill="white" rx="0.2" />
      <rect x="18" y="13" width="1" height="1" fill="white" rx="0.2" />
      
      {/* Ground line */}
      <line x1="2" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  );
};

// Simple Adventure Icon
export const SimpleAdventureIcon = ({ isActive = false, className = "w-4 h-4" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Mountain peaks */}
      <path
        d="M8 22L2 8l6 4 6-4 6 4 2-8v14"
        fill="currentColor"
        opacity="0.8"
      />
      
      {/* Flag */}
      <line x1="16" y1="6" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 6l4 2-4 2V6z"
        fill="currentColor"
      />
    </motion.svg>
  );
};

// Simple Luxury Icon  
export const SimpleLuxuryIcon = ({ isActive = false, className = "w-4 h-4" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Crown base */}
      <path
        d="M5 16h14l-1-8H6l-1 8z"
        fill="currentColor"
        opacity="0.8"
      />
      
      {/* Crown points */}
      <path
        d="M6 8l2-4 4 2 4-2 2 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Jewels */}
      <circle cx="8" cy="10" r="1" fill="currentColor" opacity="0.9" />
      <circle cx="12" cy="8" r="1.2" fill="currentColor" />
      <circle cx="16" cy="10" r="1" fill="currentColor" opacity="0.9" />
      
      {/* Base line */}
      <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  );
};

// Simple Budget Icon
export const SimpleBudgetIcon = ({ isActive = false, className = "w-4 h-4" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Wallet */}
      <rect
        x="4"
        y="8"
        width="16"
        height="12"
        rx="2"
        fill="currentColor"
        opacity="0.8"
      />
      
      {/* Card slot */}
      <rect
        x="8"
        y="12"
        width="8"
        height="1"
        rx="0.5"
        fill="white"
      />
      
      {/* Dollar sign */}
      <path
        d="M12 5v2m0 10v2m-1-9h2.5a1.5 1.5 0 010 3H12m0 0h2.5a1.5 1.5 0 010 3H11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
};

// Simple Romantic Icon
export const SimpleRomanticIcon = ({ isActive = false, className = "w-4 h-4" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Heart */}
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
      />
    </motion.svg>
  );
};