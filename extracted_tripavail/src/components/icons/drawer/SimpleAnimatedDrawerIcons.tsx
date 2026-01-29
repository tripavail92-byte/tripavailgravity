import { motion } from 'motion/react';
import { 
  BarChart3, UserCircle, MapPin, Heart, Shield, 
  HeadphonesIcon, Building2, Package2, ShieldCheck,
  Calendar, BookOpen, FileText, Settings, Home
} from 'lucide-react';

interface SimpleAnimatedIconProps {
  isActive?: boolean;
  size?: number;
}

const iconColor = (isActive: boolean) => {
  if (isActive) return '#ff5a5f';
  // Check if we're in dark mode by checking the html class
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? '#a1a1aa' : '#6b7280'; // muted-foreground equivalent
};

// Dashboard Icon
export const SimpleAnimatedDashboardIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateY: isActive ? [0, 10, 0] : 0
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      {/* Dashboard grid */}
      <motion.rect
        x="3"
        y="3"
        width="8"
        height="8"
        rx="1"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      <motion.rect
        x="13"
        y="3"
        width="8"
        height="5"
        rx="1"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      <motion.rect
        x="13"
        y="10"
        width="8"
        height="11"
        rx="1"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      <motion.rect
        x="3"
        y="13"
        width="8"
        height="8"
        rx="1"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="1"
          fill={iconColor(isActive)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 1],
            opacity: [0, 0.8, 0.6]
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);

// Home Icon
export const SimpleAnimatedHomeIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateY: isActive ? [0, 10, 0] : 0
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      <motion.path
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {isActive && (
        <motion.circle
          cx="12"
          cy="8"
          r="1.5"
          fill={iconColor(isActive)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1],
            opacity: [0, 0.8, 0.6]
          }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);

// Profile Icon
export const SimpleAnimatedProfileIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateY: isActive ? [0, 15, 0] : 0
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut"
      }}
    >
      <motion.circle
        cx="12"
        cy="8"
        r="4"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke={iconColor(isActive)}
          strokeWidth={0.8}
          fill="none"
          opacity={0.3}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ 
            scale: [0.3, 1.1, 1.3],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);

// Trips Icon
export const SimpleAnimatedTripsIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateZ: isActive ? [0, -5, 5, 0] : 0
      }}
      transition={{
        duration: 0.6,
        ease: "easeInOut"
      }}
    >
      <motion.path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="12"
        cy="10"
        r="3"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
          scale: isActive ? 1.1 : 1
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut"
        }}
      />
      
      {isActive && (
        <>
          <motion.circle
            cx="12"
            cy="10"
            r="6"
            stroke={iconColor(isActive)}
            strokeWidth={0.8}
            fill="none"
            opacity={0.3}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: [0.5, 1.2, 1.5],
              opacity: [0, 0.4, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        </>
      )}
    </motion.svg>
  </motion.div>
);

// Wishlist Icon
export const SimpleAnimatedWishlistIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateZ: isActive ? [0, -10, 10, 0] : 0
      }}
      transition={{
        duration: 0.8,
        ease: "easeInOut"
      }}
    >
      <motion.path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isActive ? iconColor(isActive) : "none"}
        fillOpacity={isActive ? 0.2 : 0}
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
          fill: isActive ? iconColor(isActive) : "none",
          fillOpacity: isActive ? 0.2 : 0
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
      />
      
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="8"
          stroke={iconColor(isActive)}
          strokeWidth={0.8}
          fill="none"
          opacity={0.3}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.3, 1.6],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);

// Settings Icon
export const SimpleAnimatedSettingsIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotate: isActive ? [0, 180, 360] : 0
      }}
      transition={{
        duration: 1,
        ease: "easeInOut"
      }}
    >
      <motion.path
        d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="12"
        cy="12"
        r="3"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  </motion.div>
);

// Help Icon
export const SimpleAnimatedHelpIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateY: isActive ? [0, 15, 0] : 0
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut"
      }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.circle
        cx="12"
        cy="17"
        r="1"
        fill={iconColor(isActive)}
        animate={{
          fill: iconColor(isActive),
          scale: isActive ? [1, 1.3, 1] : 1
        }}
        transition={{
          duration: 0.4,
          ease: "easeInOut"
        }}
      />
      
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="15"
          stroke={iconColor(isActive)}
          strokeWidth={0.8}
          fill="none"
          opacity={0.2}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ 
            scale: [0.7, 1.2, 1.5],
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);

// Hotel Icon
export const SimpleAnimatedHotelIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateY: isActive ? [0, 10, 0] : 0
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      <motion.rect
        x="4"
        y="6"
        width="16"
        height="15"
        rx="1"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.rect
        x="9"
        y="16"
        width="6"
        height="5"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2 : 1.8}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2 : 1.8,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.rect
        x="6"
        y="8"
        width="2"
        height="2"
        rx="0.3"
        fill={iconColor(isActive)}
        animate={{
          fill: iconColor(isActive),
          scale: isActive ? [1, 1.2, 1] : 1
        }}
        transition={{
          duration: 0.4,
          delay: 0.1,
          ease: "easeInOut"
        }}
      />
      <motion.rect
        x="11"
        y="8"
        width="2"
        height="2"
        rx="0.3"
        fill={iconColor(isActive)}
        animate={{
          fill: iconColor(isActive),
          scale: isActive ? [1, 1.2, 1] : 1
        }}
        transition={{
          duration: 0.4,
          delay: 0.2,
          ease: "easeInOut"
        }}
      />
      <motion.rect
        x="16"
        y="8"
        width="2"
        height="2"
        rx="0.3"
        fill={iconColor(isActive)}
        animate={{
          fill: iconColor(isActive),
          scale: isActive ? [1, 1.2, 1] : 1
        }}
        transition={{
          duration: 0.4,
          delay: 0.3,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  </motion.div>
);

// Package Icon
export const SimpleAnimatedPackageIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateX: isActive ? [0, 10, 0] : 0
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      <motion.path
        d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.polyline
        points="3.27,6.96 12,12.01 20.73,6.96"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.line
        x1="12"
        y1="12.01"
        x2="12"
        y2="22.08"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  </motion.div>
);

// Verification Icon
export const SimpleAnimatedVerificationIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateZ: isActive ? [0, 5, -5, 0] : 0
      }}
      transition={{
        duration: 0.6,
        ease: "easeInOut"
      }}
    >
      <motion.path
        d="M9 12l2 2 4-4"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.5 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M21 12c.5 0 .9-.4.9-.9V6.9c0-.5-.4-.9-.9-.9h-1.5V5.1c0-.3-.2-.5-.5-.5h-1.5c-.3 0-.5.2-.5.5v-.9H6.5c-.3 0-.5.2-.5.5V6H4.5c-.3 0-.5.2-.5.5v4.6c0 .5.4.9.9.9h1.6v1.5c0 .3.2.5.5.5h11c.3 0 .5-.2.5-.5v-1.5H21z"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke={iconColor(isActive)}
          strokeWidth={0.8}
          fill="none"
          opacity={0.3}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: [0.5, 1.3, 1.6],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);

// Calendar Icon
export const SimpleAnimatedCalendarIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateY: isActive ? [0, 10, 0] : 0
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      <motion.rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {isActive && (
        <motion.circle
          cx="12"
          cy="16"
          r="2"
          fill={iconColor(isActive)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.3, 1],
            opacity: [0, 1, 0.8]
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);

// Payment Methods Icon
export const SimpleAnimatedPaymentIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateY: isActive ? [0, 10, 0] : 0
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      {/* Credit Card */}
      <motion.rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {/* Card stripe */}
      <motion.path
        d="M2 10h20"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {/* Card chip */}
      <motion.rect
        x="4"
        y="14"
        width="4"
        height="2"
        rx="0.5"
        fill={iconColor(isActive)}
        animate={{
          fill: iconColor(isActive),
          scale: isActive ? [1, 1.2, 1] : 1
        }}
        transition={{
          duration: 0.4,
          delay: 0.1,
          ease: "easeInOut"
        }}
      />
      
      {/* Mobile wallet indicator */}
      <motion.circle
        cx="18"
        cy="14"
        r="2"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2 : 1.5}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2 : 1.5,
          scale: isActive ? 1.1 : 1
        }}
        transition={{
          duration: 0.3,
          delay: 0.2,
          ease: "easeOut"
        }}
      />
      
      {/* Phone icon inside circle */}
      <motion.rect
        x="16.5"
        y="12.5"
        width="3"
        height="3"
        rx="0.3"
        stroke={iconColor(isActive)}
        strokeWidth={1}
        fill="none"
        animate={{
          stroke: iconColor(isActive),
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="15"
          stroke={iconColor(isActive)}
          strokeWidth={0.8}
          fill="none"
          opacity={0.2}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ 
            scale: [0.7, 1.2, 1.5],
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </motion.svg>
  </motion.div>
);

// Bookings Icon
export const SimpleAnimatedBookingsIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateX: isActive ? [0, 10, 0] : 0
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      <motion.path
        d="M4 19.5A2.5 2.5 0 016.5 17H20"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.line
        x1="10"
        y1="8"
        x2="16"
        y2="8"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2 : 1.5}
        strokeLinecap="round"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2 : 1.5,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.line
        x1="10"
        y1="12"
        x2="16"
        y2="12"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2 : 1.5}
        strokeLinecap="round"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2 : 1.5,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  </motion.div>
);

// Legal Icon
export const SimpleAnimatedLegalIcon = ({ isActive = false, size = 20 }: SimpleAnimatedIconProps) => (
  <motion.div
    animate={{
      scale: isActive ? 1.1 : 1,
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25
    }}
  >
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        rotateY: isActive ? [0, 10, 0] : 0
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      <motion.path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.polyline
        points="14,2 14,8 20,8"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2.2 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2.2 : 2,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.line
        x1="16"
        y1="13"
        x2="8"
        y2="13"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2 : 1.5}
        strokeLinecap="round"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2 : 1.5,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.line
        x1="16"
        y1="17"
        x2="8"
        y2="17"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2 : 1.5}
        strokeLinecap="round"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2 : 1.5,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
      
      <motion.polyline
        points="10,9 9,9 8,9"
        stroke={iconColor(isActive)}
        strokeWidth={isActive ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={{
          stroke: iconColor(isActive),
          strokeWidth: isActive ? 2 : 1.5,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  </motion.div>
);

// Export all icons
export const SimpleAnimatedDrawerIcons = {
  Dashboard: SimpleAnimatedDashboardIcon,
  Home: SimpleAnimatedHomeIcon,
  Profile: SimpleAnimatedProfileIcon,
  Trips: SimpleAnimatedTripsIcon,
  Wishlist: SimpleAnimatedWishlistIcon,
  Settings: SimpleAnimatedSettingsIcon,
  Help: SimpleAnimatedHelpIcon,
  Hotel: SimpleAnimatedHotelIcon,
  Package: SimpleAnimatedPackageIcon,
  Verification: SimpleAnimatedVerificationIcon,
  Calendar: SimpleAnimatedCalendarIcon,
  Payment: SimpleAnimatedPaymentIcon,
  Bookings: SimpleAnimatedBookingsIcon,
  Legal: SimpleAnimatedLegalIcon,
};