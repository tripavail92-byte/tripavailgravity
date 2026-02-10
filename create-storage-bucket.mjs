import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue

    const key = line.slice(0, eqIdx).trim()
    let value = line.slice(eqIdx + 1).trim()

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) process.env[key] = value
  }
}

loadDotEnv(path.resolve(process.cwd(), '.env'))

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('Missing Supabase URL. Set VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in .env')
  process.exit(1)
}

if (!supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env (required to create buckets)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function createBucket() {
  try {
    console.log('Creating storage bucket "user-avatars"...')
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('user-avatars', { public: true })

    if (error) {
      const msg = String(error.message || error)
      if (!/already exists/i.test(msg) && error.statusCode !== 409) {
        console.error('Error creating bucket:', error)
        process.exit(1)
      }
      console.log('ℹ️  Bucket already exists, continuing...')
    } else {
      console.log('✅ Bucket created successfully')
    }

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) {
      console.error('Error listing buckets:', listError)
      process.exit(1)
    }

    const exists = (buckets || []).some((b) => b.name === 'user-avatars')
    if (!exists) {
      console.error('Bucket was not found after creation attempt')
      process.exit(1)
    }

    console.log('🎉 Storage bucket "user-avatars" is ready')
    console.log('Next: run the storage policy migration in supabase/migrations to allow uploads')
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

createBucket()
