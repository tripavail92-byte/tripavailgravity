import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkhppxjeaizpyinfpecj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMDk0MiwiZXhwIjoyMDg1MjA2OTQyfQ.zt1KEbgD-NdBV0DoltpjF2iJF8p_uxsue2q2eOfP-fQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
    console.log('🔍 Verifying tour_operator_profiles schema...');

    // Check if columns exist by trying to select them
    const { data, error } = await supabase
        .from('tour_operator_profiles')
        .select('first_name, email, setup_completed, policies')
        .limit(1);

    if (error) {
        if (error.message.includes('column') || error.code === '42703') {
            console.error('❌ Verification failed: One or more columns are missing.');
            console.error('Error:', error.message);
        } else if (error.code === 'PGRST116') {
            // This is fine, it just means no data yet but columns exist
            console.log('✅ Columns confirmed! (Table is empty which is expected)');
        } else {
            console.error('❌ Error checking schema:', error);
        }
    } else {
        console.log('✅ Migration verified! Core columns are accessible.');
    }
}

verifyMigration();
