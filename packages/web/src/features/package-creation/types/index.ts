
export enum PackageType {
    WEEKEND_GETAWAY = 'weekend-getaway',
    ROMANTIC_ESCAPE = 'romantic-escape',
    FAMILY_ADVENTURE = 'family-adventure',
    BUSINESS_ELITE = 'business-elite',
    ADVENTURE_PACKAGE = 'adventure-package',
    CULINARY_JOURNEY = 'culinary-journey',
    WELLNESS_RETREAT = 'wellness-retreat',

    LUXURY_EXPERIENCE = 'luxury-experience',
    CUSTOM = 'custom',
}

export interface PackageData {
    // Basic Info
    packageType?: PackageType;
    hotelName?: string;
    hotelId?: string; // Link to source hotel
    name?: string;
    description?: string;
    durationDays?: number;

    // Room Configuration
    roomIds?: string[]; // IDs of selected rooms
    selectedRooms?: Record<string, any>; // Full configuration of selected rooms (prices, etc.)

    // Media (Flat structure preferred)
    photos?: string[];
    video?: string;

    // Legacy (keep for backward compat)
    media?: {
        photos: any[];
        video?: string;
    };

    // Content
    highlights?: string[];
    inclusions?: string[];
    exclusions?: string[];

    // Policies
    cancellationPolicy?: string;
    paymentTerms?: string;

    // Highlights (Inclusions & Discounts)
    freeInclusions?: Array<{
        name: string;
        icon?: string;
    }>;
    discountOffers?: Array<{
        name: string;
        originalPrice: number;
        discount: number;
        icon?: string;
    }>;
    // We will expand this as we implement more steps
}

export interface StepData {
    packageType?: PackageType;
    hotelName?: string;
    name?: string;
    description?: string;
    durationDays?: number;
    media?: {
        photos: any[];
        video?: string;
    };

    // Highlights (Inclusions & Discounts)
    freeInclusions?: Array<{
        name: string;
        icon?: string;
    }>;
    discountOffers?: Array<{
        name: string;
        originalPrice: number;
        discount: number;
        icon?: string;
    }>;
    // We will expand this as we implement more steps
}
