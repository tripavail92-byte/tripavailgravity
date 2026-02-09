
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectRoomData() {
    const packageId = 'abd34873-b0f3-42fa-9531-49b3cadfe0b3'; // The one we are testing

    console.log(`\n🔍 Inspecting Package: ${packageId}`);

    // 1. Get Package to find room_ids
    const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('id, name, room_ids, hotel_id')
        .eq('id', packageId)
        .single();

    if (pkgError) {
        console.error('Error fetching package:', pkgError);
        return;
    }

    console.log('📦 Package Data:', pkg);

    if (!pkg.room_ids || pkg.room_ids.length === 0) {
        console.log('⚠️ No room_ids found on package!');
        return;
    }

    const roomId = pkg.room_ids[0];
    console.log(`\n🏨 Inspecting Room: ${roomId}`);

    // 2. Get Room Data
    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

    if (roomError) {
        console.error('Error fetching room:', roomError);
        return;
    }

    console.log('🛏️ Room Data:', {
        id: room.id,
        name: room.name,
        amenities: room.amenities
    });

    if (!room.amenities || room.amenities.length === 0) {
        console.log('❌ Room has NO amenities (null or empty)');
    } else {
        console.log(`✅ Room has ${room.amenities.length} amenities`);
    }
}

inspectRoomData();
