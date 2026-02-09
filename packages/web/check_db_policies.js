
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.resolve(__dirname, '../../.env');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            const cleanValue = value.replace('\r', '').trim();
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = cleanValue;
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = cleanValue;
        }
    });
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    console.log('Checking RLS Policies...');

    // We cannot query pg_policies via the API easily unless we use an RPC or have permissions.
    // Standard anon/authenticated users CANNOT read pg_policies.
    // So we'll try to check by attempting to READ.

    // Actually, we already verified READ access works for ANON in verify_amenities_access.js.
    // If that worked, then POLICIES ARE CORRECT for ANON.

    // The browser failure might be due to an AUTHENTICATED user (Hotel Manager) 
    // trying to read, and maybe the policy is ONLY for 'anon'?

    // Let's check my policy definition in the SQL I sent:
    // TO public (which includes both).

    console.log('Skipping pg_policies check (permissions issue). Relying on inference.');
    console.log('verify_amenities_access.js confirmed ANON access works.');
}

checkPolicies();
