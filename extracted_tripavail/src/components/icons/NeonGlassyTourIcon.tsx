import { motion } from 'motion/react';

interface NeonGlassyTourIconProps {
  className?: string;
  isActive?: boolean;
}

export function NeonGlassyTourIcon({ className = "w-6 h-6", isActive = false }: NeonGlassyTourIconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Neon Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: isActive 
            ? `radial-gradient(circle, rgba(95, 173, 67, 0.3) 0%, rgba(95, 173, 67, 0.1) 50%, transparent 70%)`
            : 'transparent',
          filter: isActive ? 'blur(8px)' : 'none'
        }}
        animate={isActive ? { opacity: [0.6, 1, 0.6] } : { opacity: 0 }}
        transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
      />
      
      {/* Glass Container */}
      <motion.div
        className="relative w-full h-full rounded-xl backdrop-blur-md border"
        style={{
          background: isActive 
            ? `linear-gradient(135deg, rgba(95, 173, 67, 0.15) 0%, rgba(95, 173, 67, 0.05) 100%)`
            : `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
          borderColor: isActive ? 'rgba(95, 173, 67, 0.3)' : 'rgba(255, 255, 255, 0.2)',
          boxShadow: isActive 
            ? `0 0 20px rgba(95, 173, 67, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
            : `0 0 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {/* Plane Icon SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full p-1.5"
          style={{
            filter: isActive 
              ? `drop-shadow(0 0 8px rgba(95, 173, 67, 0.6))`
              : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
          }}
        >
          <motion.path
            d="M17.8 19.2L16 11L4 15L3 11L16 2L21 8L19 16L17.8 19.2Z"
            stroke={isActive ? '#5FAD43' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isActive ? 'rgba(95, 173, 67, 0.1)' : 'none'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M11 15L5.5 17.5L4.5 16.5L7 13"
            stroke={isActive ? '#5FAD43' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.8, ease: "easeInOut" }}
          />
          
          {/* Animated flight path */}
          <motion.circle
            cx="12"
            cy="8"
            r="1"
            fill={isActive ? '#5FAD43' : 'transparent'}
            animate={isActive ? { 
              x: [0, 10, -5, 8, 0], 
              y: [0, -3, 2, -1, 0],
              opacity: [0, 1, 1, 1, 0]
            } : {}}
            transition={{ duration: 3, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
          />
        </svg>
      </motion.div>
      
      {/* Active Pulse Ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2"
          style={{
            borderColor: '#5FAD43',
            borderOpacity: 0.6
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}