// Core Types for TripAvail Application

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'traveler' | 'hotel_manager' | 'tour_operator';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hotel {
  id: string;
  title: string;
  location: string;
  image: string;
  rating: number;
  price: string;
  type: 'hotel';
  description?: string;
  amenities?: string[];
  operatorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tour {
  id: string;
  title: string;
  location: string;
  image: string;
  rating: number;
  price: string;
  type: 'tour';
  description?: string;
  duration?: string;
  maxGroupSize?: number;
  operatorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ListingItem = Hotel | Tour;

export interface SearchFilters {
  query: string;
  category: 'all' | 'hotels' | 'tours';
  priceRange?: [number, number];
  rating?: number;
  location?: string;
}

export interface AppState {
  user: User | null;
  partnerMode: 'hotel_manager' | 'tour_operator' | null;
  currentView: string;
  isLoading: boolean;
  error: string | null;
}

export interface NavigationTab {
  id: string;
  label: string;
  icon: React.ComponentType;
  badge?: number;
}

export interface SliderImage {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Form Types
export interface ContactForm {
  name: string;
  email: string;
  message: string;
  subject: string;
}

export interface SearchFormData {
  destination: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  category: 'hotels' | 'tours';
}

// User Role Types
export type UserRole = 'traveler' | 'hotel_manager' | 'tour_operator';
export type PartnerMode = 'hotel_manager' | 'tour_operator' | null;

// Role Permissions
export interface RolePermissions {
  canPostPackages: boolean;
  canManageBookings: boolean;
  canAccessDashboard: boolean;
  canManageCalendar: boolean;
  canViewReviews: boolean;
  canAccessVerification: boolean;
  requiredVerification: boolean;
}

// App View Types
export type AppView = 
  | 'home' 
  | 'partner-selection' 
  | 'dashboard' 
  | 'calendar' 
  | 'bookings' 
  | 'reviews' 
  | 'verification' 
  | 'settings'
  | 'hotel-onboarding';