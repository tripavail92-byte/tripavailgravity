import {
  BadgeCheck,
  Bed,
  Briefcase,
  Bus,
  Camera,
  Circle,
  ClipboardList,
  Check,
  Clock3,
  Coins,
  FileText,
  HeartPulse,
  Luggage,
  Map as MapIcon,
  Mountain,
  Percent,
  Plane,
  Receipt,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  UserCheck,
  Utensils,
  Wallet,
  Waves,
  Wine,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

export type TourIconKey =
  | 'meal'
  | 'bus'
  | 'hotel'
  | 'flight'
  | 'hiking'
  | 'guide'
  | 'insurance'
  | 'camera'
  | 'ticket'
  | 'taxes'
  | 'expense'
  | 'tips'
  | 'visa'
  | 'optional_activity'
  | 'shopping'
  | 'alcohol'
  | 'emergency'
  | 'free_48h'
  | 'moderate_policy'
  | 'partial_refund'
  | 'non_refundable'
  | 'requirement_fitness'
  | 'requirement_altitude'
  | 'requirement_health'
  | 'requirement_restriction'
  | 'requirement_accessibility'
  | 'requirement_boots'
  | 'requirement_swim'
  | 'requirement_warm'
  | 'requirement_id'
  | 'requirement_age'
  | 'requirement_luggage'
  | 'generic'

export interface TourFeatureItem {
  label: string
  icon_key: TourIconKey
}

export const TOUR_ICON_REGISTRY: Record<TourIconKey, LucideIcon> = {
  meal: Utensils,
  bus: Bus,
  hotel: Bed,
  flight: Plane,
  hiking: MapIcon,
  guide: UserCheck,
  insurance: Shield,
  camera: Camera,
  ticket: Ticket,
  taxes: Receipt,
  expense: Wallet,
  tips: Coins,
  visa: FileText,
  optional_activity: MapIcon,
  shopping: ShoppingBag,
  alcohol: Wine,
  emergency: HeartPulse,
  free_48h: ShieldCheck,
  moderate_policy: Clock3,
  partial_refund: Percent,
  non_refundable: XCircle,
  requirement_fitness: Mountain,
  requirement_altitude: Mountain,
  requirement_health: HeartPulse,
  requirement_restriction: ShieldAlert,
  requirement_accessibility: Circle,
  requirement_boots: MapIcon,
  requirement_swim: Waves,
  requirement_warm: Briefcase,
  requirement_id: ClipboardList,
  requirement_age: BadgeCheck,
  requirement_luggage: Luggage,
  generic: Circle,
}

export const INCLUDED_FEATURE_OPTIONS: TourFeatureItem[] = [
  { label: 'Professional Tour Guide', icon_key: 'guide' },
  { label: 'Transportation', icon_key: 'bus' },
  { label: 'Entrance Fees', icon_key: 'ticket' },
  { label: 'Meals (as specified)', icon_key: 'meal' },
  { label: 'Accommodation', icon_key: 'hotel' },
  { label: 'Travel Insurance', icon_key: 'insurance' },
  { label: 'Photography', icon_key: 'camera' },
  { label: 'Local Taxes', icon_key: 'taxes' },
]

export const EXCLUDED_FEATURE_OPTIONS: TourFeatureItem[] = [
  { label: 'Personal Expenses', icon_key: 'expense' },
  { label: 'Tips and Gratuities', icon_key: 'tips' },
  { label: 'International Flights', icon_key: 'flight' },
  { label: 'Visa Fees', icon_key: 'visa' },
  { label: 'Optional Activities', icon_key: 'optional_activity' },
  { label: 'Alcoholic Beverages', icon_key: 'alcohol' },
  { label: 'Shopping', icon_key: 'shopping' },
  { label: 'Emergency Expenses', icon_key: 'emergency' },
]

export const CANCELLATION_ICON_BY_POLICY: Record<string, TourIconKey> = {
  flexible: 'free_48h',
  moderate: 'moderate_policy',
  strict: 'partial_refund',
  'non-refundable': 'non_refundable',
}

export function getTourIconComponent(iconKey?: string): LucideIcon {
  if (!iconKey) return TOUR_ICON_REGISTRY.generic
  return TOUR_ICON_REGISTRY[iconKey as TourIconKey] || TOUR_ICON_REGISTRY.generic
}

export function buildStructuredFeaturesFromLabels(
  labels: string[] | undefined,
  catalog: TourFeatureItem[],
): TourFeatureItem[] {
  if (!Array.isArray(labels)) return []

  const byLabel = new Map(catalog.map((item) => [item.label.toLowerCase(), item]))
  return labels.map((label) => {
    const matched = byLabel.get(label.toLowerCase())
    if (matched) return matched
    return { label, icon_key: 'generic' }
  })
}
