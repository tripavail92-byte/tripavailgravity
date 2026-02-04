// Export all property type icons for easy importing
export 'base/property_icon_base.dart';
export 'hotel_icon.dart';
export 'boutique_icon.dart';
export 'resort_icon.dart';
export 'motel_icon.dart';
export 'lodge_icon.dart';
export 'inn_icon.dart';
export 'guesthouse_icon.dart';
export 'hostel_icon.dart';

import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/hotel_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/boutique_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/resort_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/motel_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/lodge_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/inn_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/guesthouse_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/hostel_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/base/property_icon_base.dart';
import 'package:tripavail/utils/app_labels.dart';

/// Property type enumeration
enum PropertyType {
  hotel,
  boutique,
  resort,
  motel,
  lodge,
  inn,
  guesthouse,
  hostel,
}

/// Helper class to get property type icons and labels
class PropertyTypeIcons {
  /// Get the appropriate icon widget for a property type
  static PropertyIconBase getIcon({
    required PropertyType type,
    double size = 80.0,
    bool isSelected = false,
  }) {
    switch (type) {
      case PropertyType.hotel:
        return HotelIcon(size: size, isSelected: isSelected);
      case PropertyType.boutique:
        return BoutiqueIcon(size: size, isSelected: isSelected);
      case PropertyType.resort:
        return ResortIcon(size: size, isSelected: isSelected);
      case PropertyType.motel:
        return MotelIcon(size: size, isSelected: isSelected);
      case PropertyType.lodge:
        return LodgeIcon(size: size, isSelected: isSelected);
      case PropertyType.inn:
        return InnIcon(size: size, isSelected: isSelected);
      case PropertyType.guesthouse:
        return GuesthouseIcon(size: size, isSelected: isSelected);
      case PropertyType.hostel:
        return HostelIcon(size: size, isSelected: isSelected);
    }
  }

  /// Get the display label for a property type
  static String getLabel(PropertyType type) {
    switch (type) {
      case PropertyType.hotel:
        return AppLabels.propertyHotel;
      case PropertyType.boutique:
        return AppLabels.propertyBoutiqueHotel;
      case PropertyType.resort:
        return AppLabels.propertyResort;
      case PropertyType.motel:
        return AppLabels.propertyMotel;
      case PropertyType.lodge:
        return AppLabels.propertyLodge;
      case PropertyType.inn:
        return AppLabels.propertyInn;
      case PropertyType.guesthouse:
        return AppLabels.propertyGuesthouse;
      case PropertyType.hostel:
        return AppLabels.propertyHostel;
    }
  }

  /// Get the description for a property type
  static String getDescription(PropertyType type) {
    switch (type) {
      case PropertyType.hotel:
        return AppLabels.propertyHotelDesc;
      case PropertyType.boutique:
        return AppLabels.propertyBoutiqueHotelDesc;
      case PropertyType.resort:
        return AppLabels.propertyResortDesc;
      case PropertyType.motel:
        return AppLabels.propertyMotelDesc;
      case PropertyType.lodge:
        return AppLabels.propertyLodgeDesc;
      case PropertyType.inn:
        return AppLabels.propertyInnDesc;
      case PropertyType.guesthouse:
        return AppLabels.propertyGuesthouseDesc;
      case PropertyType.hostel:
        return AppLabels.propertyHostelDesc;
    }
  }

  /// Get all available property types
  static List<PropertyType> get allTypes => PropertyType.values;

  /// Get a property type from string
  static PropertyType? fromString(String value) {
    try {
      return PropertyType.values.firstWhere(
        (type) => type.name.toLowerCase() == value.toLowerCase(),
      );
    } catch (_) {
      return null;
    }
  }
}
