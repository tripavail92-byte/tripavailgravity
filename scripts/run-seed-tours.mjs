import pg from 'pg';
import * as fs from 'fs';

const { Client } = pg;

// Connection string from Railway or local Supabase
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.vbjpcrytdiwxwemtmjpk:AWrtY39ZgqE6vAV6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function runSQL() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    const sql = fs.readFileSync('./scripts/seed-tours.sql', 'utf8');
    
    console.log('🚀 Executing SQL script...\n');
    await client.query(sql);
    
    // Check results
    const toursResult = await client.query('SELECT COUNT(*) as tour_count FROM public.tours WHERE is_active = true');
    const schedulesResult = await client.query('SELECT COUNT(*) as schedule_count FROM public.tour_schedules WHERE status = \'scheduled\'');
    
    console.log(`✅ Total active tours: ${toursResult.rows[0].tour_count}`);
    console.log(`✅ Total scheduled tour slots: ${schedulesResult.rows[0].schedule_count}\n`);
    
    console.log('🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSQL();
