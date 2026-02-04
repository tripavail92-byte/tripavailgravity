import 'package:tripavail/features/hotel_manager/data/models/amenity.dart';
import 'package:tripavail/features/hotel_manager/data/models/amenity_category.dart';

/// Comprehensive amenity data following Airbnb's structure
/// Phase 1: 40+ amenities with static icons
/// Phase 2: Premium amenities marked with hasAnimation: true
class AmenitiesData {
  static final List<Amenity> all = [
    // ========== STANDOUT AMENITIES (Premium features) ==========
    const Amenity(
      id: 'pool',
      name: 'Pool',
      category: AmenityCategory.standout,
      iconName: 'pool',
      hasAnimation: true,
      searchKeywords: 'swimming water swim',
    ),
    const Amenity(
      id: 'hot_tub',
      name: 'Hot Tub',
      category: AmenityCategory.standout,
      iconName: 'hot_tub_clean',
      hasAnimation: true, // Phase 2: Bathtub slide-in with water droplets (cleaned - no white bg)
      searchKeywords: 'jacuzzi spa bath',
    ),
    const Amenity(
      id: 'gym',
      name: 'Gym',
      category: AmenityCategory.standout,
      iconName: 'gym',
      hasAnimation: true,
      searchKeywords: 'fitness workout exercise',
    ),
    const Amenity(
      id: 'ocean_view',
      name: 'Ocean View',
      category: AmenityCategory.standout,
      iconName: 'ocean_view',
      hasAnimation: true, // Phase 2: Wave motion
      searchKeywords: 'sea beach water view',
    ),
    const Amenity(
      id: 'beachfront',
      name: 'Beachfront',
      category: AmenityCategory.standout,
      iconName: 'beachfront',
      hasAnimation: true,
      searchKeywords: 'beach ocean sea sand',
    ),
    const Amenity(
      id: 'bbq_grill',
      name: 'BBQ Grill',
      category: AmenityCategory.standout,
      iconName: 'bbq_grill',
      hasAnimation: true,
      searchKeywords: 'barbecue grill outdoor cooking',
    ),
    const Amenity(
      id: 'fire_pit',
      name: 'Fire Pit',
      category: AmenityCategory.standout,
      iconName: 'fire_pit',
      hasAnimation: true,
      searchKeywords: 'campfire outdoor bonfire',
    ),
    const Amenity(
      id: 'patio',
      name: 'Patio or Balcony',
      category: AmenityCategory.standout,
      iconName: 'patio',
      hasAnimation: true,
      searchKeywords: 'terrace outdoor deck',
    ),

    // ========== GUEST ESSENTIALS ==========
    const Amenity(
      id: 'wifi',
      name: 'WiFi',
      category: AmenityCategory.guestEssentials,
      iconName: 'wifiant',
      hasAnimation: true, // Phase 2: Radio wave animation (Lordicon)
      searchKeywords: 'internet wireless connection',
    ),
    const Amenity(
      id: 'tv',
      name: 'TV',
      category: AmenityCategory.guestEssentials,
      iconName: 'Tv',
      hasAnimation: false,
      searchKeywords: 'television cable streaming',
    ),
    const Amenity(
      id: 'air_conditioning',
      name: 'Air Conditioning',
      category: AmenityCategory.guestEssentials,
      iconName: 'aircondt',
      hasAnimation: true, // Phase 2: Air flow animation
      searchKeywords: 'ac cooling hvac',
    ),
    const Amenity(
      id: 'heating',
      name: 'Heating',
      category: AmenityCategory.guestEssentials,
      iconName: 'heating',
      hasAnimation: true, // Phase 2: Heat wave animation
      searchKeywords: 'heater warm central heating',
    ),
    const Amenity(
      id: 'washer',
      name: 'Washer',
      category: AmenityCategory.guestEssentials,
      iconName: 'washer',
      hasAnimation: false,
      searchKeywords: 'washing machine laundry',
    ),
    // `Dryer` amenity removed per request — no icon or mapping kept.
    const Amenity(
      id: 'parking',
      name: 'Free Parking',
      category: AmenityCategory.guestEssentials,
      iconName: 'parking',
      hasAnimation: false,
      searchKeywords: 'car garage spot',
    ),

    // ========== KITCHEN & DINING ==========
    const Amenity(
      id: 'refrigerator',
      name: 'Refrigerator',
      category: AmenityCategory.kitchen,
      iconName: 'refrigerator',
      hasAnimation: false,
      searchKeywords: 'fridge freezer',
    ),
    const Amenity(
      id: 'microwave',
      name: 'Microwave',
      category: AmenityCategory.kitchen,
      iconName: 'microwave',
      hasAnimation: false,
      searchKeywords: 'oven heating',
    ),
    const Amenity(
      id: 'oven',
      name: 'Oven',
      category: AmenityCategory.kitchen,
      iconName: 'oven',
      hasAnimation: false,
      searchKeywords: 'baking stove',
    ),
    const Amenity(
      id: 'stove',
      name: 'Stove',
      category: AmenityCategory.kitchen,
      iconName: 'stove',
      hasAnimation: false,
      searchKeywords: 'cooktop burner',
    ),
    const Amenity(
      id: 'coffee_maker',
      name: 'Coffee Maker',
      category: AmenityCategory.kitchen,
      iconName: 'coffee_maker',
      hasAnimation: true, // Phase 2: Steam animation
      searchKeywords: 'coffee machine espresso',
    ),
    const Amenity(
      id: 'dishwasher',
      name: 'Dishwasher',
      category: AmenityCategory.kitchen,
      iconName: 'dishwasher',
      hasAnimation: false,
      searchKeywords: 'dishes cleaning',
    ),
    const Amenity(
      id: 'dishes',
      name: 'Dishes & Silverware',
      category: AmenityCategory.kitchen,
      iconName: 'dishes',
      hasAnimation: false,
      searchKeywords: 'plates utensils cutlery',
    ),
    const Amenity(
      id: 'cookware',
      name: 'Cooking Basics',
      category: AmenityCategory.kitchen,
      iconName: 'cookware',
      hasAnimation: false,
      searchKeywords: 'pots pans oil spices',
    ),
    const Amenity(
      id: 'toaster',
      name: 'Toaster',
      category: AmenityCategory.kitchen,
      iconName: 'toaster',
      hasAnimation: false,
      searchKeywords: 'bread toast',
    ),
    const Amenity(
      id: 'kettle',
      name: 'Electric Kettle',
      category: AmenityCategory.kitchen,
      iconName: 'kettle',
      hasAnimation: false,
      searchKeywords: 'water boiler tea',
    ),

    // ========== BATHROOM ==========
    const Amenity(
      id: 'hair_dryer',
      name: 'Hair Dryer',
      category: AmenityCategory.bathroom,
      iconName: 'hair_dryer',
      hasAnimation: false,
      searchKeywords: 'blow dryer',
    ),
    const Amenity(
      id: 'shampoo',
      name: 'Shampoo',
      category: AmenityCategory.bathroom,
      iconName: 'shampoo',
      hasAnimation: false,
      searchKeywords: 'toiletries hair wash',
    ),
    const Amenity(
      id: 'body_soap',
      name: 'Body Soap',
      category: AmenityCategory.bathroom,
      iconName: 'body_soap',
      hasAnimation: false,
      searchKeywords: 'shower gel toiletries',
    ),
    const Amenity(
      id: 'towels',
      name: 'Towels',
      category: AmenityCategory.bathroom,
      iconName: 'towels',
      hasAnimation: false,
      searchKeywords: 'bath linens',
    ),
    const Amenity(
      id: 'hot_water',
      name: 'Hot Water',
      category: AmenityCategory.bathroom,
      iconName: 'hot_water',
      hasAnimation: false,
      searchKeywords: 'shower bath',
    ),

    // ========== BEDROOM & LAUNDRY ==========
    const Amenity(
      id: 'hangers',
      name: 'Hangers',
      category: AmenityCategory.bedroom,
      iconName: 'hangers',
      hasAnimation: false,
      searchKeywords: 'clothes closet',
    ),
    const Amenity(
      id: 'iron',
      name: 'Iron',
      category: AmenityCategory.bedroom,
      iconName: 'iron',
      hasAnimation: false,
      searchKeywords: 'ironing board press',
    ),
    const Amenity(
      id: 'bed_linens',
      name: 'Bed Linens',
      category: AmenityCategory.bedroom,
      iconName: 'bed_linens',
      hasAnimation: false,
      searchKeywords: 'sheets bedding',
    ),
    const Amenity(
      id: 'extra_pillows',
      name: 'Extra Pillows & Blankets',
      category: AmenityCategory.bedroom,
      iconName: 'extra_pillows',
      hasAnimation: false,
      searchKeywords: 'bedding comfort',
    ),
    const Amenity(
      id: 'blackout_curtains',
      name: 'Blackout Curtains',
      category: AmenityCategory.bedroom,
      iconName: 'blackout_curtains',
      hasAnimation: false,
      searchKeywords: 'dark room sleep',
    ),

    // ========== SAFETY & SECURITY ==========
    const Amenity(
      id: 'smoke_alarm',
      name: 'Smoke Alarm',
      category: AmenityCategory.safety,
      iconName: 'smoke_alarm',
      hasAnimation: false,
      searchKeywords: 'fire detector safety',
    ),
    const Amenity(
      id: 'fire_extinguisher',
      name: 'Fire Extinguisher',
      category: AmenityCategory.safety,
      iconName: 'fire_extinguisher',
      hasAnimation: false,
      searchKeywords: 'safety emergency',
    ),
    const Amenity(
      id: 'first_aid_kit',
      name: 'First Aid Kit',
      category: AmenityCategory.safety,
      iconName: 'first_aid_kit',
      hasAnimation: false,
      searchKeywords: 'medical emergency',
    ),
    const Amenity(
      id: 'carbon_monoxide_alarm',
      name: 'Carbon Monoxide Alarm',
      category: AmenityCategory.safety,
      iconName: 'carbon_monoxide_alarm',
      hasAnimation: false,
      searchKeywords: 'co detector safety',
    ),
    const Amenity(
      id: 'lock_on_door',
      name: 'Lock on Bedroom Door',
      category: AmenityCategory.safety,
      iconName: 'lock_on_door',
      hasAnimation: false,
      searchKeywords: 'security privacy',
    ),

    // ========== INTERNET & OFFICE ==========
    const Amenity(
      id: 'dedicated_workspace',
      name: 'Dedicated Workspace',
      category: AmenityCategory.internetOffice,
      iconName: 'dedicated_workspace',
      hasAnimation: false,
      searchKeywords: 'desk office work',
    ),
    const Amenity(
      id: 'ethernet',
      name: 'Ethernet Connection',
      category: AmenityCategory.internetOffice,
      iconName: 'ethernet',
      hasAnimation: false,
      searchKeywords: 'wired internet network',
    ),

    // ========== OUTDOOR & RECREATION ==========
    const Amenity(
      id: 'garden',
      name: 'Garden or Backyard',
      category: AmenityCategory.outdoor,
      iconName: 'garden',
      hasAnimation: false,
      searchKeywords: 'outdoor yard green space',
    ),
    const Amenity(
      id: 'outdoor_furniture',
      name: 'Outdoor Furniture',
      category: AmenityCategory.outdoor,
      iconName: 'outdoor_furniture',
      hasAnimation: false,
      searchKeywords: 'patio chairs table',
    ),
    const Amenity(
      id: 'outdoor_dining',
      name: 'Outdoor Dining Area',
      category: AmenityCategory.outdoor,
      iconName: 'outdoor_dining',
      hasAnimation: false,
      searchKeywords: 'patio eating table',
    ),
  ];

  /// Get amenities by category
  static List<Amenity> byCategory(AmenityCategory category) {
    return all.where((amenity) => amenity.category == category).toList();
  }

  /// Get amenities matching search query
  static List<Amenity> search(String query) {
    if (query.isEmpty) return all;
    return all.where((amenity) => amenity.matchesSearch(query)).toList();
  }

  /// Get count of amenities in a category
  static int categoryCount(AmenityCategory category) {
    return all.where((amenity) => amenity.category == category).length;
  }

  /// Get all categories that have amenities
  static List<AmenityCategory> get categoriesWithAmenities {
    return AmenityCategory.values
        .where((category) => byCategory(category).isNotEmpty)
        .toList();
  }
}
