
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
            const cleanValue = value.replace('\r', '').trim(); // Handle Windows line endings
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

async function fetchIds() {
    console.log('Fetching IDs...');

    // 1. Get a hotel
    const { data: hotels, error: hError } = await supabase.from('hotels').select('id, name').limit(1);
    if (hError) console.error('Hotel Error:', hError);
    else console.log('HOTEL_ID:', hotels?.[0]?.id, 'Name:', hotels?.[0]?.name);

    // 2. Get a room
    const { data: rooms, error: rError } = await supabase.from('rooms').select('id, name').limit(1);
    if (rError) console.error('Room Error:', rError);
    else console.log('ROOM_ID:', rooms?.[0]?.id, 'Name:', rooms?.[0]?.name);

    // 3. Get a package
    const { data: packages, error: pError } = await supabase.from('packages').select('id, name').limit(1);
    if (pError) console.error('Package Error:', pError);
    else console.log('PACKAGE_ID:', packages?.[0]?.id, 'Name:', packages?.[0]?.name);
}

fetchIds();
