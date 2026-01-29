import { motion } from 'motion/react';

interface ServiceIconProps {
  isSelected?: boolean;
  isHovered?: boolean;
  size?: number;
  className?: string;
}

// Airport Transfer Icon
export function AirportTransferIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
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
      <motion.path
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.1, 1] : 1,
          rotate: isHovered ? [0, 10, 0] : 0
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          rotate: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="1"
        fill={isSelected ? '#ffffff' : '#ffffff'}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.path
        d="M8 12l8 0"
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

// Tour Booking Icon
export function TourBookingIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
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
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 80] : [80, 80],
          rotate: isHovered ? 360 : 0
        }}
        transition={{
          strokeDasharray: { duration: 2 },
          rotate: { duration: 3, repeat: isHovered ? Infinity : 0, ease: "linear" }
        }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="3"
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
        d="M10 10l4 4M14 10l-4 4"
        stroke={isSelected ? '#ffffff' : '#ffffff'}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.8
        }}
        transition={{
          pathLength: { duration: 1.2 },
          opacity: { duration: 1.8, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

// Car Rental Icon
export function CarRentalIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1,
        x: isHovered ? [0, 2, 0] : 0
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M5 11l1.5-4.5h11L19 11M5 11v6h14v-6M5 11h14"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 60] : [60, 60]
        }}
        transition={{ duration: 1.8 }}
      />
      <motion.circle
        cx="7.5"
        cy="16.5"
        r="1.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.4, 1] : 1,
          rotate: isHovered ? 360 : 0
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0 },
          rotate: { duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear" }
        }}
      />
      <motion.circle
        cx="16.5"
        cy="16.5"
        r="1.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.4, 1] : 1,
          rotate: isHovered ? 360 : 0
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.2 },
          rotate: { duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear", delay: 0.5 }
        }}
      />
      <motion.rect
        x="8"
        y="8"
        width="8"
        height="2"
        rx="1"
        fill={baseColor}
        animate={{
          scaleX: isSelected ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0 }}
      />
      <motion.path
        d="M9 4v3M15 4v3"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0
        }}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
      />
    </motion.svg>
  );
}

// Laundry Service Icon
export function LaundryServiceIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
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
          strokeDasharray: isSelected ? [0, 76] : [76, 76]
        }}
        transition={{ duration: 2 }}
      />
      <motion.circle
        cx="12"
        cy="13"
        r="5"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          rotate: isHovered ? 360 : 0,
          scale: isSelected ? [1, 1.1, 1] : 1
        }}
        transition={{
          rotate: { duration: 3, repeat: isHovered ? Infinity : 0, ease: "linear" },
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="7"
        cy="7"
        r="1"
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
        cx="11"
        cy="7"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.5 }
        }}
      />
      <motion.path
        d="M10 11l4 4M14 11l-4 4"
        stroke={baseColor}
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
    </motion.svg>
  );
}

// Dry Cleaning Icon
export function DryCleaningIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1,
        y: isSelected ? [0, -1, 0] : 0
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M9 3v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V3"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 40] : [40, 40]
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.path
        d="M7 9v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 50] : [50, 50]
        }}
        transition={{ duration: 1.8, delay: 0.2 }}
      />
      <motion.circle
        cx="10"
        cy="15"
        r="1"
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
        cx="14"
        cy="15"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.4 }
        }}
      />
      <motion.path
        d="M12 3v6"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          y: isHovered ? [0, -0.5, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1 },
          y: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M8 12h8M8 18h8"
        stroke={baseColor}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          scaleX: isHovered ? [1, 1.1, 1] : 1
        }}
        transition={{
          pathLength: { duration: 1.2 },
          scaleX: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

// Babysitting Icon
export function BabysittingIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
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
      <motion.circle
        cx="9"
        cy="7"
        r="3"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          strokeDasharray: isSelected ? [0, 19] : [19, 19]
        }}
        transition={{
          scale: { duration: 2, repeat: isHovered ? Infinity : 0 },
          strokeDasharray: { duration: 1.5 }
        }}
      />
      <motion.path
        d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          y: isHovered ? [0, 1, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1.2 },
          y: { duration: 2.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.8
        }}
        transition={{
          pathLength: { duration: 1 },
          opacity: { duration: 1.8, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M21 21v-2a4 4 0 0 0-3-3.87"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.6, 1, 0.6] : 0.8
        }}
        transition={{
          pathLength: { duration: 1.2, delay: 0.3 },
          opacity: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="9"
        cy="7"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.path
        d="M7 5c1 0 2 1 2 2s-1 2-2 2"
        stroke={baseColor}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.7
        }}
        transition={{
          pathLength: { duration: 1 },
          opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

// Pet Care Icon
export function PetCareIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
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
        cx="8"
        cy="12"
        rx="2"
        ry="3"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.ellipse
        cx="16"
        cy="12"
        rx="2"
        ry="3"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.4 }
        }}
      />
      <motion.ellipse
        cx="6"
        cy="8"
        rx="1.5"
        ry="2"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.6 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.8 }
        }}
      />
      <motion.ellipse
        cx="18"
        cy="8"
        rx="1.5"
        ry="2"
        fill={baseColor}
        animate={{
          scale: isHovered ? [1, 1.3, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.9 },
          opacity: { duration: 2, repeat: Infinity, delay: 1 }
        }}
      />
      <motion.ellipse
        cx="12"
        cy="16"
        rx="3"
        ry="4"
        fill={baseColor}
        animate={{
          scaleY: isHovered ? [1, 1.1, 1] : 1,
          opacity: isSelected ? [0.5, 0.8, 0.5] : 0.7
        }}
        transition={{
          scaleY: { duration: 2, repeat: isHovered ? Infinity : 0 },
          opacity: { duration: 2.5, repeat: isSelected ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M10 18c1 0 2 0 4 0"
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
      <motion.path
        d="M12 4c2 0 4 2 4 4"
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

// Grocery Shopping Icon
export function GroceryShoppingIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1,
        x: isHovered ? [0, 1, 0] : 0
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.path
        d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 80] : [80, 80]
        }}
        transition={{ duration: 2 }}
      />
      <motion.path
        d="M8 8h8v8H8z"
        stroke={baseColor}
        strokeWidth="1.5"
        fill={isSelected ? `${baseColor}25` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 32] : [32, 32]
        }}
        transition={{ duration: 1.5, delay: 0.3 }}
      />
      <motion.circle
        cx="10"
        cy="10"
        r="1"
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
        cx="14"
        cy="10"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.4 }
        }}
      />
      <motion.circle
        cx="10"
        cy="14"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.6 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.8 }
        }}
      />
      <motion.circle
        cx="14"
        cy="14"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.9 },
          opacity: { duration: 2, repeat: Infinity, delay: 1 }
        }}
      />
      <motion.path
        d="M6 6l2-2M18 6l-2-2"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          y: isHovered ? [0, -0.5, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1 },
          y: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

// Event Planning Icon
export function EventPlanningIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
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
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 76] : [76, 76]
        }}
        transition={{ duration: 2 }}
      />
      <motion.path
        d="M8 2v4M16 2v4"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          y: isHovered ? [0, -1, 0] : 0
        }}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
      />
      <motion.path
        d="M3 10h18"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 1.5 }}
      />
      <motion.circle
        cx="8"
        cy="14"
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
      <motion.circle
        cx="12"
        cy="14"
        r="1.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.4 }
        }}
      />
      <motion.circle
        cx="16"
        cy="14"
        r="1.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.6 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.8 }
        }}
      />
      <motion.path
        d="M8 17h8"
        stroke={baseColor}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          scaleX: isHovered ? [1, 1.1, 1] : 1
        }}
        transition={{
          pathLength: { duration: 1.2 },
          scaleX: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M12 7l2 2-2 2"
        stroke={baseColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          x: isHovered ? [0, 1, 0] : 0
        }}
        transition={{
          pathLength: { duration: 1 },
          x: { duration: 1.8, repeat: isHovered ? Infinity : 0 }
        }}
      />
    </motion.svg>
  );
}

// Catering Icon
export function CateringIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1,
        y: isSelected ? [0, -1, 0] : 0
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.ellipse
        cx="12"
        cy="18"
        rx="8"
        ry="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 50] : [50, 50]
        }}
        transition={{ duration: 1.8 }}
      />
      <motion.path
        d="M4 18V8a8 8 0 0 1 16 0v10"
        stroke={baseColor}
        strokeWidth="2"
        animate={{
          strokeDasharray: isSelected ? [0, 80] : [80, 80]
        }}
        transition={{ duration: 2, delay: 0.2 }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="3"
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
        d="M9 9l6 6M15 9l-6 6"
        stroke={isSelected ? '#ffffff' : '#ffffff'}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.8
        }}
        transition={{
          pathLength: { duration: 1.2 },
          opacity: { duration: 1.8, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M8 6c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
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
        cx="8"
        cy="15"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="16"
        cy="15"
        r="1"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 1.5, 1] : 1,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.4 }
        }}
      />
    </motion.svg>
  );
}

// Photography Icon
export function PhotographyIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
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
        y="7"
        width="18"
        height="12"
        rx="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 64] : [64, 64]
        }}
        transition={{ duration: 1.8 }}
      />
      <motion.circle
        cx="12"
        cy="13"
        r="3"
        stroke={baseColor}
        strokeWidth="2"
        fill="none"
        animate={{
          scale: isSelected ? [1, 1.2, 1] : 1,
          rotate: isHovered ? 360 : 0
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          rotate: { duration: 3, repeat: isHovered ? Infinity : 0, ease: "linear" }
        }}
      />
      <motion.circle
        cx="12"
        cy="13"
        r="1"
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
      <motion.path
        d="M7 7h2l1-2h4l1 2h2"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1
        }}
        transition={{ duration: 1.2 }}
      />
      <motion.circle
        cx="17"
        cy="9"
        r="1"
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
      <motion.path
        d="M9 11l6 6M15 11l-6 6"
        stroke={isSelected ? '#ffffff' : '#ffffff'}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.3, 0.8, 0.3] : 0.5
        }}
        transition={{
          pathLength: { duration: 1 },
          opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.rect
        x="1"
        y="21"
        width="22"
        height="1"
        fill={baseColor}
        animate={{
          scaleX: isHovered ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
      />
    </motion.svg>
  );
}

// Translation Services Icon
export function TranslationServicesIcon({ isSelected, isHovered, size = 24, className = "" }: ServiceIconProps) {
  const baseColor = isSelected ? '#ff5a5f' : '#9CA3AF';
  
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
        d="M5 8l6 6M5 14l6-6"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.8
        }}
        transition={{
          pathLength: { duration: 1.2 },
          opacity: { duration: 1.8, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.path
        d="M13 8l6 6M13 14l6-6"
        stroke={baseColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.6, 1, 0.6] : 0.8
        }}
        transition={{
          pathLength: { duration: 1.2, delay: 0.2 },
          opacity: { duration: 1.8, repeat: isHovered ? Infinity : 0, delay: 0.3 }
        }}
      />
      <motion.circle
        cx="8"
        cy="11"
        r="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          rotate: isHovered ? 360 : 0
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0 },
          rotate: { duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear" }
        }}
      />
      <motion.circle
        cx="16"
        cy="11"
        r="2"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}15` : 'none'}
        animate={{
          scale: isSelected ? [1, 1.3, 1] : 1,
          rotate: isHovered ? -360 : 0
        }}
        transition={{
          scale: { duration: 1.5, repeat: isSelected ? Infinity : 0, delay: 0.3 },
          rotate: { duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear", delay: 0.5 }
        }}
      />
      <motion.path
        d="M2 3h20v18H2z"
        stroke={baseColor}
        strokeWidth="2"
        fill={isSelected ? `${baseColor}05` : 'none'}
        animate={{
          strokeDasharray: isSelected ? [0, 116] : [116, 116]
        }}
        transition={{ duration: 2.5 }}
      />
      <motion.path
        d="M12 3v18"
        stroke={baseColor}
        strokeWidth="1"
        strokeLinecap="round"
        animate={{
          pathLength: isSelected ? [0, 1] : 1,
          opacity: isHovered ? [0.3, 0.8, 0.3] : 0.5
        }}
        transition={{
          pathLength: { duration: 1 },
          opacity: { duration: 2, repeat: isHovered ? Infinity : 0 }
        }}
      />
      <motion.circle
        cx="8"
        cy="11"
        r="0.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 2, 1] : 1,
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0 },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />
      <motion.circle
        cx="16"
        cy="11"
        r="0.5"
        fill={baseColor}
        animate={{
          scale: isSelected ? [1, 2, 1] : 1,
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          scale: { duration: 1.2, repeat: isSelected ? Infinity : 0, delay: 0.3 },
          opacity: { duration: 2, repeat: Infinity, delay: 0.4 }
        }}
      />
    </motion.svg>
  );
}

// Export mapping object
export const SERVICE_ICONS = {
  'airport-transfer': AirportTransferIcon,
  'tour-booking': TourBookingIcon,
  'car-rental': CarRentalIcon,
  'laundry-service': LaundryServiceIcon,
  'dry-cleaning': DryCleaningIcon,
  'babysitting': BabysittingIcon,
  'pet-care': PetCareIcon,
  'grocery-shopping': GroceryShoppingIcon,
  'event-planning': EventPlanningIcon,
  'catering': CateringIcon,
  'photography': PhotographyIcon,
  'translation-services': TranslationServicesIcon,
  'default': AirportTransferIcon
};

// Helper function to get the right service icon
export function getServiceIcon(serviceId: string) {
  // Convert service name to kebab-case for lookup
  const kebabCase = serviceId.toLowerCase().replace(/\s+/g, '-');
  return SERVICE_ICONS[kebabCase as keyof typeof SERVICE_ICONS] || SERVICE_ICONS.default;
}