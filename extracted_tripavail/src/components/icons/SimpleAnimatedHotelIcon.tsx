import { motion } from 'motion/react';

interface SimpleAnimatedHotelIconProps {
  isActive: boolean;
  size?: number;
}

export function SimpleAnimatedHotelIcon({ isActive, size = 24 }: SimpleAnimatedHotelIconProps) {
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
        {/* Hotel building */}
        <motion.rect
          x="4"
          y="6"
          width="16"
          height="15"
          rx="1"
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
        
        {/* Hotel entrance */}
        <motion.rect
          x="9"
          y="16"
          width="6"
          height="5"
          stroke={iconColor}
          strokeWidth={isActive ? 2 : 1.8}
          fill="none"
          animate={{
            stroke: iconColor,
            strokeWidth: isActive ? 2 : 1.8,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
        />
        
        {/* Windows row 1 */}
        <motion.rect
          x="6"
          y="8"
          width="2"
          height="2"
          rx="0.3"
          fill={iconColor}
          animate={{
            fill: iconColor,
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
          fill={iconColor}
          animate={{
            fill: iconColor,
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
          fill={iconColor}
          animate={{
            fill: iconColor,
            scale: isActive ? [1, 1.2, 1] : 1
          }}
          transition={{
            duration: 0.4,
            delay: 0.3,
            ease: "easeInOut"
          }}
        />
        
        {/* Windows row 2 */}
        <motion.rect
          x="6"
          y="12"
          width="2"
          height="2"
          rx="0.3"
          fill={iconColor}
          animate={{
            fill: iconColor,
            scale: isActive ? [1, 1.2, 1] : 1
          }}
          transition={{
            duration: 0.4,
            delay: 0.4,
            ease: "easeInOut"
          }}
        />
        <motion.rect
          x="16"
          y="12"
          width="2"
          height="2"
          rx="0.3"
          fill={iconColor}
          animate={{
            fill: iconColor,
            scale: isActive ? [1, 1.2, 1] : 1
          }}
          transition={{
            duration: 0.4,
            delay: 0.5,
            ease: "easeInOut"
          }}
        />
        
        {/* Hotel sign/flag */}
        <motion.path
          d="M8 6V3l4 1v2"
          stroke={iconColor}
          strokeWidth={isActive ? 2 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{
            stroke: iconColor,
            strokeWidth: isActive ? 2 : 1.8,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
        />
        
        {/* Animated star/crown */}
        {isActive && (
          <motion.path
            d="M12 2l1 2h2l-1.5 1.5L14 8l-2-1-2 1 .5-2.5L9 4h2l1-2z"
            fill={iconColor}
            stroke={iconColor}
            strokeWidth={0.5}
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ 
              scale: [0, 1.3, 1],
              opacity: [0, 1, 0.8],
              rotate: [0, 360, 720]
            }}
            transition={{
              duration: 1,
              delay: 0.2,
              ease: "easeOut"
            }}
          />
        )}
        
        {/* Pulsing base */}
        {isActive && (
          <motion.rect
            x="2"
            y="20"
            width="20"
            height="1"
            rx="0.5"
            fill={iconColor}
            opacity={0.3}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ 
              scaleX: [0, 1.1, 1],
              opacity: [0, 0.5, 0.3]
            }}
            transition={{
              duration: 0.6,
              delay: 0.3,
              ease: "easeOut"
            }}
          />
        )}
      </motion.svg>
    </motion.div>
  );
}