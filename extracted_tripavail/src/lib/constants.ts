import type { UserRole, RolePermissions, AppView } from './types';

// Application Constants

export const APP_NAME = 'TripAvail';

// Navigation Tabs
export const NAVIGATION_TABS = {
  HOME: 'home',
  HOTELS: 'hotels',
  TOURS: 'tours',
  MESSAGES: 'messages',
  PROFILE: 'profile',
} as const;

// User Roles
export const USER_ROLES = {
  TRAVELER: 'traveler',
  HOTEL_MANAGER: 'hotel_manager',
  TOUR_OPERATOR: 'tour_operator',
} as const;

// App Views
export const APP_VIEWS = {
  HOME: 'home',
  PARTNER_SELECTION: 'partner-selection',
  DASHBOARD: 'dashboard',
  CALENDAR: 'calendar',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  VERIFICATION: 'verification',
  SETTINGS: 'settings',
  HOTEL_ONBOARDING: 'hotel-onboarding',
} as const;

// Role Permissions Matrix
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  traveler: {
    canPostPackages: false,
    canManageBookings: false,
    canAccessDashboard: false,
    canManageCalendar: false,
    canViewReviews: false,
    canAccessVerification: false,
    requiredVerification: false,
  },
  hotel_manager: {
    canPostPackages: true,
    canManageBookings: true,
    canAccessDashboard: true,
    canManageCalendar: true,
    canViewReviews: true,
    canAccessVerification: true,
    requiredVerification: true,
  },
  tour_operator: {
    canPostPackages: true,
    canManageBookings: true,
    canAccessDashboard: true,
    canManageCalendar: true,
    canViewReviews: true,
    canAccessVerification: true,
    requiredVerification: true,
  },
};

// Menu Items Configuration
export const MENU_ITEMS = {
  traveler: [
    { id: 'settings', label: 'Account Settings', iconType: 'settings' as keyof typeof ICON_COLOR_MAP, view: 'settings' as AppView },
    { id: 'bookings', label: 'My Bookings', iconType: 'bookings' as keyof typeof ICON_COLOR_MAP, view: 'bookings' as AppView },
  ],
  hotel_manager: [
    { id: 'dashboard', label: 'Dashboard', iconType: 'dashboard' as keyof typeof ICON_COLOR_MAP, view: 'dashboard' as AppView, badge: '3 live • 1 draft' },
    { id: 'calendar', label: 'Calendar & Availability', iconType: 'calendar' as keyof typeof ICON_COLOR_MAP, view: 'calendar' as AppView },
    { id: 'bookings', label: 'Bookings (Hotels)', iconType: 'bookings' as keyof typeof ICON_COLOR_MAP, view: 'bookings' as AppView },
    { id: 'reviews', label: 'Reviews (Hotels)', iconType: 'reviews' as keyof typeof ICON_COLOR_MAP, view: 'reviews' as AppView },
    { id: 'verification', label: 'Verification', iconType: 'verification' as keyof typeof ICON_COLOR_MAP, view: 'verification' as AppView },
    { id: 'settings', label: 'Account Settings', iconType: 'settings' as keyof typeof ICON_COLOR_MAP, view: 'settings' as AppView },
  ],
  tour_operator: [
    { id: 'dashboard', label: 'Dashboard', iconType: 'dashboard' as keyof typeof ICON_COLOR_MAP, view: 'dashboard' as AppView, badge: '5 live • 2 draft' },
    { id: 'calendar', label: 'Calendar & Availability', iconType: 'calendar' as keyof typeof ICON_COLOR_MAP, view: 'calendar' as AppView },
    { id: 'bookings', label: 'Bookings (Tours)', iconType: 'bookings' as keyof typeof ICON_COLOR_MAP, view: 'bookings' as AppView },
    { id: 'reviews', label: 'Reviews (Tours)', iconType: 'reviews' as keyof typeof ICON_COLOR_MAP, view: 'reviews' as AppView },
    { id: 'verification', label: 'Verification', iconType: 'verification' as keyof typeof ICON_COLOR_MAP, view: 'verification' as AppView },
    { id: 'settings', label: 'Account Settings', iconType: 'settings' as keyof typeof ICON_COLOR_MAP, view: 'settings' as AppView },
  ],
};

// Brand Colors
export const BRAND_COLORS = {
  PRIMARY: '#E11D48',         // TripAvail rose 600
  SECONDARY: '#ff5a5f',       // TripAvail red
  WHITE: '#ffffff',
  GRAY_50: '#f9fafb',
  GRAY_100: '#f3f4f6',
  GRAY_600: '#4b5563',
  GRAY_900: '#111827',
} as const;

// Icon Color Palette - TripAvail brand colors for selected states
export const ICON_COLORS = {
  PRIMARY: '#E11D48',       // TripAvail rose 600
  SECONDARY: '#ff5a5f',     // TripAvail red
  TERTIARY: '#BE123C',      // Rose 700 for darker elements
  ACCENT: '#e74c3c',        // Darker red
  DEFAULT: '#6b7280',       // Default gray for unselected state
  HOVER: '#4b5563',         // Darker gray for hover state
} as const;

// Icon Color Assignments - Maps different icon types to TripAvail colors
export const ICON_COLOR_MAP = {
  'home': ICON_COLORS.PRIMARY,
  'hotels': ICON_COLORS.SECONDARY,
  'tours': ICON_COLORS.TERTIARY,
  'messages': ICON_COLORS.ACCENT,
  'profile': ICON_COLORS.PRIMARY,
  'settings': ICON_COLORS.TERTIARY,
  'calendar': ICON_COLORS.SECONDARY,
  'bookings': ICON_COLORS.TERTIARY,
  'dashboard': ICON_COLORS.PRIMARY,
  'reviews': ICON_COLORS.SECONDARY,
  'verification': ICON_COLORS.ACCENT,
  'plan-trip': ICON_COLORS.PRIMARY,
  'help': ICON_COLORS.TERTIARY,
  'legal': ICON_COLORS.ACCENT,
} as const;

// API Endpoints (Mock for now)
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  HOTELS: '/api/hotels',
  TOURS: '/api/tours',
  BOOKINGS: '/api/bookings',
  ANALYTICS: '/api/analytics',
  REVIEWS: '/api/reviews',
} as const;

// Animation Timings
export const ANIMATIONS = {
  SPLASH_DURATION: 2500,
  MENU_TRANSITION: 300,
  PAGE_TRANSITION: 400,
  CARD_HOVER: 200,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'tripavail_user',
  PARTNER_MODE: 'tripavail_partner_mode',
  ACTIVE_TAB: 'tripavail_active_tab',
  ONBOARDING_COMPLETE: 'tripavail_onboarding_complete',
} as const;

// Breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// Rating Stars
export const RATING_STARS = 5;
// Default Page Size
export const DEFAULT_PAGE_SIZE = 12;
// Search Debounce Time
export const SEARCH_DEBOUNCE_MS = 300;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  GENERIC: 'Something went wrong. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CONTACT_SENT: 'Your message has been sent successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  BOOKING_CONFIRMED: 'Your booking has been confirmed!',
} as const;

// Partner Modes
export const PARTNER_MODES = {
  HOTEL_MANAGER: 'hotel_manager',
  TOUR_OPERATOR: 'tour_operator',
} as const;

// Package Status Options
export const PACKAGE_STATUS = {
  DRAFT: 'draft',
  LIVE: 'live',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
} as const;

// Booking Status Options
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

// Payment Status Options
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Verification Status Options
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;