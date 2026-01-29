import { motion } from 'motion/react';

interface NeonGlassyHomeIconProps {
  className?: string;
  isActive?: boolean;
}

export function NeonGlassyHomeIcon({ className = "w-6 h-6", isActive = false }: NeonGlassyHomeIconProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Neon Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: isActive 
            ? `radial-gradient(circle, rgba(225, 29, 72, 0.4) 0%, rgba(225, 29, 72, 0.15) 40%, transparent 70%)`
            : 'transparent',
          filter: isActive ? 'blur(6px)' : 'none'
        }}
        animate={isActive ? { opacity: [0.7, 1, 0.7] } : { opacity: 0 }}
        transition={{ duration: 2.5, repeat: isActive ? Infinity : 0 }}
      />
      
      {/* Crystal Glass Container */}
      <motion.div
        className="relative w-full h-full rounded-xl backdrop-blur-sm border"
        style={{
          background: isActive 
            ? `linear-gradient(135deg, 
                rgba(225, 29, 72, 0.25) 0%, 
                rgba(225, 29, 72, 0.15) 30%,
                rgba(255, 255, 255, 0.15) 60%,
                rgba(225, 29, 72, 0.08) 100%)`
            : `linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%, 
                rgba(255, 255, 255, 0.08) 50%, 
                rgba(255, 255, 255, 0.05) 100%)`,
          borderColor: isActive ? 'rgba(225, 29, 72, 0.4)' : 'rgba(255, 255, 255, 0.25)',
          boxShadow: isActive 
            ? `0 0 25px rgba(225, 29, 72, 0.4), 
               0 4px 16px rgba(0, 0, 0, 0.1),
               inset 0 1px 0 rgba(255, 255, 255, 0.4),
               inset 0 -1px 0 rgba(225, 29, 72, 0.2)`
            : `0 2px 12px rgba(0, 0, 0, 0.08), 
               inset 0 1px 0 rgba(255, 255, 255, 0.3),
               inset 0 -1px 0 rgba(255, 255, 255, 0.1)`
        }}
        whileHover={{ scale: 1.03, y: -1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Home Icon SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full p-1.5"
          style={{
            filter: isActive 
              ? `drop-shadow(0 0 8px rgba(225, 29, 72, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))`
              : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12))'
          }}
        >
          <motion.path
            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          <motion.path
            d="M9 22V12H15V22"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
          />
          
          {/* Chimney smoke animation */}
          {isActive && (
            <>
              <motion.circle
                cx="16"
                cy="6"
                r="1"
                fill="rgba(225, 29, 72, 0.4)"
                animate={{ y: [-2, -8], opacity: [0.6, 0], scale: [0.5, 1.2] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              />
              <motion.circle
                cx="17"
                cy="5"
                r="0.8"
                fill="rgba(225, 29, 72, 0.3)"
                animate={{ y: [-2, -8], opacity: [0.5, 0], scale: [0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.circle
                cx="18"
                cy="6.5"
                r="0.6"
                fill="rgba(225, 29, 72, 0.2)"
                animate={{ y: [-2, -8], opacity: [0.4, 0], scale: [0.3, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />
            </>
          )}
        </svg>
      </motion.div>
      
      {/* Active Pulse Ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2"
          style={{
            borderColor: '#E11D48',
            borderOpacity: 0.6
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}