# Flutter API Integration & Offline System

## Executive Summary

This document defines the comprehensive API integration and offline capabilities system for TripAvail Flutter app, migrating from the React implementation while adding sophisticated offline-first capabilities, real-time synchronization, and performance optimizations. The system handles complex user role interactions, search functionality, media uploads, and real-time verification updates with robust error handling and conflict resolution.

### Key API Features to Migrate
- **Role-Based Authentication**: JWT tokens with role-specific permissions and refresh logic
- **Real-time Updates**: WebSocket integration for verification status and notifications
- **Complex Search API**: Multi-dimensional search with filters, suggestions, and pagination
- **Media Upload System**: Image/video upload with progress tracking and compression
- **Offline-First Architecture**: Local storage, sync queues, and conflict resolution
- **Performance Optimization**: Request caching, pagination, and background sync

---

## 🌐 API Architecture Overview

### **API System Hierarchy**
```
TripAvail API Integration System
├── Core Infrastructure
│   ├── HTTP Client Configuration (Dio)
│   ├── Authentication Management
│   ├── Request/Response Interceptors
│   └── Error Handling & Retry Logic
├── Authentication & Authorization
│   ├── JWT Token Management
│   ├── Role-Based Access Control
│   ├── Refresh Token Logic
│   └── Biometric Authentication
├── Real-time Communication
│   ├── WebSocket Integration
│   ├── Push Notifications
│   ├── Live Verification Updates
│   └── Real-time Messaging
├── Data Synchronization
│   ├── Offline-First Architecture
│   ├── Sync Queue Management
│   ├── Conflict Resolution
│   └── Background Sync
├── API Services
│   ├── User & Profile Management
│   ├── Search & Discovery
│   ├── Booking & Reservations
│   ├── Media Upload & Management
│   └── Verification & Compliance
├── Offline Capabilities
│   ├── Local Database (Hive/SQLite)
│   ├── Cache Management
│   ├── Offline Queue
│   └── Data Persistence
└── Performance & Monitoring
    ├── Request Caching
    ├── API Performance Monitoring
    ├── Error Tracking
    └── Analytics Integration
```

### **API Architecture Principles**
```dart
// Core API architecture strategy
abstract class ApiArchitecture {
  // 1. Offline-first data access
  // 2. Intelligent caching and sync
  // 3. Role-based security
  // 4. Real-time capability
  // 5. Performance optimization
}
```

---

## 🔧 Core HTTP Client Infrastructure

### **Dio HTTP Client Configuration**
```dart
// lib/core/api/http_client.dart
import 'package:dio/dio.dart';
import 'package:dio_cache_interceptor/dio_cache_interceptor.dart';
import 'package:dio_certificate_pinning/dio_certificate_pinning.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ApiHttpClient {
  static const String baseUrl = 'https://api.tripavail.com/v1';
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
  
  late final Dio _dio;
  late final CacheStore _cacheStore;
  
  ApiHttpClient({String? customBaseUrl}) {
    _cacheStore = MemCacheStore(maxSize: 50 * 1024 * 1024); // 50MB cache
    
    _dio = Dio(BaseOptions(
      baseUrl: customBaseUrl ?? baseUrl,
      connectTimeout: connectTimeout,
      receiveTimeout: receiveTimeout,
      sendTimeout: sendTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TripAvail-Flutter/1.0.0',
      },
    ));
    
    _setupInterceptors();
  }
  
  void _setupInterceptors() {
    // Authentication interceptor
    _dio.interceptors.add(AuthenticationInterceptor());
    
    // Cache interceptor
    _dio.interceptors.add(DioCacheInterceptor(
      options: CacheOptions(
        store: _cacheStore,
        policy: CachePolicy.refresh, // Always check with server first
        hitCacheOnErrorExcept: [401, 403], // Cache on errors except auth
        maxStale: const Duration(days: 7),
        priority: CachePriority.high,
        cipher: null,
        keyBuilder: CacheOptions.defaultCacheKeyBuilder,
        allowPostMethod: false,
      ),
    ));
    
    // Logging interceptor (debug only)
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        requestHeader: true,
        responseHeader: false,
        error: true,
        logPrint: (obj) => debugPrint(obj.toString()),
      ));
    }
    
    // Error handling interceptor
    _dio.interceptors.add(ErrorHandlingInterceptor());
    
    // Retry interceptor
    _dio.interceptors.add(RetryInterceptor());
    
    // Performance monitoring interceptor
    _dio.interceptors.add(PerformanceInterceptor());
    
    // Certificate pinning (production only)
    if (kReleaseMode) {
      _dio.interceptors.add(CertificatePinningInterceptor(
        allowedSHAFingerprints: ['YOUR_SSL_FINGERPRINT_HERE'],
      ));
    }
  }
  
  // HTTP Methods with proper error handling
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } catch (e) {
      throw _handleError(e);
    }
  }
  
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } catch (e) {
      throw _handleError(e);
    }
  }
  
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } catch (e) {
      throw _handleError(e);
    }
  }
  
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } catch (e) {
      throw _handleError(e);
    }
  }
  
  // File upload with progress tracking
  Future<Response<T>> upload<T>(
    String path,
    FormData formData, {
    ProgressCallback? onSendProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: formData,
        onSendProgress: onSendProgress,
        cancelToken: cancelToken,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
          sendTimeout: const Duration(minutes: 5), // Extended timeout for uploads
        ),
      );
    } catch (e) {
      throw _handleError(e);
    }
  }
  
  ApiException _handleError(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return ApiException.timeout(error.message ?? 'Request timeout');
        case DioExceptionType.connectionError:
          return ApiException.network('No internet connection');
        case DioExceptionType.badResponse:
          return _handleResponseError(error.response);
        case DioExceptionType.cancel:
          return ApiException.cancelled('Request was cancelled');
        default:
          return ApiException.unknown(error.message ?? 'Unknown error occurred');
      }
    }
    
    return ApiException.unknown(error.toString());
  }
  
  ApiException _handleResponseError(Response? response) {
    if (response == null) {
      return ApiException.unknown('No response received');
    }
    
    switch (response.statusCode) {
      case 400:
        return ApiException.badRequest(
          response.data?['message'] ?? 'Bad request'
        );
      case 401:
        return ApiException.unauthorized('Authentication required');
      case 403:
        return ApiException.forbidden('Access denied');
      case 404:
        return ApiException.notFound('Resource not found');
      case 422:
        return ApiException.validation(
          response.data?['errors'] ?? {},
          response.data?['message'] ?? 'Validation failed',
        );
      case 429:
        return ApiException.rateLimited('Too many requests');
      case 500:
        return ApiException.serverError('Internal server error');
      case 503:
        return ApiException.serviceUnavailable('Service temporarily unavailable');
      default:
        return ApiException.unknown(
          response.data?['message'] ?? 'Unknown server error'
        );
    }
  }
  
  void dispose() {
    _dio.close();
    _cacheStore.clean();
  }
}

// API Client provider
final apiClientProvider = Provider<ApiHttpClient>((ref) {
  return ApiHttpClient();
});
```

### **API Exception Handling**
```dart
// lib/core/api/exceptions.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'exceptions.freezed.dart';

@freezed
class ApiException with _$ApiException implements Exception {
  const factory ApiException.network(String message) = NetworkException;
  const factory ApiException.timeout(String message) = TimeoutException;
  const factory ApiException.unauthorized(String message) = UnauthorizedException;
  const factory ApiException.forbidden(String message) = ForbiddenException;
  const factory ApiException.notFound(String message) = NotFoundException;
  const factory ApiException.badRequest(String message) = BadRequestException;
  const factory ApiException.validation(
    Map<String, List<String>> errors,
    String message,
  ) = ValidationException;
  const factory ApiException.rateLimited(String message) = RateLimitedException;
  const factory ApiException.serverError(String message) = ServerErrorException;
  const factory ApiException.serviceUnavailable(String message) = ServiceUnavailableException;
  const factory ApiException.cancelled(String message) = CancelledException;
  const factory ApiException.unknown(String message) = UnknownException;
}

extension ApiExceptionExt on ApiException {
  String get userFriendlyMessage {
    return when(
      network: (message) => 'Please check your internet connection and try again.',
      timeout: (message) => 'Request timed out. Please try again.',
      unauthorized: (message) => 'Please log in to continue.',
      forbidden: (message) => 'You don\'t have permission to access this resource.',
      notFound: (message) => 'The requested resource was not found.',
      badRequest: (message) => message.isNotEmpty ? message : 'Invalid request.',
      validation: (errors, message) => message.isNotEmpty ? message : 'Please check your input.',
      rateLimited: (message) => 'Too many requests. Please try again later.',
      serverError: (message) => 'Server error occurred. Please try again later.',
      serviceUnavailable: (message) => 'Service is temporarily unavailable.',
      cancelled: (message) => 'Request was cancelled.',
      unknown: (message) => 'An unexpected error occurred.',
    );
  }
  
  bool get shouldRetry {
    return when(
      network: (_) => true,
      timeout: (_) => true,
      unauthorized: (_) => false,
      forbidden: (_) => false,
      notFound: (_) => false,
      badRequest: (_) => false,
      validation: (_, __) => false,
      rateLimited: (_) => true,
      serverError: (_) => true,
      serviceUnavailable: (_) => true,
      cancelled: (_) => false,
      unknown: (_) => false,
    );
  }
}
```

---

## 🔐 Authentication & Authorization System

### **JWT Authentication Manager**
```dart
// lib/core/api/auth_manager.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

class AuthenticationManager {
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userDataKey = 'user_data';
  
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainItemAccessibility.first_unlock_this_device,
    ),
  );
  
  String? _accessToken;
  String? _refreshToken;
  User? _currentUser;
  Timer? _refreshTimer;
  
  // Getters
  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  User? get currentUser => _currentUser;
  bool get isAuthenticated => _accessToken != null && !isTokenExpired(_accessToken!);
  
  // Initialize authentication state from storage
  Future<void> initialize() async {
    try {
      _accessToken = await _secureStorage.read(key: _accessTokenKey);
      _refreshToken = await _secureStorage.read(key: _refreshTokenKey);
      
      final userDataJson = await _secureStorage.read(key: _userDataKey);
      if (userDataJson != null) {
        _currentUser = User.fromJson(jsonDecode(userDataJson));
      }
      
      // Set up automatic token refresh
      if (_accessToken != null && _refreshToken != null) {
        _scheduleTokenRefresh();
      }
    } catch (e) {
      debugPrint('Error initializing auth: $e');
      await clearTokens();
    }
  }
  
  // Login with email and password
  Future<AuthResult> login(String email, String password) async {
    try {
      final response = await ApiHttpClient().post('/auth/login', data: {
        'email': email,
        'password': password,
        'device_name': await _getDeviceName(),
        'device_id': await _getDeviceId(),
      });
      
      return await _handleAuthResponse(response.data);
    } catch (e) {
      return AuthResult.failure(e is ApiException ? e : ApiException.unknown(e.toString()));
    }
  }
  
  // Register new user
  Future<AuthResult> register(RegisterRequest request) async {
    try {
      final response = await ApiHttpClient().post('/auth/register', data: request.toJson());
      return await _handleAuthResponse(response.data);
    } catch (e) {
      return AuthResult.failure(e is ApiException ? e : ApiException.unknown(e.toString()));
    }
  }
  
  // Social login (Google, Apple, Facebook)
  Future<AuthResult> socialLogin(String provider, String token) async {
    try {
      final response = await ApiHttpClient().post('/auth/social', data: {
        'provider': provider,
        'token': token,
        'device_name': await _getDeviceName(),
        'device_id': await _getDeviceId(),
      });
      
      return await _handleAuthResponse(response.data);
    } catch (e) {
      return AuthResult.failure(e is ApiException ? e : ApiException.unknown(e.toString()));
    }
  }
  
  // Refresh access token
  Future<bool> refreshAccessToken() async {
    if (_refreshToken == null) return false;
    
    try {
      final response = await ApiHttpClient().post('/auth/refresh', data: {
        'refresh_token': _refreshToken,
      });
      
      final result = await _handleAuthResponse(response.data);
      return result.isSuccess;
    } catch (e) {
      debugPrint('Token refresh failed: $e');
      await logout();
      return false;
    }
  }
  
  // Logout
  Future<void> logout() async {
    try {
      if (_accessToken != null) {
        await ApiHttpClient().post('/auth/logout');
      }
    } catch (e) {
      debugPrint('Logout API call failed: $e');
    } finally {
      await clearTokens();
    }
  }
  
  // Clear all authentication data
  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    _currentUser = null;
    _refreshTimer?.cancel();
    
    await _secureStorage.deleteAll();
  }
  
  // Handle authentication response
  Future<AuthResult> _handleAuthResponse(Map<String, dynamic> data) async {
    try {
      final accessToken = data['access_token'] as String;
      final refreshToken = data['refresh_token'] as String;
      final userData = data['user'] as Map<String, dynamic>;
      
      _accessToken = accessToken;
      _refreshToken = refreshToken;
      _currentUser = User.fromJson(userData);
      
      // Store tokens securely
      await _secureStorage.write(key: _accessTokenKey, value: accessToken);
      await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
      await _secureStorage.write(key: _userDataKey, value: jsonEncode(userData));
      
      // Schedule token refresh
      _scheduleTokenRefresh();
      
      return AuthResult.success(_currentUser!);
    } catch (e) {
      return AuthResult.failure(ApiException.unknown('Invalid response format'));
    }
  }
  
  // Schedule automatic token refresh
  void _scheduleTokenRefresh() {
    _refreshTimer?.cancel();
    
    if (_accessToken == null) return;
    
    final token = _accessToken!;
    final expiryTime = JwtDecoder.getExpirationDate(token);
    final refreshTime = expiryTime.subtract(const Duration(minutes: 5)); // Refresh 5 minutes before expiry
    final timeUntilRefresh = refreshTime.difference(DateTime.now());
    
    if (timeUntilRefresh.isNegative) {
      // Token is already close to expiry, refresh immediately
      refreshAccessToken();
    } else {
      _refreshTimer = Timer(timeUntilRefresh, () {
        refreshAccessToken();
      });
    }
  }
  
  // Check if token is expired
  bool isTokenExpired(String token) {
    try {
      return JwtDecoder.isExpired(token);
    } catch (e) {
      return true;
    }
  }
  
  // Get current user role
  UserRole? getCurrentUserRole() {
    if (_accessToken == null) return null;
    
    try {
      final payload = JwtDecoder.decode(_accessToken!);
      final roleString = payload['role'] as String?;
      return roleString != null ? UserRole.fromString(roleString) : null;
    } catch (e) {
      return null;
    }
  }
  
  // Get user permissions
  List<String> getUserPermissions() {
    if (_accessToken == null) return [];
    
    try {
      final payload = JwtDecoder.decode(_accessToken!);
      final permissions = payload['permissions'] as List<dynamic>?;
      return permissions?.cast<String>() ?? [];
    } catch (e) {
      return [];
    }
  }
  
  Future<String> _getDeviceName() async {
    final deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      return '${androidInfo.brand} ${androidInfo.model}';
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      return '${iosInfo.name} ${iosInfo.model}';
    }
    return 'Unknown Device';
  }
  
  Future<String> _getDeviceId() async {
    final deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      return androidInfo.id;
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      return iosInfo.identifierForVendor ?? 'unknown';
    }
    return 'unknown';
  }
}

@freezed
class AuthResult with _$AuthResult {
  const factory AuthResult.success(User user) = AuthSuccess;
  const factory AuthResult.failure(ApiException error) = AuthFailure;
}

extension AuthResultExt on AuthResult {
  bool get isSuccess => this is AuthSuccess;
  bool get isFailure => this is AuthFailure;
  User? get user => isSuccess ? (this as AuthSuccess).user : null;
  ApiException? get error => isFailure ? (this as AuthFailure).error : null;
}

// Authentication interceptor for HTTP requests
class AuthenticationInterceptor extends Interceptor {
  final AuthenticationManager _authManager = GetIt.instance<AuthenticationManager>();
  
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _authManager.accessToken;
    if (token != null && !_authManager.isTokenExpired(token)) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    super.onRequest(options, handler);
  }
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      // Token expired, try to refresh
      _authManager.refreshAccessToken().then((success) {
        if (success) {
          // Retry the original request
          final requestOptions = err.requestOptions;
          requestOptions.headers['Authorization'] = 'Bearer ${_authManager.accessToken}';
          
          Dio().fetch(requestOptions).then(
            (response) => handler.resolve(response),
            onError: (error) => handler.next(err),
          );
        } else {
          handler.next(err);
        }
      });
      return;
    }
    
    super.onError(err, handler);
  }
}

// Auth manager provider
final authManagerProvider = Provider<AuthenticationManager>((ref) {
  return AuthenticationManager();
});

final currentUserProvider = StreamProvider<User?>((ref) {
  final authManager = ref.watch(authManagerProvider);
  // Return stream of current user changes
  return Stream.value(authManager.currentUser);
});
```

---

## 🔄 Real-time Communication System

### **WebSocket Integration**
```dart
// lib/core/api/websocket_manager.dart
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;

class WebSocketManager {
  static const String baseWsUrl = 'wss://api.tripavail.com/ws';
  static const Duration reconnectDelay = Duration(seconds: 5);
  static const int maxReconnectAttempts = 10;
  
  WebSocketChannel? _channel;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  bool _isConnected = false;
  bool _shouldReconnect = true;
  
  final Map<String, List<Function(Map<String, dynamic>)>> _eventListeners = {};
  final AuthenticationManager _authManager;
  
  WebSocketManager(this._authManager);
  
  bool get isConnected => _isConnected;
  
  // Connect to WebSocket
  Future<void> connect() async {
    if (_isConnected) return;
    
    try {
      final token = _authManager.accessToken;
      if (token == null) {
        throw Exception('No authentication token available');
      }
      
      final uri = Uri.parse('$baseWsUrl?token=$token');
      _channel = WebSocketChannel.connect(uri);
      
      // Listen for messages
      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnection,
      );
      
      _isConnected = true;
      _reconnectAttempts = 0;
      _startHeartbeat();
      
      debugPrint('WebSocket connected successfully');
      _emit('connection', {'status': 'connected'});
      
    } catch (e) {
      debugPrint('WebSocket connection failed: $e');
      _scheduleReconnect();
    }
  }
  
  // Disconnect from WebSocket
  void disconnect() {
    _shouldReconnect = false;
    _isConnected = false;
    
    _heartbeatTimer?.cancel();
    _reconnectTimer?.cancel();
    
    _channel?.sink.close(status.normalClosure);
    _channel = null;
    
    _emit('connection', {'status': 'disconnected'});
  }
  
  // Send message through WebSocket
  void send(String event, Map<String, dynamic> data) {
    if (!_isConnected || _channel == null) {
      debugPrint('Cannot send message: WebSocket not connected');
      return;
    }
    
    final message = jsonEncode({
      'event': event,
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
    });
    
    try {
      _channel!.sink.add(message);
    } catch (e) {
      debugPrint('Error sending WebSocket message: $e');
    }
  }
  
  // Subscribe to events
  void on(String event, Function(Map<String, dynamic>) callback) {
    _eventListeners.putIfAbsent(event, () => []).add(callback);
  }
  
  // Unsubscribe from events
  void off(String event, [Function(Map<String, dynamic>)? callback]) {
    if (callback == null) {
      _eventListeners.remove(event);
    } else {
      _eventListeners[event]?.remove(callback);
    }
  }
  
  // Handle incoming messages
  void _handleMessage(dynamic message) {
    try {
      final data = jsonDecode(message as String) as Map<String, dynamic>;
      final event = data['event'] as String?;
      final payload = data['data'] as Map<String, dynamic>? ?? {};
      
      if (event != null) {
        _emit(event, payload);
      }
      
      // Handle special system events
      if (event == 'pong') {
        // Heartbeat response received
        return;
      }
      
    } catch (e) {
      debugPrint('Error parsing WebSocket message: $e');
    }
  }
  
  // Handle WebSocket errors
  void _handleError(error) {
    debugPrint('WebSocket error: $error');
    _isConnected = false;
    _emit('error', {'error': error.toString()});
    _scheduleReconnect();
  }
  
  // Handle WebSocket disconnection
  void _handleDisconnection() {
    debugPrint('WebSocket disconnected');
    _isConnected = false;
    _heartbeatTimer?.cancel();
    _emit('connection', {'status': 'disconnected'});
    
    if (_shouldReconnect) {
      _scheduleReconnect();
    }
  }
  
  // Emit events to listeners
  void _emit(String event, Map<String, dynamic> data) {
    final listeners = _eventListeners[event];
    if (listeners != null) {
      for (final listener in listeners) {
        try {
          listener(data);
        } catch (e) {
          debugPrint('Error in WebSocket event listener: $e');
        }
      }
    }
  }
  
  // Start heartbeat to keep connection alive
  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_isConnected) {
        send('ping', {});
      }
    });
  }
  
  // Schedule reconnection attempt
  void _scheduleReconnect() {
    if (!_shouldReconnect || _reconnectAttempts >= maxReconnectAttempts) {
      debugPrint('Max reconnection attempts reached or reconnection disabled');
      return;
    }
    
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(reconnectDelay, () {
      _reconnectAttempts++;
      debugPrint('Attempting WebSocket reconnection (${_reconnectAttempts}/$maxReconnectAttempts)');
      connect();
    });
  }
  
  void dispose() {
    disconnect();
  }
}

// Real-time event types
class RealtimeEvents {
  static const String verificationStatusUpdate = 'verification.status_update';
  static const String bookingUpdate = 'booking.update';
  static const String messageReceived = 'message.received';
  static const String notificationReceived = 'notification.received';
  static const String userOnlineStatus = 'user.online_status';
  static const String propertyUpdate = 'property.update';
  static const String tourUpdate = 'tour.update';
}

// WebSocket manager provider
final webSocketManagerProvider = Provider<WebSocketManager>((ref) {
  final authManager = ref.watch(authManagerProvider);
  return WebSocketManager(authManager);
});
```

### **Push Notifications Integration**
```dart
// lib/core/api/push_notifications.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class PushNotificationManager {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  String? _fcmToken;
  
  String? get fcmToken => _fcmToken;
  
  // Initialize push notifications
  Future<void> initialize() async {
    // Request permission
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('Push notifications permission granted');
    } else {
      debugPrint('Push notifications permission denied');
      return;
    }
    
    // Initialize local notifications
    await _initializeLocalNotifications();
    
    // Get FCM token
    _fcmToken = await _firebaseMessaging.getToken();
    debugPrint('FCM Token: $_fcmToken');
    
    // Send token to server
    if (_fcmToken != null) {
      await _sendTokenToServer(_fcmToken!);
    }
    
    // Listen for token refresh
    _firebaseMessaging.onTokenRefresh.listen(_sendTokenToServer);
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);
    
    // Handle notification taps
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
    
    // Check for initial message (app opened from notification)
    final initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }
  
  // Initialize local notifications
  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _handleLocalNotificationTap,
    );
  }
  
  // Send FCM token to server
  Future<void> _sendTokenToServer(String token) async {
    try {
      await ApiHttpClient().post('/notifications/register-token', data: {
        'token': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
        'app_version': await _getAppVersion(),
      });
    } catch (e) {
      debugPrint('Failed to send FCM token to server: $e');
    }
  }
  
  // Handle foreground messages
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Received foreground message: ${message.messageId}');
    
    // Show local notification for foreground messages
    _showLocalNotification(message);
    
    // Handle specific notification types
    _handleNotificationData(message.data);
  }
  
  // Handle background messages
  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    debugPrint('Received background message: ${message.messageId}');
    // Handle background message processing
  }
  
  // Handle notification tap
  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('Notification tapped: ${message.messageId}');
    _handleNotificationData(message.data);
  }
  
  // Handle local notification tap
  void _handleLocalNotificationTap(NotificationResponse response) {
    debugPrint('Local notification tapped: ${response.payload}');
    if (response.payload != null) {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _handleNotificationData(data);
    }
  }
  
  // Show local notification
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;
    
    const androidDetails = AndroidNotificationDetails(
      'tripavail_channel',
      'TripAvail Notifications',
      channelDescription: 'General notifications from TripAvail',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      details,
      payload: jsonEncode(message.data),
    );
  }
  
  // Handle notification data and navigation
  void _handleNotificationData(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    
    switch (type) {
      case 'verification_update':
        _handleVerificationUpdate(data);
        break;
      case 'booking_update':
        _handleBookingUpdate(data);
        break;
      case 'message':
        _handleNewMessage(data);
        break;
      case 'promotion':
        _handlePromotion(data);
        break;
      default:
        debugPrint('Unknown notification type: $type');
    }
  }
  
  void _handleVerificationUpdate(Map<String, dynamic> data) {
    final status = data['status'] as String?;
    if (status != null) {
      // Navigate to verification screen or show status update
      GetIt.instance<NavigationService>().navigateTo('/verification');
    }
  }
  
  void _handleBookingUpdate(Map<String, dynamic> data) {
    final bookingId = data['booking_id'] as String?;
    if (bookingId != null) {
      // Navigate to booking details
      GetIt.instance<NavigationService>().navigateTo('/bookings/$bookingId');
    }
  }
  
  void _handleNewMessage(Map<String, dynamic> data) {
    final senderId = data['sender_id'] as String?;
    if (senderId != null) {
      // Navigate to messages
      GetIt.instance<NavigationService>().navigateTo('/messages');
    }
  }
  
  void _handlePromotion(Map<String, dynamic> data) {
    final promotionId = data['promotion_id'] as String?;
    if (promotionId != null) {
      // Navigate to promotion details
      GetIt.instance<NavigationService>().navigateTo('/promotions/$promotionId');
    }
  }
  
  Future<String> _getAppVersion() async {
    final packageInfo = await PackageInfo.fromPlatform();
    return packageInfo.version;
  }
  
  // Subscribe to topics
  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
  }
  
  // Unsubscribe from topics
  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
  }
  
  void dispose() {
    // Cleanup if needed
  }
}

// Push notification manager provider
final pushNotificationManagerProvider = Provider<PushNotificationManager>((ref) {
  return PushNotificationManager();
});
```

---

## 💾 Offline-First Architecture

### **Local Database Setup**
```dart
// lib/core/database/database_manager.dart
import 'package:hive_flutter/hive_flutter.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseManager {
  static const String _databaseName = 'tripavail.db';
  static const int _databaseVersion = 1;
  
  Database? _database;
  
  // Initialize database
  Future<void> initialize() async {
    // Initialize Hive for simple key-value storage
    await Hive.initFlutter();
    
    // Register adapters for custom objects
    if (!Hive.isAdapterRegistered(0)) {
      Hive.registerAdapter(UserAdapter());
    }
    if (!Hive.isAdapterRegistered(1)) {
      Hive.registerAdapter(PropertyAdapter());
    }
    if (!Hive.isAdapterRegistered(2)) {
      Hive.registerAdapter(TourAdapter());
    }
    if (!Hive.isAdapterRegistered(3)) {
      Hive.registerAdapter(BookingAdapter());
    }
    
    // Open boxes
    await _openHiveBoxes();
    
    // Initialize SQLite for complex queries
    await _initializeSQLite();
  }
  
  // Open Hive boxes
  Future<void> _openHiveBoxes() async {
    await Hive.openBox<User>('users');
    await Hive.openBox<Property>('properties');
    await Hive.openBox<Tour>('tours');
    await Hive.openBox<Booking>('bookings');
    await Hive.openBox<String>('cache'); // For JSON cache
    await Hive.openBox<Map>('sync_queue'); // For offline sync
    await Hive.openBox<Map>('search_cache');
  }
  
  // Initialize SQLite database
  Future<void> _initializeSQLite() async {
    final databasePath = await getDatabasesPath();
    final path = join(databasePath, _databaseName);
    
    _database = await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _createDatabase,
      onUpgrade: _upgradeDatabase,
    );
  }
  
  // Create database tables
  Future<void> _createDatabase(Database db, int version) async {
    // Users table
    await db.execute('''
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        profile_image_url TEXT,
        is_verified INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'synced'
      )
    ''');
    
    // Properties table
    await db.execute('''
      CREATE TABLE properties (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        location_lat REAL,
        location_lng REAL,
        location_address TEXT,
        rating REAL DEFAULT 0,
        base_price REAL DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        is_verified INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'synced'
      )
    ''');
    
    // Tours table
    await db.execute('''
      CREATE TABLE tours (
        id TEXT PRIMARY KEY,
        operator_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        location_lat REAL,
        location_lng REAL,
        duration_hours INTEGER,
        price REAL NOT NULL,
        rating REAL DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'synced'
      )
    ''');
    
    // Bookings table
    await db.execute('''
      CREATE TABLE bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        package_id TEXT NOT NULL,
        status TEXT NOT NULL,
        total_amount REAL NOT NULL,
        check_in_date TEXT,
        check_out_date TEXT,
        guest_count INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'synced'
      )
    ''');
    
    // Sync queue table
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0
      )
    ''');
    
    // Create indexes for better performance
    await db.execute('CREATE INDEX idx_properties_owner ON properties(owner_id)');
    await db.execute('CREATE INDEX idx_tours_operator ON tours(operator_id)');
    await db.execute('CREATE INDEX idx_bookings_user ON bookings(user_id)');
    await db.execute('CREATE INDEX idx_sync_queue_table ON sync_queue(table_name)');
  }
  
  // Upgrade database schema
  Future<void> _upgradeDatabase(Database db, int oldVersion, int newVersion) async {
    // Handle database migrations
    if (oldVersion < 2) {
      // Add new columns or tables for version 2
    }
  }
  
  // Get Hive box
  Box<T> getBox<T>(String boxName) {
    return Hive.box<T>(boxName);
  }
  
  // Get SQLite database
  Database get database {
    if (_database == null) {
      throw Exception('Database not initialized');
    }
    return _database!;
  }
  
  // Clear all data
  Future<void> clearAllData() async {
    // Clear Hive boxes
    await Hive.box('users').clear();
    await Hive.box('properties').clear();
    await Hive.box('tours').clear();
    await Hive.box('bookings').clear();
    await Hive.box('cache').clear();
    await Hive.box('sync_queue').clear();
    await Hive.box('search_cache').clear();
    
    // Clear SQLite tables
    final db = database;
    await db.delete('users');
    await db.delete('properties');
    await db.delete('tours');
    await db.delete('bookings');
    await db.delete('sync_queue');
  }
  
  void dispose() {
    _database?.close();
    Hive.close();
  }
}

// Database manager provider
final databaseManagerProvider = Provider<DatabaseManager>((ref) {
  return DatabaseManager();
});
```

### **Offline Sync Manager**
```dart
// lib/core/sync/sync_manager.dart
class SyncManager {
  final DatabaseManager _dbManager;
  final ApiHttpClient _apiClient;
  final ConnectivityResult _connectivity;
  
  Timer? _syncTimer;
  bool _isSyncing = false;
  
  SyncManager(this._dbManager, this._apiClient, this._connectivity);
  
  // Initialize sync manager
  void initialize() {
    // Start periodic sync when online
    _startPeriodicSync();
    
    // Listen for connectivity changes
    Connectivity().onConnectivityChanged.listen(_onConnectivityChanged);
  }
  
  // Start periodic sync
  void _startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      if (_connectivity != ConnectivityResult.none) {
        syncAll();
      }
    });
  }
  
  // Handle connectivity changes
  void _onConnectivityChanged(ConnectivityResult result) {
    if (result != ConnectivityResult.none && !_isSyncing) {
      // Device came online, sync immediately
      syncAll();
    }
  }
  
  // Sync all pending changes
  Future<void> syncAll() async {
    if (_isSyncing || _connectivity == ConnectivityResult.none) {
      return;
    }
    
    _isSyncing = true;
    
    try {
      // Sync outgoing changes first
      await _syncOutgoingChanges();
      
      // Then pull incoming changes
      await _syncIncomingChanges();
      
      debugPrint('Sync completed successfully');
    } catch (e) {
      debugPrint('Sync failed: $e');
    } finally {
      _isSyncing = false;
    }
  }
  
  // Sync outgoing changes (local to server)
  Future<void> _syncOutgoingChanges() async {
    final db = _dbManager.database;
    final syncQueue = await db.query(
      'sync_queue',
      orderBy: 'created_at ASC',
    );
    
    for (final item in syncQueue) {
      try {
        await _processSyncQueueItem(item);
        
        // Remove from sync queue on success
        await db.delete(
          'sync_queue',
          where: 'id = ?',
          whereArgs: [item['id']],
        );
      } catch (e) {
        // Increment retry count
        await db.update(
          'sync_queue',
          {'retry_count': (item['retry_count'] as int) + 1},
          where: 'id = ?',
          whereArgs: [item['id']],
        );
        
        // Remove after max retries
        if ((item['retry_count'] as int) >= 5) {
          await db.delete(
            'sync_queue',
            where: 'id = ?',
            whereArgs: [item['id']],
          );
        }
      }
    }
  }
  
  // Process individual sync queue item
  Future<void> _processSyncQueueItem(Map<String, dynamic> item) async {
    final tableName = item['table_name'] as String;
    final recordId = item['record_id'] as String;
    final operation = item['operation'] as String;
    final data = item['data'] != null ? jsonDecode(item['data']) : null;
    
    switch (operation) {
      case 'CREATE':
        await _syncCreate(tableName, recordId, data);
        break;
      case 'UPDATE':
        await _syncUpdate(tableName, recordId, data);
        break;
      case 'DELETE':
        await _syncDelete(tableName, recordId);
        break;
    }
  }
  
  // Sync create operation
  Future<void> _syncCreate(String tableName, String recordId, Map<String, dynamic> data) async {
    String endpoint;
    switch (tableName) {
      case 'properties':
        endpoint = '/properties';
        break;
      case 'tours':
        endpoint = '/tours';
        break;
      case 'bookings':
        endpoint = '/bookings';
        break;
      default:
        throw Exception('Unknown table: $tableName');
    }
    
    final response = await _apiClient.post(endpoint, data: data);
    
    // Update local record with server ID if different
    if (response.data['id'] != recordId) {
      await _updateLocalRecord(tableName, recordId, response.data['id']);
    }
  }
  
  // Sync update operation
  Future<void> _syncUpdate(String tableName, String recordId, Map<String, dynamic> data) async {
    String endpoint;
    switch (tableName) {
      case 'properties':
        endpoint = '/properties/$recordId';
        break;
      case 'tours':
        endpoint = '/tours/$recordId';
        break;
      case 'bookings':
        endpoint = '/bookings/$recordId';
        break;
      default:
        throw Exception('Unknown table: $tableName');
    }
    
    await _apiClient.put(endpoint, data: data);
  }
  
  // Sync delete operation
  Future<void> _syncDelete(String tableName, String recordId) async {
    String endpoint;
    switch (tableName) {
      case 'properties':
        endpoint = '/properties/$recordId';
        break;
      case 'tours':
        endpoint = '/tours/$recordId';
        break;
      case 'bookings':
        endpoint = '/bookings/$recordId';
        break;
      default:
        throw Exception('Unknown table: $tableName');
    }
    
    await _apiClient.delete(endpoint);
  }
  
  // Sync incoming changes (server to local)
  Future<void> _syncIncomingChanges() async {
    final lastSyncTime = await _getLastSyncTime();
    
    // Sync users
    await _syncIncomingData('users', '/users/sync', lastSyncTime);
    
    // Sync properties
    await _syncIncomingData('properties', '/properties/sync', lastSyncTime);
    
    // Sync tours
    await _syncIncomingData('tours', '/tours/sync', lastSyncTime);
    
    // Sync bookings
    await _syncIncomingData('bookings', '/bookings/sync', lastSyncTime);
    
    // Update last sync time
    await _updateLastSyncTime();
  }
  
  // Sync incoming data for specific table
  Future<void> _syncIncomingData(String tableName, String endpoint, DateTime lastSync) async {
    final response = await _apiClient.get(endpoint, queryParameters: {
      'since': lastSync.toIso8601String(),
    });
    
    final items = response.data['data'] as List<dynamic>;
    final db = _dbManager.database;
    
    for (final item in items) {
      final data = item as Map<String, dynamic>;
      
      // Check if record exists locally
      final existing = await db.query(
        tableName,
        where: 'id = ?',
        whereArgs: [data['id']],
      );
      
      if (existing.isNotEmpty) {
        // Update existing record
        await db.update(
          tableName,
          {...data, 'sync_status': 'synced'},
          where: 'id = ?',
          whereArgs: [data['id']],
        );
      } else {
        // Insert new record
        await db.insert(
          tableName,
          {...data, 'sync_status': 'synced'},
        );
      }
    }
  }
  
  // Add item to sync queue
  Future<void> addToSyncQueue(String tableName, String recordId, String operation, [Map<String, dynamic>? data]) async {
    final db = _dbManager.database;
    
    await db.insert('sync_queue', {
      'table_name': tableName,
      'record_id': recordId,
      'operation': operation,
      'data': data != null ? jsonEncode(data) : null,
      'created_at': DateTime.now().toIso8601String(),
      'retry_count': 0,
    });
    
    // Try to sync immediately if online
    if (_connectivity != ConnectivityResult.none) {
      syncAll();
    }
  }
  
  // Get last sync time
  Future<DateTime> _getLastSyncTime() async {
    final prefs = await SharedPreferences.getInstance();
    final lastSyncString = prefs.getString('last_sync_time');
    if (lastSyncString != null) {
      return DateTime.parse(lastSyncString);
    }
    return DateTime.now().subtract(const Duration(days: 30)); // Default to 30 days ago
  }
  
  // Update last sync time
  Future<void> _updateLastSyncTime() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('last_sync_time', DateTime.now().toIso8601String());
  }
  
  // Update local record with server ID
  Future<void> _updateLocalRecord(String tableName, String oldId, String newId) async {
    final db = _dbManager.database;
    await db.update(
      tableName,
      {'id': newId, 'sync_status': 'synced'},
      where: 'id = ?',
      whereArgs: [oldId],
    );
  }
  
  void dispose() {
    _syncTimer?.cancel();
  }
}

// Sync manager provider
final syncManagerProvider = Provider<SyncManager>((ref) {
  final dbManager = ref.watch(databaseManagerProvider);
  final apiClient = ref.watch(apiClientProvider);
  return SyncManager(dbManager, apiClient, ConnectivityResult.none);
});
```

---

## 🔍 Search & Discovery API Integration

### **Search Service Implementation**
```dart
// lib/core/services/search_service.dart
class SearchService {
  final ApiHttpClient _apiClient;
  final DatabaseManager _dbManager;
  
  SearchService(this._apiClient, this._dbManager);
  
  // Perform search with filters
  Future<SearchResults<SearchItem>> search({
    required SearchFilters filters,
    int page = 1,
    int pageSize = 20,
    bool useCache = true,
  }) async {
    final cacheKey = _generateCacheKey(filters, page, pageSize);
    
    // Check cache first if offline or cache enabled
    if (useCache) {
      final cachedResults = await _getCachedResults(cacheKey);
      if (cachedResults != null) {
        return cachedResults;
      }
    }
    
    try {
      final response = await _apiClient.get('/search', queryParameters: {
        ...filters.toQueryParameters(),
        'page': page,
        'page_size': pageSize,
      });
      
      final results = SearchResults<SearchItem>.fromJson(
        response.data,
        (json) => SearchItem.fromJson(json as Map<String, dynamic>),
      );
      
      // Cache results
      await _cacheResults(cacheKey, results);
      
      return results;
    } catch (e) {
      // If network fails, try to return cached results
      final cachedResults = await _getCachedResults(cacheKey);
      if (cachedResults != null) {
        return cachedResults;
      }
      
      throw e;
    }
  }
  
  // Get search suggestions
  Future<List<SearchSuggestion>> getSuggestions(String query) async {
    if (query.length < 2) return [];
    
    try {
      final response = await _apiClient.get('/search/suggestions', queryParameters: {
        'q': query,
        'limit': 10,
      });
      
      final suggestions = (response.data['suggestions'] as List<dynamic>)
          .map((json) => SearchSuggestion.fromJson(json as Map<String, dynamic>))
          .toList();
      
      return suggestions;
    } catch (e) {
      // Return offline suggestions from local database
      return await _getOfflineSuggestions(query);
    }
  }
  
  // Get popular searches
  Future<List<String>> getPopularSearches() async {
    try {
      final response = await _apiClient.get('/search/popular');
      return (response.data['searches'] as List<dynamic>).cast<String>();
    } catch (e) {
      // Return cached popular searches
      final cacheBox = _dbManager.getBox<String>('cache');
      final cached = cacheBox.get('popular_searches');
      if (cached != null) {
        final List<dynamic> searches = jsonDecode(cached);
        return searches.cast<String>();
      }
      return [];
    }
  }
  
  // Get search facets/filters
  Future<List<SearchFacet>> getSearchFacets(SearchFilters filters) async {
    try {
      final response = await _apiClient.get('/search/facets', queryParameters: {
        ...filters.toQueryParameters(),
      });
      
      return (response.data['facets'] as List<dynamic>)
          .map((json) => SearchFacet.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      // Return default facets
      return _getDefaultFacets();
    }
  }
  
  // Search hotels specifically
  Future<SearchResults<Property>> searchHotels({
    required SearchFilters filters,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final response = await _apiClient.get('/search/hotels', queryParameters: {
        ...filters.toQueryParameters(),
        'page': page,
        'page_size': pageSize,
      });
      
      return SearchResults<Property>.fromJson(
        response.data,
        (json) => Property.fromJson(json as Map<String, dynamic>),
      );
    } catch (e) {
      // Return offline results
      return await _getOfflineHotels(filters, page, pageSize);
    }
  }
  
  // Search tours specifically
  Future<SearchResults<Tour>> searchTours({
    required SearchFilters filters,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final response = await _apiClient.get('/search/tours', queryParameters: {
        ...filters.toQueryParameters(),
        'page': page,
        'page_size': pageSize,
      });
      
      return SearchResults<Tour>.fromJson(
        response.data,
        (json) => Tour.fromJson(json as Map<String, dynamic>),
      );
    } catch (e) {
      // Return offline results
      return await _getOfflineTours(filters, page, pageSize);
    }
  }
  
  // Search packages specifically
  Future<SearchResults<Package>> searchPackages({
    required SearchFilters filters,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final response = await _apiClient.get('/search/packages', queryParameters: {
        ...filters.toQueryParameters(),
        'page': page,
        'page_size': pageSize,
      });
      
      return SearchResults<Package>.fromJson(
        response.data,
        (json) => Package.fromJson(json as Map<String, dynamic>),
      );
    } catch (e) {
      // Return offline results
      return await _getOfflinePackages(filters, page, pageSize);
    }
  }
  
  // Save search history
  Future<void> saveSearchHistory(SearchFilters filters, int resultCount) async {
    final history = SearchHistory(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      query: filters.query,
      filters: filters,
      searchedAt: DateTime.now(),
      resultCount: resultCount,
    );
    
    // Save to local database
    final historyBox = _dbManager.getBox<SearchHistory>('search_history');
    await historyBox.put(history.id, history);
    
    // Send to server for analytics
    try {
      await _apiClient.post('/search/history', data: history.toJson());
    } catch (e) {
      // Ignore server errors for search history
    }
  }
  
  // Get search history
  Future<List<SearchHistory>> getSearchHistory() async {
    final historyBox = _dbManager.getBox<SearchHistory>('search_history');
    final history = historyBox.values.toList();
    
    // Sort by search date (most recent first)
    history.sort((a, b) => b.searchedAt.compareTo(a.searchedAt));
    
    return history.take(20).toList(); // Return last 20 searches
  }
  
  // Clear search history
  Future<void> clearSearchHistory() async {
    final historyBox = _dbManager.getBox<SearchHistory>('search_history');
    await historyBox.clear();
  }
  
  // Generate cache key for search results
  String _generateCacheKey(SearchFilters filters, int page, int pageSize) {
    final filterData = {
      ...filters.toJson(),
      'page': page,
      'page_size': pageSize,
    };
    return 'search_${filterData.hashCode}';
  }
  
  // Cache search results
  Future<void> _cacheResults(String cacheKey, SearchResults<SearchItem> results) async {
    final cacheBox = _dbManager.getBox<String>('cache');
    await cacheBox.put(cacheKey, jsonEncode(results.toJson((item) => item.toJson())));
  }
  
  // Get cached search results
  Future<SearchResults<SearchItem>?> _getCachedResults(String cacheKey) async {
    final cacheBox = _dbManager.getBox<String>('cache');
    final cached = cacheBox.get(cacheKey);
    
    if (cached != null) {
      try {
        return SearchResults<SearchItem>.fromJson(
          jsonDecode(cached),
          (json) => SearchItem.fromJson(json as Map<String, dynamic>),
        );
      } catch (e) {
        // Remove invalid cache
        await cacheBox.delete(cacheKey);
      }
    }
    
    return null;
  }
  
  // Get offline suggestions from local database
  Future<List<SearchSuggestion>> _getOfflineSuggestions(String query) async {
    final db = _dbManager.database;
    
    // Search in properties
    final properties = await db.query(
      'properties',
      where: 'name LIKE ? OR location_address LIKE ?',
      whereArgs: ['%$query%', '%$query%'],
      limit: 5,
    );
    
    // Search in tours
    final tours = await db.query(
      'tours',
      where: 'title LIKE ?',
      whereArgs: ['%$query%'],
      limit: 5,
    );
    
    final suggestions = <SearchSuggestion>[];
    
    // Add property suggestions
    for (final property in properties) {
      suggestions.add(SearchSuggestion(
        id: property['id'] as String,
        text: property['name'] as String,
        type: 'property',
        subtitle: property['location_address'] as String?,
      ));
    }
    
    // Add tour suggestions
    for (final tour in tours) {
      suggestions.add(SearchSuggestion(
        id: tour['id'] as String,
        text: tour['title'] as String,
        type: 'tour',
      ));
    }
    
    return suggestions;
  }
  
  // Get offline hotel results
  Future<SearchResults<Property>> _getOfflineHotels(SearchFilters filters, int page, int pageSize) async {
    final db = _dbManager.database;
    
    String whereClause = 'is_active = 1';
    List<dynamic> whereArgs = [];
    
    // Add filters
    if (filters.query.isNotEmpty) {
      whereClause += ' AND (name LIKE ? OR location_address LIKE ?)';
      whereArgs.addAll(['%${filters.query}%', '%${filters.query}%']);
    }
    
    if (filters.priceRange.isNotEmpty && filters.priceRange.length == 2) {
      whereClause += ' AND base_price BETWEEN ? AND ?';
      whereArgs.addAll([filters.priceRange[0], filters.priceRange[1]]);
    }
    
    if (filters.minRating > 0) {
      whereClause += ' AND rating >= ?';
      whereArgs.add(filters.minRating);
    }
    
    // Get total count
    final countResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM properties WHERE $whereClause',
      whereArgs,
    );
    final totalCount = countResult.first['count'] as int;
    
    // Get paginated results
    final offset = (page - 1) * pageSize;
    final results = await db.query(
      'properties',
      where: whereClause,
      whereArgs: whereArgs,
      orderBy: 'rating DESC, name ASC',
      limit: pageSize,
      offset: offset,
    );
    
    final properties = results.map((json) => Property.fromJson(json)).toList();
    
    return SearchResults<Property>(
      items: properties,
      totalCount: totalCount,
      page: page,
      pageSize: pageSize,
      totalPages: (totalCount / pageSize).ceil(),
      hasNextPage: page < (totalCount / pageSize).ceil(),
      hasPreviousPage: page > 1,
    );
  }
  
  // Get offline tour results
  Future<SearchResults<Tour>> _getOfflineTours(SearchFilters filters, int page, int pageSize) async {
    // Similar implementation to hotels but for tours table
    final db = _dbManager.database;
    
    String whereClause = 'is_active = 1';
    List<dynamic> whereArgs = [];
    
    if (filters.query.isNotEmpty) {
      whereClause += ' AND title LIKE ?';
      whereArgs.add('%${filters.query}%');
    }
    
    if (filters.priceRange.isNotEmpty && filters.priceRange.length == 2) {
      whereClause += ' AND price BETWEEN ? AND ?';
      whereArgs.addAll([filters.priceRange[0], filters.priceRange[1]]);
    }
    
    if (filters.minRating > 0) {
      whereClause += ' AND rating >= ?';
      whereArgs.add(filters.minRating);
    }
    
    final countResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM tours WHERE $whereClause',
      whereArgs,
    );
    final totalCount = countResult.first['count'] as int;
    
    final offset = (page - 1) * pageSize;
    final results = await db.query(
      'tours',
      where: whereClause,
      whereArgs: whereArgs,
      orderBy: 'rating DESC, title ASC',
      limit: pageSize,
      offset: offset,
    );
    
    final tours = results.map((json) => Tour.fromJson(json)).toList();
    
    return SearchResults<Tour>(
      items: tours,
      totalCount: totalCount,
      page: page,
      pageSize: pageSize,
      totalPages: (totalCount / pageSize).ceil(),
      hasNextPage: page < (totalCount / pageSize).ceil(),
      hasPreviousPage: page > 1,
    );
  }
  
  // Get offline package results
  Future<SearchResults<Package>> _getOfflinePackages(SearchFilters filters, int page, int pageSize) async {
    // Implementation would combine hotels and tours data
    // For now, return empty results
    return SearchResults<Package>(
      items: [],
      totalCount: 0,
      page: page,
      pageSize: pageSize,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    );
  }
  
  // Get default facets for offline use
  List<SearchFacet> _getDefaultFacets() {
    return [
      SearchFacet(
        name: 'category',
        displayName: 'Category',
        type: 'checkbox',
        options: [
          SearchFacetOption(value: 'hotels', label: 'Hotels', count: 0),
          SearchFacetOption(value: 'tours', label: 'Tours', count: 0),
          SearchFacetOption(value: 'packages', label: 'Packages', count: 0),
        ],
      ),
      SearchFacet(
        name: 'price_range',
        displayName: 'Price Range',
        type: 'range',
        options: [],
        config: {
          'min': 0,
          'max': 5000,
          'step': 50,
        },
      ),
      SearchFacet(
        name: 'rating',
        displayName: 'Rating',
        type: 'select',
        options: [
          SearchFacetOption(value: '4', label: '4+ Stars', count: 0),
          SearchFacetOption(value: '3', label: '3+ Stars', count: 0),
          SearchFacetOption(value: '2', label: '2+ Stars', count: 0),
        ],
      ),
    ];
  }
}

// Search service provider
final searchServiceProvider = Provider<SearchService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final dbManager = ref.watch(databaseManagerProvider);
  return SearchService(apiClient, dbManager);
});
```

---

## 📤 Media Upload Service

### **Media Upload Implementation**
```dart
// lib/core/services/media_upload_service.dart
class MediaUploadService {
  final ApiHttpClient _apiClient;
  final DatabaseManager _dbManager;
  
  static const int maxImageSize = 10 * 1024 * 1024; // 10MB
  static const int maxVideoSize = 100 * 1024 * 1024; // 100MB
  static const List<String> supportedImageFormats = ['jpg', 'jpeg', 'png', 'webp'];
  static const List<String> supportedVideoFormats = ['mp4', 'mov', 'avi'];
  
  MediaUploadService(this._apiClient, this._dbManager);
  
  // Upload single image
  Future<MediaUploadResult> uploadImage(
    File imageFile, {
    String? folder,
    MediaCategory category = MediaCategory.general,
    bool compressImage = true,
    ProgressCallback? onProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      // Validate file
      final validation = await _validateImageFile(imageFile);
      if (!validation.isValid) {
        return MediaUploadResult.failure(validation.error!);
      }
      
      // Compress image if needed
      File finalFile = imageFile;
      if (compressImage) {
        finalFile = await _compressImage(imageFile);
      }
      
      // Create upload record
      final upload = MediaUpload(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        filename: path.basename(finalFile.path),
        type: MediaType.image,
        fileSize: await finalFile.length(),
        status: UploadStatus.uploading,
      );
      
      // Prepare form data
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          finalFile.path,
          filename: upload.filename,
          contentType: MediaType.parse(_getContentType(finalFile.path)),
        ),
        'category': category.value,
        'folder': folder ?? 'general',
        'upload_id': upload.id,
      });
      
      // Upload to server
      final response = await _apiClient.upload(
        '/media/upload',
        formData,
        onSendProgress: (sent, total) {
          final progress = sent / total;
          onProgress?.call(sent, total);
          _updateUploadProgress(upload.id, progress);
        },
        cancelToken: cancelToken,
      );
      
      final mediaItem = MediaItem.fromJson(response.data);
      
      // Update upload record
      await _updateUploadStatus(upload.id, UploadStatus.completed, mediaItem.url);
      
      return MediaUploadResult.success(mediaItem);
      
    } catch (e) {
      return MediaUploadResult.failure(
        e is ApiException ? e : ApiException.unknown(e.toString())
      );
    }
  }
  
  // Upload multiple images
  Future<List<MediaUploadResult>> uploadImages(
    List<File> imageFiles, {
    String? folder,
    MediaCategory category = MediaCategory.general,
    bool compressImages = true,
    ProgressCallback? onTotalProgress,
    CancelToken? cancelToken,
  }) async {
    final results = <MediaUploadResult>[];
    int completedUploads = 0;
    int totalSize = 0;
    int uploadedSize = 0;
    
    // Calculate total size
    for (final file in imageFiles) {
      totalSize += await file.length();
    }
    
    for (final file in imageFiles) {
      final result = await uploadImage(
        file,
        folder: folder,
        category: category,
        compressImage: compressImages,
        onProgress: (sent, total) {
          final fileProgress = sent;
          final totalProgress = uploadedSize + fileProgress;
          onTotalProgress?.call(totalProgress, totalSize);
        },
        cancelToken: cancelToken,
      );
      
      results.add(result);
      completedUploads++;
      
      if (result.isSuccess) {
        uploadedSize += await file.length();
      }
      
      // Update total progress
      onTotalProgress?.call(uploadedSize, totalSize);
    }
    
    return results;
  }
  
  // Upload video
  Future<MediaUploadResult> uploadVideo(
    File videoFile, {
    String? folder,
    MediaCategory category = MediaCategory.general,
    bool compressVideo = true,
    ProgressCallback? onProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      // Validate file
      final validation = await _validateVideoFile(videoFile);
      if (!validation.isValid) {
        return MediaUploadResult.failure(validation.error!);
      }
      
      // Compress video if needed
      File finalFile = videoFile;
      if (compressVideo) {
        finalFile = await _compressVideo(videoFile, onProgress: onProgress);
      }
      
      // Create upload record
      final upload = MediaUpload(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        filename: path.basename(finalFile.path),
        type: MediaType.video,
        fileSize: await finalFile.length(),
        status: UploadStatus.uploading,
      );
      
      // Prepare form data
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          finalFile.path,
          filename: upload.filename,
          contentType: MediaType.parse(_getContentType(finalFile.path)),
        ),
        'category': category.value,
        'folder': folder ?? 'videos',
        'upload_id': upload.id,
      });
      
      // Upload to server
      final response = await _apiClient.upload(
        '/media/upload',
        formData,
        onSendProgress: (sent, total) {
          final progress = sent / total;
          onProgress?.call(sent, total);
          _updateUploadProgress(upload.id, progress);
        },
        cancelToken: cancelToken,
      );
      
      final mediaItem = MediaItem.fromJson(response.data);
      
      // Update upload record
      await _updateUploadStatus(upload.id, UploadStatus.completed, mediaItem.url);
      
      return MediaUploadResult.success(mediaItem);
      
    } catch (e) {
      return MediaUploadResult.failure(
        e is ApiException ? e : ApiException.unknown(e.toString())
      );
    }
  }
  
  // Get upload progress
  Stream<MediaUpload> getUploadProgress(String uploadId) {
    return Stream.periodic(const Duration(milliseconds: 500), (_) {
      final uploadsBox = _dbManager.getBox<MediaUpload>('uploads');
      return uploadsBox.get(uploadId);
    }).where((upload) => upload != null).cast<MediaUpload>();
  }
  
  // Cancel upload
  Future<void> cancelUpload(String uploadId) async {
    await _updateUploadStatus(uploadId, UploadStatus.cancelled);
  }
  
  // Validate image file
  Future<ValidationResult> _validateImageFile(File file) async {
    final extension = path.extension(file.path).toLowerCase().substring(1);
    
    if (!supportedImageFormats.contains(extension)) {
      return ValidationResult.invalid(['Unsupported image format. Supported: ${supportedImageFormats.join(', ')}']);
    }
    
    final fileSize = await file.length();
    if (fileSize > maxImageSize) {
      return ValidationResult.invalid(['Image size too large. Maximum: ${maxImageSize ~/ (1024 * 1024)}MB']);
    }
    
    return ValidationResult.valid;
  }
  
  // Validate video file
  Future<ValidationResult> _validateVideoFile(File file) async {
    final extension = path.extension(file.path).toLowerCase().substring(1);
    
    if (!supportedVideoFormats.contains(extension)) {
      return ValidationResult.invalid(['Unsupported video format. Supported: ${supportedVideoFormats.join(', ')}']);
    }
    
    final fileSize = await file.length();
    if (fileSize > maxVideoSize) {
      return ValidationResult.invalid(['Video size too large. Maximum: ${maxVideoSize ~/ (1024 * 1024)}MB']);
    }
    
    return ValidationResult.valid;
  }
  
  // Compress image
  Future<File> _compressImage(File imageFile) async {
    try {
      final bytes = await imageFile.readAsBytes();
      final image = img.decodeImage(bytes);
      
      if (image == null) {
        throw Exception('Invalid image file');
      }
      
      // Resize if too large
      img.Image resized = image;
      if (image.width > 1920 || image.height > 1920) {
        resized = img.copyResize(
          image,
          width: image.width > image.height ? 1920 : null,
          height: image.height > image.width ? 1920 : null,
        );
      }
      
      // Compress
      final compressedBytes = img.encodeJpg(resized, quality: 85);
      
      // Save to temporary file
      final tempDir = await getTemporaryDirectory();
      final compressedFile = File('${tempDir.path}/compressed_${DateTime.now().millisecondsSinceEpoch}.jpg');
      await compressedFile.writeAsBytes(compressedBytes);
      
      return compressedFile;
    } catch (e) {
      // Return original file if compression fails
      return imageFile;
    }
  }
  
  // Compress video
  Future<File> _compressVideo(File videoFile, {ProgressCallback? onProgress}) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final outputPath = '${tempDir.path}/compressed_${DateTime.now().millisecondsSinceEpoch}.mp4';
      
      // Use FFmpeg for video compression
      final session = await FFmpegKit.execute(
        '-i ${videoFile.path} -vcodec libx264 -crf 28 -preset medium $outputPath'
      );
      
      final returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        return File(outputPath);
      } else {
        throw Exception('Video compression failed');
      }
    } catch (e) {
      // Return original file if compression fails
      return videoFile;
    }
  }
  
  // Update upload progress
  void _updateUploadProgress(String uploadId, double progress) {
    final uploadsBox = _dbManager.getBox<MediaUpload>('uploads');
    final upload = uploadsBox.get(uploadId);
    
    if (upload != null) {
      final updatedUpload = upload.copyWith(progress: progress);
      uploadsBox.put(uploadId, updatedUpload);
    }
  }
  
  // Update upload status
  Future<void> _updateUploadStatus(String uploadId, UploadStatus status, [String? finalUrl]) async {
    final uploadsBox = _dbManager.getBox<MediaUpload>('uploads');
    final upload = uploadsBox.get(uploadId);
    
    if (upload != null) {
      final updatedUpload = upload.copyWith(
        status: status,
        finalUrl: finalUrl,
        completedAt: status == UploadStatus.completed ? DateTime.now() : null,
      );
      uploadsBox.put(uploadId, updatedUpload);
    }
  }
  
  // Get content type for file
  String _getContentType(String filePath) {
    final extension = path.extension(filePath).toLowerCase();
    switch (extension) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.mp4':
        return 'video/mp4';
      case '.mov':
        return 'video/quicktime';
      case '.avi':
        return 'video/x-msvideo';
      default:
        return 'application/octet-stream';
    }
  }
}

@freezed
class MediaUploadResult with _$MediaUploadResult {
  const factory MediaUploadResult.success(MediaItem mediaItem) = MediaUploadSuccess;
  const factory MediaUploadResult.failure(ApiException error) = MediaUploadFailure;
}

extension MediaUploadResultExt on MediaUploadResult {
  bool get isSuccess => this is MediaUploadSuccess;
  bool get isFailure => this is MediaUploadFailure;
  MediaItem? get mediaItem => isSuccess ? (this as MediaUploadSuccess).mediaItem : null;
  ApiException? get error => isFailure ? (this as MediaUploadFailure).error : null;
}

enum MediaCategory {
  general('general'),
  profile('profile'),
  property('property'),
  tour('tour'),
  verification('verification');

  const MediaCategory(this.value);
  final String value;
}

// Media upload service provider
final mediaUploadServiceProvider = Provider<MediaUploadService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final dbManager = ref.watch(databaseManagerProvider);
  return MediaUploadService(apiClient, dbManager);
});
```

---

## 🔧 API Service Layer

### **User Service Implementation**
```dart
// lib/core/services/user_service.dart
class UserService {
  final ApiHttpClient _apiClient;
  final DatabaseManager _dbManager;
  final SyncManager _syncManager;
  
  UserService(this._apiClient, this._dbManager, this._syncManager);
  
  // Get current user profile
  Future<User> getCurrentUser() async {
    try {
      final response = await _apiClient.get('/user/profile');
      final user = User.fromJson(response.data);
      
      // Cache user data
      final usersBox = _dbManager.getBox<User>('users');
      await usersBox.put(user.id, user);
      
      return user;
    } catch (e) {
      // Try to get from cache
      final usersBox = _dbManager.getBox<User>('users');
      final cachedUser = usersBox.values.isNotEmpty ? usersBox.values.first : null;
      
      if (cachedUser != null) {
        return cachedUser;
      }
      
      throw e;
    }
  }
  
  // Update user profile
  Future<User> updateProfile(Map<String, dynamic> updates) async {
    try {
      final response = await _apiClient.put('/user/profile', data: updates);
      final user = User.fromJson(response.data);
      
      // Update cache
      final usersBox = _dbManager.getBox<User>('users');
      await usersBox.put(user.id, user);
      
      return user;
    } catch (e) {
      // Add to sync queue for offline update
      await _syncManager.addToSyncQueue('users', 'current', 'UPDATE', updates);
      
      // Update local cache optimistically
      final usersBox = _dbManager.getBox<User>('users');
      final currentUser = usersBox.values.isNotEmpty ? usersBox.values.first : null;
      
      if (currentUser != null) {
        final updatedUser = currentUser.copyWith(
          name: updates['name'] ?? currentUser.name,
          phone: updates['phone'] ?? currentUser.phone,
          location: updates['location'] ?? currentUser.location,
          bio: updates['bio'] ?? currentUser.bio,
          updatedAt: DateTime.now(),
        );
        
        await usersBox.put(updatedUser.id, updatedUser);
        return updatedUser;
      }
      
      throw e;
    }
  }
  
  // Upload profile image
  Future<User> updateProfileImage(File imageFile) async {
    try {
      final mediaService = MediaUploadService(_apiClient, _dbManager);
      final uploadResult = await mediaService.uploadImage(
        imageFile,
        folder: 'profiles',
        category: MediaCategory.profile,
      );
      
      if (uploadResult.isSuccess) {
        return await updateProfile({
          'profile_image_url': uploadResult.mediaItem!.url,
        });
      } else {
        throw uploadResult.error!;
      }
    } catch (e) {
      throw e;
    }
  }
  
  // Switch user role
  Future<User> switchRole(UserRole newRole) async {
    try {
      final response = await _apiClient.post('/user/switch-role', data: {
        'role': newRole.value,
      });
      
      final user = User.fromJson(response.data);
      
      // Update cache
      final usersBox = _dbManager.getBox<User>('users');
      await usersBox.put(user.id, user);
      
      return user;
    } catch (e) {
      throw e;
    }
  }
  
  // Get user verification status
  Future<VerificationData> getVerificationStatus() async {
    try {
      final response = await _apiClient.get('/user/verification');
      return VerificationData.fromJson(response.data);
    } catch (e) {
      throw e;
    }
  }
  
  // Submit verification documents
  Future<VerificationData> submitVerification(List<File> documents) async {
    try {
      final mediaService = MediaUploadService(_apiClient, _dbManager);
      final uploadResults = await mediaService.uploadImages(
        documents,
        folder: 'verification',
        category: MediaCategory.verification,
      );
      
      // Check if all uploads succeeded
      final successfulUploads = uploadResults
          .where((result) => result.isSuccess)
          .map((result) => result.mediaItem!)
          .toList();
      
      if (successfulUploads.isEmpty) {
        throw ApiException.unknown('Failed to upload verification documents');
      }
      
      // Submit verification request
      final response = await _apiClient.post('/user/verification/submit', data: {
        'documents': successfulUploads.map((item) => {
          'url': item.url,
          'type': item.metadata?['document_type'] ?? 'identity',
        }).toList(),
      });
      
      return VerificationData.fromJson(response.data);
    } catch (e) {
      throw e;
    }
  }
  
  // Delete user account
  Future<void> deleteAccount() async {
    try {
      await _apiClient.delete('/user/account');
      
      // Clear all local data
      await _dbManager.clearAllData();
    } catch (e) {
      throw e;
    }
  }
  
  // Get user statistics
  Future<UserStats> getUserStats() async {
    try {
      final response = await _apiClient.get('/user/stats');
      return UserStats.fromJson(response.data);
    } catch (e) {
      // Return cached stats or default
      return const UserStats();
    }
  }
  
  // Update user preferences
  Future<UserPreferences> updatePreferences(UserPreferences preferences) async {
    try {
      final response = await _apiClient.put('/user/preferences', data: preferences.toJson());
      return UserPreferences.fromJson(response.data);
    } catch (e) {
      // Add to sync queue
      await _syncManager.addToSyncQueue('user_preferences', 'current', 'UPDATE', preferences.toJson());
      
      return preferences;
    }
  }
}

// User service provider
final userServiceProvider = Provider<UserService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final dbManager = ref.watch(databaseManagerProvider);
  final syncManager = ref.watch(syncManagerProvider);
  return UserService(apiClient, dbManager, syncManager);
});
```

### **Booking Service Implementation**
```dart
// lib/core/services/booking_service.dart
class BookingService {
  final ApiHttpClient _apiClient;
  final DatabaseManager _dbManager;
  final SyncManager _syncManager;
  
  BookingService(this._apiClient, this._dbManager, this._syncManager);
  
  // Create new booking
  Future<Booking> createBooking(CreateBookingRequest request) async {
    try {
      final response = await _apiClient.post('/bookings', data: request.toJson());
      final booking = Booking.fromJson(response.data);
      
      // Cache booking
      final bookingsBox = _dbManager.getBox<Booking>('bookings');
      await bookingsBox.put(booking.id, booking);
      
      return booking;
    } catch (e) {
      // Add to sync queue for offline booking
      final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
      await _syncManager.addToSyncQueue('bookings', tempId, 'CREATE', request.toJson());
      
      // Create temporary booking for optimistic UI
      final tempBooking = Booking(
        id: tempId,
        userId: request.userId,
        packageId: request.packageId,
        status: BookingStatus.pending,
        details: request.details,
        payment: PaymentInfo(
          totalAmount: request.totalAmount,
          paidAmount: 0.0,
        ),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      final bookingsBox = _dbManager.getBox<Booking>('bookings');
      await bookingsBox.put(tempId, tempBooking);
      
      return tempBooking;
    }
  }
  
  // Get user bookings
  Future<List<Booking>> getUserBookings({
    BookingStatus? status,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final response = await _apiClient.get('/bookings', queryParameters: {
        if (status != null) 'status': status.value,
        'page': page,
        'page_size': pageSize,
      });
      
      final bookings = (response.data['bookings'] as List<dynamic>)
          .map((json) => Booking.fromJson(json as Map<String, dynamic>))
          .toList();
      
      // Cache bookings
      final bookingsBox = _dbManager.getBox<Booking>('bookings');
      for (final booking in bookings) {
        await bookingsBox.put(booking.id, booking);
      }
      
      return bookings;
    } catch (e) {
      // Return cached bookings
      final bookingsBox = _dbManager.getBox<Booking>('bookings');
      final cachedBookings = bookingsBox.values.toList();
      
      if (status != null) {
        return cachedBookings.where((b) => b.status == status).toList();
      }
      
      return cachedBookings;
    }
  }
  
  // Get booking details
  Future<Booking> getBookingDetails(String bookingId) async {
    try {
      final response = await _apiClient.get('/bookings/$bookingId');
      final booking = Booking.fromJson(response.data);
      
      // Cache booking
      final bookingsBox = _dbManager.getBox<Booking>('bookings');
      await bookingsBox.put(booking.id, booking);
      
      return booking;
    } catch (e) {
      // Try to get from cache
      final bookingsBox = _dbManager.getBox<Booking>('bookings');
      final cachedBooking = bookingsBox.get(bookingId);
      
      if (cachedBooking != null) {
        return cachedBooking;
      }
      
      throw e;
    }
  }
  
  // Cancel booking
  Future<Booking> cancelBooking(String bookingId, String reason) async {
    try {
      final response = await _apiClient.post('/bookings/$bookingId/cancel', data: {
        'reason': reason,
      });
      
      final booking = Booking.fromJson(response.data);
      
      // Update cache
      final bookingsBox = _dbManager.getBox<Booking>('bookings');
      await bookingsBox.put(booking.id, booking);
      
      return booking;
    } catch (e) {
      // Add to sync queue
      await _syncManager.addToSyncQueue('bookings', bookingId, 'UPDATE', {
        'status': BookingStatus.cancelled.value,
        'cancellation_reason': reason,
      });
      
      // Update local booking optimistically
      final bookingsBox = _dbManager.getBox<Booking>('bookings');
      final currentBooking = bookingsBox.get(bookingId);
      
      if (currentBooking != null) {
        final updatedBooking = currentBooking.copyWith(
          status: BookingStatus.cancelled,
          updatedAt: DateTime.now(),
        );
        
        await bookingsBox.put(bookingId, updatedBooking);
        return updatedBooking;
      }
      
      throw e;
    }
  }
  
  // Process payment
  Future<PaymentResult> processPayment(String bookingId, PaymentRequest payment) async {
    try {
      final response = await _apiClient.post('/bookings/$bookingId/payment', data: payment.toJson());
      return PaymentResult.fromJson(response.data);
    } catch (e) {
      throw e;
    }
  }
  
  // Modify booking
  Future<Booking> modifyBooking(String bookingId, Map<String, dynamic> modifications) async {
    try {
      final response = await _apiClient.put('/bookings/$bookingId', data: modifications);
      final booking = Booking.fromJson(response.data);
      
      // Update cache
      final bookingsBox = _dbManager.getBox<Booking>('bookings');
      await bookingsBox.put(booking.id, booking);
      
      return booking;
    } catch (e) {
      // Add to sync queue
      await _syncManager.addToSyncQueue('bookings', bookingId, 'UPDATE', modifications);
      
      throw e;
    }
  }
  
  // Get booking statistics
  Future<BookingStats> getBookingStats() async {
    try {
      final response = await _apiClient.get('/bookings/stats');
      return BookingStats.fromJson(response.data);
    } catch (e) {
      // Calculate from cached bookings
      final bookingsBox = _dbManager.getBox<Booking>('bookings');
      final bookings = bookingsBox.values.toList();
      
      return BookingStats(
        totalBookings: bookings.length,
        completedBookings: bookings.where((b) => b.status == BookingStatus.completed).length,
        totalSpent: bookings.fold(0.0, (sum, b) => sum + b.payment.totalAmount),
        upcomingBookings: bookings.where((b) => 
          b.status == BookingStatus.confirmed && 
          b.checkInDate != null && 
          b.checkInDate!.isAfter(DateTime.now())
        ).length,
      );
    }
  }
}

@freezed
class CreateBookingRequest with _$CreateBookingRequest {
  const factory CreateBookingRequest({
    required String userId,
    required String packageId,
    required BookingDetails details,
    required double totalAmount,
    required List<BookingGuest> guests,
    DateTime? checkInDate,
    DateTime? checkOutDate,
    String? specialRequests,
  }) = _CreateBookingRequest;

  factory CreateBookingRequest.fromJson(Map<String, dynamic> json) => 
      _$CreateBookingRequestFromJson(json);
}

@freezed
class PaymentRequest with _$PaymentRequest {
  const factory PaymentRequest({
    required PaymentMethod method,
    required double amount,
    String? paymentMethodId,
    Map<String, dynamic>? billingAddress,
    String? currency,
  }) = _PaymentRequest;

  factory PaymentRequest.fromJson(Map<String, dynamic> json) => 
      _$PaymentRequestFromJson(json);
}

@freezed
class PaymentResult with _$PaymentResult {
  const factory PaymentResult({
    required bool success,
    String? transactionId,
    String? message,
    PaymentStatus? status,
  }) = _PaymentResult;

  factory PaymentResult.fromJson(Map<String, dynamic> json) => 
      _$PaymentResultFromJson(json);
}

@freezed
class BookingStats with _$BookingStats {
  const factory BookingStats({
    @Default(0) int totalBookings,
    @Default(0) int completedBookings,
    @Default(0.0) double totalSpent,
    @Default(0) int upcomingBookings,
  }) = _BookingStats;

  factory BookingStats.fromJson(Map<String, dynamic> json) => 
      _$BookingStatsFromJson(json);
}

// Booking service provider
final bookingServiceProvider = Provider<BookingService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final dbManager = ref.watch(databaseManagerProvider);
  final syncManager = ref.watch(syncManagerProvider);
  return BookingService(apiClient, dbManager, syncManager);
});
```

---

## 🔧 HTTP Interceptors

### **Error Handling Interceptor**
```dart
// lib/core/api/interceptors/error_handling_interceptor.dart
class ErrorHandlingInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Log error details
    _logError(err);
    
    // Handle specific error cases
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout) {
      
      // Show user-friendly timeout message
      _showErrorMessage('Request timed out. Please check your connection and try again.');
    } else if (err.type == DioExceptionType.connectionError) {
      
      // Handle network connectivity issues
      _showErrorMessage('No internet connection. Please check your network settings.');
    } else if (err.response?.statusCode == 500) {
      
      // Handle server errors
      _showErrorMessage('Server error occurred. Please try again later.');
    }
    
    super.onError(err, handler);
  }
  
  void _logError(DioException err) {
    debugPrint('API Error: ${err.message}');
    debugPrint('Request: ${err.requestOptions.method} ${err.requestOptions.path}');
    debugPrint('Status Code: ${err.response?.statusCode}');
    debugPrint('Response: ${err.response?.data}');
  }
  
  void _showErrorMessage(String message) {
    // Show error message to user via toast or snackbar
    // This would typically use a service locator to access the UI layer
  }
}

// Retry interceptor
class RetryInterceptor extends Interceptor {
  static const int maxRetries = 3;
  static const Duration retryDelay = Duration(seconds: 1);
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final requestOptions = err.requestOptions;
    
    // Only retry on network errors and 5xx server errors
    if (_shouldRetry(err)) {
      final retryCount = requestOptions.extra['retry_count'] ?? 0;
      
      if (retryCount < maxRetries) {
        requestOptions.extra['retry_count'] = retryCount + 1;
        
        // Wait before retrying
        await Future.delayed(retryDelay * (retryCount + 1));
        
        try {
          final response = await Dio().fetch(requestOptions);
          handler.resolve(response);
          return;
        } catch (e) {
          // If retry fails, continue with original error
        }
      }
    }
    
    super.onError(err, handler);
  }
  
  bool _shouldRetry(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
           err.type == DioExceptionType.receiveTimeout ||
           err.type == DioExceptionType.connectionError ||
           (err.response?.statusCode != null && err.response!.statusCode! >= 500);
  }
}

// Performance monitoring interceptor
class PerformanceInterceptor extends Interceptor {
  final Map<String, Stopwatch> _requestTimers = {};
  
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final requestId = _generateRequestId(options);
    _requestTimers[requestId] = Stopwatch()..start();
    super.onRequest(options, handler);
  }
  
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final requestId = _generateRequestId(response.requestOptions);
    final timer = _requestTimers.remove(requestId);
    
    if (timer != null) {
      timer.stop();
      final duration = timer.elapsedMilliseconds;
      
      _logPerformance(response.requestOptions, duration, response.statusCode);
      
      // Alert for slow requests
      if (duration > 5000) { // 5 seconds
        debugPrint('⚠️ Slow API request: ${response.requestOptions.path} took ${duration}ms');
      }
    }
    
    super.onResponse(response, handler);
  }
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final requestId = _generateRequestId(err.requestOptions);
    _requestTimers.remove(requestId);
    super.onError(err, handler);
  }
  
  String _generateRequestId(RequestOptions options) {
    return '${options.method}_${options.path}_${options.hashCode}';
  }
  
  void _logPerformance(RequestOptions options, int duration, int? statusCode) {
    debugPrint('API Performance: ${options.method} ${options.path} - ${duration}ms (${statusCode})');
    
    // Send performance metrics to analytics service
    // Analytics.instance.trackApiPerformance(options.path, duration, statusCode);
  }
}
```

---

## 🔍 Migration Checklist

### **✅ Core API Infrastructure**
- [ ] Implement Dio HTTP client with interceptors
- [ ] Set up authentication manager with JWT handling
- [ ] Create comprehensive error handling system
- [ ] Implement retry logic and timeout management
- [ ] Add certificate pinning for security

### **✅ Real-time Communication**
- [ ] Integrate WebSocket manager for live updates
- [ ] Set up push notifications with Firebase
- [ ] Implement real-time verification updates
- [ ] Create message handling and routing system
- [ ] Add connection management and reconnection logic

### **✅ Offline Capabilities**
- [ ] Set up local database with Hive and SQLite
- [ ] Implement offline sync manager
- [ ] Create conflict resolution strategies
- [ ] Build sync queue for offline operations
- [ ] Add cache management and cleanup

### **✅ API Services**
- [ ] Create search service with offline fallback
- [ ] Implement media upload with compression
- [ ] Build user service with profile management
- [ ] Create booking service with offline queue
- [ ] Add verification service integration

### **✅ Performance & Security**
- [ ] Implement request caching strategies
- [ ] Add API performance monitoring
- [ ] Set up error tracking and analytics
- [ ] Create security measures and validation
- [ ] Optimize for battery and data usage

### **✅ Testing & Quality**
- [ ] Write comprehensive API integration tests
- [ ] Create mock services for testing
- [ ] Test offline scenarios and sync
- [ ] Verify error handling and recovery
- [ ] Performance test all API endpoints

---

## 🔍 Next Steps

1. **Create role-specific features** (`10_role_features.md`)
2. **Implement testing strategies** (`11_testing_strategy.md`)
3. **Build offline capabilities** (`12_offline_system.md`)
4. **Add deployment pipeline** (`13_deployment_guide.md`)
5. **Create performance optimization** (`14_performance_guide.md`)

---

*This comprehensive Flutter API integration system provides robust offline-first capabilities, real-time communication, and sophisticated error handling while preserving all features from the React implementation. The modular design ensures maintainability and allows for easy extension of API capabilities.*