import { supabase } from '../packages/shared/src/core/client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260209_tour_operator_persistence.sql');
    console.log(`🔄 Reading migration from: ${migrationPath}`);

    try {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log('📤 Executing SQL migration...');

        const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

        if (error) {
            console.error('❌ Error applying migration:', error);
            process.exit(1);
        }

        console.log('✅ Migration applied successfully!');
        console.log('🎉 Tour Operator Persistence is now LIVE.');
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        process.exit(1);
    }
}

applyMigration();
