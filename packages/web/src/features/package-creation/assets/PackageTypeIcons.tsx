import {
    Calendar,
    Heart,
    Users,
    Briefcase,
    Mountain,
    Utensils,
    Crown,
    Flower
} from 'lucide-react';
import { PackageType } from '../types';
import {
    WeekendGetawayVector,
    RomanticEscapeVector,
    FamilyAdventureVector,
    BusinessEliteVector,
    AdventurePackageVector,
    CulinaryJourneyVector,
    WellnessRetreatVector,
    LuxuryExperienceVector,
    CustomPackageVector
} from './vectors';

export const PACKAGE_TYPE_CONFIG = {
    [PackageType.WEEKEND_GETAWAY]: {
        label: 'Weekend Getaway',
        description: 'Perfect for 2-3 day short trips',
        icon: Calendar,
        vector: WeekendGetawayVector,
        color: 'text-green-500',
        bg: 'bg-green-50',
        border: 'border-green-200'
    },
    [PackageType.ROMANTIC_ESCAPE]: {
        label: 'Romantic Escape',
        description: 'Intimate packages for couples',
        icon: Heart,
        vector: RomanticEscapeVector,
        color: 'text-pink-500',
        bg: 'bg-pink-50',
        border: 'border-pink-200'
    },
    [PackageType.FAMILY_ADVENTURE]: {
        label: 'Family Adventure',
        description: 'Fun-filled packages for families',
        icon: Users,
        vector: FamilyAdventureVector,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200'
    },
    [PackageType.BUSINESS_ELITE]: {
        label: 'Business Elite',
        description: 'Corporate rates and amenities',
        icon: Briefcase,
        vector: BusinessEliteVector,
        color: 'text-gray-500',
        bg: 'bg-gray-50',
        border: 'border-gray-200'
    },
    [PackageType.ADVENTURE_PACKAGE]: {
        label: 'Adventure Package',
        description: 'Outdoor experiences and thrills',
        icon: Mountain,
        vector: AdventurePackageVector,
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        border: 'border-orange-200'
    },
    [PackageType.CULINARY_JOURNEY]: {
        label: 'Culinary Journey',
        description: 'Gourmet dining experiences',
        icon: Utensils,
        vector: CulinaryJourneyVector,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200'
    },
    [PackageType.WELLNESS_RETREAT]: {
        label: 'Wellness Retreat',
        description: 'Spa and wellness focused',
        icon: Flower,
        vector: WellnessRetreatVector,
        color: 'text-purple-500',
        bg: 'bg-purple-50',
        border: 'border-purple-200'
    },
    [PackageType.LUXURY_EXPERIENCE]: {
        label: 'Luxury Experience',
        description: 'Ultra-premium VIP service',
        icon: Crown,
        vector: LuxuryExperienceVector,
        color: 'text-yellow-500',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200'
    },
    [PackageType.CUSTOM]: {
        label: 'Custom Package',
        description: 'Design your own package from scratch',
        icon: Briefcase, // Fallback icon
        vector: CustomPackageVector,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200'
    }
};
