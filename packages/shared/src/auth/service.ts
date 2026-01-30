import { supabase } from '../core/client';
import { roleService } from '../roles/service';

export class AuthService {
    /**
     * Sign in with Email and Password
     */
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle(redirectTo: string) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
            },
        });
        if (error) throw error;
        return data;
    }

    /**
     * Sign up with Email and Password
     */
    async signUp(email: string, password: string, fullName: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });

        if (error) throw error;

        // If auto-confirm is enabled, ensure traveller role is created
        if (data.user) {
            await roleService.ensureTravellerRole(data.user.id);
        }

        return data;
    }

    /**
     * Sign out
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    /**
     * Get current session
     */
    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    }

    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    }
}

export const authService = new AuthService();
