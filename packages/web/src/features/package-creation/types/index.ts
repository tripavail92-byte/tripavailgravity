export enum PackageType {
  WEEKEND_GETAWAY = 'weekend-getaway',
  ROMANTIC_ESCAPE = 'romantic-escape',
  FAMILY_ADVENTURE = 'family-adventure',
  BUSINESS_ELITE = 'business-elite',
  ADVENTURE_PACKAGE = 'adventure-package',
  CULINARY_JOURNEY = 'culinary-journey',
  WELLNESS_RETREAT = 'wellness-retreat',

  LUXURY_EXPERIENCE = 'luxury-experience',

  // New Premium Types
  CULTURAL_HISTORY = 'cultural-history',
  ECO_NATURE = 'eco-nature',
  CRUISE_WATER = 'cruise-water',

  CUSTOM = 'custom',
}

export interface PackageData {
  // Basic Info
  packageType?: PackageType
  hotelName?: string
  hotelId?: string // Link to source hotel
  hotelAddress?: string
  name?: string
  description?: string
  durationDays?: number

  // Availability
  availabilityType?: 'year-round' | 'specific-dates'
  minStay?: number
  maxStay?: number
  blackoutDates?: string[]

  // Room Configuration
  roomIds?: string[] // IDs of selected rooms
  selectedRooms?: Record<string, any> // Full configuration of selected rooms (prices, etc.)
  priceRange?: { min: number; max: number; currency: string } | null

  // Media (Flat structure preferred)
  photos?: string[]
  video?: string

  // Legacy (keep for backward compat)
  media?: {
    photos: any[]
    video?: string
  }

  // Content
  highlights?: string[]
  inclusions?: string[]
  exclusions?: string[]

  // Policies
  cancellationPolicy?: string
  customCancellationPolicy?: string
  paymentTerms?: string
  termsAndConditions?: string

  // Pricing & Booking Rules
  maxGuests?: number
  fixedPrice?: number
  basePricePerNight?: number
  minimumNights?: number
  maximumNights?: number
  slug?: string

  // Highlights (Inclusions & Discounts)
  freeInclusions?: Array<{
    name: string
    icon?: string
  }>
  discountOffers?: Array<{
    name: string
    originalPrice: number
    discount: number
    icon?: string
  }>
  // We will expand this as we implement more steps
}

// Step components emit partial updates that merge into PackageData.
export type StepData = Partial<PackageData>
