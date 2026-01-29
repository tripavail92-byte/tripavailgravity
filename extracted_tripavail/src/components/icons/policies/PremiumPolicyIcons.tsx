import { motion } from 'motion/react';

interface PolicyIconProps {
  size?: number;
  isSelected?: boolean;
  isHovered?: boolean;
}

// Cancellation Policy Icon
export function CancellationPolicyIcon({ size = 24, isSelected = false, isHovered = false }: PolicyIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Calendar */}
      <motion.rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        stroke="#000000"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Calendar header */}
      <motion.line
        x1="4"
        y1="9"
        x2="20"
        y2="9"
        stroke="#000000"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      />
      
      {/* X mark */}
      <motion.line
        x1="9"
        y1="13"
        x2="15"
        y2="17"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      />
      <motion.line
        x1="15"
        y1="13"
        x2="9"
        y2="17"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />
    </motion.svg>
  );
}

// House Rules Icon
export function HouseRulesIcon({ size = 24, isSelected = false, isHovered = false }: PolicyIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Document */}
      <motion.rect
        x="6"
        y="3"
        width="12"
        height="18"
        rx="1.5"
        stroke="#000000"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Lines */}
      <motion.line x1="9" y1="8" x2="15" y2="8" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.3 }} />
      <motion.line x1="9" y1="11" x2="15" y2="11" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.3 }} />
      <motion.line x1="9" y1="14" x2="13" y2="14" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.3 }} />
      <motion.line x1="9" y1="17" x2="14" y2="17" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.3 }} />
    </motion.svg>
  );
}

// Children Policy Icon
export function ChildrenPolicyIcon({ size = 24, isSelected = false, isHovered = false }: PolicyIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Child figure - head */}
      <motion.circle
        cx="12"
        cy="8"
        r="2.5"
        stroke="#000000"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
      
      {/* Child figure - body */}
      <motion.path
        d="M12 10.5 L12 16 M9 13 L15 13 M10 16 L10 20 M14 16 L14 20"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
      
      {/* Checkmark or badge */}
      <motion.circle
        cx="17"
        cy="7"
        r="3"
        stroke="#000000"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
      />
      <motion.path
        d="M15.5 7 L16.5 8 L18.5 6"
        stroke="#000000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      />
    </motion.svg>
  );
}

// Pet Policy Icon
export function PetPolicyIcon({ size = 24, isSelected = false, isHovered = false }: PolicyIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Paw print */}
      {/* Main pad */}
      <motion.ellipse
        cx="12"
        cy="15"
        rx="3"
        ry="4"
        stroke="#000000"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Toe pads */}
      <motion.ellipse cx="8" cy="10" rx="1.8" ry="2.2" stroke="#000000" strokeWidth="1.8" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
      <motion.ellipse cx="12" cy="8" rx="1.8" ry="2.2" stroke="#000000" strokeWidth="1.8" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
      <motion.ellipse cx="16" cy="10" rx="1.8" ry="2.2" stroke="#000000" strokeWidth="1.8" fill="none"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} />
    </motion.svg>
  );
}

// Smoking Policy Icon
export function SmokingPolicyIcon({ size = 24, isSelected = false, isHovered = false }: PolicyIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cigarette */}
      <motion.rect
        x="5"
        y="12"
        width="10"
        height="3"
        rx="1"
        stroke="#000000"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Filter tip */}
      <motion.line
        x1="7"
        y1="12"
        x2="7"
        y2="15"
        stroke="#000000"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      />
      
      {/* Smoke waves */}
      <motion.path
        d="M16 11 Q17 9 18 11 Q19 13 20 11"
        stroke="#000000"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: isHovered ? 1 : 0.6 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      />
      
      {/* No smoking circle */}
      <motion.circle
        cx="12"
        cy="13.5"
        r="9"
        stroke="#000000"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      />
      
      {/* Diagonal line */}
      <motion.line
        x1="6"
        y1="7"
        x2="18"
        y2="20"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      />
    </motion.svg>
  );
}

// Check-in Check-out Icon
export function CheckInOutIcon({ size = 24, isSelected = false, isHovered = false }: PolicyIconProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Clock */}
      <motion.circle
        cx="12"
        cy="12"
        r="8"
        stroke="#000000"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Clock hands */}
      <motion.line
        x1="12"
        y1="12"
        x2="12"
        y2="7"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      />
      <motion.line
        x1="12"
        y1="12"
        x2="16"
        y2="12"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      />
      
      {/* Center dot */}
      <motion.circle
        cx="12"
        cy="12"
        r="1.5"
        fill="#000000"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
      />
    </motion.svg>
  );
}

// Export function to get policy icon by ID
export function getPremiumPolicyIcon(policyId: string) {
  const iconMap: Record<string, React.ComponentType<PolicyIconProps>> = {
    'check-in-out': CheckInOutIcon,
    'cancellation': CancellationPolicyIcon,
    'house-rules': HouseRulesIcon,
    'children': ChildrenPolicyIcon,
    'pets': PetPolicyIcon,
    'smoking': SmokingPolicyIcon,
  };

  return iconMap[policyId] || CheckInOutIcon;
}
