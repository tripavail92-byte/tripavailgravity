import { motion } from 'motion/react';

// Identity Verification Icon
export const IdentityVerificationIcon = ({ className = "w-12 h-12", isActive = false, isCompleted = false }: { className?: string; isActive?: boolean; isCompleted?: boolean }) => {
  const strokeColor = isCompleted ? "#5FAD43" : isActive ? "#3B82F6" : "#9CA3AF";
  const fillColor = isCompleted ? "#E8F5E3" : isActive ? "#EBF4FF" : "#F9FAFB";

  return (
    <motion.svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
    >
      <motion.circle
        cx="24"
        cy="24"
        r="22"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* ID Card */}
      <motion.rect
        x="14"
        y="16"
        width="20"
        height="14"
        rx="2"
        fill="white"
        stroke={strokeColor}
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Profile Icon */}
      <motion.circle
        cx="20"
        cy="21"
        r="2"
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
      
      {/* ID Lines */}
      <motion.line
        x1="25"
        y1="19"
        x2="30"
        y2="19"
        stroke={strokeColor}
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
      />
      <motion.line
        x1="25"
        y1="22"
        x2="32"
        y2="22"
        stroke={strokeColor}
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 1.1 }}
      />
      
      {/* Check mark for completed state */}
      {isCompleted && (
        <motion.path
          d="M18 24L22 28L30 20"
          stroke="#5FAD43"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        />
      )}
    </motion.svg>
  );
};

// Business License Icon
export const BusinessLicenseIcon = ({ className = "w-12 h-12", isActive = false, isCompleted = false }: { className?: string; isActive?: boolean; isCompleted?: boolean }) => {
  const strokeColor = isCompleted ? "#5FAD43" : isActive ? "#3B82F6" : "#9CA3AF";
  const fillColor = isCompleted ? "#E8F5E3" : isActive ? "#EBF4FF" : "#F9FAFB";

  return (
    <motion.svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
    >
      <motion.circle
        cx="24"
        cy="24"
        r="22"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Document */}
      <motion.rect
        x="16"
        y="12"
        width="16"
        height="22"
        rx="2"
        fill="white"
        stroke={strokeColor}
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Ribbon */}
      <motion.path
        d="M22 12L22 18L24 16L26 18L26 12"
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
      
      {/* Document Lines */}
      <motion.line x1="19" y1="22" x2="29" y2="22" stroke={strokeColor} strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 1 }} />
      <motion.line x1="19" y1="25" x2="27" y2="25" stroke={strokeColor} strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 1.1 }} />
      <motion.line x1="19" y1="28" x2="25" y2="28" stroke={strokeColor} strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 1.2 }} />
      
      {/* Check mark for completed state */}
      {isCompleted && (
        <motion.path
          d="M18 30L22 34L30 26"
          stroke="#5FAD43"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        />
      )}
    </motion.svg>
  );
};

// Phone Verification Icon
export const PhoneVerificationIcon = ({ className = "w-12 h-12", isActive = false, isCompleted = false }: { className?: string; isActive?: boolean; isCompleted?: boolean }) => {
  const strokeColor = isCompleted ? "#5FAD43" : isActive ? "#3B82F6" : "#9CA3AF";
  const fillColor = isCompleted ? "#E8F5E3" : isActive ? "#EBF4FF" : "#F9FAFB";

  return (
    <motion.svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
    >
      <motion.circle
        cx="24"
        cy="24"
        r="22"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Phone */}
      <motion.rect
        x="18"
        y="14"
        width="12"
        height="20"
        rx="3"
        fill="white"
        stroke={strokeColor}
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Screen */}
      <motion.rect
        x="20"
        y="17"
        width="8"
        height="12"
        rx="1"
        fill={fillColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
      
      {/* Signal bars */}
      <motion.rect x="21" y="26" width="1" height="2" fill={strokeColor} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, delay: 1 }} />
      <motion.rect x="23" y="24" width="1" height="4" fill={strokeColor} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, delay: 1.1 }} />
      <motion.rect x="25" y="22" width="1" height="6" fill={strokeColor} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, delay: 1.2 }} />
      <motion.rect x="27" y="20" width="1" height="8" fill={strokeColor} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, delay: 1.3 }} />
      
      {/* Home button */}
      <motion.circle
        cx="24"
        cy="31"
        r="1"
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.9 }}
      />
      
      {/* Check mark for completed state */}
      {isCompleted && (
        <motion.path
          d="M30 18L34 22L42 14"
          stroke="#5FAD43"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        />
      )}
    </motion.svg>
  );
};

// Property Verification Icon
export const PropertyVerificationIcon = ({ className = "w-12 h-12", isActive = false, isCompleted = false }: { className?: string; isActive?: boolean; isCompleted?: boolean }) => {
  const strokeColor = isCompleted ? "#5FAD43" : isActive ? "#3B82F6" : "#9CA3AF";
  const fillColor = isCompleted ? "#E8F5E3" : isActive ? "#EBF4FF" : "#F9FAFB";

  return (
    <motion.svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
    >
      <motion.circle
        cx="24"
        cy="24"
        r="22"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Building */}
      <motion.rect
        x="16"
        y="18"
        width="16"
        height="14"
        fill="white"
        stroke={strokeColor}
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Roof */}
      <motion.path
        d="M14 18L24 12L34 18"
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
      
      {/* Windows */}
      <motion.rect x="18" y="20" width="3" height="3" fill={fillColor} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, delay: 1 }} />
      <motion.rect x="27" y="20" width="3" height="3" fill={fillColor} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, delay: 1.1 }} />
      <motion.rect x="18" y="25" width="3" height="3" fill={fillColor} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, delay: 1.2 }} />
      <motion.rect x="27" y="25" width="3" height="3" fill={fillColor} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, delay: 1.3 }} />
      
      {/* Door */}
      <motion.rect
        x="22"
        y="26"
        width="4"
        height="6"
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.9 }}
      />
      
      {/* Check mark for completed state */}
      {isCompleted && (
        <motion.path
          d="M18 28L22 32L30 24"
          stroke="#5FAD43"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        />
      )}
    </motion.svg>
  );
};

// Email Verification Icon
export const EmailVerificationIcon = ({ className = "w-12 h-12", isActive = false, isCompleted = false }: { className?: string; isActive?: boolean; isCompleted?: boolean }) => {
  const strokeColor = isCompleted ? "#5FAD43" : isActive ? "#3B82F6" : "#9CA3AF";
  const fillColor = isCompleted ? "#E8F5E3" : isActive ? "#EBF4FF" : "#F9FAFB";

  return (
    <motion.svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
    >
      <motion.circle
        cx="24"
        cy="24"
        r="22"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Email envelope */}
      <motion.rect
        x="14"
        y="18"
        width="20"
        height="14"
        rx="2"
        fill="white"
        stroke={strokeColor}
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Email flap */}
      <motion.path
        d="M14 18L24 26L34 18"
        stroke={strokeColor}
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      />
      
      {/* @ symbol */}
      <motion.circle
        cx="24"
        cy="25"
        r="3"
        stroke={strokeColor}
        strokeWidth="1"
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
      />
      <motion.circle
        cx="25"
        cy="25"
        r="1"
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      />
      
      {/* Check mark for completed state */}
      {isCompleted && (
        <motion.path
          d="M18 28L22 32L30 24"
          stroke="#5FAD43"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        />
      )}
    </motion.svg>
  );
};

// Bank Verification Icon
export const BankVerificationIcon = ({ className = "w-12 h-12", isActive = false, isCompleted = false }: { className?: string; isActive?: boolean; isCompleted?: boolean }) => {
  const strokeColor = isCompleted ? "#5FAD43" : isActive ? "#3B82F6" : "#9CA3AF";
  const fillColor = isCompleted ? "#E8F5E3" : isActive ? "#EBF4FF" : "#F9FAFB";

  return (
    <motion.svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
    >
      <motion.circle
        cx="24"
        cy="24"
        r="22"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Bank building base */}
      <motion.rect
        x="14"
        y="26"
        width="20"
        height="8"
        fill="white"
        stroke={strokeColor}
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Bank roof */}
      <motion.path
        d="M12 26L24 16L36 26"
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
      
      {/* Columns */}
      <motion.rect x="17" y="26" width="2" height="8" fill={strokeColor} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3, delay: 1 }} />
      <motion.rect x="21" y="26" width="2" height="8" fill={strokeColor} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3, delay: 1.1 }} />
      <motion.rect x="25" y="26" width="2" height="8" fill={strokeColor} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3, delay: 1.2 }} />
      <motion.rect x="29" y="26" width="2" height="8" fill={strokeColor} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3, delay: 1.3 }} />
      
      {/* Steps */}
      <motion.rect
        x="12"
        y="34"
        width="24"
        height="2"
        fill={strokeColor}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      />
      
      {/* Check mark for completed state */}
      {isCompleted && (
        <motion.path
          d="M18 20L22 24L30 16"
          stroke="#5FAD43"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        />
      )}
    </motion.svg>
  );
};