
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

const PACKAGE_ID = 'abd34873-b0f3-42fa-9531-49b3cadfe0b3';

async function inspectPackage() {
    console.log(`Inspecting Package: ${PACKAGE_ID}`);

    const { data: pkg, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', PACKAGE_ID)
        .single();

    if (error) {
        console.error('Error fetching package:', error);
        return;
    }

    console.log('Package Data:');
    console.log(JSON.stringify(pkg, null, 2));

    if (pkg.hotel_id) {
        console.log(`\nChecking Hotel: ${pkg.hotel_id}`);
        const { data: hotel, error: hError } = await supabase
            .from('hotels')
            .select('id, name, amenities')
            .eq('id', pkg.hotel_id)
            .single();

        if (hError) console.error('Hotel Fetch Error:', hError);
        else console.log('Hotel Data:', hotel);
    } else {
        console.log('\n❌ Package has NO hotel_id linked!');
    }

    if (pkg.room_ids && pkg.room_ids.length > 0) {
        console.log(`\nChecking Rooms: ${pkg.room_ids}`);
        const { data: rooms, error: rError } = await supabase
            .from('rooms')
            .select('id, name, amenities')
            .in('id', pkg.room_ids);

        if (rError) console.error('Room Fetch Error:', rError);
        else console.log('Rooms Data:', rooms);
    } else {
        console.log('\n❌ Package has NO room_ids linked!');
    }
}

inspectPackage();
