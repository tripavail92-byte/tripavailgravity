import { Plus } from 'lucide-react';
import { 
  SimpleAnimatedDrawerIcons
} from '../../../components/icons/drawer/SimpleAnimatedDrawerIcons';
import type { DrawerItem } from '../../types/drawer';

export const hotelManagerDrawerItems: DrawerItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: SimpleAnimatedDrawerIcons.Dashboard,
    screen: 'dashboard',
    badge: '3 live • 1 draft',
    type: 'navigation'
  },
  {
    id: 'list-hotel',
    label: 'List Your Hotel',
    icon: SimpleAnimatedDrawerIcons.Hotel,
    screen: 'list-hotel',
    badge: null,
    type: 'navigation',
    tourId: 'list-hotel-button'
  },
  {
    id: 'list-packages',
    label: 'List Packages',
    icon: SimpleAnimatedDrawerIcons.Package,
    screen: 'list-packages',
    badge: null,
    type: 'navigation'
  },
  {
    id: 'verification',
    label: 'Verification',
    icon: SimpleAnimatedDrawerIcons.Verification,
    screen: 'verification',
    badge: '75% complete',
    type: 'navigation',
    tourId: 'verification-link'
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

export const hotelManagerQuickActions = [];