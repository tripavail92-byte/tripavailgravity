import { Component, ReactNode, memo } from 'react';
import { motion } from 'motion/react';
import type { UserRole } from '../../lib/types';
import { SimpleScreen } from '../../components/fallback/SimpleScreen';

// Import all screens directly to avoid lazy loading timeout issues
import TravelerHomeScreen from '../traveler/screens/HomeScreen';
import TravelerDashboardScreen from '../traveler/screens/DashboardScreen';
import AirbnbProfileScreen from '../traveler/screens/AirbnbProfileScreen';
import PaymentMethodsScreen from '../traveler/screens/PaymentMethodsScreen';
import MobileWalletsScreen from '../traveler/screens/MobileWalletsScreen';
import PaymentCardsScreen from '../traveler/screens/PaymentCardsScreen';
import TravelerTripsScreen from '../traveler/screens/TripsScreen';
import TravelerWishlistScreen from '../traveler/screens/WishlistScreen';
import TravelerAccountSettingsScreen from '../traveler/screens/AccountSettingsScreen';
import SecuritySettingsScreen from '../traveler/screens/SecuritySettingsScreen';
import AccountInfoScreen from '../traveler/screens/AccountInfoScreen';
import NotificationsSettingsScreen from '../traveler/screens/NotificationsSettingsScreen';
import PrivacySettingsScreen from '../traveler/screens/PrivacySettingsScreen';
import AppPreferencesScreen from '../traveler/screens/AppPreferencesScreen';

import HotelManagerDashboardScreen from '../hotelManager/screens/DashboardScreen';
import HotelManagerCalendarScreen from '../hotelManager/screens/CalendarScreen';
import HotelManagerPropertiesScreen from '../hotelManager/screens/PropertiesScreen';
import HotelManagerListHotelScreen from '../hotelManager/screens/ListHotelScreen';
import HotelManagerListPackagesScreen from '../hotelManager/screens/ListPackagesScreen';
import PackageCreationScreen from '../hotelManager/screens/PackageCreationScreen';
import HotelOnboardingScreen from '../hotelManager/screens/HotelOnboardingScreen';
import HotelManagerVerificationScreen from '../hotelManager/screens/VerificationScreen';

import TourOperatorDashboardScreen from '../tourOperator/screens/DashboardScreen';
import TourOperatorToursScreen from '../tourOperator/screens/ToursScreen';
import TourOperatorPostTripPackagesScreen from '../tourOperator/screens/PostTripPackagesScreen';
import TourOperatorCalendarScreen from '../tourOperator/screens/CalendarScreen';
import TourCreationScreen from '../tourOperator/screens/TourCreationScreen';
import TourOperatorOnboardingScreen from '../tourOperator/screens/TourOperatorOnboardingScreen';

import PartnerSelectionScreen from '../shared/screens/PartnerSelectionScreen';
import BookingsScreen from '../shared/screens/BookingsScreen';
import ReviewsScreen from '../shared/screens/ReviewsScreen';
import VerificationScreen from '../shared/screens/VerificationScreen';
import SettingsScreen from '../shared/screens/SettingsScreen';
import HelpScreen from '../shared/screens/HelpScreen';
import LegalScreen from '../shared/screens/LegalScreen';

// Loading component (simplified since no lazy loading)
const ScreenLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-6 h-6 border-2 border-[#ff5a5f] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Error boundary component
const ScreenError = ({ error, retry }: { error: Error; retry: () => void }) => (
  <motion.div
    className="flex flex-col items-center justify-center p-8 text-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="text-red-500 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Screen Loading Error</h3>
    <p className="text-gray-600 mb-4 max-w-md">
      There was an issue loading this screen. Please try again.
    </p>
    <button 
      onClick={retry}
      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
    >
      Try Again
    </button>
    <details className="mt-4 text-xs text-gray-500">
      <summary className="cursor-pointer">Error Details</summary>
      <pre className="mt-2 p-2 bg-gray-100 rounded text-left overflow-auto">
        {error.message}
      </pre>
    </details>
  </motion.div>
);

interface ScreenManagerProps {
  screen: string;
  role: UserRole;
  onNavigate: (screen: string) => void;
  onBackToHome: () => void;
  onSelectPartnerMode?: (mode: 'hotel_manager' | 'tour_operator') => void;
  activeTab?: string;
  selectedDrawerItem?: string;
  onDetailScreenChange?: (isDetailActive: boolean) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const ScreenManager = memo(function ScreenManager({ screen, role, onNavigate, onBackToHome, onSelectPartnerMode, activeTab, selectedDrawerItem, onDetailScreenChange, isDarkMode, onToggleDarkMode }: ScreenManagerProps) {
  const renderScreen = () => {
    try {
      // Role-specific screens
      switch (role) {
        case 'traveler':
          switch (screen) {
            case 'home':
              return <TravelerHomeScreen 
                onNavigate={onNavigate} 
                activeTab={activeTab} 
                showDashboard={selectedDrawerItem === 'dashboard'}
                onDetailScreenChange={onDetailScreenChange}
              />;
            case 'dashboard':
              return <TravelerDashboardScreen onNavigate={onNavigate} />;
            case 'profile':
              return <AirbnbProfileScreen onNavigate={onNavigate} />;
            case 'payment-methods':
              return <PaymentMethodsScreen onNavigate={onNavigate} />;
            case 'mobile-wallets':
              return <MobileWalletsScreen onNavigate={onNavigate} />;
            case 'payment-cards':
              return <PaymentCardsScreen onNavigate={onNavigate} />;
            case 'my-trips':
              return <TravelerTripsScreen onNavigate={onNavigate} />;
            case 'wishlist':
              return <TravelerWishlistScreen onNavigate={onNavigate} />;
            case 'account-settings':
              return <TravelerAccountSettingsScreen onNavigate={onNavigate} />;
            case 'security-settings':
              return <SecuritySettingsScreen onNavigate={onNavigate} />;
            case 'account-info':
              return <AccountInfoScreen onNavigate={onNavigate} />;
            case 'notifications-settings':
              return <NotificationsSettingsScreen onNavigate={onNavigate} />;
            case 'privacy-settings':
              return <PrivacySettingsScreen onNavigate={onNavigate} />;
            case 'app-preferences':
              return <AppPreferencesScreen onNavigate={onNavigate} isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} />;
            default:
              break;
          }
          break;

      case 'hotel_manager':
        switch (screen) {
          case 'dashboard':
          case 'home':
            return <HotelManagerDashboardScreen onNavigate={onNavigate} />;
          case 'list-hotel':
            return <HotelManagerListHotelScreen onNavigate={onNavigate} onDetailScreenChange={onDetailScreenChange} />;
          case 'list-packages':
            return <HotelManagerListPackagesScreen onNavigate={onNavigate} />;
          case 'package-creation':
            return <PackageCreationScreen onNavigate={onNavigate} />;
          case 'calendar':
            return <HotelManagerCalendarScreen onNavigate={onNavigate} />;
          case 'properties':
            return <HotelManagerPropertiesScreen onNavigate={onNavigate} />;
          case 'hotel-onboarding':
            return <HotelOnboardingScreen onNavigate={onNavigate} />;
          case 'verification':
            return <HotelManagerVerificationScreen onNavigate={onNavigate} />;
          default:
            break;
        }
        break;

      case 'tour_operator':
        switch (screen) {
          case 'dashboard':
          case 'home':
            return <TourOperatorDashboardScreen onNavigate={onNavigate} />;
          case 'post-trip-packages':
            return <TourOperatorPostTripPackagesScreen onNavigate={onNavigate} />;
          case 'calendar':
            return <TourOperatorCalendarScreen onNavigate={onNavigate} />;
          case 'tours':
            return <TourOperatorToursScreen onNavigate={onNavigate} />;
          case 'create-tour':
            return <TourCreationScreen onNavigate={onNavigate} />;
          case 'tour-onboarding':
            return <TourOperatorOnboardingScreen onNavigate={onNavigate} />;
          default:
            break;
        }
        break;
    }

    // Shared screens
    switch (screen) {
      case 'bookings':
        return <BookingsScreen role={role} onNavigate={onNavigate} />;
      case 'reviews':
        return <ReviewsScreen role={role} onNavigate={onNavigate} />;
      case 'verification':
        return <VerificationScreen role={role} onNavigate={onNavigate} />;
      case 'settings':
        return <SettingsScreen role={role} onNavigate={onNavigate} />;
      case 'help':
        return <HelpScreen role={role} onNavigate={onNavigate} />;
      case 'legal':
        return <LegalScreen role={role} onNavigate={onNavigate} />;
      case 'partner-selection':
        return <PartnerSelectionScreen 
          onSelectPartnerMode={onSelectPartnerMode!} 
          onBack={onBackToHome} 
        />;
      default:
        // Fallback to home screen
        return role === 'traveler' 
          ? <TravelerHomeScreen 
              onNavigate={onNavigate} 
              activeTab={activeTab} 
              showDashboard={selectedDrawerItem === 'dashboard'}
              onDetailScreenChange={onDetailScreenChange}
            />
          : role === 'hotel_manager'
          ? <HotelManagerDashboardScreen onNavigate={onNavigate} />
          : <TourOperatorDashboardScreen onNavigate={onNavigate} />;
    }
    } catch (error) {
      console.error('Error rendering screen:', error);
      return (
        <SimpleScreen
          title="Loading..."
          message={`Preparing your ${role === 'traveler' ? 'travel' : role === 'hotel_manager' ? 'hotel management' : 'tour operator'} experience`}
          onNavigate={onNavigate}
        />
      );
    }
  };

  return (
    <ErrorBoundary
      fallback={({ error, retry }) => <ScreenError error={error} retry={retry} />}
    >
      {renderScreen()}
    </ErrorBoundary>
  );
});

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ({ error, retry }: { error: Error; retry: () => void }) => ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback({ error: this.state.error, retry: this.retry });
    }

    return this.props.children;
  }
}

// Add component name for debugging
ScreenManager.displayName = 'ScreenManager';