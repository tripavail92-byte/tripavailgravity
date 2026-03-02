import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Dual environment support: Vite (import.meta.env) and Node.js (process.env)
function getEnvVar(key: string): string {
    // @ts-ignore - import.meta.env exists in Vite but not in Node
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        return import.meta.env[key] || '';
    }
    // Fallback to process.env for Node.js/build time
    return process.env[key] || '';
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Missing Supabase environment variables. Running in offline mode.');
    console.warn('To enable Supabase features, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

type GlobalWithTripAvailSupabase = typeof globalThis & {
    __tripavail_supabase__?: SupabaseClient;
};

const globalWithSupabase = globalThis as GlobalWithTripAvailSupabase;

// Create a proper client if env vars exist, otherwise create a mock client.
// IMPORTANT: Use a global singleton to prevent multiple client instances in cases
// where bundlers accidentally duplicate the module (which can trigger auth lock AbortErrors).
export const supabase = globalWithSupabase.__tripavail_supabase__
    ?? (globalWithSupabase.__tripavail_supabase__ = (supabaseUrl && supabaseAnonKey)
        ? createClient(supabaseUrl, supabaseAnonKey)
        : createClient('https://placeholder.supabase.co', 'placeholder-key'));

