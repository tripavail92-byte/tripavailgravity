import React from 'react';
import { motion } from 'motion/react';

// Modern Security & Privacy Icons - Airbnb Style with Context-Rich Designs

export const ModernPasswordIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* Lock Body */}
    <rect 
      x="5" 
      y="11" 
      width="14" 
      height="10" 
      rx="3" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none"
    />
    
    {/* Lock Shackle */}
    <path 
      d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    
    {/* Key Icon Inside Lock */}
    <motion.g
      animate={{ rotate: [0, 5, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
    >
      <circle cx="12" cy="16" r="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
      <path d="M12 16v2" stroke="white" strokeWidth="1" strokeLinecap="round"/>
    </motion.g>
    
    {/* Security Dots */}
    <circle cx="9" cy="14" r="0.5" fill="currentColor" opacity="0.3"/>
    <circle cx="15" cy="14" r="0.5" fill="currentColor" opacity="0.3"/>
  </motion.svg>
);

export const ModernPhoneVerifyIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* Phone Body */}
    <rect 
      x="4" 
      y="2" 
      width="8" 
      height="15" 
      rx="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="none"
    />
    
    {/* Screen */}
    <rect x="5.5" y="4" width="5" height="8" rx="0.5" fill="currentColor" opacity="0.1"/>
    
    {/* Phone Button */}
    <circle cx="8" cy="15" r="0.5" fill="currentColor"/>
    
    {/* Verification Checkmark */}
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
    >
      <circle cx="17" cy="8" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.1"/>
      <path 
        d="M14.5 8L16.5 10L19.5 6" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </motion.g>
    
    {/* Signal Waves */}
    <motion.g
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <path d="M9 6c0.5-0.5 1.5-0.5 2 0" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
      <path d="M8.5 5c1-1 2.5-1 3.5 0" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
    </motion.g>
  </motion.svg>
);

export const ModernTwoFactorIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* Shield */}
    <path 
      d="M12 2L4 5V11C4 16 8 21 12 22C16 21 20 16 20 11V5L12 2Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none"
    />
    
    {/* Inner Shield Pattern */}
    <path 
      d="M12 4L7 6V10C7 13 9.5 16.5 12 17C14.5 16.5 17 13 17 10V6L12 4Z" 
      stroke="currentColor" 
      strokeWidth="1" 
      fill="currentColor" 
      opacity="0.1"
    />
    
    {/* Two-Factor Elements */}
    <motion.g
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <circle cx="10" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="14" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </motion.g>
    
    {/* Connection Line */}
    <path d="M10 10h4" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    
    {/* Security Code Numbers */}
    <text x="10" y="11" fontSize="3" textAnchor="middle" fill="currentColor" className="font-mono">2</text>
    <text x="14" y="11" fontSize="3" textAnchor="middle" fill="currentColor" className="font-mono">F</text>
  </motion.svg>
);

export const ModernBiometricIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* Phone Device */}
    <rect 
      x="6" 
      y="2" 
      width="12" 
      height="20" 
      rx="3" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="none"
    />
    
    {/* Screen */}
    <rect x="8" y="4" width="8" height="12" rx="1" fill="currentColor" opacity="0.05"/>
    
    {/* Face Recognition Area */}
    <motion.g
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Face Outline */}
      <ellipse cx="12" cy="10" rx="3" ry="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      
      {/* Eyes */}
      <circle cx="10.5" cy="8.5" r="0.5" fill="currentColor"/>
      <circle cx="13.5" cy="8.5" r="0.5" fill="currentColor"/>
      
      {/* Nose */}
      <path d="M12 9.5v1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      
      {/* Mouth */}
      <path d="M10.5 11.5c0.5 0.3 1 0.3 1.5 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </motion.g>
    
    {/* Scanning Lines */}
    <motion.g
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <line x1="9" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
      <line x1="9" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
    </motion.g>
    
    {/* Front Camera */}
    <circle cx="12" cy="5" r="1" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.3"/>
    
    {/* Home Indicator */}
    <rect x="10" y="19" width="4" height="1" rx="0.5" fill="currentColor" opacity="0.3"/>
  </motion.svg>
);

export const ModernSecurityEmailIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* Email Envelope */}
    <rect 
      x="2" 
      y="4" 
      width="20" 
      height="16" 
      rx="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="none"
    />
    
    {/* Email Content Lines */}
    <line x1="4" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
    <line x1="4" y1="10" x2="9" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
    
    {/* Email Fold */}
    <path 
      d="M22 7L13.03 12.7A2 2 0 0 1 10.97 12.7L2 7" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Security Shield Badge */}
    <motion.g
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
    >
      <circle cx="18" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.1"/>
      <path 
        d="M18 4L15 6V9C15 10.5 16.5 12 18 12C19.5 12 21 10.5 21 9V6L18 4Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
      />
    </motion.g>
  </motion.svg>
);

export const ModernLoginAlertsIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* Notification Bell */}
    <path 
      d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    
    {/* Bell Clapper */}
    <path 
      d="M13.73 21a2 2 0 01-3.46 0" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Login User Icon */}
    <motion.g
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.2"/>
      <path d="M9 13c0-1.5 1.5-2 3-2s3 0.5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </motion.g>
    
    {/* Alert Indicator */}
    <motion.circle 
      cx="19" 
      cy="5" 
      r="3" 
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      opacity="0.1"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    
    {/* Exclamation Mark */}
    <text x="19" y="6.5" fontSize="4" textAnchor="middle" fill="currentColor" className="font-bold">!</text>
  </motion.svg>
);

export const ModernDeviceTrackingIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* Main Device (Laptop) */}
    <rect x="2" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="6" y="18" width="6" height="1" rx="0.5" fill="currentColor"/>
    
    {/* Screen */}
    <rect x="3.5" y="9.5" width="11" height="6" rx="0.5" fill="currentColor" opacity="0.1"/>
    
    {/* Mobile Device */}
    <rect x="18" y="4" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="18.5" y="5" width="3" height="4.5" rx="0.3" fill="currentColor" opacity="0.1"/>
    <circle cx="20" cy="10" r="0.3" fill="currentColor"/>
    
    {/* Tracking Radar Waves */}
    <motion.g
      animate={{ opacity: [0.2, 0.8, 0.2] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <circle cx="9" cy="13" r="3" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
      <circle cx="9" cy="13" r="5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.2"/>
    </motion.g>
    
    {/* Central Tracking Point */}
    <motion.circle 
      cx="9" 
      cy="13" 
      r="1" 
      fill="currentColor"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    
    {/* Connection Lines */}
    <motion.path 
      d="M16 11l2 0" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeDasharray="2,2"
      animate={{ strokeDashoffset: [0, 4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  </motion.svg>
);

export const ModernSessionTimeoutIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* Clock Face */}
    <circle 
      cx="12" 
      cy="12" 
      r="9" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="none"
    />
    
    {/* Clock Numbers */}
    <circle cx="12" cy="5" r="0.5" fill="currentColor" opacity="0.4"/>
    <circle cx="19" cy="12" r="0.5" fill="currentColor" opacity="0.4"/>
    <circle cx="12" cy="19" r="0.5" fill="currentColor" opacity="0.4"/>
    <circle cx="5" cy="12" r="0.5" fill="currentColor" opacity="0.4"/>
    
    {/* Clock Hands */}
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      style={{ originX: "12px", originY: "12px" }}
    >
      <path d="M12 12V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </motion.g>
    
    <motion.g
      animate={{ rotate: 30 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      style={{ originX: "12px", originY: "12px" }}
    >
      <path d="M12 12V9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </motion.g>
    
    {/* Center Dot */}
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    
    {/* Timeout Indicator */}
    <motion.circle 
      cx="12" 
      cy="12" 
      r="6" 
      stroke="currentColor" 
      strokeWidth="1" 
      fill="none"
      opacity="0.3"
      strokeDasharray="37.7"
      animate={{ strokeDashoffset: [0, 37.7] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
    
    {/* Lock Icon (small) */}
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2, duration: 0.5 }}
    >
      <rect x="17" y="16" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.2"/>
      <path d="M18 16v-1c0-0.5 0.5-1 1-1s1 0.5 1 1v1" stroke="currentColor" strokeWidth="1" fill="none"/>
    </motion.g>
  </motion.svg>
);

// Danger Zone Icons
export const ModernSignOutAllIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* Multiple Devices */}
    <rect x="2" y="6" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="14" y="3" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="16" y="15" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    
    {/* Screens */}
    <rect x="3" y="7" width="8" height="4" rx="0.3" fill="currentColor" opacity="0.1"/>
    <rect x="15" y="4.5" width="4" height="6" rx="0.3" fill="currentColor" opacity="0.1"/>
    <rect x="16.5" y="16" width="1" height="3" rx="0.3" fill="currentColor" opacity="0.1"/>
    
    {/* Sign Out Arrow */}
    <motion.g
      animate={{ x: [0, 3, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <path d="M5 16l4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 14l2 2l-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </motion.g>
    
    {/* Warning Indicators */}
    <motion.circle 
      cx="18" 
      cy="2" 
      r="2" 
      stroke="currentColor"
      strokeWidth="1"
      fill="currentColor"
      opacity="0.2"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  </motion.svg>
);

export const ModernDeleteDataIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* Database Shape */}
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="2"/>
    
    {/* Data Blocks */}
    <rect x="6" y="7" width="3" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="10" y="7" width="4" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="6" y="9" width="2" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="10" y="9" width="5" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
    
    {/* Delete X */}
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <circle cx="17" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.1"/>
      <line x1="15" y1="6" x2="19" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="19" y1="6" x2="15" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </motion.g>
    
    {/* Data Corruption Effect */}
    <motion.g
      animate={{ opacity: [0.8, 0.3, 0.8] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <rect x="6" y="14" width="1" height="1" rx="0.5" fill="currentColor" opacity="0.3"/>
      <rect x="8" y="15" width="2" height="1" rx="0.5" fill="currentColor" opacity="0.3"/>
      <rect x="12" y="14" width="1" height="1" rx="0.5" fill="currentColor" opacity="0.3"/>
    </motion.g>
  </motion.svg>
);

export const ModernDeleteAccountIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    {/* User Profile */}
    <circle cx="8" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M2 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    
    {/* User Details */}
    <circle cx="8" cy="7" r="2" fill="currentColor" opacity="0.2"/>
    
    {/* Delete X - Large and Prominent */}
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
    >
      <circle cx="18" cy="8" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.1"/>
      <motion.g
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ originX: "18px", originY: "8px" }}
      >
        <line x1="15.5" y1="5.5" x2="20.5" y2="10.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="20.5" y1="5.5" x2="15.5" y2="10.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </motion.g>
    </motion.g>
    
    {/* Warning Indicators */}
    <motion.g
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <path d="M4 19l1-1M10 19l1-1M6 21l1-1" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    </motion.g>
  </motion.svg>
);