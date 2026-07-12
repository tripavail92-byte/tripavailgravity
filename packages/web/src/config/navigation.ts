import { RoleType } from '@tripavail/shared/roles/types'
import {
  BarChart3,
  BookCheck,
  Building2,
  Calendar,
  CircleDollarSign,
  CreditCard,
  Globe,
  Heart,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  MessageSquare,
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
  admin: [],
  traveller: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'My Profile', icon: UserCircle, href: '/profile' },
    { label: 'My Trips', icon: MapPin, href: '/trips' },
    { label: 'Messages', icon: MessageSquare, href: '/messages' },
    { label: 'Wishlist', icon: Heart, href: '/wishlist' },
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
    { label: 'Messages', icon: MessageSquare, href: '/messages' },
    { label: 'Verification', icon: ShieldCheck, href: '/manager/verification' },
    { label: 'Settings', icon: Settings, href: '/manager/settings' },
    { label: 'Help & Support', icon: HelpCircle, href: '/help' },
    { label: 'Legal & Policies', icon: ShieldCheck, href: '/legal' },
  ],
  tour_operator: [
    {
      label: 'Tour Operator Setup',
      icon: MapPin,
      href: '/operator/setup',
      subtext: 'Complete your profile',
    },
    {
      label: 'Create New Tour Packages',
      icon: Plus,
      href: '/operator/tours/new',
      subtext: 'Design a new tour experience',
    },
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/operator/dashboard',
    },
    { label: 'Analytics', icon: BarChart3, href: '/operator/analytics' },
    { label: 'Business Profile', icon: Building2, href: '/operator-dashboard/business-profile' },
    { label: 'Public Preview', icon: Globe, href: '/operator-dashboard/public-preview' },
    { label: 'Verification', icon: ShieldCheck, href: '/operator-dashboard/verification' },
    { label: 'Commercial', icon: CircleDollarSign, href: '/operator/commercial' },
    { label: 'Calendar', icon: Calendar, href: '/operator/calendar' },
    { label: 'Bookings', icon: BookCheck, href: '/operator/bookings' },
    { label: 'Messages', icon: MessageSquare, href: '/messages' },
    { label: 'Settings', icon: Settings, href: '/operator/settings' },
    { label: 'Help & Support', icon: HelpCircle, href: '/help' },
    { label: 'Legal & Policies', icon: ShieldCheck, href: '/legal' },
  ],
}
