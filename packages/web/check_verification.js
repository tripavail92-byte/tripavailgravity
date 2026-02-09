
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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVerification() {
    console.log('Checking package linkage...');
    const packageId = 'abd34873-b0f3-42fa-9531-49b3cadfe0b3'; // The ID we are using

    const { data: pkg, error } = await supabase
        .from('packages')
        .select('hotel_id, room_ids')
        .eq('id', packageId)
        .single();

    if (error) {
        console.error('Error fetching package:', error.message);
        return;
    }

    if (pkg.hotel_id && pkg.room_ids && pkg.room_ids.length > 0) {
        console.log('VERIFICATION_COMPLETE: Package is linked to Hotel and Room.');
        console.log('Hotel ID:', pkg.hotel_id);
        console.log('Room IDs:', pkg.room_ids);
    } else {
        console.log('VERIFICATION_PENDING: Package is NOT fully linked yet.');
        console.log('Current Data:', pkg);
    }
}

checkVerification();
