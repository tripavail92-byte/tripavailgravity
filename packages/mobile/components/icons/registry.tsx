// System-driven icon resolvers. Mirrors the web app's icon choices so mobile and
// web stay visually consistent. All icons come from lucide-react-native
// (built on react-native-svg). Each resolver returns a LucideIcon component;
// render it like: const Icon = tourTypeIcon(type); <Icon size={20} color="#0f766e" />
import {
  Anchor,
  Bed,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  Camera,
  Car,
  Castle,
  Church,
  Clock,
  Coffee,
  Coins,
  Compass,
  ConciergeBell,
  CookingPot,
  Crown,
  Dumbbell,
  FileText,
  Flower2,
  Footprints,
  Globe,
  Heart,
  HeartPulse,
  Hotel,
  Landmark,
  type LucideIcon,
  Map as MapIcon,
  MapPin,
  Mountain,
  Percent,
  Plane,
  Receipt,
  Refrigerator,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Ticket,
  TreePine,
  Tv,
  Umbrella,
  UserCheck,
  Users,
  Utensils,
  Wallet,
  Waves,
  Wifi,
  Wine,
  XCircle,
} from './lucide'

/** Normalize a stored value to a lookup key: lowercase, & → and, spaces/underscores → dash. */
function norm(v: string): string {
  return v.trim().toLowerCase().replace(/&/g, 'and').replace(/[\s_]+/g, '-')
}

// ── Tour types (TourBasicsStep) ──────────────────────────────────────────────
const TOUR_TYPE: Record<string, LucideIcon> = {
  adventure: Mountain,
  nature: TreePine,
  cultural: Landmark,
  'city-tour': Building2,
  city: Building2,
  'food-and-drink': Utensils,
  food: Utensils,
  beach: Umbrella,
  historical: Castle,
  religious: Church,
  honeymoon: Heart,
  family: Users,
  photography: Camera,
  wellness: Flower2,
  luxury: Crown,
  budget: Wallet,
  custom: Sparkles,
}

export function tourTypeIcon(type?: string | null): LucideIcon {
  if (!type) return Compass
  return TOUR_TYPE[norm(type)] ?? Compass
}

// ── Tour included/excluded feature icon_keys (mirrors web TourIconRegistry) ───
const TOUR_FEATURE: Record<string, LucideIcon> = {
  guide: UserCheck,
  bus: Bus,
  ticket: Ticket,
  meal: Utensils,
  hotel: Bed,
  insurance: Shield,
  camera: Camera,
  taxes: Receipt,
  expense: Wallet,
  tips: Coins,
  flight: Plane,
  visa: FileText,
  optional_activity: MapIcon,
  alcohol: Wine,
  shopping: ShoppingBag,
  emergency: HeartPulse,
  free_48h: ShieldCheck,
  moderate_policy: Clock,
  partial_refund: Percent,
  non_refundable: XCircle,
  hiking: Footprints,
  requirement_fitness: Dumbbell,
  requirement_altitude: Mountain,
  requirement_health: HeartPulse,
  requirement_boots: Footprints,
  requirement_swim: Waves,
  requirement_id: FileText,
  generic: Sparkles,
}

export function tourFeatureIcon(iconKey?: string | null): LucideIcon {
  if (!iconKey) return Sparkles
  return TOUR_FEATURE[iconKey] ?? TOUR_FEATURE[norm(iconKey).replace(/-/g, '_')] ?? Sparkles
}

// ── Hotel amenities (AmenitiesStep) ──────────────────────────────────────────
const AMENITY: Record<string, LucideIcon> = {
  wifi: Wifi,
  'high-speed-internet': Wifi,
  pool: Waves,
  'swimming-pool': Waves,
  gym: Dumbbell,
  'fitness-center': Dumbbell,
  spa: Flower2,
  sauna: Flower2,
  'hot-tub': Waves,
  restaurant: Utensils,
  'bar-lounge': Wine,
  'room-service': ConciergeBell,
  breakfast: Coffee,
  'coffee-shop': Coffee,
  minibar: Wine,
  'free-parking': Car,
  'paid-parking': Car,
  'valet-parking': Car,
  'airport-shuttle': Bus,
  kitchen: CookingPot,
  kitchenette: CookingPot,
  refrigerator: Refrigerator,
  'air-conditioning': Snowflake,
  heating: Snowflake,
  tv: Tv,
  concierge: ConciergeBell,
  'pet-friendly': Heart,
  'mountain-view': Mountain,
  beachfront: Umbrella,
  'lake-access': Waves,
}

export function amenityIcon(key?: string | null): LucideIcon {
  if (!key) return Sparkles
  return AMENITY[norm(key)] ?? Sparkles
}

// ── Package types (PackageTypeIcons) ─────────────────────────────────────────
const PACKAGE_TYPE: Record<string, LucideIcon> = {
  'weekend-getaway': Calendar,
  'romantic-escape': Heart,
  'family-adventure': Users,
  'business-elite': Briefcase,
  'adventure-package': Mountain,
  'culinary-journey': Utensils,
  'wellness-retreat': Flower2,
  'luxury-experience': Crown,
  'cultural-history': Landmark,
  'eco-nature': Globe,
  'cruise-water': Anchor,
  custom: Sparkles,
}

export function packageTypeIcon(key?: string | null): LucideIcon {
  if (!key) return Hotel
  return PACKAGE_TYPE[norm(key)] ?? Hotel
}
