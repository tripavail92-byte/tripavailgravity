// Hide ALL demo/seed tours by title using the documented admin account
// (admin RLS permits updating any tour). User-authorized cleanup. Flags only.
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

const sb = createClient(url, anon, { auth: { persistSession: false } })
const { data: si, error: siErr } = await sb.auth.signInWithPassword({
  email: 'rbac-admin@tripavail.test',
  password: 'Test-Only_RBAC_Admin_2026!ChangeMe',
})
if (siErr) {
  console.log(`admin sign-in failed: ${siErr.message}`)
  process.exit(1)
}
console.log(`admin signed in: ${si.user.id}`)

const { data: updated, error } = await sb
  .from('tours')
  .update({ is_featured: false, is_published: false })
  .in('title', DEMO_TITLES)
  .select('id,title')
if (error) {
  console.log(`update failed: ${error.message}`)
  process.exit(1)
}
console.log(`updated ${updated?.length ?? 0} rows`)

// Verify what's still published under those titles (anon view).
const { data: after } = await sb
  .from('tours')
  .select('title')
  .in('title', DEMO_TITLES)
  .eq('is_published', true)
console.log(`still published after cleanup: ${after?.length ?? 0}`)
await sb.auth.signOut()
