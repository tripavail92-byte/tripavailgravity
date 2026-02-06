import { supabase } from '../packages/shared/src/core/client.js';
import fs from 'fs';

async function runMigration() {
    console.log('🔄 Running draft_data column migration...');

    const sql = `
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS draft_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.hotels.draft_data IS 'Stores complete form data for draft listings to enable resuming listing creation';
  `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

        if (error) {
            console.error('❌ Error running migration:', error);
            process.exit(1);
        }

        console.log('✅ Migration applied successfully!');
        console.log('✅ draft_data column added to hotels table');
        console.log('\n🎉 Save & Exit is now ready to use!');
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        process.exit(1);
    }
}

runMigration();
