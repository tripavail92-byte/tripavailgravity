import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

// Load env
const envContents = fs.readFileSync(path.join(process.cwd(), 'supabase-secrets.env'), 'utf8');
const env = {};
for (const line of envContents.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 0) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const webEnv = fs.existsSync('packages/web/.env') ? fs.readFileSync('packages/web/.env', 'utf8') : '';
for (const line of webEnv.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq).trim();
  if (!env[key]) env[key] = trimmed.slice(eq + 1).trim();
}

const SERVICE_ROLE_KEY = env.SERVICE_ROLE_KEY;
const SUPABASE_URL = env.EDGE_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const host = new URL(SUPABASE_URL).hostname;

console.log('Connecting to:', host);
console.log('Service key present:', !!SERVICE_ROLE_KEY);

// Read the migration SQL
const sql = fs.readFileSync('supabase/migrations/20260211164500_create_user_payment_methods.sql', 'utf8');

// Use Management API to run SQL
const body = JSON.stringify({ query: sql });

const options = {
  hostname: host,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
};

console.log('Attempting via REST exec_sql...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data.substring(0, 1000));
    if (res.statusCode !== 200) {
      console.log('\nFalback: trying pg simple insert test...');
    }
  });
});
req.on('error', e => console.error('Error:', e));
req.write(body);
req.end();
