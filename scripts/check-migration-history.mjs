import https from 'node:https';

const SUPABASE_URL = 'https://zkhppxjeaizpyinfpecj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMDk0MiwiZXhwIjoyMDg1MjA2OTQyfQ.zt1KEbgD-NdBV0DoltpjF2iJF8p_uxsue2q2eOfP-fQ';

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'zkhppxjeaizpyinfpecj.supabase.co',
      path,
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

// Query supabase_migrations.schema_migrations to see what's recorded
// via the REST API (supabase internal schema is not exposed via PostgREST usually)
// Let's try to read from supabase_migrations schema via REST

const r = await httpGet('/rest/v1/schema_migrations?select=version&order=version.asc&limit=100');
console.log('schema_migrations status:', r.status);
if (r.status === 200) {
  const rows = JSON.parse(r.body);
  console.log('Applied migrations:');
  rows.forEach(row => console.log(' -', row.version));
} else {
  console.log('Response:', r.body.substring(0, 300));
}
