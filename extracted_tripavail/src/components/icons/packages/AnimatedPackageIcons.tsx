import { motion } from 'motion/react';

interface PackageIconProps {
  isSelected?: boolean;
  isHovered?: boolean;
  size?: number;
  className?: string;
}

// Weekend Getaway Icon
export function WeekendGetawayIcon({ isSelected, isHovered, size = 48, className = "" }: PackageIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1,
        y: isSelected ? [0, -2, 0] : 0
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="8"
        y="12"
        width="32"
        height="24"
        rx="4"
        stroke={baseColor}
        strokeWidth="3"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 120] : [120, 120]
        }}
        transition={{ duration: 2 }}
      />
      <motion.path
        d="M16 8v8M32 8v8"
        stroke={baseColor}
        strokeWidth="3"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0
        }}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
      />
      <motion.circle
        cx="18"
        cy="20"
        r="2"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="24"
        cy="20"
        r="2"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.2 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.3 }
        }}
      />
      <motion.path
        d="M12 28h24"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          scaleX: isHovered ? [1, 1.1, 1] : 1
        }}
        transition={{
          pathLength: { duration: 1.5 },
          scaleX: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M24 4c4 0 8 2 8 6"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.7
        }}
        transition={{
          pathLength: { duration: 1.2 },
          opacity: { duration: 1.8, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

// Honeymoon Icon
export function HoneymoonIcon({ isSelected, isHovered, size = 48, className = "" }: PackageIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M24 40c-8-6-16-12-16-20a8 8 0 0 1 16 0 8 8 0 0 1 16 0c0 8-8 14-16 20z"
        stroke={baseColor}
        strokeWidth="3"
        fill={isSelected ? `${baseColor}20` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100],
          scale: isHovered ? [1, 1.1, 1] : 1
        }}
        transition={{
          strokeDasharray: { duration: 2 },
          scale: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="24"
        cy="20"
        r="4"
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
      <motion.path
        d="M20 16c2-2 6-2 8 0"
        stroke={isSelected ? '#ffffff' : '#ffffff'}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.8
        }}
        transition={{
          pathLength: { duration: 1 },
          opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.g animate={{ rotate: isHovered ? [0, 10, 0] : 0 }} transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}>
        <motion.circle
          cx="18"
          cy="10"
          r="1.5"
          fill={baseColor}
          animate={{
            scale: isSelected ? [1, 1.5, 1] : 1,
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            scale: { duration: 1, repeat: isSelected ? Infinity : 0 },
            opacity: { duration: 2.5, repeat: Infinity }
          }}
        />
        <motion.circle
          cx="30"
          cy="10"
          r="1.5"
          fill={baseColor}
          animate={{
            scale: isSelected ? [1, 1.5, 1] : 1,
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            scale: { duration: 1, repeat: isSelected ? Infinity : 0, delay: 0.5 },
            opacity: { duration: 2.5, repeat: Infinity, delay: 0.8 }
          }}
        />
        <motion.circle
          cx="24"
          cy="6"
          r="1"
          fill={baseColor}
          animate={{
            scale: isSelected ? [1, 2, 1] : 1,
            opacity: [0.4, 1, 0.4]
          }}
          transition={{
            scale: { duration: 1, repeat: isSelected ? Infinity : 0, delay: 1 },
            opacity: { duration: 3, repeat: Infinity, delay: 1.2 }
          }}
        />
      </motion.g>
    </motion.svg>
  );
}

// Family Icon
export function FamilyIcon({ isSelected, isHovered, size = 48, className = "" }: PackageIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      {/* Adult 1 */}
      <motion.circle
        cx="14"
        cy="14"
        r="4"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          strokeDasharray: isSelected ? [0, 25] : [25, 25]
        }}
        transition={{
          scale: { duration: 2, repeat: isHovered ? Infinity : 0 },
          strokeDasharray: { duration: 1.5 }
        }}
      />
      <motion.path
        d="M6 38v-4a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v4"
        stroke={baseColor}
        strokeWidth="2"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 1.2 }}
      />

      {/* Adult 2 */}
      <motion.circle
        cx="34"
        cy="14"
        r="4"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          strokeDasharray: isSelected ? [0, 25] : [25, 25]
        }}
        transition={{
          scale: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          strokeDasharray: { duration: 1.5, delay: 0.2 }
        }}
      />
      <motion.path
        d="M26 38v-4a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v4"
        stroke={baseColor}
        strokeWidth="2"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 1.2, delay: 0.2 }}
      />

      {/* Child */}
      <motion.circle
        cx="24"
        cy="20"
        r="3"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}25` : 'none'}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          strokeDasharray: isSelected ? [0, 19] : [19, 19]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.6 },
          strokeDasharray: { duration: 1.5, delay: 0.4 }
        }}
      />
      <motion.path
        d="M18 38v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3"
        stroke={baseColor}
        strokeWidth="2"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 1.2, delay: 0.4 }}
      />

      {/* Connection lines */}
      <motion.path
        d="M18 16h12M20 22h8"
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

      {/* Decorative hearts */}
      <motion.path
        d="M10 6c0-2 2-3 4-1s4 1 4-1c0-2-2-3-4-1s-4-1-4 1z"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.2, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2.5, repeat: Infinity }
        }}
      />
    </motion.svg>
  );
}

// Staycation Icon
export function StaycationIcon({ isSelected, isHovered, size = 48, className = "" }: PackageIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M8 20L24 8l16 12v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V20z"
        stroke={baseColor}
        strokeWidth="3"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 120] : [120, 120]
        }}
        transition={{ duration: 2.5 }}
      />
      <motion.path
        d="M18 40V28a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}10` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 40] : [40, 40]
        }}
        transition={{ duration: 1.8, delay: 0.3 }}
      />
      <motion.circle
        cx="22"
        cy="34"
        r="1.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.rect
        x="12"
        y="16"
        width="4"
        height="4"
        rx="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2.5, repeat: Infinity }
        }}
      />
      <motion.rect
        x="32"
        y="16"
        width="4"
        height="4"
        rx="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2.5, repeat: Infinity, delay: 0.4 }
        }}
      />
      
      {/* Cozy smoke from chimney */}
      <motion.path
        d="M28 8c1 0 1-2 2-2s1 2 2 2-1-2-2-2-1 2-2 2z"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={{
          y: isHovered ? [0, -2, 0] : 0,
          opacity: [0.3, 0.8, 0.3]
        }}
        transition={{
          y: { duration: 3, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      
      {/* Welcome mat */}
      <motion.rect
        x="20"
        y="38"
        width="8"
        height="2"
        rx="1"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
      />
    </motion.svg>
  );
}

// Business Icon
export function BusinessIcon({ isSelected, isHovered, size = 48, className = "" }: PackageIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.rect
        x="8"
        y="12"
        width="32"
        height="28"
        rx="2"
        stroke={baseColor}
        strokeWidth="3"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 120] : [120, 120]
        }}
        transition={{ duration: 2 }}
      />
      
      {/* Building floors */}
      <motion.path
        d="M8 20h32M8 28h32M8 36h32"
        stroke={baseColor}
        strokeWidth="1"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.3, 0.8, 0.3] : 0.6
        }}
        transition={{
          pathLength: { duration: 1.5 },
          opacity: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      
      {/* Windows */}
      <motion.rect
        x="12"
        y="16"
        width="3"
        height="3"
        rx="0.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.rect
        x="18"
        y="16"
        width="3"
        height="3"
        rx="0.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.2 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.3 }
        }}
      />
      <motion.rect
        x="27"
        y="16"
        width="3"
        height="3"
        rx="0.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.4 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.6 }
        }}
      />
      <motion.rect
        x="33"
        y="16"
        width="3"
        height="3"
        rx="0.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.6 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.9 }
        }}
      />
      
      {/* Briefcase icon */}
      <motion.rect
        x="20"
        y="6"
        width="8"
        height="6"
        rx="1"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}20` : 'none'}
        animate={{
          y: isHovered ? [0, -1, 0] : 0
        }}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
      />
      <motion.path
        d="M22 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"
        stroke={baseColor}
        strokeWidth="2"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 1 }}
      />
      
      {/* Door */}
      <motion.rect
        x="22"
        y="32"
        width="4"
        height="8"
        rx="2"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
      />
      <motion.circle
        cx="25"
        cy="36"
        r="0.5"
        fill={isSelected ? '#ffffff' : '#ffffff'}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1
        }}
        transition={{ duration: 1.2, repeat: isSelected ? Infinity : 0 }}
      />
    </motion.svg>
  );
}

// Festival/Event Icon
export function FestivalEventIcon({ isSelected, isHovered, size = 48, className = "" }: PackageIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      {/* Main stage/tent */}
      <motion.path
        d="M6 36L24 12l18 24z"
        stroke={baseColor}
        strokeWidth="3"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 80] : [80, 80]
        }}
        transition={{ duration: 2 }}
      />
      
      {/* Flag poles */}
      <motion.path
        d="M10 36v-8l6-2v8M38 36v-8l-6-2v8"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 1.5 }}
      />
      
      {/* Flags */}
      <motion.path
        d="M10 28l6-2v4l-6 2z"
        fill={baseColor}
        animate={{
          x: isHovered ? [0, 1, 0] : 0,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          x: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2.5, repeat: Infinity }
        }}
      />
      <motion.path
        d="M38 28l-6-2v4l6 2z"
        fill={baseColor}
        animate={{
          x: isHovered ? [0, -1, 0] : 0,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          x: { duration: 2, repeat: isHovered ? Infinity : 0, delay: 0.5 },
          opacity: { duration: 2.5, repeat: Infinity, delay: 0.3 }
        }}
      />
      
      {/* Fireworks */}
      <motion.g animate={{ opacity: isSelected ? [0.5, 1, 0.5] : 0.7 }} transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0 }}>
        <motion.circle
          cx="12"
          cy="8"
          r="2"
          fill={baseColor}
          animate={{
            scale: isSelected ? [1, 1.5, 1] : 1,
            opacity: [0.4, 1, 0.4]
          }}
          transition={{
            scale: { duration: 1, repeat: isSelected ? Infinity : 0 },
            opacity: { duration: 2, repeat: Infinity }
          }}
        />
        <motion.path
          d="M10 6l4 4M10 10l4-4M8 8h8M12 4v8"
          stroke={baseColor}
          strokeWidth="1"
          strokeLinecap="round"
          animate={{
            pathLength: isSelected ? [0, 1] : 1,
            rotate: isHovered ? 360 : 0
          }}
          transition={{
            pathLength: { duration: 1 },
            rotate: { duration: 4, repeat: isHovered ? Infinity : 0, ease: "linear" }
          }}
        />
        
        <motion.circle
          cx="36"
          cy="10"
          r="2"
          fill={baseColor}
          animate={{
            scale: isSelected ? [1, 1.5, 1] : 1,
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            scale: { duration: 1, repeat: isSelected ? Infinity : 0, delay: 0.5 },
            opacity: { duration: 2, repeat: Infinity, delay: 0.7 }
          }}
        />
        <motion.path
          d="M34 8l4 4M34 12l4-4M32 10h8M36 6v8"
          stroke={baseColor}
          strokeWidth="1"
          strokeLinecap="round"
          animate={{
            pathLength: isSelected ? [0, 1] : 1,
            rotate: isHovered ? -360 : 0
          }}
          transition={{
            pathLength: { duration: 1, delay: 0.5 },
            rotate: { duration: 4, repeat: isHovered ? Infinity : 0, ease: "linear", delay: 1 }
          }}
        />
      </motion.g>
      
      {/* Crowd */}
      <motion.path
        d="M12 36c0-2 1-3 2-3s2 1 2 3M18 36c0-2 1-3 2-3s2 1 2 3M24 36c0-2 1-3 2-3s2 1 2 3M30 36c0-2 1-3 2-3s2 1 2 3"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          y: isHovered ? [0, -0.5, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1.2 },
          y: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      
      {/* Stage lights */}
      <motion.circle
        cx="24"
        cy="24"
        r="2"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.4, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 1.5, repeat: Infinity }
        }}
      />
      <motion.path
        d="M22 22l4 4M26 22l-4 4"
        stroke={isSelected ? '#ffffff' : '#ffffff'}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.8
        }}
        transition={{
          pathLength: { duration: 1 },
          opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

// Wellness & Spa Icon
export function WellnessSpaIcon({ isSelected, isHovered, size = 48, className = "" }: PackageIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      {/* Lotus/Spa bowl */}
      <motion.ellipse
        cx="24"
        cy="32"
        rx="12"
        ry="4"
        stroke={baseColor}
        strokeWidth="3"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 75] : [75, 75]
        }}
        transition={{ duration: 2 }}
      />
      <motion.path
        d="M12 32V24a12 12 0 0 1 24 0v8"
        stroke={baseColor}
        strokeWidth="3"
        animate={{
          strokeDasharray: isSelected ? [0, 100] : [100, 100]
        }}
        transition={{ duration: 2.5, delay: 0.3 }}
      />
      
      {/* Lotus petals */}
      <motion.path
        d="M24 16c-2-4-6-4-8 0s2 8 8 8 10-4 8-8-6-4-8 0z"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}20` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 60] : [60, 60],
          scale: isHovered ? [1, 1.1, 1] : 1
        }}
        transition={{
          strokeDasharray: { duration: 1.8 },
          scale: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      
      {/* Steam/aroma */}
      <motion.g animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
        <motion.path
          d="M18 12c0-2 1-2 1 0s-1 2-1 0z"
          stroke={baseColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          animate={{
            y: isHovered ? [0, -2, 0] : 0
          }}
          transition={{ duration: 3, repeat: isHovered ? Infinity : 0 }}
        />
        <motion.path
          d="M24 8c0-2 1-2 1 0s-1 2-1 0z"
          stroke={baseColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          animate={{
            y: isHovered ? [0, -2, 0] : 0
          }}
          transition={{ duration: 3, repeat: isHovered ? Infinity : 0, delay: 0.5 }}
        />
        <motion.path
          d="M30 12c0-2 1-2 1 0s-1 2-1 0z"
          stroke={baseColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          animate={{
            y: isHovered ? [0, -2, 0] : 0
          }}
          transition={{ duration: 3, repeat: isHovered ? Infinity : 0, delay: 1 }}
        />
      </motion.g>
      
      {/* Zen stones */}
      <motion.ellipse
        cx="16"
        cy="28"
        rx="2"
        ry="1.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.2, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2.5, repeat: Infinity }
        }}
      />
      <motion.ellipse
        cx="32"
        cy="28"
        rx="2"
        ry="1.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.2, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2.5, repeat: Infinity, delay: 0.5 }
        }}
      />
      <motion.ellipse
        cx="24"
        cy="26"
        rx="1.5"
        ry="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.6 },
          opacity: { duration: 2.5, repeat: Infinity, delay: 1 }
        }}
      />
      
      {/* Massage hands */}
      <motion.path
        d="M10 20c2 0 4 2 4 4v4M38 20c-2 0-4 2-4 4v4"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          x: isHovered ? [0, 1, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1.2 },
          x: { duration: 2.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      
      {/* Relaxation waves */}
      <motion.path
        d="M6 36c4 0 4-4 8-4s4 4 8 4 4-4 8-4 4 4 8 4"
        stroke={baseColor}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          x: isHovered ? [0, 2, 0] : 0,
          opacity: [0.4, 0.8, 0.4]
        }}
        transition={{
          pathLength: { duration: 1.8 },
          x: { duration: 3, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
    </motion.svg>
  );
}

// Export mapping object
export const PACKAGE_ICONS = {
  'weekend-getaway': WeekendGetawayIcon,
  'honeymoon': HoneymoonIcon,
  'family': FamilyIcon,
  'staycation': StaycationIcon,
  'business': BusinessIcon,
  'festival-event': FestivalEventIcon,
  'wellness-spa': WellnessSpaIcon
};

// Helper function to get the right package icon
export function getPackageIcon(packageType: string) {
  // Convert package name to kebab-case for lookup
  const kebabCase = packageType.toLowerCase().replace(/[\s&]/g, '-').replace(/\//, '-');
  return PACKAGE_ICONS[kebabCase as keyof typeof PACKAGE_ICONS] || PACKAGE_ICONS['weekend-getaway'];
}