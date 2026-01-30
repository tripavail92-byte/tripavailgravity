import {
    LayoutDashboard,
    Plane,
    Heart,
    Gift,
    Settings,
    HelpCircle,
    Building2,
    Package,
    Calendar,
    BookCheck,
    Star,
    ShieldCheck,
    Map,
    UserCircle,
    MapPin,
    CreditCard
} from 'lucide-react';
import { RoleType } from '@tripavail/shared/roles/types';

export interface NavItem {
    label: string;
    icon: any;
    href: string;
    subtext?: string;
}

export const ROLE_NAVIGATION: Record<RoleType, NavItem[]> = {
    traveller: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'My Profile', icon: UserCircle, href: '/profile' },
        { label: 'My Trips', icon: MapPin, href: '/trips', subtext: '2 upcoming' },
        { label: 'Wishlist', icon: Heart, href: '/wishlist', subtext: '12 saved' },
        { label: 'Payment Methods', icon: CreditCard, href: '/payment-methods' },
        { label: 'Account Settings', icon: Settings, href: '/settings' },
        { label: 'Help & Support', icon: HelpCircle, href: '/help' },
    ],
    hotel_manager: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/manager/dashboard' },
        { label: 'Properties', icon: Building2, href: '/manager/properties' },
        { label: 'Packages', icon: Package, href: '/manager/packages' },
        { label: 'Calendar', icon: Calendar, href: '/manager/calendar' },
        { label: 'Bookings', icon: BookCheck, href: '/manager/bookings' },
        { label: 'Reviews', icon: Star, href: '/manager/reviews' },
        { label: 'Verification', icon: ShieldCheck, href: '/manager/verification' },
        { label: 'Settings', icon: Settings, href: '/settings' },
    ],
    tour_operator: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/operator/dashboard' },
        { label: 'Tours', icon: Map, href: '/operator/tours' },
        { label: 'Calendar', icon: Calendar, href: '/operator/calendar' },
        { label: 'Bookings', icon: BookCheck, href: '/operator/bookings' },
        { label: 'Reviews', icon: Star, href: '/operator/reviews' },
        { label: 'Verification', icon: ShieldCheck, href: '/operator/verification' },
        { label: 'Settings', icon: Settings, href: '/settings' },
    ]
};
