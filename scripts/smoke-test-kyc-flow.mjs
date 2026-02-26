import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function loadDotenv(dotenvPath) {
  const env = {};
  if (!fs.existsSync(dotenvPath)) return env;

  const raw = fs.readFileSync(dotenvPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function requireEnv(env, key) {
  const value = env[key] ?? process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

function optionalEnv(env, key) {
  return env[key] ?? process.env[key] ?? null;
}

function randomEmail() {
  const suffix = crypto.randomBytes(8).toString('hex');
  return `smoke.kyc.${suffix}@tripavail.local`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mask(value) {
  if (!value || typeof value !== 'string') return null;
  if (value.length <= 16) return `${value.slice(0, 4)}…`;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

async function callFunctionJson({ supabaseUrl, anonKey, functionName, body }) {
  const url = `${supabaseUrl}/functions/v1/${functionName}`;
  const headers = {
    apikey: anonKey,
    'content-type': 'application/json',
  };
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { ok: res.ok, status: res.status, body: json };
}

async function fetchSessionByToken({ supabaseUrl, anonKey, token }) {
  const url = `${supabaseUrl}/functions/v1/kyc-session?session_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { method: 'GET', headers: { apikey: anonKey } });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { ok: res.ok, status: res.status, body: json };
}

async function uploadImageBase64({ supabaseUrl, anonKey, token, field, filePath }) {
  const bytes = fs.readFileSync(filePath);
  const b64 = bytes.toString('base64');
  return await callFunctionJson({
    supabaseUrl,
    anonKey,
    functionName: 'kyc-mobile-upload',
    body: { session_token: token, field, image: b64 },
  });
}

async function main() {
  const repoRoot = path.resolve(process.cwd());
  const dotenvPath = path.join(repoRoot, '.env');
  const dotenv = loadDotenv(dotenvPath);

  const supabaseUrl = requireEnv(dotenv, 'VITE_SUPABASE_URL');
  const anonKey = requireEnv(dotenv, 'VITE_SUPABASE_ANON_KEY');
  const serviceRoleKey = requireEnv(dotenv, 'SUPABASE_SERVICE_ROLE_KEY');

  // Optional: your deployed web origin on Railway (used to validate the QR target URL resolves)
  // Example: https://tripavail-web-production.up.railway.app
  const webOrigin = (optionalEnv(dotenv, 'KYC_TEST_WEB_ORIGIN') ?? '').toString().replace(/\/$/, '') || null;

  const frontPath = optionalEnv(dotenv, 'KYC_TEST_FRONT');
  const backPath = optionalEnv(dotenv, 'KYC_TEST_BACK');

  const role = (optionalEnv(dotenv, 'KYC_TEST_ROLE') ?? 'tour_operator').toString();
  if (!['tour_operator', 'hotel_manager'].includes(role)) {
    throw new Error(`KYC_TEST_ROLE must be tour_operator or hotel_manager (got: ${role})`);
  }

  const email = randomEmail();
  const password = `T3st!${crypto.randomBytes(8).toString('hex')}`;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('--- KYC smoke test (OCR-only + admin review) ---');
  console.log('Supabase:', supabaseUrl);
  console.log('Role:', role);

  // 1) Create user
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw new Error(`admin.createUser failed: ${createError.message}`);
  const userId = created?.user?.id;
  if (!userId) throw new Error('admin.createUser returned no user id');
  console.log('Created user:', userId, email);

  // 2) Create KYC session
  const { data: session, error: sessionErr } = await admin
    .from('kyc_sessions')
    .insert({ user_id: userId, role })
    .select('id, session_token, status, expires_at')
    .single();
  if (sessionErr) throw new Error(`Failed to create kyc_sessions row: ${sessionErr.message}`);
  if (!session?.session_token) throw new Error('Session token missing from inserted row');

  const token = session.session_token;
  console.log('KYC session:', session.id);
  console.log('Session token:', mask(token));
  console.log('Token session endpoint:', `${supabaseUrl.replace(/\/$/, '')}/functions/v1/kyc-session?session_token=${encodeURIComponent(token)}`);

  if (webOrigin) {
    const mobilePageUrl = `${webOrigin}/kyc/mobile?session=${encodeURIComponent(token)}`;
    console.log('QR target (mobile page):', mobilePageUrl);

    const pageRes = await fetch(mobilePageUrl, { method: 'GET' });
    console.log('GET /kyc/mobile =>', pageRes.status);
    if (!pageRes.ok) {
      const body = await pageRes.text();
      throw new Error(`Mobile page did not load (${pageRes.status}): ${body.slice(0, 200)}`);
    }
  } else {
    console.log('QR target (mobile page): (skipped) set KYC_TEST_WEB_ORIGIN to validate Railway URL');
  }

  // 3) Fetch via token function
  const initial = await fetchSessionByToken({ supabaseUrl, anonKey, token });
  console.log('kyc-session initial:', initial.status, initial.body?.status ?? initial.body);
  if (!initial.ok) throw new Error(`kyc-session failed: ${JSON.stringify(initial.body)}`);

  // 4) Upload images
  if (!frontPath || !backPath) {
    console.log('\nNOTE: KYC_TEST_FRONT and KYC_TEST_BACK are not set; skipping uploads.');
    console.log('Set them to real image file paths (jpg/png) to test uploads + OCR worker.');
    console.log('Example (PowerShell):');
    console.log('  $env:KYC_TEST_FRONT="D:\\path\\cnic-front.jpg"');
    console.log('  $env:KYC_TEST_BACK ="D:\\path\\cnic-back.jpg"');
    console.log('  node scripts/smoke-test-kyc-flow.mjs');
    return;
  }

  if (!fs.existsSync(frontPath)) throw new Error(`KYC_TEST_FRONT not found: ${frontPath}`);
  if (!fs.existsSync(backPath)) throw new Error(`KYC_TEST_BACK not found: ${backPath}`);

  const up1 = await uploadImageBase64({ supabaseUrl, anonKey, token, field: 'id_front', filePath: frontPath });
  console.log('upload id_front:', up1.status, up1.body?.status ?? up1.body);
  if (!up1.ok) throw new Error(`id_front upload failed: ${JSON.stringify(up1.body)}`);

  const up2 = await uploadImageBase64({ supabaseUrl, anonKey, token, field: 'id_back', filePath: backPath });
  console.log('upload id_back :', up2.status, up2.body?.status ?? up2.body);
  if (!up2.ok) throw new Error(`id_back upload failed: ${JSON.stringify(up2.body)}`);

  // 5) Poll until worker finishes (pending_admin_review or failed)
  console.log('\nPolling status (requires python worker running)…');
  const deadline = Date.now() + 3 * 60 * 1000;
  let lastStatus = null;
  while (Date.now() < deadline) {
    const s = await fetchSessionByToken({ supabaseUrl, anonKey, token });
    if (!s.ok) throw new Error(`kyc-session poll failed: ${JSON.stringify(s.body)}`);

    const status = s.body?.status;
    if (status && status !== lastStatus) {
      lastStatus = status;
      console.log('status =>', status, s.body?.failure_code ? `(failure_code=${s.body.failure_code})` : '');
    }

    if (['pending_admin_review', 'failed', 'approved', 'rejected', 'expired'].includes(status)) {
      break;
    }
    await sleep(2000);
  }

  // 6) Print extracted fields (service role, for debugging)
  const { data: finalRow, error: finalErr } = await admin
    .from('kyc_sessions')
    .select('status, failure_code, failure_reason, cnic_number, full_name, father_name, date_of_birth, expiry_date, id_front_path, id_back_path, reviewed_by, reviewed_at')
    .eq('session_token', token)
    .single();
  if (finalErr) throw new Error(`Failed to load final session row: ${finalErr.message}`);

  console.log('\nFinal row (debug):');
  console.log(JSON.stringify(finalRow, null, 2));

  console.log('\nDone. Next manual step: open /admin/kyc and approve/reject this session.');
}

main().catch((err) => {
  console.error('KYC smoke test failed:', err?.message ?? err);
  process.exit(1);
});
