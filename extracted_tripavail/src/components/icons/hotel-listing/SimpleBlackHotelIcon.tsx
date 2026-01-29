import { motion } from 'motion/react';

interface SimpleBlackHotelIconProps {
  size?: number;
}

export function SimpleBlackHotelIcon({ size = 80 }: SimpleBlackHotelIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
    >
      {/* Hotel briefcase/building icon */}
      <motion.path
        d="M 16 24 L 16 50 C 16 51.1 16.9 52 18 52 L 46 52 C 47.1 52 48 51.1 48 50 L 48 24 L 16 24 Z"
        stroke="#000000"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
      
      {/* Top handle/roof */}
      <motion.path
        d="M 24 24 L 24 18 C 24 16.9 24.9 16 26 16 L 38 16 C 39.1 16 40 16.9 40 18 L 40 24"
        stroke="#000000"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeInOut' }}
      />

      {/* Plus symbol */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
        }}
        transition={{ 
          delay: 0.8, 
          duration: 0.4,
          type: 'spring',
          stiffness: 300
        }}
      >
        {/* Vertical line */}
        <motion.line
          x1="32"
          y1="30"
          x2="32"
          y2="46"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Horizontal line */}
        <motion.line
          x1="24"
          y1="38"
          x2="40"
          y2="38"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
        />
      </motion.g>
    </motion.svg>
  );
}
