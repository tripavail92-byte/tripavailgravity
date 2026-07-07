// Read-only check of the documented QA partner accounts before driving the app.
// Confirms password works and reports active role + partner_type. No writes.
import { createClient } from '@supabase/supabase-js'

const url = 'https://zkhppxjeaizpyinfpecj.supabase.co'
const anon =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzA5NDIsImV4cCI6MjA4NTIwNjk0Mn0.UWo3pVif2zsN44kAjyYWwhU48XcmC4RPTiw5GSYq1rg'

const ACCOUNTS = [
  { label: 'Tour Operator', email: 'phase6-operator-qa@tripavail.test', password: 'Phase6-Operator-QA_2026!' },
  { label: 'Hotel Manager', email: 'coastal-retreats@tripavail.demo', password: 'demo123' },
]

for (const acct of ACCOUNTS) {
  const supabase = createClient(url, anon, { auth: { persistSession: false } })
  const { data, error } = await supabase.auth.signInWithPassword({ email: acct.email, password: acct.password })
  if (error) {
    console.log(`\n${acct.label} <${acct.email}>: SIGN-IN FAILED — ${error.message}`)
    continue
  }
  const uid = data.user.id
  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from('user_roles').select('role_type,is_active').eq('user_id', uid),
    supabase.from('profiles').select('partner_type').eq('id', uid).maybeSingle(),
  ])
  const active = (roles ?? []).find((r) => r.is_active)?.role_type
  console.log(`\n${acct.label} <${acct.email}>:`)
  console.log(`  uid=${uid}`)
  console.log(`  partner_type=${profile?.partner_type ?? '(none)'}`)
  console.log(`  active_role=${active ?? '(none)'}  roles=[${(roles ?? []).map((r) => r.role_type + (r.is_active ? '*' : '')).join(', ')}]`)

  // Count their owned listings (read-only) so we know there's content to show.
  if (profile?.partner_type === 'tour_operator' || acct.label === 'Tour Operator') {
    const { count } = await supabase.from('tours').select('*', { count: 'exact', head: true }).eq('operator_id', uid)
    console.log(`  owned tours=${count ?? 0}`)
  }
  if (profile?.partner_type === 'hotel_manager' || acct.label === 'Hotel Manager') {
    const { count: hc } = await supabase.from('hotels').select('*', { count: 'exact', head: true }).eq('owner_id', uid)
    const { count: pc } = await supabase.from('packages').select('*', { count: 'exact', head: true }).eq('owner_id', uid)
    console.log(`  owned hotels=${hc ?? 0}  packages=${pc ?? 0}`)
  }
  await supabase.auth.signOut()
}
