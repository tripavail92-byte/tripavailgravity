import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import { SplashScreen } from './components/SplashScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { AppLogo } from './components/composite/AppLogo';
import { ProfileAvatar } from './components/ProfileAvatar';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { DarkModeToggle } from './components/DarkModeToggle';
import { TripAvailSearchBar } from './components/TripAvailSearchBar';
import { SearchOverlay } from './components/SearchOverlay';

// Import components directly to avoid lazy loading issues
// import { TourManager } from './components/tour/TourManager'; // Temporarily disabled
import { DrawerManager } from './modules/drawer/DrawerManager';
import { ScreenManager } from './modules/navigation/ScreenManager';

// Modules
import { roleManager } from './modules/roles/RoleManager';

// Hooks
import { useApp } from './hooks/useApp';
import { useDarkMode } from './hooks/useDarkMode';

// Constants and Types
import { NAVIGATION_TABS } from './lib/constants';
import type { UserRole } from './lib/types';
import type { DrawerMeta } from './modules/types/drawer';

export default function App() {
  const {
    // State
    showSplash,
    menuOpen,
    activeTab,
    partnerMode,
    user,
    
    // Actions
    setMenuOpen,
    setActiveTab,
    
    // Handlers
    handleSplashComplete,
    handleSelectPartnerMode,
    handleSwitchToTravelerMode,
  } = useApp();

  // Dark mode functionality
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Simplified ready state
  const [isReady, setIsReady] = useState(true);

  // Local state for current screen
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedDrawerItem, setSelectedDrawerItem] = useState('home');
  
  // Track if we're viewing a detail screen that should hide bottom nav
  const [isDetailScreenActive, setIsDetailScreenActive] = useState(false);
  
  // Screen flip animation state
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Search overlay state
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [searchFilters, setSearchFilters] = useState<any>({
    query: '',
    category: 'all',
    location: '',
    duration: '',
    priceRange: [0, 5000],
    minRating: 0,
    experienceType: []
  });

  // Simplified computed values
  const effectiveRole: UserRole = partnerMode || user?.role || 'traveler';
  const currentTab = activeTab || NAVIGATION_TABS.HOME;
  
  const drawerMeta: DrawerMeta = {
    userName: user?.name || 'Maria',
    userEmail: user?.email || 'tours@adventures.com',
    userRole: roleManager.getRoleDisplayName(effectiveRole),
    userLocation: user?.location || 'Pakistan',
    isVerified: user?.isVerified || false,
    profileCompletion: roleManager.calculateProfileCompletion(user || {}, effectiveRole)
  };

  // Memoized handlers to prevent unnecessary re-renders
  const handleDrawerItemClick = useCallback((itemId: string, screen: string) => {
    setSelectedDrawerItem(itemId);
    setCurrentScreen(screen);
    setMenuOpen(false);
    
    // For traveler dashboard, also ensure we're on the home tab
    if (itemId === 'dashboard' && effectiveRole === 'traveler') {
      setActiveTab('home');
    }
  }, [effectiveRole, setActiveTab]);

  const handleQuickActionClick = useCallback((actionId: string) => {
    switch (actionId) {
      case 'create-tour':
        setCurrentScreen('create-tour');
        break;
      case 'tour-onboarding':
        setCurrentScreen('tour-onboarding');
        break;
      case 'plan-trip':
        setCurrentScreen('plan-trip');
        break;
      default:
        console.log('Action clicked:', actionId);
    }
    setMenuOpen(false);
  }, []);

  const handleBecomePartner = useCallback(() => {
    // Start flip animation
    setIsFlipping(true);
    setMenuOpen(false); // Close hamburger menu immediately
    
    // After flip animation completes, show partner selection
    setTimeout(() => {
      setCurrentScreen('partner-selection');
      setIsFlipping(false);
    }, 800); // Match animation duration
  }, []);

  const handlePartnerModeSelect = useCallback((mode: 'hotel_manager' | 'tour_operator') => {
    handleSelectPartnerMode(mode);
    setCurrentScreen('dashboard');
    setSelectedDrawerItem('dashboard');
    // Auto-open drawer after partner selection
    setTimeout(() => {
      setMenuOpen(true);
    }, 500);
  }, [handleSelectPartnerMode]);

  const handleTourComplete = useCallback((tourId: string) => {
    console.log('Tour completed:', tourId);
  }, []);

  const handleScreenNavigate = useCallback((screen: string) => {
    setCurrentScreen(screen);
    
    // Update selected drawer item if needed
    if (screen === 'home' || screen === 'dashboard') {
      setSelectedDrawerItem(effectiveRole === 'traveler' ? 'home' : 'dashboard');
    }
  }, [effectiveRole]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    
    // Reset drawer selection when changing tabs to prevent dashboard from sticking
    if (tab === 'home' && selectedDrawerItem === 'dashboard') {
      setSelectedDrawerItem('home');
    }
  }, [selectedDrawerItem, setActiveTab]);

  // Handle search from the main search bar
  const handleSearch = useCallback((filters: any) => {
    console.log('Search filters:', filters);
    // TODO: Implement search functionality
    // You can navigate to search results screen or filter content
  }, []);

  const handleBackToHome = useCallback(() => {
    const homeScreen = effectiveRole === 'traveler' ? 'home' : 'dashboard';
    setCurrentScreen(homeScreen);
    setSelectedDrawerItem(homeScreen);
  }, [effectiveRole]);

  const handleMenuToggle = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  // Loading component
  const LoadingFallback = () => (
    <div className="flex items-center justify-center p-8">
      <div className="w-6 h-6 border-2 border-[#ff5a5f] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <AppErrorBoundary>
      <div className="size-full bg-background dark:bg-background">
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
          <motion.div
            key={`main-${effectiveRole}`}
            className="size-full bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-background dark:to-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            id="main-app-content"
          >
            {/* Main Header - Hide on detail screens and during flip animation */}
            {!isDetailScreenActive && !isFlipping && (
            <div className="sticky top-0 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-border/50 z-[50] px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                {/* Hamburger Menu Button */}
                <motion.button
                  onClick={handleMenuToggle}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-[60] relative"
                  whileTap={{ scale: 0.95 }}
                  data-tour="hamburger-menu"
                >
                  <motion.div
                    animate={menuOpen ? { rotate: 180 } : { rotate: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {menuOpen ? (
                      <svg className="w-6 h-6 text-gray-700 dark:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-700 dark:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </motion.div>
                </motion.button>
                
                {/* App Logo */}
                <AppLogo />

                {/* Profile Section & Dark Mode Toggle */}
                <div className="flex items-center gap-3">
                  <DarkModeToggle 
                    isDarkMode={isDarkMode} 
                    onToggle={toggleDarkMode} 
                  />
                  <button className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <ProfileAvatar size="sm" name={drawerMeta.userName} />
                    <span className="text-sm text-gray-700 dark:text-foreground">
                      {roleManager.getRoleDisplayName(effectiveRole)}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Screen Flip Animation Overlay */}
            <AnimatePresence>
              {isFlipping && (
                <motion.div
                  className="fixed inset-0 z-[100] bg-gradient-to-br from-rose-500 via-pink-500 to-violet-600 flex items-center justify-center"
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeInOut",
                    rotateY: { type: "spring", damping: 15, stiffness: 100 }
                  }}
                  style={{ 
                    perspective: "1000px",
                    transformStyle: "preserve-3d"
                  }}
                >
                  <motion.div
                    className="text-white text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <motion.div
                      className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, ease: "linear" }}
                    >
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2">Switching to Partner Mode</h2>
                    <p className="text-white/80">Get ready to grow your business</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className={`${isDetailScreenActive ? 'h-screen overflow-y-auto' : 'flex-1 overflow-y-auto pb-24'}`}>
              <div className={`${!isDetailScreenActive ? 'p-4 space-y-6' : ''}`}>
                {/* TripAvail Search Bar - Only for Travelers on Home/Browse screen (not Dashboard) */}
                {effectiveRole === 'traveler' && currentScreen === 'home' && selectedDrawerItem !== 'dashboard' && !isDetailScreenActive && !isFlipping && (
                  <TripAvailSearchBar 
                    onSearch={handleSearch}
                    className="relative z-10"
                    onSearchOverlayToggle={(isOpen, filters) => {
                      setShowSearchOverlay(isOpen);
                      if (filters) {
                        setSearchFilters(filters);
                      }
                      
                      // Apply blur effect to main content when search overlay is open
                      const mainContent = document.getElementById('main-app-content');
                      const body = document.body;
                      if (isOpen) {
                        body.style.overflow = 'hidden';
                        if (mainContent) {
                          mainContent.style.filter = 'blur(4px)';
                          mainContent.style.transition = 'filter 0.3s ease';
                        }
                      } else {
                        body.style.overflow = '';
                        if (mainContent) {
                          mainContent.style.filter = '';
                        }
                      }
                    }}
                  />
                )}

                {/* Welcome Section - Only for Partners (Hide on Package Screens) */}
                {effectiveRole !== 'traveler' && 
                 !isDetailScreenActive && 
                 !isFlipping && 
                 currentScreen !== 'list-packages' && 
                 currentScreen !== 'package-creation' && (
                  <div>
                    <h1 className="text-2xl text-gray-900 dark:text-foreground mb-1">
                      {effectiveRole === 'hotel_manager'
                        ? 'Hotel Manager Portal'
                        : 'Tour Operator Hub'
                      }
                    </h1>
                    <p className="text-gray-600 dark:text-muted-foreground">
                      {effectiveRole === 'hotel_manager'
                        ? 'Manage your properties and grow your business'
                        : 'Create experiences and manage tours'
                      }
                    </p>
                  </div>
                )}

                {/* Screen Content - Hide during flip animation */}
                {!isFlipping && (
                  <AppErrorBoundary>
                    <ScreenManager
                      screen={currentScreen}
                      role={effectiveRole}
                      onNavigate={handleScreenNavigate}
                      onBackToHome={handleBackToHome}
                      onSelectPartnerMode={handlePartnerModeSelect}
                      activeTab={currentTab}
                      selectedDrawerItem={selectedDrawerItem}
                      onDetailScreenChange={setIsDetailScreenActive}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                    />
                  </AppErrorBoundary>
                )}
              </div>
            </div>

            {/* Bottom Navigation - Only for Traveler and not on detail screens */}
            {effectiveRole === 'traveler' && !isDetailScreenActive && !isFlipping && (
              <div data-tour="bottom-nav" className="relative z-[40]">
                <BottomNavigation 
                  activeTab={currentTab} 
                  onTabChange={handleTabChange} 
                />
              </div>
            )}

            {/* Drawer Manager - Hide during flip animation */}
            {!isFlipping && (
              <AppErrorBoundary>
                <DrawerManager
                  isOpen={menuOpen}
                  onClose={() => setMenuOpen(false)}
                  role={effectiveRole}
                  selectedItemId={selectedDrawerItem}
                  onItemClick={handleDrawerItemClick}
                  onQuickActionClick={handleQuickActionClick}
                  onSwitchToTraveler={handleSwitchToTravelerMode}
                  onBecomePartner={handleBecomePartner}
                  meta={drawerMeta}
                />
              </AppErrorBoundary>
            )}

            {/* Tour Manager - Temporarily disabled, will be introduced later */}
            {/* {!showSplash && (
              <AppErrorBoundary>
                <TourManager
                  userRole={effectiveRole}
                  onTourComplete={handleTourComplete}
                />
              </AppErrorBoundary>
            )} */}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay - Rendered completely outside main content to avoid blur */}
      <SearchOverlay
        isOpen={showSearchOverlay}
        onClose={() => {
          setShowSearchOverlay(false);
          // Remove blur effect
          const mainContent = document.getElementById('main-app-content');
          const body = document.body;
          body.style.overflow = '';
          if (mainContent) {
            mainContent.style.filter = '';
          }
        }}
        onSearch={(filters) => {
          setSearchFilters(filters);
          handleSearch(filters);
          setShowSearchOverlay(false);
          // Remove blur effect
          const mainContent = document.getElementById('main-app-content');
          const body = document.body;
          body.style.overflow = '';
          if (mainContent) {
            mainContent.style.filter = '';
          }
        }}
        initialFilters={searchFilters}
      />
      </div>
    </AppErrorBoundary>
  );
}