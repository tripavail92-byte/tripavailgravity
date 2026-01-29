import { motion } from 'motion/react';

interface CoverageIconProps {
  className?: string;
  isActive?: boolean;
}

// City Only Icon - Building skyline with radius indicator
export function CityOnlyIcon({ className = "w-8 h-8", isActive = false }: CoverageIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.05, 1] : 1,
        rotateY: isActive ? [0, 5, -5, 0] : 0
      }}
      transition={{ duration: 0.8, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Buildings */}
      <motion.rect
        x="4"
        y="8"
        width="3"
        height="14"
        rx="0.5"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ height: 0, y: 22 }}
        animate={{ height: 14, y: 8 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />
      <motion.rect
        x="8"
        y="5"
        width="3"
        height="17"
        rx="0.5"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ height: 0, y: 22 }}
        animate={{ height: 17, y: 5 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      <motion.rect
        x="12"
        y="3"
        width="3"
        height="19"
        rx="0.5"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ height: 0, y: 22 }}
        animate={{ height: 19, y: 3 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      <motion.rect
        x="16"
        y="6"
        width="3"
        height="16"
        rx="0.5"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ height: 0, y: 22 }}
        animate={{ height: 16, y: 6 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      
      {/* Radius indicator */}
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="#ff5a5f"
          strokeWidth="1"
          strokeDasharray="2 3"
          fill="none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1],
            opacity: [0, 0.6, 0.3],
            rotate: 360
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {/* Windows */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <rect x="5" y="10" width="1" height="1" fill={isActive ? "#ff5a5f" : "#6B7280"} opacity="0.6" />
        <rect x="5" y="12" width="1" height="1" fill={isActive ? "#ff5a5f" : "#6B7280"} opacity="0.6" />
        <rect x="9" y="8" width="1" height="1" fill={isActive ? "#ff5a5f" : "#6B7280"} opacity="0.6" />
        <rect x="9" y="10" width="1" height="1" fill={isActive ? "#ff5a5f" : "#6B7280"} opacity="0.6" />
        <rect x="13" y="6" width="1" height="1" fill={isActive ? "#ff5a5f" : "#6B7280"} opacity="0.6" />
        <rect x="13" y="8" width="1" height="1" fill={isActive ? "#ff5a5f" : "#6B7280"} opacity="0.6" />
      </motion.g>
    </motion.svg>
  );
}

// Local Region Icon - City with surrounding areas
export function LocalRegionIcon({ className = "w-8 h-8", isActive = false }: CoverageIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.03, 1] : 1,
        y: isActive ? [0, -1, 0] : 0
      }}
      transition={{ duration: 1, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Central city */}
      <motion.rect
        x="9"
        y="9"
        width="6"
        height="6"
        rx="1"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Surrounding areas */}
      <motion.circle
        cx="6"
        cy="6"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      <motion.circle
        cx="18"
        cy="6"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      />
      <motion.circle
        cx="6"
        cy="18"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      <motion.circle
        cx="18"
        cy="18"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      
      {/* Connection lines */}
      {isActive && (
        <motion.g
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <motion.path
            d="M8 8l1 1M16 8l-1 1M8 16l1-1M16 16l-1-1"
            stroke="#ff5a5f"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        </motion.g>
      )}
      
      {/* Pulse effect */}
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="8"
          stroke="#ff5a5f"
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.3, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

// Extended Area Icon - Map with roads
export function ExtendedAreaIcon({ className = "w-8 h-8", isActive = false }: CoverageIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.02, 1] : 1,
        rotate: isActive ? [0, 1, -1, 0] : 0
      }}
      transition={{ duration: 1.2, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Map outline */}
      <motion.path
        d="M3 6c0-1.5 1-3 3-3h12c2 0 3 1.5 3 3v12c0 1.5-1 3-3 3H6c-2 0-3-1.5-3-3V6z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      
      {/* Roads/paths */}
      <motion.path
        d="M3 12h18M12 3v18"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeDasharray="3 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />
      
      {/* Diagonal roads */}
      <motion.path
        d="M6 6l12 12M18 6L6 18"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1"
        strokeDasharray="2 3"
        strokeOpacity="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.6 }}
      />
      
      {/* Location markers */}
      <motion.circle
        cx="8"
        cy="8"
        r="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
      <motion.circle
        cx="16"
        cy="8"
        r="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
      />
      <motion.circle
        cx="8"
        cy="16"
        r="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1.2 }}
      />
      <motion.circle
        cx="16"
        cy="16"
        r="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1.4 }}
      />
      
      {/* Moving dot along path */}
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="2"
          fill="#ff5a5f"
          initial={{ scale: 0 }}
          animate={{ 
            scale: [0, 1.5, 1],
            x: [0, 6, 0, -6, 0],
            y: [0, -6, 0, 6, 0]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.6 }}
        />
      )}
    </motion.svg>
  );
}

// Provincial Icon - State/region boundaries
export function ProvincialIcon({ className = "w-8 h-8", isActive = false }: CoverageIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.04, 1] : 1
      }}
      transition={{ duration: 0.8, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Provincial boundaries */}
      <motion.path
        d="M2 8c0-2 2-4 4-4h3l2-2h2l2 2h3c2 0 4 2 4 4v2l2 2v2l-2 2v2c0 2-2 4-4 4h-3l-2 2h-2l-2-2H6c-2 0-4-2-4-4v-2l-2-2v-2l2-2V8z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5 }}
      />
      
      {/* Internal divisions */}
      <motion.path
        d="M12 2v20M2 12h20"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1"
        strokeDasharray="4 2"
        strokeOpacity="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      
      {/* Regional centers */}
      <motion.circle
        cx="7"
        cy="7"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      />
      <motion.circle
        cx="17"
        cy="7"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      />
      <motion.circle
        cx="7"
        cy="17"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      />
      <motion.circle
        cx="17"
        cy="17"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1.4 }}
      />
      
      {/* Pulsing network effect */}
      {isActive && (
        <motion.g>
          <motion.path
            d="M7 7l10 0M7 7l0 10M17 7l0 10M7 17l10 0"
            stroke="#ff5a5f"
            strokeWidth="0.5"
            strokeOpacity="0.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.6 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Country-wide Icon - National map with flag
export function CountryWideIcon({ className = "w-8 h-8", isActive = false }: CoverageIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.05, 1] : 1
      }}
      transition={{ duration: 1, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Country outline */}
      <motion.path
        d="M4 4h16c1 0 2 1 2 2v12c0 1-1 2-2 2H4c-1 0-2-1-2-2V6c0-1 1-2 2-2z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      
      {/* Flag pole */}
      <motion.path
        d="M6 4v16"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      
      {/* Flag */}
      <motion.path
        d="M6 4h8l-1 2 1 2H6V4z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.3"
        initial={{ scale: 0, originX: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      />
      
      {/* Major cities */}
      <motion.circle
        cx="9"
        cy="12"
        r="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      />
      <motion.circle
        cx="15"
        cy="10"
        r="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1.1 }}
      />
      <motion.circle
        cx="12"
        cy="16"
        r="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1.3 }}
      />
      <motion.circle
        cx="18"
        cy="14"
        r="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1.5 }}
      />
      
      {/* Network connections */}
      {isActive && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.7 }}
        >
          <motion.path
            d="M9 12l6-2M9 12l3 4M15 10l3 4M12 16l6-2"
            stroke="#ff5a5f"
            strokeWidth="1"
            strokeDasharray="2 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.g>
      )}
      
      {/* Flag waving animation */}
      {isActive && (
        <motion.path
          d="M6 4h8l-1 2 1 2H6V4z"
          stroke="#ff5a5f"
          strokeWidth="0.5"
          fill="none"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, originX: 0 }}
        />
      )}
    </motion.svg>
  );
}

// International Icon - Globe with plane routes
export function InternationalIcon({ className = "w-8 h-8", isActive = false }: CoverageIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.03, 1] : 1,
        rotateY: isActive ? [0, 10, -10, 0] : 0
      }}
      transition={{ duration: 1.5, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Globe */}
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Longitude lines */}
      <motion.path
        d="M12 3v18M8 4c0 8 0 8 0 16M16 4c0 8 0 8 0 16"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1"
        strokeOpacity="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />
      
      {/* Latitude lines */}
      <motion.path
        d="M3 12h18M5 8c4 0 10 0 14 0M5 16c4 0 10 0 14 0"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1"
        strokeOpacity="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      
      {/* Continents (simplified) */}
      <motion.path
        d="M7 8c2 0 3 1 3 2s-1 2-3 2M14 9c2 0 3 1 2 3s-2 1-2 1"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      />
      
      {/* Airplane route */}
      {isActive && (
        <motion.g>
          <motion.path
            d="M4 8c4-2 8 2 12 0s4 4 4 8"
            stroke="#ff5a5f"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          />
          
          {/* Flying airplane */}
          <motion.g
            initial={{ x: -20, y: 8 }}
            animate={{ 
              x: [4, 12, 20],
              y: [8, 12, 16]
            }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          >
            <motion.path
              d="M0 0l2-1v2l2-1 1 2-2 1v2l-2-1-1-2z"
              fill="#ff5a5f"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.g>
        </motion.g>
      )}
      
      {/* Orbital rings */}
      {isActive && (
        <motion.g>
          <motion.circle
            cx="12"
            cy="12"
            r="11"
            stroke="#ff5a5f"
            strokeWidth="0.5"
            strokeDasharray="1 3"
            fill="none"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle
            cx="12"
            cy="12"
            r="13"
            stroke="#ff5a5f"
            strokeWidth="0.5"
            strokeDasharray="1 5"
            fill="none"
            initial={{ rotate: 0 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}