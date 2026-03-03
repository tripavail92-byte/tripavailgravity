import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let val = trimmed.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function parseArgs(argv) {
  const args = {
    apply: false,
    limit: 500,
    onlyLive: true,
  }

  for (const token of argv.slice(2)) {
    if (token === '--apply') args.apply = true
    else if (token === '--all') args.onlyLive = false
    else if (token.startsWith('--limit=')) {
      const n = Number(token.slice('--limit='.length))
      if (Number.isFinite(n) && n > 0) args.limit = Math.floor(n)
    }
  }

  return args
}

function pickLatLng(location) {
  if (!location || typeof location !== 'object') return null

  const candidates = [
    { lat: location.latitude, lng: location.longitude },
    { lat: location.lat, lng: location.lng },
    { lat: location.Latitude, lng: location.Longitude },
    { lat: location.LAT, lng: location.LNG },
  ]

  for (const c of candidates) {
    const lat = typeof c.lat === 'number' ? c.lat : Number(c.lat)
    const lng = typeof c.lng === 'number' ? c.lng : Number(c.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng }
    }
  }

  return null
}

function formatAddress(location) {
  const city = typeof location?.city === 'string' ? location.city.trim() : ''
  const country = typeof location?.country === 'string' ? location.country.trim() : ''
  const formatted = `${city}${city && country ? ', ' : ''}${country}`.trim()
  return formatted || 'Unknown'
}

const args = parseArgs(process.argv)

const envRoot = readEnvFile(path.join(root, '.env'))
const envSupabaseSecrets = readEnvFile(path.join(root, 'supabase-secrets.env'))

const supabaseUrl =
  envRoot.VITE_SUPABASE_URL ||
  envRoot.NEXT_PUBLIC_SUPABASE_URL ||
  envSupabaseSecrets.EDGE_SUPABASE_URL

const serviceKey = envRoot.SUPABASE_SERVICE_ROLE_KEY || envSupabaseSecrets.SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars for service access:')
  console.error(' - URL: VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL / EDGE_SUPABASE_URL')
  console.error(' - KEY: SUPABASE_SERVICE_ROLE_KEY / SERVICE_ROLE_KEY')
  process.exit(2)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log('Backfill Tour Pickup Locations')
console.log('Mode:', args.apply ? 'APPLY' : 'DRY RUN')
console.log('Scope:', args.onlyLive ? 'live tours only' : 'all tours')
console.log('Limit:', args.limit)

const tourSelect = 'id,title,location,is_active,is_published,status'
let tourQuery = supabase.from('tours').select(tourSelect).limit(args.limit)
if (args.onlyLive) {
  tourQuery = tourQuery.eq('is_active', true).eq('is_published', true).eq('status', 'live')
}

const { data: tours, error: toursError } = await tourQuery
if (toursError) {
  console.error('Failed to fetch tours:', toursError.message)
  process.exit(1)
}

let scanned = 0
let eligible = 0
let inserted = 0
let skippedNoCoords = 0
let skippedHasPickup = 0

for (const tour of tours ?? []) {
  scanned++

  const { data: existingPickups, error: pickupError } = await supabase
    .from('tour_pickup_locations')
    .select('id')
    .eq('tour_id', tour.id)
    .limit(1)

  if (pickupError) {
    console.warn(`WARN: failed checking pickups for tour ${tour.id}:`, pickupError.message)
    continue
  }

  if ((existingPickups ?? []).length > 0) {
    skippedHasPickup++
    continue
  }

  const coords = pickLatLng(tour.location)
  if (!coords) {
    skippedNoCoords++
    continue
  }

  eligible++

  const payload = {
    tour_id: tour.id,
    title: 'Main Pickup',
    formatted_address: formatAddress(tour.location),
    city: typeof tour.location?.city === 'string' ? tour.location.city : null,
    country: typeof tour.location?.country === 'string' ? tour.location.country : null,
    latitude: coords.lat,
    longitude: coords.lng,
    google_place_id: null,
    pickup_time: null,
    notes: 'Backfilled from tours.location coordinates',
    is_primary: true,
  }

  if (!args.apply) {
    console.log(`DRY: would insert pickup for tour ${tour.id} (${tour.title ?? 'Untitled'})`) 
    continue
  }

  const { error: insertError } = await supabase.from('tour_pickup_locations').insert(payload)
  if (insertError) {
    console.warn(`WARN: failed inserting pickup for tour ${tour.id}:`, insertError.message)
    continue
  }

  inserted++
}

console.log('---')
console.log('Scanned tours:', scanned)
console.log('Eligible (had coords, no pickups):', eligible)
console.log('Inserted:', inserted)
console.log('Skipped (already had pickup):', skippedHasPickup)
console.log('Skipped (no coords in tours.location):', skippedNoCoords)

if (!args.apply) {
  console.log('---')
  console.log('To apply changes, re-run with:')
  console.log('  node scripts/backfill-tour-pickups.mjs --apply')
}
