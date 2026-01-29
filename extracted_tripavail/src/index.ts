// TripAvail - Main Export File

// Types
export * from './lib/types';
export * from './lib/constants';
export * from './lib/utils';

// Services
export * from './services/dataService';

// Hooks
export * from './hooks/useApp';
export * from './hooks/useSearch';

// Features
export * from './features/home/HomeFeature';
export * from './features/hotels/HotelsFeature';
export * from './features/tours/ToursFeature';
export * from './features/messages/MessagesFeature';

// Components (re-export existing components)
export { SplashScreen } from './components/SplashScreen';
export { HamburgerMenu } from './components/HamburgerMenu';
export { BottomNavigation } from './components/BottomNavigation';
export { DestinationCard } from './components/DestinationCard';
export { PartnerSelection } from './components/PartnerSelection';
export { PremiumImageSlider } from './components/PremiumImageSlider';

// Icons
export { AnimatedBuildingIcon } from './components/icons/AnimatedBuildingIcon';
export { AnimatedPlaneIcon } from './components/icons/AnimatedPlaneIcon';
export { AnimatedMessageIcon } from './components/icons/AnimatedMessageIcon';