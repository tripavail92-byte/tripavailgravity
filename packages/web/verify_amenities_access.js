
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

async function verifyAccess() {
    console.log('Verifying ANON access to HOTELS and ROOMS...');

    // 1. Try fetching Hotels
    const { data: hotels, error: hError } = await supabase.from('hotels').select('id, name, amenities').limit(1);

    if (hError) {
        console.error('❌ HOTELS ACCESS FAILED:', hError.message);
        console.error('Details:', hError);
    } else {
        console.log('✅ HOTELS ACCESS SUCCESS:', hotels.length, 'rows found.');
    }

    // 2. Try fetching Rooms
    const { data: rooms, error: rError } = await supabase.from('rooms').select('id, name, amenities').limit(1);

    if (rError) {
        console.error('❌ ROOMS ACCESS FAILED:', rError.message);
        console.error('Details:', rError);
    } else {
        console.log('✅ ROOMS ACCESS SUCCESS:', rooms.length, 'rows found.');
    }
}

verifyAccess();
