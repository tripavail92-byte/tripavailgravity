import type { UserRole, AppView, PartnerMode } from '../../lib/types';
import { APP_VIEWS } from '../../lib/constants';

interface NavigationValidation {
  allowed: boolean;
  reason?: string;
}

interface ViewMeta {
  title: string;
  subtitle: string;
  requiresAuth: boolean;
  allowedRoles: UserRole[];
}

/**
 * Navigation Manager - Handles view routing, access control, and navigation logic
 */
export class NavigationManager {
  private static instance: NavigationManager;
  
  public static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  private viewMetaMap: Record<AppView, ViewMeta> = {
    'home': {
      title: 'Welcome back!',
      subtitle: 'Discover your next adventure',
      requiresAuth: false,
      allowedRoles: ['traveler', 'hotel_manager', 'tour_operator']
    },
    'partner-selection': {
      title: 'Choose Your Partner Type',
      subtitle: 'Select how you want to earn with TripAvail',
      requiresAuth: true,
      allowedRoles: ['traveler']
    },
    'dashboard': {
      title: 'Dashboard',
      subtitle: 'Your business overview',
      requiresAuth: true,
      allowedRoles: ['hotel_manager', 'tour_operator']
    },
    'calendar': {
      title: 'Calendar & Availability',
      subtitle: 'Manage your availability and bookings',
      requiresAuth: true,
      allowedRoles: ['hotel_manager', 'tour_operator']
    },
    'bookings': {
      title: 'Bookings',
      subtitle: 'Manage your reservations',
      requiresAuth: true,
      allowedRoles: ['traveler', 'hotel_manager', 'tour_operator']
    },
    'reviews': {
      title: 'Reviews & Ratings',
      subtitle: 'See what guests are saying',
      requiresAuth: true,
      allowedRoles: ['hotel_manager', 'tour_operator']
    },
    'verification': {
      title: 'Verification Center',
      subtitle: 'Complete your business verification',
      requiresAuth: true,
      allowedRoles: ['hotel_manager', 'tour_operator']
    },
    'settings': {
      title: 'Account Settings',
      subtitle: 'Manage your profile and preferences',
      requiresAuth: true,
      allowedRoles: ['traveler', 'hotel_manager', 'tour_operator']
    },
    'hotel-onboarding': {
      title: 'Hotel Onboarding',
      subtitle: 'Set up your hotel listing step by step',
      requiresAuth: true,
      allowedRoles: ['hotel_manager']
    }
  };

  /**
   * Validate if navigation to a view is allowed
   */
  public validateNavigation(
    userRole: UserRole,
    targetView: AppView,
    partnerMode: PartnerMode
  ): NavigationValidation {
    const effectiveRole = partnerMode || userRole;
    const viewMeta = this.viewMetaMap[targetView];
    
    if (!viewMeta) {
      return {
        allowed: false,
        reason: `Unknown view: ${targetView}`
      };
    }

    // Check role permissions
    if (!viewMeta.allowedRoles.includes(effectiveRole)) {
      return {
        allowed: false,
        reason: `Role '${effectiveRole}' cannot access view '${targetView}'`
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can access a specific view
   */
  public canAccessView(userRole: UserRole, targetView: AppView): boolean {
    const viewMeta = this.viewMetaMap[targetView];
    return viewMeta ? viewMeta.allowedRoles.includes(userRole) : false;
  }

  /**
   * Get view metadata for UI display
   */
  public getViewMeta(view: AppView, role: UserRole): { title: string; subtitle: string } {
    const baseMeta = this.viewMetaMap[view] || { title: 'TripAvail', subtitle: 'Your travel companion' };
    
    // Customize titles based on role
    if (view === 'home') {
      switch (role) {
        case 'hotel_manager':
          return {
            title: 'Hotel Manager Portal',
            subtitle: 'Manage your properties and grow your business'
          };
        case 'tour_operator':
          return {
            title: 'Tour Operator Hub',
            subtitle: 'Create experiences and manage tours'
          };
        default:
          return {
            title: 'Welcome back!',
            subtitle: 'Discover your next adventure'
          };
      }
    }

    if (view === 'dashboard') {
      switch (role) {
        case 'hotel_manager':
          return {
            title: 'Hotel Dashboard',
            subtitle: 'Property performance and guest management'
          };
        case 'tour_operator':
          return {
            title: 'Tour Dashboard',
            subtitle: 'Tour bookings and experience management'
          };
      }
    }

    if (view === 'bookings') {
      switch (role) {
        case 'hotel_manager':
          return {
            title: 'Hotel Bookings',
            subtitle: 'Manage guest reservations and check-ins'
          };
        case 'tour_operator':
          return {
            title: 'Tour Bookings',
            subtitle: 'Manage tour reservations and participants'
          };
        case 'traveler':
          return {
            title: 'My Bookings',
            subtitle: 'Your travel reservations and history'
          };
      }
    }

    return {
      title: baseMeta.title,
      subtitle: baseMeta.subtitle
    };
  }

  /**
   * Get allowed views for a role
   */
  public getAllowedViews(role: UserRole): AppView[] {
    return Object.entries(this.viewMetaMap)
      .filter(([_, meta]) => meta.allowedRoles.includes(role))
      .map(([view, _]) => view as AppView);
  }

  /**
   * Get default view for a role
   */
  public getDefaultView(role: UserRole): AppView {
    switch (role) {
      case 'hotel_manager':
      case 'tour_operator':
        return APP_VIEWS.DASHBOARD;
      case 'traveler':
      default:
        return APP_VIEWS.HOME;
    }
  }

  /**
   * Get breadcrumb navigation for a view
   */
  public getBreadcrumb(view: AppView, role: UserRole): Array<{ label: string; view?: AppView }> {
    const breadcrumbs: Array<{ label: string; view?: AppView }> = [];
    
    // Add home/dashboard as first item
    if (role === 'hotel_manager' || role === 'tour_operator') {
      breadcrumbs.push({ label: 'Dashboard', view: APP_VIEWS.DASHBOARD });
    } else {
      breadcrumbs.push({ label: 'Home', view: APP_VIEWS.HOME });
    }

    // Add current view if not home/dashboard
    if (view !== APP_VIEWS.HOME && view !== APP_VIEWS.DASHBOARD) {
      const viewMeta = this.viewMetaMap[view];
      if (viewMeta) {
        breadcrumbs.push({ label: viewMeta.title });
      }
    }

    return breadcrumbs;
  }
}

// Export singleton instance
export const navigationManager = NavigationManager.getInstance();