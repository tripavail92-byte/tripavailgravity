// Map known dev/seed accounts → uid so we can find who owns the demo tours.
import { createClient } from '@supabase/supabase-js'
const url = 'https://zkhppxjeaizpyinfpecj.supabase.co'
const anon =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzA5NDIsImV4cCI6MjA4NTIwNjk0Mn0.UWo3pVif2zsN44kAjyYWwhU48XcmC4RPTiw5GSYq1rg'

const TARGETS = ['af63810f-2b8b-4aed-95b1-7ac809263dfd', 'e77bf152-9303-435f-8fb5-2cacd7924937']
const CREDS = [
  { email: 'traveler@test.com', password: 'demo123' },
  { email: 'paradise-hotels@tripavail.demo', password: 'demo123' },
  { email: 'luxury-stays@tripavail.demo', password: 'demo123' },
  { email: 'coastal-retreats@tripavail.demo', password: 'demo123' },
  { email: 'bali-adventures@tripavail.demo', password: 'demo123' },
  { email: 'cultural-tours@tripavail.demo', password: 'demo123' },
  { email: 'extreme-sports@tripavail.demo', password: 'demo123' },
]

for (const c of CREDS) {
  const sb = createClient(url, anon, { auth: { persistSession: false } })
  const { data, error } = await sb.auth.signInWithPassword(c)
  if (error) { console.log(`${c.email}: sign-in failed (${error.message})`); continue }
  const uid = data.user.id
  const match = TARGETS.includes(uid) ? '  <<< OWNS DEMO TOURS' : ''
  console.log(`${c.email} → ${uid}${match}`)
  await sb.auth.signOut()
}
