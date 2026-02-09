import { RoleType } from '@tripavail/shared/roles/types'
import {
  BookCheck,
  Building2,
  Calendar,
  CreditCard,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Map,
  MapPin,
  Package,
  Plus,
  Settings,
  ShieldCheck,
  UserCircle,
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  subtext?: string
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
    { label: 'List Your Hotel', icon: Building2, href: '/manager/list-hotel' },
    { label: 'List Packages', icon: Package, href: '/manager/list-package' },
    { label: 'Calendar', icon: Calendar, href: '/manager/calendar' },
    { label: 'Bookings', icon: BookCheck, href: '/manager/bookings' },
    { label: 'Verification', icon: ShieldCheck, href: '/manager/verification' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Help & Support', icon: HelpCircle, href: '/help' },
    { label: 'Legal & Policies', icon: ShieldCheck, href: '/legal' },
  ],
  tour_operator: [
    { label: 'Create New Tour', icon: Plus, href: '/operator/setup', subtext: 'Design a new tour experience' },
    { label: 'Tour Operator Setup', icon: MapPin, href: '/operator/setup', subtext: 'Complete your profile' },
    { label: 'Dashboard', icon: LayoutDashboard, href: '/operator/dashboard', subtext: '5 live • 2 draft' },
    { label: 'Post Trip Packages', icon: Map, href: '/operator/tours/new' },
    { label: 'Calendar', icon: Calendar, href: '/operator/calendar' },
    { label: 'Bookings', icon: BookCheck, href: '/operator/bookings' },
    { label: 'Verification', icon: ShieldCheck, href: '/operator/verification' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Help & Support', icon: HelpCircle, href: '/help' },
    { label: 'Legal & Policies', icon: ShieldCheck, href: '/legal' },
  ],
}
