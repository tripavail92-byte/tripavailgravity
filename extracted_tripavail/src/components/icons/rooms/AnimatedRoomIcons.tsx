import { motion } from 'motion/react';

interface RoomIconProps {
  isSelected?: boolean;
  isHovered?: boolean;
  size?: number;
  className?: string;
}

// Bed Configuration Icons
export function SingleBedIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        x="4"
        y="8"
        width="16"
        height="10"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 80] : [80, 80]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.rect
        x="4"
        y="6"
        width="16"
        height="4"
        rx="2"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.7, 1, 0.7] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="2"
        y="15"
        width="2"
        height="6"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.rect
        x="20"
        y="15"
        width="2"
        height="6"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.1 }}
      />
      <motion.circle
        cx="12"
        cy="10"
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

export function DoubleBedIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        y="8"
        width="20"
        height="10"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.rect
        x="2"
        y="6"
        width="20"
        height="4"
        rx="2"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.7, 1, 0.7] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.line
        x1="12"
        y1="6"
        x2="12"
        y2="18"
        stroke={baseColor}
        strokeWidth="1"
        strokeDasharray="2,2"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.3, 1, 0.3] : 0.5
        }}
        transition={{
          pathLength: { duration: 1 },
          opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="1"
        y="15"
        width="2"
        height="6"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.rect
        x="21"
        y="15"
        width="2"
        height="6"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.1 }}
      />
      <motion.circle
        cx="8"
        cy="10"
        r="0.8"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="16"
        cy="10"
        r="0.8"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isHovered ? Infinity : 0, delay: 0.2 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.3 }
        }}
      />
    </motion.svg>
  );
}

export function TwinBedsIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
      {/* First bed */}
      <motion.rect
        x="2"
        y="6"
        width="8"
        height="8"
        rx="1.5"
        stroke={baseColor}
        strokeWidth="1.5"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 60] : [60, 60],
          x: isHovered ? [2, 1.5, 2] : 2
        }}
        transition={{
          strokeDasharray: { duration: 1.5 },
          x: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="2"
        y="4"
        width="8"
        height="3"
        rx="1.5"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.7, 1, 0.7] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      
      {/* Second bed */}
      <motion.rect
        x="14"
        y="6"
        width="8"
        height="8"
        rx="1.5"
        stroke={baseColor}
        strokeWidth="1.5"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 60] : [60, 60],
          x: isHovered ? [14, 14.5, 14] : 14
        }}
        transition={{
          strokeDasharray: { duration: 1.5, delay: 0.2 },
          x: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.3 }
        }}
      />
      <motion.rect
        x="14"
        y="4"
        width="8"
        height="3"
        rx="1.5"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.8, 1, 0.8] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.2 }
        }}
      />
      
      {/* Bed legs */}
      <motion.rect x="1" y="12" width="1.5" height="4" rx="0.5" fill={baseColor} animate={{ scaleY: isSelected ? [1, 1.1, 1] : 1 }} transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0 }} />
      <motion.rect x="9.5" y="12" width="1.5" height="4" rx="0.5" fill={baseColor} animate={{ scaleY: isSelected ? [1, 1.1, 1] : 1 }} transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.1 }} />
      <motion.rect x="13" y="12" width="1.5" height="4" rx="0.5" fill={baseColor} animate={{ scaleY: isSelected ? [1, 1.1, 1] : 1 }} transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.2 }} />
      <motion.rect x="21.5" y="12" width="1.5" height="4" rx="0.5" fill={baseColor} animate={{ scaleY: isSelected ? [1, 1.1, 1] : 1 }} transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.3 }} />

      {/* Pillows */}
      <motion.circle
        cx="6"
        cy="8"
        r="0.8"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="18"
        cy="8"
        r="0.8"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0, delay: 0.4 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.5 }
        }}
      />
    </motion.svg>
  );
}

export function QueenBedIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        x="1"
        y="7"
        width="22"
        height="11"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 110] : [110, 110]
        }}
        transition={{ duration: 1.8 }}
      />
      <motion.rect
        x="1"
        y="5"
        width="22"
        height="4"
        rx="2"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.7, 1, 0.7] : 0.9
        }}
        transition={{
          scaleY: { duration: 2.5, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="0"
        y="15"
        width="2"
        height="6"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.15, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.rect
        x="22"
        y="15"
        width="2"
        height="6"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.15, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.1 }}
      />
      <motion.ellipse
        cx="12"
        cy="11"
        rx="8"
        ry="2"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.3, 0.6, 0.3] : 0.4
        }}
        transition={{
          scaleX: { duration: 2.5, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="8"
        cy="9"
        r="1"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.4, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.3, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2.2, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="16"
        cy="9"
        r="1"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.4, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.3, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2.2, repeat: Infinity, delay: 0.4 }
        }}
      />
    </motion.svg>
  );
}

export function KingBedIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1,
        y: isSelected ? [0, -3, 0] : 0
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="0.5"
        y="6"
        width="23"
        height="12"
        rx="2.5"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 120] : [120, 120]
        }}
        transition={{ duration: 2 }}
      />
      <motion.rect
        x="0.5"
        y="4"
        width="23"
        height="4"
        rx="2"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.15, 1] : 1,
          opacity: isSelected ? [0.8, 1, 0.8] : 0.9
        }}
        transition={{
          scaleY: { duration: 3, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="0"
        y="15"
        width="2.5"
        height="7"
        rx="1.25"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 1.8, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.rect
        x="21.5"
        y="15"
        width="2.5"
        height="7"
        rx="1.25"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 1.8, repeat: isSelected ? Infinity : 0, delay: 0.1 }}
      />
      <motion.ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="2.5"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.3, 0.7, 0.3] : 0.4
        }}
        transition={{
          scaleX: { duration: 3, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2.2, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M6 8 Q12 6 18 8"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.7
        }}
        transition={{
          pathLength: { duration: 1.5 },
          opacity: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="7"
        cy="9"
        r="1.2"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.5, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2.5, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="17"
        cy="9"
        r="1.2"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.5, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.4 },
          opacity: { duration: 2.5, repeat: Infinity, delay: 0.5 }
        }}
      />
    </motion.svg>
  );
}

export function SofaBedIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        width="20"
        height="6"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 80] : [80, 80]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.rect
        x="2"
        y="6"
        width="3"
        height="8"
        rx="1.5"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.7, 1, 0.7] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="19"
        y="6"
        width="3"
        height="8"
        rx="1.5"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.8, 1, 0.8] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.2 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.1 }
        }}
      />
      <motion.rect
        x="6"
        y="8"
        width="12"
        height="4"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.2, 1] : 1,
          opacity: isHovered ? [0.6, 1, 0.6] : 0.7
        }}
        transition={{
          scaleY: { duration: 2, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 1.8, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="1"
        y="14"
        width="2"
        height="5"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.rect
        x="21"
        y="14"
        width="2"
        height="5"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.1 }}
      />
      <motion.path
        d="M8 6 Q12 4 16 6"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.4, 1, 0.4] : 0.6
        }}
        transition={{
          pathLength: { duration: 1.2 },
          opacity: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="9"
        cy="9"
        r="0.8"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.4, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="15"
        cy="9"
        r="0.8"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.4, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.4 }
        }}
      />
    </motion.svg>
  );
}

export function BunkBedIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
      {/* Top bunk */}
      <motion.rect
        x="4"
        y="3"
        width="16"
        height="6"
        rx="1.5"
        stroke={baseColor}
        strokeWidth="1.5"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 70] : [70, 70],
          y: isHovered ? [3, 2.5, 3] : 3
        }}
        transition={{
          strokeDasharray: { duration: 1.5 },
          y: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="4"
        y="2"
        width="16"
        height="2"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.2, 1] : 1,
          opacity: isSelected ? [0.7, 1, 0.7] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      
      {/* Bottom bunk */}
      <motion.rect
        x="4"
        y="12"
        width="16"
        height="6"
        rx="1.5"
        stroke={baseColor}
        strokeWidth="1.5"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 70] : [70, 70],
          y: isHovered ? [12, 12.5, 12] : 12
        }}
        transition={{
          strokeDasharray: { duration: 1.5, delay: 0.2 },
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.3 }
        }}
      />
      <motion.rect
        x="4"
        y="11"
        width="16"
        height="2"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.2, 1] : 1,
          opacity: isSelected ? [0.8, 1, 0.8] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.2 }
        }}
      />
      
      {/* Support posts */}
      <motion.rect
        x="2"
        y="9"
        width="2"
        height="12"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.05, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.rect
        x="20"
        y="9"
        width="2"
        height="12"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.05, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.1 }}
      />
      
      {/* Ladder */}
      <motion.rect
        x="21"
        y="6"
        width="1"
        height="10"
        fill={baseColor}
        animate={{
          opacity: isSelected ? [0.5, 1, 0.5] : 0.7
        }}
        transition={{ duration: 2, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.rect x="20.5" y="7" width="2" height="0.5" fill={baseColor} animate={{ opacity: isHovered ? [0.5, 1, 0.5] : 0.8 }} transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.1 }} />
      <motion.rect x="20.5" y="9" width="2" height="0.5" fill={baseColor} animate={{ opacity: isHovered ? [0.6, 1, 0.6] : 0.8 }} transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.2 }} />
      <motion.rect x="20.5" y="11" width="2" height="0.5" fill={baseColor} animate={{ opacity: isHovered ? [0.7, 1, 0.7] : 0.8 }} transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.3 }} />
      
      {/* Pillows */}
      <motion.circle
        cx="7"
        cy="5"
        r="0.8"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="7"
        cy="14"
        r="0.8"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0, delay: 0.5 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.6 }
        }}
      />
    </motion.svg>
  );
}

// Room Amenity Icons
export function AirConditioningIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
      <motion.rect
        x="4"
        y="8"
        width="16"
        height="4"
        rx="1"
        fill={baseColor}
        animate={{
          opacity: isSelected ? [0.3, 0.7, 0.3] : 0.5
        }}
        transition={{ duration: 2, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.path
        d="M7 16c0 1 1 2 2 2M12 16c0 1 1 2 2 2M17 16c0 1 1 2 2 2"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, 1, 0] : 0,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: Infinity }
        }}
      />
      <motion.path
        d="M8 18c0 0.5 0.5 1 1 1M13 18c0 0.5 0.5 1 1 1M18 18c0 0.5 0.5 1 1 1"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, 1, 0] : 0,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 1.5, repeat: Infinity, delay: 0.2 }
        }}
      />
      <motion.path
        d="M9 20c0 0.2 0.2 0.5 0.5 0.5M14 20c0 0.2 0.2 0.5 0.5 0.5M19 20c0 0.2 0.2 0.5 0.5 0.5"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, 1, 0] : 0,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          y: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.6 },
          opacity: { duration: 1.5, repeat: Infinity, delay: 0.4 }
        }}
      />
      <motion.circle
        cx="19"
        cy="9"
        r="1"
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

export function TelevisionIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.rect
        x="4"
        y="8"
        width="16"
        height="8"
        rx="1"
        fill={baseColor}
        animate={{
          opacity: isSelected ? [0.4, 0.8, 0.4] : 0.6,
          scaleY: isHovered ? [1, 1.05, 1] : 1
        }}
        transition={{
          opacity: { duration: 2, repeat: isSelected ? Infinity : 0 },
          scaleY: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="8"
        y="18"
        width="8"
        height="1"
        fill={baseColor}
        animate={{
          scaleX: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.rect
        x="10"
        y="19"
        width="4"
        height="2"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.1 }}
      />
      <motion.path
        d="M8 3l4 3 4-3"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          y: isHovered ? [0, -0.5, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1 },
          y: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="10"
        cy="12"
        r="1.5"
        fill={isSelected ? '#ffffff' : baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: isSelected ? [0.7, 1, 0.7] : 1
        }}
        transition={{
          scale: { duration: 1, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.polygon
        points="9,11 9,13 11.5,12"
        fill={isSelected ? baseColor : '#ffffff'}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
      />
      <motion.rect
        x="14"
        y="10"
        width="4"
        height="0.5"
        rx="0.25"
        fill={isSelected ? '#ffffff' : baseColor}
        animate={{
          scaleX: isSelected ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.rect
        x="14"
        y="12"
        width="3"
        height="0.5"
        rx="0.25"
        fill={isSelected ? '#ffffff' : baseColor}
        animate={{
          scaleX: isSelected ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.2 }}
      />
      <motion.rect
        x="14"
        y="14"
        width="4"
        height="0.5"
        rx="0.25"
        fill={isSelected ? '#ffffff' : baseColor}
        animate={{
          scaleX: isSelected ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.4 }}
      />
    </motion.svg>
  );
}

export function WifiIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        strokeWidth="2"
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

export function MinibarIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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

export function SafeIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        y="6"
        width="18"
        height="14"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.circle
        cx="15"
        cy="13"
        r="4"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          scale: isHovered ? [1, 1.1, 1] : 1,
          rotate: isSelected ? 360 : 0
        }}
        transition={{
          scale: { duration: 2, repeat: isHovered ? Infinity : 0 },
          rotate: { duration: 3, ease: "easeInOut" }
        }}
      />
      <motion.circle
        cx="15"
        cy="13"
        r="2"
        stroke={baseColor}
        strokeWidth="1.5"
        fill="none"
        animate={{
          scale: isSelected ? [1, 1.2, 1] : 1,
          rotate: isSelected ? -180 : 0
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          rotate: { duration: 2, ease: "easeInOut", delay: 0.2 }
        }}
      />
      <motion.circle
        cx="15"
        cy="13"
        r="0.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.rect
        x="5"
        y="9"
        width="6"
        height="1"
        rx="0.5"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.2, 1] : 1,
          opacity: isSelected ? [0.5, 1, 0.5] : 0.7
        }}
        transition={{
          scaleX: { duration: 1.5, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="5"
        y="11"
        width="4"
        height="1"
        rx="0.5"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.2, 1] : 1,
          opacity: isSelected ? [0.6, 1, 0.6] : 0.7
        }}
        transition={{
          scaleX: { duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.2 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0, delay: 0.1 }
        }}
      />
      <motion.rect
        x="5"
        y="13"
        width="5"
        height="1"
        rx="0.5"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.2, 1] : 1,
          opacity: isSelected ? [0.7, 1, 0.7] : 0.7
        }}
        transition={{
          scaleX: { duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.4 },
          opacity: { duration: 1.8, repeat: isSelected ? Infinity : 0, delay: 0.2 }
        }}
      />
      <motion.path
        d="M12 2v4"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          y: isHovered ? [0, -1, 0] : 0
        }}
        transition={{
          pathLength: { duration: 0.8 },
          y: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

export function BalconyIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        y="12"
        width="20"
        height="8"
        rx="1"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 80] : [80, 80]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.path
        d="M6 12V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 1.2 }}
      />
      <motion.rect
        x="4"
        y="12"
        width="1"
        height="8"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.rect
        x="7"
        y="12"
        width="1"
        height="8"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.1 }}
      />
      <motion.rect
        x="10"
        y="12"
        width="1"
        height="8"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.2 }}
      />
      <motion.rect
        x="13"
        y="12"
        width="1"
        height="8"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.3 }}
      />
      <motion.rect
        x="16"
        y="12"
        width="1"
        height="8"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.4 }}
      />
      <motion.rect
        x="19"
        y="12"
        width="1"
        height="8"
        fill={baseColor}
        animate={{
          scaleY: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.5 }}
      />
      <motion.path
        d="M8 8h8M10 6h4"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          opacity: isHovered ? [0.5, 1, 0.5] : 0.7
        }}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
      />
      <motion.circle
        cx="12"
        cy="4"
        r="1.5"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2.5, repeat: Infinity }
        }}
      />
      <motion.path
        d="M10 3c1-1 3-1 4 0"
        stroke={baseColor}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          y: isHovered ? [0, -0.5, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1 },
          y: { duration: 3, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

export function CityViewIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        y="12"
        width="4"
        height="10"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.6, 1, 0.6] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="8"
        y="8"
        width="4"
        height="14"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.7, 1, 0.7] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.2 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.1 }
        }}
      />
      <motion.rect
        x="14"
        y="6"
        width="4"
        height="16"
        rx="1"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.8, 1, 0.8] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.4 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.2 }
        }}
      />
      <motion.rect
        x="20"
        y="10"
        width="2"
        height="12"
        rx="0.5"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.9, 1, 0.9] : 0.8
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.6 },
          opacity: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.3 }
        }}
      />
      {/* Windows */}
      <motion.rect x="3" y="14" width="1" height="1" fill={isSelected ? '#ffffff' : '#ffffff'} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.1 }} />
      <motion.rect x="4.5" y="14" width="1" height="1" fill={isSelected ? '#ffffff' : '#ffffff'} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
      <motion.rect x="3" y="16" width="1" height="1" fill={isSelected ? '#ffffff' : '#ffffff'} animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
      
      <motion.rect x="9" y="10" width="1" height="1" fill={isSelected ? '#ffffff' : '#ffffff'} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }} />
      <motion.rect x="10.5" y="10" width="1" height="1" fill={isSelected ? '#ffffff' : '#ffffff'} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} />
      <motion.rect x="9" y="12" width="1" height="1" fill={isSelected ? '#ffffff' : '#ffffff'} animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
      
      <motion.rect x="15" y="8" width="1" height="1" fill={isSelected ? '#ffffff' : '#ffffff'} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
      <motion.rect x="16.5" y="8" width="1" height="1" fill={isSelected ? '#ffffff' : '#ffffff'} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
      <motion.rect x="15" y="10" width="1" height="1" fill={isSelected ? '#ffffff' : '#ffffff'} animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 0.7 }} />
      
      {/* Sun */}
      <motion.circle
        cx="20"
        cy="4"
        r="2"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 3, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2.5, repeat: Infinity }
        }}
      />
      <motion.path
        d="M20 1v2M22.12 2.88l-1.41 1.41M23 6h-2M22.12 9.12l-1.41-1.41"
        stroke={baseColor}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          rotate: isSelected ? 360 : 0,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.7
        }}
        transition={{
          rotate: { duration: 8, repeat: isSelected ? Infinity : 0, ease: "linear" },
          opacity: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

export function OceanViewIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0 2 2 2 2v6H2v-8Z"
        fill={baseColor}
        animate={{
          opacity: isSelected ? [0.4, 0.8, 0.4] : 0.6
        }}
        transition={{ duration: 2, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.path
        d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0 2 2 2 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        animate={{
          d: isHovered 
            ? ["M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0 2 2 2 2", "M2 15c2-1 4-1 6 0s4 1 6 0 4-1 6 0 2 1 2 1", "M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0 2 2 2 2"]
            : ["M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0 2 2 2 2"]
        }}
        transition={{ duration: 3, repeat: isHovered ? Infinity : 0 }}
      />
      <motion.path
        d="M2 18c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0 3.5 1 5 0"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={{
          d: isHovered 
            ? ["M2 18c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0 3.5 1 5 0", "M2 19c1.5-0.5 3.5-0.5 5 0s3.5 0.5 5 0 3.5-0.5 5 0 3.5 0.5 5 0", "M2 18c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0 3.5 1 5 0"]
            : ["M2 18c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0 3.5 1 5 0"],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          d: { duration: 3.5, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="19"
        cy="6"
        r="2.5"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 4, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 3, repeat: Infinity }
        }}
      />
      <motion.path
        d="M19 2v2M22.12 3.88l-1.41 1.41M24 7h-2M22.12 10.12l-1.41-1.41M19 12v-2M15.88 10.12l1.41-1.41M14 7h2M15.88 3.88l1.41 1.41"
        stroke={baseColor}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          rotate: isSelected ? 360 : 0,
          opacity: isHovered ? [0.4, 1, 0.4] : 0.6
        }}
        transition={{
          rotate: { duration: 10, repeat: isSelected ? Infinity : 0, ease: "linear" },
          opacity: { duration: 2.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M8 8c-1 2-1 4 0 6M6 9c-0.5 1-0.5 2 0 3M10 9c0.5 1 0.5 2 0 3"
        stroke={baseColor}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.3, 0.8, 0.3] : 0.5
        }}
        transition={{
          pathLength: { duration: 1.5 },
          opacity: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

export function KitchenetteIcon({ isSelected, isHovered, size = 24, className = "" }: RoomIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#374151';
  
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
        height="12"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.rect
        x="4"
        y="10"
        width="6"
        height="4"
        rx="1"
        stroke={baseColor}
        strokeWidth="1.5"
        fill="none"
        animate={{
          scale: isHovered ? [1, 1.05, 1] : 1
        }}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
      />
      <motion.circle
        cx="7"
        cy="12"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.rect
        x="12"
        y="10"
        width="8"
        height="4"
        rx="1"
        fill={baseColor}
        animate={{
          opacity: isSelected ? [0.4, 0.8, 0.4] : 0.6,
          scaleY: isHovered ? [1, 1.05, 1] : 1
        }}
        transition={{
          opacity: { duration: 2, repeat: isSelected ? Infinity : 0 },
          scaleY: { duration: 1.8, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="13"
        y="11"
        width="2"
        height="2"
        rx="0.5"
        fill={isSelected ? '#ffffff' : '#ffffff'}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
      />
      <motion.rect
        x="16"
        y="11"
        width="2"
        height="2"
        rx="0.5"
        fill={isSelected ? '#ffffff' : '#ffffff'}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.2 }}
      />
      <motion.rect
        x="4"
        y="16"
        width="16"
        height="2"
        rx="1"
        fill={baseColor}
        animate={{
          scaleX: isSelected ? [1, 1.05, 1] : 1,
          opacity: isHovered ? [0.6, 1, 0.6] : 0.8
        }}
        transition={{
          scaleX: { duration: 2, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="6"
        cy="17"
        r="0.5"
        fill={isSelected ? '#ffffff' : '#ffffff'}
        animate={{
          scale: isSelected ? [1, 1.4, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.circle
        cx="18"
        cy="17"
        r="0.5"
        fill={isSelected ? '#ffffff' : '#ffffff'}
        animate={{
          scale: isSelected ? [1, 1.4, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.3 }}
      />
      <motion.path
        d="M7 4c0-1 1-2 2-2s2 1 2 2"
        stroke={baseColor}
        strokeWidth="1.5"
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
        d="M13 4c0-1 1-2 2-2s2 1 2 2"
        stroke={baseColor}
        strokeWidth="1.5"
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

// Export mapping object
export const ROOM_ICONS = {
  // Bed Configurations
  'single-bed': SingleBedIcon,
  'double-bed': DoubleBedIcon,
  'twin-beds': TwinBedsIcon,
  'queen-bed': QueenBedIcon,
  'king-bed': KingBedIcon,
  'sofa-bed': SofaBedIcon,
  'bunk-bed': BunkBedIcon,
  
  // Room Amenities
  'air-conditioning': AirConditioningIcon,
  'television': TelevisionIcon,
  'wifi': WifiIcon,
  'minibar': MinibarIcon,
  'safe': SafeIcon,
  'balcony': BalconyIcon,
  'city-view': CityViewIcon,
  'ocean-view': OceanViewIcon,
  'kitchenette': KitchenetteIcon,
  
  // Default fallback
  'default': SingleBedIcon
};

// Helper function to get the right room icon
export function getRoomIcon(roomId: string) {
  return ROOM_ICONS[roomId as keyof typeof ROOM_ICONS] || ROOM_ICONS.default;
}