import https from 'node:https';
import { readFileSync } from 'node:fs';

// Load service role key from env file to avoid syntax issues with backticks in JWT
const envText = readFileSync('supabase-secrets.env', 'utf8');
const SERVICE_ROLE_KEY = envText.split('\n').find(l => l.startsWith('SERVICE_ROLE_KEY=')).split('=').slice(1).join('=').trim();
const PROJECT_REF = 'zkhppxjeaizpyinfpecj';

console.log('Key loaded, length:', SERVICE_ROLE_KEY.length);

// Try different Management API endpoints
async function tryEndpoint(hostname, path, method, authHeader, body) {
  return new Promise((resolve, reject) => {
    const bodyBuf = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;
    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    };
    if (bodyBuf) headers['Content-Length'] = bodyBuf.length;
    
    const req = https.request({ hostname, path, method, headers }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data.substring(0, 400) }));
    });
    req.on('error', reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

// Test 1: Management API with service_role as bearer
let r = await tryEndpoint(
  'api.supabase.com',
  `/v1/projects/${PROJECT_REF}/database/query`,
  'POST',
  `Bearer ${SERVICE_ROLE_KEY}`,
  { query: 'SELECT 1 AS test' }
);
console.log('Management API /database/query status:', r.status, r.body);

// Test 2: Try the pg-meta endpoint  
r = await tryEndpoint(
  `${PROJECT_REF}.supabase.co`,
  '/pg-meta/v1/query',
  'POST',
  `Bearer ${SERVICE_ROLE_KEY}`,
  { query: 'SELECT 1 AS test' }
);
console.log('pg-meta /query status:', r.status, r.body);
