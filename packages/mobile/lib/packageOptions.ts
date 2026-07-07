import {
  Anchor,
  Briefcase,
  Calendar,
  Crown,
  Flower2,
  Heart,
  Landmark,
  type LucideIcon,
  Mountain,
  Sparkles,
  TreePine,
  Users,
  Utensils,
} from '@/components/icons/lucide'

/** Catalogs for the premium package-creation wizard — mirror the web package-creation feature. */

export interface PackageTypeOption {
  id: string
  name: string
  description: string
  Icon: LucideIcon
}

export const PACKAGE_TYPES: PackageTypeOption[] = [
  { id: 'romantic', name: 'Romantic', description: 'Couples & honeymoon escapes', Icon: Heart },
  { id: 'family', name: 'Family', description: 'Fun for all ages', Icon: Users },
  { id: 'luxury', name: 'Luxury', description: 'Premium, top-tier stays', Icon: Crown },
  { id: 'adventure', name: 'Adventure', description: 'Thrills & the outdoors', Icon: Mountain },
  { id: 'cultural', name: 'Cultural', description: 'Heritage & local life', Icon: Landmark },
  { id: 'culinary', name: 'Culinary', description: 'Food & dining journeys', Icon: Utensils },
  { id: 'wellness', name: 'Wellness', description: 'Spa & rejuvenation', Icon: Flower2 },
  { id: 'business', name: 'Business', description: 'Work-friendly stays', Icon: Briefcase },
  { id: 'cruise', name: 'Cruise', description: 'On-the-water escapes', Icon: Anchor },
  { id: 'eco', name: 'Eco', description: 'Nature & sustainable', Icon: TreePine },
  { id: 'weekend', name: 'Weekend', description: 'Short getaways', Icon: Calendar },
  { id: 'custom', name: 'Custom', description: 'Build your own', Icon: Sparkles },
]

// Traveller-facing label suffix per type (web presents "Romantic Escape" etc.).
const PACKAGE_TYPE_TAGLINE: Record<string, string> = {
  romantic: 'Romantic escape',
  family: 'Family getaway',
  luxury: 'Luxury stay',
  adventure: 'Adventure package',
  cultural: 'Cultural journey',
  culinary: 'Culinary experience',
  wellness: 'Wellness retreat',
  business: 'Business stay',
  cruise: 'Cruise escape',
  eco: 'Eco stay',
  weekend: 'Weekend getaway',
  custom: 'Custom package',
}

/** Resolve a stored package_type id → rich presentation (label, tagline, description, icon). */
export function resolvePackageType(id: string | null | undefined): {
  id: string
  name: string
  tagline: string
  description: string
  Icon: PackageTypeOption['Icon']
} {
  const found = PACKAGE_TYPES.find((t) => t.id === id)
  if (found) {
    return {
      id: found.id,
      name: found.name,
      tagline: PACKAGE_TYPE_TAGLINE[found.id] ?? `${found.name} package`,
      description: found.description,
      Icon: found.Icon,
    }
  }
  const fallback = String(id ?? 'custom')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return {
    id: String(id ?? 'custom'),
    name: fallback || 'Package',
    tagline: fallback || 'Package',
    description: 'Curated hotel stay',
    Icon: PACKAGE_TYPES[PACKAGE_TYPES.length - 1].Icon,
  }
}

export const SUGGESTED_FREE_INCLUSIONS: string[] = [
  'Breakfast for 2 (daily)',
  'Late checkout to 3 PM',
  'Early check-in',
  'Welcome drink on arrival',
  'High-speed Wi-Fi',
  'Spa wet-area access',
  'Romantic room setup',
  'Complimentary parking',
  'Pool / rooftop access',
]

export const PACKAGE_INCLUSIONS: string[] = [
  'Accommodation',
  'Breakfast',
  'Airport transfer',
  'Guided tour',
  'All meals',
  'Spa session',
  'Welcome amenities',
  'Late checkout',
]

export const PACKAGE_EXCLUSIONS: string[] = [
  'Lunch & dinner',
  'Personal expenses',
  'Travel insurance',
  'Tips & gratuities',
  'Optional excursions',
  'Mini-bar',
]
