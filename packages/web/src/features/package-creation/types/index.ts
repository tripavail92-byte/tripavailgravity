
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
    name?: string;
    description?: string;
    durationDays?: number;
    durationDays?: number;

    // Media (Flat structure preferred)
    photos?: string[];
    video?: string;

    // Legacy (keep for backward compat)
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
