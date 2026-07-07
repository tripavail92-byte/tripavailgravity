import {
  Bed,
  Bell,
  Briefcase,
  Building2,
  Car,
  type LucideIcon,
  Check,
  Coffee,
  Coins,
  ConciergeBell,
  Dumbbell,
  Flower2,
  Hotel,
  Plane,
  Shield,
  Snowflake,
  Sparkles,
  TreePine,
  Tv,
  Umbrella,
  Users,
  Utensils,
  Waves,
  Wifi,
  Wine,
} from '@/components/icons/lucide'

/** Catalogs for the premium hotel-listing wizard — mirror the web hotel-listing feature. */

export interface PropertyType {
  id: string
  name: string
  description: string
  Icon: LucideIcon
}

export const PROPERTY_TYPES: PropertyType[] = [
  { id: 'hotel', name: 'Hotel', description: 'Traditional hotel with multiple rooms', Icon: Hotel },
  { id: 'boutique', name: 'Boutique Hotel', description: 'Unique, stylish accommodation', Icon: Sparkles },
  { id: 'resort', name: 'Resort', description: 'Full-service vacation destination', Icon: Umbrella },
  { id: 'motel', name: 'Motel', description: 'Motor hotel for travelers', Icon: Car },
  { id: 'lodge', name: 'Lodge', description: 'Rustic or countryside stay', Icon: TreePine },
  { id: 'inn', name: 'Inn', description: 'Small, cozy accommodation', Icon: Bed },
  { id: 'guesthouse', name: 'Guest House', description: 'Home-like accommodation', Icon: Building2 },
  { id: 'hostel', name: 'Hostel', description: 'Budget-friendly shared stay', Icon: Users },
]

export interface RoomTypeOption {
  value: string
  label: string
  emoji: string
  hint: string
}

export const ROOM_TYPES: RoomTypeOption[] = [
  { value: 'standard', label: 'Standard', emoji: '🛏️', hint: 'Comfortable essentials' },
  { value: 'deluxe', label: 'Deluxe', emoji: '✨', hint: 'Upgraded comfort' },
  { value: 'suite', label: 'Suite', emoji: '🏰', hint: 'Separate living area' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧', hint: 'Room for everyone' },
  { value: 'executive', label: 'Executive', emoji: '💼', hint: 'For business stays' },
  { value: 'presidential', label: 'Presidential', emoji: '👑', hint: 'Top-tier luxury' },
]

export interface BedTypeOption {
  value: string
  label: string
  emoji: string
}

export const BED_TYPES: BedTypeOption[] = [
  { value: 'king', label: 'King', emoji: '🛏️' },
  { value: 'queen', label: 'Queen', emoji: '🛌' },
  { value: 'double', label: 'Double', emoji: '🛏️' },
  { value: 'twin', label: 'Twin', emoji: '🛏️' },
  { value: 'single', label: 'Single', emoji: '🛏️' },
  { value: 'sofaBed', label: 'Sofa Bed', emoji: '🛋️' },
]

export const ROOM_CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP']

/** Categorized amenities (ids/names mirror the web AmenitiesStep). */
export const AMENITY_CATEGORIES: Record<string, Array<{ id: string; name: string }>> = {
  'Internet & Work': [
    { id: 'wifi', name: 'WiFi' },
    { id: 'high-speed-internet', name: 'High-Speed Internet' },
    { id: 'business-center', name: 'Business Center' },
    { id: 'meeting-rooms', name: 'Meeting Rooms' },
  ],
  'Recreation & Wellness': [
    { id: 'pool', name: 'Swimming Pool' },
    { id: 'gym', name: 'Fitness Center' },
    { id: 'spa', name: 'Spa & Wellness' },
    { id: 'sauna', name: 'Sauna' },
    { id: 'hot_tub', name: 'Hot Tub' },
  ],
  'Outdoor & Views': [
    { id: 'patio', name: 'Patio' },
    { id: 'bbq_grill', name: 'BBQ Grill' },
    { id: 'mountain_view', name: 'Mountain View' },
    { id: 'lake_access', name: 'Lake Access' },
    { id: 'beachfront', name: 'Beachfront' },
  ],
  'Dining & Bar': [
    { id: 'restaurant', name: 'Restaurant' },
    { id: 'bar-lounge', name: 'Bar / Lounge' },
    { id: 'room-service', name: '24/7 Room Service' },
    { id: 'breakfast', name: 'Breakfast' },
    { id: 'minibar', name: 'Mini Bar' },
  ],
  'Parking & Transport': [
    { id: 'free_parking', name: 'Free Parking' },
    { id: 'paid_parking', name: 'Paid Parking' },
    { id: 'valet-parking', name: 'Valet Parking' },
    { id: 'airport-shuttle', name: 'Airport Shuttle' },
  ],
  'Services': [
    { id: 'concierge', name: 'Concierge' },
    { id: 'front-desk-24h', name: '24-Hour Front Desk' },
    { id: 'laundry', name: 'Laundry' },
    { id: 'housekeeping', name: 'Daily Housekeeping' },
    { id: 'safe-deposit', name: 'Safe Deposit Box' },
    { id: 'currency-exchange', name: 'Currency Exchange' },
  ],
}

const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  'high-speed-internet': Wifi,
  'business-center': Briefcase,
  'meeting-rooms': Briefcase,
  pool: Waves,
  gym: Dumbbell,
  spa: Sparkles,
  sauna: Flower2,
  hot_tub: Waves,
  patio: Umbrella,
  bbq_grill: Utensils,
  mountain_view: TreePine,
  lake_access: Waves,
  beachfront: Waves,
  restaurant: Utensils,
  'bar-lounge': Wine,
  'room-service': ConciergeBell,
  breakfast: Coffee,
  minibar: Wine,
  free_parking: Car,
  paid_parking: Car,
  'valet-parking': Car,
  'airport-shuttle': Plane,
  concierge: ConciergeBell,
  'front-desk-24h': Bell,
  laundry: Sparkles,
  housekeeping: Sparkles,
  'safe-deposit': Shield,
  'currency-exchange': Coins,
}

export function getAmenityIcon(id: string): LucideIcon {
  return AMENITY_ICONS[id] ?? Check
}

// Reverse lookup id → human label, built once from AMENITY_CATEGORIES.
const AMENITY_LABELS: Record<string, string> = Object.values(AMENITY_CATEGORIES)
  .flat()
  .reduce<Record<string, string>>((acc, a) => {
    acc[a.id] = a.name
    return acc
  }, {})

/** Pretty-print an amenity id ("free_parking" → "Free Parking") + its icon. */
export function resolveAmenity(id: string): { label: string; Icon: LucideIcon } {
  const label =
    AMENITY_LABELS[id] ??
    String(id)
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  return { label, Icon: getAmenityIcon(id) }
}

/** Room-type label/emoji for a stored room_type value. */
export function resolveRoomType(value: string | null | undefined): { label: string; emoji: string } {
  const found = ROOM_TYPES.find((r) => r.value === value)
  return found ? { label: found.label, emoji: found.emoji } : { label: 'Room', emoji: '🛏️' }
}

/** Services step — facilities grid (mirrors web ServicesData.facilities). */
export interface FacilityOption {
  key: string
  label: string
  Icon: LucideIcon
}

export const FACILITY_OPTIONS: FacilityOption[] = [
  { key: 'pool', label: 'Swimming Pool', Icon: Waves },
  { key: 'gym', label: 'Gym', Icon: Dumbbell },
  { key: 'spa', label: 'Spa & Wellness', Icon: Sparkles },
  { key: 'restaurant', label: 'Restaurant / Bar', Icon: Utensils },
  { key: 'roomService', label: 'Room Service', Icon: ConciergeBell },
  { key: 'airportShuttle', label: 'Airport Shuttle', Icon: Plane },
  { key: 'ac', label: 'Air Conditioning', Icon: Snowflake },
  { key: 'tv', label: 'Flat-screen TV', Icon: Tv },
]

export type BreakfastChoice = 'included' | 'optional' | 'none'
export type ParkingChoice = 'free' | 'paid' | 'none'
export type WifiChoice = 'free' | 'paid' | 'none'

export interface ServicesData {
  breakfast: BreakfastChoice
  parking: ParkingChoice
  wifi: WifiChoice
  facilities: Record<string, boolean>
  accessibility: { wheelchairAccessible: boolean; elevator: boolean }
}

export const EMPTY_SERVICES: ServicesData = {
  breakfast: 'none',
  parking: 'none',
  wifi: 'free',
  facilities: {},
  accessibility: { wheelchairAccessible: false, elevator: false },
}
