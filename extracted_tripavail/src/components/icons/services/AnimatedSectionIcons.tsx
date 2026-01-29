import { motion } from 'motion/react';

interface SectionIconProps {
  size?: number;
  className?: string;
}

// Guest Services Icon - Concierge Bell
export function GuestServicesIcon({ size = 24, className = "" }: SectionIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        y: [0, -2, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Bell Base */}
      <motion.path
        d="M5 13C5 9.13401 8.13401 6 12 6C15.866 6 19 9.13401 19 13V17H5V13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Bell Top */}
      <motion.circle
        cx="12"
        cy="5"
        r="1"
        fill="currentColor"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      />
      
      {/* Bell Base Line */}
      <motion.line
        x1="3"
        y1="17"
        x2="21"
        y2="17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      
      {/* Ringer */}
      <motion.path
        d="M9 20C9 21.1046 10.3431 22 12 22C13.6569 22 15 21.1046 15 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      />
      
      {/* Service Stars */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={8 + i * 4}
          cy={11}
          r="0.5"
          fill="currentColor"
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3
          }}
        />
      ))}
    </motion.svg>
  );
}

// Languages Icon - Global Communication
export function LanguagesIcon({ size = 24, className = "" }: SectionIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Globe */}
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ 
          pathLength: 1,
          rotate: 360
        }}
        transition={{
          pathLength: { duration: 1 },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" }
        }}
        style={{ transformOrigin: "center" }}
      />
      
      {/* Vertical Line */}
      <motion.line
        x1="12"
        y1="3"
        x2="12"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      
      {/* Horizontal Lines */}
      <motion.line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      
      {/* Curved Lines - Left */}
      <motion.path
        d="M12 3C9.5 3 7 6.5 7 12C7 17.5 9.5 21 12 21"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      
      {/* Curved Lines - Right */}
      <motion.path
        d="M12 3C14.5 3 17 6.5 17 12C17 17.5 14.5 21 12 21"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      />
      
      {/* Language Dots */}
      {[-4, 0, 4].map((offset, i) => (
        <motion.circle
          key={i}
          cx={12 + offset}
          cy={8}
          r="1"
          fill="currentColor"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4
          }}
        />
      ))}
    </motion.svg>
  );
}

// Accessibility Icon - Wheelchair with Heart
export function AccessibilityIcon({ size = 24, className = "" }: SectionIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Person Head */}
      <motion.circle
        cx="12"
        cy="6"
        r="2"
        fill="currentColor"
        animate={{
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      />
      
      {/* Wheelchair Circle */}
      <motion.circle
        cx="9"
        cy="17"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ 
          pathLength: 1,
          rotate: [0, 360]
        }}
        transition={{
          pathLength: { duration: 1 },
          rotate: { duration: 8, repeat: Infinity, ease: "linear" }
        }}
        style={{ transformOrigin: "9px 17px" }}
      />
      
      {/* Wheelchair Back */}
      <motion.path
        d="M12 9V14L15 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      
      {/* Wheelchair Seat */}
      <motion.path
        d="M12 14L9 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />
      
      {/* Support Handle */}
      <motion.path
        d="M15 14L17 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      />
      
      {/* Accessibility Hearts */}
      {[0, 1].map((i) => (
        <motion.path
          key={i}
          d={`M${16 + i * 2} ${5 + i} C${16 + i * 2} ${4.5 + i} ${17 + i * 2} ${4 + i} ${17.5 + i * 2} ${4.5 + i} C${18 + i * 2} ${4 + i} ${18.5 + i * 2} ${4.5 + i} ${18.5 + i * 2} ${5 + i} C${18.5 + i * 2} ${5.5 + i} ${17.5 + i * 2} ${6.5 + i} ${17.5 + i * 2} ${6.5 + i} L${16 + i * 2} ${5 + i}`}
          fill="currentColor"
          animate={{
            opacity: [0, 1, 0],
            y: [0, -3, -6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5
          }}
        />
      ))}
      
      {/* Inclusion Symbol */}
      <motion.circle
        cx="9"
        cy="17"
        r="1"
        fill="currentColor"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      />
    </motion.svg>
  );
}
