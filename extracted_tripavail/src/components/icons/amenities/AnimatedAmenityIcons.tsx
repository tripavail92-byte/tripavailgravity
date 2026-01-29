import { motion } from 'motion/react';

interface AmenityIconProps {
  isSelected?: boolean;
  isHovered?: boolean;
  size?: number;
  className?: string;
}

// Internet & Technology Icons
export function WifiIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1,
        rotate: isSelected ? [0, -5, 5, 0] : 0
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M12 20h.01M8.5 16.5a7 7 0 0 1 7 0M5 13a11 11 0 0 1 14 0M2 10a15 15 0 0 1 20 0"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.7, 1, 0.7] : 1
        }}
        transition={{
          pathLength: { duration: 0.8, ease: "easeInOut" },
          opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="12"
        cy="20"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 1
        }}
        transition={{
          scale: { duration: 0.6, repeat: isSelected ? Infinity : 0, repeatDelay: 1 },
          opacity: { duration: 1.2, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

export function BusinessCenterIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1,
        y: isSelected ? [0, -2, 0] : 0
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="2"
        y="7"
        width="20"
        height="14"
        rx="2"
        ry="2"
        stroke={baseColor}
        strokeWidth="1.5"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100, 100] : [100, 100, 100],
          fill: isSelected ? `${baseColor}15` : 'none'
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <motion.path
        d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
        stroke={baseColor}
        strokeWidth="1.5"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="2"
        stroke={baseColor}
        strokeWidth="1.5"
        fill="none"
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          rotate: isSelected ? 360 : 0
        }}
        transition={{
          scale: { duration: 1.5, repeat: isHovered ? Infinity : 0 },
          rotate: { duration: 2, ease: "easeInOut" }
        }}
      />
    </motion.svg>
  );
}

export function MeetingRoomsIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="3"
        y="4"
        width="18"
        height="14"
        rx="2"
        stroke={baseColor}
        strokeWidth="1.5"
        fill={isSelected ? `${baseColor}10` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1 }}
      />
      <motion.ellipse
        cx="12"
        cy="10"
        rx="6"
        ry="3"
        stroke={baseColor}
        strokeWidth="1.5"
        fill="none"
        animate={{
          scaleX: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.3, 1, 0.3] : 1
        }}
        transition={{
          scaleX: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="8"
        cy="8"
        r="1"
        fill={baseColor}
        animate={{ scale: isSelected ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />
      <motion.circle
        cx="12"
        cy="8"
        r="1"
        fill={baseColor}
        animate={{ scale: isSelected ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      <motion.circle
        cx="16"
        cy="8"
        r="1"
        fill={baseColor}
        animate={{ scale: isSelected ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
    </motion.svg>
  );
}

export function HighSpeedInternetIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M13 2v6h3l-4 4-4-4h3V2h2Z"
        fill={baseColor}
        animate={{
          y: isSelected ? [0, -2, 0] : 0,
          opacity: isHovered ? [0.7, 1, 0.7] : 1
        }}
        transition={{
          y: { duration: 1, repeat: isSelected ? Infinity : 0, repeatDelay: 0.5 },
          opacity: { duration: 1.2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M12 15c1.38 0 2.63.56 3.54 1.46A5 5 0 0 1 12 22a5 5 0 0 1-3.54-5.54A5 5 0 0 1 12 15Z"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          strokeDasharray: isSelected ? [0, 50, 50] : [50, 50, 50],
          rotate: isHovered ? 360 : 0
        }}
        transition={{
          strokeDasharray: { duration: 1.5 },
          rotate: { duration: 3, repeat: isHovered ? Infinity : 0, ease: "linear" }
        }}
      />
      <motion.circle
        cx="12"
        cy="18"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 0.8, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
    </motion.svg>
  );
}

export function ConferenceFacilitiesIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="2"
        y="3"
        width="20"
        height="14"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}10` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.2 }}
      />
      <motion.path
        d="M8 21l4-7 4 7"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      <motion.rect
        x="6"
        y="6"
        width="12"
        height="8"
        rx="1"
        stroke={baseColor}
        strokeWidth="1.5"
        fill="none"
        animate={{
          opacity: isHovered ? [0.3, 1, 0.3] : 1,
          scale: isSelected ? [1, 1.05, 1] : 1
        }}
        transition={{
          opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 },
          scale: { duration: 2, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="9"
        cy="9"
        r="0.5"
        fill={baseColor}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
      />
      <motion.circle
        cx="12"
        cy="9"
        r="0.5"
        fill={baseColor}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
      />
      <motion.circle
        cx="15"
        cy="9"
        r="0.5"
        fill={baseColor}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      />
    </motion.svg>
  );
}

// Recreation & Wellness Icons
export function SwimmingPoolIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="6"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.path
        d="M6 8c1.5-2 4.5-2 6 0s4.5 2 6 0"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          d: isHovered 
            ? ["M6 8c1.5-2 4.5-2 6 0s4.5 2 6 0", "M6 9c1.5-1 4.5-1 6 0s4.5 1 6 0", "M6 8c1.5-2 4.5-2 6 0s4.5 2 6 0"]
            : ["M6 8c1.5-2 4.5-2 6 0s4.5 2 6 0"]
        }}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
      />
      <motion.path
        d="M6 12c1.5-1 4.5-1 6 0s4.5 1 6 0"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          d: isHovered 
            ? ["M6 12c1.5-1 4.5-1 6 0s4.5 1 6 0", "M6 13c1.5-0.5 4.5-0.5 6 0s4.5 0.5 6 0", "M6 12c1.5-1 4.5-1 6 0s4.5 1 6 0"]
            : ["M6 12c1.5-1 4.5-1 6 0s4.5 1 6 0"],
          opacity: isSelected ? [0.5, 1, 0.5] : 1
        }}
        transition={{
          d: { duration: 2.5, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M6 16c1.5-0.5 4.5-0.5 6 0s4.5 0.5 6 0"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          d: isHovered 
            ? ["M6 16c1.5-0.5 4.5-0.5 6 0s4.5 0.5 6 0", "M6 17c1.5-0.2 4.5-0.2 6 0s4.5 0.2 6 0", "M6 16c1.5-0.5 4.5-0.5 6 0s4.5 0.5 6 0"]
            : ["M6 16c1.5-0.5 4.5-0.5 6 0s4.5 0.5 6 0"]
        }}
        transition={{ duration: 3, repeat: isHovered ? Infinity : 0 }}
      />
    </motion.svg>
  );
}

export function FitnessCenterIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="2"
        y="10"
        width="4"
        height="4"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.3, 1] : 1,
          x: isSelected ? [2, 1, 2] : 2
        }}
        transition={{
          scaleY: { duration: 0.8, repeat: isHovered ? Infinity : 0 },
          x: { duration: 1.2, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="18"
        y="10"
        width="4"
        height="4"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.3, 1] : 1,
          x: isSelected ? [18, 19, 18] : 18
        }}
        transition={{
          scaleY: { duration: 0.8, repeat: isHovered ? Infinity : 0, delay: 0.2 },
          x: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.1 }
        }}
      />
      <motion.rect
        x="6"
        y="11"
        width="12"
        height="2"
        rx="1"
        fill={baseColor}
        animate={{
          scaleX: isSelected ? [1, 1.1, 1] : 1,
          opacity: isHovered ? [0.7, 1, 0.7] : 1
        }}
        transition={{
          scaleX: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 1.2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="8"
        cy="12"
        r="1"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          scale: isHovered ? [1, 1.4, 1] : 1,
          rotate: isSelected ? 360 : 0
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0 },
          rotate: { duration: 2, ease: "easeInOut" }
        }}
      />
      <motion.circle
        cx="16"
        cy="12"
        r="1"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          scale: isHovered ? [1, 1.4, 1] : 1,
          rotate: isSelected ? -360 : 0
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0, delay: 0.2 },
          rotate: { duration: 2, ease: "easeInOut", delay: 0.1 }
        }}
      />
    </motion.svg>
  );
}

export function SpaIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="3"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}20` : 'none'}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          strokeDasharray: isSelected ? [0, 30, 30] : [30, 30, 30]
        }}
        transition={{
          scale: { duration: 2, repeat: isHovered ? Infinity : 0 },
          strokeDasharray: { duration: 1.5 }
        }}
      />
      <motion.path
        d="M8 8c-2-2-2-5 0-7s5-2 7 0 2 5 0 7-5 2-7 0Z"
        stroke={baseColor}
        strokeWidth="1.5"
        fill="none"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          rotate: isHovered ? [0, 10, -10, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1.2 },
          rotate: { duration: 3, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M16 16c2 2 2 5 0 7s-5 2-7 0-2-5 0-7 5-2 7 0Z"
        stroke={baseColor}
        strokeWidth="1.5"
        fill="none"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          rotate: isHovered ? [0, -10, 10, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1.2, delay: 0.3 },
          rotate: { duration: 3, repeat: isHovered ? Infinity : 0, delay: 0.5 }
        }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
    </motion.svg>
  );
}

export function SaunaIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="3"
        y="8"
        width="18"
        height="12"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.2 }}
      />
      <motion.path
        d="M7 6c0-1 1-2 2-2s2 1 2 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: Infinity }
        }}
      />
      <motion.path
        d="M11 6c0-1 1-2 2-2s2 1 2 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 1.5, repeat: Infinity, delay: 0.2 }
        }}
      />
      <motion.path
        d="M15 6c0-1 1-2 2-2s2 1 2 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.6 },
          opacity: { duration: 1.5, repeat: Infinity, delay: 0.4 }
        }}
      />
      <motion.rect
        x="6"
        y="12"
        width="12"
        height="4"
        rx="1"
        fill={baseColor}
        animate={{
          opacity: isSelected ? [0.3, 0.7, 0.3] : 0.5,
          scaleY: isHovered ? [1, 1.1, 1] : 1
        }}
        transition={{
          opacity: { duration: 2, repeat: isSelected ? Infinity : 0 },
          scaleY: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

export function HotTubIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.ellipse
        cx="12"
        cy="16"
        rx="8"
        ry="4"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}20` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 60] : [60, 60]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.path
        d="M6 14c2-1 4-1 6 0s4 1 6 0"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          d: isHovered 
            ? ["M6 14c2-1 4-1 6 0s4 1 6 0", "M6 13c2-0.5 4-0.5 6 0s4 0.5 6 0", "M6 14c2-1 4-1 6 0s4 1 6 0"]
            : ["M6 14c2-1 4-1 6 0s4 1 6 0"],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          d: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: Infinity }
        }}
      />
      <motion.path
        d="M8 8c0-1 0.5-2 1-2s1 1 1 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -2, 0] : 0,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.2, repeat: Infinity }
        }}
      />
      <motion.path
        d="M12 6c0-1 0.5-2 1-2s1 1 1 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -2, 0] : 0,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 1.2, repeat: Infinity, delay: 0.2 }
        }}
      />
      <motion.path
        d="M16 8c0-1 0.5-2 1-2s1 1 1 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -2, 0] : 0,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.6 },
          opacity: { duration: 1.2, repeat: Infinity, delay: 0.4 }
        }}
      />
    </motion.svg>
  );
}

export function TennisCourtIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}10` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.line
        x1="12"
        y1="6"
        x2="12"
        y2="18"
        stroke={baseColor}
        strokeWidth="2"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 1
        }}
        transition={{
          pathLength: { duration: 0.8 },
          opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.ellipse
        cx="12"
        cy="12"
        rx="1.5"
        ry="1"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.3, 1] : 1,
          y: isSelected ? [12, 10, 12] : 12
        }}
        transition={{
          scaleX: { duration: 1, repeat: isHovered ? Infinity : 0 },
          y: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M6 10h4M14 10h4M6 14h4M14 14h4"
        stroke={baseColor}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          opacity: isSelected ? [0.3, 1, 0.3] : 0.6
        }}
        transition={{
          opacity: { duration: 2, repeat: isSelected ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

export function GolfCourseIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M12 2v20"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          rotate: isHovered ? [0, 2, -2, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1 },
          rotate: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M12 2l6 4-6 2V2Z"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.2, 1] : 1,
          x: isHovered ? [0, 1, -1, 0] : 0
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          x: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="12"
        cy="20"
        r="2"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          strokeDasharray: isSelected ? [0, 20, 20] : [20, 20, 20]
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0 },
          strokeDasharray: { duration: 1.2 }
        }}
      />
      <motion.circle
        cx="12"
        cy="20"
        r="0.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.8, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
    </motion.svg>
  );
}

export function GameRoomIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="2"
        y="8"
        width="20"
        height="10"
        rx="4"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 80] : [80, 80]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.circle
        cx="8"
        cy="12"
        r="2"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          rotate: isSelected ? 360 : 0
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0 },
          rotate: { duration: 2, ease: "easeInOut" }
        }}
      />
      <motion.rect
        x="15"
        y="10"
        width="2"
        height="2"
        rx="0.5"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          y: isSelected ? [10, 9, 10] : 10
        }}
        transition={{
          scale: { duration: 0.8, repeat: isHovered ? Infinity : 0 },
          y: { duration: 1.2, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="18"
        y="10"
        width="2"
        height="2"
        rx="0.5"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          y: isSelected ? [10, 9, 10] : 10
        }}
        transition={{
          scale: { duration: 0.8, repeat: isHovered ? Infinity : 0, delay: 0.2 },
          y: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.1 }
        }}
      />
      <motion.rect
        x="15"
        y="13"
        width="2"
        height="2"
        rx="0.5"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          y: isSelected ? [13, 14, 13] : 13
        }}
        transition={{
          scale: { duration: 0.8, repeat: isHovered ? Infinity : 0, delay: 0.4 },
          y: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.2 }
        }}
      />
      <motion.rect
        x="18"
        y="13"
        width="2"
        height="2"
        rx="0.5"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          y: isSelected ? [13, 14, 13] : 13
        }}
        transition={{
          scale: { duration: 0.8, repeat: isHovered ? Infinity : 0, delay: 0.6 },
          y: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.3 }
        }}
      />
    </motion.svg>
  );
}

// Dining & Bar Icons
export function RestaurantIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M3 2v7c0 1.1.9 2 2 2h2v11h2V11h2c1.1 0 2-.9 2-2V2H3Z"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1,
          opacity: isHovered ? [0.7, 1, 0.7] : 1
        }}
        transition={{
          scaleY: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 1.2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M16 2v6h1a2 2 0 0 1 2 2v2h-3v10h2V12h1V2h-3Z"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1,
          opacity: isHovered ? [0.7, 1, 0.7] : 1
        }}
        transition={{
          scaleY: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.2 },
          opacity: { duration: 1.2, repeat: isHovered ? Infinity : 0, delay: 0.1 }
        }}
      />
      <motion.circle
        cx="8"
        cy="6"
        r="1"
        fill={isSelected ? '#ffffff' : (baseColor === '#ff5a5f' ? '#ffffff' : baseColor)}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: isSelected ? [0.5, 1, 0.5] : 1
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

export function BarLoungeIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M5 12V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v5M5 12l2 7h10l2-7M5 12h14"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isSelected ? `${baseColor}20` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.ellipse
        cx="12"
        cy="8"
        rx="6"
        ry="1"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.2, 1] : 1,
          opacity: [0.3, 0.8, 0.3]
        }}
        transition={{
          scaleX: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: Infinity }
        }}
      />
      <motion.path
        d="M9 3h6l-1 3H10L9 3Z"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0,
          rotate: isSelected ? [0, 2, -2, 0] : 0
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0 },
          rotate: { duration: 3, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="10"
        cy="15"
        r="0.5"
        fill={baseColor}
        animate={{
          y: isHovered ? [15, 13, 15] : 15,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.2, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="12"
        cy="16"
        r="0.5"
        fill={baseColor}
        animate={{
          y: isHovered ? [16, 14, 16] : 16,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.2 },
          opacity: { duration: 1.2, repeat: Infinity, delay: 0.1 }
        }}
      />
      <motion.circle
        cx="14"
        cy="15"
        r="0.5"
        fill={baseColor}
        animate={{
          y: isHovered ? [15, 13, 15] : 15,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.4 },
          opacity: { duration: 1.2, repeat: Infinity, delay: 0.2 }
        }}
      />
    </motion.svg>
  );
}

// Additional icons would continue here...
// For brevity, I'll include a few more key ones

export function RoomServiceIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M12 2a6 6 0 0 0-6 6c0 1.887.454 3.665 1.257 5.234a.75.75 0 0 0 .65.378h8.186a.75.75 0 0 0 .65-.378A9.98 9.98 0 0 0 18 8a6 6 0 0 0-6-6Z"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 80] : [80, 80]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.ellipse
        cx="12"
        cy="14"
        rx="6"
        ry="1"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.2, 1] : 1,
          opacity: isSelected ? [0.5, 1, 0.5] : 0.7
        }}
        transition={{
          scaleX: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="11"
        y="15"
        width="2"
        height="6"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1,
          opacity: isHovered ? [0.7, 1, 0.7] : 1
        }}
        transition={{
          scaleY: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 1.2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="12"
        cy="8"
        r="1"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.4, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
    </motion.svg>
  );
}

export function BreakfastIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M2 12h20M7 12v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 1.2 }}
      />
      <motion.path
        d="M7 12V8a5 5 0 0 1 10 0v4"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isSelected ? `${baseColor}20` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 60] : [60, 60]
        }}
        transition={{ duration: 1.5, delay: 0.3 }}
      />
      <motion.path
        d="M8 6c0-1 1-2 2-2s2 1 2 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: Infinity }
        }}
      />
      <motion.path
        d="M12 6c0-1 1-2 2-2s2 1 2 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 1.5, repeat: Infinity, delay: 0.2 }
        }}
      />
    </motion.svg>
  );
}

export function CoffeeShopIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.path
        d="M7 4c0-1 1-2 2-2s2 1 2 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: Infinity }
        }}
      />
      <motion.path
        d="M11 4c0-1 1-2 2-2s2 1 2 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 1.5, repeat: Infinity, delay: 0.2 }
        }}
      />
      <motion.ellipse
        cx="10"
        cy="12"
        rx="4"
        ry="2"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.2, 1] : 1,
          opacity: isSelected ? [0.3, 0.7, 0.3] : 0.5
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

export function MiniBarIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}10` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.rect
        x="7"
        y="8"
        width="3"
        height="8"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.5, 1, 0.5] : 0.7
        }}
        transition={{
          scaleY: { duration: 1.5, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="12"
        y="10"
        width="2"
        height="6"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.6, 1, 0.6] : 0.8
        }}
        transition={{
          scaleY: { duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.2 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0, delay: 0.1 }
        }}
      />
      <motion.circle
        cx="17"
        cy="12"
        r="2"
        stroke={baseColor}
        strokeWidth="1.5"
        fill="none"
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          rotate: isSelected ? 360 : 0
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0 },
          rotate: { duration: 2, ease: "easeInOut" }
        }}
      />
      <motion.circle
        cx="17"
        cy="12"
        r="0.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.rect
        x="4"
        y="5"
        width="16"
        height="1"
        rx="0.5"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.05, 1] : 1,
          opacity: isSelected ? [0.3, 1, 0.3] : 0.6
        }}
        transition={{
          scaleX: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

// Transportation Icons
export function ParkingIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.path
        d="M9 8h3a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3h-3M9 8v8M9 14h3"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          strokeWidth: isHovered ? [2, 3, 2] : 2
        }}
        transition={{
          pathLength: { duration: 1.2 },
          strokeWidth: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="18"
        cy="6"
        r="2"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
    </motion.svg>
  );
}

export function ValetParkingIcon({ isSelected, isHovered, size = 24, className = "" }: AmenityIconProps) {
  const baseColor = '#1A1A1A';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="3"
        y="11"
        width="18"
        height="8"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 80] : [80, 80]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.circle
        cx="7"
        cy="17"
        r="2"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          rotate: isHovered ? 360 : 0,
          scale: isSelected ? [1, 1.2, 1] : 1
        }}
        transition={{
          rotate: { duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear" },
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="17"
        cy="17"
        r="2"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          rotate: isHovered ? -360 : 0,
          scale: isSelected ? [1, 1.2, 1] : 1
        }}
        transition={{
          rotate: { duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear" },
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.2 }
        }}
      />
      <motion.path
        d="M3 11V9a2 2 0 0 1 2-2h11l3 4v0"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />
      <motion.circle
        cx="12"
        cy="6"
        r="2"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          y: isSelected ? [6, 4, 6] : 6
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0 },
          y: { duration: 2, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M12 8v3"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 1
        }}
        transition={{
          pathLength: { duration: 0.8 },
          opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

// We can continue adding more icons...
// For now, let's create a comprehensive mapping object

export const AMENITY_ICONS = {
  // Internet & Technology
  'free-wifi': WifiIcon,
  'high-speed-internet': HighSpeedInternetIcon,
  'business-center': BusinessCenterIcon,
  'meeting-rooms': MeetingRoomsIcon,
  'conference-facilities': ConferenceFacilitiesIcon,
  
  // Recreation & Wellness
  'swimming-pool': SwimmingPoolIcon,
  'fitness-center': FitnessCenterIcon,
  'spa': SpaIcon,
  'sauna': SaunaIcon,
  'hot-tub': HotTubIcon,
  'tennis-court': TennisCourtIcon,
  'golf-course': GolfCourseIcon,
  'game-room': GameRoomIcon,
  
  // Dining & Bar
  'restaurant': RestaurantIcon,
  'bar-lounge': BarLoungeIcon,
  'room-service': RoomServiceIcon,
  'breakfast': BreakfastIcon,
  'coffee-shop': CoffeeShopIcon,
  'minibar': MiniBarIcon,
  
  // Transportation
  'free-parking': ParkingIcon,
  'valet-parking': ValetParkingIcon,
  
  // Default fallback icon
  'default': WifiIcon
};

// Helper function to get the right icon component
export function getAmenityIcon(amenityId: string) {
  return AMENITY_ICONS[amenityId as keyof typeof AMENITY_ICONS] || AMENITY_ICONS.default;
}