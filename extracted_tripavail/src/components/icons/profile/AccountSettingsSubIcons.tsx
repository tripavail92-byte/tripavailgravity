import React from 'react';

// Security & Privacy Sub-Icons
export const PasswordIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M6 10V8C6 5.79086 7.79086 4 10 4H14C16.2091 4 18 5.79086 18 8V10M6 10H4C3.44772 10 3 10.4477 3 11V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V11C21 10.4477 20.5523 10 20 10H18M6 10H18" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="12" cy="15" r="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const PhoneVerifyIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="2" width="8" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 18v0M14 6l2 2l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TwoFactorIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const BiometricIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM12 6.5C14.5 6.5 16.5 8.5 16.5 11V13.5C16.5 16 14.5 18 12 18S7.5 16 7.5 13.5V11C7.5 8.5 9.5 6.5 12 6.5Z" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path d="M9 11H15M9 13H15M10 15H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SecurityEmailIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M22 7L13.03 12.7A2 2 0 0 1 10.97 12.7L2 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="18" cy="8" r="3" fill="currentColor"/>
  </svg>
);

export const LoginAlertsIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 17v0M13 8.5l1.5 1.5l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 12v3a2 2 0 01-2 2h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const DeviceTrackingIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const SessionTimeoutIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 2v4M8 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Account Information Sub-Icons
export const ProfileImageIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="16" cy="6" r="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const ContactEmailIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M22 7L13.03 12.7A2 2 0 0 1 10.97 12.7L2 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ContactPhoneIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LocationInfoIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const BirthdateIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const NationalityIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const LanguageIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const CurrencyIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Notifications Sub-Icons
export const EmailNotificationIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M22 7L13.03 12.7A2 2 0 0 1 10.97 12.7L2 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="5" r="2" fill="currentColor"/>
  </svg>
);

export const PushNotificationIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="5" r="2" fill="currentColor"/>
  </svg>
);

export const BookingNotificationIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
    <circle cx="16" cy="16" r="2" fill="currentColor"/>
  </svg>
);

export const MarketingNotificationIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 11l19-9-9 19-2-8-8-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 13l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Privacy Controls Sub-Icons
export const ProfileVisibilityIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const DataSharingIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const LocationTrackingIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 2v2M12 8v2M12 14v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const AnalyticsPrivacyIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// App Preferences Sub-Icons
export const ThemeIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const LanguagePreferenceIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14.5 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const AutoplayIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polygon points="5,3 19,12 5,21" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
    <circle cx="19" cy="12" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

export const AccessibilityIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M10.5 8.5l3 0M8 13l8 0M10 18l4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 8v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 16l8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Danger Zone Icons
export const SignOutAllIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="5" r="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const DeleteDataIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="2"/>
    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const DeleteAccountIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "text-gray-900 dark:text-white" 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <line x1="18" y1="8" x2="23" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="23" y1="8" x2="18" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);