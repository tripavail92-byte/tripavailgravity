import { Plus, Plane } from 'lucide-react';
import { 
  SimpleAnimatedDrawerIcons
} from '../../../components/icons/drawer/SimpleAnimatedDrawerIcons';
import type { DrawerItem } from '../../types/drawer';

export const tourOperatorDrawerItems: DrawerItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: SimpleAnimatedDrawerIcons.Dashboard,
    screen: 'dashboard',
    badge: '5 live • 2 draft',
    type: 'navigation'
  },
  {
    id: 'post-trip-packages',
    label: 'Post Trip Packages',
    icon: SimpleAnimatedDrawerIcons.Package,
    screen: 'post-trip-packages',
    badge: null,
    type: 'navigation'
  },
  {
    id: 'calendar',
    label: 'Calendar & Availability',
    icon: SimpleAnimatedDrawerIcons.Calendar,
    screen: 'calendar',
    badge: null,
    type: 'navigation'
  },
  {
    id: 'bookings',
    label: 'Bookings (Trips)',
    icon: SimpleAnimatedDrawerIcons.Bookings,
    screen: 'bookings',
    badge: '3 pending',
    type: 'navigation'
  },
  {
    id: 'verification',
    label: 'Verification',
    icon: SimpleAnimatedDrawerIcons.Verification,
    screen: 'verification',
    badge: '85% complete',
    type: 'navigation'
  },
  {
    id: 'settings',
    label: 'Account Settings',
    icon: SimpleAnimatedDrawerIcons.Settings,
    screen: 'settings',
    badge: null,
    type: 'navigation'
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: SimpleAnimatedDrawerIcons.Help,
    screen: 'help',
    badge: null,
    type: 'support'
  },
  {
    id: 'legal',
    label: 'Legal & Policies',
    icon: SimpleAnimatedDrawerIcons.Legal,
    screen: 'legal',
    badge: null,
    type: 'support'
  }
];

export const tourOperatorQuickActions = [
  {
    id: 'create-tour',
    label: 'Create New Tour',
    description: 'Design a new tour experience',
    icon: Plus,
    action: 'create-tour',
    color: '#5FAD43'
  },
  {
    id: 'tour-onboarding',
    label: 'Tour Operator Setup',
    description: 'Complete your profile',
    icon: Plane,
    action: 'tour-onboarding',
    color: '#6b7280'
  }
];