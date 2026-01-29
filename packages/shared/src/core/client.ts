import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

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
    console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
