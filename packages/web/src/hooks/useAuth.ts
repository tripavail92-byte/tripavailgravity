import { create } from 'zustand';
import { authService } from '@tripavail/shared/auth/service';
import { roleService } from '@tripavail/shared/roles/service';
import type { UserRole, RoleType } from '@tripavail/shared/roles/types';
import type { User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    activeRole: UserRole | null;
    isLoading: boolean;
    initialized: boolean;

    // Actions
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    devLogin: () => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    switchRole: (role: RoleType) => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
    user: null,
    activeRole: null,
    isLoading: true,
    initialized: false,

    initialize: async () => {
        if (get().initialized) return;

        try {
            const session = await authService.getSession();

            if (session?.user) {
                // Fetch active role
                const activeRole = await roleService.getActiveRole(session.user.id);

                set({ user: session.user, activeRole, isLoading: false, initialized: true });
            } else {
                set({ user: null, activeRole: null, isLoading: false, initialized: true });
            }

            // Listen for changes
            authService.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const activeRole = await roleService.getActiveRole(session.user.id);
                    set({ user: session.user, activeRole, isLoading: false });
                } else if (event === 'SIGNED_OUT') {
                    set({ user: null, activeRole: null, isLoading: false });
                }
            });

        } catch (error) {
            console.error('Auth initialization failed:', error);
            set({ isLoading: false, initialized: true });
        }
    },

    signIn: async (email, password) => {
        set({ isLoading: true });
        try {
            await authService.signIn(email, password);
            // State updated by onAuthStateChange listener
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    signInWithGoogle: async () => {
        set({ isLoading: true });
        try {
            const redirectTo = `${window.location.origin}/auth/callback`;
            await authService.signInWithGoogle(redirectTo);
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    devLogin: async () => {
        set({ isLoading: true });
        // Mock User Data
        const mockUser: User = {
            id: 'dev-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'dev@tripavail.com',
            phone: '',
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: { full_name: 'Dev Traveller', avatar_url: 'https://github.com/shadcn.png' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as User;

        // Mock Role Data
        const mockRole: UserRole = {
            id: 'dev-role-id',
            user_id: 'dev-user-id',
            role_type: 'traveller',
            is_active: true,
            // enabled_at: new Date().toISOString(), // Optional or non-existent in strict type
            profile_completion: 80,
            verification_status: 'approved'
        };

        // Simulate network delay
        setTimeout(() => {
            set({ user: mockUser, activeRole: mockRole, isLoading: false });
        }, 800);
    },

    signUp: async (email, password, fullName) => {
        set({ isLoading: true });
        try {
            await authService.signUp(email, password, fullName);
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    signOut: async () => {
        set({ isLoading: true });
        try {
            await authService.signOut();
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    switchRole: async (roleType) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
            const result = await roleService.switchRole(user.id, roleType);

            // Update local state immediately for better UX
            if (result.status === 'success') {
                // Re-fetch to be safe or construct optimistic update
                const newRole = await roleService.getActiveRole(user.id);
                set({ activeRole: newRole, isLoading: false });
            }
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    }
}));
