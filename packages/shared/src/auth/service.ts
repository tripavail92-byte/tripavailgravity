import { supabase } from '../core/client';
import { roleService } from '../roles/service';

import type { Session } from '@supabase/supabase-js';

export class AuthService {
    private _sessionInFlight: Promise<Session | null> | null = null;
    private _sessionCache: { value: Session | null; at: number } | null = null;

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
        const now = Date.now();
        if (this._sessionCache && now - this._sessionCache.at < 1500) {
            return this._sessionCache.value;
        }

        if (this._sessionInFlight) return this._sessionInFlight;

        this._sessionInFlight = (async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;
                this._sessionCache = { value: data.session, at: Date.now() };
                return data.session;
            } finally {
                this._sessionInFlight = null;
            }
        })();

        return this._sessionInFlight;
    }

    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    }
}

export const authService = new AuthService();
