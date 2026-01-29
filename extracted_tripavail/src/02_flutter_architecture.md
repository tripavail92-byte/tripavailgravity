# Flutter Architecture Design for TripAvail

## Executive Summary

This document defines the comprehensive Flutter architecture for migrating the sophisticated React/TypeScript TripAvail application. The architecture preserves all advanced features including multi-role support, hybrid navigation patterns, sophisticated animations, and comprehensive theming while following Flutter best practices.

### Key Architecture Decisions
- **State Management**: Riverpod for scalable, testable state management
- **Navigation**: GoRouter with nested routing for complex drawer + bottom tab hybrid
- **UI Framework**: Material 3 with extensive customization + custom widgets
- **Animation**: Flutter's animation system with custom controllers
- **Architecture Pattern**: Feature-first with role-based organization
- **Testing**: Comprehensive unit, widget, and integration test coverage

---

## 🏗️ Flutter Project Structure

### **Root Directory Layout**
```
trip_avail/
├── lib/
│   ├── main.dart                          # App entry point
│   ├── app.dart                          # Main app widget
│   ├── core/                             # Core functionality
│   ├── features/                         # Feature-based modules
│   ├── shared/                           # Shared components & utilities
│   └── generated/                        # Generated files (assets, etc.)
├── assets/                               # Static assets
├── test/                                 # Test files
├── integration_test/                     # Integration tests
└── pubspec.yaml                          # Dependencies
```

### **Core Architecture (`/lib/core/`)**
```
core/
├── app/
│   ├── app_constants.dart               # Application constants
│   ├── app_config.dart                  # Configuration management
│   └── app_theme.dart                   # Material 3 theme system
├── navigation/
│   ├── app_router.dart                  # GoRouter configuration
│   ├── route_paths.dart                 # Route path constants
│   └── navigation_service.dart          # Navigation utilities
├── state/
│   ├── providers/                       # Riverpod providers
│   ├── notifiers/                       # State notifiers
│   └── models/                          # Data models
├── services/
│   ├── api_service.dart                 # API communication
│   ├── storage_service.dart             # Local storage
│   ├── auth_service.dart                # Authentication
│   └── notification_service.dart        # Push notifications
├── utils/
│   ├── extensions.dart                  # Dart extensions
│   ├── validators.dart                  # Form validators
│   ├── formatters.dart                  # Data formatters
│   └── helpers.dart                     # Utility functions
└── widgets/
    ├── animations/                      # Custom animations
    ├── buttons/                         # Custom buttons
    ├── inputs/                          # Custom inputs
    └── layouts/                         # Layout widgets
```

### **Feature-Based Organization (`/lib/features/`)**
```
features/
├── authentication/
│   ├── data/                           # Data layer
│   ├── domain/                         # Business logic
│   ├── presentation/                   # UI layer
│   └── providers/                      # Feature providers
├── roles/
│   ├── traveler/
│   ├── hotel_manager/
│   ├── tour_operator/
│   └── shared/
├── navigation/
│   ├── drawer/
│   ├── bottom_navigation/
│   └── screen_manager/
├── search/
│   ├── widgets/
│   ├── providers/
│   └── models/
├── onboarding/
├── verification/
├── bookings/
├── hotels/
├── tours/
└── profile/
```

---

## 🔧 State Management Architecture

### **Riverpod Implementation Strategy**

#### **Core State Providers**
```dart
// Application State Provider
final appStateProvider = StateNotifierProvider<AppStateNotifier, AppState>(
  (ref) => AppStateNotifier(),
);

// User Role Provider
final userRoleProvider = StateProvider<UserRole>((ref) => UserRole.traveler);

// Navigation State Provider
final navigationStateProvider = StateNotifierProvider<NavigationStateNotifier, NavigationState>(
  (ref) => NavigationStateNotifier(),
);

// Theme Provider
final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeState>(
  (ref) => ThemeNotifier(),
);
```

#### **Role-Based State Management**
```dart
// Traveler State
final travelerStateProvider = StateNotifierProvider<TravelerStateNotifier, TravelerState>(
  (ref) => TravelerStateNotifier(),
);

// Hotel Manager State
final hotelManagerStateProvider = StateNotifierProvider<HotelManagerStateNotifier, HotelManagerState>(
  (ref) => HotelManagerStateNotifier(),
);

// Tour Operator State
final tourOperatorStateProvider = StateNotifierProvider<TourOperatorStateNotifier, TourOperatorState>(
  (ref) => TourOperatorStateNotifier(),
);
```

#### **Feature-Specific Providers**
```dart
// Search State
final searchStateProvider = StateNotifierProvider<SearchStateNotifier, SearchState>(
  (ref) => SearchStateNotifier(),
);

// Onboarding State
final onboardingStateProvider = StateNotifierProvider<OnboardingStateNotifier, OnboardingState>(
  (ref) => OnboardingStateNotifier(),
);

// Verification State
final verificationStateProvider = StateNotifierProvider<VerificationStateNotifier, VerificationState>(
  (ref) => VerificationStateNotifier(),
);
```

### **State Models**
```dart
// Application State
@freezed
class AppState with _$AppState {
  const factory AppState({
    required bool showSplash,
    required bool isReady,
    required UserRole currentRole,
    User? user,
  }) = _AppState;
}

// Navigation State
@freezed
class NavigationState with _$NavigationState {
  const factory NavigationState({
    required String currentScreen,
    required String selectedDrawerItem,
    required String activeTab,
    required bool isDrawerOpen,
    required bool isDetailScreenActive,
    required bool isFlipping,
  }) = _NavigationState;
}

// Search State
@freezed
class SearchState with _$SearchState {
  const factory SearchState({
    required bool isOverlayOpen,
    required SearchFilters filters,
    required List<SearchResult> results,
    required bool isLoading,
  }) = _SearchState;
}
```

---

## 🧭 Navigation Architecture

### **GoRouter Configuration**
```dart
final appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    // Splash Route
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    
    // Main Shell Route with Navigation
    ShellRoute(
      builder: (context, state, child) => MainNavigationShell(child: child),
      routes: [
        // Traveler Routes
        GoRoute(
          path: '/traveler',
          builder: (context, state) => const TravelerMainScreen(),
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
            GoRoute(
              path: '/dashboard',
              builder: (context, state) => const TravelerDashboardScreen(),
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
            // ... other traveler routes
          ],
        ),
        
        // Hotel Manager Routes
        GoRoute(
          path: '/hotel-manager',
          builder: (context, state) => const HotelManagerMainScreen(),
          routes: [
            GoRoute(
              path: '/dashboard',
              builder: (context, state) => const HotelManagerDashboardScreen(),
            ),
            GoRoute(
              path: '/properties',
              builder: (context, state) => const PropertiesScreen(),
            ),
            // ... other hotel manager routes
          ],
        ),
        
        // Tour Operator Routes
        GoRoute(
          path: '/tour-operator',
          builder: (context, state) => const TourOperatorMainScreen(),
          routes: [
            GoRoute(
              path: '/dashboard',
              builder: (context, state) => const TourOperatorDashboardScreen(),
            ),
            GoRoute(
              path: '/tours',
              builder: (context, state) => const ToursScreen(),
            ),
            // ... other tour operator routes
          ],
        ),
        
        // Shared Routes
        GoRoute(
          path: '/partner-selection',
          builder: (context, state) => const PartnerSelectionScreen(),
        ),
        GoRoute(
          path: '/verification',
          builder: (context, state) => const VerificationScreen(),
        ),
      ],
    ),
  ],
);
```

### **Navigation Shell Implementation**
```dart
class MainNavigationShell extends ConsumerWidget {
  final Widget child;
  
  const MainNavigationShell({required this.child, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navigationState = ref.watch(navigationStateProvider);
    final userRole = ref.watch(userRoleProvider);
    
    return Scaffold(
      appBar: navigationState.isDetailScreenActive || navigationState.isFlipping 
          ? null 
          : CustomAppBar(),
      drawer: CustomDrawer(),
      body: Stack(
        children: [
          // Main Content
          if (!navigationState.isFlipping) child,
          
          // Screen Flip Animation Overlay
          if (navigationState.isFlipping) const ScreenFlipAnimation(),
          
          // Search Overlay
          if (navigationState.isSearchOverlayOpen) const SearchOverlay(),
        ],
      ),
      bottomNavigationBar: userRole == UserRole.traveler && 
                          !navigationState.isDetailScreenActive && 
                          !navigationState.isFlipping
          ? const CustomBottomNavigation()
          : null,
    );
  }
}
```

---

## 🎨 Theme System Architecture

### **Material 3 Custom Theme**
```dart
class AppTheme {
  static const Color _primaryLight = Color(0xFFE11D48); // Rose 600
  static const Color _primaryDark = Color(0xFFFB7185);  // Rose 400
  
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: _primaryLight,
      brightness: Brightness.light,
    ).copyWith(
      primary: _primaryLight,
      secondary: const Color(0xFF8B5CF6), // Purple for partner features
      surface: Colors.white,
      background: const Color(0xFFFAFAFA),
    ),
    
    // Custom theme extensions
    extensions: <ThemeExtension<dynamic>>[
      CustomGradients.light,
      CustomShadows.light,
      CustomAnimations.standard,
    ],
    
    // Component themes
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: Colors.white.withOpacity(0.9),
      selectedItemColor: _primaryLight,
      unselectedItemColor: Colors.grey[600],
      type: BottomNavigationBarType.fixed,
    ),
    
    drawerTheme: const DrawerThemeData(
      backgroundColor: Colors.white,
      elevation: 16,
      width: 300,
    ),
  );
  
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: _primaryDark,
      brightness: Brightness.dark,
    ).copyWith(
      primary: _primaryDark,
      secondary: const Color(0xFFEC4899), // Pink for partner features
      surface: const Color(0xFF1A1A1A),
      background: const Color(0xFF0A0A0A),
    ),
    
    // Custom theme extensions
    extensions: <ThemeExtension<dynamic>>[
      CustomGradients.dark,
      CustomShadows.dark,
      CustomAnimations.standard,
    ],
  );
}
```

### **Custom Theme Extensions**
```dart
@immutable
class CustomGradients extends ThemeExtension<CustomGradients> {
  final Gradient rosePrimary;
  final Gradient partner;
  final Gradient glass;
  
  const CustomGradients({
    required this.rosePrimary,
    required this.partner,
    required this.glass,
  });
  
  static const light = CustomGradients(
    rosePrimary: LinearGradient(
      colors: [Color(0xFFE11D48), Color(0xFFFB7185)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    partner: LinearGradient(
      colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    glass: LinearGradient(
      colors: [
        Color.fromRGBO(255, 255, 255, 0.1),
        Color.fromRGBO(255, 255, 255, 0.05),
      ],
    ),
  );
  
  static const dark = CustomGradients(
    rosePrimary: LinearGradient(
      colors: [Color(0xFFFB7185), Color(0xFFE11D48)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    partner: LinearGradient(
      colors: [Color(0xFFEC4899), Color(0xFF8B5CF6)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    glass: LinearGradient(
      colors: [
        Color.fromRGBO(0, 0, 0, 0.1),
        Color.fromRGBO(0, 0, 0, 0.05),
      ],
    ),
  );
  
  @override
  CustomGradients copyWith({
    Gradient? rosePrimary,
    Gradient? partner,
    Gradient? glass,
  }) {
    return CustomGradients(
      rosePrimary: rosePrimary ?? this.rosePrimary,
      partner: partner ?? this.partner,
      glass: glass ?? this.glass,
    );
  }
  
  @override
  CustomGradients lerp(ThemeExtension<CustomGradients>? other, double t) {
    // Implementation for theme transitions
    return this;
  }
}
```

---

## 🎬 Animation System Architecture

### **Animation Controllers**
```dart
class AppAnimations {
  // Screen flip animation for role switching
  static const Duration screenFlipDuration = Duration(milliseconds: 800);
  
  // Standard transition durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);
  
  // Animation curves
  static const Curve standardCurve = Curves.easeInOut;
  static const Curve bounceCurve = Curves.elasticOut;
  static const Curve flipCurve = Curves.easeInOutCubic;
}

class ScreenFlipAnimation extends StatefulWidget {
  const ScreenFlipAnimation({super.key});

  @override
  State<ScreenFlipAnimation> createState() => _ScreenFlipAnimationState();
}

class _ScreenFlipAnimationState extends State<ScreenFlipAnimation>
    with TickerProviderStateMixin {
  late AnimationController _rotationController;
  late AnimationController _scaleController;
  late Animation<double> _rotationAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    
    _rotationController = AnimationController(
      duration: AppAnimations.screenFlipDuration,
      vsync: this,
    );
    
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _rotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(
      parent: _rotationController,
      curve: AppAnimations.flipCurve,
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: AppAnimations.bounceCurve,
    ));
    
    _startAnimation();
  }

  void _startAnimation() async {
    await _rotationController.forward();
    await _scaleController.forward();
  }

  @override
  Widget build(BuildContext context) {
    final gradients = Theme.of(context).extension<CustomGradients>()!;
    
    return Container(
      decoration: BoxDecoration(gradient: gradients.partner),
      child: Center(
        child: AnimatedBuilder(
          animation: Listenable.merge([_rotationAnimation, _scaleAnimation]),
          builder: (context, child) {
            return Transform.scale(
              scale: _scaleAnimation.value,
              child: Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()..rotateY(_rotationAnimation.value),
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(40),
                  ),
                  child: const Icon(
                    Icons.swap_horiz,
                    color: Colors.white,
                    size: 40,
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _scaleController.dispose();
    super.dispose();
  }
}
```

### **Page Transition Animations**
```dart
class CustomPageTransitions {
  static Widget slideTransition(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(1.0, 0.0),
        end: Offset.zero,
      ).animate(CurvedAnimation(
        parent: animation,
        curve: AppAnimations.standardCurve,
      )),
      child: child,
    );
  }
  
  static Widget fadeTransition(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return FadeTransition(
      opacity: animation,
      child: child,
    );
  }
}
```

---

## 🧩 Component Architecture

### **Widget Hierarchy**
```dart
// Base Widget Classes
abstract class BaseStatelessWidget extends StatelessWidget {
  const BaseStatelessWidget({super.key});
  
  @override
  Widget build(BuildContext context);
}

abstract class BaseStatefulWidget extends StatefulWidget {
  const BaseStatefulWidget({super.key});
}

abstract class BaseConsumerWidget extends ConsumerWidget {
  const BaseConsumerWidget({super.key});
  
  @override
  Widget build(BuildContext context, WidgetRef ref);
}
```

### **Custom Button System**
```dart
class GradientButton extends BaseStatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final Gradient? gradient;
  final bool isLoading;
  final IconData? icon;
  
  const GradientButton({
    required this.text,
    this.onPressed,
    this.gradient,
    this.isLoading = false,
    this.icon,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final gradients = Theme.of(context).extension<CustomGradients>()!;
    
    return Container(
      decoration: BoxDecoration(
        gradient: gradient ?? gradients.rosePrimary,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isLoading) ...[
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  ),
                  const SizedBox(width: 8),
                ] else if (icon != null) ...[
                  Icon(icon, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                ],
                Text(
                  text,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

### **Icon System**
```dart
class AnimatedAppIcon extends StatefulWidget {
  final IconData icon;
  final bool isActive;
  final Color? activeColor;
  final Color? inactiveColor;
  final VoidCallback? onTap;
  
  const AnimatedAppIcon({
    required this.icon,
    this.isActive = false,
    this.activeColor,
    this.inactiveColor,
    this.onTap,
    super.key,
  });

  @override
  State<AnimatedAppIcon> createState() => _AnimatedAppIconState();
}

class _AnimatedAppIconState extends State<AnimatedAppIcon>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: AppAnimations.shortAnimation,
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.2)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.elasticOut));
        
    _rotationAnimation = Tween<double>(begin: 0, end: 0.1)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void didUpdateWidget(AnimatedAppIcon oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive != oldWidget.isActive) {
      if (widget.isActive) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Transform.rotate(
              angle: _rotationAnimation.value,
              child: Icon(
                widget.icon,
                color: widget.isActive 
                    ? (widget.activeColor ?? Theme.of(context).primaryColor)
                    : (widget.inactiveColor ?? Colors.grey),
                size: 24,
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

---

## 📱 Screen Architecture

### **Base Screen Structure**
```dart
abstract class BaseScreen extends BaseConsumerWidget {
  const BaseScreen({super.key});
  
  PreferredSizeWidget? buildAppBar(BuildContext context, WidgetRef ref) => null;
  Widget? buildFloatingActionButton(BuildContext context, WidgetRef ref) => null;
  Widget? buildBottomNavigationBar(BuildContext context, WidgetRef ref) => null;
  Widget buildBody(BuildContext context, WidgetRef ref);
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: buildAppBar(context, ref),
      body: buildBody(context, ref),
      floatingActionButton: buildFloatingActionButton(context, ref),
      bottomNavigationBar: buildBottomNavigationBar(context, ref),
    );
  }
}
```

### **Role-Specific Screen Base Classes**
```dart
abstract class TravelerScreen extends BaseScreen {
  const TravelerScreen({super.key});
  
  @override
  Widget? buildBottomNavigationBar(BuildContext context, WidgetRef ref) {
    return const CustomBottomNavigation();
  }
}

abstract class HotelManagerScreen extends BaseScreen {
  const HotelManagerScreen({super.key});
  
  @override
  PreferredSizeWidget? buildAppBar(BuildContext context, WidgetRef ref) {
    return AppBar(
      title: Text(getScreenTitle()),
      backgroundColor: Colors.transparent,
      elevation: 0,
    );
  }
  
  String getScreenTitle();
}

abstract class TourOperatorScreen extends BaseScreen {
  const TourOperatorScreen({super.key});
  
  @override
  PreferredSizeWidget? buildAppBar(BuildContext context, WidgetRef ref) {
    return AppBar(
      title: Text(getScreenTitle()),
      backgroundColor: Colors.transparent,
      elevation: 0,
    );
  }
  
  String getScreenTitle();
}
```

---

## 🔄 Data Layer Architecture

### **Repository Pattern**
```dart
abstract class BaseRepository<T> {
  Future<Result<List<T>>> getAll();
  Future<Result<T>> getById(String id);
  Future<Result<T>> create(T item);
  Future<Result<T>> update(String id, T item);
  Future<Result<bool>> delete(String id);
}

class HotelRepository extends BaseRepository<Hotel> {
  final ApiService _apiService;
  final StorageService _storageService;
  
  HotelRepository({
    required ApiService apiService,
    required StorageService storageService,
  }) : _apiService = apiService, _storageService = storageService;
  
  @override
  Future<Result<List<Hotel>>> getAll() async {
    try {
      final response = await _apiService.get('/hotels');
      final hotels = (response.data as List)
          .map((json) => Hotel.fromJson(json))
          .toList();
      return Result.success(hotels);
    } catch (e) {
      return Result.failure(e.toString());
    }
  }
  
  // Other implementations...
}
```

### **Service Layer**
```dart
class UserService {
  final UserRepository _userRepository;
  final AuthService _authService;
  
  UserService({
    required UserRepository userRepository,
    required AuthService authService,
  }) : _userRepository = userRepository, _authService = authService;
  
  Future<Result<User>> getCurrentUser() async {
    final token = await _authService.getToken();
    if (token == null) {
      return Result.failure('No authentication token');
    }
    
    return await _userRepository.getCurrentUser();
  }
  
  Future<Result<User>> updateUserRole(UserRole role) async {
    final currentUser = await getCurrentUser();
    if (currentUser.isFailure) {
      return currentUser;
    }
    
    final updatedUser = currentUser.data!.copyWith(role: role);
    return await _userRepository.update(updatedUser.id, updatedUser);
  }
}
```

---

## 🧪 Testing Architecture

### **Test Structure**
```
test/
├── unit/
│   ├── core/
│   ├── features/
│   └── shared/
├── widget/
│   ├── components/
│   └── screens/
├── integration/
│   ├── user_flows/
│   └── role_switching/
├── golden/
│   ├── light_theme/
│   └── dark_theme/
└── helpers/
    ├── test_helpers.dart
    ├── mock_data.dart
    └── test_providers.dart
```

### **Test Helpers**
```dart
class TestHelpers {
  static Widget createApp({
    required Widget child,
    List<Override> overrides = const [],
  }) {
    return ProviderScope(
      overrides: overrides,
      child: MaterialApp(
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        home: child,
      ),
    );
  }
  
  static List<Override> createMockProviders() {
    return [
      userServiceProvider.overrideWithValue(MockUserService()),
      authServiceProvider.overrideWithValue(MockAuthService()),
      // Other mocked providers...
    ];
  }
}
```

### **Widget Test Example**
```dart
void main() {
  group('GradientButton Widget Tests', () {
    testWidgets('displays text correctly', (tester) async {
      const buttonText = 'Test Button';
      
      await tester.pumpWidget(
        TestHelpers.createApp(
          child: const GradientButton(text: buttonText),
        ),
      );
      
      expect(find.text(buttonText), findsOneWidget);
    });
    
    testWidgets('shows loading indicator when isLoading is true', (tester) async {
      await tester.pumpWidget(
        TestHelpers.createApp(
          child: const GradientButton(
            text: 'Loading',
            isLoading: true,
          ),
        ),
      );
      
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });
}
```

---

## 📦 Dependency Management

### **Core Dependencies (`pubspec.yaml`)**
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.0
  riverpod_annotation: ^2.3.0
  
  # Navigation
  go_router: ^12.0.0
  
  # UI & Animations
  material_design_icons_flutter: ^7.0.0
  lottie: ^2.7.0
  shimmer: ^3.0.0
  
  # Networking
  dio: ^5.3.0
  connectivity_plus: ^5.0.0
  
  # Local Storage
  shared_preferences: ^2.2.0
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  
  # Utilities
  freezed_annotation: ^2.4.0
  json_annotation: ^4.8.0
  intl: ^0.18.0
  
  # Image Handling
  cached_network_image: ^3.3.0
  image_picker: ^1.0.0
  
  # Platform Integration
  permission_handler: ^11.0.0
  url_launcher: ^6.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Code Generation
  build_runner: ^2.4.0
  freezed: ^2.4.0
  json_serializable: ^6.7.0
  riverpod_generator: ^2.3.0
  
  # Linting
  flutter_lints: ^3.0.0
  
  # Testing
  mockito: ^5.4.0
  integration_test:
    sdk: flutter
```

---

## 🚀 Build & Deployment Architecture

### **Build Flavors**
```dart
// lib/core/app/app_config.dart
enum Environment { development, staging, production }

class AppConfig {
  static Environment _environment = Environment.development;
  
  static Environment get environment => _environment;
  
  static void setEnvironment(Environment env) {
    _environment = env;
  }
  
  static String get apiBaseUrl {
    switch (_environment) {
      case Environment.development:
        return 'https://dev-api.tripavail.com';
      case Environment.staging:
        return 'https://staging-api.tripavail.com';
      case Environment.production:
        return 'https://api.tripavail.com';
    }
  }
}
```

### **Platform Configuration**
```yaml
# android/app/build.gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.tripavail.app"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## ⚡ Performance Optimization Strategy

### **Widget Optimization**
1. **Const Constructors**: Use const constructors wherever possible
2. **Widget Rebuilding**: Minimize unnecessary rebuilds with Riverpod selectors
3. **List Performance**: Use `ListView.builder` for large lists
4. **Image Optimization**: Implement proper caching and compression

### **Memory Management**
1. **Dispose Pattern**: Proper disposal of controllers and streams
2. **Image Memory**: Optimize image loading and caching
3. **Animation Controllers**: Clean disposal of animation resources

### **Bundle Size**
1. **Tree Shaking**: Remove unused code
2. **Asset Optimization**: Compress images and optimize assets
3. **Font Subsetting**: Include only required font weights

---

## 🔄 Migration Strategy

### **Phase 1: Core Foundation (2-3 weeks)**
1. Set up Flutter project structure
2. Implement state management with Riverpod
3. Create navigation architecture with GoRouter
4. Implement theme system
5. Create base widgets and screens

### **Phase 2: Feature Migration (4-6 weeks)**
1. Migrate authentication system
2. Implement role management
3. Create traveler features
4. Build hotel manager functionality
5. Develop tour operator features

### **Phase 3: Advanced Features (3-4 weeks)**
1. Implement search system
2. Create onboarding flows
3. Build verification system
4. Add sophisticated animations
5. Implement testing

### **Phase 4: Polish & Launch (2-3 weeks)**
1. Performance optimization
2. UI/UX refinement
3. Testing and QA
4. Deployment setup
5. Launch preparation

---

## 📋 Success Metrics

### **Technical Metrics**
- **App Startup Time**: < 2 seconds
- **Animation Performance**: 60 FPS
- **Memory Usage**: < 100MB typical
- **Bundle Size**: < 50MB
- **Test Coverage**: > 80%

### **User Experience Metrics**
- **Role Switch Animation**: Smooth 800ms flip
- **Navigation Response**: < 100ms
- **Search Performance**: < 500ms results
- **Theme Switching**: < 300ms transition

---

## 🔍 Next Steps

1. **Review architecture decisions** with team
2. **Set up development environment** and project structure
3. **Create detailed component migration plan** (`07_core_components.md`)
4. **Define state management implementation** (`03_state_management.md`)
5. **Plan animation system details** (`10_animations.md`)

---

*This comprehensive Flutter architecture preserves all sophisticated features of the React TripAvail app while following Flutter best practices for scalability, maintainability, and performance.*