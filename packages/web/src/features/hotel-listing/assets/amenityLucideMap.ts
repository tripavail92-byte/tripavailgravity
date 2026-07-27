/**
 * Traveller-facing amenity icon lookup.
 *
 * WHY THIS EXISTS. The animated icon map in ./AnimatedAmenityIcons.tsx covers ~20 amenities and
 * defaults every unrecognised id to WifiIcon. On the wizard that's fine — the partner sees each
 * icon animate as they pick — but on the traveller detail pages it meant a Wi-Fi glyph next to
 * "Fire Pit", "Pool", "TV", "Paid Parking", "Air Conditioning" and about 40 other amenities. The
 * observer noticed exactly this in the UI review.
 *
 * Extending AnimatedAmenityIcons would mean hand-drawing 40+ new animated SVGs. On the traveller
 * detail page the icons are scanned once, not interacted with, so a plain lucide glyph is enough.
 * This file is that map. Wizard-side selection still uses the animated version.
 */
import type { LucideIcon } from 'lucide-react'
import {
  Accessibility,
  Baby,
  Bath,
  Bell,
  Book,
  Briefcase,
  Building2,
  Car,
  ChefHat,
  Clock,
  Coffee,
  Coins,
  Dumbbell,
  Flag,
  Flame,
  Laptop,
  Lock,
  Luggage,
  MonitorPlay,
  MoveVertical,
  Mountain,
  Music,
  PawPrint,
  Plane,
  Presentation,
  Refrigerator,
  Shirt,
  Snowflake,
  Sparkles,
  Sun,
  Thermometer,
  Trees,
  Tv,
  Umbrella,
  Users,
  Utensils,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wine,
} from 'lucide-react'

/**
 * Keys are the wizard's canonical amenity ids after normalisation to kebab-case
 * (see normalizeAmenityKey below). Underscore ids from the DB (`bbq_grill`,
 * `fire_pit`, `air_conditioning`) all normalise to hyphen form, so a single entry
 * covers both spellings.
 */
const AMENITY_LUCIDE_MAP: Record<string, LucideIcon> = {
  // Internet & Technology
  wifi: Wifi,
  'high-speed-internet': Wifi,
  'business-center': Briefcase,
  'meeting-rooms': Users,
  'conference-facilities': Presentation,

  // Recreation & Wellness
  pool: Waves,
  gym: Dumbbell,
  spa: Sparkles,
  sauna: Thermometer,
  'hot-tub': Bath,
  'tennis-court': Flag,
  'golf-course': Flag,
  'pool-table': Flag,
  piano: Music,

  // Outdoor & Views
  patio: Sun,
  'bbq-grill': Flame,
  'outdoor-dining': Utensils,
  'fire-pit': Flame,
  'scenic-balcony': Mountain,
  'mountain-view': Mountain,
  'forest-view': Trees,
  'lake-access': Waves,
  beachfront: Umbrella,

  // Dining & Bar
  restaurant: UtensilsCrossed,
  'bar-lounge': Wine,
  'room-service': Bell,
  breakfast: Coffee,
  'coffee-shop': Coffee,
  minibar: Wine,

  // Parking & Transportation
  'free-parking': Car,
  'paid-parking': Car,
  'valet-parking': Car,
  'airport-shuttle': Plane,
  'car-rental': Car,
  'taxi-service': Car,

  // Services & Convenience
  concierge: Bell,
  'front-desk-24h': Clock,
  'luggage-storage': Luggage,
  laundry: Shirt,
  'dry-cleaning': Shirt,
  housekeeping: Sparkles,
  'safe-deposit': Lock,
  'currency-exchange': Coins,

  // Kitchen & Laundry
  kitchen: ChefHat,
  kitchenette: ChefHat,
  refrigerator: Refrigerator,
  'washing-machine': Shirt,
  dryer: Shirt,

  // Room Features
  'air-conditioning': Snowflake,
  heating: Thermometer,
  'dedicated-workspace': Laptop,
  balcony: Sun,
  'city-view': Building2,
  'ocean-view': Waves,
  'indoor-bonfire': Flame,

  // Family & Accessibility
  'family-rooms': Users,
  'kids-club': Baby,
  playground: Baby,
  'wheelchair-accessible': Accessibility,
  elevator: MoveVertical,
  'pet-friendly': PawPrint,
  babysitting: Baby,

  // Entertainment
  tv: Tv,
  'tv-cable': Tv,
  'entertainment-system': MonitorPlay,
  library: Book,
  'live-music': Music,
  nightclub: Music,
}

/** Normalise "BBQ Grill" / "bbq_grill" / "bbq-grill" all → "bbq-grill". */
export function normalizeAmenityKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Returns a lucide icon for the amenity. Fallback is Sparkles, not Wifi — the
 * point of this rewrite was to stop the Wi-Fi glyph appearing next to unrelated
 * amenities. Sparkles reads as "included feature" and is deliberately distinct
 * so a future missing-entry bug is visible (a scan showing lots of Sparkles is
 * a signal to add mappings, not a silent fallback pretending to be right).
 */
export function getAmenityLucideIcon(input: string): LucideIcon {
  const key = normalizeAmenityKey(input)
  return AMENITY_LUCIDE_MAP[key] ?? Sparkles
}

/**
 * "bbq_grill" → "BBQ Grill", "coffee-shop" → "Coffee Shop".
 * Preserves obvious acronyms (WiFi, TV, BBQ) so the label doesn't come out as "Wifi" or "Tv".
 */
const ACRONYMS = new Set(['wifi', 'tv', 'bbq', 'suv'])
export function formatAmenityLabel(input: string): string {
  return input
    .replace(/[-_]+/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => (ACRONYMS.has(word) ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(' ')
}
