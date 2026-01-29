import { motion } from 'motion/react';

interface NeonGlassyMessageIconProps {
  className?: string;
  isActive?: boolean;
}

export function NeonGlassyMessageIcon({ className = "w-6 h-6", isActive = false }: NeonGlassyMessageIconProps) {
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
        {/* Message Icon SVG */}
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
            d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          
          {/* Message dots with staggered animation */}
          <motion.circle
            cx="8"
            cy="10"
            r="1.2"
            fill={isActive ? '#E11D48' : '#6B7280'}
            animate={isActive ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 1.8, repeat: isActive ? Infinity : 0, delay: 0 }}
          />
          <motion.circle
            cx="12"
            cy="10"
            r="1.2"
            fill={isActive ? '#E11D48' : '#6B7280'}
            animate={isActive ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 1.8, repeat: isActive ? Infinity : 0, delay: 0.3 }}
          />
          <motion.circle
            cx="16"
            cy="10"
            r="1.2"
            fill={isActive ? '#E11D48' : '#6B7280'}
            animate={isActive ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 1.8, repeat: isActive ? Infinity : 0, delay: 0.6 }}
          />
          
          {/* Notification indicator */}
          {isActive && (
            <motion.circle
              cx="18"
              cy="6"
              r="2"
              fill="rgba(225, 29, 72, 0.8)"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
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