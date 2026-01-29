import { motion } from 'motion/react';

interface SimpleAnimatedTourIconProps {
  isActive: boolean;
  size?: number;
}

export function SimpleAnimatedTourIcon({ isActive, size = 24 }: SimpleAnimatedTourIconProps) {
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
          rotateZ: isActive ? [0, -5, 5, 0] : 0
        }}
        transition={{
          duration: 0.6,
          ease: "easeInOut"
        }}
      >
        {/* Map/Location base */}
        <motion.path
          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
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
        
        {/* Center circle */}
        <motion.circle
          cx="12"
          cy="10"
          r="3"
          stroke={iconColor}
          strokeWidth={isActive ? 2.2 : 2}
          fill="none"
          animate={{
            stroke: iconColor,
            strokeWidth: isActive ? 2.2 : 2,
            scale: isActive ? 1.1 : 1
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut"
          }}
        />
        
        {/* Animated travel path */}
        {isActive && (
          <motion.path
            d="M8 10c0-2 1-3 2-3s2 1 2 3-1 3-2 3-2-1-2-3z"
            stroke={iconColor}
            strokeWidth={1}
            fill="none"
            strokeDasharray="2,2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.7,
              rotate: 360
            }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* Pulsing rings */}
        {isActive && (
          <>
            <motion.circle
              cx="12"
              cy="10"
              r="6"
              stroke={iconColor}
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
            <motion.circle
              cx="12"
              cy="10"
              r="6"
              stroke={iconColor}
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
                delay: 0.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </>
        )}
      </motion.svg>
    </motion.div>
  );
}