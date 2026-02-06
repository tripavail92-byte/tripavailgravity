const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials in .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const sql = `
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS draft_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.hotels.draft_data IS 'Stores complete form data for draft listings to enable resuming listing creation';
  `;

    try {
        // Execute the SQL using the Supabase SQL query endpoint
        const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

        if (error) {
            console.error('Error running migration:', error);
            process.exit(1);
        }

        console.log('✅ Migration applied successfully!');
        console.log('draft_data column added to hotels table');
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

runMigration();
