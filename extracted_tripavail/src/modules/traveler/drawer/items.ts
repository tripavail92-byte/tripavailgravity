import { 
  SimpleAnimatedDrawerIcons
} from '../../../components/icons/drawer/SimpleAnimatedDrawerIcons';
import type { DrawerItem } from '../../types/drawer';

export const travelerDrawerItems: DrawerItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: SimpleAnimatedDrawerIcons.Dashboard,
    screen: 'home',
    badge: null,
    type: 'navigation'
  },
  {
    id: 'profile',
    label: 'My Profile',
    icon: SimpleAnimatedDrawerIcons.Profile,
    screen: 'profile',
    badge: null,
    type: 'navigation'
  },
  {
    id: 'my-trips',
    label: 'My Trips',
    icon: SimpleAnimatedDrawerIcons.Trips,
    screen: 'my-trips',
    badge: '2 upcoming',
    type: 'navigation'
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    icon: SimpleAnimatedDrawerIcons.Wishlist,
    screen: 'wishlist',
    badge: '12 saved',
    type: 'navigation'
  },
  {
    id: 'payment-methods',
    label: 'Payment Methods',
    icon: SimpleAnimatedDrawerIcons.Payment,
    screen: 'payment-methods',
    badge: null,
    type: 'navigation'
  },
  {
    id: 'account-settings',
    label: 'Account Settings',
    icon: SimpleAnimatedDrawerIcons.Settings,
    screen: 'account-settings',
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
  }
];

export const travelerQuickActions = [
  // Removed all quick actions to keep it simple
];