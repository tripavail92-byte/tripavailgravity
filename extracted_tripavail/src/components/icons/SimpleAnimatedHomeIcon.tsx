import { motion } from 'motion/react';

interface SimpleAnimatedHomeIconProps {
  isActive: boolean;
  size?: number;
}

export function SimpleAnimatedHomeIcon({ isActive, size = 24 }: SimpleAnimatedHomeIconProps) {
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
          rotateY: isActive ? [0, 10, 0] : 0
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      >
        {/* House base */}
        <motion.path
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
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
        
        {/* Animated door highlight */}
        {isActive && (
          <motion.rect
            x="9"
            y="16"
            width="6"
            height="5"
            fill="none"
            stroke={iconColor}
            strokeWidth={1}
            strokeLinecap="round"
            rx={0.5}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.1
            }}
          />
        )}
        
        {/* Pulsing dot */}
        {isActive && (
          <motion.circle
            cx="12"
            cy="8"
            r="1.5"
            fill={iconColor}
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
}