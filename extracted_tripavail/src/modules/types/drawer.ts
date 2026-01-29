import { LucideIcon } from 'lucide-react';

export interface DrawerItem {
  id: string;
  label: string;
  icon: LucideIcon;
  screen: string;
  badge?: string | null;
  type: 'navigation' | 'support';
  tourId?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  action: string;
  color: string;
}

export interface DrawerMeta {
  userName: string;
  userEmail: string;
  userRole: string;
  userLocation: string;
  isVerified: boolean;
  profileCompletion: number;
}

export type DrawerTheme = {
  accentColor: string;
  selectedIndicatorColor: string;
  iconSelectedColor: string;
  iconHoverColor: string;
};