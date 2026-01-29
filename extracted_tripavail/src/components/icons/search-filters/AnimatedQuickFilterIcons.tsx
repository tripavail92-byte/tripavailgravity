import { motion } from 'motion/react';

// Beach Filter Icon
export const AnimatedBeachIcon = ({ isActive = false, className = "w-5 h-5" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.9 }}
      animate={{ 
        scale: isActive ? 1.1 : 1,
        rotate: isActive ? [0, -5, 5, 0] : 0
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Sun */}
      <motion.circle
        cx="19"
        cy="5"
        r="2"
        fill="currentColor"
        animate={{
          rotate: isActive ? 360 : 0,
          scale: isActive ? [1, 1.2, 1] : 1
        }}
        transition={{ 
          rotate: { duration: 2, repeat: isActive ? Infinity : 0, ease: "linear" },
          scale: { duration: 1, repeat: isActive ? Infinity : 0, repeatType: "reverse" }
        }}
      />
      {/* Sun rays */}
      <motion.g
        animate={{ rotate: isActive ? 360 : 0 }}
        style={{ transformOrigin: "19px 5px" }}
        transition={{ duration: 3, repeat: isActive ? Infinity : 0, ease: "linear" }}
      >
        <path d="M19 1v2M19 7v2M21.5 2.5l-1.4 1.4M16.9 6.1l-1.4 1.4M22 5h-2M15 5h-2M21.5 7.5l-1.4-1.4M16.9 3.9l-1.4-1.4" 
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </motion.g>
      
      {/* Palm tree */}
      <motion.path
        d="M8 22V12c0-1 0-2 1-2s1 1 1 2v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ 
          rotate: isActive ? [-2, 2, -2] : 0,
          scaleY: isActive ? [1, 1.05, 1] : 1
        }}
        style={{ transformOrigin: "9px 17px" }}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      {/* Palm leaves */}
      <motion.g
        animate={{ 
          rotate: isActive ? [-3, 3, -3] : 0,
        }}
        style={{ transformOrigin: "9px 12px" }}
        transition={{ 
          duration: 2.5, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      >
        <path d="M9 12c-2-3-4-3-6-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 12c2-3 4-3 6-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 12c0-4 1-6 3-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 12c-1-4-3-5-5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 12c1-4 3-5 5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </motion.g>
      
      {/* Waves */}
      <motion.path
        d="M2 19c2-1 4-1 6 0s4 1 6 0 4-1 6 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          pathOffset: isActive ? [0, 1, 0] : 0,
          opacity: isActive ? [0.7, 1, 0.7] : 0.8
        }}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0, 
          ease: "easeInOut"
        }}
      />
      <motion.path
        d="M2 21c2-1 4-1 6 0s4 1 6 0 4-1 6 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          pathOffset: isActive ? [0.5, 1.5, 0.5] : 0,
          opacity: isActive ? [0.5, 0.8, 0.5] : 0.6
        }}
        transition={{ 
          duration: 2.2, 
          repeat: isActive ? Infinity : 0, 
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  );
};

// City Break Icon
export const AnimatedCityIcon = ({ isActive = false, className = "w-5 h-5" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.9 }}
      animate={{ 
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Buildings */}
      <motion.rect
        x="3"
        y="6"
        width="4"
        height="16"
        rx="1"
        fill="currentColor"
        opacity="0.8"
        animate={{
          scaleY: isActive ? [1, 1.1, 1] : 1,
          opacity: isActive ? [0.8, 1, 0.8] : 0.8
        }}
        style={{ transformOrigin: "5px 22px" }}
        transition={{ 
          duration: 1.5, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse",
          delay: 0
        }}
      />
      
      <motion.rect
        x="9"
        y="2"
        width="4"
        height="20"
        rx="1"
        fill="currentColor"
        animate={{
          scaleY: isActive ? [1, 1.15, 1] : 1,
          opacity: isActive ? [0.9, 1, 0.9] : 0.9
        }}
        style={{ transformOrigin: "11px 22px" }}
        transition={{ 
          duration: 1.8, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse",
          delay: 0.3
        }}
      />
      
      <motion.rect
        x="15"
        y="8"
        width="4"
        height="14"
        rx="1"
        fill="currentColor"
        opacity="0.7"
        animate={{
          scaleY: isActive ? [1, 1.08, 1] : 1,
          opacity: isActive ? [0.7, 0.9, 0.7] : 0.7
        }}
        style={{ transformOrigin: "17px 22px" }}
        transition={{ 
          duration: 1.3, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse",
          delay: 0.6
        }}
      />
      
      {/* Windows */}
      <motion.g
        animate={{
          opacity: isActive ? [0.6, 1, 0.6] : 0.8
        }}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse"
        }}
      >
        <rect x="4" y="8" width="1" height="1" fill="white" rx="0.2" />
        <rect x="6" y="8" width="1" height="1" fill="white" rx="0.2" />
        <rect x="4" y="11" width="1" height="1" fill="white" rx="0.2" />
        <rect x="6" y="11" width="1" height="1" fill="white" rx="0.2" />
        <rect x="4" y="14" width="1" height="1" fill="white" rx="0.2" />
        <rect x="6" y="14" width="1" height="1" fill="white" rx="0.2" />
        
        <rect x="10" y="4" width="1" height="1" fill="white" rx="0.2" />
        <rect x="12" y="4" width="1" height="1" fill="white" rx="0.2" />
        <rect x="10" y="7" width="1" height="1" fill="white" rx="0.2" />
        <rect x="12" y="7" width="1" height="1" fill="white" rx="0.2" />
        <rect x="10" y="10" width="1" height="1" fill="white" rx="0.2" />
        <rect x="12" y="10" width="1" height="1" fill="white" rx="0.2" />
        
        <rect x="16" y="10" width="1" height="1" fill="white" rx="0.2" />
        <rect x="18" y="10" width="1" height="1" fill="white" rx="0.2" />
        <rect x="16" y="13" width="1" height="1" fill="white" rx="0.2" />
        <rect x="18" y="13" width="1" height="1" fill="white" rx="0.2" />
      </motion.g>
      
      {/* Ground line */}
      <line x1="2" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  );
};

// Adventure Icon
export const AnimatedAdventureIcon = ({ isActive = false, className = "w-5 h-5" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.9 }}
      animate={{ 
        scale: isActive ? 1.05 : 1,
        rotate: isActive ? [0, -2, 2, 0] : 0
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Mountain peaks */}
      <motion.path
        d="M8 22L2 8l6 4 6-4 6 4 2-8v14"
        fill="currentColor"
        opacity="0.7"
        animate={{
          scaleY: isActive ? [1, 1.1, 1] : 1,
          opacity: isActive ? [0.7, 0.9, 0.7] : 0.7
        }}
        style={{ transformOrigin: "12px 22px" }}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse"
        }}
      />
      
      {/* Flag */}
      <motion.g
        animate={{
          rotate: isActive ? [-5, 5, -5] : 0,
        }}
        style={{ transformOrigin: "16px 10px" }}
        transition={{ 
          duration: 1.5, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse"
        }}
      >
        <line x1="16" y1="6" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <motion.path
          d="M16 6l4 2-4 2V6z"
          fill="currentColor"
          animate={{
            scaleX: isActive ? [1, 1.1, 1] : 1
          }}
          style={{ transformOrigin: "18px 8px" }}
          transition={{ 
            duration: 1, 
            repeat: isActive ? Infinity : 0, 
            repeatType: "reverse"
          }}
        />
      </motion.g>
      
      {/* Backpack */}
      <motion.g
        animate={{
          y: isActive ? [0, -1, 0] : 0,
          rotate: isActive ? [-1, 1, -1] : 0
        }}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse"
        }}
      >
        <rect x="4" y="12" width="6" height="8" rx="2" fill="currentColor" opacity="0.8" />
        <rect x="5" y="10" width="4" height="3" rx="1" fill="currentColor" opacity="0.6" />
        <circle cx="7" cy="14" r="0.5" fill="white" />
      </motion.g>
      
      {/* Trail markers */}
      <motion.g
        animate={{
          opacity: isActive ? [0.5, 1, 0.5] : 0.7,
          scale: isActive ? [1, 1.2, 1] : 1
        }}
        transition={{ 
          duration: 1.5, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse",
          staggerChildren: 0.2
        }}
      >
        <circle cx="12" cy="16" r="1" fill="currentColor" opacity="0.6" />
        <circle cx="9" cy="18" r="0.8" fill="currentColor" opacity="0.5" />
        <circle cx="15" cy="19" r="0.7" fill="currentColor" opacity="0.4" />
      </motion.g>
    </motion.svg>
  );
};

// Luxury Icon  
export const AnimatedLuxuryIcon = ({ isActive = false, className = "w-5 h-5" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.9 }}
      animate={{ 
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Crown base */}
      <motion.path
        d="M5 16h14l-1-8H6l-1 8z"
        fill="currentColor"
        opacity="0.8"
        animate={{
          scaleY: isActive ? [1, 1.05, 1] : 1,
          opacity: isActive ? [0.8, 1, 0.8] : 0.8
        }}
        style={{ transformOrigin: "12px 12px" }}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse"
        }}
      />
      
      {/* Crown points */}
      <motion.path
        d="M6 8l2-4 4 2 4-2 2 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          pathLength: isActive ? [0, 1] : 1,
          opacity: isActive ? [0.7, 1, 0.7] : 1
        }}
        transition={{ 
          pathLength: { duration: 1.5, repeat: isActive ? Infinity : 0, repeatType: "reverse" },
          opacity: { duration: 2, repeat: isActive ? Infinity : 0, repeatType: "reverse" }
        }}
      />
      
      {/* Jewels */}
      <motion.g
        animate={{
          scale: isActive ? [1, 1.3, 1] : 1,
          rotate: isActive ? [0, 360] : 0
        }}
        style={{ transformOrigin: "12px 10px" }}
        transition={{ 
          scale: { duration: 1.5, repeat: isActive ? Infinity : 0, repeatType: "reverse" },
          rotate: { duration: 3, repeat: isActive ? Infinity : 0, ease: "linear" }
        }}
      >
        <circle cx="8" cy="10" r="1" fill="currentColor" opacity="0.9" />
        <circle cx="12" cy="8" r="1.2" fill="currentColor" />
        <circle cx="16" cy="10" r="1" fill="currentColor" opacity="0.9" />
      </motion.g>
      
      {/* Sparkles */}
      <motion.g
        animate={{
          opacity: isActive ? [0, 1, 0] : 0.6,
          scale: isActive ? [0.5, 1.2, 0.5] : 1,
          rotate: isActive ? [0, 180, 360] : 0
        }}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0, 
          ease: "easeInOut",
          staggerChildren: 0.3
        }}
      >
        <motion.path d="M20 6l-1 1 1 1 1-1-1-1z" fill="currentColor" opacity="0.7" />
        <motion.path d="M4 14l-1 1 1 1 1-1-1-1z" fill="currentColor" opacity="0.6" />
        <motion.path d="M20 18l-0.5 0.5 0.5 0.5 0.5-0.5-0.5-0.5z" fill="currentColor" opacity="0.5" />
      </motion.g>
      
      {/* Base line */}
      <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  );
};

// Budget-Friendly Icon
export const AnimatedBudgetIcon = ({ isActive = false, className = "w-5 h-5" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.9 }}
      animate={{ 
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Wallet/Purse */}
      <motion.rect
        x="4"
        y="8"
        width="16"
        height="12"
        rx="2"
        fill="currentColor"
        opacity="0.7"
        animate={{
          scaleX: isActive ? [1, 1.05, 1] : 1,
          opacity: isActive ? [0.7, 0.9, 0.7] : 0.7
        }}
        style={{ transformOrigin: "12px 14px" }}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse"
        }}
      />
      
      {/* Coin slot */}
      <motion.rect
        x="8"
        y="12"
        width="8"
        height="1"
        rx="0.5"
        fill="white"
        animate={{
          scaleX: isActive ? [1, 1.1, 1] : 1,
          opacity: isActive ? [0.8, 1, 0.8] : 0.9
        }}
        transition={{ 
          duration: 1.5, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse"
        }}
      />
      
      {/* Coins falling */}
      <motion.g
        animate={{
          y: isActive ? [0, 3, 0] : 0,
          opacity: isActive ? [0, 1, 0] : 0.8
        }}
        transition={{ 
          duration: 1.5, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse",
          staggerChildren: 0.2
        }}
      >
        <motion.circle cx="10" cy="4" r="1.5" fill="currentColor" opacity="0.9" />
        <motion.circle cx="14" cy="3" r="1.2" fill="currentColor" opacity="0.8" />
        <motion.circle cx="12" cy="2" r="1" fill="currentColor" opacity="0.7" />
      </motion.g>
      
      {/* Dollar signs on coins */}
      <motion.g
        animate={{
          y: isActive ? [0, 3, 0] : 0,
          rotate: isActive ? [0, 180, 360] : 0
        }}
        transition={{ 
          duration: 1.5, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse"
        }}
      >
        <text x="10" y="4.5" textAnchor="middle" fontSize="1.2" fill="white" fontWeight="bold">$</text>
        <text x="14" y="3.3" textAnchor="middle" fontSize="1" fill="white" fontWeight="bold">$</text>
        <text x="12" y="2.3" textAnchor="middle" fontSize="0.8" fill="white" fontWeight="bold">$</text>
      </motion.g>
      
      {/* Price tag */}
      <motion.g
        animate={{
          rotate: isActive ? [-5, 5, -5] : 0,
          scale: isActive ? [1, 1.1, 1] : 1
        }}
        style={{ transformOrigin: "18px 10px" }}
        transition={{ 
          duration: 1.8, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse"
        }}
      >
        <path d="M18 6l4 2v4l-4 2-2-2v-4l2-2z" fill="currentColor" opacity="0.8" />
        <circle cx="19" cy="8" r="0.5" fill="white" />
      </motion.g>
    </motion.svg>
  );
};

// Romantic Icon
export const AnimatedRomanticIcon = ({ isActive = false, className = "w-5 h-5" }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0.9 }}
      animate={{ 
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Main heart */}
      <motion.path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
        animate={{
          scale: isActive ? [1, 1.15, 1] : 1,
          opacity: isActive ? [0.8, 1, 0.8] : 0.9
        }}
        style={{ transformOrigin: "12px 12px" }}
        transition={{ 
          duration: 1.5, 
          repeat: isActive ? Infinity : 0, 
          repeatType: "reverse"
        }}
      />
      
      {/* Floating hearts */}
      <motion.g
        animate={{
          y: isActive ? [5, -2, 5] : 0,
          opacity: isActive ? [0, 1, 0] : 0,
          scale: isActive ? [0.5, 1, 0.5] : 0.8
        }}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0, 
          ease: "easeInOut",
          staggerChildren: 0.3
        }}
      >
        <motion.path
          d="M8 6c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"
          fill="currentColor"
          opacity="0.6"
        />
        <motion.path
          d="M16 4c0-0.8 0.8-1.5 1.5-1.5S19 3.2 19 4s-0.8 1.5-1.5 1.5S16 4.8 16 4z"
          fill="currentColor"
          opacity="0.5"
        />
        <motion.path
          d="M4 10c0-0.6 0.6-1 1-1s1 0.4 1 1-0.6 1-1 1-1-0.4-1-1z"
          fill="currentColor"
          opacity="0.4"
        />
      </motion.g>
      
      {/* Sparkle effects */}
      <motion.g
        animate={{
          rotate: isActive ? [0, 360] : 0,
          opacity: isActive ? [0.3, 0.8, 0.3] : 0.5,
          scale: isActive ? [0.8, 1.2, 0.8] : 1
        }}
        style={{ transformOrigin: "12px 12px" }}
        transition={{ 
          rotate: { duration: 4, repeat: isActive ? Infinity : 0, ease: "linear" },
          opacity: { duration: 2, repeat: isActive ? Infinity : 0, repeatType: "reverse" },
          scale: { duration: 1.5, repeat: isActive ? Infinity : 0, repeatType: "reverse" }
        }}
      >
        <motion.path d="M20 8l-0.5 0.5L20 9l0.5-0.5L20 8z" fill="currentColor" opacity="0.7" />
        <motion.path d="M4 16l-0.5 0.5L4 17l0.5-0.5L4 16z" fill="currentColor" opacity="0.6" />
        <motion.path d="M18 18l-0.3 0.3L18 18.6l0.3-0.3L18 18z" fill="currentColor" opacity="0.5" />
        <motion.path d="M6 6l-0.3 0.3L6 6.6l0.3-0.3L6 6z" fill="currentColor" opacity="0.4" />
      </motion.g>
    </motion.svg>
  );
};