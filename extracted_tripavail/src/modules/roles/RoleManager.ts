import { MENU_ITEMS, ROLE_PERMISSIONS, USER_ROLES } from '../../lib/constants';
import type { UserRole, PartnerMode, User, RolePermissions, AppView } from '../../lib/types';

interface MenuItem {
  id: string;
  label: string;
  iconType: string;
  view: AppView;
  badge?: string;
}

interface RoleTransitionValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Role Manager - Handles user roles, permissions, and role-based features
 */
export class RoleManager {
  private static instance: RoleManager;
  
  public static getInstance(): RoleManager {
    if (!RoleManager.instance) {
      RoleManager.instance = new RoleManager();
    }
    return RoleManager.instance;
  }

  /**
   * Get effective role based on current user role and partner mode
   */
  public getEffectiveRole(userRole: UserRole, partnerMode: PartnerMode): UserRole {
    return partnerMode || userRole;
  }

  /**
   * Get role display name for UI
   */
  public getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case 'hotel_manager':
        return 'Hotel Manager';
      case 'tour_operator':
        return 'Tour Operator';
      case 'traveler':
      default:
        return 'Traveler';
    }
  }

  /**
   * Get menu items for a specific role
   */
  public getMenuItems(role: UserRole): MenuItem[] {
    return MENU_ITEMS[role] || MENU_ITEMS.traveler;
  }

  /**
   * Check if user can switch to partner mode
   */
  public canSwitchToPartnerMode(user: User): boolean {
    // For now, all users can switch to partner mode
    // In production, this might depend on verification status, etc.
    return user.isVerified || true; // Allow unverified users for demo
  }

  /**
   * Validate role transition
   */
  public validateRoleTransition(
    currentRole: UserRole, 
    targetPartnerMode: PartnerMode, 
    user: User
  ): RoleTransitionValidation {
    // Check if user can switch to partner mode
    if (targetPartnerMode && !this.canSwitchToPartnerMode(user)) {
      return {
        valid: false,
        reason: 'User not eligible for partner mode'
      };
    }

    // Validate specific role transitions
    if (targetPartnerMode === 'hotel_manager' || targetPartnerMode === 'tour_operator') {
      // Additional checks for partner roles could go here
      return { valid: true };
    }

    return { valid: true };
  }

  /**
   * Get role permissions
   */
  public getRolePermissions(role: UserRole): RolePermissions {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.traveler;
  }

  /**
   * Check if role has specific permission
   */
  public hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
    const permissions = this.getRolePermissions(role);
    return permissions[permission];
  }

  /**
   * Calculate profile completion percentage based on role
   */
  public calculateProfileCompletion(user: User, role: UserRole): number {
    let completion = 0;
    const baseFields = ['name', 'email', 'avatar', 'location'];
    
    // Base profile fields (40% total)
    baseFields.forEach(field => {
      if (user[field as keyof User]) {
        completion += 10;
      }
    });

    // Role-specific completion
    if (role === 'hotel_manager' || role === 'tour_operator') {
      // Partner-specific fields (60% total)
      if (user.isVerified) completion += 30;
      // Additional partner fields would be checked here
      completion += 30; // Placeholder for other partner requirements
    } else {
      // Traveler-specific fields (60% total) 
      if (user.isVerified) completion += 20;
      completion += 40; // Placeholder for traveler preferences, etc.
    }

    return Math.min(completion, 100);
  }

  /**
   * Get role-specific onboarding steps
   */
  public getOnboardingSteps(role: UserRole): string[] {
    switch (role) {
      case 'hotel_manager':
        return [
          'Hotel Information',
          'Location & Description', 
          'Amenities',
          'Photos',
          'Pricing & Rooms',
          'Review & Submit',
          'Success'
        ];
      case 'tour_operator':
        return [
          'Business Information',
          'Tour Categories',
          'Experience & Certifications',
          'Photos & Portfolio',
          'Pricing & Packages',
          'Review & Submit',
          'Success'
        ];
      default:
        return [
          'Profile Setup',
          'Preferences',
          'Success'
        ];
    }
  }

  /**
   * Get role-specific dashboard data
   */
  public getDashboardConfig(role: UserRole) {
    switch (role) {
      case 'hotel_manager':
        return {
          title: 'Hotel Dashboard',
          subtitle: 'Manage your properties and bookings',
          primaryMetric: 'occupancy',
          showCalendar: true,
          showBookings: true,
          showReviews: true,
        };
      case 'tour_operator':
        return {
          title: 'Tour Operator Dashboard',
          subtitle: 'Manage your tours and experiences',
          primaryMetric: 'bookings',
          showCalendar: true,
          showBookings: true,
          showReviews: true,
        };
      default:
        return {
          title: 'My Travels',
          subtitle: 'Your bookings and trip history',
          primaryMetric: 'trips',
          showCalendar: false,
          showBookings: true,
          showReviews: false,
        };
    }
  }
}

// Export singleton instance
export const roleManager = RoleManager.getInstance();