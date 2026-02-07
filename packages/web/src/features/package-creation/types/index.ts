
export enum PackageType {
    WEEKEND_GETAWAY = 'weekend-getaway',
    ROMANTIC_ESCAPE = 'romantic-escape',
    FAMILY_ADVENTURE = 'family-adventure',
    BUSINESS_ELITE = 'business-elite',
    ADVENTURE_PACKAGE = 'adventure-package',
    CULINARY_JOURNEY = 'culinary-journey',
    WELLNESS_RETREAT = 'wellness-retreat',
    LUXURY_EXPERIENCE = 'luxury-experience',
}

export interface PackageData {
    // Basic Info
    packageType?: PackageType;
    name?: string;
    description?: string;
    durationDays?: number;

    // We will expand this as we implement more steps
}

export interface StepData {
    packageType?: PackageType;
    // We will expand this as we implement more steps
}
