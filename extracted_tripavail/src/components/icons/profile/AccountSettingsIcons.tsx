import { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

// Security & Privacy Icon - Shield with lock
export const SecurityIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`text-black dark:text-gray-300 ${className}`}
    {...props}
  >
    <path
      d="M12 2L3 7v4c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <rect
      x="9"
      y="10"
      width="6"
      height="4"
      rx="1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="12"
      cy="8.5"
      r="1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M12 8.5v1.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Account Information Icon - User with info badge
export const AccountInfoIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`text-black dark:text-gray-300 ${className}`}
    {...props}
  >
    <circle
      cx="12"
      cy="8"
      r="4"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="18"
      cy="6"
      r="3"
      fill="currentColor"
    />
    <path
      d="M18 4.5v2m0 1h.01"
      stroke="white"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

// Notifications Icon - Bell with indicator
export const NotificationsIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`text-black dark:text-gray-300 ${className}`}
    {...props}
  >
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="19"
      cy="5"
      r="2.5"
      fill="currentColor"
    />
  </svg>
);

// Privacy Controls Icon - Eye with shield
export const PrivacyIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`text-black dark:text-gray-300 ${className}`}
    {...props}
  >
    <path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M19 7l1.5-1.5c.4-.4.4-1 0-1.4l-.6-.6c-.4-.4-1-.4-1.4 0L17 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M16 6l3 3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// App Preferences Icon - Sliders with customization elements
export const AppPreferencesIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`text-black dark:text-gray-300 ${className}`}
    {...props}
  >
    <line
      x1="4"
      y1="21"
      x2="4"
      y2="14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="4"
      y1="10"
      x2="4"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="21"
      x2="12"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="8"
      x2="12"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="20"
      y1="21"
      x2="20"
      y2="16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="20"
      y1="12"
      x2="20"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <rect
      x="2"
      y="10"
      width="4"
      height="4"
      rx="1"
      fill="currentColor"
    />
    <rect
      x="10"
      y="8"
      width="4"
      height="4"
      rx="1"
      fill="currentColor"
    />
    <rect
      x="18"
      y="12"
      width="4"
      height="4"
      rx="1"
      fill="currentColor"
    />
  </svg>
);

// Support/Help Icon - Question mark in circle
export const SupportIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`text-black dark:text-gray-300 ${className}`}
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="17"
      r="1"
      fill="currentColor"
    />
  </svg>
);

// Warning Icon - Triangle with exclamation mark (for Action Required)
export const WarningIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`text-red-600 dark:text-red-400 ${className}`}
    {...props}
  >
    <path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="12"
      y1="9"
      x2="12"
      y2="13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle
      cx="12"
      cy="17"
      r="1"
      fill="currentColor"
    />
  </svg>
);