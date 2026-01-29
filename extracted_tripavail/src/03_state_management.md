# Flutter State Management Strategy with Riverpod

## Executive Summary

This document defines the comprehensive Riverpod-based state management architecture for migrating TripAvail's sophisticated React/TypeScript state system. The strategy preserves all complex functionality including multi-role switching, advanced navigation, search filtering, verification flows, and sophisticated UI state management while providing improved type safety and testability.

### Key Migrations
- **useApp Hook** → **AppStateNotifier** with Riverpod providers
- **useDarkMode Hook** → **ThemeNotifier** with persistence
- **useSearch Hook** → **SearchStateNotifier** with advanced filtering
- **Role Management** → **UserRoleNotifier** with role-specific state
- **Navigation State** → **NavigationStateNotifier** with complex routing

---

## 🏗️ State Architecture Overview

### **State Management Hierarchy**
```
Global App State
├── Authentication State (user, tokens, verification)
├── User Role State (traveler, hotel_manager, tour_operator)
├── Navigation State (screens, tabs, drawer, animations)
├── Theme State (dark mode, preferences)
├── Search State (filters, results, overlay)
├── UI State (loading, errors, animations)
└── Feature-Specific State
    ├── Traveler State (trips, wishlist, preferences)
    ├── Hotel Manager State (properties, bookings, analytics)
    └── Tour Operator State (tours, itineraries, calendar)
```

### **Provider Dependencies**
```dart
// Core Dependencies Flow
authProvider → userRoleProvider → navigationProvider
themeProvider → uiStateProvider
searchProvider → resultsProvider
userRoleProvider → featureStateProviders
```

---

## 🔧 Core State Models

### **Application State Model**
```dart
// lib/core/state/models/app_state.dart
@freezed
class AppState with _$AppState {
  const factory AppState({
    required bool showSplash,
    required bool isReady,
    required bool isInitialized,
    @Default(false) bool hasCompletedOnboarding,
    String? lastError,
  }) = _AppState;
  
  factory AppState.fromJson(Map<String, dynamic> json) =>
      _$AppStateFromJson(json);
}

// App State Notifier
class AppStateNotifier extends StateNotifier<AppState> {
  AppStateNotifier() : super(const AppState(
    showSplash: true,
    isReady: false,
    isInitialized: false,
  ));
  
  Future<void> initialize() async {
    try {
      // Initialize services, load user data, etc.
      await Future.delayed(const Duration(seconds: 2)); // Simulate loading
      
      state = state.copyWith(
        isInitialized: true,
        isReady: true,
      );
    } catch (e) {
      state = state.copyWith(
        lastError: e.toString(),
        isReady: true,
      );
    }
  }
  
  void completeSplash() {
    state = state.copyWith(showSplash: false);
  }
  
  void setError(String error) {
    state = state.copyWith(lastError: error);
  }
  
  void clearError() {
    state = state.copyWith(lastError: null);
  }
}
```

### **User & Role State Model**
```dart
// lib/core/state/models/user_state.dart
@freezed
class User with _$User {
  const factory User({
    required String id,
    required String name,
    required String email,
    String? phone,
    String? location,
    String? profileImageUrl,
    @Default(false) bool isVerified,
    @Default(0.0) double profileCompletion,
    @Default([]) List<String> verificationDocuments,
    DateTime? lastLoginAt,
    Map<String, dynamic>? preferences,
  }) = _User;
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

@freezed
class UserRoleState with _$UserRoleState {
  const factory UserRoleState({
    required UserRole currentRole,
    User? user,
    UserRole? partnerMode,
    @Default(false) bool isRoleSwitching,
    DateTime? lastRoleSwitch,
  }) = _UserRoleState;
  
  factory UserRoleState.fromJson(Map<String, dynamic> json) =>
      _$UserRoleStateFromJson(json);
}

enum UserRole {
  traveler,
  hotelManager,
  tourOperator;
  
  String get displayName {
    switch (this) {
      case UserRole.traveler:
        return 'Traveler';
      case UserRole.hotelManager:
        return 'Hotel Manager';
      case UserRole.tourOperator:
        return 'Tour Operator';
    }
  }
}

// User Role Notifier
class UserRoleNotifier extends StateNotifier<UserRoleState> {
  final Ref ref;
  
  UserRoleNotifier(this.ref) : super(const UserRoleState(
    currentRole: UserRole.traveler,
  ));
  
  Future<void> switchToPartnerMode(UserRole newRole) async {
    if (newRole == UserRole.traveler) return;
    
    state = state.copyWith(isRoleSwitching: true);
    
    // Trigger navigation flip animation
    ref.read(navigationStateProvider.notifier).startFlipAnimation();
    
    // Wait for animation
    await Future.delayed(const Duration(milliseconds: 800));
    
    state = state.copyWith(
      currentRole: newRole,
      partnerMode: newRole,
      isRoleSwitching: false,
      lastRoleSwitch: DateTime.now(),
    );
    
    // Navigate to partner selection or dashboard
    ref.read(navigationStateProvider.notifier).navigateToPartnerSelection();
  }
  
  void switchToTravelerMode() {
    state = state.copyWith(
      currentRole: UserRole.traveler,
      partnerMode: null,
      lastRoleSwitch: DateTime.now(),
    );
    
    // Navigate back to traveler home
    ref.read(navigationStateProvider.notifier).navigateToHome();
  }
  
  void updateUser(User user) {
    state = state.copyWith(user: user);
  }
  
  double calculateProfileCompletion() {
    final user = state.user;
    if (user == null) return 0.0;
    
    double completion = 0.0;
    const totalFields = 6.0;
    
    if (user.name.isNotEmpty) completion += 1.0;
    if (user.email.isNotEmpty) completion += 1.0;
    if (user.phone != null && user.phone!.isNotEmpty) completion += 1.0;
    if (user.location != null && user.location!.isNotEmpty) completion += 1.0;
    if (user.profileImageUrl != null) completion += 1.0;
    if (user.isVerified) completion += 1.0;
    
    return (completion / totalFields) * 100;
  }
}
```

### **Navigation State Model**
```dart
// lib/core/state/models/navigation_state.dart
@freezed
class NavigationState with _$NavigationState {
  const factory NavigationState({
    @Default('home') String currentScreen,
    @Default('home') String selectedDrawerItem,
    @Default('home') String activeTab,
    @Default(false) bool isDrawerOpen,
    @Default(false) bool isDetailScreenActive,
    @Default(false) bool isFlipping,
    @Default(false) bool isSearchOverlayOpen,
    List<String>? navigationHistory,
    Map<String, dynamic>? screenParameters,
  }) = _NavigationState;
  
  factory NavigationState.fromJson(Map<String, dynamic> json) =>
      _$NavigationStateFromJson(json);
}

// Navigation State Notifier
class NavigationStateNotifier extends StateNotifier<NavigationState> {
  final Ref ref;
  
  NavigationStateNotifier(this.ref) : super(const NavigationState());
  
  void navigateToScreen(String screen, {Map<String, dynamic>? parameters}) {
    final history = List<String>.from(state.navigationHistory ?? []);
    history.add(state.currentScreen);
    
    state = state.copyWith(
      currentScreen: screen,
      navigationHistory: history,
      screenParameters: parameters,
      isDrawerOpen: false,
    );
    
    // Update drawer selection based on screen
    _updateDrawerSelection(screen);
  }
  
  void navigateToPartnerSelection() {
    navigateToScreen('partner-selection');
  }
  
  void navigateToHome() {
    final role = ref.read(userRoleProvider).currentRole;
    final homeScreen = role == UserRole.traveler ? 'home' : 'dashboard';
    
    state = state.copyWith(
      currentScreen: homeScreen,
      selectedDrawerItem: homeScreen,
      activeTab: role == UserRole.traveler ? 'home' : '',
      navigationHistory: [],
    );
  }
  
  void setActiveTab(String tab) {
    state = state.copyWith(activeTab: tab);
    
    // Reset drawer selection when changing tabs
    if (tab == 'home' && state.selectedDrawerItem == 'dashboard') {
      state = state.copyWith(selectedDrawerItem: 'home');
    }
  }
  
  void toggleDrawer() {
    state = state.copyWith(isDrawerOpen: !state.isDrawerOpen);
  }
  
  void closeDrawer() {
    state = state.copyWith(isDrawerOpen: false);
  }
  
  void setDetailScreenActive(bool isActive) {
    state = state.copyWith(isDetailScreenActive: isActive);
  }
  
  void startFlipAnimation() {
    state = state.copyWith(isFlipping: true);
  }
  
  void stopFlipAnimation() {
    state = state.copyWith(isFlipping: false);
  }
  
  void setSearchOverlayOpen(bool isOpen) {
    state = state.copyWith(isSearchOverlayOpen: isOpen);
  }
  
  void selectDrawerItem(String itemId, String screen) {
    state = state.copyWith(
      selectedDrawerItem: itemId,
      currentScreen: screen,
      isDrawerOpen: false,
    );
    
    // Update active tab for traveler dashboard
    final role = ref.read(userRoleProvider).currentRole;
    if (itemId == 'dashboard' && role == UserRole.traveler) {
      state = state.copyWith(activeTab: 'home');
    }
  }
  
  bool canGoBack() {
    return state.navigationHistory?.isNotEmpty ?? false;
  }
  
  void goBack() {
    if (!canGoBack()) return;
    
    final history = List<String>.from(state.navigationHistory!);
    final previousScreen = history.removeLast();
    
    state = state.copyWith(
      currentScreen: previousScreen,
      navigationHistory: history,
      screenParameters: null,
    );
    
    _updateDrawerSelection(previousScreen);
  }
  
  void _updateDrawerSelection(String screen) {
    switch (screen) {
      case 'home':
      case 'dashboard':
        state = state.copyWith(selectedDrawerItem: screen);
        break;
      case 'profile':
        state = state.copyWith(selectedDrawerItem: 'profile');
        break;
      // Add more screen mappings as needed
    }
  }
}
```

### **Theme State Model**
```dart
// lib/core/state/models/theme_state.dart
@freezed
class ThemeState with _$ThemeState {
  const factory ThemeState({
    @Default(false) bool isDarkMode,
    @Default(ThemeMode.system) ThemeMode themeMode,
    @Default('en') String locale,
    @Default('USD') String currency,
    Map<String, dynamic>? customThemeData,
  }) = _ThemeState;
  
  factory ThemeState.fromJson(Map<String, dynamic> json) =>
      _$ThemeStateFromJson(json);
}

// Theme Notifier with Persistence
class ThemeNotifier extends StateNotifier<ThemeState> {
  final StorageService _storageService;
  
  ThemeNotifier(this._storageService) : super(const ThemeState()) {
    _loadThemeFromStorage();
  }
  
  Future<void> _loadThemeFromStorage() async {
    try {
      final savedTheme = await _storageService.getString('theme_state');
      if (savedTheme != null) {
        final themeData = json.decode(savedTheme);
        state = ThemeState.fromJson(themeData);
      } else {
        // Set system theme as default
        final brightness = WidgetsBinding.instance.window.platformBrightness;
        state = state.copyWith(
          isDarkMode: brightness == Brightness.dark,
          themeMode: ThemeMode.system,
        );
      }
    } catch (e) {
      // Handle error, use default theme
      debugPrint('Error loading theme: $e');
    }
  }
  
  Future<void> toggleDarkMode() async {
    final newDarkMode = !state.isDarkMode;
    state = state.copyWith(
      isDarkMode: newDarkMode,
      themeMode: newDarkMode ? ThemeMode.dark : ThemeMode.light,
    );
    await _saveThemeToStorage();
  }
  
  Future<void> setThemeMode(ThemeMode mode) async {
    bool isDark = mode == ThemeMode.dark;
    if (mode == ThemeMode.system) {
      final brightness = WidgetsBinding.instance.window.platformBrightness;
      isDark = brightness == Brightness.dark;
    }
    
    state = state.copyWith(
      themeMode: mode,
      isDarkMode: isDark,
    );
    await _saveThemeToStorage();
  }
  
  Future<void> setLocale(String locale) async {
    state = state.copyWith(locale: locale);
    await _saveThemeToStorage();
  }
  
  Future<void> setCurrency(String currency) async {
    state = state.copyWith(currency: currency);
    await _saveThemeToStorage();
  }
  
  Future<void> _saveThemeToStorage() async {
    try {
      final themeJson = json.encode(state.toJson());
      await _storageService.setString('theme_state', themeJson);
    } catch (e) {
      debugPrint('Error saving theme: $e');
    }
  }
}
```

### **Search State Model**
```dart
// lib/core/state/models/search_state.dart
@freezed
class SearchFilters with _$SearchFilters {
  const factory SearchFilters({
    @Default('') String query,
    @Default('all') String category, // 'all', 'hotels', 'tours', 'experiences'
    @Default('') String location,
    @Default('') String duration,
    @Default([0, 5000]) List<double> priceRange,
    @Default(0.0) double minRating,
    @Default([]) List<String> experienceType,
    @Default([]) List<String> amenities,
    DateTime? checkInDate,
    DateTime? checkOutDate,
    @Default(2) int guests,
  }) = _SearchFilters;
  
  factory SearchFilters.fromJson(Map<String, dynamic> json) =>
      _$SearchFiltersFromJson(json);
}

@freezed
class SearchResult with _$SearchResult {
  const factory SearchResult({
    required String id,
    required String title,
    required String type, // 'hotel', 'tour', 'experience'
    required String location,
    required double rating,
    required double price,
    required String currency,
    required List<String> images,
    String? description,
    Map<String, dynamic>? metadata,
  }) = _SearchResult;
  
  factory SearchResult.fromJson(Map<String, dynamic> json) =>
      _$SearchResultFromJson(json);
}

@freezed
class SearchState with _$SearchState {
  const factory SearchState({
    required SearchFilters filters,
    @Default([]) List<SearchResult> results,
    @Default(false) bool isLoading,
    @Default(false) bool isOverlayOpen,
    @Default([]) List<String> recentSearches,
    @Default([]) List<String> popularSearches,
    String? lastError,
    int? totalResults,
    @Default(1) int currentPage,
  }) = _SearchState;
  
  factory SearchState.fromJson(Map<String, dynamic> json) =>
      _$SearchStateFromJson(json);
}

// Search State Notifier
class SearchStateNotifier extends StateNotifier<SearchState> {
  final SearchRepository _searchRepository;
  final StorageService _storageService;
  
  SearchStateNotifier(this._searchRepository, this._storageService)
      : super(SearchState(filters: const SearchFilters())) {
    _loadRecentSearches();
  }
  
  Future<void> search({SearchFilters? filters}) async {
    final searchFilters = filters ?? state.filters;
    
    state = state.copyWith(
      isLoading: true,
      lastError: null,
      filters: searchFilters,
    );
    
    try {
      final results = await _searchRepository.search(searchFilters);
      
      // Save search query to recent searches
      if (searchFilters.query.isNotEmpty) {
        await _addToRecentSearches(searchFilters.query);
      }
      
      state = state.copyWith(
        results: results.results,
        totalResults: results.total,
        isLoading: false,
        currentPage: 1,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        lastError: e.toString(),
      );
    }
  }
  
  Future<void> loadMoreResults() async {
    if (state.isLoading) return;
    
    state = state.copyWith(isLoading: true);
    
    try {
      final results = await _searchRepository.search(
        state.filters,
        page: state.currentPage + 1,
      );
      
      final allResults = [...state.results, ...results.results];
      
      state = state.copyWith(
        results: allResults,
        isLoading: false,
        currentPage: state.currentPage + 1,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        lastError: e.toString(),
      );
    }
  }
  
  void updateFilters(SearchFilters filters) {
    state = state.copyWith(filters: filters);
  }
  
  void setOverlayOpen(bool isOpen) {
    state = state.copyWith(isOverlayOpen: isOpen);
  }
  
  void clearResults() {
    state = state.copyWith(
      results: [],
      totalResults: null,
      currentPage: 1,
    );
  }
  
  void clearFilters() {
    state = state.copyWith(filters: const SearchFilters());
  }
  
  Future<void> _loadRecentSearches() async {
    try {
      final recentSearches = await _storageService.getStringList('recent_searches') ?? [];
      state = state.copyWith(recentSearches: recentSearches);
    } catch (e) {
      debugPrint('Error loading recent searches: $e');
    }
  }
  
  Future<void> _addToRecentSearches(String query) async {
    final current = List<String>.from(state.recentSearches);
    current.remove(query); // Remove if already exists
    current.insert(0, query); // Add to beginning
    
    // Keep only last 10 searches
    if (current.length > 10) {
      current.removeRange(10, current.length);
    }
    
    state = state.copyWith(recentSearches: current);
    
    try {
      await _storageService.setStringList('recent_searches', current);
    } catch (e) {
      debugPrint('Error saving recent searches: $e');
    }
  }
}
```

---

## 📱 Feature-Specific State Models

### **Traveler State Model**
```dart
// lib/features/traveler/state/traveler_state.dart
@freezed
class TravelerState with _$TravelerState {
  const factory TravelerState({
    @Default([]) List<Trip> trips,
    @Default([]) List<WishlistItem> wishlist,
    @Default([]) List<Booking> bookings,
    TravelPreferences? preferences,
    @Default(false) bool isLoading,
    String? lastError,
  }) = _TravelerState;
  
  factory TravelerState.fromJson(Map<String, dynamic> json) =>
      _$TravelerStateFromJson(json);
}

@freezed
class Trip with _$Trip {
  const factory Trip({
    required String id,
    required String title,
    required String destination,
    required DateTime startDate,
    required DateTime endDate,
    required TripStatus status,
    required List<String> images,
    String? description,
    double? totalCost,
    String? currency,
  }) = _Trip;
  
  factory Trip.fromJson(Map<String, dynamic> json) => _$TripFromJson(json);
}

enum TripStatus { upcoming, ongoing, completed, cancelled }

@freezed
class WishlistItem with _$WishlistItem {
  const factory WishlistItem({
    required String id,
    required String title,
    required String type, // 'hotel', 'tour', 'experience'
    required String location,
    required double price,
    required String currency,
    required List<String> images,
    DateTime? addedAt,
  }) = _WishlistItem;
  
  factory WishlistItem.fromJson(Map<String, dynamic> json) =>
      _$WishlistItemFromJson(json);
}

// Traveler State Notifier
class TravelerStateNotifier extends StateNotifier<TravelerState> {
  final TravelerRepository _repository;
  
  TravelerStateNotifier(this._repository) : super(const TravelerState());
  
  Future<void> loadTravelerData() async {
    state = state.copyWith(isLoading: true);
    
    try {
      final trips = await _repository.getTrips();
      final wishlist = await _repository.getWishlist();
      final bookings = await _repository.getBookings();
      final preferences = await _repository.getPreferences();
      
      state = state.copyWith(
        trips: trips,
        wishlist: wishlist,
        bookings: bookings,
        preferences: preferences,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        lastError: e.toString(),
      );
    }
  }
  
  Future<void> addToWishlist(WishlistItem item) async {
    try {
      await _repository.addToWishlist(item);
      final updatedWishlist = [...state.wishlist, item];
      state = state.copyWith(wishlist: updatedWishlist);
    } catch (e) {
      state = state.copyWith(lastError: e.toString());
    }
  }
  
  Future<void> removeFromWishlist(String itemId) async {
    try {
      await _repository.removeFromWishlist(itemId);
      final updatedWishlist = state.wishlist.where((item) => item.id != itemId).toList();
      state = state.copyWith(wishlist: updatedWishlist);
    } catch (e) {
      state = state.copyWith(lastError: e.toString());
    }
  }
}
```

### **Hotel Manager State Model**
```dart
// lib/features/hotel_manager/state/hotel_manager_state.dart
@freezed
class HotelManagerState with _$HotelManagerState {
  const factory HotelManagerState({
    @Default([]) List<Property> properties,
    @Default([]) List<Package> packages,
    @Default([]) List<Booking> bookings,
    AnalyticsData? analytics,
    OnboardingProgress? onboardingProgress,
    @Default(false) bool isLoading,
    String? lastError,
  }) = _HotelManagerState;
  
  factory HotelManagerState.fromJson(Map<String, dynamic> json) =>
      _$HotelManagerStateFromJson(json);
}

@freezed
class Property with _$Property {
  const factory Property({
    required String id,
    required String name,
    required String address,
    required PropertyType type,
    required List<Room> rooms,
    required List<String> amenities,
    required List<String> images,
    required PropertyStatus status,
    double? rating,
    int? reviewCount,
  }) = _Property;
  
  factory Property.fromJson(Map<String, dynamic> json) => _$PropertyFromJson(json);
}

enum PropertyType { hotel, resort, villa, apartment, guesthouse }
enum PropertyStatus { draft, pending, approved, rejected, active, inactive }

@freezed
class OnboardingProgress with _$OnboardingProgress {
  const factory OnboardingProgress({
    @Default(0) int currentStep,
    @Default(8) int totalSteps,
    @Default({}) Map<int, bool> completedSteps,
    @Default(false) bool isCompleted,
  }) = _OnboardingProgress;
  
  factory OnboardingProgress.fromJson(Map<String, dynamic> json) =>
      _$OnboardingProgressFromJson(json);
}

// Hotel Manager State Notifier
class HotelManagerStateNotifier extends StateNotifier<HotelManagerState> {
  final HotelManagerRepository _repository;
  
  HotelManagerStateNotifier(this._repository) : super(const HotelManagerState());
  
  Future<void> loadHotelManagerData() async {
    state = state.copyWith(isLoading: true);
    
    try {
      final properties = await _repository.getProperties();
      final packages = await _repository.getPackages();
      final bookings = await _repository.getBookings();
      final analytics = await _repository.getAnalytics();
      final onboardingProgress = await _repository.getOnboardingProgress();
      
      state = state.copyWith(
        properties: properties,
        packages: packages,
        bookings: bookings,
        analytics: analytics,
        onboardingProgress: onboardingProgress,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        lastError: e.toString(),
      );
    }
  }
  
  void updateOnboardingStep(int step) {
    if (state.onboardingProgress != null) {
      final progress = state.onboardingProgress!;
      final updatedCompleted = Map<int, bool>.from(progress.completedSteps);
      updatedCompleted[step] = true;
      
      final updatedProgress = progress.copyWith(
        currentStep: step + 1,
        completedSteps: updatedCompleted,
        isCompleted: step + 1 >= progress.totalSteps,
      );
      
      state = state.copyWith(onboardingProgress: updatedProgress);
    }
  }
  
  Future<void> createProperty(Property property) async {
    try {
      await _repository.createProperty(property);
      final updatedProperties = [...state.properties, property];
      state = state.copyWith(properties: updatedProperties);
    } catch (e) {
      state = state.copyWith(lastError: e.toString());
    }
  }
}
```

---

## 🔌 Provider Configuration

### **Core Providers Setup**
```dart
// lib/core/state/providers/core_providers.dart

// Storage Service Provider
final storageServiceProvider = Provider<StorageService>((ref) {
  return SharedPreferencesStorageService();
});

// App State Provider
final appStateProvider = StateNotifierProvider<AppStateNotifier, AppState>((ref) {
  return AppStateNotifier();
});

// User Role Provider
final userRoleProvider = StateNotifierProvider<UserRoleNotifier, UserRoleState>((ref) {
  return UserRoleNotifier(ref);
});

// Navigation Provider
final navigationStateProvider = StateNotifierProvider<NavigationStateNotifier, NavigationState>((ref) {
  return NavigationStateNotifier(ref);
});

// Theme Provider
final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeState>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return ThemeNotifier(storageService);
});

// Search Provider
final searchStateProvider = StateNotifierProvider<SearchStateNotifier, SearchState>((ref) {
  final repository = ref.watch(searchRepositoryProvider);
  final storage = ref.watch(storageServiceProvider);
  return SearchStateNotifier(repository, storage);
});

// Current User Provider (computed)
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(userRoleProvider.select((state) => state.user));
});

// Current Role Provider (computed)
final currentRoleProvider = Provider<UserRole>((ref) {
  return ref.watch(userRoleProvider.select((state) => state.currentRole));
});

// Is Dark Mode Provider (computed)
final isDarkModeProvider = Provider<bool>((ref) {
  return ref.watch(themeProvider.select((state) => state.isDarkMode));
});

// Navigation Computed Providers
final isFlippingProvider = Provider<bool>((ref) {
  return ref.watch(navigationStateProvider.select((state) => state.isFlipping));
});

final isDetailScreenActiveProvider = Provider<bool>((ref) {
  return ref.watch(navigationStateProvider.select((state) => state.isDetailScreenActive));
});

final currentScreenProvider = Provider<String>((ref) {
  return ref.watch(navigationStateProvider.select((state) => state.currentScreen));
});
```

### **Feature-Specific Providers**
```dart
// lib/features/traveler/providers/traveler_providers.dart
final travelerStateProvider = StateNotifierProvider<TravelerStateNotifier, TravelerState>((ref) {
  final repository = ref.watch(travelerRepositoryProvider);
  return TravelerStateNotifier(repository);
});

// Auto-load traveler data when role switches to traveler
final travelerDataProvider = FutureProvider<void>((ref) async {
  final role = ref.watch(currentRoleProvider);
  if (role == UserRole.traveler) {
    await ref.read(travelerStateProvider.notifier).loadTravelerData();
  }
});

// lib/features/hotel_manager/providers/hotel_manager_providers.dart
final hotelManagerStateProvider = StateNotifierProvider<HotelManagerStateNotifier, HotelManagerState>((ref) {
  final repository = ref.watch(hotelManagerRepositoryProvider);
  return HotelManagerStateNotifier(repository);
});

// Auto-load hotel manager data when role switches
final hotelManagerDataProvider = FutureProvider<void>((ref) async {
  final role = ref.watch(currentRoleProvider);
  if (role == UserRole.hotelManager) {
    await ref.read(hotelManagerStateProvider.notifier).loadHotelManagerData();
  }
});
```

---

## 🎬 Animation State Management

### **Animation State Models**
```dart
// lib/core/state/models/animation_state.dart
@freezed
class AnimationState with _$AnimationState {
  const factory AnimationState({
    @Default(false) bool isScreenFlipping,
    @Default(false) bool isPageTransitioning,
    @Default({}) Map<String, bool> activeAnimations,
    AnimationConfig? currentConfig,
  }) = _AnimationState;
  
  factory AnimationState.fromJson(Map<String, dynamic> json) =>
      _$AnimationStateFromJson(json);
}

@freezed
class AnimationConfig with _$AnimationConfig {
  const factory AnimationConfig({
    required Duration duration,
    required Curve curve,
    String? type,
    Map<String, dynamic>? parameters,
  }) = _AnimationConfig;
  
  factory AnimationConfig.fromJson(Map<String, dynamic> json) =>
      _$AnimationConfigFromJson(json);
}

// Animation State Notifier
class AnimationStateNotifier extends StateNotifier<AnimationState> {
  AnimationStateNotifier() : super(const AnimationState());
  
  void startScreenFlip() {
    state = state.copyWith(
      isScreenFlipping: true,
      currentConfig: const AnimationConfig(
        duration: Duration(milliseconds: 800),
        curve: Curves.easeInOutCubic,
        type: 'screen_flip',
      ),
    );
  }
  
  void stopScreenFlip() {
    state = state.copyWith(
      isScreenFlipping: false,
      currentConfig: null,
    );
  }
  
  void startAnimation(String animationId) {
    final updatedAnimations = Map<String, bool>.from(state.activeAnimations);
    updatedAnimations[animationId] = true;
    state = state.copyWith(activeAnimations: updatedAnimations);
  }
  
  void stopAnimation(String animationId) {
    final updatedAnimations = Map<String, bool>.from(state.activeAnimations);
    updatedAnimations.remove(animationId);
    state = state.copyWith(activeAnimations: updatedAnimations);
  }
  
  bool isAnimationActive(String animationId) {
    return state.activeAnimations[animationId] ?? false;
  }
}

// Animation Provider
final animationStateProvider = StateNotifierProvider<AnimationStateNotifier, AnimationState>((ref) {
  return AnimationStateNotifier();
});
```

---

## 🔄 State Persistence Strategy

### **Persistent State Manager**
```dart
// lib/core/state/persistence/persistent_state_manager.dart
class PersistentStateManager {
  final StorageService _storage;
  
  PersistentStateManager(this._storage);
  
  // Keys for different state types
  static const String _themeStateKey = 'theme_state';
  static const String _userRoleStateKey = 'user_role_state';
  static const String _searchFiltersKey = 'search_filters';
  static const String _onboardingProgressKey = 'onboarding_progress';
  
  Future<void> saveThemeState(ThemeState state) async {
    await _storage.setString(_themeStateKey, jsonEncode(state.toJson()));
  }
  
  Future<ThemeState?> loadThemeState() async {
    final data = await _storage.getString(_themeStateKey);
    if (data != null) {
      return ThemeState.fromJson(jsonDecode(data));
    }
    return null;
  }
  
  Future<void> saveUserRoleState(UserRoleState state) async {
    await _storage.setString(_userRoleStateKey, jsonEncode(state.toJson()));
  }
  
  Future<UserRoleState?> loadUserRoleState() async {
    final data = await _storage.getString(_userRoleStateKey);
    if (data != null) {
      return UserRoleState.fromJson(jsonDecode(data));
    }
    return null;
  }
  
  Future<void> saveSearchFilters(SearchFilters filters) async {
    await _storage.setString(_searchFiltersKey, jsonEncode(filters.toJson()));
  }
  
  Future<SearchFilters?> loadSearchFilters() async {
    final data = await _storage.getString(_searchFiltersKey);
    if (data != null) {
      return SearchFilters.fromJson(jsonDecode(data));
    }
    return null;
  }
  
  Future<void> clearAllPersistedState() async {
    await _storage.remove(_themeStateKey);
    await _storage.remove(_userRoleStateKey);
    await _storage.remove(_searchFiltersKey);
    await _storage.remove(_onboardingProgressKey);
  }
}

// Persistent State Manager Provider
final persistentStateManagerProvider = Provider<PersistentStateManager>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return PersistentStateManager(storage);
});
```

---

## 🧪 Testing Strategy for State Management

### **State Testing Approach**
```dart
// test/state/user_role_notifier_test.dart
void main() {
  group('UserRoleNotifier Tests', () {
    late ProviderContainer container;
    late MockNavigationStateNotifier mockNavigationNotifier;
    
    setUp(() {
      mockNavigationNotifier = MockNavigationStateNotifier();
      container = ProviderContainer(
        overrides: [
          navigationStateProvider.overrideWith(() => mockNavigationNotifier),
        ],
      );
    });
    
    tearDown(() {
      container.dispose();
    });
    
    test('initial state should be traveler role', () {
      final state = container.read(userRoleProvider);
      expect(state.currentRole, UserRole.traveler);
      expect(state.partnerMode, isNull);
      expect(state.isRoleSwitching, false);
    });
    
    test('should switch to partner mode correctly', () async {
      final notifier = container.read(userRoleProvider.notifier);
      
      // Start role switch
      final future = notifier.switchToPartnerMode(UserRole.hotelManager);
      
      // Check intermediate state
      var state = container.read(userRoleProvider);
      expect(state.isRoleSwitching, true);
      
      // Verify navigation flip animation started
      verify(mockNavigationNotifier.startFlipAnimation()).called(1);
      
      // Wait for completion
      await future;
      
      // Check final state
      state = container.read(userRoleProvider);
      expect(state.currentRole, UserRole.hotelManager);
      expect(state.partnerMode, UserRole.hotelManager);
      expect(state.isRoleSwitching, false);
      expect(state.lastRoleSwitch, isNotNull);
    });
    
    test('should calculate profile completion correctly', () {
      final notifier = container.read(userRoleProvider.notifier);
      
      // Set user with partial information
      const user = User(
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        // location and profileImageUrl are null
        // isVerified is false
      );
      
      notifier.updateUser(user);
      
      final completion = notifier.calculateProfileCompletion();
      expect(completion, 50.0); // 3 out of 6 fields completed
    });
  });
}

// test/state/navigation_state_notifier_test.dart
void main() {
  group('NavigationStateNotifier Tests', () {
    late ProviderContainer container;
    late MockUserRoleNotifier mockUserRoleNotifier;
    
    setUp(() {
      mockUserRoleNotifier = MockUserRoleNotifier();
      container = ProviderContainer(
        overrides: [
          userRoleProvider.overrideWith(() => mockUserRoleNotifier),
        ],
      );
    });
    
    test('should navigate to screen and update history', () {
      final notifier = container.read(navigationStateProvider.notifier);
      
      notifier.navigateToScreen('profile', parameters: {'userId': '123'});
      
      final state = container.read(navigationStateProvider);
      expect(state.currentScreen, 'profile');
      expect(state.screenParameters, {'userId': '123'});
      expect(state.navigationHistory, ['home']);
      expect(state.isDrawerOpen, false);
    });
    
    test('should handle back navigation correctly', () {
      final notifier = container.read(navigationStateProvider.notifier);
      
      // Navigate to profile, then settings
      notifier.navigateToScreen('profile');
      notifier.navigateToScreen('settings');
      
      var state = container.read(navigationStateProvider);
      expect(state.currentScreen, 'settings');
      expect(state.navigationHistory, ['home', 'profile']);
      
      // Go back
      notifier.goBack();
      
      state = container.read(navigationStateProvider);
      expect(state.currentScreen, 'profile');
      expect(state.navigationHistory, ['home']);
    });
  });
}

// Widget test with state
// test/widgets/navigation_test.dart
void main() {
  group('Navigation Widget Tests', () {
    testWidgets('should show bottom navigation for traveler role', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            userRoleProvider.overrideWith(() => MockUserRoleNotifier()),
          ],
          child: MaterialApp(
            home: MainNavigationShell(
              child: Container(),
            ),
          ),
        ),
      );
      
      // Verify bottom navigation is shown for traveler
      expect(find.byType(BottomNavigationBar), findsOneWidget);
    });
    
    testWidgets('should hide bottom navigation during flip animation', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            navigationStateProvider.overrideWith(
              () => MockNavigationStateNotifier(
                const NavigationState(isFlipping: true),
              ),
            ),
          ],
          child: MaterialApp(
            home: MainNavigationShell(
              child: Container(),
            ),
          ),
        ),
      );
      
      // Verify bottom navigation is hidden during flip
      expect(find.byType(BottomNavigationBar), findsNothing);
      expect(find.byType(ScreenFlipAnimation), findsOneWidget);
    });
  });
}
```

---

## 🔧 Migration Strategy from React Hooks

### **Hook-to-Provider Migration Map**
| React Hook | Flutter Equivalent | Key Changes |
|------------|-------------------|-------------|
| `useApp()` | `appStateProvider` + `userRoleProvider` | Split into focused providers |
| `useDarkMode()` | `themeProvider` | Added persistence and system theme detection |
| `useSearch()` | `searchStateProvider` | Enhanced with recent searches and pagination |
| `useState()` | `StateNotifier` | More structured state management |
| `useCallback()` | Provider methods | Automatic optimization with Riverpod |
| `useEffect()` | Provider listeners | More explicit dependency management |

### **Migration Steps**
1. **Create State Models**: Define Freezed models for all state types
2. **Implement Notifiers**: Create StateNotifier classes with business logic
3. **Set Up Providers**: Configure Riverpod providers with dependencies
4. **Add Persistence**: Implement state persistence where needed
5. **Update UI**: Replace hook calls with provider watches
6. **Add Testing**: Create comprehensive tests for all state logic

### **Code Example: Migrating useApp Hook**
```dart
// Before (React Hook)
const {
  showSplash,
  menuOpen,
  activeTab,
  partnerMode,
  user,
  setMenuOpen,
  setActiveTab,
  handleSplashComplete,
  handleSelectPartnerMode,
  handleSwitchToTravelerMode,
} = useApp();

// After (Flutter Riverpod)
class AppScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appState = ref.watch(appStateProvider);
    final navigationState = ref.watch(navigationStateProvider);
    final userRoleState = ref.watch(userRoleProvider);
    
    return Scaffold(
      body: appState.showSplash 
        ? SplashScreen(
            onComplete: () => ref.read(appStateProvider.notifier).completeSplash(),
          )
        : MainContent(),
      drawer: navigationState.isDrawerOpen 
        ? CustomDrawer(
            onClose: () => ref.read(navigationStateProvider.notifier).closeDrawer(),
          )
        : null,
    );
  }
}
```

---

## 📊 Performance Considerations

### **State Optimization Strategies**
1. **Selective Watching**: Use `select()` to watch only specific state properties
2. **Provider Scoping**: Scope providers to minimize rebuild scope
3. **Lazy Loading**: Load feature state only when needed
4. **State Splitting**: Split large state objects into focused smaller ones
5. **Computed Providers**: Use computed providers for derived state

### **Memory Management**
```dart
// Example: Selective state watching to minimize rebuilds
class UserProfile extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Only rebuild when user name changes, not entire user object
    final userName = ref.watch(
      userRoleProvider.select((state) => state.user?.name ?? ''),
    );
    
    // Only rebuild when dark mode changes, not entire theme
    final isDarkMode = ref.watch(
      themeProvider.select((state) => state.isDarkMode),
    );
    
    return Card(
      color: isDarkMode ? Colors.grey[800] : Colors.white,
      child: Text(userName),
    );
  }
}
```

---

## 🔍 Next Steps

1. **Review state models** for completeness and accuracy
2. **Implement core providers** (`04_theme_system.md`)
3. **Create navigation system** (`05_navigation_system.md`) 
4. **Define data models** (`06_data_models.md`)
5. **Start component migration** (`07_core_components.md`)

---

*This comprehensive state management strategy provides a solid foundation for migrating TripAvail's complex React state system to Flutter while maintaining all sophisticated functionality and improving type safety, testability, and performance.*