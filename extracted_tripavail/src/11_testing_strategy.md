# Flutter Testing Strategy & Implementation

## Executive Summary

This document defines the comprehensive testing strategy for TripAvail Flutter app, covering all aspects of the sophisticated role-based architecture, complex animations, API integration, and offline capabilities. The strategy ensures quality, reliability, and performance across all user roles while maintaining the advanced features from the React implementation.

### Key Testing Areas
- **Role-Specific Features**: Comprehensive testing for traveler, hotel manager, and tour operator features
- **Animation System**: Testing complex 3D flip animations, micro-interactions, and state transitions
- **API Integration**: Testing offline-first architecture, real-time sync, and error handling
- **State Management**: Testing Riverpod providers, state consistency, and cross-role interactions
- **UI/UX Components**: Testing responsive design, dark mode, and accessibility
- **Performance**: Testing animation performance, memory usage, and battery optimization

---

## 🧪 Testing Architecture Overview

### **Testing Pyramid Structure**
```
TripAvail Testing Strategy
├── End-to-End Tests (E2E)
│   ├── Role Switching Flows
│   ├── Complete User Journeys
│   ├── Cross-Platform Testing
│   └── Performance Testing
├── Integration Tests
│   ├── API Integration Testing
│   ├── Database Sync Testing
│   ├── Animation Integration
│   └── Cross-Role Interactions
├── Widget Tests
│   ├── Screen-Level Testing
│   ├── Component Integration
│   ├── User Interaction Testing
│   └── Visual Regression Testing
└── Unit Tests
    ├── Business Logic Testing
    ├── Provider Testing
    ├── Service Layer Testing
    └── Utility Function Testing
```

### **Testing Configuration Setup**
```dart
// test/test_config.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mocktail/mocktail.dart';

class TestConfig {
  static Future<void> setupTestEnvironment() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    
    // Initialize Hive for testing
    await Hive.initFlutter('.test');
    
    // Register fallback values for mocktail
    registerFallbackValue(MockUser());
    registerFallbackValue(MockSearchFilters());
    registerFallbackValue(MockApiException());
    registerFallbackValue(MockUserRole());
    
    // Set up test-specific configurations
    await _setupTestDatabases();
    await _setupTestServices();
  }
  
  static Future<void> _setupTestDatabases() async {
    // Initialize test databases
    await Hive.openBox<User>('test_users');
    await Hive.openBox<Property>('test_properties');
    await Hive.openBox<Tour>('test_tours');
    await Hive.openBox<Booking>('test_bookings');
  }
  
  static Future<void> _setupTestServices() async {
    // Setup mock services for testing
  }
  
  static void tearDown() async {
    await Hive.close();
  }
  
  // Create test container with overrides
  static ProviderContainer createTestContainer({
    List<Override> overrides = const [],
  }) {
    return ProviderContainer(
      overrides: [
        // Default test overrides
        apiClientProvider.overrideWith((ref) => MockApiClient()),
        databaseManagerProvider.overrideWith((ref) => MockDatabaseManager()),
        authManagerProvider.overrideWith((ref) => MockAuthManager()),
        ...overrides,
      ],
    );
  }
}

// Test helper functions
class TestHelpers {
  static Widget wrapWithProviders(
    Widget child, {
    List<Override> overrides = const [],
  }) {
    return ProviderScope(
      overrides: overrides,
      child: MaterialApp(
        home: child,
        theme: ThemeData(),
        darkTheme: ThemeData.dark(),
      ),
    );
  }
  
  static Widget wrapWithTripAvailApp(
    Widget child, {
    List<Override> overrides = const [],
    ThemeMode themeMode = ThemeMode.light,
  }) {
    return ProviderScope(
      overrides: overrides,
      child: TripAvailApp(
        home: child,
        themeMode: themeMode,
      ),
    );
  }
  
  // Animation testing helpers
  static Future<void> pumpAndSettle(
    WidgetTester tester, {
    Duration duration = const Duration(seconds: 1),
  }) async {
    await tester.pump();
    await tester.pump(duration);
    await tester.pumpAndSettle();
  }
  
  // Find widgets by role-specific data attributes
  static Finder findByTestId(String testId) {
    return find.byKey(Key(testId));
  }
  
  static Finder findByRole(UserRole role) {
    return find.byKey(Key('role_${role.value}'));
  }
}
```

---

## 🔧 Unit Testing Strategy

### **Provider Testing Framework**
```dart
// test/unit/providers/user_role_provider_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';

import '../../../lib/core/providers/user_role_provider.dart';
import '../../mocks/mock_auth_manager.dart';
import '../../test_config.dart';

void main() {
  group('UserRoleProvider Tests', () {
    late ProviderContainer container;
    late MockAuthManager mockAuthManager;
    
    setUp(() async {
      await TestConfig.setupTestEnvironment();
      mockAuthManager = MockAuthManager();
      
      container = TestConfig.createTestContainer(
        overrides: [
          authManagerProvider.overrideWith((ref) => mockAuthManager),
        ],
      );
    });
    
    tearDown(() {
      container.dispose();
    });
    
    group('Role Switching', () {
      test('should switch from traveler to hotel manager', () async {
        // Arrange
        when(() => mockAuthManager.currentUser).thenReturn(
          const User(id: '1', role: UserRole.traveler),
        );
        
        // Act
        final notifier = container.read(userRoleProvider.notifier);
        await notifier.switchRole(UserRole.hotelManager);
        
        // Assert
        final currentRole = container.read(userRoleProvider);
        expect(currentRole, UserRole.hotelManager);
        verify(() => mockAuthManager.updateUserRole(UserRole.hotelManager)).called(1);
      });
      
      test('should handle role switch failure gracefully', () async {
        // Arrange
        when(() => mockAuthManager.updateUserRole(any()))
            .thenThrow(ApiException.serverError('Failed to update role'));
        
        // Act & Assert
        final notifier = container.read(userRoleProvider.notifier);
        expect(
          () => notifier.switchRole(UserRole.tourOperator),
          throwsA(isA<ApiException>()),
        );
      });
      
      test('should maintain role persistence across app restarts', () async {
        // Arrange
        const persistedRole = UserRole.hotelManager;
        when(() => mockAuthManager.getPersistedRole())
            .thenAnswer((_) async => persistedRole);
        
        // Act
        final notifier = container.read(userRoleProvider.notifier);
        await notifier.initializeRole();
        
        // Assert
        final currentRole = container.read(userRoleProvider);
        expect(currentRole, persistedRole);
      });
    });
    
    group('Permission Validation', () {
      test('should validate traveler permissions correctly', () {
        // Arrange
        container.read(userRoleProvider.notifier).setRole(UserRole.traveler);
        
        // Act & Assert
        expect(
          container.read(userRoleProvider.notifier).hasPermission(RoleFeature.tripPlanning),
          true,
        );
        expect(
          container.read(userRoleProvider.notifier).hasPermission(RoleFeature.propertyManagement),
          false,
        );
      });
      
      test('should validate hotel manager permissions correctly', () {
        // Arrange
        container.read(userRoleProvider.notifier).setRole(UserRole.hotelManager);
        
        // Act & Assert
        expect(
          container.read(userRoleProvider.notifier).hasPermission(RoleFeature.propertyManagement),
          true,
        );
        expect(
          container.read(userRoleProvider.notifier).hasPermission(RoleFeature.tourCreation),
          false,
        );
      });
      
      test('should validate tour operator permissions correctly', () {
        // Arrange
        container.read(userRoleProvider.notifier).setRole(UserRole.tourOperator);
        
        // Act & Assert
        expect(
          container.read(userRoleProvider.notifier).hasPermission(RoleFeature.tourCreation),
          true,
        );
        expect(
          container.read(userRoleProvider.notifier).hasPermission(RoleFeature.propertyManagement),
          false,
        );
      });
    });
  });
}
```

### **Service Layer Testing**
```dart
// test/unit/services/search_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import '../../../lib/core/services/search_service.dart';
import '../../mocks/mock_api_client.dart';
import '../../mocks/mock_database_manager.dart';
import '../../test_config.dart';

void main() {
  group('SearchService Tests', () {
    late SearchService searchService;
    late MockApiClient mockApiClient;
    late MockDatabaseManager mockDatabaseManager;
    
    setUp(() async {
      await TestConfig.setupTestEnvironment();
      mockApiClient = MockApiClient();
      mockDatabaseManager = MockDatabaseManager();
      searchService = SearchService(mockApiClient, mockDatabaseManager);
    });
    
    group('Online Search', () {
      test('should perform successful search with filters', () async {
        // Arrange
        final filters = SearchFilters(
          query: 'Paris hotels',
          category: 'hotels',
          priceRange: [100, 500],
        );
        
        final mockResponse = Response(
          data: {
            'items': [
              {'id': '1', 'name': 'Hotel Paris', 'type': 'hotel'},
              {'id': '2', 'name': 'Paris Resort', 'type': 'hotel'},
            ],
            'totalCount': 2,
            'page': 1,
            'pageSize': 20,
          },
          requestOptions: RequestOptions(path: '/search'),
        );
        
        when(() => mockApiClient.get(
          '/search',
          queryParameters: any(named: 'queryParameters'),
        )).thenAnswer((_) async => mockResponse);
        
        // Act
        final result = await searchService.search(filters: filters);
        
        // Assert
        expect(result.items.length, 2);
        expect(result.totalCount, 2);
        expect(result.items.first.name, 'Hotel Paris');
        verify(() => mockApiClient.get('/search', queryParameters: any(named: 'queryParameters'))).called(1);
      });
      
      test('should cache search results', () async {
        // Arrange
        final filters = SearchFilters(query: 'test');
        final mockResults = SearchResults<SearchItem>(
          items: [SearchItem(id: '1', name: 'Test Item')],
          totalCount: 1,
          page: 1,
          pageSize: 20,
        );
        
        when(() => mockDatabaseManager.getBox<String>('cache'))
            .thenReturn(MockBox<String>());
        
        // Act
        await searchService._cacheResults('test_key', mockResults);
        
        // Assert
        verify(() => mockDatabaseManager.getBox<String>('cache')).called(1);
      });
    });
    
    group('Offline Search', () {
      test('should fallback to offline search when network fails', () async {
        // Arrange
        final filters = SearchFilters(query: 'offline test');
        
        when(() => mockApiClient.get(any(), queryParameters: any(named: 'queryParameters')))
            .thenThrow(ApiException.network('No connection'));
        
        when(() => mockDatabaseManager.database).thenReturn(MockDatabase());
        
        // Mock offline search results
        when(() => mockDatabaseManager.database.query(
          'properties',
          where: any(named: 'where'),
          whereArgs: any(named: 'whereArgs'),
          limit: any(named: 'limit'),
        )).thenAnswer((_) async => [
          {'id': '1', 'name': 'Offline Hotel', 'type': 'hotel'},
        ]);
        
        // Act
        final result = await searchService.searchHotels(filters: filters);
        
        // Assert
        expect(result.items.length, 1);
        expect(result.items.first.name, 'Offline Hotel');
      });
      
      test('should provide search suggestions from cache', () async {
        // Arrange
        const query = 'par';
        
        when(() => mockDatabaseManager.database).thenReturn(MockDatabase());
        when(() => mockDatabaseManager.database.query(
          'properties',
          where: any(named: 'where'),
          whereArgs: any(named: 'whereArgs'),
          limit: any(named: 'limit'),
        )).thenAnswer((_) async => [
          {'id': '1', 'name': 'Paris Hotel', 'location_address': 'Paris, France'},
        ]);
        
        // Act
        final suggestions = await searchService._getOfflineSuggestions(query);
        
        // Assert
        expect(suggestions.length, 1);
        expect(suggestions.first.text, 'Paris Hotel');
        expect(suggestions.first.type, 'property');
      });
    });
    
    group('Search History', () {
      test('should save search history', () async {
        // Arrange
        final filters = SearchFilters(query: 'test query');
        const resultCount = 5;
        
        when(() => mockDatabaseManager.getBox<SearchHistory>('search_history'))
            .thenReturn(MockBox<SearchHistory>());
        
        // Act
        await searchService.saveSearchHistory(filters, resultCount);
        
        // Assert
        verify(() => mockDatabaseManager.getBox<SearchHistory>('search_history')).called(1);
      });
      
      test('should retrieve search history sorted by date', () async {
        // Arrange
        final mockHistory = [
          SearchHistory(
            id: '1',
            query: 'Old search',
            searchedAt: DateTime.now().subtract(const Duration(days: 1)),
          ),
          SearchHistory(
            id: '2',
            query: 'Recent search',
            searchedAt: DateTime.now(),
          ),
        ];
        
        final mockBox = MockBox<SearchHistory>();
        when(() => mockBox.values).thenReturn(mockHistory);
        when(() => mockDatabaseManager.getBox<SearchHistory>('search_history'))
            .thenReturn(mockBox);
        
        // Act
        final history = await searchService.getSearchHistory();
        
        // Assert
        expect(history.length, 2);
        expect(history.first.query, 'Recent search'); // Most recent first
        expect(history.last.query, 'Old search');
      });
    });
  });
}
```

### **Animation Testing**
```dart
// test/unit/animations/animation_controller_test.dart
import 'package:flutter/animation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import '../../../lib/core/animations/animation_controller_manager.dart';
import '../../test_config.dart';

void main() {
  group('AnimationController Tests', () {
    late AnimationControllerManager manager;
    late MockTickerProvider mockTickerProvider;
    
    setUp(() async {
      await TestConfig.setupTestEnvironment();
      mockTickerProvider = MockTickerProvider();
      manager = AnimationControllerManager();
    });
    
    group('Controller Management', () {
      testWidgets('should create and reuse animation controllers', (tester) async {
        // Arrange
        const key = 'test_animation';
        const duration = Duration(milliseconds: 300);
        
        // Act
        final controller1 = AnimationControllerManager.getOrCreate(
          key,
          tester,
          duration: duration,
        );
        
        final controller2 = AnimationControllerManager.getOrCreate(
          key,
          tester,
          duration: duration,
        );
        
        // Assert
        expect(controller1, same(controller2));
        expect(controller1.duration, duration);
      });
      
      testWidgets('should dispose controllers after delay', (tester) async {
        // Arrange
        const key = 'disposable_animation';
        const duration = Duration(milliseconds: 300);
        
        final controller = AnimationControllerManager.getOrCreate(
          key,
          tester,
          duration: duration,
        );
        
        // Act
        AnimationControllerManager.releaseController(key);
        
        // Fast-forward time
        await tester.pump(const Duration(seconds: 3));
        
        // Assert
        expect(controller.isDisposed, true);
      });
      
      testWidgets('should cancel disposal if controller is reused', (tester) async {
        // Arrange
        const key = 'reused_animation';
        const duration = Duration(milliseconds: 300);
        
        final controller1 = AnimationControllerManager.getOrCreate(
          key,
          tester,
          duration: duration,
        );
        
        // Act
        AnimationControllerManager.releaseController(key);
        
        // Reuse before disposal
        final controller2 = AnimationControllerManager.getOrCreate(
          key,
          tester,
          duration: duration,
        );
        
        await tester.pump(const Duration(seconds: 3));
        
        // Assert
        expect(controller1, same(controller2));
        expect(controller1.isDisposed, false);
      });
    });
    
    group('Animation Performance', () {
      testWidgets('should monitor animation performance', (tester) async {
        // Arrange
        final monitor = AnimationPerformanceMonitor();
        const animationId = 'test_performance';
        
        // Act
        monitor.startTiming(animationId);
        
        // Simulate animation frames
        for (int i = 0; i < 60; i++) {
          await tester.pump(const Duration(milliseconds: 16));
          monitor.recordFrame(animationId);
        }
        
        monitor.stopTiming(animationId);
        
        // Assert
        final avgFrameTime = monitor.getAverageFrameTime(animationId);
        final frameRate = monitor.getFrameRate(animationId);
        
        expect(avgFrameTime, greaterThan(0));
        expect(frameRate, closeTo(60, 5)); // Allow 5fps tolerance
      });
      
      test('should detect performance issues', () {
        // Arrange
        final monitor = AnimationPerformanceMonitor();
        const animationId = 'slow_animation';
        
        // Act
        monitor.startTiming(animationId);
        
        // Simulate slow frame
        final slowFrameDuration = const Duration(milliseconds: 50); // 20fps
        monitor._checkPerformance(animationId, slowFrameDuration);
        
        // Assert
        // Verify warning was logged (would require mock logger in real implementation)
        expect(monitor.getFrameRate(animationId), lessThan(30));
      });
    });
  });
}
```

---

## 🖼️ Widget Testing Strategy

### **Screen Component Testing**
```dart
// test/widget/screens/traveler_dashboard_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';

import '../../../lib/features/traveler/dashboard/traveler_dashboard.dart';
import '../../../lib/core/providers/user_provider.dart';
import '../../mocks/mock_dashboard_service.dart';
import '../../test_config.dart';

void main() {
  group('TravelerDashboard Widget Tests', () {
    late MockDashboardService mockDashboardService;
    
    setUp(() async {
      await TestConfig.setupTestEnvironment();
      mockDashboardService = MockDashboardService();
    });
    
    group('Dashboard Rendering', () {
      testWidgets('should display welcome section with user name', (tester) async {
        // Arrange
        const testUser = User(
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.traveler,
        );
        
        final dashboardData = TravelerDashboardData(
          recentBookings: [],
          featuredDestinations: [],
          trendingTours: [],
          travelStats: const TravelStats(),
        );
        
        when(() => mockDashboardService.getTravelerDashboard())
            .thenAnswer((_) async => dashboardData);
        
        // Act
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const TravelerDashboard(),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              travelerDashboardProvider.overrideWith(
                (ref) => Future.value(dashboardData),
              ),
            ],
          ),
        );
        
        await tester.pumpAndSettle();
        
        // Assert
        expect(find.text('Good morning, John!'), findsOneWidget);
        expect(find.text('Where would you like to explore today?'), findsOneWidget);
        expect(find.byType(ProfileAvatar), findsOneWidget);
      });
      
      testWidgets('should display quick actions grid', (tester) async {
        // Arrange
        const testUser = User(id: '1', role: UserRole.traveler);
        final dashboardData = TravelerDashboardData(
          recentBookings: [],
          featuredDestinations: [],
          trendingTours: [],
          travelStats: const TravelStats(),
        );
        
        when(() => mockDashboardService.getTravelerDashboard())
            .thenAnswer((_) async => dashboardData);
        
        // Act
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const TravelerDashboard(),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              travelerDashboardProvider.overrideWith(
                (ref) => Future.value(dashboardData),
              ),
            ],
          ),
        );
        
        await tester.pumpAndSettle();
        
        // Assert
        expect(find.text('Quick Actions'), findsOneWidget);
        expect(find.text('Plan Trip'), findsOneWidget);
        expect(find.text('Find Hotels'), findsOneWidget);
        expect(find.text('Discover Tours'), findsOneWidget);
        expect(find.text('My Wishlist'), findsOneWidget);
        expect(find.byType(QuickActionCard), findsNWidgets(4));
      });
      
      testWidgets('should handle quick action taps', (tester) async {
        // Arrange
        const testUser = User(id: '1', role: UserRole.traveler);
        final dashboardData = TravelerDashboardData(
          recentBookings: [],
          featuredDestinations: [],
          trendingTours: [],
          travelStats: const TravelStats(),
        );
        
        when(() => mockDashboardService.getTravelerDashboard())
            .thenAnswer((_) async => dashboardData);
        
        // Act
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const TravelerDashboard(),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              travelerDashboardProvider.overrideWith(
                (ref) => Future.value(dashboardData),
              ),
            ],
          ),
        );
        
        await tester.pumpAndSettle();
        
        // Find and tap the "Plan Trip" action
        await tester.tap(find.text('Plan Trip'));
        await tester.pumpAndSettle();
        
        // Assert
        // Verify navigation or state change
        // (In real implementation, you'd mock GoRouter or navigation service)
      });
      
      testWidgets('should display recent bookings when available', (tester) async {
        // Arrange
        const testUser = User(id: '1', role: UserRole.traveler);
        final mockBookings = [
          Booking(
            id: '1',
            userId: '1',
            packageId: 'pkg1',
            status: BookingStatus.confirmed,
            details: const BookingDetails(packageName: 'Paris Package'),
            payment: const PaymentInfo(totalAmount: 500),
            createdAt: DateTime.now(),
          ),
        ];
        
        final dashboardData = TravelerDashboardData(
          recentBookings: mockBookings,
          featuredDestinations: [],
          trendingTours: [],
          travelStats: const TravelStats(),
        );
        
        when(() => mockDashboardService.getTravelerDashboard())
            .thenAnswer((_) async => dashboardData);
        
        // Act
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const TravelerDashboard(),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              travelerDashboardProvider.overrideWith(
                (ref) => Future.value(dashboardData),
              ),
            ],
          ),
        );
        
        await tester.pumpAndSettle();
        
        // Assert
        expect(find.text('Recent Bookings'), findsOneWidget);
        expect(find.byType(BookingCard), findsOneWidget);
        expect(find.text('View All'), findsOneWidget);
      });
    });
    
    group('Error Handling', () {
      testWidgets('should display error state when dashboard loading fails', (tester) async {
        // Arrange
        const testUser = User(id: '1', role: UserRole.traveler);
        
        when(() => mockDashboardService.getTravelerDashboard())
            .thenThrow(ApiException.serverError('Server error'));
        
        // Act
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const TravelerDashboard(),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              dashboardServiceProvider.overrideWith((ref) => mockDashboardService),
            ],
          ),
        );
        
        await tester.pumpAndSettle();
        
        // Assert
        expect(find.text('Unable to load dashboard'), findsOneWidget);
        expect(find.text('Please check your connection and try again'), findsOneWidget);
        expect(find.text('Retry'), findsOneWidget);
      });
      
      testWidgets('should retry loading when retry button is tapped', (tester) async {
        // Arrange
        const testUser = User(id: '1', role: UserRole.traveler);
        
        when(() => mockDashboardService.getTravelerDashboard())
            .thenThrow(ApiException.serverError('Server error'));
        
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const TravelerDashboard(),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              dashboardServiceProvider.overrideWith((ref) => mockDashboardService),
            ],
          ),
        );
        
        await tester.pumpAndSettle();
        
        // Setup successful response for retry
        final dashboardData = TravelerDashboardData(
          recentBookings: [],
          featuredDestinations: [],
          trendingTours: [],
          travelStats: const TravelStats(),
        );
        
        when(() => mockDashboardService.getTravelerDashboard())
            .thenAnswer((_) async => dashboardData);
        
        // Act
        await tester.tap(find.text('Retry'));
        await tester.pumpAndSettle();
        
        // Assert
        expect(find.text('Quick Actions'), findsOneWidget);
        verify(() => mockDashboardService.getTravelerDashboard()).called(2);
      });
    });
    
    group('Pull to Refresh', () {
      testWidgets('should refresh dashboard data when pulled down', (tester) async {
        // Arrange
        const testUser = User(id: '1', role: UserRole.traveler);
        final dashboardData = TravelerDashboardData(
          recentBookings: [],
          featuredDestinations: [],
          trendingTours: [],
          travelStats: const TravelStats(),
        );
        
        when(() => mockDashboardService.getTravelerDashboard())
            .thenAnswer((_) async => dashboardData);
        
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const TravelerDashboard(),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              dashboardServiceProvider.overrideWith((ref) => mockDashboardService),
            ],
          ),
        );
        
        await tester.pumpAndSettle();
        
        // Act
        await tester.fling(
          find.byType(RefreshIndicator),
          const Offset(0, 300),
          1000,
        );
        await tester.pumpAndSettle();
        
        // Assert
        verify(() => mockDashboardService.getTravelerDashboard()).called(2);
      });
    });
  });
}
```

### **Animation Widget Testing**
```dart
// test/widget/animations/screen_flip_animation_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../lib/core/animations/screen_flip_animation.dart';
import '../../test_config.dart';

void main() {
  group('ScreenFlipAnimation Widget Tests', () {
    setUp(() async {
      await TestConfig.setupTestEnvironment();
    });
    
    group('Animation Lifecycle', () {
      testWidgets('should start flip animation on mount', (tester) async {
        // Act
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const ScreenFlipAnimation(),
          ),
        );
        
        // Initial pump
        await tester.pump();
        
        // Assert initial state
        expect(find.byType(ScreenFlipAnimation), findsOneWidget);
        
        // Verify animation container is present
        final containerFinder = find.byWidgetPredicate(
          (widget) => widget is Container && 
                     widget.decoration is BoxDecoration,
        );
        expect(containerFinder, findsOneWidget);
      });
      
      testWidgets('should complete animation sequence', (tester) async {
        // Arrange
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const ScreenFlipAnimation(),
          ),
        );
        
        // Act - advance animation to completion
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 400)); // Mid-animation
        await tester.pump(const Duration(milliseconds: 400)); // Complete
        await tester.pumpAndSettle();
        
        // Assert
        // Verify animation state provider was updated
        // (In real implementation, you'd verify the provider state change)
      });
      
      testWidgets('should display animated icon during flip', (tester) async {
        // Arrange
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const ScreenFlipAnimation(),
          ),
        );
        
        // Act
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 200));
        
        // Assert
        expect(find.byIcon(Icons.swap_horiz), findsOneWidget);
        
        // Verify icon container styling
        final iconContainer = tester.widget<Container>(
          find.ancestor(
            of: find.byIcon(Icons.swap_horiz),
            matching: find.byType(Container),
          ),
        );
        
        expect(iconContainer.decoration, isA<BoxDecoration>());
      });
      
      testWidgets('should apply gradient animation', (tester) async {
        // Arrange
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const ScreenFlipAnimation(),
          ),
        );
        
        // Act
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 100));
        
        // Assert
        final container = tester.widget<Container>(
          find.byType(Container).first,
        );
        
        final decoration = container.decoration as BoxDecoration;
        expect(decoration.gradient, isA<LinearGradient>());
        
        final gradient = decoration.gradient as LinearGradient;
        expect(gradient.colors.length, 2);
      });
    });
    
    group('Performance', () {
      testWidgets('should maintain 60fps during animation', (tester) async {
        // Arrange
        final frameCount = <Duration>[];
        
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const ScreenFlipAnimation(),
          ),
        );
        
        // Act - measure frame times
        final stopwatch = Stopwatch()..start();
        for (int i = 0; i < 48; i++) { // 800ms at 60fps
          await tester.pump(const Duration(milliseconds: 16));
          frameCount.add(stopwatch.elapsed);
        }
        
        // Assert
        expect(frameCount.length, 48);
        
        // Check that frame times are consistent (within tolerance)
        for (int i = 1; i < frameCount.length; i++) {
          final frameDuration = frameCount[i] - frameCount[i - 1];
          expect(frameDuration.inMilliseconds, lessThanOrEqualTo(20)); // Allow 4ms tolerance
        }
      });
      
      testWidgets('should not leak memory after completion', (tester) async {
        // Arrange
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            const ScreenFlipAnimation(),
          ),
        );
        
        // Act - complete animation
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 800));
        await tester.pumpAndSettle();
        
        // Remove widget
        await tester.pumpWidget(const SizedBox.shrink());
        
        // Assert
        // Verify no active animations remain
        // (In real implementation, you'd check AnimationController disposal)
      });
    });
  });
}
```

### **Role-Specific Component Testing**
```dart
// test/widget/components/permission_gate_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../lib/core/role/permission_manager.dart';
import '../../test_config.dart';

void main() {
  group('PermissionGate Widget Tests', () {
    setUp(() async {
      await TestConfig.setupTestEnvironment();
    });
    
    group('Access Control', () {
      testWidgets('should show content for authorized role', (tester) async {
        // Arrange
        const testUser = User(
          id: '1',
          role: UserRole.hotelManager,
          isVerified: true,
        );
        
        // Act
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            PermissionGate(
              feature: RoleFeature.propertyManagement,
              child: const Text('Property Management Content'),
            ),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              currentRoleProvider.overrideWith((ref) => UserRole.hotelManager),
            ],
          ),
        );
        
        // Assert
        expect(find.text('Property Management Content'), findsOneWidget);
      });
      
      testWidgets('should hide content for unauthorized role', (tester) async {
        // Arrange
        const testUser = User(
          id: '1',
          role: UserRole.traveler,
          isVerified: true,
        );
        
        // Act
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            PermissionGate(
              feature: RoleFeature.propertyManagement,
              child: const Text('Property Management Content'),
            ),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              currentRoleProvider.overrideWith((ref) => UserRole.traveler),
            ],
          ),
        );
        
        // Assert
        expect(find.text('Property Management Content'), findsNothing);
        expect(find.byType(SizedBox), findsOneWidget); // Fallback widget
      });
      
      testWidgets('should show verification required for unverified user', (tester) async {
        // Arrange
        const testUser = User(
          id: '1',
          role: UserRole.hotelManager,
          isVerified: false,
        );
        
        // Act
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            PermissionGate(
              feature: RoleFeature.propertyManagement,
              requiresVerification: true,
              child: const Text('Property Management Content'),
            ),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              currentRoleProvider.overrideWith((ref) => UserRole.hotelManager),
            ],
          ),
        );
        
        // Assert
        expect(find.text('Verification Required'), findsOneWidget);
        expect(find.text('You need to complete verification to access this feature'), findsOneWidget);
        expect(find.text('Complete Verification'), findsOneWidget);
        expect(find.text('Property Management Content'), findsNothing);
      });
      
      testWidgets('should navigate to verification when button tapped', (tester) async {
        // Arrange
        const testUser = User(
          id: '1',
          role: UserRole.hotelManager,
          isVerified: false,
        );
        
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            PermissionGate(
              feature: RoleFeature.propertyManagement,
              requiresVerification: true,
              child: const Text('Property Management Content'),
            ),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              currentRoleProvider.overrideWith((ref) => UserRole.hotelManager),
            ],
          ),
        );
        
        // Act
        await tester.tap(find.text('Complete Verification'));
        await tester.pumpAndSettle();
        
        // Assert
        // Verify navigation to verification screen
        // (In real implementation, you'd mock and verify GoRouter navigation)
      });
      
      testWidgets('should show custom fallback when provided', (tester) async {
        // Arrange
        const testUser = User(
          id: '1',
          role: UserRole.traveler,
          isVerified: true,
        );
        
        // Act
        await tester.pumpWidget(
          TestHelpers.wrapWithProviders(
            PermissionGate(
              feature: RoleFeature.propertyManagement,
              child: const Text('Property Management Content'),
              fallback: const Text('Custom Fallback'),
            ),
            overrides: [
              currentUserProvider.overrideWith((ref) => testUser),
              currentRoleProvider.overrideWith((ref) => UserRole.traveler),
            ],
          ),
        );
        
        // Assert
        expect(find.text('Custom Fallback'), findsOneWidget);
        expect(find.text('Property Management Content'), findsNothing);
      });
    });
  });
}
```

---

## 🔗 Integration Testing Strategy

### **API Integration Testing**
```dart
// test/integration/api_integration_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:mocktail/mocktail.dart';

import '../../lib/core/api/http_client.dart';
import '../../lib/core/services/search_service.dart';
import '../mocks/mock_dio.dart';
import '../test_config.dart';

void main() {
  group('API Integration Tests', () {
    late MockDio mockDio;
    late ApiHttpClient apiClient;
    late SearchService searchService;
    
    setUp(() async {
      await TestConfig.setupTestEnvironment();
      mockDio = MockDio();
      apiClient = ApiHttpClient(dio: mockDio);
      searchService = SearchService(apiClient, MockDatabaseManager());
    });
    
    group('Search API Integration', () {
      test('should perform end-to-end search flow', () async {
        // Arrange
        final searchFilters = SearchFilters(
          query: 'Paris hotels',
          category: 'hotels',
          priceRange: [100, 500],
          minRating: 4.0,
        );
        
        final mockResponse = Response(
          requestOptions: RequestOptions(path: '/search'),
          data: {
            'items': [
              {
                'id': '1',
                'name': 'Hotel Paris',
                'type': 'hotel',
                'rating': 4.5,
                'price': 250,
                'location': 'Paris, France',
              },
              {
                'id': '2',
                'name': 'Paris Resort',
                'type': 'hotel',
                'rating': 4.2,
                'price': 350,
                'location': 'Paris, France',
              },
            ],
            'totalCount': 2,
            'page': 1,
            'pageSize': 20,
            'totalPages': 1,
            'hasNextPage': false,
            'hasPreviousPage': false,
          },
        );
        
        when(() => mockDio.get(
          '/search',
          queryParameters: any(named: 'queryParameters'),
          options: any(named: 'options'),
          cancelToken: any(named: 'cancelToken'),
        )).thenAnswer((_) async => mockResponse);
        
        // Act
        final result = await searchService.search(filters: searchFilters);
        
        // Assert
        expect(result.items.length, 2);
        expect(result.totalCount, 2);
        expect(result.items.first.name, 'Hotel Paris');
        expect(result.items.first.rating, 4.5);
        
        // Verify API call
        verify(() => mockDio.get(
          '/search',
          queryParameters: {
            'query': 'Paris hotels',
            'category': 'hotels',
            'price_min': 100,
            'price_max': 500,
            'min_rating': 4.0,
            'page': 1,
            'page_size': 20,
          },
          options: any(named: 'options'),
          cancelToken: any(named: 'cancelToken'),
        )).called(1);
      });
      
      test('should handle API errors gracefully', () async {
        // Arrange
        final searchFilters = SearchFilters(query: 'test');
        
        when(() => mockDio.get(
          any(),
          queryParameters: any(named: 'queryParameters'),
          options: any(named: 'options'),
          cancelToken: any(named: 'cancelToken'),
        )).thenThrow(DioException(
          requestOptions: RequestOptions(path: '/search'),
          type: DioExceptionType.connectionTimeout,
          message: 'Connection timeout',
        ));
        
        // Act & Assert
        expect(
          () => searchService.search(filters: searchFilters),
          throwsA(isA<ApiException>()),
        );
      });
      
      test('should cache search results correctly', () async {
        // Arrange
        final searchFilters = SearchFilters(query: 'cache test');
        
        final mockResponse = Response(
          requestOptions: RequestOptions(path: '/search'),
          data: {
            'items': [{'id': '1', 'name': 'Cached Item'}],
            'totalCount': 1,
            'page': 1,
            'pageSize': 20,
          },
        );
        
        when(() => mockDio.get(
          any(),
          queryParameters: any(named: 'queryParameters'),
          options: any(named: 'options'),
          cancelToken: any(named: 'cancelToken'),
        )).thenAnswer((_) async => mockResponse);
        
        // Act - First call
        final result1 = await searchService.search(filters: searchFilters);
        
        // Second call should use cache
        final result2 = await searchService.search(
          filters: searchFilters,
          useCache: true,
        );
        
        // Assert
        expect(result1.items.length, 1);
        expect(result2.items.length, 1);
        expect(result1.items.first.name, result2.items.first.name);
        
        // Verify API was called only once (second call used cache)
        verify(() => mockDio.get(
          any(),
          queryParameters: any(named: 'queryParameters'),
          options: any(named: 'options'),
          cancelToken: any(named: 'cancelToken'),
        )).called(1);
      });
    });
    
    group('Authentication Integration', () {
      test('should handle token refresh automatically', () async {
        // Arrange
        final authManager = MockAuthManager();
        final authenticatedApiClient = ApiHttpClient(
          dio: mockDio,
          authManager: authManager,
        );
        
        // Mock initial unauthorized response
        when(() => mockDio.get(any(), options: any(named: 'options')))
            .thenThrow(DioException(
              requestOptions: RequestOptions(path: '/test'),
              response: Response(
                requestOptions: RequestOptions(path: '/test'),
                statusCode: 401,
              ),
            ));
        
        // Mock successful token refresh
        when(() => authManager.refreshAccessToken())
            .thenAnswer((_) async => true);
        
        // Mock successful retry with new token
        when(() => mockDio.fetch(any()))
            .thenAnswer((_) async => Response(
              requestOptions: RequestOptions(path: '/test'),
              data: {'success': true},
            ));
        
        // Act
        final response = await authenticatedApiClient.get('/test');
        
        // Assert
        expect(response.data['success'], true);
        verify(() => authManager.refreshAccessToken()).called(1);
      });
    });
  });
}
```

### **Database Integration Testing**
```dart
// test/integration/database_integration_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../../lib/core/database/database_manager.dart';
import '../../lib/core/sync/sync_manager.dart';
import '../test_config.dart';

void main() {
  group('Database Integration Tests', () {
    late DatabaseManager databaseManager;
    late SyncManager syncManager;
    
    setUpAll(() async {
      // Initialize FFI for testing
      sqfliteFfiInit();
      databaseFactory = databaseFactoryFfi;
      
      // Initialize Hive for testing
      await Hive.initFlutter('.test');
    });
    
    setUp(() async {
      await TestConfig.setupTestEnvironment();
      databaseManager = DatabaseManager();
      await databaseManager.initialize();
      
      syncManager = SyncManager(
        databaseManager,
        MockApiClient(),
        ConnectivityResult.wifi,
      );
    });
    
    tearDown() async {
      await databaseManager.clearAllData();
    });
    
    group('Data Persistence', () {
      test('should store and retrieve user data', () async {
        // Arrange
        final user = User(
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.traveler,
          createdAt: DateTime.now(),
        );
        
        // Act
        final usersBox = databaseManager.getBox<User>('users');
        await usersBox.put(user.id, user);
        
        // Assert
        final retrievedUser = usersBox.get(user.id);
        expect(retrievedUser?.id, user.id);
        expect(retrievedUser?.name, user.name);
        expect(retrievedUser?.email, user.email);
        expect(retrievedUser?.role, user.role);
      });
      
      test('should handle complex property data', () async {
        // Arrange
        final property = Property(
          id: 'prop1',
          ownerId: 'user1',
          name: 'Test Hotel',
          type: PropertyType.hotel,
          location: const Location(
            latitude: 48.8566,
            longitude: 2.3522,
            address: 'Paris, France',
          ),
          amenities: [
            const Amenity(id: '1', name: 'WiFi', icon: 'wifi'),
            const Amenity(id: '2', name: 'Pool', icon: 'pool'),
          ],
          rooms: [
            Room(
              id: 'room1',
              type: RoomType.single,
              name: 'Standard Single',
              basePrice: 100.0,
              amenities: ['wifi', 'ac'],
            ),
          ],
          isActive: true,
          isVerified: false,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        
        // Act
        final propertiesBox = databaseManager.getBox<Property>('properties');
        await propertiesBox.put(property.id, property);
        
        // Assert
        final retrievedProperty = propertiesBox.get(property.id);
        expect(retrievedProperty?.id, property.id);
        expect(retrievedProperty?.name, property.name);
        expect(retrievedProperty?.amenities.length, 2);
        expect(retrievedProperty?.rooms.length, 1);
        expect(retrievedProperty?.location.address, 'Paris, France');
      });
    });
    
    group('Sync Operations', () {
      test('should add items to sync queue when offline', () async {
        // Arrange
        final property = {
          'name': 'New Hotel',
          'type': 'hotel',
          'location': 'Test Location',
        };
        
        // Act
        await syncManager.addToSyncQueue(
          'properties',
          'temp_prop1',
          'CREATE',
          property,
        );
        
        // Assert
        final db = databaseManager.database;
        final syncQueue = await db.query('sync_queue');
        
        expect(syncQueue.length, 1);
        expect(syncQueue.first['table_name'], 'properties');
        expect(syncQueue.first['operation'], 'CREATE');
        expect(syncQueue.first['record_id'], 'temp_prop1');
      });
      
      test('should process sync queue when coming online', () async {
        // Arrange
        final mockApiClient = MockApiClient();
        final onlineSyncManager = SyncManager(
          databaseManager,
          mockApiClient,
          ConnectivityResult.wifi,
        );
        
        // Add item to sync queue
        await onlineSyncManager.addToSyncQueue(
          'properties',
          'temp_prop1',
          'CREATE',
          {'name': 'Test Hotel'},
        );
        
        // Mock successful API response
        when(() => mockApiClient.post('/properties', data: any(named: 'data')))
            .thenAnswer((_) async => Response(
              requestOptions: RequestOptions(path: '/properties'),
              data: {'id': 'real_prop1', 'name': 'Test Hotel'},
            ));
        
        // Act
        await onlineSyncManager.syncAll();
        
        // Assert
        final db = databaseManager.database;
        final syncQueue = await db.query('sync_queue');
        expect(syncQueue.length, 0); // Queue should be empty after sync
        
        verify(() => mockApiClient.post('/properties', data: any(named: 'data'))).called(1);
      });
      
      test('should handle sync conflicts correctly', () async {
        // Arrange
        final localProperty = Property(
          id: 'prop1',
          ownerId: 'user1',
          name: 'Local Version',
          type: PropertyType.hotel,
          location: const Location(latitude: 0, longitude: 0, address: 'Local'),
          updatedAt: DateTime.now().subtract(const Duration(hours: 1)),
        );
        
        final serverProperty = Property(
          id: 'prop1',
          ownerId: 'user1',
          name: 'Server Version',
          type: PropertyType.hotel,
          location: const Location(latitude: 0, longitude: 0, address: 'Server'),
          updatedAt: DateTime.now(),
        );
        
        // Store local version
        final propertiesBox = databaseManager.getBox<Property>('properties');
        await propertiesBox.put(localProperty.id, localProperty);
        
        // Mock server response with newer version
        final mockApiClient = MockApiClient();
        when(() => mockApiClient.get('/properties/sync', queryParameters: any(named: 'queryParameters')))
            .thenAnswer((_) async => Response(
              requestOptions: RequestOptions(path: '/properties/sync'),
              data: {
                'data': [serverProperty.toJson()],
              },
            ));
        
        final onlineSyncManager = SyncManager(
          databaseManager,
          mockApiClient,
          ConnectivityResult.wifi,
        );
        
        // Act
        await onlineSyncManager._syncIncomingChanges();
        
        // Assert
        final updatedProperty = propertiesBox.get('prop1');
        expect(updatedProperty?.name, 'Server Version'); // Server version should win
        expect(updatedProperty?.location.address, 'Server');
      });
    });
    
    group('Complex Queries', () {
      test('should perform filtered property searches', () async {
        // Arrange
        final properties = [
          Property(
            id: 'prop1',
            ownerId: 'user1',
            name: 'Paris Hotel',
            type: PropertyType.hotel,
            location: const Location(
              latitude: 48.8566,
              longitude: 2.3522,
              address: 'Paris, France',
            ),
            basePrice: 150.0,
            rating: 4.5,
            isActive: true,
          ),
          Property(
            id: 'prop2',
            ownerId: 'user1',
            name: 'London Hostel',
            type: PropertyType.hostel,
            location: const Location(
              latitude: 51.5074,
              longitude: -0.1278,
              address: 'London, UK',
            ),
            basePrice: 50.0,
            rating: 3.8,
            isActive: true,
          ),
          Property(
            id: 'prop3',
            ownerId: 'user1',
            name: 'Luxury Paris Resort',
            type: PropertyType.resort,
            location: const Location(
              latitude: 48.8566,
              longitude: 2.3522,
              address: 'Paris, France',
            ),
            basePrice: 400.0,
            rating: 4.8,
            isActive: false, // Inactive
          ),
        ];
        
        // Store properties in SQLite
        final db = databaseManager.database;
        for (final property in properties) {
          await db.insert('properties', {
            'id': property.id,
            'owner_id': property.ownerId,
            'name': property.name,
            'type': property.type.value,
            'location_lat': property.location.latitude,
            'location_lng': property.location.longitude,
            'location_address': property.location.address,
            'rating': property.rating,
            'base_price': property.basePrice,
            'is_active': property.isActive ? 1 : 0,
            'is_verified': property.isVerified ? 1 : 0,
            'created_at': property.createdAt.toIso8601String(),
            'updated_at': property.updatedAt.toIso8601String(),
            'sync_status': 'synced',
          });
        }
        
        // Act - Search for active properties in Paris with rating >= 4.0
        final results = await db.query(
          'properties',
          where: 'is_active = ? AND location_address LIKE ? AND rating >= ?',
          whereArgs: [1, '%Paris%', 4.0],
          orderBy: 'rating DESC',
        );
        
        // Assert
        expect(results.length, 1);
        expect(results.first['name'], 'Paris Hotel');
        expect(results.first['rating'], 4.5);
      });
    });
  });
}
```

---

## 🎬 End-to-End Testing Strategy

### **Role Switching E2E Tests**
```dart
// test/e2e/role_switching_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:tripavail/main.dart' as app;
import '../test_config.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('Role Switching E2E Tests', () {
    setUpAll(() async {
      await TestConfig.setupTestEnvironment();
    });
    
    testWidgets('complete traveler to hotel manager flow', (tester) async {
      // Launch app
      app.main();
      await tester.pumpAndSettle();
      
      // Wait for splash screen to complete
      await tester.pump(const Duration(seconds: 3));
      await tester.pumpAndSettle();
      
      // Verify we're in traveler mode
      expect(find.text('Good morning'), findsOneWidget);
      expect(find.byKey(const Key('bottom-nav')), findsOneWidget);
      
      // Open hamburger menu
      await tester.tap(find.byKey(const Key('hamburger-menu')));
      await tester.pumpAndSettle();
      
      // Tap "Become a Partner"
      await tester.tap(find.text('Become a Partner'));
      await tester.pumpAndSettle();
      
      // Verify flip animation starts
      expect(find.byType(ScreenFlipAnimation), findsOneWidget);
      
      // Wait for flip animation to complete
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pumpAndSettle();
      
      // Verify partner selection screen
      expect(find.text('Choose Your Partner Type'), findsOneWidget);
      expect(find.text('Hotel Manager'), findsOneWidget);
      expect(find.text('Tour Operator'), findsOneWidget);
      
      // Select Hotel Manager
      await tester.tap(find.text('Hotel Manager'));
      await tester.pumpAndSettle();
      
      // Verify hotel manager dashboard
      expect(find.text('Hotel Manager Portal'), findsOneWidget);
      expect(find.text('Manage your properties and grow your business'), findsOneWidget);
      expect(find.byKey(const Key('bottom-nav')), findsNothing); // No bottom nav for partners
      
      // Verify quick actions
      expect(find.text('List Property'), findsOneWidget);
      expect(find.text('Create Package'), findsOneWidget);
      expect(find.text('Manage Calendar'), findsOneWidget);
      expect(find.text('Analytics'), findsOneWidget);
      
      // Open drawer to verify role switch
      await tester.tap(find.byKey(const Key('hamburger-menu')));
      await tester.pumpAndSettle();
      
      // Verify partner drawer items
      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Properties'), findsOneWidget);
      expect(find.text('Calendar'), findsOneWidget);
      expect(find.text('Switch to Traveler'), findsOneWidget);
    });
    
    testWidgets('hotel manager to tour operator switch', (tester) async {
      // Start from hotel manager mode
      app.main();
      await tester.pumpAndSettle();
      
      // Skip splash and navigate to hotel manager mode
      await tester.pump(const Duration(seconds: 3));
      await _switchToHotelManager(tester);
      
      // Open drawer
      await tester.tap(find.byKey(const Key('hamburger-menu')));
      await tester.pumpAndSettle();
      
      // Tap "Become a Partner" again
      await tester.tap(find.text('Become a Partner'));
      await tester.pumpAndSettle();
      
      // Wait for flip animation
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pumpAndSettle();
      
      // Select Tour Operator
      await tester.tap(find.text('Tour Operator'));
      await tester.pumpAndSettle();
      
      // Verify tour operator dashboard
      expect(find.text('Tour Operator Hub'), findsOneWidget);
      expect(find.text('Create experiences and manage tours'), findsOneWidget);
      
      // Verify tour operator quick actions
      expect(find.text('Create Tour'), findsOneWidget);
      expect(find.text('Manage Groups'), findsOneWidget);
    });
    
    testWidgets('switch back to traveler from partner mode', (tester) async {
      // Start from hotel manager mode
      app.main();
      await tester.pumpAndSettle();
      
      await tester.pump(const Duration(seconds: 3));
      await _switchToHotelManager(tester);
      
      // Open drawer
      await tester.tap(find.byKey(const Key('hamburger-menu')));
      await tester.pumpAndSettle();
      
      // Tap "Switch to Traveler"
      await tester.tap(find.text('Switch to Traveler'));
      await tester.pumpAndSettle();
      
      // Wait for flip animation
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pumpAndSettle();
      
      // Verify we're back in traveler mode
      expect(find.text('Good morning'), findsOneWidget);
      expect(find.byKey(const Key('bottom-nav')), findsOneWidget);
      expect(find.text('Quick Actions'), findsOneWidget);
      expect(find.text('Plan Trip'), findsOneWidget);
    });
    
    testWidgets('data persistence across role switches', (tester) async {
      // Start as traveler and add to wishlist
      app.main();
      await tester.pumpAndSettle();
      
      await tester.pump(const Duration(seconds: 3));
      await tester.pumpAndSettle();
      
      // Navigate to wishlist and add item
      await tester.tap(find.text('My Wishlist'));
      await tester.pumpAndSettle();
      
      // Simulate adding wishlist item
      // (In real implementation, you'd interact with UI to add items)
      
      // Switch to hotel manager
      await _switchToHotelManager(tester);
      
      // Switch back to traveler
      await tester.tap(find.byKey(const Key('hamburger-menu')));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Switch to Traveler'));
      await tester.pumpAndSettle();
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pumpAndSettle();
      
      // Verify wishlist data is preserved
      await tester.tap(find.text('My Wishlist'));
      await tester.pumpAndSettle();
      
      // Assert wishlist items are still there
      // (In real implementation, you'd verify specific wishlist items)
    });
  });
}

// Helper function to switch to hotel manager mode
Future<void> _switchToHotelManager(WidgetTester tester) async {
  await tester.tap(find.byKey(const Key('hamburger-menu')));
  await tester.pumpAndSettle();
  
  await tester.tap(find.text('Become a Partner'));
  await tester.pumpAndSettle();
  
  await tester.pump(const Duration(milliseconds: 800));
  await tester.pumpAndSettle();
  
  await tester.tap(find.text('Hotel Manager'));
  await tester.pumpAndSettle();
}
```

### **Complete User Journey Tests**
```dart
// test/e2e/user_journey_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:tripavail/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('Complete User Journey Tests', () {
    testWidgets('traveler complete booking journey', (tester) async {
      // Launch app
      app.main();
      await tester.pumpAndSettle();
      
      // Skip splash screen
      await tester.pump(const Duration(seconds: 3));
      await tester.pumpAndSettle();
      
      // Use search bar
      await tester.tap(find.byKey(const Key('search-bar')));
      await tester.pumpAndSettle();
      
      // Enter search query
      await tester.enterText(find.byType(TextField), 'Paris hotels');
      await tester.pumpAndSettle();
      
      // Tap search
      await tester.tap(find.byKey(const Key('search-button')));
      await tester.pumpAndSettle();
      
      // Verify search results
      expect(find.text('Search Results'), findsOneWidget);
      
      // Tap on first result
      await tester.tap(find.byKey(const Key('search-result-0')));
      await tester.pumpAndSettle();
      
      // Verify hotel detail screen
      expect(find.byKey(const Key('hotel-detail')), findsOneWidget);
      
      // Scroll to see packages
      await tester.drag(
        find.byType(SingleChildScrollView),
        const Offset(0, -500),
      );
      await tester.pumpAndSettle();
      
      // Tap on a package
      await tester.tap(find.byKey(const Key('package-card-0')));
      await tester.pumpAndSettle();
      
      // Verify package detail screen
      expect(find.byKey(const Key('package-detail')), findsOneWidget);
      
      // Tap book now
      await tester.tap(find.text('Book Now'));
      await tester.pumpAndSettle();
      
      // Verify booking form
      expect(find.byKey(const Key('booking-form')), findsOneWidget);
      
      // Fill booking details
      await tester.enterText(
        find.byKey(const Key('guest-count-input')),
        '2',
      );
      
      // Select dates (simplified)
      await tester.tap(find.byKey(const Key('check-in-date')));
      await tester.pumpAndSettle();
      await tester.tap(find.text('15')); // Select 15th
      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();
      
      // Submit booking
      await tester.tap(find.text('Continue to Payment'));
      await tester.pumpAndSettle();
      
      // Verify payment screen
      expect(find.byKey(const Key('payment-screen')), findsOneWidget);
      
      // Select payment method
      await tester.tap(find.byKey(const Key('payment-method-0')));
      await tester.pumpAndSettle();
      
      // Complete payment (mock)
      await tester.tap(find.text('Pay Now'));
      await tester.pumpAndSettle();
      
      // Verify booking confirmation
      expect(find.text('Booking Confirmed'), findsOneWidget);
      expect(find.byKey(const Key('booking-confirmation')), findsOneWidget);
    });
    
    testWidgets('hotel manager property listing journey', (tester) async {
      // Launch app and switch to hotel manager
      app.main();
      await tester.pumpAndSettle();
      
      await tester.pump(const Duration(seconds: 3));
      await _switchToHotelManager(tester);
      
      // Tap "List Property"
      await tester.tap(find.text('List Property'));
      await tester.pumpAndSettle();
      
      // Verify hotel listing flow starts
      expect(find.text('List Your Hotel'), findsOneWidget);
      
      // Fill basic information
      await tester.enterText(
        find.byKey(const Key('hotel-name-input')),
        'Test Hotel Paris',
      );
      
      await tester.enterText(
        find.byKey(const Key('hotel-description-input')),
        'A beautiful hotel in the heart of Paris',
      );
      
      // Select property type
      await tester.tap(find.byKey(const Key('property-type-hotel')));
      await tester.pumpAndSettle();
      
      // Continue to next step
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      
      // Location step
      expect(find.text('Add Location'), findsOneWidget);
      
      await tester.enterText(
        find.byKey(const Key('address-input')),
        '123 Rue de Rivoli, Paris, France',
      );
      
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      
      // Rooms step
      expect(find.text('Add Rooms'), findsOneWidget);
      
      // Add a room
      await tester.tap(find.byKey(const Key('add-room-button')));
      await tester.pumpAndSettle();
      
      await tester.enterText(
        find.byKey(const Key('room-name-input')),
        'Standard Double Room',
      );
      
      await tester.enterText(
        find.byKey(const Key('room-price-input')),
        '150',
      );
      
      await tester.tap(find.text('Save Room'));
      await tester.pumpAndSettle();
      
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      
      // Amenities step
      expect(find.text('Select Amenities'), findsOneWidget);
      
      // Select some amenities
      await tester.tap(find.byKey(const Key('amenity-wifi')));
      await tester.tap(find.byKey(const Key('amenity-pool')));
      await tester.tap(find.byKey(const Key('amenity-gym')));
      await tester.pumpAndSettle();
      
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      
      // Policies step
      expect(find.text('Set Policies'), findsOneWidget);
      
      await tester.enterText(
        find.byKey(const Key('check-in-time')),
        '15:00',
      );
      
      await tester.enterText(
        find.byKey(const Key('check-out-time')),
        '11:00',
      );
      
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      
      // Review step
      expect(find.text('Review & Submit'), findsOneWidget);
      
      // Verify all entered information is displayed
      expect(find.text('Test Hotel Paris'), findsOneWidget);
      expect(find.text('Standard Double Room'), findsOneWidget);
      expect(find.text('WiFi'), findsOneWidget);
      
      // Submit the listing
      await tester.tap(find.text('Submit for Review'));
      await tester.pumpAndSettle();
      
      // Verify success screen
      expect(find.text('Hotel Listed Successfully'), findsOneWidget);
      expect(find.text('Your property has been submitted for review'), findsOneWidget);
    });
    
    testWidgets('tour operator tour creation journey', (tester) async {
      // Launch app and switch to tour operator
      app.main();
      await tester.pumpAndSettle();
      
      await tester.pump(const Duration(seconds: 3));
      await _switchToTourOperator(tester);
      
      // Tap "Create Tour"
      await tester.tap(find.text('Create Tour'));
      await tester.pumpAndSettle();
      
      // Verify tour creation flow
      expect(find.text('Create New Tour'), findsOneWidget);
      
      // Fill basic tour information
      await tester.enterText(
        find.byKey(const Key('tour-title-input')),
        'Paris Walking Tour',
      );
      
      await tester.enterText(
        find.byKey(const Key('tour-description-input')),
        'Explore the beautiful streets of Paris with our expert guide',
      );
      
      // Select tour type
      await tester.tap(find.byKey(const Key('tour-type-walking')));
      await tester.pumpAndSettle();
      
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      
      // Itinerary step
      expect(find.text('Plan Itinerary'), findsOneWidget);
      
      // Add itinerary items
      await tester.tap(find.byKey(const Key('add-itinerary-item')));
      await tester.pumpAndSettle();
      
      await tester.enterText(
        find.byKey(const Key('itinerary-title-input')),
        'Eiffel Tower Visit',
      );
      
      await tester.enterText(
        find.byKey(const Key('itinerary-description-input')),
        'Visit the iconic Eiffel Tower',
      );
      
      await tester.enterText(
        find.byKey(const Key('itinerary-duration-input')),
        '60',
      );
      
      await tester.tap(find.text('Save Item'));
      await tester.pumpAndSettle();
      
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      
      // Pricing step
      expect(find.text('Set Pricing'), findsOneWidget);
      
      await tester.enterText(
        find.byKey(const Key('tour-price-input')),
        '45',
      );
      
      await tester.enterText(
        find.byKey(const Key('max-group-size-input')),
        '20',
      );
      
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      
      // Calendar step
      expect(find.text('Set Availability'), findsOneWidget);
      
      // Select available dates
      await tester.tap(find.byKey(const Key('calendar-date-15')));
      await tester.tap(find.byKey(const Key('calendar-date-16')));
      await tester.tap(find.byKey(const Key('calendar-date-17')));
      await tester.pumpAndSettle();
      
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      
      // Review and submit
      expect(find.text('Review Tour'), findsOneWidget);
      
      expect(find.text('Paris Walking Tour'), findsOneWidget);
      expect(find.text('Eiffel Tower Visit'), findsOneWidget);
      expect(find.text('\$45'), findsOneWidget);
      
      await tester.tap(find.text('Publish Tour'));
      await tester.pumpAndSettle();
      
      // Verify success
      expect(find.text('Tour Published Successfully'), findsOneWidget);
    });
  });
}

// Helper functions
Future<void> _switchToHotelManager(WidgetTester tester) async {
  await tester.tap(find.byKey(const Key('hamburger-menu')));
  await tester.pumpAndSettle();
  
  await tester.tap(find.text('Become a Partner'));
  await tester.pumpAndSettle();
  
  await tester.pump(const Duration(milliseconds: 800));
  await tester.pumpAndSettle();
  
  await tester.tap(find.text('Hotel Manager'));
  await tester.pumpAndSettle();
}

Future<void> _switchToTourOperator(WidgetTester tester) async {
  await tester.tap(find.byKey(const Key('hamburger-menu')));
  await tester.pumpAndSettle();
  
  await tester.tap(find.text('Become a Partner'));
  await tester.pumpAndSettle();
  
  await tester.pump(const Duration(milliseconds: 800));
  await tester.pumpAndSettle();
  
  await tester.tap(find.text('Tour Operator'));
  await tester.pumpAndSettle();
}
```

---

## 📊 Performance Testing Strategy

### **Animation Performance Tests**
```dart
// test/performance/animation_performance_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../lib/core/animations/screen_flip_animation.dart';
import '../test_config.dart';

void main() {
  group('Animation Performance Tests', () {
    setUp(() async {
      await TestConfig.setupTestEnvironment();
    });
    
    testWidgets('screen flip animation maintains 60fps', (tester) async {
      // Enable performance tracking
      await tester.binding.setSurfaceSize(const Size(375, 812)); // iPhone X size
      
      // Track frame times
      final frameTimes = <Duration>[];
      final stopwatch = Stopwatch()..start();
      
      // Start animation
      await tester.pumpWidget(
        TestHelpers.wrapWithProviders(
          const ScreenFlipAnimation(),
        ),
      );
      
      // Record frame times during animation
      for (int i = 0; i < 48; i++) { // 800ms at 60fps
        await tester.pump(const Duration(milliseconds: 16));
        frameTimes.add(stopwatch.elapsed);
      }
      
      // Analyze performance
      var droppedFrames = 0;
      for (int i = 1; i < frameTimes.length; i++) {
        final frameDuration = frameTimes[i] - frameTimes[i - 1];
        if (frameDuration.inMilliseconds > 20) { // More than 16ms + 4ms tolerance
          droppedFrames++;
        }
      }
      
      // Assert performance criteria
      expect(droppedFrames, lessThan(3)); // Allow max 2 dropped frames
      
      final avgFrameTime = frameTimes.last.inMilliseconds / frameTimes.length;
      expect(avgFrameTime, lessThan(18)); // Average frame time should be close to 16ms
    });
    
    testWidgets('memory usage remains stable during animations', (tester) async {
      // Get baseline memory usage
      await tester.pumpWidget(const MaterialApp(home: Scaffold()));
      await tester.pumpAndSettle();
      
      // Start memory-intensive animation
      await tester.pumpWidget(
        TestHelpers.wrapWithProviders(
          MaterialApp(
            home: Scaffold(
              body: Column(
                children: List.generate(10, (index) {
                  return const ScreenFlipAnimation();
                }),
              ),
            ),
          ),
        ),
      );
      
      // Run animations
      for (int i = 0; i < 100; i++) {
        await tester.pump(const Duration(milliseconds: 16));
      }
      
      // Force garbage collection
      await tester.pumpAndSettle();
      
      // Memory usage should stabilize
      // (In real implementation, you'd use memory profiling tools)
    });
    
    testWidgets('concurrent animations performance', (tester) async {
      // Create multiple concurrent animations
      await tester.pumpWidget(
        TestHelpers.wrapWithProviders(
          MaterialApp(
            home: Scaffold(
              body: Stack(
                children: [
                  const ScreenFlipAnimation(),
                  Positioned(
                    top: 100,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 800),
                      width: 100,
                      height: 100,
                      color: Colors.red,
                    ),
                  ),
                  Positioned(
                    top: 200,
                    child: AnimatedOpacity(
                      opacity: 0.5,
                      duration: const Duration(milliseconds: 800),
                      child: Container(
                        width: 100,
                        height: 100,
                        color: Colors.blue,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      
      // Measure performance with multiple animations
      final frameTimes = <Duration>[];
      final stopwatch = Stopwatch()..start();
      
      for (int i = 0; i < 48; i++) {
        await tester.pump(const Duration(milliseconds: 16));
        frameTimes.add(stopwatch.elapsed);
      }
      
      // Assert that concurrent animations don't severely impact performance
      var droppedFrames = 0;
      for (int i = 1; i < frameTimes.length; i++) {
        final frameDuration = frameTimes[i] - frameTimes[i - 1];
        if (frameDuration.inMilliseconds > 25) { // Slightly higher tolerance for concurrent animations
          droppedFrames++;
        }
      }
      
      expect(droppedFrames, lessThan(5)); // Allow more dropped frames for concurrent animations
    });
  });
}
```

### **Database Performance Tests**
```dart
// test/performance/database_performance_test.dart
import 'package:flutter_test/flutter_test.dart';

import '../../lib/core/database/database_manager.dart';
import '../test_config.dart';

void main() {
  group('Database Performance Tests', () {
    late DatabaseManager databaseManager;
    
    setUp() async {
      await TestConfig.setupTestEnvironment();
      databaseManager = DatabaseManager();
      await databaseManager.initialize();
    });
    
    tearDown() async {
      await databaseManager.clearAllData();
    });
    
    test('bulk insert performance', () async {
      // Generate test data
      final properties = List.generate(1000, (index) {
        return Property(
          id: 'prop_$index',
          ownerId: 'user_1',
          name: 'Test Property $index',
          type: PropertyType.hotel,
          location: Location(
            latitude: 48.8566 + (index * 0.001),
            longitude: 2.3522 + (index * 0.001),
            address: 'Address $index',
          ),
          basePrice: 100.0 + index,
          rating: 4.0 + (index % 5) * 0.1,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      });
      
      // Measure insert time
      final stopwatch = Stopwatch()..start();
      
      final propertiesBox = databaseManager.getBox<Property>('properties');
      for (final property in properties) {
        await propertiesBox.put(property.id, property);
      }
      
      stopwatch.stop();
      
      // Assert performance
      expect(stopwatch.elapsedMilliseconds, lessThan(5000)); // Should complete in < 5 seconds
      expect(propertiesBox.length, 1000);
      
      print('Bulk insert of 1000 properties took: ${stopwatch.elapsedMilliseconds}ms');
    });
    
    test('complex query performance', () async {
      // Insert test data
      final db = databaseManager.database;
      final batch = db.batch();
      
      for (int i = 0; i < 5000; i++) {
        batch.insert('properties', {
          'id': 'prop_$i',
          'owner_id': 'user_${i % 10}',
          'name': 'Property $i',
          'type': i % 3 == 0 ? 'hotel' : i % 3 == 1 ? 'resort' : 'hostel',
          'location_lat': 48.8566 + (i * 0.001),
          'location_lng': 2.3522 + (i * 0.001),
          'location_address': 'City ${i % 50}',
          'rating': 3.0 + (i % 20) * 0.1,
          'base_price': 50.0 + (i % 500),
          'is_active': i % 4 != 0 ? 1 : 0,
          'is_verified': i % 3 == 0 ? 1 : 0,
          'created_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
          'sync_status': 'synced',
        });
      }
      
      await batch.commit();
      
      // Measure complex query time
      final stopwatch = Stopwatch()..start();
      
      final results = await db.query(
        'properties',
        where: 'is_active = ? AND type = ? AND rating >= ? AND base_price BETWEEN ? AND ?',
        whereArgs: [1, 'hotel', 4.0, 100, 300],
        orderBy: 'rating DESC, base_price ASC',
        limit: 50,
      );
      
      stopwatch.stop();
      
      // Assert performance
      expect(stopwatch.elapsedMilliseconds, lessThan(100)); // Should complete in < 100ms
      expect(results.isNotEmpty, true);
      
      print('Complex query on 5000 records took: ${stopwatch.elapsedMilliseconds}ms');
      print('Found ${results.length} matching properties');
    });
    
    test('concurrent access performance', () async {
      // Test concurrent read/write operations
      final futures = <Future>[];
      
      // Start concurrent operations
      for (int i = 0; i < 10; i++) {
        futures.add(_concurrentWriteOperation(i));
        futures.add(_concurrentReadOperation(i));
      }
      
      final stopwatch = Stopwatch()..start();
      await Future.wait(futures);
      stopwatch.stop();
      
      // Assert performance
      expect(stopwatch.elapsedMilliseconds, lessThan(3000)); // Should complete in < 3 seconds
      
      print('20 concurrent operations took: ${stopwatch.elapsedMilliseconds}ms');
    });
    
    Future<void> _concurrentWriteOperation(int index) async {
      final propertiesBox = databaseManager.getBox<Property>('properties');
      
      for (int i = 0; i < 50; i++) {
        final property = Property(
          id: 'concurrent_${index}_$i',
          ownerId: 'user_$index',
          name: 'Concurrent Property $index-$i',
          type: PropertyType.hotel,
          location: const Location(latitude: 0, longitude: 0, address: 'Test'),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        
        await propertiesBox.put(property.id, property);
      }
    }
    
    Future<void> _concurrentReadOperation(int index) async {
      final propertiesBox = databaseManager.getBox<Property>('properties');
      
      for (int i = 0; i < 50; i++) {
        final property = propertiesBox.get('concurrent_${index}_$i');
        // Simulate processing
        if (property != null) {
          property.name;
        }
      }
    }
  });
}
```

---

## 🔍 Testing Infrastructure & Mocks

### **Mock Services**
```dart
// test/mocks/mock_services.dart
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';

import '../../lib/core/api/http_client.dart';
import '../../lib/core/database/database_manager.dart';
import '../../lib/core/services/search_service.dart';
import '../../lib/core/services/user_service.dart';

// API Mocks
class MockApiClient extends Mock implements ApiHttpClient {}
class MockDio extends Mock implements Dio {}

// Database Mocks
class MockDatabaseManager extends Mock implements DatabaseManager {}
class MockDatabase extends Mock implements Database {}
class MockBox<T> extends Mock implements Box<T> {}

// Service Mocks
class MockSearchService extends Mock implements SearchService {}
class MockUserService extends Mock implements UserService {}
class MockDashboardService extends Mock implements DashboardService {}

// Authentication Mocks
class MockAuthManager extends Mock implements AuthenticationManager {}

// Data Model Mocks
class MockUser extends Mock implements User {}
class MockProperty extends Mock implements Property {}
class MockTour extends Mock implements Tour {}
class MockBooking extends Mock implements Booking {}

// Provider Mocks
class MockTickerProvider extends Mock implements TickerProvider {}

// Exception Mocks
class MockApiException extends Fake implements ApiException {}

// Enum Mocks
class MockUserRole extends Fake implements UserRole {}
class MockSearchFilters extends Fake implements SearchFilters {}

// Response Mocks
class MockResponse extends Mock implements Response {}
class MockRequestOptions extends Mock implements RequestOptions {}
```

### **Test Data Factories**
```dart
// test/factories/test_data_factory.dart
class TestDataFactory {
  static User createUser({
    String? id,
    String? name,
    String? email,
    UserRole? role,
    bool? isVerified,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? 'test_user_1',
      name: name ?? 'Test User',
      email: email ?? 'test@example.com',
      role: role ?? UserRole.traveler,
      isVerified: isVerified ?? false,
      createdAt: createdAt ?? DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
  
  static Property createProperty({
    String? id,
    String? ownerId,
    String? name,
    PropertyType? type,
    Location? location,
    double? basePrice,
    double? rating,
    bool? isActive,
    bool? isVerified,
  }) {
    return Property(
      id: id ?? 'test_property_1',
      ownerId: ownerId ?? 'test_owner_1',
      name: name ?? 'Test Hotel',
      type: type ?? PropertyType.hotel,
      location: location ?? const Location(
        latitude: 48.8566,
        longitude: 2.3522,
        address: 'Paris, France',
      ),
      basePrice: basePrice ?? 150.0,
      rating: rating ?? 4.5,
      isActive: isActive ?? true,
      isVerified: isVerified ?? false,
      amenities: [
        const Amenity(id: '1', name: 'WiFi', icon: 'wifi'),
        const Amenity(id: '2', name: 'Pool', icon: 'pool'),
      ],
      rooms: [
        Room(
          id: 'room_1',
          type: RoomType.double,
          name: 'Standard Double',
          basePrice: 120.0,
          amenities: ['wifi', 'ac'],
        ),
      ],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
  
  static Tour createTour({
    String? id,
    String? operatorId,
    String? title,
    TourType? type,
    double? price,
    int? duration,
    double? rating,
    bool? isActive,
  }) {
    return Tour(
      id: id ?? 'test_tour_1',
      operatorId: operatorId ?? 'test_operator_1',
      title: title ?? 'Test Tour',
      type: type ?? TourType.walking,
      price: price ?? 45.0,
      duration: duration ?? 180, // 3 hours
      rating: rating ?? 4.3,
      isActive: isActive ?? true,
      location: const Location(
        latitude: 48.8566,
        longitude: 2.3522,
        address: 'Paris, France',
      ),
      itinerary: [
        ItineraryItem(
          id: '1',
          title: 'Eiffel Tower',
          description: 'Visit the iconic Eiffel Tower',
          duration: 60,
          order: 1,
        ),
        ItineraryItem(
          id: '2',
          title: 'Seine River',
          description: 'Walk along the beautiful Seine',
          duration: 30,
          order: 2,
        ),
      ],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
  
  static Booking createBooking({
    String? id,
    String? userId,
    String? packageId,
    BookingStatus? status,
    double? totalAmount,
    DateTime? checkInDate,
    DateTime? checkOutDate,
  }) {
    return Booking(
      id: id ?? 'test_booking_1',
      userId: userId ?? 'test_user_1',
      packageId: packageId ?? 'test_package_1',
      status: status ?? BookingStatus.confirmed,
      details: const BookingDetails(
        packageName: 'Test Package',
        guestCount: 2,
      ),
      payment: PaymentInfo(
        totalAmount: totalAmount ?? 500.0,
        paidAmount: totalAmount ?? 500.0,
        currency: 'USD',
        method: PaymentMethod.creditCard,
      ),
      checkInDate: checkInDate ?? DateTime.now().add(const Duration(days: 7)),
      checkOutDate: checkOutDate ?? DateTime.now().add(const Duration(days: 10)),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
  
  static SearchFilters createSearchFilters({
    String? query,
    String? category,
    List<double>? priceRange,
    double? minRating,
    String? location,
  }) {
    return SearchFilters(
      query: query ?? 'test query',
      category: category ?? 'hotels',
      priceRange: priceRange ?? [100, 500],
      minRating: minRating ?? 4.0,
      location: location ?? 'Paris',
      duration: '',
      experienceType: [],
    );
  }
  
  static TravelerDashboardData createTravelerDashboardData({
    List<Booking>? recentBookings,
    List<Destination>? featuredDestinations,
    List<Tour>? trendingTours,
    TravelStats? travelStats,
  }) {
    return TravelerDashboardData(
      recentBookings: recentBookings ?? [createBooking()],
      featuredDestinations: featuredDestinations ?? [],
      trendingTours: trendingTours ?? [createTour()],
      travelStats: travelStats ?? const TravelStats(
        totalTrips: 5,
        countriesVisited: 3,
        citiesExplored: 8,
        rewardPoints: 1250,
      ),
    );
  }
  
  static HotelManagerDashboardData createHotelManagerDashboardData({
    HotelMetrics? metrics,
    List<Property>? properties,
    List<ActivityItem>? recentActivity,
    HotelAnalytics? analytics,
  }) {
    return HotelManagerDashboardData(
      metrics: metrics ?? const HotelMetrics(
        totalProperties: 2,
        activeBookings: 15,
        monthlyRevenue: 25000,
        occupancyRate: 78.5,
      ),
      properties: properties ?? [createProperty()],
      recentActivity: recentActivity ?? [],
      analytics: analytics ?? const HotelAnalytics(
        revenueData: [1000, 1200, 1500, 1800, 2000],
        occupancyData: [65, 70, 75, 80, 78],
      ),
    );
  }
}
```

### **Custom Test Matchers**
```dart
// test/matchers/custom_matchers.dart
import 'package:flutter_test/flutter_test.dart';

// Custom matcher for animation values
Matcher isAnimationValue(double expectedValue, {double tolerance = 0.01}) {
  return _AnimationValueMatcher(expectedValue, tolerance);
}

class _AnimationValueMatcher extends Matcher {
  final double expectedValue;
  final double tolerance;
  
  const _AnimationValueMatcher(this.expectedValue, this.tolerance);
  
  @override
  bool matches(dynamic item, Map matchState) {
    if (item is! double) return false;
    
    final difference = (item - expectedValue).abs();
    return difference <= tolerance;
  }
  
  @override
  Description describe(Description description) {
    return description.add('animation value within $tolerance of $expectedValue');
  }
}

// Custom matcher for API responses
Matcher isSuccessfulApiResponse() {
  return _ApiResponseMatcher(true);
}

Matcher isFailedApiResponse() {
  return _ApiResponseMatcher(false);
}

class _ApiResponseMatcher extends Matcher {
  final bool shouldBeSuccessful;
  
  const _ApiResponseMatcher(this.shouldBeSuccessful);
  
  @override
  bool matches(dynamic item, Map matchState) {
    if (item is! Response) return false;
    
    final isSuccessful = item.statusCode != null && 
                        item.statusCode! >= 200 && 
                        item.statusCode! < 300;
    
    return isSuccessful == shouldBeSuccessful;
  }
  
  @override
  Description describe(Description description) {
    return description.add(
      shouldBeSuccessful ? 'successful API response' : 'failed API response'
    );
  }
}

// Custom matcher for role permissions
Matcher hasPermissionFor(RoleFeature feature) {
  return _PermissionMatcher(feature, true);
}

Matcher lacksPermissionFor(RoleFeature feature) {
  return _PermissionMatcher(feature, false);
}

class _PermissionMatcher extends Matcher {
  final RoleFeature feature;
  final bool shouldHavePermission;
  
  const _PermissionMatcher(this.feature, this.shouldHavePermission);
  
  @override
  bool matches(dynamic item, Map matchState) {
    if (item is! UserRole) return false;
    
    final hasPermission = PermissionManager.hasPermission(item, feature);
    return hasPermission == shouldHavePermission;
  }
  
  @override
  Description describe(Description description) {
    return description.add(
      shouldHavePermission 
          ? 'user role with permission for ${feature.name}'
          : 'user role without permission for ${feature.name}'
    );
  }
}
```

---

## 🚀 Test Execution & CI/CD Integration

### **Test Scripts Configuration**
```yaml
# scripts/test_scripts.yaml
test_commands:
  unit:
    description: "Run unit tests"
    command: "flutter test test/unit/ --coverage"
    
  widget:
    description: "Run widget tests"
    command: "flutter test test/widget/ --coverage"
    
  integration:
    description: "Run integration tests"
    command: "flutter test test/integration/ --coverage"
    
  e2e:
    description: "Run end-to-end tests"
    command: "flutter test integration_test/ --coverage"
    
  performance:
    description: "Run performance tests"
    command: "flutter test test/performance/"
    
  all:
    description: "Run all tests with coverage"
    command: "flutter test --coverage && genhtml coverage/lcov.info -o coverage/html"
    
  golden:
    description: "Update golden files"
    command: "flutter test --update-goldens"
    
  golden_verify:
    description: "Verify golden files"
    command: "flutter test test/golden/"
```

### **GitHub Actions Workflow**
```yaml
# .github/workflows/test.yml
name: Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit_tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'
          
      - name: Install dependencies
        run: flutter pub get
        
      - name: Run unit tests
        run: flutter test test/unit/ --coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: coverage/lcov.info

  widget_tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'
          
      - name: Install dependencies
        run: flutter pub get
        
      - name: Run widget tests
        run: flutter test test/widget/ --coverage

  integration_tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'
          
      - name: Install dependencies
        run: flutter pub get
        
      - name: Run integration tests
        run: flutter test test/integration/

  e2e_tests:
    runs-on: macos-latest
    strategy:
      matrix:
        device: ['iPhone 14', 'iPad Air']
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'
          
      - name: Install dependencies
        run: flutter pub get
        
      - name: Launch iOS Simulator
        run: |
          xcrun simctl boot "${{ matrix.device }}" || true
          
      - name: Run E2E tests
        run: flutter test integration_test/ --device-id="${{ matrix.device }}"

  performance_tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'
          
      - name: Install dependencies
        run: flutter pub get
        
      - name: Run performance tests
        run: flutter test test/performance/
        
      - name: Generate performance report
        run: |
          echo "Performance test results" > performance_report.md
          echo "Tests completed successfully" >> performance_report.md
          
      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: performance_report.md

  golden_tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'
          
      - name: Install dependencies
        run: flutter pub get
        
      - name: Run golden file tests
        run: flutter test test/golden/
```

---

## 📊 Test Coverage & Quality Metrics

### **Coverage Configuration**
```yaml
# coverage_config.yaml
coverage:
  targets:
    overall: 90%
    unit_tests: 95%
    widget_tests: 85%
    integration_tests: 80%
    
  exclusions:
    - "lib/generated/**"
    - "lib/**/*.g.dart"
    - "lib/**/*.freezed.dart"
    - "test/**"
    
  critical_files:
    - "lib/core/providers/**"
    - "lib/core/services/**"
    - "lib/core/api/**"
    - "lib/features/**"
    
  reports:
    - lcov
    - html
    - json
```

### **Quality Gates**
```dart
// scripts/quality_gates.dart
class QualityGates {
  static const Map<String, double> coverageThresholds = {
    'overall': 90.0,
    'core/providers': 95.0,
    'core/services': 95.0,
    'core/api': 90.0,
    'features': 85.0,
    'widgets': 85.0,
  };
  
  static const Map<String, int> performanceThresholds = {
    'animation_frame_drops': 3,
    'memory_leaks': 0,
    'api_response_time_ms': 5000,
    'database_query_time_ms': 100,
  };
  
  static const Map<String, int> qualityThresholds = {
    'failing_tests': 0,
    'flaky_tests': 2,
    'golden_file_mismatches': 0,
  };
}
```

---

## 🔍 Migration Testing Checklist

### **✅ Unit Testing**
- [ ] All provider logic tested with 95%+ coverage
- [ ] Service layer methods tested with mock dependencies
- [ ] Animation controller lifecycle tested
- [ ] Permission system validation tested
- [ ] API integration error handling tested
- [ ] Database operations and sync logic tested

### **✅ Widget Testing**
- [ ] All major screens render correctly
- [ ] User interactions trigger expected state changes
- [ ] Error states display appropriate messages
- [ ] Loading states show proper indicators
- [ ] Permission gates function correctly
- [ ] Role-specific UI elements render appropriately

### **✅ Integration Testing**
- [ ] API integration with real network responses
- [ ] Database sync operations work correctly
- [ ] Cross-role interactions function properly
- [ ] Animation integration performs smoothly
- [ ] Offline capabilities work as expected
- [ ] Real-time updates function correctly

### **✅ End-to-End Testing**
- [ ] Complete user journeys work across all roles
- [ ] Role switching preserves data and state
- [ ] Complex workflows complete successfully
- [ ] Cross-platform compatibility verified
- [ ] Performance meets quality thresholds
- [ ] Accessibility features function properly

### **✅ Performance Testing**
- [ ] Animation performance maintains 60fps
- [ ] Memory usage remains stable
- [ ] Database operations meet speed requirements
- [ ] API response times are acceptable
- [ ] Battery usage is optimized
- [ ] App startup time is under 3 seconds

### **✅ Regression Testing**
- [ ] Golden file tests prevent visual regressions
- [ ] Existing functionality not broken by new features
- [ ] Cross-role compatibility maintained
- [ ] Dark mode functionality preserved
- [ ] Animation timing and behavior consistent
- [ ] API backward compatibility verified

---

## 🔍 Next Steps

1. **Create deployment pipeline** (`12_deployment_guide.md`)
2. **Build performance optimization** (`13_performance_guide.md`)
3. **Add accessibility features** (`14_accessibility_guide.md`)
4. **Create maintenance guide** (`15_maintenance_guide.md`)
5. **Implement monitoring & analytics** (`16_monitoring_guide.md`)

---

*This comprehensive Flutter testing strategy ensures robust quality assurance across all aspects of the TripAvail app migration, from individual component testing to complete user journey validation. The strategy maintains high standards while enabling rapid development and deployment cycles.*