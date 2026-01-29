import { supabase } from '../core/client';
import type { RoleType, UserRole, SwitchRoleResponse } from './types';

export class RoleService {
    /**
     * Get all roles for a specific user
     */
    async getUserRoles(userId: string): Promise<UserRole[]> {
        const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data as UserRole[];
    }

    /**
     * Get the currently active role for a user
     */
    async getActiveRole(userId: string): Promise<UserRole | null> {
        const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore not found
        return data as UserRole | null;
    }

    /**
     * Switch the active role for a user (Secure RPC)
     */
    async switchRole(userId: string, newRole: RoleType): Promise<SwitchRoleResponse> {
        const { data, error } = await supabase.rpc('switch_user_role', {
            p_user_id: userId,
            p_role_type: newRole,
        });

        if (error) throw error;
        return data as unknown as SwitchRoleResponse;
    }

    /**
     * Initialize default traveller role if none exists
     */
    async ensureTravellerRole(userId: string): Promise<void> {
        const roles = await this.getUserRoles(userId);
        const hasTraveller = roles.some(r => r.role_type === 'traveller');

        if (!hasTraveller) {
            const { error } = await supabase
                .from('user_roles')
                .insert({
                    user_id: userId,
                    role_type: 'traveller',
                    is_active: roles.length === 0, // Active if first role
                });

            if (error) throw error;
        }
    }
}

export const roleService = new RoleService();
