import React from 'react';

// Privacy Score Overview Icon
export const ModernPrivacyScoreIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M9 12l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Profile Privacy Icons
export const ModernProfileVisibilityIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="3" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
    />
  </svg>
);

export const ModernRealNameIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="7" 
      r="4" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <rect 
      x="8" 
      y="19" 
      width="8" 
      height="2" 
      rx="1" 
      fill="currentColor"
    />
  </svg>
);

export const ModernLocationIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      fill="currentColor"
    />
  </svg>
);

export const ModernTravelHistoryIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
    <circle 
      cx="6" 
      cy="8" 
      r="2" 
      fill="currentColor"
    />
    <circle 
      cx="18" 
      cy="16" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

export const ModernPublicReviewsIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="14,2 14,8 20,8" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M8 13h8M8 17h8M8 9h2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Data Collection Icons
export const ModernLocationTrackingIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M12 13.5L8.5 17M12 13.5L15.5 17" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernAnalyticsDataIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M3 3v18h18"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M18.7 8a2.5 2.5 0 0 0-3.4-3.4l-6.3 6.3a2.5 2.5 0 0 0-3.4 3.4l6.3-6.3z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="7" 
      cy="17" 
      r="2" 
      fill="currentColor"
    />
    <circle 
      cx="17" 
      cy="7" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

export const ModernCrashReportsIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M12 9v4M12 17h.01" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernPersonalizedAdsIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
    <circle 
      cx="12" 
      cy="12" 
      r="6" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

export const ModernPartnerDataSharingIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="16,6 12,2 8,6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 2v15M8 14l4 4 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Social Privacy Icons
export const ModernFriendRequestsIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="9" 
      cy="7" 
      r="4" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M19 8h6M22 5v6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernActivityVisibilityIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="3" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernTravelStatusSharingIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M8 14l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernPhotoTaggingIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M16 6h2M10 17l2-2 4 4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Cookies & Tracking Icons
export const ModernEssentialCookiesIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
    <circle 
      cx="12" 
      cy="12" 
      r="2" 
      fill="currentColor"
    />
    <circle 
      cx="7" 
      cy="8" 
      r="1" 
      fill="currentColor"
    />
    <circle 
      cx="17" 
      cy="16" 
      r="1" 
      fill="currentColor"
    />
    <circle 
      cx="8" 
      cy="16" 
      r="1" 
      fill="currentColor"
    />
    <circle 
      cx="16" 
      cy="8" 
      r="1" 
      fill="currentColor"
    />
  </svg>
);

export const ModernFunctionalCookiesIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      r="3" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernAnalyticsTrackingIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M3 3v18h18"
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M7 16l4-4 4 4 4-4"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle 
      cx="7" 
      cy="16" 
      r="2" 
      fill="currentColor"
    />
    <circle 
      cx="11" 
      cy="12" 
      r="2" 
      fill="currentColor"
    />
    <circle 
      cx="15" 
      cy="16" 
      r="2" 
      fill="currentColor"
    />
    <circle 
      cx="19" 
      cy="12" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

export const ModernAdvertisingTrackingIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
    <circle 
      cx="12" 
      cy="12" 
      r="6" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="2" 
      fill="currentColor"
    />
    <path 
      d="M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round"
    />
  </svg>
);

// Data Rights Icons
export const ModernDataDownloadIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M12 15V3" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernDataDeletionIcon: React.FC<{ size?: number; className?: string }> = ({ 
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