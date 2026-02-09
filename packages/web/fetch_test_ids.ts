
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from parents or current
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Tricky with monorepo. Let's try to assume commonly passed env vars or just use the ones I can find.
// Actually, I will just hardcode the URL/KEY if I can find them, OR rely on the shell environment if I can set it.
// Let's rely on reading .env.local if it exists.

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchIds() {
    const { data: hotels, error: hError } = await supabase.from('hotels').select('id, name').limit(1);
    if (hError) console.error('Hotel Error:', hError);
    else console.log('Hotel:', hotels[0]);

    const { data: rooms, error: rError } = await supabase.from('rooms').select('id, name').limit(1);
    if (rError) console.error('Room Error:', rError);
    else console.log('Room:', rooms[0]);

    const { data: packages, error: pError } = await supabase.from('packages').select('id, name').limit(1);
    if (pError) console.error('Package Error:', pError);
    else console.log('Package:', packages[0]);
}

fetchIds();
