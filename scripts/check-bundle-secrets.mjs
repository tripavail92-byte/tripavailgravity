#!/usr/bin/env node
/**
 * Fails the build if a secret-shaped string reaches the public browser bundle.
 *
 * WHY THIS EXISTS. On 2026-07-21 the production bundle at tripavail.com/assets/index-*.js was
 * found to contain a live OpenAI project secret key. The cause was a single line in .env:
 *
 *     VITE_OPENAI_API_KEY=sk-proj-...
 *
 * Vite inlines EVERY variable prefixed VITE_ into the client bundle — that is what the prefix
 * means. No code read the variable; its mere presence was enough. The key was readable by any
 * visitor for as long as that build was live.
 *
 * A code review cannot catch this, because the mistake is in an untracked .env file and the
 * damage happens at bundle time. So the check belongs here, against the built output.
 *
 * Run automatically after `vite build`. Exits non-zero on a finding, and never prints the secret.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = process.argv[2] ?? 'packages/web/dist'

/**
 * Patterns that are secrets by construction. Deliberately narrow: a false positive blocks a
 * deploy, so each entry matches a shape that is only ever produced by a credential issuer.
 */
const PATTERNS = [
  { name: 'OpenAI secret key', re: /\bsk-(proj-)?[A-Za-z0-9_-]{20,}/ },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'Stripe SECRET key', re: /\bsk_(live|test)_[A-Za-z0-9]{20,}/ },
  { name: 'Stripe restricted key', re: /\brk_(live|test)_[A-Za-z0-9]{20,}/ },
  { name: 'Resend API key', re: /\bre_[A-Za-z0-9]{16,}_[A-Za-z0-9]{16,}/ },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Meta/WhatsApp access token', re: /\bEAA[A-Za-z0-9]{60,}/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { name: 'Google service-account private key', re: /-----BEGIN (RSA )?PRIVATE KEY-----/ },
  { name: 'Supabase service_role JWT', re: /"role"\s*:\s*"service_role"/ },
]

/**
 * The anon key is a JWT with role "anon" and is MEANT to be public — it is how the browser talks
 * to Supabase, and RLS is what protects the data behind it. Same for the Stripe *publishable* key
 * and the Google Maps browser key (which must instead be locked down by HTTP referrer in the Cloud
 * console). None of these are findings.
 */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(js|mjs|cjs|css|html|map)$/.test(entry)) out.push(full)
  }
  return out
}

let files
try {
  files = walk(DIST)
} catch {
  console.error(`[check-bundle-secrets] Cannot read ${DIST}. Run the build first.`)
  process.exit(1)
}

const findings = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const { name, re } of PATTERNS) {
    const m = text.match(re)
    if (!m) continue
    const hit = m[0]
    // Report the shape only — never the value.
    const redacted =
      hit.length > 12 ? `${hit.slice(0, 7)}…${hit.slice(-4)} (${hit.length} chars)` : '(short match)'
    findings.push({ file, name, redacted })
  }
}

if (findings.length === 0) {
  console.log(`[check-bundle-secrets] OK — scanned ${files.length} files, no secrets in the bundle.`)
  process.exit(0)
}

console.error('\n[check-bundle-secrets] SECRET FOUND IN PUBLIC BUNDLE — build blocked.\n')
for (const f of findings) {
  console.error(`  ${f.name}`)
  console.error(`    file:  ${f.file}`)
  console.error(`    value: ${f.redacted}`)
}
console.error(
  [
    '',
    'Almost always this is a VITE_-prefixed variable in .env or in the host env (Railway).',
    'Every VITE_* variable is compiled into the browser bundle by design.',
    '',
    'To fix:',
    '  1. Rename the variable to drop the VITE_ prefix, so only server code can read it.',
    '  2. Remove it from the hosting provider env as well as your local .env.',
    '  3. ROTATE the exposed credential — it must be assumed compromised.',
    '  4. Rebuild and re-run this check.',
    '',
  ].join('\n'),
)
process.exit(1)
