import { motion } from 'motion/react';

interface NeonGlassyProfileIconProps {
  className?: string;
  isActive?: boolean;
}

export function NeonGlassyProfileIcon({ className = "w-6 h-6", isActive = false }: NeonGlassyProfileIconProps) {
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
        {/* User/Profile Icon SVG */}
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
            d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
          />
          <motion.circle
            cx="12"
            cy="7"
            r="4"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="2"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0, scale: 0 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
          
          {/* Animated profile status glow */}
          {isActive && (
            <>
              <motion.circle
                cx="12"
                cy="7"
                r="5.5"
                stroke="#E11D48"
                strokeWidth="0.8"
                fill="none"
                opacity="0.4"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.circle
                cx="16"
                cy="9"
                r="1.5"
                fill="rgba(225, 29, 72, 0.8)"
                animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
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