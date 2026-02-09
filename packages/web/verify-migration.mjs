import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkhppxjeaizpyinfpecj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMDk0MiwiZXhwIjoyMDg1MjA2OTQyfQ.zt1KEbgD-NdBV0DoltpjF2iJF8p_uxsue2q2eOfP-fQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('--- DB VERIFICATION ---');
    try {
        const { data, error } = await supabase
            .from('tour_operator_profiles')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Migration might not be fully active or RLS is blocking.');
            console.error('Error:', error.message);
        } else {
            const firstRow = data[0] || {};
            const keys = Object.keys(firstRow);
            console.log('Available columns in tour_operator_profiles:', keys);

            const expectedKeys = ['first_name', 'email', 'setup_completed', 'policies'];
            const missing = expectedKeys.filter(k => !keys.includes(k));

            if (missing.length === 0) {
                console.log('✅ ALL NEW COLUMNS VERIFIED!');
            } else {
                // If table is empty, we check the RPC for schema info
                console.log('Checking schema via RPC...');
                const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
                    sql_string: "SELECT column_name FROM information_schema.columns WHERE table_name = 'tour_operator_profiles'"
                });

                if (schemaError) {
                    console.error('Failed to query schema info.');
                } else {
                    const colNames = schemaData.map(c => c.column_name);
                    console.log('Columns from schema:', colNames);
                    const missingFromSchema = expectedKeys.filter(k => !colNames.includes(k));
                    if (missingFromSchema.length === 0) {
                        console.log('✅ ALL NEW COLUMNS VERIFIED VIA SCHEMA!');
                    } else {
                        console.error('❌ STILL MISSING:', missingFromSchema);
                    }
                }
            }
        }
    } catch (e) {
        console.error('Fatal error:', e);
    }
}

verify();
