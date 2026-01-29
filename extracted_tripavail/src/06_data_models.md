# Flutter Data Models & Types Implementation

## Executive Summary

This document defines the comprehensive Flutter data models and types system for TripAvail, migrating from TypeScript interfaces to Dart classes with proper serialization, validation, and state management integration. The system preserves all sophisticated data relationships including role-based user models, complex booking flows, search filtering, and real-time updates while leveraging Flutter's type safety and performance benefits.

### Key Data Model Features to Migrate
- **Role-Based User Models**: Traveler, Hotel Manager, Tour Operator with different capabilities
- **Complex Package System**: Hotels, tours, packages with rich metadata and media
- **Advanced Search & Filtering**: Multi-dimensional search with real-time updates
- **Booking & Payment Flow**: Complete booking lifecycle with payment integration
- **Verification System**: Document verification and compliance tracking
- **Location & Geography**: Advanced location handling with coordinates and regions

---

## 📊 Data Architecture Overview

### **Data Model Hierarchy**
```
TripAvail Data Models
├── Core Models
│   ├── User & Role System
│   ├── Authentication & Security
│   ├── Location & Geography
│   └── Media & Assets
├── Business Models
│   ├── Hotel & Property Management
│   ├── Tour & Experience Management
│   ├── Package & Pricing System
│   └── Booking & Reservation Flow
├── Search & Discovery
│   ├── Search Filters & Criteria
│   ├── Results & Recommendations
│   └── Personalization Data
├── Transaction Models
│   ├── Payment & Billing
│   ├── Reviews & Ratings
│   └── Verification & Compliance
└── Application State
    ├── Navigation State
    ├── UI State & Preferences
    └── Cache & Offline Data
```

### **Model Relationships**
```dart
// Core relationship mapping
User 1:N Property (for hotel managers)
User 1:N Tour (for tour operators)  
User 1:N Booking (for travelers)
Property 1:N Package
Tour 1:N Package
Package 1:N Booking
Booking 1:N Review
User 1:N Review
```

---

## 🏗️ Core Foundation Models

### **Enum Definitions**
```dart
// lib/core/models/enums.dart

enum UserRole {
  traveler('traveler', 'Traveler'),
  hotelManager('hotel_manager', 'Hotel Manager'),
  tourOperator('tour_operator', 'Tour Operator');

  const UserRole(this.value, this.displayName);
  
  final String value;
  final String displayName;
  
  static UserRole fromString(String value) {
    return UserRole.values.firstWhere(
      (role) => role.value == value,
      orElse: () => UserRole.traveler,
    );
  }
}

enum VerificationStatus {
  pending('pending', 'Pending'),
  inProgress('in_progress', 'In Progress'),
  verified('verified', 'Verified'),
  rejected('rejected', 'Rejected'),
  expired('expired', 'Expired');

  const VerificationStatus(this.value, this.displayName);
  
  final String value;
  final String displayName;
  
  static VerificationStatus fromString(String value) {
    return VerificationStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => VerificationStatus.pending,
    );
  }
}

enum BookingStatus {
  pending('pending', 'Pending'),
  confirmed('confirmed', 'Confirmed'),
  inProgress('in_progress', 'In Progress'),
  completed('completed', 'Completed'),
  cancelled('cancelled', 'Cancelled'),
  refunded('refunded', 'Refunded');

  const BookingStatus(this.value, this.displayName);
  
  final String value;
  final String displayName;
  
  static BookingStatus fromString(String value) {
    return BookingStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => BookingStatus.pending,
    );
  }
}

enum PropertyType {
  hotel('hotel', 'Hotel'),
  resort('resort', 'Resort'),
  apartment('apartment', 'Apartment'),
  villa('villa', 'Villa'),
  guesthouse('guesthouse', 'Guest House'),
  hostel('hostel', 'Hostel'),
  bnb('bnb', 'Bed & Breakfast');

  const PropertyType(this.value, this.displayName);
  
  final String value;
  final String displayName;
  
  static PropertyType fromString(String value) {
    return PropertyType.values.firstWhere(
      (type) => type.value == value,
      orElse: () => PropertyType.hotel,
    );
  }
}

enum RoomType {
  single('single', 'Single Room'),
  double('double', 'Double Room'),
  twin('twin', 'Twin Room'),
  suite('suite', 'Suite'),
  deluxe('deluxe', 'Deluxe Room'),
  family('family', 'Family Room'),
  penthouse('penthouse', 'Penthouse');

  const RoomType(this.value, this.displayName);
  
  final String value;
  final String displayName;
  
  static RoomType fromString(String value) {
    return RoomType.values.firstWhere(
      (type) => type.value == value,
      orElse: () => RoomType.double,
    );
  }
}

enum TourType {
  cityTour('city_tour', 'City Tour'),
  culturalTour('cultural_tour', 'Cultural Tour'),
  adventureTour('adventure_tour', 'Adventure Tour'),
  foodTour('food_tour', 'Food Tour'),
  natureTour('nature_tour', 'Nature Tour'),
  historicalTour('historical_tour', 'Historical Tour'),
  nightlifeTour('nightlife_tour', 'Nightlife Tour');

  const TourType(this.value, this.displayName);
  
  final String value;
  final String displayName;
  
  static TourType fromString(String value) {
    return TourType.values.firstWhere(
      (type) => type.value == value,
      orElse: () => TourType.cityTour,
    );
  }
}

enum PaymentMethod {
  creditCard('credit_card', 'Credit Card'),
  debitCard('debit_card', 'Debit Card'),
  paypal('paypal', 'PayPal'),
  applePay('apple_pay', 'Apple Pay'),
  googlePay('google_pay', 'Google Pay'),
  bankTransfer('bank_transfer', 'Bank Transfer');

  const PaymentMethod(this.value, this.displayName);
  
  final String value;
  final String displayName;
  
  static PaymentMethod fromString(String value) {
    return PaymentMethod.values.firstWhere(
      (method) => method.value == value,
      orElse: () => PaymentMethod.creditCard,
    );
  }
}
```

### **Base Model Interface**
```dart
// lib/core/models/base_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';

abstract class BaseModel {
  String get id;
  DateTime get createdAt;
  DateTime get updatedAt;
  
  Map<String, dynamic> toJson();
  
  @override
  bool operator ==(Object other);
  
  @override
  int get hashCode;
}

// Mixin for models that can be cached
mixin Cacheable {
  String get cacheKey;
  Duration get cacheDuration => const Duration(minutes: 5);
  bool get shouldCache => true;
}

// Mixin for models that can be searched
mixin Searchable {
  List<String> get searchableFields;
  String get searchableText;
  Map<String, dynamic> get searchFilters;
}

// Mixin for models that require validation
mixin Validatable {
  ValidationResult validate();
  bool get isValid => validate().isValid;
  List<String> get validationErrors => validate().errors;
}

class ValidationResult {
  final bool isValid;
  final List<String> errors;
  final List<String> warnings;
  
  const ValidationResult({
    required this.isValid,
    this.errors = const [],
    this.warnings = const [],
  });
  
  static const ValidationResult valid = ValidationResult(isValid: true);
  
  static ValidationResult invalid(List<String> errors) {
    return ValidationResult(isValid: false, errors: errors);
  }
}
```

---

## 👤 User & Authentication Models

### **User Models**
```dart
// lib/core/models/user/user_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:flutter/foundation.dart';
import '../base_model.dart';
import '../enums.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
class User with _$User implements BaseModel, Cacheable, Validatable {
  const factory User({
    required String id,
    required String email,
    required String name,
    required UserRole role,
    required DateTime createdAt,
    required DateTime updatedAt,
    String? phone,
    String? profileImageUrl,
    String? location,
    String? bio,
    String? language,
    String? currency,
    @Default(false) bool isVerified,
    @Default(false) bool isEmailVerified,
    @Default(false) bool isPhoneVerified,
    UserPreferences? preferences,
    UserStats? stats,
    VerificationData? verification,
    @Default([]) List<String> favoriteDestinations,
    @Default([]) List<String> blockedUsers,
    DateTime? lastActiveAt,
    DateTime? lastLoginAt,
  }) = _User;

  const User._();

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  // Cacheable implementation
  @override
  String get cacheKey => 'user_$id';

  // Validatable implementation
  @override
  ValidationResult validate() {
    final errors = <String>[];
    
    if (email.isEmpty || !email.contains('@')) {
      errors.add('Invalid email address');
    }
    
    if (name.isEmpty || name.length < 2) {
      errors.add('Name must be at least 2 characters');
    }
    
    if (phone != null && phone!.isNotEmpty && phone!.length < 10) {
      errors.add('Invalid phone number');
    }
    
    return errors.isEmpty 
        ? ValidationResult.valid 
        : ValidationResult.invalid(errors);
  }

  // Computed properties
  String get displayName => name.isNotEmpty ? name : email.split('@').first;
  
  String get initials {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : 'U';
  }
  
  bool get isPartner => role != UserRole.traveler;
  
  double get profileCompletion {
    double completion = 0.4; // Base for email and name
    
    if (phone?.isNotEmpty == true) completion += 0.1;
    if (profileImageUrl?.isNotEmpty == true) completion += 0.1;
    if (location?.isNotEmpty == true) completion += 0.1;
    if (bio?.isNotEmpty == true) completion += 0.1;
    if (isVerified) completion += 0.2;
    
    return completion.clamp(0.0, 1.0);
  }
}

@freezed
class UserPreferences with _$UserPreferences {
  const factory UserPreferences({
    @Default(true) bool emailNotifications,
    @Default(true) bool pushNotifications,
    @Default(false) bool smsNotifications,
    @Default(true) bool marketingEmails,
    @Default('metric') String measurementUnit,
    @Default('24h') String timeFormat,
    @Default(true) bool showOnlineStatus,
    @Default(true) bool allowLocationTracking,
    @Default('en') String language,
    @Default('USD') String currency,
    @Default(ThemeMode.system) ThemeMode themeMode,
    Map<String, dynamic>? customSettings,
  }) = _UserPreferences;

  factory UserPreferences.fromJson(Map<String, dynamic> json) => 
      _$UserPreferencesFromJson(json);
}

@freezed
class UserStats with _$UserStats {
  const factory UserStats({
    @Default(0) int totalBookings,
    @Default(0) int completedTrips,
    @Default(0) int reviewsGiven,
    @Default(0) int reviewsReceived,
    @Default(0.0) double averageRating,
    @Default(0) int rewardPoints,
    @Default(0.0) double totalSpent,
    @Default(0) int propertiesManaged,
    @Default(0) int toursCreated,
    @Default(0) int packagesListed,
    DateTime? memberSince,
    String? loyaltyTier,
    Map<String, int>? achievementCounts,
  }) = _UserStats;

  factory UserStats.fromJson(Map<String, dynamic> json) => 
      _$UserStatsFromJson(json);
}

@freezed
class VerificationData with _$VerificationData {
  const factory VerificationData({
    required VerificationStatus status,
    String? documentType,
    String? documentNumber,
    DateTime? submittedAt,
    DateTime? verifiedAt,
    DateTime? expiresAt,
    String? rejectionReason,
    @Default([]) List<VerificationDocument> documents,
    Map<String, dynamic>? metadata,
  }) = _VerificationData;

  factory VerificationData.fromJson(Map<String, dynamic> json) => 
      _$VerificationDataFromJson(json);
}

@freezed
class VerificationDocument with _$VerificationDocument {
  const factory VerificationDocument({
    required String id,
    required String type,
    required String url,
    required DateTime uploadedAt,
    @Default(VerificationStatus.pending) VerificationStatus status,
    String? notes,
    Map<String, dynamic>? extractedData,
  }) = _VerificationDocument;

  factory VerificationDocument.fromJson(Map<String, dynamic> json) => 
      _$VerificationDocumentFromJson(json);
}
```

### **Authentication Models**
```dart
// lib/core/models/auth/auth_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_model.freezed.dart';
part 'auth_model.g.dart';

@freezed
class AuthState with _$AuthState {
  const factory AuthState({
    User? user,
    @Default(false) bool isAuthenticated,
    @Default(false) bool isLoading,
    @Default(false) bool isInitialized,
    String? accessToken,
    String? refreshToken,
    DateTime? tokenExpiry,
    String? error,
    AuthProvider? lastProvider,
  }) = _AuthState;

  const AuthState._();

  factory AuthState.fromJson(Map<String, dynamic> json) => 
      _$AuthStateFromJson(json);

  bool get isTokenValid => 
      accessToken != null && 
      tokenExpiry != null && 
      tokenExpiry!.isAfter(DateTime.now());

  bool get needsRefresh => 
      accessToken != null && 
      tokenExpiry != null && 
      tokenExpiry!.isBefore(DateTime.now().add(const Duration(minutes: 5)));
}

enum AuthProvider {
  email('email', 'Email'),
  google('google', 'Google'),
  apple('apple', 'Apple'),
  facebook('facebook', 'Facebook'),
  phone('phone', 'Phone');

  const AuthProvider(this.value, this.displayName);
  
  final String value;
  final String displayName;
}

@freezed
class LoginRequest with _$LoginRequest {
  const factory LoginRequest({
    required String email,
    required String password,
    @Default(false) bool rememberMe,
    String? deviceId,
    String? platform,
  }) = _LoginRequest;

  factory LoginRequest.fromJson(Map<String, dynamic> json) => 
      _$LoginRequestFromJson(json);
}

@freezed
class RegisterRequest with _$RegisterRequest {
  const factory RegisterRequest({
    required String email,
    required String password,
    required String name,
    required UserRole role,
    String? phone,
    String? referralCode,
    @Default(false) bool agreeToTerms,
    @Default(false) bool agreeToMarketing,
  }) = _RegisterRequest;

  factory RegisterRequest.fromJson(Map<String, dynamic> json) => 
      _$RegisterRequestFromJson(json);
}
```

---

## 🏨 Property & Hotel Models

### **Property Models**
```dart
// lib/core/models/property/property_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../base_model.dart';
import '../location/location_model.dart';
import '../media/media_model.dart';

part 'property_model.freezed.dart';
part 'property_model.g.dart';

@freezed
class Property with _$Property implements BaseModel, Cacheable, Searchable, Validatable {
  const factory Property({
    required String id,
    required String ownerId,
    required String name,
    required PropertyType type,
    required Location location,
    required DateTime createdAt,
    required DateTime updatedAt,
    String? description,
    @Default([]) List<MediaItem> images,
    @Default([]) List<Room> rooms,
    @Default([]) List<String> amenities,
    @Default([]) List<String> services,
    PropertyRules? rules,
    ContactInfo? contactInfo,
    @Default(0.0) double rating,
    @Default(0) int reviewCount,
    @Default(0.0) double basePrice,
    @Default('USD') String currency,
    @Default(true) bool isActive,
    @Default(false) bool isVerified,
    @Default(false) bool isFeatured,
    DateTime? lastBooking,
    Map<String, dynamic>? metadata,
  }) = _Property;

  const Property._();

  factory Property.fromJson(Map<String, dynamic> json) => 
      _$PropertyFromJson(json);

  // Cacheable implementation
  @override
  String get cacheKey => 'property_$id';

  // Searchable implementation
  @override
  List<String> get searchableFields => [
    'name', 'description', 'type', 'location.city', 'location.country'
  ];

  @override
  String get searchableText => [
    name,
    description ?? '',
    type.displayName,
    location.city,
    location.country,
    ...amenities,
    ...services,
  ].join(' ').toLowerCase();

  @override
  Map<String, dynamic> get searchFilters => {
    'type': type.value,
    'city': location.city,
    'country': location.country,
    'rating': rating,
    'basePrice': basePrice,
    'amenities': amenities,
    'isActive': isActive,
    'isVerified': isVerified,
  };

  // Validatable implementation
  @override
  ValidationResult validate() {
    final errors = <String>[];
    
    if (name.isEmpty || name.length < 3) {
      errors.add('Property name must be at least 3 characters');
    }
    
    if (rooms.isEmpty) {
      errors.add('Property must have at least one room');
    }
    
    if (basePrice <= 0) {
      errors.add('Base price must be greater than 0');
    }
    
    if (images.isEmpty) {
      errors.add('Property must have at least one image');
    }
    
    // Validate location
    final locationValidation = location.validate();
    if (!locationValidation.isValid) {
      errors.addAll(locationValidation.errors);
    }
    
    return errors.isEmpty 
        ? ValidationResult.valid 
        : ValidationResult.invalid(errors);
  }

  // Computed properties
  bool get hasAvailableRooms => rooms.any((room) => room.isAvailable);
  
  int get totalRooms => rooms.length;
  
  int get availableRooms => rooms.where((room) => room.isAvailable).length;
  
  double get minPrice => rooms.isEmpty ? basePrice : 
      rooms.map((r) => r.price).reduce((a, b) => a < b ? a : b);
  
  double get maxPrice => rooms.isEmpty ? basePrice : 
      rooms.map((r) => r.price).reduce((a, b) => a > b ? a : b);
  
  String get priceRange => minPrice == maxPrice 
      ? '\$${minPrice.toStringAsFixed(0)}'
      : '\$${minPrice.toStringAsFixed(0)} - \$${maxPrice.toStringAsFixed(0)}';
  
  String get shortDescription => description != null && description!.length > 150
      ? '${description!.substring(0, 150)}...'
      : description ?? '';
}

@freezed
class Room with _$Room implements Validatable {
  const factory Room({
    required String id,
    required String propertyId,
    required String name,
    required RoomType type,
    required double price,
    @Default('USD') String currency,
    @Default(1) int maxOccupancy,
    @Default(1) int bedCount,
    @Default(1) int bathroomCount,
    @Default(0.0) double size,
    @Default('sqm') String sizeUnit,
    String? description,
    @Default([]) List<MediaItem> images,
    @Default([]) List<String> amenities,
    @Default(true) bool isAvailable,
    @Default(false) bool isAccessible,
    Map<String, dynamic>? metadata,
  }) = _Room;

  const Room._();

  factory Room.fromJson(Map<String, dynamic> json) => _$RoomFromJson(json);

  @override
  ValidationResult validate() {
    final errors = <String>[];
    
    if (name.isEmpty) {
      errors.add('Room name is required');
    }
    
    if (price <= 0) {
      errors.add('Room price must be greater than 0');
    }
    
    if (maxOccupancy <= 0) {
      errors.add('Max occupancy must be greater than 0');
    }
    
    return errors.isEmpty 
        ? ValidationResult.valid 
        : ValidationResult.invalid(errors);
  }
}

@freezed
class PropertyRules with _$PropertyRules {
  const factory PropertyRules({
    DateTime? checkInTime,
    DateTime? checkOutTime,
    @Default(false) bool allowPets,
    @Default(false) bool allowSmoking,
    @Default(false) bool allowParties,
    @Default(0) int minimumAge,
    @Default(1) int minimumStay,
    @Default(0) int maximumStay,
    String? cancellationPolicy,
    @Default([]) List<String> houseRules,
    Map<String, dynamic>? additionalRules,
  }) = _PropertyRules;

  factory PropertyRules.fromJson(Map<String, dynamic> json) => 
      _$PropertyRulesFromJson(json);
}

@freezed
class ContactInfo with _$ContactInfo {
  const factory ContactInfo({
    String? phone,
    String? email,
    String? website,
    String? whatsapp,
    Map<String, String>? socialMedia,
    String? emergencyContact,
  }) = _ContactInfo;

  factory ContactInfo.fromJson(Map<String, dynamic> json) => 
      _$ContactInfoFromJson(json);
}
```

---

## 🚌 Tour & Experience Models

### **Tour Models**
```dart
// lib/core/models/tour/tour_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../base_model.dart';
import '../location/location_model.dart';
import '../media/media_model.dart';

part 'tour_model.freezed.dart';
part 'tour_model.g.dart';

@freezed
class Tour with _$Tour implements BaseModel, Cacheable, Searchable, Validatable {
  const factory Tour({
    required String id,
    required String operatorId,
    required String title,
    required TourType type,
    required Location location,
    required Duration duration,
    required double price,
    required DateTime createdAt,
    required DateTime updatedAt,
    String? description,
    String? shortDescription,
    @Default([]) List<MediaItem> images,
    @Default([]) List<TourItineraryItem> itinerary,
    @Default([]) List<String> highlights,
    @Default([]) List<String> inclusions,
    @Default([]) List<String> exclusions,
    @Default([]) List<String> requirements,
    @Default([]) List<TourSchedule> schedules,
    @Default(1) int minParticipants,
    @Default(20) int maxParticipants,
    @Default(0) int minimumAge,
    @Default(100) int maximumAge,
    @Default('easy') String difficultyLevel,
    @Default([]) List<String> languages,
    @Default('USD') String currency,
    @Default(0.0) double rating,
    @Default(0) int reviewCount,
    @Default(true) bool isActive,
    @Default(false) bool isVerified,
    @Default(false) bool isFeatured,
    TourGuide? guide,
    TourPolicies? policies,
    Map<String, dynamic>? metadata,
  }) = _Tour;

  const Tour._();

  factory Tour.fromJson(Map<String, dynamic> json) => _$TourFromJson(json);

  // Cacheable implementation
  @override
  String get cacheKey => 'tour_$id';

  // Searchable implementation
  @override
  List<String> get searchableFields => [
    'title', 'description', 'type', 'location.city', 'highlights'
  ];

  @override
  String get searchableText => [
    title,
    description ?? '',
    shortDescription ?? '',
    type.displayName,
    location.city,
    location.country,
    ...highlights,
    ...inclusions,
    ...languages,
  ].join(' ').toLowerCase();

  @override
  Map<String, dynamic> get searchFilters => {
    'type': type.value,
    'city': location.city,
    'country': location.country,
    'rating': rating,
    'price': price,
    'duration': duration.inHours,
    'difficultyLevel': difficultyLevel,
    'languages': languages,
    'isActive': isActive,
    'isVerified': isVerified,
  };

  // Validatable implementation
  @override
  ValidationResult validate() {
    final errors = <String>[];
    
    if (title.isEmpty || title.length < 5) {
      errors.add('Tour title must be at least 5 characters');
    }
    
    if (price <= 0) {
      errors.add('Tour price must be greater than 0');
    }
    
    if (duration.inMinutes <= 0) {
      errors.add('Tour duration must be greater than 0');
    }
    
    if (maxParticipants <= minParticipants) {
      errors.add('Max participants must be greater than min participants');
    }
    
    if (schedules.isEmpty) {
      errors.add('Tour must have at least one schedule');
    }
    
    return errors.isEmpty 
        ? ValidationResult.valid 
        : ValidationResult.invalid(errors);
  }

  // Computed properties
  String get durationText {
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return '${hours}h ${minutes}m';
    } else if (hours > 0) {
      return '${hours}h';
    } else {
      return '${minutes}m';
    }
  }
  
  bool get isMultiDay => duration.inDays > 0;
  
  String get participantRange => minParticipants == maxParticipants
      ? '$minParticipants participants'
      : '$minParticipants-$maxParticipants participants';
  
  bool get hasAvailableSlots => schedules.any((schedule) => 
      schedule.availableSpots > 0 && schedule.date.isAfter(DateTime.now()));
}

@freezed
class TourItineraryItem with _$TourItineraryItem {
  const factory TourItineraryItem({
    required String id,
    required String title,
    required Duration startTime,
    required Duration duration,
    String? description,
    Location? location,
    @Default([]) List<String> activities,
    @Default([]) List<MediaItem> images,
    Map<String, dynamic>? metadata,
  }) = _TourItineraryItem;

  factory TourItineraryItem.fromJson(Map<String, dynamic> json) => 
      _$TourItineraryItemFromJson(json);
}

@freezed
class TourSchedule with _$TourSchedule {
  const factory TourSchedule({
    required String id,
    required String tourId,
    required DateTime date,
    required TimeOfDay startTime,
    required TimeOfDay endTime,
    required int availableSpots,
    required int totalSpots,
    @Default([]) List<String> bookedBy,
    String? guideId,
    String? notes,
    @Default(true) bool isActive,
  }) = _TourSchedule;

  const TourSchedule._();

  factory TourSchedule.fromJson(Map<String, dynamic> json) => 
      _$TourScheduleFromJson(json);

  bool get isFull => availableSpots <= 0;
  bool get isAvailable => isActive && !isFull && date.isAfter(DateTime.now());
  double get occupancyRate => totalSpots > 0 ? (totalSpots - availableSpots) / totalSpots : 0.0;
}

@freezed
class TourGuide with _$TourGuide {
  const factory TourGuide({
    required String id,
    required String name,
    String? profileImageUrl,
    String? bio,
    @Default([]) List<String> languages,
    @Default([]) List<String> specializations,
    @Default(0.0) double rating,
    @Default(0) int tourCount,
    @Default(0) int experienceYears,
    @Default([]) List<String> certifications,
    ContactInfo? contactInfo,
  }) = _TourGuide;

  factory TourGuide.fromJson(Map<String, dynamic> json) => 
      _$TourGuideFromJson(json);
}

@freezed
class TourPolicies with _$TourPolicies {
  const factory TourPolicies({
    String? cancellationPolicy,
    String? refundPolicy,
    String? reschedulingPolicy,
    @Default([]) List<String> weatherPolicy,
    @Default([]) List<String> safetyGuidelines,
    @Default([]) List<String> restrictions,
    Map<String, dynamic>? additionalPolicies,
  }) = _TourPolicies;

  factory TourPolicies.fromJson(Map<String, dynamic> json) => 
      _$TourPoliciesFromJson(json);
}
```

---

## 📦 Package & Pricing Models

### **Package Models**
```dart
// lib/core/models/package/package_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../base_model.dart';

part 'package_model.freezed.dart';
part 'package_model.g.dart';

@freezed
class Package with _$Package implements BaseModel, Cacheable, Searchable, Validatable {
  const factory Package({
    required String id,
    required String providerId,
    required PackageType type,
    required String title,
    required String description,
    required PackagePricing pricing,
    required DateTime createdAt,
    required DateTime updatedAt,
    String? shortDescription,
    @Default([]) List<MediaItem> images,
    @Default([]) List<String> highlights,
    @Default([]) List<PackageInclusion> inclusions,
    @Default([]) List<PackageExclusion> exclusions,
    @Default([]) List<PackageItineraryDay> itinerary,
    PackageAvailability? availability,
    PackageRules? rules,
    @Default([]) List<String> tags,
    @Default(0.0) double rating,
    @Default(0) int reviewCount,
    @Default(0) int bookingCount,
    @Default(true) bool isActive,
    @Default(false) bool isVerified,
    @Default(false) bool isFeatured,
    @Default(false) bool isPromoted,
    // Related entities
    String? propertyId,
    String? tourId,
    @Default([]) List<String> relatedPackageIds,
    Map<String, dynamic>? metadata,
  }) = _Package;

  const Package._();

  factory Package.fromJson(Map<String, dynamic> json) => 
      _$PackageFromJson(json);

  // Cacheable implementation
  @override
  String get cacheKey => 'package_$id';

  // Searchable implementation
  @override
  List<String> get searchableFields => [
    'title', 'description', 'highlights', 'tags'
  ];

  @override
  String get searchableText => [
    title,
    description,
    shortDescription ?? '',
    ...highlights,
    ...tags,
  ].join(' ').toLowerCase();

  @override
  Map<String, dynamic> get searchFilters => {
    'type': type.value,
    'rating': rating,
    'basePrice': pricing.basePrice,
    'duration': itinerary.length,
    'tags': tags,
    'isActive': isActive,
    'isVerified': isVerified,
    'isFeatured': isFeatured,
  };

  // Validatable implementation
  @override
  ValidationResult validate() {
    final errors = <String>[];
    
    if (title.isEmpty || title.length < 5) {
      errors.add('Package title must be at least 5 characters');
    }
    
    if (description.isEmpty || description.length < 20) {
      errors.add('Package description must be at least 20 characters');
    }
    
    if (pricing.basePrice <= 0) {
      errors.add('Package price must be greater than 0');
    }
    
    if (images.isEmpty) {
      errors.add('Package must have at least one image');
    }
    
    if (highlights.isEmpty) {
      errors.add('Package must have at least one highlight');
    }
    
    return errors.isEmpty 
        ? ValidationResult.valid 
        : ValidationResult.invalid(errors);
  }

  // Computed properties
  int get durationDays => itinerary.length;
  
  String get durationText => durationDays == 1 
      ? '1 Day' 
      : '$durationDays Days';
  
  double get discountedPrice => pricing.discountPercentage > 0
      ? pricing.basePrice * (1 - pricing.discountPercentage / 100)
      : pricing.basePrice;
  
  bool get hasDiscount => pricing.discountPercentage > 0;
  
  String get priceText => hasDiscount
      ? '\$${discountedPrice.toStringAsFixed(0)} (was \$${pricing.basePrice.toStringAsFixed(0)})'
      : '\$${pricing.basePrice.toStringAsFixed(0)}';
  
  bool get isBookable => isActive && (availability?.hasAvailability ?? true);
}

enum PackageType {
  hotel('hotel', 'Hotel Package'),
  tour('tour', 'Tour Package'),
  combined('combined', 'Hotel + Tour Package'),
  experience('experience', 'Experience Package'),
  adventure('adventure', 'Adventure Package'),
  luxury('luxury', 'Luxury Package');

  const PackageType(this.value, this.displayName);
  
  final String value;
  final String displayName;
  
  static PackageType fromString(String value) {
    return PackageType.values.firstWhere(
      (type) => type.value == value,
      orElse: () => PackageType.combined,
    );
  }
}

@freezed
class PackagePricing with _$PackagePricing {
  const factory PackagePricing({
    required double basePrice,
    @Default('USD') String currency,
    @Default(0.0) double discountPercentage,
    @Default('per_person') String pricingUnit,
    @Default([]) List<PackagePricingTier> tiers,
    @Default([]) List<PackageAddOn> addOns,
    DateTime? discountValidUntil,
    Map<String, double>? seasonalAdjustments,
    Map<String, dynamic>? metadata,
  }) = _PackagePricing;

  factory PackagePricing.fromJson(Map<String, dynamic> json) => 
      _$PackagePricingFromJson(json);
}

@freezed
class PackagePricingTier with _$PackagePricingTier {
  const factory PackagePricingTier({
    required String name,
    required double price,
    required int minParticipants,
    required int maxParticipants,
    String? description,
  }) = _PackagePricingTier;

  factory PackagePricingTier.fromJson(Map<String, dynamic> json) => 
      _$PackagePricingTierFromJson(json);
}

@freezed
class PackageAddOn with _$PackageAddOn {
  const factory PackageAddOn({
    required String id,
    required String name,
    required double price,
    String? description,
    @Default(false) bool isRequired,
    @Default(true) bool isAvailable,
    @Default(0) int maxQuantity,
  }) = _PackageAddOn;

  factory PackageAddOn.fromJson(Map<String, dynamic> json) => 
      _$PackageAddOnFromJson(json);
}

@freezed
class PackageInclusion with _$PackageInclusion {
  const factory PackageInclusion({
    required String id,
    required String title,
    String? description,
    @Default('included') String type, // included, optional, premium
    double? additionalCost,
  }) = _PackageInclusion;

  factory PackageInclusion.fromJson(Map<String, dynamic> json) => 
      _$PackageInclusionFromJson(json);
}

@freezed
class PackageExclusion with _$PackageExclusion {
  const factory PackageExclusion({
    required String id,
    required String title,
    String? description,
    double? estimatedCost,
  }) = _PackageExclusion;

  factory PackageExclusion.fromJson(Map<String, dynamic> json) => 
      _$PackageExclusionFromJson(json);
}

@freezed
class PackageItineraryDay with _$PackageItineraryDay {
  const factory PackageItineraryDay({
    required int day,
    required String title,
    required String description,
    @Default([]) List<PackageActivity> activities,
    @Default([]) List<MediaItem> images,
    String? accommodation,
    @Default([]) List<String> meals,
    String? transportation,
  }) = _PackageItineraryDay;

  factory PackageItineraryDay.fromJson(Map<String, dynamic> json) => 
      _$PackageItineraryDayFromJson(json);
}

@freezed
class PackageActivity with _$PackageActivity {
  const factory PackageActivity({
    required String id,
    required String title,
    required TimeOfDay startTime,
    required Duration duration,
    String? description,
    Location? location,
    @Default([]) List<String> highlights,
  }) = _PackageActivity;

  factory PackageActivity.fromJson(Map<String, dynamic> json) => 
      _$PackageActivityFromJson(json);
}

@freezed
class PackageAvailability with _$PackageAvailability {
  const factory PackageAvailability({
    @Default([]) List<DateTime> availableDates,
    @Default([]) List<DateTime> blockedDates,
    @Default(0) int maxBookingsPerDate,
    @Default(0) int minAdvanceBookingDays,
    @Default(365) int maxAdvanceBookingDays,
    @Default([]) List<String> availableDaysOfWeek,
    Map<String, int>? currentBookingCounts,
  }) = _PackageAvailability;

  const PackageAvailability._();

  factory PackageAvailability.fromJson(Map<String, dynamic> json) => 
      _$PackageAvailabilityFromJson(json);

  bool get hasAvailability => availableDates.isNotEmpty || availableDaysOfWeek.isNotEmpty;
  
  bool isAvailable(DateTime date) {
    if (blockedDates.contains(date)) return false;
    
    if (availableDates.isNotEmpty) {
      return availableDates.any((available) => 
          available.year == date.year &&
          available.month == date.month &&
          available.day == date.day);
    }
    
    if (availableDaysOfWeek.isNotEmpty) {
      final dayName = _getDayName(date.weekday);
      return availableDaysOfWeek.contains(dayName);
    }
    
    return true;
  }
  
  String _getDayName(int weekday) {
    const days = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
      'Friday', 'Saturday', 'Sunday'
    ];
    return days[weekday - 1];
  }
}

@freezed
class PackageRules with _$PackageRules {
  const factory PackageRules({
    String? cancellationPolicy,
    String? refundPolicy,
    @Default(0) int minimumAge,
    @Default(100) int maximumAge,
    @Default(1) int minimumParticipants,
    @Default(50) int maximumParticipants,
    @Default([]) List<String> requirements,
    @Default([]) List<String> restrictions,
    @Default([]) List<String> recommendations,
    Map<String, dynamic>? additionalRules,
  }) = _PackageRules;

  factory PackageRules.fromJson(Map<String, dynamic> json) => 
      _$PackageRulesFromJson(json);
}
```

---

## 🎯 Booking & Reservation Models

### **Booking Models**
```dart
// lib/core/models/booking/booking_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../base_model.dart';

part 'booking_model.freezed.dart';
part 'booking_model.g.dart';

@freezed
class Booking with _$Booking implements BaseModel, Cacheable, Validatable {
  const factory Booking({
    required String id,
    required String userId,
    required String packageId,
    required BookingStatus status,
    required BookingDetails details,
    required PaymentInfo payment,
    required DateTime createdAt,
    required DateTime updatedAt,
    String? confirmationCode,
    DateTime? checkInDate,
    DateTime? checkOutDate,
    @Default([]) List<BookingGuest> guests,
    @Default([]) List<BookingAddOn> addOns,
    BookingCancellation? cancellation,
    @Default([]) List<BookingModification> modifications,
    @Default([]) List<BookingNote> notes,
    String? specialRequests,
    Map<String, dynamic>? metadata,
  }) = _Booking;

  const Booking._();

  factory Booking.fromJson(Map<String, dynamic> json) => 
      _$BookingFromJson(json);

  // Cacheable implementation
  @override
  String get cacheKey => 'booking_$id';

  // Validatable implementation
  @override
  ValidationResult validate() {
    final errors = <String>[];
    
    if (guests.isEmpty) {
      errors.add('Booking must have at least one guest');
    }
    
    if (checkInDate != null && checkOutDate != null) {
      if (checkInDate!.isAfter(checkOutDate!)) {
        errors.add('Check-in date must be before check-out date');
      }
    }
    
    if (payment.totalAmount <= 0) {
      errors.add('Total amount must be greater than 0');
    }
    
    // Validate guests
    for (final guest in guests) {
      final guestValidation = guest.validate();
      if (!guestValidation.isValid) {
        errors.addAll(guestValidation.errors);
      }
    }
    
    return errors.isEmpty 
        ? ValidationResult.valid 
        : ValidationResult.invalid(errors);
  }

  // Computed properties
  bool get isPaid => payment.isPaid;
  
  bool get isRefundable => status == BookingStatus.confirmed && 
      cancellation?.deadline != null &&
      DateTime.now().isBefore(cancellation!.deadline!);
  
  bool get isModifiable => status == BookingStatus.confirmed &&
      checkInDate != null &&
      DateTime.now().isBefore(checkInDate!.subtract(const Duration(days: 1)));
  
  bool get isActive => [
    BookingStatus.confirmed,
    BookingStatus.inProgress,
  ].contains(status);
  
  bool get isCompleted => status == BookingStatus.completed;
  
  bool get isCancelled => status == BookingStatus.cancelled;
  
  int get totalGuests => guests.length;
  
  Duration? get duration => checkInDate != null && checkOutDate != null
      ? checkOutDate!.difference(checkInDate!)
      : null;
  
  int get nightCount => duration?.inDays ?? 0;
}

@freezed
class BookingDetails with _$BookingDetails {
  const factory BookingDetails({
    required int adultCount,
    required int childCount,
    required int roomCount,
    String? roomType,
    @Default([]) List<String> specialRequests,
    Map<String, dynamic>? preferences,
  }) = _BookingDetails;

  factory BookingDetails.fromJson(Map<String, dynamic> json) => 
      _$BookingDetailsFromJson(json);
}

@freezed
class BookingGuest with _$BookingGuest implements Validatable {
  const factory BookingGuest({
    required String firstName,
    required String lastName,
    required DateTime dateOfBirth,
    String? email,
    String? phone,
    String? nationality,
    String? passportNumber,
    DateTime? passportExpiry,
    @Default('adult') String type, // adult, child, infant
    Map<String, dynamic>? additionalInfo,
  }) = _BookingGuest;

  const BookingGuest._();

  factory BookingGuest.fromJson(Map<String, dynamic> json) => 
      _$BookingGuestFromJson(json);

  @override
  ValidationResult validate() {
    final errors = <String>[];
    
    if (firstName.isEmpty) {
      errors.add('First name is required');
    }
    
    if (lastName.isEmpty) {
      errors.add('Last name is required');
    }
    
    if (dateOfBirth.isAfter(DateTime.now())) {
      errors.add('Date of birth cannot be in the future');
    }
    
    if (email != null && email!.isNotEmpty && !email!.contains('@')) {
      errors.add('Invalid email address');
    }
    
    return errors.isEmpty 
        ? ValidationResult.valid 
        : ValidationResult.invalid(errors);
  }

  String get fullName => '$firstName $lastName';
  
  int get age {
    final now = DateTime.now();
    int age = now.year - dateOfBirth.year;
    if (now.month < dateOfBirth.month || 
        (now.month == dateOfBirth.month && now.day < dateOfBirth.day)) {
      age--;
    }
    return age;
  }
  
  bool get isChild => age < 18;
  bool get isInfant => age < 2;
}

@freezed
class BookingAddOn with _$BookingAddOn {
  const factory BookingAddOn({
    required String id,
    required String name,
    required double price,
    required int quantity,
    String? description,
  }) = _BookingAddOn;

  factory BookingAddOn.fromJson(Map<String, dynamic> json) => 
      _$BookingAddOnFromJson(json);
  
  double get totalPrice => price * quantity;
}

@freezed
class PaymentInfo with _$PaymentInfo {
  const factory PaymentInfo({
    required double totalAmount,
    required double paidAmount,
    @Default('USD') String currency,
    @Default([]) List<PaymentTransaction> transactions,
    String? paymentMethodId,
    String? billingAddress,
    Map<String, double>? breakdown,
  }) = _PaymentInfo;

  const PaymentInfo._();

  factory PaymentInfo.fromJson(Map<String, dynamic> json) => 
      _$PaymentInfoFromJson(json);

  bool get isPaid => paidAmount >= totalAmount;
  double get remainingAmount => totalAmount - paidAmount;
  bool get isPartiallyPaid => paidAmount > 0 && paidAmount < totalAmount;
}

@freezed
class PaymentTransaction with _$PaymentTransaction {
  const factory PaymentTransaction({
    required String id,
    required double amount,
    required PaymentMethod method,
    required PaymentStatus status,
    required DateTime createdAt,
    String? transactionId,
    String? reference,
    String? gatewayResponse,
    DateTime? processedAt,
    String? failureReason,
  }) = _PaymentTransaction;

  factory PaymentTransaction.fromJson(Map<String, dynamic> json) => 
      _$PaymentTransactionFromJson(json);
}

enum PaymentStatus {
  pending('pending', 'Pending'),
  processing('processing', 'Processing'),
  completed('completed', 'Completed'),
  failed('failed', 'Failed'),
  cancelled('cancelled', 'Cancelled'),
  refunded('refunded', 'Refunded');

  const PaymentStatus(this.value, this.displayName);
  
  final String value;
  final String displayName;
}

@freezed
class BookingCancellation with _$BookingCancellation {
  const factory BookingCancellation({
    required DateTime requestedAt,
    required String reason,
    DateTime? deadline,
    double? refundAmount,
    double? cancellationFee,
    String? policy,
    String? processedBy,
    DateTime? processedAt,
  }) = _BookingCancellation;

  factory BookingCancellation.fromJson(Map<String, dynamic> json) => 
      _$BookingCancellationFromJson(json);
}

@freezed
class BookingModification with _$BookingModification {
  const factory BookingModification({
    required String id,
    required DateTime requestedAt,
    required String type, // date_change, guest_change, room_change, etc.
    required Map<String, dynamic> oldValues,
    required Map<String, dynamic> newValues,
    double? additionalCost,
    String? reason,
    String? status,
    DateTime? approvedAt,
    String? approvedBy,
  }) = _BookingModification;

  factory BookingModification.fromJson(Map<String, dynamic> json) => 
      _$BookingModificationFromJson(json);
}

@freezed
class BookingNote with _$BookingNote {
  const factory BookingNote({
    required String id,
    required String content,
    required String authorId,
    required DateTime createdAt,
    @Default(false) bool isInternal,
    @Default(false) bool isImportant,
  }) = _BookingNote;

  factory BookingNote.fromJson(Map<String, dynamic> json) => 
      _$BookingNoteFromJson(json);
}
```

---

## 🔍 Search & Discovery Models

### **Search Models**
```dart
// lib/core/models/search/search_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'search_model.freezed.dart';
part 'search_model.g.dart';

@freezed
class SearchFilters with _$SearchFilters {
  const factory SearchFilters({
    @Default('') String query,
    @Default('all') String category, // all, hotels, tours, packages
    @Default('') String location,
    @Default('') String destination,
    @Default('') String duration,
    @Default([0, 5000]) List<double> priceRange,
    @Default(0.0) double minRating,
    @Default([]) List<String> experienceType,
    @Default([]) List<String> amenities,
    @Default([]) List<String> propertyTypes,
    @Default([]) List<String> tourTypes,
    @Default([]) List<String> packageTypes,
    DateTime? checkInDate,
    DateTime? checkOutDate,
    @Default(2) int adultCount,
    @Default(0) int childCount,
    @Default(1) int roomCount,
    @Default('relevance') String sortBy, // relevance, price_low, price_high, rating, distance
    @Default(false) bool verifiedOnly,
    @Default(false) bool featuredOnly,
    @Default(false) bool instantBooking,
    @Default(false) bool freeCancellation,
    Map<String, dynamic>? advancedFilters,
  }) = _SearchFilters;

  const SearchFilters._();

  factory SearchFilters.fromJson(Map<String, dynamic> json) => 
      _$SearchFiltersFromJson(json);

  bool get hasActiveFilters => 
      query.isNotEmpty ||
      category != 'all' ||
      location.isNotEmpty ||
      destination.isNotEmpty ||
      duration.isNotEmpty ||
      priceRange[0] > 0 ||
      priceRange[1] < 5000 ||
      minRating > 0 ||
      experienceType.isNotEmpty ||
      amenities.isNotEmpty ||
      propertyTypes.isNotEmpty ||
      tourTypes.isNotEmpty ||
      packageTypes.isNotEmpty ||
      checkInDate != null ||
      checkOutDate != null ||
      adultCount != 2 ||
      childCount != 0 ||
      roomCount != 1 ||
      verifiedOnly ||
      featuredOnly ||
      instantBooking ||
      freeCancellation;

  int get filterCount {
    int count = 0;
    if (query.isNotEmpty) count++;
    if (category != 'all') count++;
    if (location.isNotEmpty) count++;
    if (destination.isNotEmpty) count++;
    if (duration.isNotEmpty) count++;
    if (priceRange[0] > 0 || priceRange[1] < 5000) count++;
    if (minRating > 0) count++;
    if (experienceType.isNotEmpty) count++;
    if (amenities.isNotEmpty) count++;
    if (propertyTypes.isNotEmpty) count++;
    if (tourTypes.isNotEmpty) count++;
    if (packageTypes.isNotEmpty) count++;
    if (checkInDate != null) count++;
    if (checkOutDate != null) count++;
    if (adultCount != 2) count++;
    if (childCount != 0) count++;
    if (roomCount != 1) count++;
    if (verifiedOnly) count++;
    if (featuredOnly) count++;
    if (instantBooking) count++;
    if (freeCancellation) count++;
    return count;
  }
}

@freezed
class SearchResults<T> with _$SearchResults<T> {
  const factory SearchResults({
    @Default([]) List<T> items,
    @Default(0) int totalCount,
    @Default(0) int page,
    @Default(20) int pageSize,
    @Default(0) int totalPages,
    @Default(false) bool hasNextPage,
    @Default(false) bool hasPreviousPage,
    SearchMetadata? metadata,
    @Default([]) List<SearchSuggestion> suggestions,
    @Default([]) List<SearchFacet> facets,
    Duration? searchTime,
  }) = _SearchResults<T>;

  const SearchResults._();

  factory SearchResults.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) => _$SearchResultsFromJson(json, fromJsonT);

  bool get isEmpty => items.isEmpty;
  bool get isNotEmpty => items.isNotEmpty;
  int get itemCount => items.length;
}

@freezed
class SearchMetadata with _$SearchMetadata {
  const factory SearchMetadata({
    @Default({}) Map<String, int> categoryCounts,
    @Default({}) Map<String, int> locationCounts,
    @Default([]) List<double> priceDistribution,
    @Default([]) List<double> ratingDistribution,
    double? averagePrice,
    double? averageRating,
    @Default([]) List<String> popularDestinations,
    @Default([]) List<String> popularAmenities,
  }) = _SearchMetadata;

  factory SearchMetadata.fromJson(Map<String, dynamic> json) => 
      _$SearchMetadataFromJson(json);
}

@freezed
class SearchSuggestion with _$SearchSuggestion {
  const factory SearchSuggestion({
    required String id,
    required String text,
    required String type, // query, location, destination, property, tour
    String? subtitle,
    String? imageUrl,
    Map<String, dynamic>? metadata,
  }) = _SearchSuggestion;

  factory SearchSuggestion.fromJson(Map<String, dynamic> json) => 
      _$SearchSuggestionFromJson(json);
}

@freezed
class SearchFacet with _$SearchFacet {
  const factory SearchFacet({
    required String name,
    required String displayName,
    required String type, // checkbox, range, select
    @Default([]) List<SearchFacetOption> options,
    Map<String, dynamic>? config,
  }) = _SearchFacet;

  factory SearchFacet.fromJson(Map<String, dynamic> json) => 
      _$SearchFacetFromJson(json);
}

@freezed
class SearchFacetOption with _$SearchFacetOption {
  const factory SearchFacetOption({
    required String value,
    required String label,
    required int count,
    @Default(false) bool isSelected,
  }) = _SearchFacetOption;

  factory SearchFacetOption.fromJson(Map<String, dynamic> json) => 
      _$SearchFacetOptionFromJson(json);
}

@freezed
class SearchHistory with _$SearchHistory {
  const factory SearchHistory({
    required String id,
    required String query,
    required SearchFilters filters,
    required DateTime searchedAt,
    @Default(0) int resultCount,
    @Default(1) int frequency,
    Map<String, dynamic>? metadata,
  }) = _SearchHistory;

  factory SearchHistory.fromJson(Map<String, dynamic> json) => 
      _$SearchHistoryFromJson(json);
}

@freezed
class SavedSearch with _$SavedSearch {
  const factory SavedSearch({
    required String id,
    required String name,
    required SearchFilters filters,
    required DateTime createdAt,
    DateTime? lastNotificationAt,
    @Default(true) bool notificationsEnabled,
    @Default(0) int newResultsCount,
  }) = _SavedSearch;

  factory SavedSearch.fromJson(Map<String, dynamic> json) => 
      _$SavedSearchFromJson(json);
}
```

---

## 📍 Location & Geography Models

### **Location Models**
```dart
// lib/core/models/location/location_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../base_model.dart';

part 'location_model.freezed.dart';
part 'location_model.g.dart';

@freezed
class Location with _$Location implements Validatable {
  const factory Location({
    required double latitude,
    required double longitude,
    required String address,
    required String city,
    required String country,
    String? state,
    String? postalCode,
    String? district,
    String? landmark,
    @Default('') String formattedAddress,
    LocationType? type,
    @Default([]) List<String> tags,
    Map<String, dynamic>? metadata,
  }) = _Location;

  const Location._();

  factory Location.fromJson(Map<String, dynamic> json) => 
      _$LocationFromJson(json);

  @override
  ValidationResult validate() {
    final errors = <String>[];
    
    if (latitude < -90 || latitude > 90) {
      errors.add('Invalid latitude value');
    }
    
    if (longitude < -180 || longitude > 180) {
      errors.add('Invalid longitude value');
    }
    
    if (address.isEmpty) {
      errors.add('Address is required');
    }
    
    if (city.isEmpty) {
      errors.add('City is required');
    }
    
    if (country.isEmpty) {
      errors.add('Country is required');
    }
    
    return errors.isEmpty 
        ? ValidationResult.valid 
        : ValidationResult.invalid(errors);
  }

  String get displayAddress => formattedAddress.isNotEmpty 
      ? formattedAddress 
      : [address, city, state, country].where((s) => s?.isNotEmpty == true).join(', ');

  String get shortAddress => '$city, $country';
  
  String get coordinates => '${latitude.toStringAsFixed(6)}, ${longitude.toStringAsFixed(6)}';
}

enum LocationType {
  hotel('hotel', 'Hotel'),
  restaurant('restaurant', 'Restaurant'),
  attraction('attraction', 'Attraction'),
  airport('airport', 'Airport'),
  trainStation('train_station', 'Train Station'),
  busStation('bus_station', 'Bus Station'),
  landmark('landmark', 'Landmark'),
  beach('beach', 'Beach'),
  mountain('mountain', 'Mountain'),
  park('park', 'Park'),
  museum('museum', 'Museum'),
  temple('temple', 'Temple'),
  shopping('shopping', 'Shopping'),
  market('market', 'Market');

  const LocationType(this.value, this.displayName);
  
  final String value;
  final String displayName;
}

@freezed
class Region with _$Region {
  const factory Region({
    required String id,
    required String name,
    required String code,
    required RegionType type,
    String? parentId,
    @Default([]) List<Location> majorCities,
    @Default([]) List<String> languages,
    @Default([]) List<String> currencies,
    String? timezone,
    String? imageUrl,
    String? description,
    Map<String, dynamic>? metadata,
  }) = _Region;

  factory Region.fromJson(Map<String, dynamic> json) => _$RegionFromJson(json);
}

enum RegionType {
  continent('continent', 'Continent'),
  country('country', 'Country'),
  state('state', 'State'),
  city('city', 'City'),
  district('district', 'District');

  const RegionType(this.value, this.displayName);
  
  final String value;
  final String displayName;
}

@freezed
class Destination with _$Destination implements BaseModel, Cacheable, Searchable {
  const factory Destination({
    required String id,
    required String name,
    required Location location,
    required DateTime createdAt,
    required DateTime updatedAt,
    String? description,
    String? imageUrl,
    @Default([]) List<String> highlights,
    @Default([]) List<String> tags,
    @Default(0.0) double popularityScore,
    @Default(0) int visitorCount,
    @Default([]) List<String> bestTimeToVisit,
    @Default([]) List<String> activities,
    DestinationWeather? weather,
    Map<String, dynamic>? travelInfo,
  }) = _Destination;

  const Destination._();

  factory Destination.fromJson(Map<String, dynamic> json) => 
      _$DestinationFromJson(json);

  // Cacheable implementation
  @override
  String get cacheKey => 'destination_$id';

  // Searchable implementation
  @override
  List<String> get searchableFields => [
    'name', 'description', 'highlights', 'tags', 'activities'
  ];

  @override
  String get searchableText => [
    name,
    description ?? '',
    location.city,
    location.country,
    ...highlights,
    ...tags,
    ...activities,
  ].join(' ').toLowerCase();

  @override
  Map<String, dynamic> get searchFilters => {
    'city': location.city,
    'country': location.country,
    'popularityScore': popularityScore,
    'tags': tags,
    'activities': activities,
  };
}

@freezed
class DestinationWeather with _$DestinationWeather {
  const factory DestinationWeather({
    @Default(25.0) double averageTemperature,
    @Default('celsius') String temperatureUnit,
    @Default([]) List<String> seasons,
    @Default([]) List<MonthlyWeather> monthlyData,
    String? bestVisitingTime,
  }) = _DestinationWeather;

  factory DestinationWeather.fromJson(Map<String, dynamic> json) => 
      _$DestinationWeatherFromJson(json);
}

@freezed
class MonthlyWeather with _$MonthlyWeather {
  const factory MonthlyWeather({
    required int month,
    required double averageHigh,
    required double averageLow,
    required int rainyDays,
    required String description,
  }) = _MonthlyWeather;

  factory MonthlyWeather.fromJson(Map<String, dynamic> json) => 
      _$MonthlyWeatherFromJson(json);
}
```

---

## 📱 Media & Assets Models

### **Media Models**
```dart
// lib/core/models/media/media_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'media_model.freezed.dart';
part 'media_model.g.dart';

@freezed
class MediaItem with _$MediaItem {
  const factory MediaItem({
    required String id,
    required String url,
    required MediaType type,
    String? thumbnailUrl,
    String? title,
    String? description,
    String? altText,
    @Default(0) int order,
    @Default(true) bool isActive,
    MediaMetadata? metadata,
    DateTime? uploadedAt,
    String? uploadedBy,
  }) = _MediaItem;

  factory MediaItem.fromJson(Map<String, dynamic> json) => 
      _$MediaItemFromJson(json);
}

enum MediaType {
  image('image', 'Image'),
  video('video', 'Video'),
  panorama('panorama', '360° Panorama'),
  virtualTour('virtual_tour', 'Virtual Tour'),
  audio('audio', 'Audio'),
  document('document', 'Document');

  const MediaType(this.value, this.displayName);
  
  final String value;
  final String displayName;
}

@freezed
class MediaMetadata with _$MediaMetadata {
  const factory MediaMetadata({
    int? width,
    int? height,
    int? fileSize,
    String? format,
    Duration? duration,
    String? resolution,
    @Default([]) List<String> tags,
    Location? location,
    DateTime? capturedAt,
    String? camera,
    Map<String, dynamic>? exifData,
  }) = _MediaMetadata;

  factory MediaMetadata.fromJson(Map<String, dynamic> json) => 
      _$MediaMetadataFromJson(json);
}

@freezed
class MediaUpload with _$MediaUpload {
  const factory MediaUpload({
    required String id,
    required String filename,
    required MediaType type,
    required int fileSize,
    required UploadStatus status,
    @Default(0.0) double progress,
    String? error,
    String? finalUrl,
    DateTime? startedAt,
    DateTime? completedAt,
  }) = _MediaUpload;

  factory MediaUpload.fromJson(Map<String, dynamic> json) => 
      _$MediaUploadFromJson(json);
}

enum UploadStatus {
  pending('pending', 'Pending'),
  uploading('uploading', 'Uploading'),
  processing('processing', 'Processing'),
  completed('completed', 'Completed'),
  failed('failed', 'Failed'),
  cancelled('cancelled', 'Cancelled');

  const UploadStatus(this.value, this.displayName);
  
  final String value;
  final String displayName;
}
```

---

## ⭐ Review & Rating Models

### **Review Models**
```dart
// lib/core/models/review/review_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../base_model.dart';
import '../media/media_model.dart';

part 'review_model.freezed.dart';
part 'review_model.g.dart';

@freezed
class Review with _$Review implements BaseModel, Cacheable, Validatable {
  const factory Review({
    required String id,
    required String userId,
    required String itemId,
    required ReviewType itemType,
    required double rating,
    required String title,
    required String content,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Default([]) List<MediaItem> images,
    @Default([]) List<ReviewRating> detailedRatings,
    @Default([]) List<String> pros,
    @Default([]) List<String> cons,
    @Default([]) List<String> tags,
    String? visitDate,
    String? travelType,
    @Default(0) int helpfulCount,
    @Default(0) int unhelpfulCount,
    @Default(false) bool isVerified,
    @Default(false) bool isAnonymous,
    ReviewResponse? response,
    String? bookingId,
    Map<String, dynamic>? metadata,
  }) = _Review;

  const Review._();

  factory Review.fromJson(Map<String, dynamic> json) => _$ReviewFromJson(json);

  // Cacheable implementation
  @override
  String get cacheKey => 'review_$id';

  // Validatable implementation
  @override
  ValidationResult validate() {
    final errors = <String>[];
    
    if (rating < 1 || rating > 5) {
      errors.add('Rating must be between 1 and 5');
    }
    
    if (title.isEmpty || title.length < 5) {
      errors.add('Review title must be at least 5 characters');
    }
    
    if (content.isEmpty || content.length < 10) {
      errors.add('Review content must be at least 10 characters');
    }
    
    return errors.isEmpty 
        ? ValidationResult.valid 
        : ValidationResult.invalid(errors);
  }

  // Computed properties
  bool get hasImages => images.isNotEmpty;
  
  bool get hasDetailedRatings => detailedRatings.isNotEmpty;
  
  bool get hasResponse => response != null;
  
  int get totalVotes => helpfulCount + unhelpfulCount;
  
  double get helpfulPercentage => totalVotes > 0 ? helpfulCount / totalVotes : 0.0;
  
  String get ratingText {
    switch (rating.round()) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Unknown';
    }
  }
  
  String get shortContent => content.length > 150
      ? '${content.substring(0, 150)}...'
      : content;
}

enum ReviewType {
  property('property', 'Property'),
  tour('tour', 'Tour'),
  package('package', 'Package'),
  guide('guide', 'Guide'),
  operator('operator', 'Operator');

  const ReviewType(this.value, this.displayName);
  
  final String value;
  final String displayName;
}

@freezed
class ReviewRating with _$ReviewRating {
  const factory ReviewRating({
    required String category,
    required double rating,
    String? description,
  }) = _ReviewRating;

  factory ReviewRating.fromJson(Map<String, dynamic> json) => 
      _$ReviewRatingFromJson(json);
}

@freezed
class ReviewResponse with _$ReviewResponse {
  const factory ReviewResponse({
    required String id,
    required String content,
    required String authorId,
    required DateTime createdAt,
    String? authorName,
    String? authorRole,
  }) = _ReviewResponse;

  factory ReviewResponse.fromJson(Map<String, dynamic> json) => 
      _$ReviewResponseFromJson(json);
}

@freezed
class ReviewSummary with _$ReviewSummary {
  const factory ReviewSummary({
    @Default(0.0) double averageRating,
    @Default(0) int totalReviews,
    @Default([]) List<RatingDistribution> ratingDistribution,
    @Default([]) List<CategoryRating> categoryRatings,
    @Default([]) List<String> topMentions,
    @Default([]) List<String> commonComplaints,
    DateTime? lastReviewDate,
  }) = _ReviewSummary;

  factory ReviewSummary.fromJson(Map<String, dynamic> json) => 
      _$ReviewSummaryFromJson(json);
}

@freezed
class RatingDistribution with _$RatingDistribution {
  const factory RatingDistribution({
    required int rating,
    required int count,
    required double percentage,
  }) = _RatingDistribution;

  factory RatingDistribution.fromJson(Map<String, dynamic> json) => 
      _$RatingDistributionFromJson(json);
}

@freezed
class CategoryRating with _$CategoryRating {
  const factory CategoryRating({
    required String category,
    required double rating,
    required int count,
  }) = _CategoryRating;

  factory CategoryRating.fromJson(Map<String, dynamic> json) => 
      _$CategoryRatingFromJson(json);
}
```

---

## 🏗️ Navigation & UI State Models

### **Navigation Models**
```dart
// lib/core/models/navigation/navigation_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'navigation_model.freezed.dart';
part 'navigation_model.g.dart';

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
    @Default([]) List<String> navigationHistory,
    Map<String, dynamic>? screenData,
  }) = _NavigationState;

  factory NavigationState.fromJson(Map<String, dynamic> json) => 
      _$NavigationStateFromJson(json);
}

@freezed
class DrawerItem with _$DrawerItem {
  const factory DrawerItem({
    required String id,
    required String title,
    required String icon,
    String? route,
    @Default([]) List<DrawerItem> children,
    @Default(false) bool isVisible,
    @Default(false) bool requiresVerification,
    @Default([]) List<UserRole> allowedRoles,
    String? badge,
    Map<String, dynamic>? metadata,
  }) = _DrawerItem;

  factory DrawerItem.fromJson(Map<String, dynamic> json) => 
      _$DrawerItemFromJson(json);
}

@freezed
class TabItem with _$TabItem {
  const factory TabItem({
    required String id,
    required String title,
    required String icon,
    required String activeIcon,
    String? route,
    @Default(false) bool showBadge,
    String? badgeText,
    @Default(true) bool isEnabled,
  }) = _TabItem;

  factory TabItem.fromJson(Map<String, dynamic> json) => 
      _$TabItemFromJson(json);
}

@freezed
class QuickAction with _$QuickAction {
  const factory QuickAction({
    required String id,
    required String title,
    required String icon,
    String? description,
    String? route,
    @Default([]) List<UserRole> allowedRoles,
    @Default(true) bool isEnabled,
    String? color,
  }) = _QuickAction;

  factory QuickAction.fromJson(Map<String, dynamic> json) => 
      _$QuickActionFromJson(json);
}
```

### **App State Models**
```dart
// lib/core/models/app/app_state_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'app_state_model.freezed.dart';
part 'app_state_model.g.dart';

@freezed
class AppState with _$AppState {
  const factory AppState({
    @Default(false) bool isInitialized,
    @Default(false) bool isLoading,
    @Default(false) bool isOnline,
    @Default(ThemeMode.system) ThemeMode themeMode,
    @Default('en') String locale,
    String? version,
    String? buildNumber,
    @Default({}) Map<String, dynamic> featureFlags,
    @Default({}) Map<String, dynamic> config,
    DateTime? lastSync,
    String? error,
  }) = _AppState;

  factory AppState.fromJson(Map<String, dynamic> json) => 
      _$AppStateFromJson(json);
}

@freezed
class DeviceInfo with _$DeviceInfo {
  const factory DeviceInfo({
    required String deviceId,
    required String platform,
    required String version,
    String? model,
    String? manufacturer,
    @Default(false) bool isPhysicalDevice,
    @Default(false) bool isEmulator,
    Map<String, dynamic>? additionalInfo,
  }) = _DeviceInfo;

  factory DeviceInfo.fromJson(Map<String, dynamic> json) => 
      _$DeviceInfoFromJson(json);
}

@freezed
class NotificationSettings with _$NotificationSettings {
  const factory NotificationSettings({
    @Default(true) bool pushEnabled,
    @Default(true) bool emailEnabled,
    @Default(false) bool smsEnabled,
    @Default(true) bool bookingUpdates,
    @Default(true) bool promotionalOffers,
    @Default(false) bool priceAlerts,
    @Default(true) bool reviewReminders,
    @Default([]) List<String> categories,
    @Default({}) Map<String, bool> customSettings,
  }) = _NotificationSettings;

  factory NotificationSettings.fromJson(Map<String, dynamic> json) => 
      _$NotificationSettingsFromJson(json);
}
```

---

## 🔧 API Response Models

### **API Response Wrappers**
```dart
// lib/core/models/api/api_response_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'api_response_model.freezed.dart';
part 'api_response_model.g.dart';

@freezed
class ApiResponse<T> with _$ApiResponse<T> {
  const factory ApiResponse({
    required bool success,
    T? data,
    String? message,
    String? error,
    @Default({}) Map<String, dynamic> metadata,
    int? statusCode,
    DateTime? timestamp,
  }) = _ApiResponse<T>;

  const ApiResponse._();

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) => _$ApiResponseFromJson(json, fromJsonT);

  static ApiResponse<T> success<T>(T data, {String? message}) {
    return ApiResponse(
      success: true,
      data: data,
      message: message,
      timestamp: DateTime.now(),
    );
  }

  static ApiResponse<T> error<T>(String error, {int? statusCode}) {
    return ApiResponse(
      success: false,
      error: error,
      statusCode: statusCode,
      timestamp: DateTime.now(),
    );
  }
}

@freezed
class PaginatedResponse<T> with _$PaginatedResponse<T> {
  const factory PaginatedResponse({
    @Default([]) List<T> data,
    @Default(0) int total,
    @Default(1) int page,
    @Default(20) int limit,
    @Default(0) int totalPages,
    @Default(false) bool hasNext,
    @Default(false) bool hasPrevious,
  }) = _PaginatedResponse<T>;

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) => _$PaginatedResponseFromJson(json, fromJsonT);
}

@freezed
class ErrorDetail with _$ErrorDetail {
  const factory ErrorDetail({
    required String code,
    required String message,
    String? field,
    Map<String, dynamic>? details,
  }) = _ErrorDetail;

  factory ErrorDetail.fromJson(Map<String, dynamic> json) => 
      _$ErrorDetailFromJson(json);
}
```

---

## 🔧 Model Utilities & Extensions

### **Model Extensions**
```dart
// lib/core/models/extensions/model_extensions.dart

extension UserExtensions on User {
  bool canManageProperty(String propertyId) {
    return role == UserRole.hotelManager && 
           isVerified && 
           // Additional property ownership checks
           true;
  }
  
  bool canCreateTour() {
    return role == UserRole.tourOperator && 
           isVerified && 
           verification?.status == VerificationStatus.verified;
  }
  
  bool canMakeBooking() {
    return role == UserRole.traveler && 
           isEmailVerified;
  }
}

extension BookingExtensions on Booking {
  bool canCancel() {
    return isActive && 
           checkInDate != null &&
           DateTime.now().isBefore(checkInDate!.subtract(const Duration(hours: 24)));
  }
  
  bool canModify() {
    return isActive && 
           checkInDate != null &&
           DateTime.now().isBefore(checkInDate!.subtract(const Duration(days: 3)));
  }
  
  bool canReview() {
    return status == BookingStatus.completed && 
           DateTime.now().isAfter(updatedAt.add(const Duration(hours: 24)));
  }
}

extension PackageExtensions on Package {
  double calculateDiscountedPrice(int participants) {
    double baseTotal = pricing.basePrice * participants;
    
    if (hasDiscount) {
      baseTotal = baseTotal * (1 - pricing.discountPercentage / 100);
    }
    
    // Apply tiered pricing if applicable
    final applicableTier = pricing.tiers.where((tier) => 
      participants >= tier.minParticipants && 
      participants <= tier.maxParticipants
    ).firstOrNull;
    
    if (applicableTier != null) {
      baseTotal = applicableTier.price * participants;
    }
    
    return baseTotal;
  }
}

extension LocationExtensions on Location {
  double distanceTo(Location other) {
    // Haversine formula implementation
    const double earthRadius = 6371; // km
    
    final double lat1Rad = latitude * (math.pi / 180);
    final double lat2Rad = other.latitude * (math.pi / 180);
    final double deltaLatRad = (other.latitude - latitude) * (math.pi / 180);
    final double deltaLngRad = (other.longitude - longitude) * (math.pi / 180);
    
    final double a = math.sin(deltaLatRad / 2) * math.sin(deltaLatRad / 2) +
        math.cos(lat1Rad) * math.cos(lat2Rad) *
        math.sin(deltaLngRad / 2) * math.sin(deltaLngRad / 2);
    
    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    
    return earthRadius * c;
  }
}
```

### **Model Factories**
```dart
// lib/core/models/factories/model_factories.dart

class ModelFactories {
  static User createTraveler({
    required String email,
    required String name,
    String? phone,
  }) {
    return User(
      id: _generateId(),
      email: email,
      name: name,
      phone: phone,
      role: UserRole.traveler,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      preferences: const UserPreferences(),
      stats: const UserStats(),
    );
  }
  
  static Property createHotel({
    required String ownerId,
    required String name,
    required Location location,
    PropertyType type = PropertyType.hotel,
  }) {
    return Property(
      id: _generateId(),
      ownerId: ownerId,
      name: name,
      type: type,
      location: location,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      rules: const PropertyRules(),
    );
  }
  
  static Tour createCityTour({
    required String operatorId,
    required String title,
    required Location location,
    required Duration duration,
    required double price,
  }) {
    return Tour(
      id: _generateId(),
      operatorId: operatorId,
      title: title,
      type: TourType.cityTour,
      location: location,
      duration: duration,
      price: price,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      languages: ['English'],
      policies: const TourPolicies(),
    );
  }
  
  static Booking createBooking({
    required String userId,
    required String packageId,
    required BookingDetails details,
    required double totalAmount,
  }) {
    return Booking(
      id: _generateId(),
      userId: userId,
      packageId: packageId,
      status: BookingStatus.pending,
      details: details,
      payment: PaymentInfo(
        totalAmount: totalAmount,
        paidAmount: 0.0,
      ),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      confirmationCode: _generateConfirmationCode(),
    );
  }
  
  static String _generateId() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }
  
  static String _generateConfirmationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = math.Random();
    return String.fromCharCodes(Iterable.generate(
      8, (_) => chars.codeUnitAt(random.nextInt(chars.length))
    ));
  }
}
```

---

## 🔍 Migration Checklist

### **✅ Core Data Models**
- [ ] Implement base model interfaces and mixins
- [ ] Create comprehensive enum definitions
- [ ] Set up Freezed code generation
- [ ] Implement validation system
- [ ] Create model factory patterns

### **✅ User & Authentication**
- [ ] Define user models with role-based properties
- [ ] Implement authentication state management
- [ ] Create verification and preferences models
- [ ] Set up user statistics tracking
- [ ] Add profile completion calculations

### **✅ Business Models**
- [ ] Create property and hotel models with rooms
- [ ] Implement tour and experience models
- [ ] Define package system with pricing tiers
- [ ] Create booking flow models
- [ ] Add review and rating systems

### **✅ Search & Discovery**
- [ ] Implement comprehensive search filters
- [ ] Create search results with pagination
- [ ] Add search suggestions and facets
- [ ] Implement search history and saved searches
- [ ] Create location and destination models

### **✅ Supporting Models**
- [ ] Define media and asset management
- [ ] Create API response wrappers
- [ ] Implement navigation state models
- [ ] Add app configuration models
- [ ] Create utility extensions and factories

### **✅ Integration & Testing**
- [ ] Set up JSON serialization
- [ ] Implement caching strategies
- [ ] Create model validation tests
- [ ] Test serialization/deserialization
- [ ] Verify state management integration

---

## 🔍 Next Steps

1. **Implement core component architecture** (`07_core_components.md`)
2. **Define API integration layer** (`08_api_integration.md`)
3. **Create animation system** (`09_animation_system.md`)
4. **Build role-specific features** (`10_role_features.md`)
5. **Implement offline capabilities** (`11_offline_system.md`)

---

*This comprehensive Flutter data model system provides type-safe, serializable, and validatable models that preserve all sophisticated features from the React TypeScript implementation while leveraging Flutter's performance benefits and Dart's strong typing system.*