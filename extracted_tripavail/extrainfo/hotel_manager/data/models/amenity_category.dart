/// Amenity categories following Airbnb's organization pattern
enum AmenityCategory {
  standout,
  guestEssentials,
  kitchen,
  bathroom,
  bedroom,
  safety,
  internetOffice,
  outdoor,
}

/// Extension to get display labels for categories
extension AmenityCategoryExtension on AmenityCategory {
  String get label {
    switch (this) {
      case AmenityCategory.standout:
        return 'Standout Amenities';
      case AmenityCategory.guestEssentials:
        return 'Guest Essentials';
      case AmenityCategory.kitchen:
        return 'Kitchen & Dining';
      case AmenityCategory.bathroom:
        return 'Bathroom';
      case AmenityCategory.bedroom:
        return 'Bedroom & Laundry';
      case AmenityCategory.safety:
        return 'Safety & Security';
      case AmenityCategory.internetOffice:
        return 'Internet & Office';
      case AmenityCategory.outdoor:
        return 'Outdoor & Recreation';
    }
  }

  /// Icon identifier for category header
  String get iconName {
    switch (this) {
      case AmenityCategory.standout:
        return 'star';
      case AmenityCategory.guestEssentials:
        return 'essentials';
      case AmenityCategory.kitchen:
        return 'kitchen';
      case AmenityCategory.bathroom:
        return 'bathroom';
      case AmenityCategory.bedroom:
        return 'bedroom';
      case AmenityCategory.safety:
        return 'safety';
      case AmenityCategory.internetOffice:
        return 'wifi';
      case AmenityCategory.outdoor:
        return 'outdoor';
    }
  }
}
