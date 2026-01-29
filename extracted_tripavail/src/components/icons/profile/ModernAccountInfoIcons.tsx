import React from 'react';

// Account Information Overview Icon
export const ModernAccountInfoIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      strokeLinecap="round" 
      strokeLinejoin="round"
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
    <path 
      d="M8 14h8M10 18h4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Profile Image Icon
export const ModernProfileImageIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      cy="10" 
      r="3" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M7 20.662C8.9 18.2 10.4 17 12 17s3.1 1.2 5 3.662"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M15 8l2-2M17 6l2-2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Contact Information Icons
export const ModernContactEmailIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="22,6 12,13 2,6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="18" 
      cy="8" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

export const ModernContactPhoneIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M15 4h6M18 1v6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export const ModernLocationInfoIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M16 6h4M18 4v4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Personal Details Icons
export const ModernBirthdateIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M12 14l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernNationalityIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M4 22v-7" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="18" 
      cy="8" 
      r="2" 
      fill="currentColor"
    />
  </svg>
);

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
    <path 
      d="M5 8l6 6M4 14l5-5 6-1m-2 9l-3-7 3-7M13 12l3 7-6-1" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
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
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" 
      stroke="currentColor" 
      strokeWidth="2"
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
    <path 
      d="M12 1v6m0 10v6m8-9a8 8 0 1 1-16 0 8 8 0 0 1 16 0z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M15 9.4c0-.8-.8-1.4-2-1.4h-2c-1.2 0-2 .6-2 1.4s.8 1.4 2 1.4h2c1.2 0 2 .6 2 1.4s-.8 1.4-2 1.4h-2c-1.2 0-2-.6-2-1.4"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Verification Status Icons
export const ModernEmailVerificationIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="22,6 12,13 2,6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 11l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernPhoneVerificationIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M12 18h.01M8 6h8" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
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

export const ModernIdentityVerificationIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
    <circle 
      cx="8" 
      cy="9" 
      r="2" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M14 8h4M14 12h4M6 19v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M16 19l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Profile Stats Icons
export const ModernTripsIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <polyline 
      points="3.27,6.96 12,12.01 20.73,6.96" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 22.08V12" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ModernPointsIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"
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
      r="3" 
      fill="currentColor"
    />
  </svg>
);

export const ModernMemberSinceIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M9 2h6M12 2v4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Edit Profile Icon
export const ModernEditProfileIcon: React.FC<{ size?: number; className?: string }> = ({ 
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
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);