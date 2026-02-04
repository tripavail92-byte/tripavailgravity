import 'package:tripavail/features/hotel_manager/data/models/amenity_category.dart';

/// Single amenity model with animation support
class Amenity {
  final String id;
  final String name;
  final AmenityCategory category;
  final String iconName;
  final bool hasAnimation; // Flag for Phase 2: Lottie animations
  final String? searchKeywords; // Additional search terms

  const Amenity({
    required this.id,
    required this.name,
    required this.category,
    required this.iconName,
    this.hasAnimation = false,
    this.searchKeywords,
  });

  /// Check if amenity matches search query
  bool matchesSearch(String query) {
    if (query.isEmpty) return true;
    
    final lowerQuery = query.toLowerCase();
    final lowerName = name.toLowerCase();
    final lowerKeywords = searchKeywords?.toLowerCase() ?? '';
    
    return lowerName.contains(lowerQuery) || 
           lowerKeywords.contains(lowerQuery);
  }

  /// Get asset path for icon (Lottie or SVG)
  String get iconAsset {
    if (hasAnimation) {
      return 'assets/lottie/amenities/$iconName.json';
    }
    return 'assets/icons/amenities/$iconName.svg';
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Amenity &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
