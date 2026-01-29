import { motion } from 'motion/react';

interface NeonGlassyBeachTourIconProps {
  className?: string;
  isActive?: boolean;
}

export function NeonGlassyBeachTourIcon({ className = "w-6 h-6", isActive = false }: NeonGlassyBeachTourIconProps) {
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
        {/* Beach/Palm Tree Icon SVG */}
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
          {/* Sun */}
          <motion.circle
            cx="6"
            cy="6"
            r="2"
            stroke={isActive ? '#E11D48' : '#6B7280'}
            strokeWidth="1.5"
            fill={isActive ? 'rgba(225, 29, 72, 0.2)' : 'none'}
            initial={{ scale: 0, rotate: 0 }}
            animate={{ 
              scale: 1, 
              rotate: isActive ? 360 : 0 
            }}
            transition={{ 
              scale: { duration: 0.6, ease: "easeOut" },
              rotate: { duration: 8, repeat: isActive ? Infinity : 0, ease: "linear" }
            }}
          />
          
          {/* Sun rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
            <motion.line
              key={angle}
              x1={6 + Math.cos(angle * Math.PI / 180) * 3}
              y1={6 + Math.sin(angle * Math.PI / 180) * 3}
              x2={6 + Math.cos(angle * Math.PI / 180) * 3.8}
              y2={6 + Math.sin(angle * Math.PI / 180) * 3.8}
              stroke={isActive ? '#E11D48' : '#6B7280'}
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 0.3 + index * 0.05,
                duration: 0.3,
                ease: "easeOut"
              }}
            />
          ))}

          {/* Palm Tree Trunk */}
          <motion.path
            d="M14 21C14 21 13.5 18 13 15C12.8 13.5 13 12 13.5 11"
            stroke={isActive ? '#8B4513' : '#8B7355'}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          />

          {/* Palm Leaves */}
          <motion.path
            d="M13.5 11C13.5 11 11 9 9 9.5C7 10 8 12 10 11.5"
            stroke={isActive ? '#E11D48' : '#22C55E'}
            strokeWidth="2"
            strokeLinecap="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0, scale: 0 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          />
          
          <motion.path
            d="M13.5 11C13.5 11 16 9 18 9.5C20 10 19 12 17 11.5"
            stroke={isActive ? '#E11D48' : '#22C55E'}
            strokeWidth="2"
            strokeLinecap="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0, scale: 0 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          />
          
          <motion.path
            d="M13.5 11C13.5 11 12 8 10.5 7C9 6 8.5 8.5 11 9.5"
            stroke={isActive ? '#E11D48' : '#22C55E'}
            strokeWidth="2"
            strokeLinecap="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0, scale: 0 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          />

          <motion.path
            d="M13.5 11C13.5 11 15 8 16.5 7C18 6 18.5 8.5 16 9.5"
            stroke={isActive ? '#E11D48' : '#22C55E'}
            strokeWidth="2"
            strokeLinecap="round"
            fill={isActive ? 'rgba(225, 29, 72, 0.15)' : 'none'}
            initial={{ pathLength: 0, scale: 0 }}
            animate={{ pathLength: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          />

          {/* Beach/Ground line */}
          <motion.line
            x1="3"
            y1="21"
            x2="21"
            y2="21"
            stroke={isActive ? '#D2B48C' : '#D4A574'}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
          />

          {/* Beach waves */}
          <motion.path
            d="M3 20C5 19.5 7 20.5 9 20C11 19.5 13 20.5 15 20C17 19.5 19 20.5 21 20"
            stroke={isActive ? '#3B82F6' : '#60A5FA'}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 1,
              x: isActive ? [0, 2, 0] : 0
            }}
            transition={{ 
              pathLength: { duration: 1.5, delay: 1, ease: "easeOut" },
              opacity: { duration: 0.5, delay: 1 },
              x: { duration: 3, repeat: isActive ? Infinity : 0, ease: "easeInOut" }
            }}
          />

          {/* Coconuts */}
          <motion.circle
            cx="12"
            cy="12"
            r="1"
            fill={isActive ? '#8B4513' : '#A0522D'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 1.2, ease: "easeOut" }}
          />
          <motion.circle
            cx="14"
            cy="11.5"
            r="0.8"
            fill={isActive ? '#8B4513' : '#A0522D'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 1.3, ease: "easeOut" }}
          />
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