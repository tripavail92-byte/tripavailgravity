# Flutter Role-Specific Features Implementation

## Executive Summary

This document defines the comprehensive role-specific feature implementation for TripAvail Flutter app, migrating the sophisticated React role-based architecture while adding Flutter-native capabilities. The system preserves all advanced features including traveler dashboards, hotel management workflows, tour operator tools, and complex verification systems while leveraging Flutter's performance benefits and native integration.

### Key Role Features to Migrate
- **Traveler Features**: Dashboard, profile management, trip planning, wishlist, booking management
- **Hotel Manager Features**: Property management, package creation, calendar management, verification workflows
- **Tour Operator Features**: Tour creation, itinerary management, scheduling, group management
- **Shared Features**: Verification system, messaging, reviews, settings with role-specific customization
- **Role Switching**: Seamless transitions with 3D flip animation and state preservation

---

## 🎭 Role Architecture Overview

### **Role-Based Feature Hierarchy**
```
TripAvail Role Features System
├── Core Role Infrastructure
│   ├── Role Manager & State
│   ├── Permission System
│   ├── Feature Flags & Access Control
│   └── Role Switching Logic
├── Traveler Features
│   ├── Home & Discovery Dashboard
│   ├── Profile & Account Management
│   ├── Trip Planning & Management
│   ├── Wishlist & Favorites
│   ├── Booking & Reservation System
│   └── Search & Filtering
├── Hotel Manager Features
│   ├── Property Management Dashboard
│   ├── Hotel Listing & Onboarding
│   ├── Room & Package Management
│   ├── Calendar & Availability
│   ├── Verification & Compliance
│   └── Analytics & Performance
├── Tour Operator Features
│   ├── Tour Creation & Management
│   ├── Itinerary Builder
│   ├── Group & Booking Management
│   ├── Guide Assignment
│   ├── Calendar & Scheduling
│   └── Performance Analytics
├── Shared Features
│   ├── Messaging System
│   ├── Review & Rating System
│   ├── Verification Workflows
│   ├── Payment Integration
│   ├── Settings & Preferences
│   └── Help & Support
└── Feature Integration
    ├── Cross-Role Interactions
    ├── Data Synchronization
    ├── Permission Validation
    └── Feature Analytics
```

### **Role Feature Matrix**
```dart
// Feature access matrix by role
enum RoleFeature {
  // Traveler Features
  travelerDashboard,
  tripPlanning,
  wishlistManagement,
  bookingHistory,
  searchAdvanced,
  
  // Hotel Manager Features
  propertyManagement,
  packageCreation,
  calendarManagement,
  guestCommunication,
  analyticsHotel,
  
  // Tour Operator Features
  tourCreation,
  itineraryBuilder,
  groupManagement,
  guideAssignment,
  analyticsTour,
  
  // Shared Features
  messaging,
  reviewSystem,
  verification,
  paymentManagement,
  profileSettings,
}
```

---

## 🏠 Traveler Features Implementation

### **Traveler Dashboard System**
```dart
// lib/features/traveler/dashboard/traveler_dashboard.dart
class TravelerDashboard extends StateAwareTripAvailWidget {
  const TravelerDashboard({super.key});

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    final user = ref.watch(currentUserProvider);
    final dashboardData = ref.watch(travelerDashboardProvider);
    
    return RefreshIndicator(
      onRefresh: () => ref.refresh(travelerDashboardProvider.future),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            _buildWelcomeSection(context, theme, user),
            const SizedBox(height: 24),
            
            // Search Section
            TripAvailSearchBar(
              onSearch: (filters) => _handleSearch(context, ref, filters),
              onSearchOverlayToggle: (isOpen, filters) => 
                _handleSearchOverlay(context, ref, isOpen, filters),
            ),
            const SizedBox(height: 24),
            
            // Quick Actions
            _buildQuickActions(context, ref, theme),
            const SizedBox(height: 24),
            
            // Recent Activity
            dashboardData.when(
              data: (data) => _buildDashboardContent(context, ref, theme, data),
              loading: () => _buildLoadingSkeleton(),
              error: (error, stack) => _buildErrorState(context, error),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildWelcomeSection(BuildContext context, ThemeData theme, User? user) {
    final timeOfDay = _getTimeOfDayGreeting();
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: theme.extension<AppGradients>()!.rosePrimary,
        borderRadius: BorderRadius.circular(16),
        boxShadow: theme.extension<AppShadows>()!.modern,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$timeOfDay, ${user?.name?.split(' ').first ?? 'Traveler'}!',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Where would you like to explore today?',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          ProfileAvatar(
            size: 60,
            user: user,
            showBorder: true,
          ),
        ],
      ),
    );
  }
  
  Widget _buildQuickActions(BuildContext context, WidgetRef ref, ThemeData theme) {
    final quickActions = [
      QuickActionItem(
        icon: Icons.flight_takeoff,
        title: 'Plan Trip',
        subtitle: 'Create new journey',
        color: Colors.blue,
        onTap: () => _navigateToTripPlanning(context, ref),
      ),
      QuickActionItem(
        icon: Icons.hotel,
        title: 'Find Hotels',
        subtitle: 'Best accommodations',
        color: Colors.green,
        onTap: () => _navigateToHotels(context, ref),
      ),
      QuickActionItem(
        icon: Icons.tour,
        title: 'Discover Tours',
        subtitle: 'Local experiences',
        color: Colors.orange,
        onTap: () => _navigateToTours(context, ref),
      ),
      QuickActionItem(
        icon: Icons.favorite,
        title: 'My Wishlist',
        subtitle: 'Saved destinations',
        color: Colors.red,
        onTap: () => _navigateToWishlist(context, ref),
      ),
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: quickActions.length,
          itemBuilder: (context, index) {
            return QuickActionCard(action: quickActions[index]);
          },
        ),
      ],
    );
  }
  
  Widget _buildDashboardContent(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    TravelerDashboardData data,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Recent Bookings
        if (data.recentBookings.isNotEmpty) ...[
          _buildSectionHeader(context, theme, 'Recent Bookings', 
            onViewAll: () => _navigateToBookings(context, ref)),
          const SizedBox(height: 16),
          SizedBox(
            height: 160,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: data.recentBookings.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: EdgeInsets.only(
                    right: index < data.recentBookings.length - 1 ? 16 : 0,
                  ),
                  child: BookingCard(
                    booking: data.recentBookings[index],
                    isHorizontal: true,
                    onTap: () => _navigateToBookingDetails(
                      context, ref, data.recentBookings[index].id),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 32),
        ],
        
        // Featured Destinations
        if (data.featuredDestinations.isNotEmpty) ...[
          _buildSectionHeader(context, theme, 'Featured Destinations'),
          const SizedBox(height: 16),
          StaggeredGridView(
            children: data.featuredDestinations.map((destination) {
              return DestinationCard(
                destination: destination,
                onTap: () => _navigateToDestination(context, ref, destination.id),
              );
            }).toList(),
          ),
          const SizedBox(height: 32),
        ],
        
        // Trending Tours
        if (data.trendingTours.isNotEmpty) ...[
          _buildSectionHeader(context, theme, 'Trending Tours',
            onViewAll: () => _navigateToTours(context, ref)),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: data.trendingTours.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: EdgeInsets.only(
                    right: index < data.trendingTours.length - 1 ? 16 : 0,
                  ),
                  child: TourCard(
                    tour: data.trendingTours[index],
                    width: 280,
                    onTap: () => _navigateToTourDetails(
                      context, ref, data.trendingTours[index].id),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 32),
        ],
        
        // Travel Stats
        TravelStatsSection(stats: data.travelStats),
      ],
    );
  }
  
  Widget _buildSectionHeader(
    BuildContext context,
    ThemeData theme,
    String title, {
    VoidCallback? onViewAll,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        if (onViewAll != null)
          TextButton(
            onPressed: onViewAll,
            child: Text(
              'View All',
              style: TextStyle(color: theme.primaryColor),
            ),
          ),
      ],
    );
  }
  
  Widget _buildLoadingSkeleton() {
    return Column(
      children: [
        LoadingCardSkeleton(height: 160),
        const SizedBox(height: 24),
        LoadingCardSkeleton(height: 120),
        const SizedBox(height: 24),
        LoadingCardSkeleton(height: 200),
      ],
    );
  }
  
  Widget _buildErrorState(BuildContext context, Object error) {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Unable to load dashboard',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Please check your connection and try again',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          GradientButton(
            text: 'Retry',
            onPressed: () => context.refresh(travelerDashboardProvider.future),
          ),
        ],
      ),
    );
  }
  
  String _getTimeOfDayGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
  
  void _handleSearch(BuildContext context, WidgetRef ref, SearchFilters filters) {
    context.goNamed('search-results', extra: filters);
  }
  
  void _handleSearchOverlay(BuildContext context, WidgetRef ref, bool isOpen, SearchFilters? filters) {
    ref.read(navigationStateProvider.notifier).setSearchOverlayOpen(isOpen);
  }
  
  void _navigateToTripPlanning(BuildContext context, WidgetRef ref) {
    context.goNamed('trip-planning');
  }
  
  void _navigateToHotels(BuildContext context, WidgetRef ref) {
    ref.read(navigationStateProvider.notifier).setActiveTab('hotels');
    context.goNamed('traveler-hotels');
  }
  
  void _navigateToTours(BuildContext context, WidgetRef ref) {
    ref.read(navigationStateProvider.notifier).setActiveTab('tours');
    context.goNamed('traveler-tours');
  }
  
  void _navigateToWishlist(BuildContext context, WidgetRef ref) {
    context.goNamed('traveler-wishlist');
  }
  
  void _navigateToBookings(BuildContext context, WidgetRef ref) {
    context.goNamed('bookings');
  }
  
  void _navigateToBookingDetails(BuildContext context, WidgetRef ref, String bookingId) {
    context.goNamed('booking-detail', pathParameters: {'bookingId': bookingId});
  }
  
  void _navigateToDestination(BuildContext context, WidgetRef ref, String destinationId) {
    context.goNamed('destination-detail', pathParameters: {'destinationId': destinationId});
  }
  
  void _navigateToTourDetails(BuildContext context, WidgetRef ref, String tourId) {
    context.goNamed('tour-detail', pathParameters: {'tourId': tourId});
  }
}

// Quick Action Components
class QuickActionCard extends TripAvailWidget {
  final QuickActionItem action;
  
  const QuickActionCard({required this.action, super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return HoverLiftEffect(
      child: GlassCard(
        onTap: action.onTap,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: action.color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                action.icon,
                color: action.color,
                size: 24,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              action.title,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              action.subtitle,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class QuickActionItem {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;
  
  const QuickActionItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });
}

// Data providers
final travelerDashboardProvider = FutureProvider<TravelerDashboardData>((ref) async {
  final dashboardService = ref.watch(dashboardServiceProvider);
  return await dashboardService.getTravelerDashboard();
});

@freezed
class TravelerDashboardData with _$TravelerDashboardData {
  const factory TravelerDashboardData({
    @Default([]) List<Booking> recentBookings,
    @Default([]) List<Destination> featuredDestinations,
    @Default([]) List<Tour> trendingTours,
    @Default([]) List<Package> recommendedPackages,
    required TravelStats travelStats,
  }) = _TravelerDashboardData;
}

@freezed
class TravelStats with _$TravelStats {
  const factory TravelStats({
    @Default(0) int totalTrips,
    @Default(0) int countriesVisited,
    @Default(0) int citiesExplored,
    @Default(0.0) double totalDistance,
    @Default(0) int rewardPoints,
    @Default('') String loyaltyTier,
  }) = _TravelStats;
}
```

### **Traveler Profile & Account Management**
```dart
// lib/features/traveler/profile/traveler_profile_screen.dart
class TravelerProfileScreen extends StateAwareTripAvailWidget {
  const TravelerProfileScreen({super.key});

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    final user = ref.watch(currentUserProvider);
    final profileData = ref.watch(travelerProfileProvider);
    
    return Scaffold(
      appBar: ThemedAppBar(
        title: 'My Profile',
        actions: [
          IconButton(
            onPressed: () => _navigateToSettings(context, ref),
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      body: profileData.when(
        data: (data) => _buildProfileContent(context, ref, theme, data),
        loading: () => _buildLoadingSkeleton(),
        error: (error, stack) => _buildErrorState(context, error),
      ),
    );
  }
  
  Widget _buildProfileContent(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    TravelerProfileData data,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Profile Header
          _buildProfileHeader(context, ref, theme, data.user),
          const SizedBox(height: 32),
          
          // Quick Stats
          _buildQuickStats(context, theme, data.stats),
          const SizedBox(height: 32),
          
          // Profile Sections
          _buildProfileSections(context, ref, theme, data),
        ],
      ),
    );
  }
  
  Widget _buildProfileHeader(BuildContext context, WidgetRef ref, ThemeData theme, User user) {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Profile Image
          Stack(
            children: [
              ProfileAvatar(
                size: 100,
                user: user,
                showBorder: true,
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: GestureDetector(
                  onTap: () => _changeProfileImage(context, ref),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: theme.primaryColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Icon(
                      Icons.camera_alt,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Name and Verification
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                user.name,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (user.isVerified) ...[
                const SizedBox(width: 8),
                VerificationBadge(isVerified: true),
              ],
            ],
          ),
          
          const SizedBox(height: 8),
          
          // Email and Location
          Text(
            user.email,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          
          if (user.location?.isNotEmpty == true) ...[
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 16,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  user.location!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
          
          const SizedBox(height: 16),
          
          // Member Since
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: theme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Member since ${DateFormat('MMMM yyyy').format(user.createdAt)}',
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.primaryColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Edit Profile Button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _navigateToEditProfile(context, ref),
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Edit Profile'),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildQuickStats(BuildContext context, ThemeData theme, TravelStats stats) {
    final statItems = [
      StatItem(
        icon: Icons.flight_takeoff,
        value: stats.totalTrips.toString(),
        label: 'Trips',
        color: Colors.blue,
      ),
      StatItem(
        icon: Icons.public,
        value: stats.countriesVisited.toString(),
        label: 'Countries',
        color: Colors.green,
      ),
      StatItem(
        icon: Icons.location_city,
        value: stats.citiesExplored.toString(),
        label: 'Cities',
        color: Colors.orange,
      ),
      StatItem(
        icon: Icons.stars,
        value: '${stats.rewardPoints}',
        label: 'Points',
        color: Colors.purple,
      ),
    ];
    
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.8,
      ),
      itemCount: statItems.length,
      itemBuilder: (context, index) {
        return StatCard(stat: statItems[index]);
      },
    );
  }
  
  Widget _buildProfileSections(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    TravelerProfileData data,
  ) {
    final sections = [
      ProfileSection(
        icon: Icons.person_outline,
        title: 'Account Information',
        subtitle: 'Personal details and preferences',
        onTap: () => _navigateToAccountInfo(context, ref),
      ),
      ProfileSection(
        icon: Icons.credit_card_outlined,
        title: 'Payment Methods',
        subtitle: 'Manage cards and payment options',
        onTap: () => _navigateToPaymentMethods(context, ref),
      ),
      ProfileSection(
        icon: Icons.security_outlined,
        title: 'Security Settings',
        subtitle: 'Password and verification',
        onTap: () => _navigateToSecurity(context, ref),
      ),
      ProfileSection(
        icon: Icons.notifications_outlined,
        title: 'Notifications',
        subtitle: 'Manage your notification preferences',
        onTap: () => _navigateToNotifications(context, ref),
      ),
      ProfileSection(
        icon: Icons.favorite_outline,
        title: 'My Wishlist',
        subtitle: '${data.wishlistCount} saved destinations',
        onTap: () => _navigateToWishlist(context, ref),
      ),
      ProfileSection(
        icon: Icons.card_travel_outlined,
        title: 'My Trips',
        subtitle: '${data.tripCount} trips planned',
        onTap: () => _navigateToTrips(context, ref),
      ),
      ProfileSection(
        icon: Icons.star_outline,
        title: 'Reviews',
        subtitle: '${data.reviewCount} reviews written',
        onTap: () => _navigateToReviews(context, ref),
      ),
      ProfileSection(
        icon: Icons.help_outline,
        title: 'Help & Support',
        subtitle: 'Get help and contact support',
        onTap: () => _navigateToHelp(context, ref),
      ),
    ];
    
    return Column(
      children: sections.map((section) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: ProfileSectionCard(section: section),
        );
      }).toList(),
    );
  }
  
  Widget _buildLoadingSkeleton() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          LoadingCardSkeleton(height: 200),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.8,
            ),
            itemCount: 4,
            itemBuilder: (context, index) {
              return LoadingCardSkeleton(height: 80);
            },
          ),
          const SizedBox(height: 24),
          ...List.generate(6, (index) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: LoadingCardSkeleton(height: 70),
          )),
        ],
      ),
    );
  }
  
  Widget _buildErrorState(BuildContext context, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Unable to load profile',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 16),
          GradientButton(
            text: 'Retry',
            onPressed: () => context.refresh(travelerProfileProvider.future),
          ),
        ],
      ),
    );
  }
  
  void _changeProfileImage(BuildContext context, WidgetRef ref) {
    // Implementation for changing profile image
  }
  
  void _navigateToEditProfile(BuildContext context, WidgetRef ref) {
    context.goNamed('edit-profile');
  }
  
  void _navigateToSettings(BuildContext context, WidgetRef ref) {
    context.goNamed('settings');
  }
  
  void _navigateToAccountInfo(BuildContext context, WidgetRef ref) {
    context.goNamed('traveler-account-info');
  }
  
  void _navigateToPaymentMethods(BuildContext context, WidgetRef ref) {
    context.goNamed('payment-methods');
  }
  
  void _navigateToSecurity(BuildContext context, WidgetRef ref) {
    context.goNamed('security-settings');
  }
  
  void _navigateToNotifications(BuildContext context, WidgetRef ref) {
    context.goNamed('notification-settings');
  }
  
  void _navigateToWishlist(BuildContext context, WidgetRef ref) {
    context.goNamed('traveler-wishlist');
  }
  
  void _navigateToTrips(BuildContext context, WidgetRef ref) {
    context.goNamed('traveler-trips');
  }
  
  void _navigateToReviews(BuildContext context, WidgetRef ref) {
    context.goNamed('reviews');
  }
  
  void _navigateToHelp(BuildContext context, WidgetRef ref) {
    context.goNamed('help');
  }
}

// Profile section components
class ProfileSectionCard extends TripAvailWidget {
  final ProfileSection section;
  
  const ProfileSectionCard({required this.section, super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return GlassCard(
      onTap: section.onTap,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: theme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              section.icon,
              color: theme.primaryColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  section.title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  section.subtitle,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.arrow_forward_ios,
            size: 16,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ],
      ),
    );
  }
}

class StatCard extends TripAvailWidget {
  final StatItem stat;
  
  const StatCard({required this.stat, super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            stat.icon,
            color: stat.color,
            size: 24,
          ),
          const SizedBox(height: 8),
          Text(
            stat.value,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: stat.color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            stat.label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class ProfileSection {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  
  const ProfileSection({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });
}

class StatItem {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  
  const StatItem({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });
}

// Data providers
final travelerProfileProvider = FutureProvider<TravelerProfileData>((ref) async {
  final profileService = ref.watch(profileServiceProvider);
  return await profileService.getTravelerProfile();
});

@freezed
class TravelerProfileData with _$TravelerProfileData {
  const factory TravelerProfileData({
    required User user,
    required TravelStats stats,
    @Default(0) int wishlistCount,
    @Default(0) int tripCount,
    @Default(0) int reviewCount,
  }) = _TravelerProfileData;
}
```

---

## 🏨 Hotel Manager Features Implementation

### **Hotel Manager Dashboard**
```dart
// lib/features/hotel_manager/dashboard/hotel_manager_dashboard.dart
class HotelManagerDashboard extends StateAwareTripAvailWidget {
  const HotelManagerDashboard({super.key});

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    final dashboardData = ref.watch(hotelManagerDashboardProvider);
    final user = ref.watch(currentUserProvider);
    
    return RefreshIndicator(
      onRefresh: () => ref.refresh(hotelManagerDashboardProvider.future),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            _buildWelcomeHeader(context, theme, user),
            const SizedBox(height: 24),
            
            // Dashboard Content
            dashboardData.when(
              data: (data) => _buildDashboardContent(context, ref, theme, data),
              loading: () => _buildLoadingSkeleton(),
              error: (error, stack) => _buildErrorState(context, error),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildWelcomeHeader(BuildContext context, ThemeData theme, User? user) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: theme.extension<AppGradients>()!.partner,
        borderRadius: BorderRadius.circular(16),
        boxShadow: theme.extension<AppShadows>()!.modern,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hotel Manager Portal',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Manage your properties and grow your business',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Icon(
              Icons.business,
              color: Colors.white,
              size: 30,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildDashboardContent(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    HotelManagerDashboardData data,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Quick Actions
        _buildQuickActions(context, ref, theme),
        const SizedBox(height: 32),
        
        // Key Metrics
        _buildKeyMetrics(context, theme, data.metrics),
        const SizedBox(height: 32),
        
        // Properties Overview
        _buildPropertiesOverview(context, ref, theme, data.properties),
        const SizedBox(height: 32),
        
        // Recent Activity
        _buildRecentActivity(context, ref, theme, data.recentActivity),
        const SizedBox(height: 32),
        
        // Performance Charts
        _buildPerformanceCharts(context, theme, data.analytics),
      ],
    );
  }
  
  Widget _buildQuickActions(BuildContext context, WidgetRef ref, ThemeData theme) {
    final quickActions = [
      QuickActionItem(
        icon: Icons.add_business,
        title: 'List Property',
        subtitle: 'Add new hotel',
        color: Colors.blue,
        onTap: () => _navigateToListProperty(context, ref),
      ),
      QuickActionItem(
        icon: Icons.inventory_2,
        title: 'Create Package',
        subtitle: 'New travel package',
        color: Colors.green,
        onTap: () => _navigateToCreatePackage(context, ref),
      ),
      QuickActionItem(
        icon: Icons.calendar_today,
        title: 'Manage Calendar',
        subtitle: 'Availability & rates',
        color: Colors.orange,
        onTap: () => _navigateToCalendar(context, ref),
      ),
      QuickActionItem(
        icon: Icons.analytics,
        title: 'Analytics',
        subtitle: 'Performance insights',
        color: Colors.purple,
        onTap: () => _navigateToAnalytics(context, ref),
      ),
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: quickActions.length,
          itemBuilder: (context, index) {
            return QuickActionCard(action: quickActions[index]);
          },
        ),
      ],
    );
  }
  
  Widget _buildKeyMetrics(BuildContext context, ThemeData theme, HotelMetrics metrics) {
    final metricItems = [
      MetricItem(
        title: 'Total Properties',
        value: metrics.totalProperties.toString(),
        change: '+${metrics.propertiesGrowth}%',
        isPositive: metrics.propertiesGrowth >= 0,
        icon: Icons.business,
      ),
      MetricItem(
        title: 'Active Bookings',
        value: metrics.activeBookings.toString(),
        change: '${metrics.bookingsChange >= 0 ? '+' : ''}${metrics.bookingsChange}%',
        isPositive: metrics.bookingsChange >= 0,
        icon: Icons.event_available,
      ),
      MetricItem(
        title: 'Monthly Revenue',
        value: '\$${metrics.monthlyRevenue.toStringAsFixed(0)}',
        change: '${metrics.revenueChange >= 0 ? '+' : ''}${metrics.revenueChange.toStringAsFixed(1)}%',
        isPositive: metrics.revenueChange >= 0,
        icon: Icons.monetization_on,
      ),
      MetricItem(
        title: 'Occupancy Rate',
        value: '${metrics.occupancyRate.toStringAsFixed(1)}%',
        change: '${metrics.occupancyChange >= 0 ? '+' : ''}${metrics.occupancyChange.toStringAsFixed(1)}%',
        isPositive: metrics.occupancyChange >= 0,
        icon: Icons.hotel,
      ),
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Key Metrics',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.3,
          ),
          itemCount: metricItems.length,
          itemBuilder: (context, index) {
            return MetricCard(metric: metricItems[index]);
          },
        ),
      ],
    );
  }
  
  Widget _buildPropertiesOverview(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    List<Property> properties,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Your Properties',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            TextButton(
              onPressed: () => _navigateToProperties(context, ref),
              child: Text(
                'View All',
                style: TextStyle(color: theme.primaryColor),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (properties.isEmpty)
          _buildEmptyProperties(context, ref, theme)
        else
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: properties.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: EdgeInsets.only(
                    right: index < properties.length - 1 ? 16 : 0,
                  ),
                  child: PropertyCard(
                    property: properties[index],
                    width: 280,
                    onTap: () => _navigateToPropertyDetails(
                      context, ref, properties[index].id),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
  
  Widget _buildEmptyProperties(BuildContext context, WidgetRef ref, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.2),
          style: BorderStyle.solid,
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.business_outlined,
            size: 48,
            color: theme.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            'No Properties Listed',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start by listing your first property to begin receiving bookings',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          GradientButton(
            text: 'List Your First Property',
            onPressed: () => _navigateToListProperty(context, ref),
            gradientType: GradientType.partner,
          ),
        ],
      ),
    );
  }
  
  Widget _buildRecentActivity(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    List<ActivityItem> activities,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activity',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        ...activities.take(5).map((activity) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ActivityCard(activity: activity),
          );
        }).toList(),
        if (activities.length > 5)
          TextButton(
            onPressed: () => _navigateToAllActivity(context, ref),
            child: Text(
              'View All Activity',
              style: TextStyle(color: theme.primaryColor),
            ),
          ),
      ],
    );
  }
  
  Widget _buildPerformanceCharts(
    BuildContext context,
    ThemeData theme,
    HotelAnalytics analytics,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Performance Analytics',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        // Revenue Chart
        GlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Revenue Trend',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 200,
                child: LineChart(
                  LineChartData(
                    lineBarsData: [
                      LineChartBarData(
                        spots: analytics.revenueData.asMap().entries.map((e) {
                          return FlSpot(e.key.toDouble(), e.value);
                        }).toList(),
                        isCurved: true,
                        color: theme.primaryColor,
                        dotData: FlDotData(show: false),
                        belowBarData: BarAreaData(
                          show: true,
                          color: theme.primaryColor.withOpacity(0.1),
                        ),
                      ),
                    ],
                    titlesData: FlTitlesData(show: false),
                    borderData: FlBorderData(show: false),
                    gridData: FlGridData(show: false),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildLoadingSkeleton() {
    return Column(
      children: [
        LoadingCardSkeleton(height: 120),
        const SizedBox(height: 24),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: 4,
          itemBuilder: (context, index) {
            return LoadingCardSkeleton(height: 100);
          },
        ),
        const SizedBox(height: 24),
        LoadingCardSkeleton(height: 200),
      ],
    );
  }
  
  Widget _buildErrorState(BuildContext context, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Unable to load dashboard',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 16),
          GradientButton(
            text: 'Retry',
            onPressed: () => context.refresh(hotelManagerDashboardProvider.future),
          ),
        ],
      ),
    );
  }
  
  void _navigateToListProperty(BuildContext context, WidgetRef ref) {
    context.goNamed('list-hotel');
  }
  
  void _navigateToCreatePackage(BuildContext context, WidgetRef ref) {
    context.goNamed('create-package');
  }
  
  void _navigateToCalendar(BuildContext context, WidgetRef ref) {
    context.goNamed('hotel-manager-calendar');
  }
  
  void _navigateToAnalytics(BuildContext context, WidgetRef ref) {
    context.goNamed('hotel-analytics');
  }
  
  void _navigateToProperties(BuildContext context, WidgetRef ref) {
    context.goNamed('hotel-manager-properties');
  }
  
  void _navigateToPropertyDetails(BuildContext context, WidgetRef ref, String propertyId) {
    context.goNamed('property-detail', pathParameters: {'propertyId': propertyId});
  }
  
  void _navigateToAllActivity(BuildContext context, WidgetRef ref) {
    context.goNamed('hotel-activity');
  }
}

// Hotel Manager specific components
class MetricCard extends TripAvailWidget {
  final MetricItem metric;
  
  const MetricCard({required this.metric, super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                metric.icon,
                color: theme.primaryColor,
                size: 20,
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: metric.isPositive ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  metric.change,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: metric.isPositive ? Colors.green : Colors.red,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            metric.value,
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            metric.title,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class ActivityCard extends TripAvailWidget {
  final ActivityItem activity;
  
  const ActivityCard({required this.activity, super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: activity.type.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(
              activity.type.icon,
              color: activity.type.color,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  activity.description,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Text(
            activity.timeAgo,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

// Data models
class MetricItem {
  final String title;
  final String value;
  final String change;
  final bool isPositive;
  final IconData icon;
  
  const MetricItem({
    required this.title,
    required this.value,
    required this.change,
    required this.isPositive,
    required this.icon,
  });
}

@freezed
class HotelManagerDashboardData with _$HotelManagerDashboardData {
  const factory HotelManagerDashboardData({
    required HotelMetrics metrics,
    @Default([]) List<Property> properties,
    @Default([]) List<ActivityItem> recentActivity,
    required HotelAnalytics analytics,
  }) = _HotelManagerDashboardData;
}

@freezed
class HotelMetrics with _$HotelMetrics {
  const factory HotelMetrics({
    @Default(0) int totalProperties,
    @Default(0) int activeBookings,
    @Default(0.0) double monthlyRevenue,
    @Default(0.0) double occupancyRate,
    @Default(0.0) double propertiesGrowth,
    @Default(0.0) double bookingsChange,
    @Default(0.0) double revenueChange,
    @Default(0.0) double occupancyChange,
  }) = _HotelMetrics;
}

@freezed
class HotelAnalytics with _$HotelAnalytics {
  const factory HotelAnalytics({
    @Default([]) List<double> revenueData,
    @Default([]) List<double> occupancyData,
    @Default([]) List<double> bookingData,
  }) = _HotelAnalytics;
}

@freezed
class ActivityItem with _$ActivityItem {
  const factory ActivityItem({
    required String id,
    required String title,
    required String description,
    required ActivityType type,
    required DateTime timestamp,
  }) = _ActivityItem;
  
  const ActivityItem._();
  
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}

enum ActivityType {
  booking(Icons.event_available, Colors.green),
  cancellation(Icons.event_busy, Colors.red),
  payment(Icons.payment, Colors.blue),
  review(Icons.star, Colors.orange),
  message(Icons.message, Colors.purple);
  
  const ActivityType(this.icon, this.color);
  
  final IconData icon;
  final Color color;
}

// Data providers
final hotelManagerDashboardProvider = FutureProvider<HotelManagerDashboardData>((ref) async {
  final dashboardService = ref.watch(dashboardServiceProvider);
  return await dashboardService.getHotelManagerDashboard();
});
```

### **Property Management System**
```dart
// lib/features/hotel_manager/property/property_management_screen.dart
class PropertyManagementScreen extends StateAwareTripAvailWidget {
  const PropertyManagementScreen({super.key});

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    final properties = ref.watch(userPropertiesProvider);
    
    return Scaffold(
      appBar: ThemedAppBar(
        title: 'My Properties',
        actions: [
          IconButton(
            onPressed: () => _navigateToAddProperty(context, ref),
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: properties.when(
        data: (data) => _buildPropertiesContent(context, ref, theme, data),
        loading: () => _buildLoadingSkeleton(),
        error: (error, stack) => _buildErrorState(context, error),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _navigateToAddProperty(context, ref),
        icon: const Icon(Icons.add_business),
        label: const Text('Add Property'),
        backgroundColor: theme.primaryColor,
        foregroundColor: Colors.white,
      ),
    );
  }
  
  Widget _buildPropertiesContent(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    List<Property> properties,
  ) {
    if (properties.isEmpty) {
      return _buildEmptyState(context, ref, theme);
    }
    
    return RefreshIndicator(
      onRefresh: () => ref.refresh(userPropertiesProvider.future),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: properties.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: PropertyManagementCard(
              property: properties[index],
              onTap: () => _navigateToPropertyDetails(context, ref, properties[index].id),
              onEdit: () => _navigateToEditProperty(context, ref, properties[index].id),
              onToggleStatus: () => _togglePropertyStatus(context, ref, properties[index]),
            ),
          );
        },
      ),
    );
  }
  
  Widget _buildEmptyState(BuildContext context, WidgetRef ref, ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.business_outlined,
              size: 80,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 24),
            Text(
              'No Properties Listed',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Start by adding your first property to begin receiving bookings and managing your hospitality business.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 32),
            GradientButton(
              text: 'Add Your First Property',
              onPressed: () => _navigateToAddProperty(context, ref),
              gradientType: GradientType.partner,
              icon: Icons.add_business,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildLoadingSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: LoadingCardSkeleton(height: 180),
        );
      },
    );
  }
  
  Widget _buildErrorState(BuildContext context, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Unable to load properties',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 16),
          GradientButton(
            text: 'Retry',
            onPressed: () => context.refresh(userPropertiesProvider.future),
          ),
        ],
      ),
    );
  }
  
  void _navigateToAddProperty(BuildContext context, WidgetRef ref) {
    context.goNamed('list-hotel');
  }
  
  void _navigateToPropertyDetails(BuildContext context, WidgetRef ref, String propertyId) {
    context.goNamed('property-detail', pathParameters: {'propertyId': propertyId});
  }
  
  void _navigateToEditProperty(BuildContext context, WidgetRef ref, String propertyId) {
    context.goNamed('edit-property', pathParameters: {'propertyId': propertyId});
  }
  
  void _togglePropertyStatus(BuildContext context, WidgetRef ref, Property property) async {
    try {
      final propertyService = ref.read(propertyServiceProvider);
      await propertyService.togglePropertyStatus(property.id, !property.isActive);
      
      // Refresh the properties list
      ref.invalidate(userPropertiesProvider);
      
      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            property.isActive 
                ? 'Property deactivated successfully'
                : 'Property activated successfully',
          ),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to update property status: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

class PropertyManagementCard extends TripAvailWidget {
  final Property property;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onToggleStatus;
  
  const PropertyManagementCard({
    required this.property,
    required this.onTap,
    required this.onEdit,
    required this.onToggleStatus,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return GlassCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          // Property Image
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: Stack(
              children: [
                Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceVariant,
                  ),
                  child: property.images.isNotEmpty
                      ? Image.network(
                          property.images.first.url,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Icon(
                              Icons.business,
                              size: 48,
                              color: theme.colorScheme.onSurfaceVariant,
                            );
                          },
                        )
                      : Icon(
                          Icons.business,
                          size: 48,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: property.isActive ? Colors.green : Colors.red,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      property.isActive ? 'Active' : 'Inactive',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                if (property.isFeatured)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Featured',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          
          // Property Details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            property.name,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(
                                Icons.location_on_outlined,
                                size: 16,
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  property.location.shortAddress,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (property.isVerified)
                      VerificationBadge(isVerified: true),
                  ],
                ),
                
                const SizedBox(height: 12),
                
                // Property Stats
                Row(
                  children: [
                    _buildStat(context, theme, Icons.star, property.rating.toStringAsFixed(1)),
                    const SizedBox(width: 16),
                    _buildStat(context, theme, Icons.reviews_outlined, property.reviewCount.toString()),
                    const SizedBox(width: 16),
                    _buildStat(context, theme, Icons.bed_outlined, '${property.totalRooms} rooms'),
                    const Spacer(),
                    Text(
                      property.priceRange,
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: theme.primaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: onEdit,
                        icon: const Icon(Icons.edit_outlined, size: 16),
                        label: const Text('Edit'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: onToggleStatus,
                        icon: Icon(
                          property.isActive ? Icons.pause : Icons.play_arrow,
                          size: 16,
                        ),
                        label: Text(property.isActive ? 'Deactivate' : 'Activate'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildStat(BuildContext context, ThemeData theme, IconData icon, String value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 16,
          color: theme.colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 4),
        Text(
          value,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

// Data providers
final userPropertiesProvider = FutureProvider<List<Property>>((ref) async {
  final propertyService = ref.watch(propertyServiceProvider);
  return await propertyService.getUserProperties();
});
```

---

## 🚌 Tour Operator Features Implementation

### **Tour Operator Dashboard**
```dart
// lib/features/tour_operator/dashboard/tour_operator_dashboard.dart
class TourOperatorDashboard extends StateAwareTripAvailWidget {
  const TourOperatorDashboard({super.key});

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    final dashboardData = ref.watch(tourOperatorDashboardProvider);
    final user = ref.watch(currentUserProvider);
    
    return RefreshIndicator(
      onRefresh: () => ref.refresh(tourOperatorDashboardProvider.future),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            _buildWelcomeHeader(context, theme, user),
            const SizedBox(height: 24),
            
            // Dashboard Content
            dashboardData.when(
              data: (data) => _buildDashboardContent(context, ref, theme, data),
              loading: () => _buildLoadingSkeleton(),
              error: (error, stack) => _buildErrorState(context, error),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildWelcomeHeader(BuildContext context, ThemeData theme, User? user) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: theme.extension<AppGradients>()!.partner,
        borderRadius: BorderRadius.circular(16),
        boxShadow: theme.extension<AppShadows>()!.modern,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tour Operator Hub',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Create experiences and manage tours',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Icon(
              Icons.tour,
              color: Colors.white,
              size: 30,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildDashboardContent(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    TourOperatorDashboardData data,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Quick Actions
        _buildQuickActions(context, ref, theme),
        const SizedBox(height: 32),
        
        // Key Metrics
        _buildKeyMetrics(context, theme, data.metrics),
        const SizedBox(height: 32),
        
        // Tours Overview
        _buildToursOverview(context, ref, theme, data.tours),
        const SizedBox(height: 32),
        
        // Upcoming Tours
        _buildUpcomingTours(context, ref, theme, data.upcomingTours),
        const SizedBox(height: 32),
        
        // Performance Analytics
        _buildPerformanceAnalytics(context, theme, data.analytics),
      ],
    );
  }
  
  Widget _buildQuickActions(BuildContext context, WidgetRef ref, ThemeData theme) {
    final quickActions = [
      QuickActionItem(
        icon: Icons.add_location_alt,
        title: 'Create Tour',
        subtitle: 'New experience',
        color: Colors.blue,
        onTap: () => _navigateToCreateTour(context, ref),
      ),
      QuickActionItem(
        icon: Icons.calendar_today,
        title: 'Manage Calendar',
        subtitle: 'Schedule tours',
        color: Colors.green,
        onTap: () => _navigateToCalendar(context, ref),
      ),
      QuickActionItem(
        icon: Icons.group,
        title: 'Manage Groups',
        subtitle: 'Tour bookings',
        color: Colors.orange,
        onTap: () => _navigateToGroups(context, ref),
      ),
      QuickActionItem(
        icon: Icons.analytics,
        title: 'Analytics',
        subtitle: 'Performance insights',
        color: Colors.purple,
        onTap: () => _navigateToAnalytics(context, ref),
      ),
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: quickActions.length,
          itemBuilder: (context, index) {
            return QuickActionCard(action: quickActions[index]);
          },
        ),
      ],
    );
  }
  
  Widget _buildKeyMetrics(BuildContext context, ThemeData theme, TourOperatorMetrics metrics) {
    final metricItems = [
      MetricItem(
        title: 'Active Tours',
        value: metrics.activeTours.toString(),
        change: '+${metrics.toursGrowth}%',
        isPositive: metrics.toursGrowth >= 0,
        icon: Icons.tour,
      ),
      MetricItem(
        title: 'Total Bookings',
        value: metrics.totalBookings.toString(),
        change: '${metrics.bookingsChange >= 0 ? '+' : ''}${metrics.bookingsChange}%',
        isPositive: metrics.bookingsChange >= 0,
        icon: Icons.event_available,
      ),
      MetricItem(
        title: 'Monthly Revenue',
        value: '\$${metrics.monthlyRevenue.toStringAsFixed(0)}',
        change: '${metrics.revenueChange >= 0 ? '+' : ''}${metrics.revenueChange.toStringAsFixed(1)}%',
        isPositive: metrics.revenueChange >= 0,
        icon: Icons.monetization_on,
      ),
      MetricItem(
        title: 'Average Rating',
        value: metrics.averageRating.toStringAsFixed(1),
        change: '${metrics.ratingChange >= 0 ? '+' : ''}${metrics.ratingChange.toStringAsFixed(1)}',
        isPositive: metrics.ratingChange >= 0,
        icon: Icons.star,
      ),
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Key Metrics',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.3,
          ),
          itemCount: metricItems.length,
          itemBuilder: (context, index) {
            return MetricCard(metric: metricItems[index]);
          },
        ),
      ],
    );
  }
  
  Widget _buildToursOverview(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    List<Tour> tours,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Your Tours',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            TextButton(
              onPressed: () => _navigateToTours(context, ref),
              child: Text(
                'View All',
                style: TextStyle(color: theme.primaryColor),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (tours.isEmpty)
          _buildEmptyTours(context, ref, theme)
        else
          SizedBox(
            height: 220,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: tours.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: EdgeInsets.only(
                    right: index < tours.length - 1 ? 16 : 0,
                  ),
                  child: TourCard(
                    tour: tours[index],
                    width: 280,
                    onTap: () => _navigateToTourDetails(
                      context, ref, tours[index].id),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
  
  Widget _buildEmptyTours(BuildContext context, WidgetRef ref, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.2),
          style: BorderStyle.solid,
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.tour_outlined,
            size: 48,
            color: theme.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            'No Tours Created',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start by creating your first tour to begin offering experiences to travelers',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          GradientButton(
            text: 'Create Your First Tour',
            onPressed: () => _navigateToCreateTour(context, ref),
            gradientType: GradientType.partner,
          ),
        ],
      ),
    );
  }
  
  Widget _buildUpcomingTours(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    List<TourSchedule> upcomingTours,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Upcoming Tours',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        if (upcomingTours.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.event_note,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 16),
                Text(
                  'No upcoming tours scheduled',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          )
        else
          ...upcomingTours.take(3).map((schedule) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: TourScheduleCard(
                schedule: schedule,
                onTap: () => _navigateToTourSchedule(context, ref, schedule.id),
              ),
            );
          }).toList(),
      ],
    );
  }
  
  Widget _buildPerformanceAnalytics(
    BuildContext context,
    ThemeData theme,
    TourOperatorAnalytics analytics,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Performance Analytics',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        GlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Booking Trend',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 200,
                child: LineChart(
                  LineChartData(
                    lineBarsData: [
                      LineChartBarData(
                        spots: analytics.bookingData.asMap().entries.map((e) {
                          return FlSpot(e.key.toDouble(), e.value);
                        }).toList(),
                        isCurved: true,
                        color: theme.primaryColor,
                        dotData: FlDotData(show: false),
                        belowBarData: BarAreaData(
                          show: true,
                          color: theme.primaryColor.withOpacity(0.1),
                        ),
                      ),
                    ],
                    titlesData: FlTitlesData(show: false),
                    borderData: FlBorderData(show: false),
                    gridData: FlGridData(show: false),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildLoadingSkeleton() {
    return Column(
      children: [
        LoadingCardSkeleton(height: 120),
        const SizedBox(height: 24),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: 4,
          itemBuilder: (context, index) {
            return LoadingCardSkeleton(height: 100);
          },
        ),
        const SizedBox(height: 24),
        LoadingCardSkeleton(height: 220),
      ],
    );
  }
  
  Widget _buildErrorState(BuildContext context, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Unable to load dashboard',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 16),
          GradientButton(
            text: 'Retry',
            onPressed: () => context.refresh(tourOperatorDashboardProvider.future),
          ),
        ],
      ),
    );
  }
  
  void _navigateToCreateTour(BuildContext context, WidgetRef ref) {
    context.goNamed('create-tour');
  }
  
  void _navigateToCalendar(BuildContext context, WidgetRef ref) {
    context.goNamed('tour-operator-calendar');
  }
  
  void _navigateToGroups(BuildContext context, WidgetRef ref) {
    context.goNamed('tour-groups');
  }
  
  void _navigateToAnalytics(BuildContext context, WidgetRef ref) {
    context.goNamed('tour-analytics');
  }
  
  void _navigateToTours(BuildContext context, WidgetRef ref) {
    context.goNamed('tour-operator-tours');
  }
  
  void _navigateToTourDetails(BuildContext context, WidgetRef ref, String tourId) {
    context.goNamed('tour-detail', pathParameters: {'tourId': tourId});
  }
  
  void _navigateToTourSchedule(BuildContext context, WidgetRef ref, String scheduleId) {
    context.goNamed('tour-schedule', pathParameters: {'scheduleId': scheduleId});
  }
}

// Tour Operator specific components
class TourScheduleCard extends TripAvailWidget {
  final TourSchedule schedule;
  final VoidCallback onTap;
  
  const TourScheduleCard({
    required this.schedule,
    required this.onTap,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: theme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  DateFormat('MMM').format(schedule.date),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.primaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  DateFormat('dd').format(schedule.date),
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.primaryColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tour Schedule',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${schedule.startTime.format(context)} - ${schedule.endTime.format(context)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${schedule.totalSpots - schedule.availableSpots}/${schedule.totalSpots} booked',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 60,
            height: 60,
            child: CircularProgressIndicator(
              value: schedule.occupancyRate,
              backgroundColor: theme.colorScheme.surfaceVariant,
              valueColor: AlwaysStoppedAnimation<Color>(
                schedule.occupancyRate > 0.8 ? Colors.green : theme.primaryColor,
              ),
              strokeWidth: 4,
            ),
          ),
        ],
      ),
    );
  }
}

// Data models
@freezed
class TourOperatorDashboardData with _$TourOperatorDashboardData {
  const factory TourOperatorDashboardData({
    required TourOperatorMetrics metrics,
    @Default([]) List<Tour> tours,
    @Default([]) List<TourSchedule> upcomingTours,
    required TourOperatorAnalytics analytics,
  }) = _TourOperatorDashboardData;
}

@freezed
class TourOperatorMetrics with _$TourOperatorMetrics {
  const factory TourOperatorMetrics({
    @Default(0) int activeTours,
    @Default(0) int totalBookings,
    @Default(0.0) double monthlyRevenue,
    @Default(0.0) double averageRating,
    @Default(0.0) double toursGrowth,
    @Default(0.0) double bookingsChange,
    @Default(0.0) double revenueChange,
    @Default(0.0) double ratingChange,
  }) = _TourOperatorMetrics;
}

@freezed
class TourOperatorAnalytics with _$TourOperatorAnalytics {
  const factory TourOperatorAnalytics({
    @Default([]) List<double> bookingData,
    @Default([]) List<double> revenueData,
    @Default([]) List<double> ratingData,
  }) = _TourOperatorAnalytics;
}

// Data providers
final tourOperatorDashboardProvider = FutureProvider<TourOperatorDashboardData>((ref) async {
  final dashboardService = ref.watch(dashboardServiceProvider);
  return await dashboardService.getTourOperatorDashboard();
});
```

---

## 🔄 Role Switching & State Management

### **Role Switching Manager**
```dart
// lib/core/role/role_switching_manager.dart
class RoleSwitchingManager {
  final StateNotifierProviderRef ref;
  
  RoleSwitchingManager(this.ref);
  
  // Switch to partner mode with animation
  Future<void> switchToPartnerMode(UserRole newRole) async {
    // Start flip animation
    ref.read(navigationStateProvider.notifier).startFlipAnimation();
    
    // Update user role
    await ref.read(userRoleProvider.notifier).switchRole(newRole);
    
    // Clear role-specific cached data
    await _clearRoleSpecificCache();
    
    // Preload new role data
    await _preloadRoleData(newRole);
    
    // Update navigation state
    ref.read(navigationStateProvider.notifier).updateForRole(newRole);
    
    // Complete animation
    await Future.delayed(const Duration(milliseconds: 800));
    ref.read(navigationStateProvider.notifier).stopFlipAnimation();
  }
  
  // Switch to traveler mode
  Future<void> switchToTravelerMode() async {
    // Start flip animation
    ref.read(navigationStateProvider.notifier).startFlipAnimation();
    
    // Update user role
    await ref.read(userRoleProvider.notifier).switchRole(UserRole.traveler);
    
    // Clear role-specific cached data
    await _clearRoleSpecificCache();
    
    // Preload traveler data
    await _preloadRoleData(UserRole.traveler);
    
    // Update navigation state
    ref.read(navigationStateProvider.notifier).updateForRole(UserRole.traveler);
    
    // Complete animation
    await Future.delayed(const Duration(milliseconds: 800));
    ref.read(navigationStateProvider.notifier).stopFlipAnimation();
  }
  
  // Clear role-specific cached data
  Future<void> _clearRoleSpecificCache() async {
    // Clear dashboard data
    ref.invalidate(travelerDashboardProvider);
    ref.invalidate(hotelManagerDashboardProvider);
    ref.invalidate(tourOperatorDashboardProvider);
    
    // Clear role-specific providers
    ref.invalidate(userPropertiesProvider);
    ref.invalidate(userToursProvider);
    ref.invalidate(travelerProfileProvider);
  }
  
  // Preload data for new role
  Future<void> _preloadRoleData(UserRole role) async {
    switch (role) {
      case UserRole.traveler:
        // Preload traveler data
        ref.read(travelerDashboardProvider.future);
        ref.read(travelerProfileProvider.future);
        break;
      case UserRole.hotelManager:
        // Preload hotel manager data
        ref.read(hotelManagerDashboardProvider.future);
        ref.read(userPropertiesProvider.future);
        break;
      case UserRole.tourOperator:
        // Preload tour operator data
        ref.read(tourOperatorDashboardProvider.future);
        ref.read(userToursProvider.future);
        break;
    }
  }
}

// Role switching provider
final roleSwitchingManagerProvider = Provider<RoleSwitchingManager>((ref) {
  return RoleSwitchingManager(ref);
});

// Navigation state extension for role updates
extension NavigationStateNotifierExt on NavigationStateNotifier {
  void updateForRole(UserRole role) {
    switch (role) {
      case UserRole.traveler:
        setCurrentScreen('home');
        setSelectedDrawerItem('home');
        setActiveTab('home');
        break;
      case UserRole.hotelManager:
      case UserRole.tourOperator:
        setCurrentScreen('dashboard');
        setSelectedDrawerItem('dashboard');
        break;
    }
  }
  
  void startFlipAnimation() {
    state = state.copyWith(isFlipping: true);
  }
  
  void stopFlipAnimation() {
    state = state.copyWith(isFlipping: false);
  }
}
```

### **Permission & Access Control System**
```dart
// lib/core/role/permission_manager.dart
class PermissionManager {
  // Check if user has permission for specific feature
  static bool hasPermission(UserRole role, RoleFeature feature) {
    switch (feature) {
      // Traveler Features
      case RoleFeature.travelerDashboard:
      case RoleFeature.tripPlanning:
      case RoleFeature.wishlistManagement:
      case RoleFeature.bookingHistory:
      case RoleFeature.searchAdvanced:
        return role == UserRole.traveler;
      
      // Hotel Manager Features
      case RoleFeature.propertyManagement:
      case RoleFeature.packageCreation:
      case RoleFeature.calendarManagement:
      case RoleFeature.guestCommunication:
      case RoleFeature.analyticsHotel:
        return role == UserRole.hotelManager;
      
      // Tour Operator Features
      case RoleFeature.tourCreation:
      case RoleFeature.itineraryBuilder:
      case RoleFeature.groupManagement:
      case RoleFeature.guideAssignment:
      case RoleFeature.analyticsTour:
        return role == UserRole.tourOperator;
      
      // Shared Features
      case RoleFeature.messaging:
      case RoleFeature.reviewSystem:
      case RoleFeature.verification:
      case RoleFeature.paymentManagement:
      case RoleFeature.profileSettings:
        return true; // All roles have access
    }
  }
  
  // Get available features for role
  static List<RoleFeature> getAvailableFeatures(UserRole role) {
    return RoleFeature.values.where((feature) => hasPermission(role, feature)).toList();
  }
  
  // Check if user can switch to role
  static bool canSwitchToRole(UserRole currentRole, UserRole targetRole) {
    // Travelers can switch to any partner role
    if (currentRole == UserRole.traveler) {
      return targetRole != UserRole.traveler;
    }
    
    // Partners can switch to traveler or other partner roles
    return true;
  }
  
  // Check if verification is required for feature
  static bool requiresVerification(RoleFeature feature) {
    switch (feature) {
      case RoleFeature.propertyManagement:
      case RoleFeature.packageCreation:
      case RoleFeature.tourCreation:
      case RoleFeature.guestCommunication:
      case RoleFeature.groupManagement:
        return true;
      default:
        return false;
    }
  }
}

// Permission checking widget
class PermissionGate extends TripAvailWidget {
  final RoleFeature feature;
  final Widget child;
  final Widget? fallback;
  final bool requiresVerification;
  
  const PermissionGate({
    required this.feature,
    required this.child,
    this.fallback,
    this.requiresVerification = false,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    final currentRole = ref.watch(currentRoleProvider);
    final user = ref.watch(currentUserProvider);
    
    // Check basic permission
    if (!PermissionManager.hasPermission(currentRole, feature)) {
      return fallback ?? const SizedBox.shrink();
    }
    
    // Check verification requirement
    if (requiresVerification && 
        PermissionManager.requiresVerification(feature) && 
        !(user?.isVerified ?? false)) {
      return fallback ?? _buildVerificationRequired(context, theme);
    }
    
    return child;
  }
  
  Widget _buildVerificationRequired(BuildContext context, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.verified_user_outlined,
            color: theme.colorScheme.error,
            size: 32,
          ),
          const SizedBox(height: 8),
          Text(
            'Verification Required',
            style: theme.textTheme.titleMedium?.copyWith(
              color: theme.colorScheme.error,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'You need to complete verification to access this feature',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onErrorContainer,
            ),
          ),
          const SizedBox(height: 12),
          GradientButton(
            text: 'Complete Verification',
            onPressed: () => context.goNamed('verification'),
          ),
        ],
      ),
    );
  }
}
```

---

## 🔍 Migration Checklist

### **✅ Traveler Features**
- [ ] Implement traveler dashboard with personalized content
- [ ] Create profile management with travel statistics
- [ ] Build trip planning and management system
- [ ] Implement wishlist with favorites synchronization
- [ ] Create booking history and management
- [ ] Add advanced search and filtering capabilities

### **✅ Hotel Manager Features**
- [ ] Create hotel manager dashboard with business metrics
- [ ] Implement property management with CRUD operations
- [ ] Build hotel listing and onboarding workflows
- [ ] Create package creation and management system
- [ ] Implement calendar and availability management
- [ ] Add verification and compliance tracking

### **✅ Tour Operator Features**
- [ ] Create tour operator dashboard with performance metrics
- [ ] Implement tour creation and management system
- [ ] Build itinerary builder with detailed planning
- [ ] Create group and booking management
- [ ] Implement guide assignment and scheduling
- [ ] Add analytics and performance tracking

### **✅ Shared Features**
- [ ] Implement messaging system across all roles
- [ ] Create review and rating system
- [ ] Build verification workflows
- [ ] Implement payment integration
- [ ] Create settings and preferences management
- [ ] Add help and support system

### **✅ Role Management**
- [ ] Implement role switching with 3D animation
- [ ] Create permission and access control system
- [ ] Build role-specific navigation and UI
- [ ] Implement feature flags and conditional rendering
- [ ] Add verification requirements per role
- [ ] Create role-specific data preloading

### **✅ Integration & Testing**
- [ ] Test role switching and state management
- [ ] Verify permission system functionality
- [ ] Test cross-role interactions and data sharing
- [ ] Verify feature access and restrictions
- [ ] Test performance across all role features
- [ ] Validate offline capabilities per role

---

## 🔍 Next Steps

1. **Implement testing strategies** (`11_testing_strategy.md`)
2. **Create deployment pipeline** (`12_deployment_guide.md`)
3. **Build performance optimization** (`13_performance_guide.md`)
4. **Add accessibility features** (`14_accessibility_guide.md`)
5. **Create maintenance guide** (`15_maintenance_guide.md`)

---

*This comprehensive Flutter role-specific features implementation preserves all sophisticated functionality from the React implementation while adding Flutter-native capabilities and performance optimizations. The modular design ensures maintainability and allows for easy extension of role-specific features while maintaining proper separation of concerns and permission management.*