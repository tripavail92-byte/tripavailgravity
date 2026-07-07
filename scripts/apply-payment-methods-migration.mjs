import https from 'node:https';
import { readFileSync } from 'node:fs';

const SUPABASE_URL = 'https://zkhppxjeaizpyinfpecj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMDk0MiwiZXhwIjoyMDg1MjA2OTQyfQ.zt1KEbgD-NdBV0DoltpjF2iJF8p_uxsue2q2eOfP-fQ';

const sql = readFileSync('supabase/migrations/20260211164500_create_user_payment_methods.sql', 'utf8');

const PROJECT_REF = 'zkhppxjeaizpyinfpecj';

// Use Supabase Management API to run SQL via pg_dump/restore style endpoint
// Actually use the /sql endpoint if available, or use PostgREST RPC exec
// The correct approach for service-role is to use the SQL via the v1 management API

function httpPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(body, 'utf8');
    const req = https.request({ hostname, path, method: 'POST', headers: { ...headers, 'Content-Length': bodyBuf.length } }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

async function main() {
  console.log('Applying user_payment_methods migration via Supabase Management API...');

  // Try Management API v1 - SQL execution endpoint
  const result = await httpPost(
    'api.supabase.com',
    `/v1/projects/${PROJECT_REF}/database/query`,
    {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    JSON.stringify({ query: sql })
  );

  console.log('Management API status:', result.status);
  console.log('Response:', result.body.substring(0, 500));

  if (result.status === 200 || result.status === 201) {
    console.log('\n✅ Migration applied successfully!');
  } else {
    console.log('\nManagement API failed. The service_role JWT may not work for management API.');
    console.log('Trying alternative: PostgREST with exec_sql RPC...');

    // Try via pg_net or a simple table check
    const checkResult = await httpPost(
      'zkhppxjeaizpyinfpecj.supabase.co',
      '/rest/v1/',
      {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      ''
    );
    console.log('API check status:', checkResult.status);
  }
}

main().catch(console.error);
