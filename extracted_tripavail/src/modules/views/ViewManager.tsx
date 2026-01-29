import { lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import type { AppView, UserRole, PartnerMode } from '../../lib/types';
import { APP_VIEWS } from '../../lib/constants';

// Lazy load components for better performance
const HomeFeature = lazy(() => import('../../features/home/HomeFeature').then(m => ({ default: m.HomeFeature })));
const HotelsFeature = lazy(() => import('../../features/hotels/HotelsFeature').then(m => ({ default: m.HotelsFeature })));
const ToursFeature = lazy(() => import('../../features/tours/ToursFeature').then(m => ({ default: m.ToursFeature })));
const MessagesFeature = lazy(() => import('../../features/messages/MessagesFeature').then(m => ({ default: m.MessagesFeature })));
const CalendarFeature = lazy(() => import('../../features/calendar/CalendarFeature').then(m => ({ default: m.CalendarFeature })));
const BookingsFeature = lazy(() => import('../../features/bookings/BookingsFeature').then(m => ({ default: m.BookingsFeature })));
const ReviewsFeature = lazy(() => import('../../features/reviews/ReviewsFeature').then(m => ({ default: m.ReviewsFeature })));
const VerificationFeature = lazy(() => import('../../features/verification/VerificationFeature').then(m => ({ default: m.VerificationFeature })));
const HotelOnboardingFeature = lazy(() => import('../../features/onboarding/HotelOnboardingFeature').then(m => ({ default: m.HotelOnboardingFeature })));
const HotelManagerDashboard = lazy(() => import('../../features/dashboard/HotelManagerDashboard').then(m => ({ default: m.HotelManagerDashboard })));
const TourOperatorDashboard = lazy(() => import('../../features/dashboard/TourOperatorDashboard').then(m => ({ default: m.TourOperatorDashboard })));
const PartnerSelection = lazy(() => import('../../components/PartnerSelection').then(m => ({ default: m.PartnerSelection })));

// Loading component
const ViewLoader = () => (
  <motion.div
    className="flex items-center justify-center p-8"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
  </motion.div>
);

// Error boundary component
const ViewError = ({ error, retry }: { error: Error; retry: () => void }) => (
  <motion.div
    className="flex flex-col items-center justify-center p-8 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="text-red-500 mb-4">
      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
    <p className="text-gray-600 mb-4">Failed to load this view. Please try again.</p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
    >
      Try Again
    </button>
  </motion.div>
);

interface ViewManagerProps {
  currentView: AppView;
  activeTab: string;
  userRole: UserRole;
  partnerMode: PartnerMode;
  onNavigateToHotels: () => void;
  onNavigateToTours: () => void;
  onSelectPartnerMode: (mode: 'hotel_manager' | 'tour_operator') => void;
  onBackToHome: () => void;
  onBackToMenu?: () => void;
}

/**
 * View Manager - Centralized view rendering and management
 * Handles lazy loading, error boundaries, and view-specific logic
 */
export class ViewManager {
  private static instance: ViewManager;
  
  public static getInstance(): ViewManager {
    if (!ViewManager.instance) {
      ViewManager.instance = new ViewManager();
    }
    return ViewManager.instance;
  }

  /**
   * Render view component based on current view and user context
   */
  public renderView(props: ViewManagerProps): React.ReactElement {
    const { currentView, activeTab, userRole, partnerMode } = props;

    // Handle special views first
    if (currentView === APP_VIEWS.PARTNER_SELECTION) {
      return this.renderPartnerSelection(props);
    }

    if (currentView === APP_VIEWS.DASHBOARD) {
      return this.renderDashboard(props);
    }

    if (currentView === APP_VIEWS.CALENDAR) {
      return this.renderCalendar(props);
    }

    if (currentView === APP_VIEWS.BOOKINGS) {
      return this.renderBookings(props);
    }

    if (currentView === APP_VIEWS.REVIEWS) {
      return this.renderReviews(props);
    }

    if (currentView === APP_VIEWS.VERIFICATION) {
      return this.renderVerification(props);
    }

    if (currentView === APP_VIEWS.SETTINGS) {
      return this.renderSettings(props);
    }

    if (currentView === APP_VIEWS.HOTEL_ONBOARDING) {
      return this.renderHotelOnboarding(props);
    }

    // Handle main navigation views
    return this.renderMainContent(props);
  }

  /**
   * Render partner selection view
   */
  private renderPartnerSelection(props: ViewManagerProps): React.ReactElement {
    return (
      <Suspense fallback={<ViewLoader />}>
        <PartnerSelection
          onBack={props.onBackToHome}
          onSelectPartnerMode={props.onSelectPartnerMode}
        />
      </Suspense>
    );
  }

  /**
   * Render dashboard view based on user role
   */
  private renderDashboard(props: ViewManagerProps): React.ReactElement {
    const { userRole, partnerMode } = props;

    if (partnerMode === 'hotel_manager' || userRole === 'hotel_manager') {
      return (
        <Suspense fallback={<ViewLoader />}>
          <HotelManagerDashboard />
        </Suspense>
      );
    }

    if (partnerMode === 'tour_operator' || userRole === 'tour_operator') {
      return (
        <Suspense fallback={<ViewLoader />}>
          <TourOperatorDashboard />
        </Suspense>
      );
    }

    // Fallback for invalid dashboard access
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this dashboard.</p>
      </div>
    );
  }

  /**
   * Render calendar view
   */
  private renderCalendar(props: ViewManagerProps): React.ReactElement {
    return (
      <Suspense fallback={<ViewLoader />}>
        <CalendarFeature />
      </Suspense>
    );
  }

  /**
   * Render bookings view
   */
  private renderBookings(props: ViewManagerProps): React.ReactElement {
    return (
      <Suspense fallback={<ViewLoader />}>
        <BookingsFeature />
      </Suspense>
    );
  }

  /**
   * Render reviews view
   */
  private renderReviews(props: ViewManagerProps): React.ReactElement {
    return (
      <Suspense fallback={<ViewLoader />}>
        <ReviewsFeature />
      </Suspense>
    );
  }

  /**
   * Render verification view
   */
  private renderVerification(props: ViewManagerProps): React.ReactElement {
    return (
      <Suspense fallback={<ViewLoader />}>
        <VerificationFeature />
      </Suspense>
    );
  }

  /**
   * Render settings view
   */
  private renderSettings(props: ViewManagerProps): React.ReactElement {
    return (
      <Suspense fallback={<ViewLoader />}>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Settings</h2>
          <p className="text-gray-600">Settings feature coming soon...</p>
        </div>
      </Suspense>
    );
  }

  /**
   * Render hotel onboarding view
   */
  private renderHotelOnboarding(props: ViewManagerProps): React.ReactElement {
    return (
      <Suspense fallback={<ViewLoader />}>
        <HotelOnboardingFeature 
          onBack={props.onBackToMenu || props.onBackToHome}
          onComplete={() => {
            // Navigate back to dashboard after completion
            if (props.onBackToHome) {
              props.onBackToHome();
            }
          }}
        />
      </Suspense>
    );
  }

  /**
   * Render main content based on active tab
   */
  private renderMainContent(props: ViewManagerProps): React.ReactElement {
    const { activeTab } = props;

    switch (activeTab) {
      case 'hotels':
        return (
          <Suspense fallback={<ViewLoader />}>
            <HotelsFeature />
          </Suspense>
        );
      
      case 'tours':
        return (
          <Suspense fallback={<ViewLoader />}>
            <ToursFeature />
          </Suspense>
        );
      
      case 'messages':
        return (
          <Suspense fallback={<ViewLoader />}>
            <MessagesFeature />
          </Suspense>
        );
      
      case 'home':
      default:
        return (
          <Suspense fallback={<ViewLoader />}>
            <HomeFeature
              onNavigateToHotels={props.onNavigateToHotels}
              onNavigateToTours={props.onNavigateToTours}
            />
          </Suspense>
        );
    }
  }

  /**
   * Get view configuration for animations and layout
   */
  public getViewConfig(view: AppView) {
    const baseConfig = {
      showBottomNav: true,
      showHeader: true,
      requiresAuth: false,
      allowsGuest: true,
    };

    switch (view) {
      case APP_VIEWS.DASHBOARD:
        return {
          ...baseConfig,
          showBottomNav: false,
          requiresAuth: true,
          allowsGuest: false,
        };
      
      case APP_VIEWS.PARTNER_SELECTION:
        return {
          ...baseConfig,
          showBottomNav: false,
          showHeader: false,
        };
      
      case APP_VIEWS.CALENDAR:
      case APP_VIEWS.BOOKINGS:
      case APP_VIEWS.REVIEWS:
      case APP_VIEWS.VERIFICATION:
      case APP_VIEWS.HOTEL_ONBOARDING:
        return {
          ...baseConfig,
          showBottomNav: false,
          showHeader: false,
          requiresAuth: true,
          allowsGuest: false,
        };
      
      default:
        return baseConfig;
    }
  }

  /**
   * Get animation settings for view transitions
   */
  public getViewAnimation(view: AppView, isEntering: boolean) {
    const baseAnimation = {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    };

    switch (view) {
      case APP_VIEWS.DASHBOARD:
      case APP_VIEWS.PARTNER_SELECTION:
        return {
          ...baseAnimation,
          initial: { opacity: 0, x: isEntering ? 100 : -100 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: isEntering ? -100 : 100 },
        };
      
      default:
        return {
          ...baseAnimation,
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.05 },
        };
    }
  }
}

// Export singleton instance and component
export const viewManager = ViewManager.getInstance();

export interface ViewRendererProps extends ViewManagerProps {}

export function ViewRenderer(props: ViewRendererProps): React.ReactElement {
  return viewManager.renderView(props);
}