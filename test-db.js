const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

function getEnv() {
  const content = fs.readFileSync('packages/web/.env', 'utf-8')
  const env = {}
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) env[match[1]] = match[2].trim()
  })
  return env
}

const env = getEnv()
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(5)
  console.log("Profiles matching partners:", data?.length, error)
  console.log(data)
  
  const { data: roles, error: rolesErr } = await supabase.from('user_roles').select('*').in('role_type', ['hotel_manager', 'tour_operator'])
  console.log("Partner roles:", roles?.length, rolesErr)
  console.log(roles)
}

testProfiles()
