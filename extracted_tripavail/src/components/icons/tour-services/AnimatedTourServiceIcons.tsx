import { motion } from 'motion/react';

// Day Trip Icon - Camera with landmark
export function DayTripIcon({ className = "w-8 h-8", isActive = false }: { className?: string; isActive?: boolean }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.05, 1] : 1,
        rotate: isActive ? [0, 1, -1, 0] : 0
      }}
      transition={{ duration: 0.6, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Camera Body */}
      <motion.rect
        x="3"
        y="8"
        width="18"
        height="12"
        rx="3"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      {/* Camera Lens */}
      <motion.circle
        cx="12"
        cy="14"
        r="3"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      {/* Viewfinder */}
      <motion.rect
        x="7"
        y="5"
        width="4"
        height="3"
        rx="1"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      {/* Flash indicator */}
      <motion.circle
        cx="17"
        cy="11"
        r="1"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: isActive ? [0, 1.3, 1] : 1 }}
        transition={{ duration: 0.4, delay: 0.7, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
      />
      {/* Landmark elements */}
      {isActive && (
        <motion.g>
          <motion.path
            d="M8 3l1-1h2l1 1"
            stroke="#ff5a5f"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
          <motion.path
            d="M14 3l1-1h2l1 1"
            stroke="#ff5a5f"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Weekend Getaway Icon - Cabin with mountains
export function WeekendGetawayIcon({ className = "w-8 h-8", isActive = false }: { className?: string; isActive?: boolean }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.05, 1] : 1,
        y: isActive ? [0, -1, 0] : 0
      }}
      transition={{ duration: 0.8, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Mountain backdrop */}
      <motion.path
        d="M1 15l4-6 3 4 4-5 3 3 4-4 4 3v8H1z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2 }}
      />
      {/* Cabin structure */}
      <motion.path
        d="M6 12l6-4 6 4v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      {/* Door */}
      <motion.rect
        x="10"
        y="16"
        width="4"
        height="4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      />
      {/* Windows */}
      <motion.rect
        x="8"
        y="14"
        width="2"
        height="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
      <motion.rect
        x="14"
        y="14"
        width="2"
        height="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
      />
      {/* Chimney smoke */}
      {isActive && (
        <motion.g>
          <motion.path
            d="M15 8c0-1 1-1 1 0s1 1 1 0"
            stroke="#ff5a5f"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
          />
          <motion.path
            d="M16 6c0-1 1-1 1 0s1 1 1 0"
            stroke="#ff5a5f"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.8 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Hiking Icon - Hiker with backpack and mountain trail
export function HikingIcon({ className = "w-8 h-8", isActive = false }: { className?: string; isActive?: boolean }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.03, 1] : 1,
        rotate: isActive ? [0, 0.5, -0.5, 0] : 0
      }}
      transition={{ duration: 1, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Mountain peaks */}
      <motion.path
        d="M2 18l4-6 3 2 4-5 3 3 4-4 3 2v8H2z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2 }}
      />
      {/* Hiker figure */}
      <motion.circle
        cx="8"
        cy="6"
        r="1.5"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      {/* Backpack */}
      <motion.path
        d="M7 8c0-1 0-1 1-1s1 0 1 1v3c0 1 0 1-1 1s-1 0-1-1V8z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      {/* Hiking stick */}
      <motion.path
        d="M6 9l-1 3"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      />
      {/* Body and legs */}
      <motion.path
        d="M8 11v4M7 15l-1 2M9 15l1 2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
      />
      {/* Trail markers */}
      {isActive && (
        <motion.g>
          <motion.circle
            cx="12"
            cy="14"
            r="0.5"
            fill="#ff5a5f"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ duration: 0.6, delay: 1.2, repeat: Infinity, repeatDelay: 2 }}
          />
          <motion.circle
            cx="15"
            cy="12"
            r="0.5"
            fill="#ff5a5f"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ duration: 0.6, delay: 1.6, repeat: Infinity, repeatDelay: 2 }}
          />
          <motion.circle
            cx="18"
            cy="10"
            r="0.5"
            fill="#ff5a5f"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ duration: 0.6, delay: 2, repeat: Infinity, repeatDelay: 2 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Sightseeing Icon - Binoculars with landmarks
export function SightseeingIcon({ className = "w-8 h-8", isActive = false }: { className?: string; isActive?: boolean }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.05, 1] : 1
      }}
      transition={{ duration: 0.6, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Binoculars body */}
      <motion.rect
        x="3"
        y="8"
        width="7"
        height="8"
        rx="3"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.rect
        x="14"
        y="8"
        width="7"
        height="8"
        rx="3"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />
      {/* Center bridge */}
      <motion.path
        d="M10 10h4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      {/* Lenses */}
      <motion.circle
        cx="6.5"
        cy="12"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      <motion.circle
        cx="17.5"
        cy="12"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />
      {/* Strap */}
      <motion.path
        d="M6.5 8c0-2 1-3 3-3h2c2 0 3 1 3 3"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      />
      {/* Landmarks in view */}
      {isActive && (
        <motion.g>
          <motion.path
            d="M5 3l1-1h1l1 1v2H5V3z"
            stroke="#ff5a5f"
            strokeWidth="1"
            fill="none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
          />
          <motion.path
            d="M16 3l1-1h1l1 1v2h-3V3z"
            stroke="#ff5a5f"
            strokeWidth="1"
            fill="none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.3 }}
          />
          <motion.circle
            cx="12"
            cy="4"
            r="1"
            stroke="#ff5a5f"
            strokeWidth="1"
            fill="none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.8 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Festival and Events Icon - Party/celebration with confetti
export function FestivalEventsIcon({ className = "w-8 h-8", isActive = false }: { className?: string; isActive?: boolean }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.05, 1] : 1,
        y: isActive ? [0, -1, 0] : 0
      }}
      transition={{ duration: 0.8, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Stage/platform */}
      <motion.rect
        x="4"
        y="16"
        width="16"
        height="6"
        rx="1"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      {/* Festival tent/banner */}
      <motion.path
        d="M6 16V8l6-4 6 4v8"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      {/* Flags */}
      <motion.path
        d="M8 8l2-1v3l-2-1M16 8l-2-1v3l2-1"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      {/* Crowd silhouettes */}
      <motion.path
        d="M7 18c0-1 1-2 2-2s2 1 2 2M11 18c0-1 1-2 2-2s2 1 2 2M15 18c0-1 1-2 2-2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      />
      {/* Confetti and celebration elements */}
      {isActive && (
        <motion.g>
          <motion.circle
            cx="6"
            cy="6"
            r="0.5"
            fill="#ff5a5f"
            initial={{ scale: 0, y: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              y: [0, 8, 16]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
          />
          <motion.rect
            x="9"
            y="5"
            width="1"
            height="1"
            fill="#ff5a5f"
            initial={{ scale: 0, y: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              y: [0, 6, 12]
            }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 1.2 }}
          />
          <motion.circle
            cx="15"
            cy="7"
            r="0.5"
            fill="#ff5a5f"
            initial={{ scale: 0, y: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              y: [0, 10, 20]
            }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 1.6 }}
          />
          <motion.path
            d="M18 5l1 1M19 7l1-1"
            stroke="#ff5a5f"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 2 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Leisure and Relaxation Icon - Beach hammock with palm trees
export function LeisureRelaxationIcon({ className = "w-8 h-8", isActive = false }: { className?: string; isActive?: boolean }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.03, 1] : 1
      }}
      transition={{ duration: 1, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Palm tree trunks */}
      <motion.path
        d="M4 20V8c0-1 1-2 2-2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M20 20V8c0-1-1-2-2-2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />
      {/* Palm fronds */}
      <motion.path
        d="M6 8c-2-1-3-2-2-3s3 0 4 1c1-2 2-3 3-2s0 3-1 4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />
      <motion.path
        d="M18 8c2-1 3-2 2-3s-3 0-4 1c-1-2-2-3-3-2s0 3 1 4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      />
      {/* Hammock */}
      <motion.path
        d="M6 14c2 2 4 2 6 0s4-2 6 0"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      />
      {/* Hammock ropes */}
      <motion.path
        d="M4 12l2 2M20 12l-2 2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      />
      {/* Beach waves */}
      <motion.path
        d="M2 20c2-1 4-1 6 0s4 1 6 0s4-1 6 0"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 1 }}
      />
      {/* Swaying animation */}
      {isActive && (
        <motion.g>
          <motion.path
            d="M8 14c1 0 2 0 3 0"
            stroke="#ff5a5f"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ x: 0 }}
            animate={{ x: [0, 1, -1, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.2 }}
          />
          <motion.path
            d="M13 14c1 0 2 0 3 0"
            stroke="#ff5a5f"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ x: 0 }}
            animate={{ x: [0, -1, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />
          {/* Coconut falling */}
          <motion.circle
            cx="7"
            cy="7"
            r="0.5"
            fill="#ff5a5f"
            initial={{ y: 0, opacity: 0 }}
            animate={{ 
              y: [0, 14],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 2.5 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Custom Option Icon
export function CustomOptionIcon({ className = "w-8 h-8", isActive = false }: { className?: string; isActive?: boolean }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.05, 1] : 1,
        rotate: isActive ? [0, 2, -2, 0] : 0
      }}
      transition={{ duration: 0.8, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      <motion.rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeDasharray={isActive ? "none" : "5,5"}
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.path
        d="M12 8v8M8 12h8"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="2"
          stroke="#ff5a5f"
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.8, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
        />
      )}
    </motion.svg>
  );
}