import { SVGProps } from 'react';

// Import actual logos
import jazzCashLogo from 'figma:asset/af0aec347c8e095a6ce6962eac518a8e26f04cc0.png';
import easyPaisaLogo from 'figma:asset/01633826134e72a5ae585e555c2bed826ae7b04c.png';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

// Mobile Wallet Icon - Clean wallet with phone integration
export const MobileWalletIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 9h-3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="12" r="1" fill="currentColor" />
    <path
      d="M7 9v6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M9 11v2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Credit Card Icon - Clean card with chip detail
export const CreditCardIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <rect
      x="2"
      y="6"
      width="20"
      height="12"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 10h20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <rect
      x="4"
      y="14"
      width="4"
      height="2"
      rx="0.5"
      fill="currentColor"
    />
    <path
      d="M12 14h6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// EasyPaisa Icon - Actual logo
export const EasyPaisaIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <img
    src={easyPaisaLogo}
    alt="EasyPaisa"
    width={size}
    height={size}
    className={`object-contain ${className}`}
    {...props}
  />
);

// JazzCash Icon - Actual logo
export const JazzCashIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <img
    src={jazzCashLogo}
    alt="JazzCash"
    width={size}
    height={size}
    className={`object-contain ${className}`}
    {...props}
  />
);

// Phone Payment Icon - Phone with payment indicator
export const PhonePaymentIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <rect
      x="5"
      y="2"
      width="14"
      height="20"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 18h.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 8h8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M9 11h6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="15" cy="6" r="2" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

// Bank Card Icon - More detailed card with bank elements
export const BankCardIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <rect
      x="2"
      y="5"
      width="20"
      height="14"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M2 10h20"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect
      x="4"
      y="13"
      width="3"
      height="2"
      rx="0.5"
      fill="currentColor"
    />
    <circle cx="19" cy="8" r="1.5" fill="currentColor" />
    <circle cx="16.5" cy="8" r="1.5" fill="currentColor" />
    <path
      d="M12 15h6"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

// Security Lock Icon - For security section
export const SecurityLockIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <rect
      x="3"
      y="11"
      width="18"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    <path
      d="M12 17.5V19"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Contact Icons - Clean versions for contact info
export const EmailIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M22 7l-10 5L2 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PhoneIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const AddressIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const LocationIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const CalendarIcon = ({ size = 20, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);