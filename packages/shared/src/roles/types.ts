// NOTE: 'admin' is not stored in `user_roles` (it lives in `admin_users`),
// but the web app treats it as a first-class active role for routing.
export type RoleType = 'traveller' | 'hotel_manager' | 'tour_operator' | 'admin';

export interface UserRole {
    id: string;
    user_id: string;
    role_type: RoleType;
    is_active: boolean;
    profile_completion: number;
    verification_status: 'pending' | 'approved' | 'rejected' | 'incomplete';
}

export interface SwitchRoleResponse {
    user_id: string;
    active_role: RoleType;
    status: string;
}
