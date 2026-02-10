import fs from "node:fs";
import path from "node:path";

function parseDotEnv(contents) {
  const env = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function loadEnvFileIfPresent(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const parsed = parseDotEnv(fs.readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] == null || process.env[key] === "") {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

loadEnvFileIfPresent(path.resolve(process.cwd(), ".env"));
loadEnvFileIfPresent(path.resolve(process.cwd(), "packages/web/.env"));

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function maskSecret(secret) {
  if (!secret) return "";
  const start = secret.slice(0, 6);
  const end = secret.slice(-6);
  return `${start}…${end} (len=${secret.length})`;
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing Supabase credentials. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL/VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
  );
  process.exit(1);
}

console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Service role key: ${maskSecret(SERVICE_ROLE_KEY)}`);

const users = [
  "paradise-hotels@tripavail.demo",
  "luxury-stays@tripavail.demo",
  "coastal-retreats@tripavail.demo",
  "bali-adventures@tripavail.demo",
  "cultural-tours@tripavail.demo",
  "extreme-sports@tripavail.demo",
  "traveler@test.com", // Test traveler for Stripe flow testing
];

const defaultPassword = "demo123";

async function createUser(email) {
  // Prefer the official Supabase admin client when available.
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        seeded_by: "create-auth-users.mjs",
      },
    });

    if (error) {
      // If already exists, treat as success.
      const msg = error.message || "Unknown error";
      if (msg.toLowerCase().includes("already") && msg.toLowerCase().includes("registered")) {
        return { id: "(already-exists)" };
      }
      throw new Error(`${email}: ${msg}`);
    }

    return data?.user;
  } catch (e) {
    // Fallback to direct HTTP if @supabase/supabase-js isn't resolvable.
    if (e?.code && e.code !== "ERR_MODULE_NOT_FOUND") {
      throw e;
    }
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        seeded_by: "create-auth-users.mjs",
      },
    }),
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.msg || payload?.error_description || payload?.error || text || "Unknown error";
    throw new Error(`${email}: HTTP ${response.status} ${response.statusText} - ${message}`);
  }

  return payload;
}

async function run() {
  console.log("Creating demo auth users...");
  for (const email of users) {
    try {
      const user = await createUser(email);
      console.log(`Created: ${email} (id: ${user.id})`);
    } catch (error) {
      console.error(`Failed: ${email} -> ${error.message}`);
    }
  }
  console.log("Done.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
