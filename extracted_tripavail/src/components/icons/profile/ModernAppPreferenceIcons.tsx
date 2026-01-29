import React from 'react';

// App Preferences Overview Icon
export const ModernAppPreferencesIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="10" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

// Appearance & Accessibility Icons
export const ModernDarkModeIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M9 10h6M9 14h4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernHighContrastIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M12 2v20"
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M2 12h20"
      stroke="currentColor" 
      strokeWidth="2"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="4" 
      fill="currentColor"
    />
  </svg>
);

export const ModernReducedMotionIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M8 9l3 3M16 15l-3-3" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernLargeTextIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M4 7V4h16v3M9 20h6M12 4v16"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <rect 
      x="2" 
      y="2" 
      width="20" 
      height="20" 
      rx="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.05"
    />
    <path 
      d="M8 12h8M10 16h4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Audio & Haptics Icons
export const ModernSoundEffectsIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <polygon 
      points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="18" 
      cy="6" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

export const ModernHapticFeedbackIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <rect 
      x="5" 
      y="2" 
      width="14" 
      height="20" 
      rx="2" 
      ry="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M12 6v6l4 2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M8 16h8M10 18h4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernVolumeLevelIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <polygon 
      points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M15.54 8.46a5 5 0 0 1 0 7.07" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <rect 
      x="16" 
      y="10" 
      width="6" 
      height="4" 
      rx="1" 
      fill="currentColor"
    />
  </svg>
);

// Data & Sync Icons
export const ModernAutoSyncIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M12 2v6l3-3M12 2l-3 3M12 22v-6l3 3M12 22l-3-3"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="8" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M8 12l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernOfflineModeIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <rect 
      x="2" 
      y="3" 
      width="20" 
      height="14" 
      rx="2" 
      ry="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M8 21h8M12 17v4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M8 9h8M8 13h6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <circle 
      cx="18" 
      cy="7" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

export const ModernWiFiOnlyIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M1 9l3 3 3-3a4 4 0 0 1 6 0l3 3 3-3a10 10 0 0 0-18 0z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M5 12.55a4 4 0 0 1 6 0M8.53 16.11a2 2 0 0 1 2.94 0" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="12" 
      cy="20" 
      r="1" 
      fill="currentColor"
    />
    <path 
      d="M16 8l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernBackgroundRefreshIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M23 4v6h-6M1 20v-6h6"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
  </svg>
);

export const ModernAutoDownloadMapsIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="10" 
      r="3" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M8 14l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Language & Region Icons
export const ModernLanguageIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M8 8h8M8 16h8" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernCurrencyIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <rect 
      x="1" 
      y="4" 
      width="22" 
      height="16" 
      rx="2" 
      ry="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M1 10h22" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M12 8v8M10 10h4M10 14h4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernDateFormatIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <rect 
      x="3" 
      y="4" 
      width="18" 
      height="18" 
      rx="2" 
      ry="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M16 2v4M8 2v4M3 10h18" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernTimeFormatIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="12,6 12,12 16,14" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M18 6h2M18 18h2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Performance Icons
export const ModernImageQualityIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="13" 
      r="4" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M9 16l2-2 4 4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernAnimationSpeedIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M8 6l4 4M16 18l-4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernBatteryOptimizationIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <rect 
      x="2" 
      y="6" 
      width="18" 
      height="12" 
      rx="2" 
      ry="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M22 10v4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M6 10h8M6 14h6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M15 10l2 2-2 2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernDataCompressionIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="7,10 12,15 17,10" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 15V3M8 7h8" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Storage Management Icons
export const ModernStorageIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <ellipse 
      cx="12" 
      cy="5" 
      rx="9" 
      ry="3" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M8 12h8M10 16h4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernClearCacheIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <polyline 
      points="3,6 5,6 21,6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M10 11v6M14 11v6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernResetDefaultsIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M23 4v6h-6M1 20v-6h6"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);