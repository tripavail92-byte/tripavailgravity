# Flutter Navigation System Implementation

## Executive Summary

This document defines the comprehensive Flutter navigation system for TripAvail, migrating the sophisticated React routing architecture to Flutter using GoRouter. The system preserves the unique hybrid navigation pattern combining drawer navigation (universal) with bottom tab navigation (travelers only), advanced screen flip animations, role-based routing, and complex state coordination.

### Key Navigation Features to Migrate
- **Hybrid Navigation**: Drawer (all roles) + Bottom tabs (travelers only)
- **Role-Based Routing**: Different navigation trees per user role
- **Screen Flip Animation**: 3D rotate transition for partner mode switching
- **Search Overlay Integration**: Full-screen search with blur effects
- **Detail Screen Detection**: Automatic navigation hiding for immersive experiences
- **Navigation History**: Back navigation with proper state management

---

## 🧭 Navigation Architecture Overview

### **Navigation Hierarchy**
```
TripAvail Navigation System
├── Splash Screen (Initial Route)
├── Main Navigation Shell
│   ├── Drawer Navigation (Universal)
│   │   ├── Role-specific menu items
│   │   ├── Profile section
│   │   ├── Quick actions
│   │   └── Settings & mode switching
│   ├── Bottom Tab Navigation (Travelers Only)
│   │   ├── Home Tab
│   │   ├── Hotels Tab
│   │   ├── Tours Tab
│   │   ├── Messages Tab
│   │   └── Profile Tab
│   └── Screen Content
│       ├── Role-specific screens
│       ├── Shared screens
│       ├── Detail screens (fullscreen)
│       └── Overlay screens (search, onboarding)
└── Special Overlays
    ├── Screen Flip Animation
    ├── Search Overlay
    ├── Tour/Onboarding Overlay
    └── Error Handling
```

### **Navigation State Coordination**
```dart
// Core navigation state relationship
NavigationState {
  currentScreen,      // Active screen identifier
  selectedDrawerItem, // Active drawer menu item
  activeTab,          // Active bottom tab (travelers only)
  isDrawerOpen,       // Drawer visibility
  isDetailScreenActive, // Fullscreen mode for detail screens
  isFlipping,         // Screen flip animation state
  isSearchOverlayOpen, // Search overlay visibility
  navigationHistory   // Back navigation stack
}
```

---

## 🚀 GoRouter Configuration

### **Main Router Setup**
```dart
// lib/core/navigation/app_router.dart
final appRouter = GoRouter(
  initialLocation: '/splash',
  debugLogDiagnostics: true,
  
  // Global redirect logic for role-based routing
  redirect: (context, state) {
    final navigationState = context.read(navigationStateProvider);
    final userRole = context.read(currentRoleProvider);
    
    // Handle splash screen completion
    if (state.location == '/splash' && navigationState.isReady) {
      return _getHomeRouteForRole(userRole);
    }
    
    // Ensure role-appropriate routes
    if (_isRoleSpecificRoute(state.location) && 
        !_isValidRouteForRole(state.location, userRole)) {
      return _getHomeRouteForRole(userRole);
    }
    
    return null; // No redirect needed
  },
  
  routes: [
    // Splash Route
    GoRoute(
      path: '/splash',
      name: 'splash',
      builder: (context, state) => const SplashScreen(),
    ),
    
    // Partner Selection Route (Special transition screen)
    GoRoute(
      path: '/partner-selection',
      name: 'partner-selection',
      builder: (context, state) => const PartnerSelectionScreen(),
    ),
    
    // Main Application Shell
    ShellRoute(
      builder: (context, state, child) => MainNavigationShell(child: child),
      routes: [
        // Traveler Routes Tree
        GoRoute(
          path: '/traveler',
          name: 'traveler-root',
          redirect: (context, state) => '/traveler/home',
          routes: [
            // Bottom Tab Routes (Travelers)
            GoRoute(
              path: '/home',
              name: 'traveler-home',
              pageBuilder: (context, state) => _buildPageWithTabs(
                context, state, const TravelerHomeScreen(), 'home'
              ),
            ),
            GoRoute(
              path: '/hotels',
              name: 'traveler-hotels',
              pageBuilder: (context, state) => _buildPageWithTabs(
                context, state, const TravelerHotelsScreen(), 'hotels'
              ),
            ),
            GoRoute(
              path: '/tours',
              name: 'traveler-tours',
              pageBuilder: (context, state) => _buildPageWithTabs(
                context, state, const TravelerToursScreen(), 'tours'
              ),
            ),
            GoRoute(
              path: '/messages',
              name: 'traveler-messages',
              pageBuilder: (context, state) => _buildPageWithTabs(
                context, state, const TravelerMessagesScreen(), 'messages'
              ),
            ),
            GoRoute(
              path: '/profile',
              name: 'traveler-profile',
              pageBuilder: (context, state) => _buildPageWithTabs(
                context, state, const TravelerProfileScreen(), 'profile'
              ),
            ),
            
            // Traveler Dashboard (Drawer Access)
            GoRoute(
              path: '/dashboard',
              name: 'traveler-dashboard',
              pageBuilder: (context, state) => _buildPageWithTabs(
                context, state, const TravelerDashboardScreen(), 'home'
              ),
            ),
            
            // Traveler Sub-screens
            GoRoute(
              path: '/account-info',
              name: 'traveler-account-info',
              builder: (context, state) => const AccountInfoScreen(),
            ),
            GoRoute(
              path: '/account-settings',
              name: 'traveler-account-settings',
              builder: (context, state) => const AccountSettingsScreen(),
            ),
            GoRoute(
              path: '/trips',
              name: 'traveler-trips',
              builder: (context, state) => const TripsScreen(),
            ),
            GoRoute(
              path: '/wishlist',
              name: 'traveler-wishlist',
              builder: (context, state) => const WishlistScreen(),
            ),
            GoRoute(
              path: '/rewards',
              name: 'traveler-rewards',
              builder: (context, state) => const RewardsScreen(),
            ),
            
            // Detail screens (fullscreen)
            GoRoute(
              path: '/hotel-detail/:hotelId',
              name: 'hotel-detail',
              builder: (context, state) => HotelDetailScreen(
                hotelId: state.pathParameters['hotelId']!,
              ),
            ),
            GoRoute(
              path: '/package-detail/:packageId',
              name: 'package-detail',
              builder: (context, state) => PackageDetailScreen(
                packageId: state.pathParameters['packageId']!,
              ),
            ),
          ],
        ),
        
        // Hotel Manager Routes Tree
        GoRoute(
          path: '/hotel-manager',
          name: 'hotel-manager-root',
          redirect: (context, state) => '/hotel-manager/dashboard',
          routes: [
            GoRoute(
              path: '/dashboard',
              name: 'hotel-manager-dashboard',
              builder: (context, state) => const HotelManagerDashboardScreen(),
            ),
            GoRoute(
              path: '/properties',
              name: 'hotel-manager-properties',
              builder: (context, state) => const PropertiesScreen(),
            ),
            GoRoute(
              path: '/packages',
              name: 'hotel-manager-packages',
              builder: (context, state) => const ListPackagesScreen(),
            ),
            GoRoute(
              path: '/calendar',
              name: 'hotel-manager-calendar',
              builder: (context, state) => const HotelManagerCalendarScreen(),
            ),
            GoRoute(
              path: '/verification',
              name: 'hotel-manager-verification',
              builder: (context, state) => const VerificationScreen(),
            ),
            
            // Hotel Manager Flows
            GoRoute(
              path: '/onboarding',
              name: 'hotel-onboarding',
              builder: (context, state) => const HotelOnboardingScreen(),
            ),
            GoRoute(
              path: '/list-hotel',
              name: 'list-hotel',
              builder: (context, state) => const ListHotelScreen(),
            ),
            GoRoute(
              path: '/create-package',
              name: 'create-package',
              builder: (context, state) => const PackageCreationScreen(),
            ),
          ],
        ),
        
        // Tour Operator Routes Tree
        GoRoute(
          path: '/tour-operator',
          name: 'tour-operator-root',
          redirect: (context, state) => '/tour-operator/dashboard',
          routes: [
            GoRoute(
              path: '/dashboard',
              name: 'tour-operator-dashboard',
              builder: (context, state) => const TourOperatorDashboardScreen(),
            ),
            GoRoute(
              path: '/tours',
              name: 'tour-operator-tours',
              builder: (context, state) => const ToursScreen(),
            ),
            GoRoute(
              path: '/calendar',
              name: 'tour-operator-calendar',
              builder: (context, state) => const TourOperatorCalendarScreen(),
            ),
            
            // Tour Operator Flows
            GoRoute(
              path: '/onboarding',
              name: 'tour-operator-onboarding',
              builder: (context, state) => const TourOperatorOnboardingScreen(),
            ),
            GoRoute(
              path: '/create-tour',
              name: 'create-tour',
              builder: (context, state) => const TourCreationScreen(),
            ),
            GoRoute(
              path: '/post-trip-packages',
              name: 'post-trip-packages',
              builder: (context, state) => const PostTripPackagesScreen(),
            ),
          ],
        ),
        
        // Shared Routes (All Roles)
        GoRoute(
          path: '/bookings',
          name: 'bookings',
          builder: (context, state) => const BookingsScreen(),
        ),
        GoRoute(
          path: '/reviews',
          name: 'reviews',
          builder: (context, state) => const ReviewsScreen(),
        ),
        GoRoute(
          path: '/settings',
          name: 'settings',
          builder: (context, state) => const SettingsScreen(),
        ),
        GoRoute(
          path: '/help',
          name: 'help',
          builder: (context, state) => const HelpScreen(),
        ),
        GoRoute(
          path: '/legal',
          name: 'legal',
          builder: (context, state) => const LegalScreen(),
        ),
        GoRoute(
          path: '/verification',
          name: 'shared-verification',
          builder: (context, state) => const SharedVerificationScreen(),
        ),
      ],
    ),
  ],
  
  // Error handling
  errorBuilder: (context, state) => ErrorScreen(error: state.error),
);

// Helper functions
String _getHomeRouteForRole(UserRole role) {
  switch (role) {
    case UserRole.traveler:
      return '/traveler/home';
    case UserRole.hotelManager:
      return '/hotel-manager/dashboard';
    case UserRole.tourOperator:
      return '/tour-operator/dashboard';
  }
}

bool _isRoleSpecificRoute(String location) {
  return location.startsWith('/traveler') ||
         location.startsWith('/hotel-manager') ||
         location.startsWith('/tour-operator');
}

bool _isValidRouteForRole(String location, UserRole role) {
  switch (role) {
    case UserRole.traveler:
      return location.startsWith('/traveler');
    case UserRole.hotelManager:
      return location.startsWith('/hotel-manager');
    case UserRole.tourOperator:
      return location.startsWith('/tour-operator');
  }
  return false;
}

Page<dynamic> _buildPageWithTabs(
  BuildContext context,
  GoRouterState state,
  Widget child,
  String tabId,
) {
  // Update navigation state when page builds
  WidgetsBinding.instance.addPostFrameCallback((_) {
    context.read(navigationStateProvider.notifier).setActiveTab(tabId);
  });
  
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 300),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.0, 0.03),
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          )),
          child: child,
        ),
      );
    },
  );
}
```

---

## 🏗️ Main Navigation Shell

### **Navigation Shell Implementation**
```dart
// lib/core/navigation/main_navigation_shell.dart
class MainNavigationShell extends ConsumerStatefulWidget {
  final Widget child;
  
  const MainNavigationShell({required this.child, super.key});

  @override
  ConsumerState<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends ConsumerState<MainNavigationShell>
    with TickerProviderStateMixin {
  late AnimationController _flipAnimationController;
  late AnimationController _searchBlurController;
  
  @override
  void initState() {
    super.initState();
    
    _flipAnimationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _searchBlurController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  Widget build(BuildContext context) {
    final navigationState = ref.watch(navigationStateProvider);
    final userRole = ref.watch(currentRoleProvider);
    final isDarkMode = ref.watch(isDarkModeProvider);
    
    // Listen for animation triggers
    ref.listen(navigationStateProvider.select((state) => state.isFlipping), (previous, current) {
      if (current && previous != current) {
        _flipAnimationController.forward().then((_) {
          _flipAnimationController.reset();
          ref.read(navigationStateProvider.notifier).stopFlipAnimation();
        });
      }
    });
    
    ref.listen(navigationStateProvider.select((state) => state.isSearchOverlayOpen), (previous, current) {
      if (current) {
        _searchBlurController.forward();
      } else {
        _searchBlurController.reverse();
      }
    });
    
    return Scaffold(
      // App Bar - Hidden during detail screens and flip animation
      appBar: (!navigationState.isDetailScreenActive && !navigationState.isFlipping)
          ? ThemedAppBar(
              leading: _buildMenuButton(context),
              title: const AppLogo(),
              actions: [
                const AnimatedThemeSwitcher(),
                const SizedBox(width: 8),
                _buildProfileButton(context, userRole),
                const SizedBox(width: 16),
              ],
              useGlass: true,
            )
          : null,
      
      // Drawer
      drawer: !navigationState.isFlipping ? CustomDrawer() : null,
      
      // Body with overlays
      body: Stack(
        children: [
          // Main content with blur effect
          AnimatedBuilder(
            animation: _searchBlurController,
            builder: (context, child) {
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                child: BackdropFilter(
                  filter: ImageFilter.blur(
                    sigmaX: _searchBlurController.value * 4,
                    sigmaY: _searchBlurController.value * 4,
                  ),
                  child: _buildMainContent(context, navigationState, userRole),
                ),
              );
            },
          ),
          
          // Screen Flip Animation Overlay
          if (navigationState.isFlipping)
            ScreenFlipAnimationOverlay(controller: _flipAnimationController),
          
          // Search Overlay
          if (navigationState.isSearchOverlayOpen)
            const SearchOverlay(),
          
          // Tour/Onboarding Overlay
          const TourOverlay(),
        ],
      ),
      
      // Bottom Navigation - Only for travelers, not on detail screens
      bottomNavigationBar: (_shouldShowBottomNavigation(userRole, navigationState))
          ? CustomBottomNavigation()
          : null,
    );
  }
  
  Widget _buildMainContent(BuildContext context, NavigationState navigationState, UserRole userRole) {
    return Column(
      children: [
        // Search Bar - Only for travelers on relevant screens
        if (_shouldShowSearchBar(userRole, navigationState))
          Padding(
            padding: const EdgeInsets.all(16),
            child: TripAvailSearchBar(),
          ),
        
        // Welcome Section - Only for partners
        if (_shouldShowWelcomeSection(userRole, navigationState))
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: PartnerWelcomeSection(role: userRole),
          ),
        
        // Screen Content
        Expanded(
          child: navigationState.isDetailScreenActive
              ? widget.child // Fullscreen content
              : Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: widget.child,
                ),
        ),
      ],
    );
  }
  
  Widget _buildMenuButton(BuildContext context) {
    return IconButton(
      onPressed: () => ref.read(navigationStateProvider.notifier).toggleDrawer(),
      icon: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        child: ref.watch(navigationStateProvider.select((state) => state.isDrawerOpen))
            ? const Icon(Icons.close, key: ValueKey('close'))
            : const Icon(Icons.menu, key: ValueKey('menu')),
      ),
    );
  }
  
  Widget _buildProfileButton(BuildContext context, UserRole role) {
    return GestureDetector(
      onTap: () => _navigateToProfile(role),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ProfileAvatar(size: 24),
            const SizedBox(width: 8),
            Text(
              role.displayName,
              style: Theme.of(context).textTheme.labelMedium,
            ),
          ],
        ),
      ),
    );
  }
  
  bool _shouldShowBottomNavigation(UserRole role, NavigationState state) {
    return role == UserRole.traveler &&
           !state.isDetailScreenActive &&
           !state.isFlipping &&
           !state.isSearchOverlayOpen;
  }
  
  bool _shouldShowSearchBar(UserRole role, NavigationState state) {
    return role == UserRole.traveler &&
           ['home', 'dashboard', 'hotels', 'tours'].contains(state.currentScreen) &&
           !state.isDetailScreenActive &&
           !state.isFlipping;
  }
  
  bool _shouldShowWelcomeSection(UserRole role, NavigationState state) {
    return role != UserRole.traveler &&
           !state.isDetailScreenActive &&
           !state.isFlipping &&
           state.currentScreen == 'dashboard';
  }
  
  void _navigateToProfile(UserRole role) {
    switch (role) {
      case UserRole.traveler:
        context.goNamed('traveler-profile');
        break;
      case UserRole.hotelManager:
      case UserRole.tourOperator:
        ref.read(navigationStateProvider.notifier).selectDrawerItem('profile', 'profile');
        break;
    }
  }

  @override
  void dispose() {
    _flipAnimationController.dispose();
    _searchBlurController.dispose();
    super.dispose();
  }
}
```

---

## 🎨 Screen Flip Animation

### **Screen Flip Animation Implementation**
```dart
// lib/core/navigation/screen_flip_animation.dart
class ScreenFlipAnimationOverlay extends StatefulWidget {
  final AnimationController controller;
  
  const ScreenFlipAnimationOverlay({
    required this.controller,
    super.key,
  });

  @override
  State<ScreenFlipAnimationOverlay> createState() => _ScreenFlipAnimationOverlayState();
}

class _ScreenFlipAnimationOverlayState extends State<ScreenFlipAnimationOverlay> {
  late Animation<double> _rotationAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _iconRotationAnimation;

  @override
  void initState() {
    super.initState();
    
    _rotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(
      parent: widget.controller,
      curve: const Interval(0.0, 0.8, curve: Curves.easeInOutCubic),
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: widget.controller,
      curve: const Interval(0.2, 0.6, curve: Curves.elasticOut),
    ));
    
    _iconRotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(
      parent: widget.controller,
      curve: Curves.linear,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final gradients = ref.watch(gradientsProvider);
    
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(gradient: gradients.partner),
          child: Center(
            child: Transform.scale(
              scale: _scaleAnimation.value,
              child: Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.001) // Perspective
                  ..rotateY(_rotationAnimation.value),
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(50),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 2,
                    ),
                  ),
                  child: Transform.rotate(
                    angle: _iconRotationAnimation.value,
                    child: const Icon(
                      Icons.swap_horiz,
                      color: Colors.white,
                      size: 48,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

// Screen Flip Animation Trigger
class ScreenFlipTrigger {
  static Future<void> triggerRoleSwitch(
    WidgetRef ref,
    UserRole newRole,
  ) async {
    final navigationNotifier = ref.read(navigationStateProvider.notifier);
    
    // Start flip animation
    navigationNotifier.startFlipAnimation();
    
    // Close drawer immediately
    navigationNotifier.closeDrawer();
    
    // Wait for animation to complete
    await Future.delayed(const Duration(milliseconds: 800));
    
    // Switch role
    await ref.read(userRoleProvider.notifier).switchToPartnerMode(newRole);
    
    // Navigate to partner selection or dashboard
    if (newRole != UserRole.traveler) {
      ref.read(appRouter).go('/partner-selection');
    }
  }
}
```

---

## 📱 Bottom Navigation Implementation

### **Custom Bottom Navigation**
```dart
// lib/core/navigation/custom_bottom_navigation.dart
class CustomBottomNavigation extends ConsumerWidget {
  const CustomBottomNavigation({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navigationState = ref.watch(navigationStateProvider);
    final currentTab = navigationState.activeTab;
    
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).bottomNavigationBarTheme.backgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildTabItem(
                context,
                ref,
                icon: Icons.home_outlined,
                activeIcon: Icons.home,
                label: 'Home',
                tabId: 'home',
                routeName: 'traveler-home',
                isActive: currentTab == 'home',
              ),
              _buildTabItem(
                context,
                ref,
                icon: Icons.hotel_outlined,
                activeIcon: Icons.hotel,
                label: 'Hotels',
                tabId: 'hotels',
                routeName: 'traveler-hotels',
                isActive: currentTab == 'hotels',
              ),
              _buildTabItem(
                context,
                ref,
                icon: Icons.tour_outlined,
                activeIcon: Icons.tour,
                label: 'Tours',
                tabId: 'tours',
                routeName: 'traveler-tours',
                isActive: currentTab == 'tours',
              ),
              _buildTabItem(
                context,
                ref,
                icon: Icons.message_outlined,
                activeIcon: Icons.message,
                label: 'Messages',
                tabId: 'messages',
                routeName: 'traveler-messages',
                isActive: currentTab == 'messages',
              ),
              _buildTabItem(
                context,
                ref,
                icon: Icons.person_outline,
                activeIcon: Icons.person,
                label: 'Profile',
                tabId: 'profile',
                routeName: 'traveler-profile',
                isActive: currentTab == 'profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildTabItem(
    BuildContext context,
    WidgetRef ref, {
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required String tabId,
    required String routeName,
    required bool isActive,
  }) {
    return GestureDetector(
      onTap: () => _handleTabTap(context, ref, tabId, routeName),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive 
              ? Theme.of(context).primaryColor.withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Icon(
                isActive ? activeIcon : icon,
                key: ValueKey(isActive),
                color: isActive 
                    ? Theme.of(context).primaryColor
                    : Theme.of(context).unselectedWidgetColor,
                size: 24,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive 
                    ? Theme.of(context).primaryColor
                    : Theme.of(context).unselectedWidgetColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  void _handleTabTap(BuildContext context, WidgetRef ref, String tabId, String routeName) {
    // Update navigation state
    ref.read(navigationStateProvider.notifier).setActiveTab(tabId);
    
    // Navigate to tab route
    context.goNamed(routeName);
    
    // Reset drawer selection if switching from dashboard
    final currentDrawerItem = ref.read(navigationStateProvider).selectedDrawerItem;
    if (tabId == 'home' && currentDrawerItem == 'dashboard') {
      ref.read(navigationStateProvider.notifier).selectDrawerItem('home', 'home');
    }
  }
}
```

---

## 🗂️ Drawer Navigation System

### **Custom Drawer Implementation**
```dart
// lib/core/navigation/custom_drawer.dart
class CustomDrawer extends ConsumerWidget {
  const CustomDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navigationState = ref.watch(navigationStateProvider);
    final userRole = ref.watch(currentRoleProvider);
    final user = ref.watch(currentUserProvider);
    
    return Drawer(
      width: 300,
      child: Column(
        children: [
          // Drawer Header
          DrawerHeader(
            decoration: BoxDecoration(
              gradient: ref.watch(gradientsProvider).rosePrimary,
            ),
            child: DrawerHeaderContent(user: user, role: userRole),
          ),
          
          // Drawer Menu Items
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                ...DrawerItemsBuilder.buildItemsForRole(
                  userRole,
                  navigationState.selectedDrawerItem,
                  (itemId, route) => _handleDrawerItemTap(context, ref, itemId, route),
                ),
                
                const Divider(),
                
                // Quick Actions
                if (userRole != UserRole.traveler) ...[
                  _buildSectionHeader(context, 'Quick Actions'),
                  ...QuickActionsBuilder.buildActionsForRole(
                    userRole,
                    (actionId) => _handleQuickActionTap(context, ref, actionId),
                  ),
                  const Divider(),
                ],
                
                // Settings & Mode Switching
                _buildSettingsSection(context, ref, userRole),
              ],
            ),
          ),
          
          // Bottom Actions
          _buildBottomActions(context, ref, userRole),
        ],
      ),
    );
  }
  
  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
  
  Widget _buildSettingsSection(BuildContext context, WidgetRef ref, UserRole role) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(context, 'Settings'),
        DrawerListTile(
          icon: Icons.settings_outlined,
          title: 'Settings',
          onTap: () => _navigateToSettings(context, ref),
        ),
        DrawerListTile(
          icon: Icons.help_outline,
          title: 'Help & Support',
          onTap: () => _navigateToHelp(context, ref),
        ),
        DrawerListTile(
          icon: Icons.brightness_6_outlined,
          title: 'Dark Mode',
          trailing: const AnimatedThemeSwitcher(),
          onTap: () => ref.read(themeProvider.notifier).toggleDarkMode(),
        ),
      ],
    );
  }
  
  Widget _buildBottomActions(BuildContext context, WidgetRef ref, UserRole role) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (role != UserRole.traveler)
            GradientButton(
              text: 'Switch to Traveler',
              onPressed: () => _switchToTravelerMode(context, ref),
              gradientType: GradientType.rosePrimary,
            )
          else
            GradientButton(
              text: 'Become a Partner',
              onPressed: () => _becomePartner(context, ref),
              gradientType: GradientType.partner,
            ),
          
          const SizedBox(height: 8),
          
          TextButton(
            onPressed: () => _showLogoutDialog(context, ref),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
  
  void _handleDrawerItemTap(BuildContext context, WidgetRef ref, String itemId, String route) {
    // Update navigation state
    ref.read(navigationStateProvider.notifier).selectDrawerItem(itemId, route);
    
    // Close drawer
    ref.read(navigationStateProvider.notifier).closeDrawer();
    
    // Navigate based on role and item
    _navigateToDrawerItem(context, ref, itemId, route);
  }
  
  void _navigateToDrawerItem(BuildContext context, WidgetRef ref, String itemId, String route) {
    final userRole = ref.read(currentRoleProvider);
    
    switch (userRole) {
      case UserRole.traveler:
        _navigateToTravelerItem(context, itemId, route);
        break;
      case UserRole.hotelManager:
        _navigateToHotelManagerItem(context, itemId, route);
        break;
      case UserRole.tourOperator:
        _navigateToTourOperatorItem(context, itemId, route);
        break;
    }
  }
  
  void _navigateToTravelerItem(BuildContext context, String itemId, String route) {
    switch (itemId) {
      case 'home':
        context.goNamed('traveler-home');
        break;
      case 'dashboard':
        context.goNamed('traveler-dashboard');
        break;
      case 'profile':
        context.goNamed('traveler-profile');
        break;
      case 'trips':
        context.goNamed('traveler-trips');
        break;
      case 'wishlist':
        context.goNamed('traveler-wishlist');
        break;
      case 'account-info':
        context.goNamed('traveler-account-info');
        break;
      case 'account-settings':
        context.goNamed('traveler-account-settings');
        break;
      case 'rewards':
        context.goNamed('traveler-rewards');
        break;
      default:
        context.goNamed('traveler-home');
    }
  }
  
  void _navigateToHotelManagerItem(BuildContext context, String itemId, String route) {
    switch (itemId) {
      case 'dashboard':
        context.goNamed('hotel-manager-dashboard');
        break;
      case 'properties':
        context.goNamed('hotel-manager-properties');
        break;
      case 'packages':
        context.goNamed('hotel-manager-packages');
        break;
      case 'calendar':
        context.goNamed('hotel-manager-calendar');
        break;
      case 'verification':
        context.goNamed('hotel-manager-verification');
        break;
      default:
        context.goNamed('hotel-manager-dashboard');
    }
  }
  
  void _navigateToTourOperatorItem(BuildContext context, String itemId, String route) {
    switch (itemId) {
      case 'dashboard':
        context.goNamed('tour-operator-dashboard');
        break;
      case 'tours':
        context.goNamed('tour-operator-tours');
        break;
      case 'calendar':
        context.goNamed('tour-operator-calendar');
        break;
      default:
        context.goNamed('tour-operator-dashboard');
    }
  }
  
  void _handleQuickActionTap(BuildContext context, WidgetRef ref, String actionId) {
    ref.read(navigationStateProvider.notifier).closeDrawer();
    
    switch (actionId) {
      case 'create-tour':
        context.goNamed('create-tour');
        break;
      case 'tour-onboarding':
        context.goNamed('tour-operator-onboarding');
        break;
      case 'create-package':
        context.goNamed('create-package');
        break;
      case 'hotel-onboarding':
        context.goNamed('hotel-onboarding');
        break;
      case 'list-hotel':
        context.goNamed('list-hotel');
        break;
      default:
        debugPrint('Unknown quick action: $actionId');
    }
  }
  
  Future<void> _switchToTravelerMode(BuildContext context, WidgetRef ref) async {
    ref.read(navigationStateProvider.notifier).closeDrawer();
    ref.read(userRoleProvider.notifier).switchToTravelerMode();
    context.goNamed('traveler-home');
  }
  
  Future<void> _becomePartner(BuildContext context, WidgetRef ref) async {
    await ScreenFlipTrigger.triggerRoleSwitch(ref, UserRole.hotelManager);
  }
  
  void _navigateToSettings(BuildContext context, WidgetRef ref) {
    ref.read(navigationStateProvider.notifier).closeDrawer();
    context.goNamed('settings');
  }
  
  void _navigateToHelp(BuildContext context, WidgetRef ref) {
    ref.read(navigationStateProvider.notifier).closeDrawer();
    context.goNamed('help');
  }
  
  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    // Implementation for logout confirmation dialog
  }
}
```

### **Drawer Items Builder**
```dart
// lib/core/navigation/drawer_items_builder.dart
class DrawerItemsBuilder {
  static List<Widget> buildItemsForRole(
    UserRole role,
    String selectedItemId,
    Function(String itemId, String route) onItemTap,
  ) {
    switch (role) {
      case UserRole.traveler:
        return _buildTravelerItems(selectedItemId, onItemTap);
      case UserRole.hotelManager:
        return _buildHotelManagerItems(selectedItemId, onItemTap);
      case UserRole.tourOperator:
        return _buildTourOperatorItems(selectedItemId, onItemTap);
    }
  }
  
  static List<Widget> _buildTravelerItems(
    String selectedItemId,
    Function(String, String) onItemTap,
  ) {
    return [
      DrawerListTile(
        icon: Icons.home_outlined,
        title: 'Home',
        isSelected: selectedItemId == 'home',
        onTap: () => onItemTap('home', 'home'),
      ),
      DrawerListTile(
        icon: Icons.dashboard_outlined,
        title: 'Dashboard',
        isSelected: selectedItemId == 'dashboard',
        onTap: () => onItemTap('dashboard', 'dashboard'),
      ),
      DrawerListTile(
        icon: Icons.person_outline,
        title: 'Profile',
        isSelected: selectedItemId == 'profile',
        onTap: () => onItemTap('profile', 'profile'),
      ),
      DrawerListTile(
        icon: Icons.card_travel_outlined,
        title: 'My Trips',
        isSelected: selectedItemId == 'trips',
        onTap: () => onItemTap('trips', 'trips'),
      ),
      DrawerListTile(
        icon: Icons.favorite_outline,
        title: 'Wishlist',
        isSelected: selectedItemId == 'wishlist',
        onTap: () => onItemTap('wishlist', 'wishlist'),
      ),
      DrawerListTile(
        icon: Icons.account_circle_outlined,
        title: 'Account Info',
        isSelected: selectedItemId == 'account-info',
        onTap: () => onItemTap('account-info', 'account-info'),
      ),
      DrawerListTile(
        icon: Icons.settings_outlined,
        title: 'Account Settings',
        isSelected: selectedItemId == 'account-settings',
        onTap: () => onItemTap('account-settings', 'account-settings'),
      ),
      DrawerListTile(
        icon: Icons.stars_outlined,
        title: 'Rewards',
        isSelected: selectedItemId == 'rewards',
        onTap: () => onItemTap('rewards', 'rewards'),
      ),
    ];
  }
  
  static List<Widget> _buildHotelManagerItems(
    String selectedItemId,
    Function(String, String) onItemTap,
  ) {
    return [
      DrawerListTile(
        icon: Icons.dashboard_outlined,
        title: 'Dashboard',
        isSelected: selectedItemId == 'dashboard',
        onTap: () => onItemTap('dashboard', 'dashboard'),
      ),
      DrawerListTile(
        icon: Icons.business_outlined,
        title: 'Properties',
        isSelected: selectedItemId == 'properties',
        onTap: () => onItemTap('properties', 'properties'),
      ),
      DrawerListTile(
        icon: Icons.inventory_outlined,
        title: 'Packages',
        isSelected: selectedItemId == 'packages',
        onTap: () => onItemTap('packages', 'packages'),
      ),
      DrawerListTile(
        icon: Icons.calendar_today_outlined,
        title: 'Calendar',
        isSelected: selectedItemId == 'calendar',
        onTap: () => onItemTap('calendar', 'calendar'),
      ),
      DrawerListTile(
        icon: Icons.verified_outlined,
        title: 'Verification',
        isSelected: selectedItemId == 'verification',
        onTap: () => onItemTap('verification', 'verification'),
      ),
    ];
  }
  
  static List<Widget> _buildTourOperatorItems(
    String selectedItemId,
    Function(String, String) onItemTap,
  ) {
    return [
      DrawerListTile(
        icon: Icons.dashboard_outlined,
        title: 'Dashboard',
        isSelected: selectedItemId == 'dashboard',
        onTap: () => onItemTap('dashboard', 'dashboard'),
      ),
      DrawerListTile(
        icon: Icons.tour_outlined,
        title: 'Tours',
        isSelected: selectedItemId == 'tours',
        onTap: () => onItemTap('tours', 'tours'),
      ),
      DrawerListTile(
        icon: Icons.calendar_today_outlined,
        title: 'Calendar',
        isSelected: selectedItemId == 'calendar',
        onTap: () => onItemTap('calendar', 'calendar'),
      ),
    ];
  }
}

// Drawer List Tile Component
class DrawerListTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool isSelected;
  final VoidCallback onTap;
  final Widget? trailing;
  
  const DrawerListTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.isSelected = false,
    this.trailing,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isSelected 
            ? Theme.of(context).primaryColor.withOpacity(0.1)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isSelected 
              ? Theme.of(context).primaryColor
              : Theme.of(context).iconTheme.color,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isSelected 
                ? Theme.of(context).primaryColor
                : Theme.of(context).textTheme.bodyMedium?.color,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
        trailing: trailing,
        onTap: onTap,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}
```

---

## 🔍 Search Overlay Integration

### **Search Overlay System**
```dart
// lib/core/navigation/search_overlay.dart
class SearchOverlay extends ConsumerStatefulWidget {
  const SearchOverlay({super.key});

  @override
  ConsumerState<SearchOverlay> createState() => _SearchOverlayState();
}

class _SearchOverlayState extends ConsumerState<SearchOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 0.9,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    
    _opacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));
    
    _animationController.forward();
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(searchStateProvider);
    
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Container(
          color: Colors.black.withOpacity(0.5 * _opacityAnimation.value),
          child: SafeArea(
            child: Transform.scale(
              scale: _scaleAnimation.value,
              child: Container(
                margin: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Search Header
                    _buildSearchHeader(context),
                    
                    // Search Content
                    Expanded(
                      child: searchState.isLoading
                          ? const SearchLoadingState()
                          : searchState.results.isNotEmpty
                              ? SearchResultsList(results: searchState.results)
                              : const SearchEmptyState(),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildSearchHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search destinations, hotels, tours...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                fillColor: Theme.of(context).colorScheme.surfaceVariant,
                filled: true,
              ),
              onChanged: (query) => _handleSearch(query),
            ),
          ),
          const SizedBox(width: 16),
          IconButton(
            onPressed: _closeSearch,
            icon: const Icon(Icons.close),
          ),
        ],
      ),
    );
  }
  
  void _handleSearch(String query) {
    final filters = ref.read(searchStateProvider).filters.copyWith(query: query);
    ref.read(searchStateProvider.notifier).search(filters: filters);
  }
  
  Future<void> _closeSearch() async {
    await _animationController.reverse();
    if (mounted) {
      ref.read(navigationStateProvider.notifier).setSearchOverlayOpen(false);
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
}
```

---

## 🎬 Page Transitions & Animations

### **Custom Page Transitions**
```dart
// lib/core/navigation/page_transitions.dart
class AppPageTransitions {
  static CustomTransitionPage<T> fadeTransition<T extends Object?>(
    LocalKey key,
    Widget child, {
    Duration duration = const Duration(milliseconds: 300),
  }) {
    return CustomTransitionPage<T>(
      key: key,
      child: child,
      transitionDuration: duration,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: animation,
          child: child,
        );
      },
    );
  }
  
  static CustomTransitionPage<T> slideTransition<T extends Object?>(
    LocalKey key,
    Widget child, {
    Duration duration = const Duration(milliseconds: 300),
    Offset begin = const Offset(1.0, 0.0),
  }) {
    return CustomTransitionPage<T>(
      key: key,
      child: child,
      transitionDuration: duration,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return SlideTransition(
          position: Tween<Offset>(
            begin: begin,
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          )),
          child: child,
        );
      },
    );
  }
  
  static CustomTransitionPage<T> scaleTransition<T extends Object?>(
    LocalKey key,
    Widget child, {
    Duration duration = const Duration(milliseconds: 300),
  }) {
    return CustomTransitionPage<T>(
      key: key,
      child: child,
      transitionDuration: duration,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return ScaleTransition(
          scale: Tween<double>(
            begin: 0.9,
            end: 1.0,
          ).animate(CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          )),
          child: FadeTransition(
            opacity: animation,
            child: child,
          ),
        );
      },
    );
  }
  
  static CustomTransitionPage<T> roleBasedTransition<T extends Object?>(
    LocalKey key,
    Widget child,
    UserRole role, {
    Duration duration = const Duration(milliseconds: 300),
  }) {
    switch (role) {
      case UserRole.traveler:
        return fadeTransition(key, child, duration: duration);
      case UserRole.hotelManager:
        return slideTransition(
          key,
          child,
          duration: duration,
          begin: const Offset(0.0, 0.1),
        );
      case UserRole.tourOperator:
        return scaleTransition(key, child, duration: duration);
    }
  }
}
```

---

## 📊 Navigation Analytics & Monitoring

### **Navigation Analytics**
```dart
// lib/core/navigation/navigation_analytics.dart
class NavigationAnalytics {
  static void trackScreenView(String screenName, UserRole role) {
    // Track screen views for analytics
    debugPrint('Screen View: $screenName (Role: $role)');
  }
  
  static void trackRoleSwitch(UserRole fromRole, UserRole toRole) {
    // Track role switching behavior
    debugPrint('Role Switch: $fromRole -> $toRole');
  }
  
  static void trackNavigationFlow(List<String> navigationHistory) {
    // Track navigation patterns
    debugPrint('Navigation Flow: ${navigationHistory.join(' -> ')}');
  }
  
  static void trackSearchUsage(String query, int resultsCount) {
    // Track search behavior
    debugPrint('Search: "$query" (${resultsCount} results)');
  }
}

// Navigation Analytics Provider
final navigationAnalyticsProvider = Provider<NavigationAnalytics>((ref) {
  return NavigationAnalytics();
});
```

### **Navigation Performance Monitoring**
```dart
// lib/core/navigation/navigation_performance.dart
class NavigationPerformance {
  static final Map<String, Stopwatch> _routeTimers = {};
  
  static void startRouteTimer(String routeName) {
    _routeTimers[routeName] = Stopwatch()..start();
  }
  
  static void endRouteTimer(String routeName) {
    final timer = _routeTimers[routeName];
    if (timer != null) {
      timer.stop();
      final duration = timer.elapsedMilliseconds;
      debugPrint('Route "$routeName" loaded in ${duration}ms');
      _routeTimers.remove(routeName);
      
      // Alert for slow navigation (>500ms)
      if (duration > 500) {
        debugPrint('⚠️ Slow navigation detected: $routeName took ${duration}ms');
      }
    }
  }
  
  static void measureAnimationPerformance(String animationName, VoidCallback animation) {
    final stopwatch = Stopwatch()..start();
    animation();
    stopwatch.stop();
    
    final duration = stopwatch.elapsedMilliseconds;
    debugPrint('Animation "$animationName" completed in ${duration}ms');
    
    // Alert for slow animations (>100ms)
    if (duration > 100) {
      debugPrint('⚠️ Slow animation detected: $animationName took ${duration}ms');
    }
  }
}
```

---

## 🧪 Navigation Testing Strategy

### **Navigation Test Helpers**
```dart
// test/helpers/navigation_test_helpers.dart
class NavigationTestHelpers {
  static Widget buildNavigationTestApp({
    required Widget child,
    String initialLocation = '/traveler/home',
    UserRole initialRole = UserRole.traveler,
    List<Override> overrides = const [],
  }) {
    final router = GoRouter(
      initialLocation: initialLocation,
      routes: [
        GoRoute(
          path: '/traveler/home',
          builder: (context, state) => child,
        ),
        // Add other test routes as needed
      ],
    );
    
    return ProviderScope(
      overrides: [
        userRoleProvider.overrideWith(() => MockUserRoleNotifier(initialRole)),
        ...overrides,
      ],
      child: MaterialApp.router(
        routerConfig: router,
      ),
    );
  }
  
  static void expectCurrentRoute(WidgetTester tester, String expectedRoute) {
    final context = tester.element(find.byType(MaterialApp).first);
    final router = GoRouter.of(context);
    expect(router.location, expectedRoute);
  }
  
  static Future<void> navigateAndSettle(
    WidgetTester tester,
    VoidCallback navigation,
  ) async {
    navigation();
    await tester.pumpAndSettle();
  }
}

// Navigation Widget Tests
void main() {
  group('Navigation System Tests', () {
    testWidgets('should show bottom navigation for traveler', (tester) async {
      await tester.pumpWidget(
        NavigationTestHelpers.buildNavigationTestApp(
          initialRole: UserRole.traveler,
          child: const Scaffold(body: Text('Home')),
        ),
      );
      
      expect(find.byType(CustomBottomNavigation), findsOneWidget);
    });
    
    testWidgets('should hide bottom navigation for partners', (tester) async {
      await tester.pumpWidget(
        NavigationTestHelpers.buildNavigationTestApp(
          initialRole: UserRole.hotelManager,
          child: const Scaffold(body: Text('Dashboard')),
        ),
      );
      
      expect(find.byType(CustomBottomNavigation), findsNothing);
    });
    
    testWidgets('should trigger screen flip animation on role switch', (tester) async {
      await tester.pumpWidget(
        NavigationTestHelpers.buildNavigationTestApp(
          child: const MainNavigationShell(
            child: Text('Content'),
          ),
        ),
      );
      
      // Trigger role switch
      await NavigationTestHelpers.navigateAndSettle(
        tester,
        () => tester.tap(find.text('Become a Partner')),
      );
      
      // Verify flip animation is shown
      expect(find.byType(ScreenFlipAnimationOverlay), findsOneWidget);
    });
    
    testWidgets('should update navigation state on tab change', (tester) async {
      late NavigationStateNotifier notifier;
      
      await tester.pumpWidget(
        NavigationTestHelpers.buildNavigationTestApp(
          overrides: [
            navigationStateProvider.overrideWith((ref) {
              notifier = NavigationStateNotifier(ref);
              return notifier;
            }),
          ],
          child: const CustomBottomNavigation(),
        ),
      );
      
      // Tap hotels tab
      await tester.tap(find.text('Hotels'));
      await tester.pump();
      
      // Verify state update
      expect(notifier.state.activeTab, 'hotels');
    });
  });
}
```

---

## 🔧 Navigation State Management Integration

### **Navigation Providers**
```dart
// lib/core/navigation/navigation_providers.dart

// Router Provider
final appRouterProvider = Provider<GoRouter>((ref) {
  return appRouter;
});

// Current Route Provider
final currentRouteProvider = Provider<String>((ref) {
  // This would be updated by router listeners
  return ref.watch(navigationStateProvider.select((state) => state.currentScreen));
});

// Can Navigate Back Provider
final canNavigateBackProvider = Provider<bool>((ref) {
  return ref.watch(navigationStateProvider.select((state) => 
    state.navigationHistory?.isNotEmpty ?? false));
});

// Active Tab Provider (Computed)
final activeTabProvider = Provider<String>((ref) {
  return ref.watch(navigationStateProvider.select((state) => state.activeTab));
});

// Selected Drawer Item Provider (Computed)
final selectedDrawerItemProvider = Provider<String>((ref) {
  return ref.watch(navigationStateProvider.select((state) => state.selectedDrawerItem));
});

// Navigation Visibility Providers
final shouldShowBottomNavigationProvider = Provider<bool>((ref) {
  final navigationState = ref.watch(navigationStateProvider);
  final userRole = ref.watch(currentRoleProvider);
  
  return userRole == UserRole.traveler &&
         !navigationState.isDetailScreenActive &&
         !navigationState.isFlipping &&
         !navigationState.isSearchOverlayOpen;
});

final shouldShowSearchBarProvider = Provider<bool>((ref) {
  final navigationState = ref.watch(navigationStateProvider);
  final userRole = ref.watch(currentRoleProvider);
  
  return userRole == UserRole.traveler &&
         ['home', 'dashboard', 'hotels', 'tours'].contains(navigationState.currentScreen) &&
         !navigationState.isDetailScreenActive &&
         !navigationState.isFlipping;
});
```

---

## 🚀 Performance Optimization

### **Navigation Performance Best Practices**
```dart
// lib/core/navigation/navigation_optimization.dart
class NavigationOptimization {
  // Lazy route loading for better performance
  static Widget buildLazyRoute(Widget Function() builder) {
    return FutureBuilder<Widget>(
      future: Future.microtask(builder),
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return snapshot.data!;
        }
        return const NavigationLoadingIndicator();
      },
    );
  }
  
  // Preload critical routes
  static void preloadCriticalRoutes(WidgetRef ref) {
    final userRole = ref.read(currentRoleProvider);
    
    switch (userRole) {
      case UserRole.traveler:
        // Preload traveler routes
        break;
      case UserRole.hotelManager:
        // Preload hotel manager routes
        break;
      case UserRole.tourOperator:
        // Preload tour operator routes
        break;
    }
  }
  
  // Memory management for navigation
  static void disposeNavigationResources() {
    // Clean up navigation-related resources
  }
}

// Navigation Loading Indicator
class NavigationLoadingIndicator extends StatelessWidget {
  const NavigationLoadingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
```

---

## 🔍 Migration Checklist

### **✅ Core Navigation Setup**
- [ ] Implement GoRouter with role-based routing trees
- [ ] Create MainNavigationShell with animation coordination
- [ ] Set up navigation state management with Riverpod
- [ ] Implement screen flip animation for role switching
- [ ] Create hybrid navigation (drawer + bottom tabs)

### **✅ Drawer Navigation**
- [ ] Build CustomDrawer with role-specific menu items
- [ ] Implement DrawerItemsBuilder for dynamic menu generation
- [ ] Create drawer animation and state coordination
- [ ] Add quick actions and settings sections
- [ ] Implement role switching from drawer

### **✅ Bottom Navigation**
- [ ] Create CustomBottomNavigation for travelers
- [ ] Implement tab state synchronization
- [ ] Add tab transition animations
- [ ] Coordinate with drawer navigation state
- [ ] Handle tab-specific routing

### **✅ Advanced Features**
- [ ] Implement search overlay with blur effects
- [ ] Create detail screen detection and fullscreen mode
- [ ] Add navigation history and back navigation
- [ ] Implement page transitions and animations
- [ ] Set up navigation analytics and monitoring

### **✅ State Integration**
- [ ] Connect navigation with user role state
- [ ] Implement navigation state persistence
- [ ] Create computed providers for navigation visibility
- [ ] Add navigation performance monitoring
- [ ] Implement error handling and fallbacks

### **✅ Testing & Quality**
- [ ] Write comprehensive navigation tests
- [ ] Create navigation test helpers
- [ ] Test role-based routing behavior
- [ ] Verify animation timing and coordination
- [ ] Performance test navigation transitions

---

## 🔍 Next Steps

1. **Implement core navigation system** with GoRouter and state management
2. **Create component architecture** (`07_core_components.md`)
3. **Define data models** (`06_data_models.md`)
4. **Implement animation system** (`10_animations.md`)
5. **Build role-specific features** (`11_traveler_features.md`)

---

*This comprehensive Flutter navigation system preserves all sophisticated features from the React implementation while leveraging Flutter's powerful routing capabilities and state management for better performance, maintainability, and user experience.*