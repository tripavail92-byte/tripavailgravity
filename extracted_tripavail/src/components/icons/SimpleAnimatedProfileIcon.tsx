import { motion } from 'motion/react';

interface SimpleAnimatedProfileIconProps {
  isActive: boolean;
  size?: number;
}

export function SimpleAnimatedProfileIcon({ isActive, size = 24 }: SimpleAnimatedProfileIconProps) {
  const iconColor = isActive ? '#ff5a5f' : '#000000';
  
  return (
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
        {/* Profile head */}
        <motion.circle
          cx="12"
          cy="8"
          r="4"
          stroke={iconColor}
          strokeWidth={isActive ? 2.2 : 2}
          fill="none"
          animate={{
            stroke: iconColor,
            strokeWidth: isActive ? 2.2 : 2,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
        />
        
        {/* Profile body */}
        <motion.path
          d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
          stroke={iconColor}
          strokeWidth={isActive ? 2.2 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{
            stroke: iconColor,
            strokeWidth: isActive ? 2.2 : 2,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
        />
        
        {/* Animated highlight on head */}
        {isActive && (
          <motion.circle
            cx="12"
            cy="8"
            r="2"
            fill={iconColor}
            opacity={0.2}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: [0, 0.3, 0.2]
            }}
            transition={{
              duration: 0.4,
              delay: 0.1,
              ease: "easeOut"
            }}
          />
        )}
        
        {/* Animated pulse ring */}
        {isActive && (
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            stroke={iconColor}
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
        
        {/* Status dot */}
        {isActive && (
          <motion.circle
            cx="16"
            cy="6"
            r="1.5"
            fill={iconColor}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.3, 1],
              opacity: [0, 1, 0.8]
            }}
            transition={{
              duration: 0.5,
              delay: 0.3,
              ease: "easeOut"
            }}
          />
        )}
        
        {/* Subtle shoulder animation */}
        {isActive && (
          <motion.path
            d="M8 17c0-1 1-2 2-2h4c1 0 2 1 2 2"
            stroke={iconColor}
            strokeWidth={1}
            fill="none"
            opacity={0.4}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.4
            }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.svg>
    </motion.div>
  );
}