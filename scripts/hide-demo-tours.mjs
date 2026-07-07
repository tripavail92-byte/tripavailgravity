// Hide demo/seed tours so the user's REAL tours lead Home — the runnable
// version of scripts/hide-demo-tours.sql. No service key needed: each demo
// tour is updated by signing in as its OWNER (RLS-permitted owner update).
// Flags only (is_featured/is_published) — nothing is deleted.
import { createClient } from '@supabase/supabase-js'

const url = 'https://zkhppxjeaizpyinfpecj.supabase.co'
const anon =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzA5NDIsImV4cCI6MjA4NTIwNjk0Mn0.UWo3pVif2zsN44kAjyYWwhU48XcmC4RPTiw5GSYq1rg'

const DEMO_TITLES = [
  'Swiss Alps Paragliding Experience',
  'Tokyo Street Food & Culture Tour',
  'Historic Rome Walking Tour',
  'Bali Waterfall & Rice Terrace Adventure',
  'Grand Canyon Sunset Adventure',
  'Test',
  'afsdf asdfsfsdfsdf',
  'Phase 6 QA Promo Deposit + Refund Tour',
]

// Known seeded operator credentials (scripts/create-auth-users.mjs + QA docs).
const OWNER_LOGINS = [
  { email: 'bali-adventures@tripavail.demo', password: 'demo123' },
  { email: 'cultural-tours@tripavail.demo', password: 'demo123' },
  { email: 'extreme-sports@tripavail.demo', password: 'demo123' },
  { email: 'paradise-hotels@tripavail.demo', password: 'demo123' },
  { email: 'luxury-stays@tripavail.demo', password: 'demo123' },
  { email: 'phase6-operator-qa@tripavail.test', password: 'Phase6-Operator-QA_2026!' },
]

const anonClient = createClient(url, anon, { auth: { persistSession: false } })

// 1. Find the demo tours + their owners (public read).
const { data: targets, error } = await anonClient
  .from('tours')
  .select('id,title,operator_id,is_featured,is_published,status')
  .in('title', DEMO_TITLES)
if (error) throw error
console.log(`Found ${targets.length} demo-titled tours.`)

const byOwner = new Map()
for (const t of targets) {
  const list = byOwner.get(t.operator_id) ?? []
  list.push(t)
  byOwner.set(t.operator_id, list)
}

// 2. Sign in as each known owner and hide THEIR tours.
const hidden = []
const ownerIds = new Map()
for (const cred of OWNER_LOGINS) {
  const client = createClient(url, anon, { auth: { persistSession: false } })
  const { data: si, error: siErr } = await client.auth.signInWithPassword(cred)
  if (siErr) {
    console.log(`  ${cred.email}: sign-in failed (${siErr.message})`)
    continue
  }
  const uid = si.user.id
  ownerIds.set(uid, cred.email)
  const mine = byOwner.get(uid) ?? []
  for (const tour of mine) {
    const { error: upErr } = await client
      .from('tours')
      .update({ is_featured: false, is_published: false })
      .eq('id', tour.id)
      .eq('operator_id', uid)
    if (upErr) console.log(`  FAILED ${tour.title}: ${upErr.message}`)
    else {
      hidden.push(tour.title)
      console.log(`  hidden: "${tour.title}" (owner ${cred.email})`)
    }
  }
  await client.auth.signOut()
}

// 3. Report anything left over (owned by accounts we don't control).
const leftovers = targets.filter((t) => !hidden.includes(t.title) || targets.filter((x) => x.title === t.title).length > 1)
const { data: after } = await anonClient
  .from('tours')
  .select('title,operator_id,is_published,is_featured')
  .in('title', DEMO_TITLES)
  .eq('is_published', true)
console.log(`\nStill visible after cleanup: ${after?.length ?? 0}`)
for (const t of after ?? []) {
  console.log(`  REMAINING: "${t.title}" — owner ${t.operator_id} (not one of the demo accounts)`)
}
