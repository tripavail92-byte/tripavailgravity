import { motion } from 'motion/react';

interface PolicyIconProps {
  className?: string;
  isActive?: boolean;
}

// Platform Terms Icon - Shield with checkmark
export function PlatformTermsIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.05, 1] : 1,
        rotateY: isActive ? [0, 10, -10, 0] : 0
      }}
      transition={{ duration: 1, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Shield outline */}
      <motion.path
        d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-8-4z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5 }}
      />
      
      {/* Shield fill */}
      <motion.path
        d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-8-4z"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      
      {/* Checkmark */}
      <motion.path
        d="M9 12l2 2 4-4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
      />
      
      {/* Pulsing ring */}
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="11"
          stroke="#ff5a5f"
          strokeWidth="0.5"
          fill="none"
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.3, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

// Cancellation Policy Icon - Calendar with X
export function CancellationIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.03, 1] : 1,
        rotate: isActive ? [0, 2, -2, 0] : 0
      }}
      transition={{ duration: 1.2, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
    >
      {/* Calendar base */}
      <motion.rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      
      {/* Calendar header */}
      <motion.path
        d="M3 10h18"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      
      {/* Calendar hooks */}
      <motion.path
        d="M8 2v4M16 2v4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      
      {/* X mark */}
      <motion.path
        d="M10 14l4 4M14 14l-4 4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      />
      
      {/* Animated dots */}
      {isActive && (
        <motion.g>
          <motion.circle
            cx="7"
            cy="14"
            r="1"
            fill="#ff5a5f"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.circle
            cx="7"
            cy="17"
            r="1"
            fill="#ff5a5f"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
          <motion.circle
            cx="17"
            cy="14"
            r="1"
            fill="#ff5a5f"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Liability Icon - Balance scale
export function LiabilityIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.02, 1] : 1
      }}
      transition={{ duration: 0.8, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Scale base */}
      <motion.path
        d="M12 3v18M8 21h8"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      
      {/* Left scale pan */}
      <motion.path
        d="M6 9l3-3 3 3v6l-3 3-3-3V9z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ scale: 0, originX: 6, originY: 9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />
      
      {/* Right scale pan */}
      <motion.path
        d="M15 9l3-3 3 3v6l-3 3-3-3V9z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ scale: 0, originX: 18, originY: 9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      />
      
      {/* Scale arms */}
      <motion.path
        d="M6 9h12"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      
      {/* Balance animation */}
      {isActive && (
        <motion.g
          animate={{ 
            rotate: [0, 2, -2, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, originX: 12, originY: 9 }}
        >
          <motion.path
            d="M6 9h12"
            stroke="#ff5a5f"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Data Protection Icon - Lock with shield
export function DataProtectionIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.04, 1] : 1
      }}
      transition={{ duration: 1, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2.5 }}
    >
      {/* Lock body */}
      <motion.rect
        x="6"
        y="11"
        width="12"
        height="9"
        rx="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />
      
      {/* Lock shackle */}
      <motion.path
        d="M8 11V7a4 4 0 0 1 8 0v4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Lock dot */}
      <motion.circle
        cx="12"
        cy="16"
        r="1"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      />
      
      {/* Shield overlay */}
      <motion.path
        d="M12 4l-3 1.5v3c0 2.77 1.92 5.37 4.5 6 2.58-.63 4.5-3.23 4.5-6v-3L15 4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill="none"
        strokeOpacity="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
      />
      
      {/* Secure connection lines */}
      {isActive && (
        <motion.g>
          <motion.path
            d="M3 3l18 18M21 3L3 21"
            stroke="#ff5a5f"
            strokeWidth="0.5"
            strokeOpacity="0.3"
            strokeDasharray="2 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Safety Protocols Icon - First aid cross with gear
export function SafetyProtocolsIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.03, 1] : 1
      }}
      transition={{ duration: 0.9, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Medical cross background */}
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Medical cross vertical */}
      <motion.rect
        x="10"
        y="6"
        width="4"
        height="12"
        rx="1"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      
      {/* Medical cross horizontal */}
      <motion.rect
        x="6"
        y="10"
        width="12"
        height="4"
        rx="1"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />
      
      {/* Gear elements */}
      <motion.g
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ originX: 12, originY: 12 }}
      >
        <motion.circle
          cx="7"
          cy="7"
          r="2"
          stroke={isActive ? "#ff5a5f" : "#6B7280"}
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        />
        <motion.circle
          cx="17"
          cy="17"
          r="2"
          stroke={isActive ? "#ff5a5f" : "#6B7280"}
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 1 }}
        />
      </motion.g>
      
      {/* Safety pulse */}
      {isActive && (
        <motion.circle
          cx="12"
          cy="12"
          r="11"
          stroke="#ff5a5f"
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

// Booking Terms Icon - Document with pen
export function BookingTermsIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.02, 1] : 1
      }}
      transition={{ duration: 1.1, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2.5 }}
    >
      {/* Document */}
      <motion.path
        d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.05"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2 }}
      />
      
      {/* Document corner */}
      <motion.path
        d="M14 2v6h6"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      
      {/* Document lines */}
      <motion.path
        d="M8 13h8M8 17h6"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      />
      
      {/* Pen */}
      <motion.path
        d="M16 4l2-2 2 2-8 8-4 1 1-4z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      />
      
      {/* Writing animation */}
      {isActive && (
        <motion.path
          d="M8 13h8"
          stroke="#ff5a5f"
          strokeWidth="2"
          strokeOpacity="0.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        />
      )}
    </motion.svg>
  );
}

// Hotel specific policy icons
// Check-in/Check-out Icon - Clock with keys
export function CheckInOutIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.03, 1] : 1
      }}
      transition={{ duration: 1, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Clock face */}
      <motion.circle
        cx="12"
        cy="12"
        r="8"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Clock hands */}
      <motion.path
        d="M12 6v6l4 2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />
      
      {/* Key */}
      <motion.path
        d="M18 8l2-2M20 6l-1 1M19 7l1-1"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      />
      
      {/* Animated tick marks */}
      {isActive && (
        <motion.g>
          <motion.circle
            cx="12"
            cy="4"
            r="1"
            fill="#ff5a5f"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.circle
            cx="20"
            cy="12"
            r="1"
            fill="#ff5a5f"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
          <motion.circle
            cx="12"
            cy="20"
            r="1"
            fill="#ff5a5f"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          />
          <motion.circle
            cx="4"
            cy="12"
            r="1"
            fill="#ff5a5f"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// House Rules Icon - List with checkmarks
export function HouseRulesIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.02, 1] : 1
      }}
      transition={{ duration: 0.9, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Paper background */}
      <motion.rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.05"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Rule lines */}
      <motion.path
        d="M8 8h8M8 12h6M8 16h7"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />
      
      {/* Checkmarks */}
      <motion.path
        d="M6 8l1 1 2-2M6 12l1 1 2-2M6 16l1 1 2-2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      />
      
      {/* Animated highlights */}
      {isActive && (
        <motion.g>
          <motion.rect
            x="7"
            y="7"
            width="10"
            height="2"
            rx="1"
            fill="#ff5a5f"
            fillOpacity="0.2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Children Policy Icon - Family figures
export function ChildrenIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.04, 1] : 1
      }}
      transition={{ duration: 1.1, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2.5 }}
    >
      {/* Adult figure */}
      <motion.circle
        cx="9"
        cy="6"
        r="2"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M9 10v8M7 12l2-1 2 1M7 18h4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      
      {/* Child figure */}
      <motion.circle
        cx="16"
        cy="8"
        r="1.5"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      <motion.path
        d="M16 11v7M14.5 13l1.5-1 1.5 1M14.5 18h3"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      
      {/* Heart connection */}
      {isActive && (
        <motion.path
          d="M11 10c1-1 3-1 4 0"
          stroke="#ff5a5f"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 1, delay: 1 }}
        />
      )}
    </motion.svg>
  );
}

// Pet Policy Icon - Dog/cat silhouette
export function PetIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.03, 1] : 1
      }}
      transition={{ duration: 1, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Dog head */}
      <motion.path
        d="M12 8c3 0 5 2 5 5s-2 5-5 5-5-2-5-5 2-5 5-5z"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Ears */}
      <motion.path
        d="M8 9c-1-2-2-3-3-2s0 3 1 4M16 9c1-2 2-3 3-2s0 3-1 4"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      
      {/* Eyes */}
      <motion.circle
        cx="10"
        cy="11"
        r="1"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      />
      <motion.circle
        cx="14"
        cy="11"
        r="1"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      />
      
      {/* Nose */}
      <motion.circle
        cx="12"
        cy="13"
        r="0.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
      
      {/* Tail wagging */}
      {isActive && (
        <motion.path
          d="M17 15c2 1 3 2 2 4"
          stroke="#ff5a5f"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 20, -20, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: 1 }}
          style={{ originX: 17, originY: 15 }}
        />
      )}
    </motion.svg>
  );
}

// Smoking Policy Icon - No smoking sign
export function SmokingIcon({ className = "w-8 h-8", isActive = false }: PolicyIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ 
        scale: isActive ? [1, 1.02, 1] : 1
      }}
      transition={{ duration: 0.8, ease: "easeInOut", repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
    >
      {/* Circle background */}
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
      
      {/* Cigarette */}
      <motion.rect
        x="8"
        y="11"
        width="8"
        height="2"
        rx="1"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        fill={isActive ? "#ff5a5f" : "#6B7280"}
        fillOpacity="0.2"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      
      {/* Smoke */}
      <motion.path
        d="M16 11c0-1 1-1 1 0s-1 1-1 0M17 9c0-1 1-1 1 0s-1 1-1 0"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      
      {/* Prohibition line */}
      <motion.path
        d="M6 6l12 12"
        stroke={isActive ? "#ff5a5f" : "#6B7280"}
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      />
      
      {/* Animated smoke dissipating */}
      {isActive && (
        <motion.g>
          <motion.path
            d="M16 11c0-1 1-1 1 0s-1 1-1 0"
            stroke="#ff5a5f"
            strokeWidth="1"
            strokeOpacity="0.5"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
        </motion.g>
      )}
    </motion.svg>
  );
}

// Policy icon getter function for hotel manager
interface HotelPolicyIconProps {
  isSelected?: boolean;
  isHovered?: boolean;
  size?: number;
}

export function getPolicyIcon(policyType: string): React.ComponentType<HotelPolicyIconProps> {
  switch (policyType) {
    case 'check-in-out':
      return ({ isSelected, isHovered, size }: HotelPolicyIconProps) => (
        <CheckInOutIcon 
          className={`w-${size ? size/4 : 6} h-${size ? size/4 : 6}`} 
          isActive={isSelected || isHovered} 
        />
      );
    case 'cancellation':
      return ({ isSelected, isHovered, size }: HotelPolicyIconProps) => (
        <CancellationIcon 
          className={`w-${size ? size/4 : 6} h-${size ? size/4 : 6}`} 
          isActive={isSelected || isHovered} 
        />
      );
    case 'house-rules':
      return ({ isSelected, isHovered, size }: HotelPolicyIconProps) => (
        <HouseRulesIcon 
          className={`w-${size ? size/4 : 6} h-${size ? size/4 : 6}`} 
          isActive={isSelected || isHovered} 
        />
      );
    case 'children':
      return ({ isSelected, isHovered, size }: HotelPolicyIconProps) => (
        <ChildrenIcon 
          className={`w-${size ? size/4 : 6} h-${size ? size/4 : 6}`} 
          isActive={isSelected || isHovered} 
        />
      );
    case 'pets':
      return ({ isSelected, isHovered, size }: HotelPolicyIconProps) => (
        <PetIcon 
          className={`w-${size ? size/4 : 6} h-${size ? size/4 : 6}`} 
          isActive={isSelected || isHovered} 
        />
      );
    case 'smoking':
      return ({ isSelected, isHovered, size }: HotelPolicyIconProps) => (
        <SmokingIcon 
          className={`w-${size ? size/4 : 6} h-${size ? size/4 : 6}`} 
          isActive={isSelected || isHovered} 
        />
      );
    default:
      return ({ isSelected, isHovered, size }: HotelPolicyIconProps) => (
        <BookingTermsIcon 
          className={`w-${size ? size/4 : 6} h-${size ? size/4 : 6}`} 
          isActive={isSelected || isHovered} 
        />
      );
  }
}