import { supabase } from '@/lib/supabase'

/**
 * Listing copy composed from a curated fragment library.
 *
 * Replaces the generate-listing-copy model call. Fragments live in public.listing_copy_fragments
 * (see 20260721000001) so copy can be edited without a deploy; this module fetches the ones for a
 * category and stitches them together with the property's OWN data.
 *
 * The shape is: opener (from the library, category-specific) + detail (computed here from real
 * wizard input) + closer (from the library). ~70 rows therefore produce thousands of distinct
 * descriptions, and every one names something true about the actual property. A library of whole
 * descriptions could not do that — six guesthouses would publish the same paragraph.
 *
 * TWO RULES HOLD THE QUALITY UP:
 *   1. A fragment whose {placeholders} cannot all be filled is DROPPED, never rendered. Otherwise a
 *      half-finished wizard produces "A guesthouse in , run with genuine care."
 *   2. The detail sentence states only what the partner actually entered. Absent facts are omitted,
 *      never guessed.
 */

export type CopyKind = 'room' | 'property'

export interface CopyFragment {
  category: string
  slot: 'opener' | 'closer'
  body: string
}

/** Values a fragment body may reference as {name}, {city}, {country}, {roomName}. */
export type CopyVars = Record<string, string | undefined>

const PLACEHOLDER = /\{(\w+)\}/g

/**
 * Substitute {placeholders}. Returns null — meaning "discard this fragment" — if any placeholder
 * has no value. Rule 1 above; the null is the whole point of the return type.
 */
export function fillTemplate(body: string, vars: CopyVars): string | null {
  let unresolved = false
  const filled = body.replace(PLACEHOLDER, (_match, key: string) => {
    const value = vars[key]?.trim()
    if (!value) {
      unresolved = true
      return ''
    }
    return value
  })
  return unresolved ? null : filled
}

/**
 * Stable per-property offset, so two guesthouses do not both open with fragment #1. Without this
 * the first press would hand every partner in a category the same three suggestions — which is the
 * duplicate-copy problem the fragment approach exists to avoid.
 */
function seedFrom(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Bundled fallback so the button still works if the table is unreachable.
 *
 * Each pool is deliberately LARGER than the three suggestions shown, so that paging through it
 * actually reaches new text. An earlier version held exactly three openers and three closers,
 * which meant a fetch failure left "Show others" with nothing further to offer.
 */
const FALLBACK: Record<CopyKind, { openers: string[]; closers: string[] }> = {
  room: {
    openers: [
      'A comfortable, well-appointed room with everything you need for a restful stay.',
      'Thoughtfully arranged, with the space and quiet to properly unwind.',
      'A calm room that covers the essentials properly, without fuss.',
      'An easy room to settle into, kept simple and kept well.',
      'Quiet, comfortable and ready for a good night’s sleep.',
      'A restful space, arranged with a little more care than it strictly needed.',
    ],
    closers: [
      'It makes a straightforward, comfortable base for the time you are here.',
      'Whether you are staying one night or several, it is an easy room to settle into.',
      'Everything is checked and made ready ahead of each arrival.',
      'The aim is simple: a good night’s sleep and an unhurried morning.',
      'Do get in touch before you arrive if there is anything you would like arranged.',
    ],
  },
  property: {
    openers: [
      'A well-run property with consistent service and comfortable, properly maintained rooms.',
      'Straightforward hospitality: clean rooms, helpful staff and an easy check-in.',
      'A comfortable base, run with genuine care and an eye for the details that matter.',
      'Somewhere unfussy and well kept, where the essentials are taken seriously.',
      'A calm place to stay, run by people who pay attention.',
      'Comfortable rooms, a straightforward welcome and no unnecessary ceremony.',
    ],
    closers: [
      'Do get in touch if you have any questions before booking.',
      'We look forward to welcoming you.',
      'Whatever brings you to the area, you will have a comfortable base for it.',
      'Enquiries are always welcome, whatever the length of your stay.',
      'Rooms are prepared fresh for every arrival.',
    ],
  },
}

export async function fetchFragments(kind: CopyKind, category: string): Promise<CopyFragment[]> {
  const { data, error } = await supabase
    .from('listing_copy_fragments')
    .select('category, slot, body')
    .eq('kind', kind)
    .eq('is_active', true)
    // '*' rows apply to every category of this kind — that is where the shared closers live.
    .in('category', [category, '*'])

  if (error) throw error
  return (data ?? []) as CopyFragment[]
}

interface ComposeArgs {
  kind: CopyKind
  fragments: CopyFragment[]
  vars: CopyVars
  /**
   * Real facts, dropped between opener and closer. May be empty. Pass a function to vary it by
   * opener — some openers already name the city, and repeating it two sentences later reads badly.
   */
  detail: string | ((opener: string) => string)
  /** Distinguishes this property from others in the same category. */
  seed: string
  /** Incremented by "Show different options" to walk further through the library. */
  cycle?: number
  count?: number
}

export function composeSuggestions({
  kind,
  fragments,
  vars,
  detail,
  seed,
  cycle = 0,
  count = 3,
}: ComposeArgs): string[] {
  const resolve = (slot: 'opener' | 'closer') =>
    fragments
      .filter((f) => f.slot === slot)
      .map((f) => fillTemplate(f.body, vars))
      .filter((s): s is string => Boolean(s))

  let openers = resolve('opener')
  let closers = resolve('closer')

  // Empty means the fetch failed, the category has no rows yet, or every fragment needed a
  // placeholder the wizard has not collected. All three are recoverable.
  if (openers.length === 0) openers = FALLBACK[kind].openers
  if (closers.length === 0) closers = FALLBACK[kind].closers

  const base = seedFrom(seed)
  const out: string[] = []

  // Never ask for more suggestions than there are distinct openers. Dropping placeholder fragments
  // can leave only two survivors, and cycling three slots over two openers repeats the opening
  // sentence — which the full-text dedupe below does NOT catch, because the closers differ. Three
  // suggestions where two start identically reads as a bug. Fewer, distinct ones do not.
  const wanted = Math.min(count, openers.length)

  for (let i = 0; i < wanted; i++) {
    // Openers paginate: each press of "Show others" advances a whole page through the library.
    const opener = openers[(base + cycle * wanted + i) % openers.length]

    // Closers advance by exactly ONE per press — deliberately NOT by `wanted`.
    //
    // This line previously read (base + cycle * wanted) * 2 + i, i.e. both indices stepped by a
    // multiple of `wanted`. That is inert whenever the pool size divides the stride, and the
    // production shape hits it exactly: on the first pass through the wizard the city is not
    // known yet, one opener per category is dropped for its unfillable {city}, leaving 3 openers
    // against a count of 3 and 6 closers against a closer stride of 6. Both indices then reduce
    // to the same values on every cycle and "Show others" recomposed byte-identical text — while
    // the cycle-keyed React elements remounted and replayed their fade-in, so the panel visibly
    // animated and changed nothing.
    //
    // A stride of 1 cannot degenerate: it shifts the closer window on every press for any pool
    // larger than one, whatever `wanted` happens to be.
    const closer = closers[(base * 2 + cycle + i) % closers.length]
    const detailText = typeof detail === 'function' ? detail(opener) : detail
    const text = [opener, detailText, closer].filter(Boolean).join(' ')
    if (!out.includes(text)) out.push(text)
  }

  return out
}

// ── Detail sentences: real facts only ───────────────────────────────────────

const BED_WORDS: Record<string, string> = {
  king: 'king bed',
  queen: 'queen bed',
  double: 'double bed',
  twin: 'twin bed',
  single: 'single bed',
  sofaBed: 'sofa bed',
}

export function describeBeds(beds?: { type: string; quantity: number }[]): string {
  if (!beds || beds.length === 0) return ''
  const parts = beds
    .filter((b) => b.quantity > 0)
    .map((b) => {
      const word = BED_WORDS[b.type] ?? `${b.type} bed`
      return b.quantity > 1 ? `${b.quantity} ${word}s` : `a ${word}`
    })
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

export function buildRoomDetail(room: {
  beds?: { type: string; quantity: number }[]
  size?: number
  maxGuests?: number
}): string {
  const beds = describeBeds(room.beds)
  const size = room.size && room.size > 0 ? `${room.size} m²` : ''
  const guests = room.maxGuests && room.maxGuests > 0 ? room.maxGuests : 0

  let sentence = ''
  if (size && beds) sentence = `Spanning ${size}, it features ${beds}`
  else if (size) sentence = `It measures ${size}`
  else if (beds) sentence = `It features ${beds}`

  if (guests) {
    const sleeps =
      guests === 1 ? 'sleeps one guest comfortably' : `sleeps up to ${guests} guests comfortably`
    if (!sentence) {
      sentence = `It ${sleeps}`
    } else {
      // Two or more beds are already joined with "and" ("a king bed and a sofa bed"), so a bare
      // "and" here would read "a sofa bed and sleeps up to 4". The comma separates them properly.
      sentence += `${sentence.includes(' and ') ? ',' : ''} and ${sleeps}`
    }
  }

  return sentence ? `${sentence}.` : ''
}

/**
 * Amenity keys as well-formed noun phrases, articles included.
 *
 * Humanising the key alone ('restaurant' → 'restaurant') produces "access to wifi, parking and
 * restaurant", which reads as a checklist rather than a sentence. Only a map can know that a pool
 * takes 'a' and that parking takes nothing — English has no rule to derive it from. Keys are from
 * AmenitiesStep.tsx; anything unrecognised falls through to the bare humanised form, which is
 * article-less and therefore safe in a list even when it is not ideal.
 */
export const AMENITY_PHRASES: Record<string, string> = {
  wifi: 'WiFi',
  pool: 'a pool',
  gym: 'a gym',
  spa: 'a spa',
  sauna: 'a sauna',
  hot_tub: 'a hot tub',
  pool_table: 'a pool table',
  piano: 'a piano',
  patio: 'a patio',
  bbq_grill: 'a BBQ grill',
  outdoor_dining: 'outdoor dining',
  fire_pit: 'a fire pit',
  scenic_balcony: 'a scenic balcony',
  mountain_view: 'mountain views',
  forest_view: 'forest views',
  lake_access: 'lake access',
  beachfront: 'a beachfront setting',
  restaurant: 'a restaurant',
  breakfast: 'breakfast',
  minibar: 'a minibar',
  free_parking: 'free parking',
  paid_parking: 'paid parking',
  concierge: 'a concierge',
  laundry: 'laundry',
  housekeeping: 'housekeeping',
  kitchen: 'a kitchen',
  kitchenette: 'a kitchenette',
  refrigerator: 'a refrigerator',
  washing_machine: 'a washing machine',
  dryer: 'a dryer',
  air_conditioning: 'air conditioning',
  heating: 'heating',
  dedicated_workspace: 'a dedicated workspace',
  balcony: 'a balcony',
  indoor_bonfire: 'an indoor bonfire',
  playground: 'a playground',
  elevator: 'a lift',
  babysitting: 'babysitting',
  tv: 'a TV',
  library: 'a library',
  nightclub: 'a nightclub',

  // The kebab-case half of AmenitiesStep. These were missing in the first version because the
  // grep that built this map matched [a-zA-Z_]+ and silently skipped every hyphenated id — all
  // 27 of them fell through to the bare humanised key, so a partner ticking Pet Friendly got
  // "Guests have access to pet friendly." Adjectival ids are rewritten as noun phrases here,
  // since no amount of article-guessing rescues "access to wheelchair accessible".
  airport_shuttle: 'an airport shuttle',
  bar_lounge: 'a bar and lounge',
  business_center: 'a business centre',
  car_rental: 'car hire',
  city_view: 'city views',
  coffee_shop: 'a coffee shop',
  conference_facilities: 'conference facilities',
  currency_exchange: 'currency exchange',
  dry_cleaning: 'dry cleaning',
  entertainment_system: 'an entertainment system',
  family_rooms: 'family rooms',
  front_desk_24h: 'a 24-hour front desk',
  golf_course: 'a golf course',
  high_speed_internet: 'high-speed internet',
  kids_club: 'a kids club',
  live_music: 'live music',
  luggage_storage: 'luggage storage',
  meeting_rooms: 'meeting rooms',
  ocean_view: 'ocean views',
  pet_friendly: 'pet-friendly rooms',
  room_service: 'room service',
  safe_deposit: 'a safe deposit box',
  taxi_service: 'a taxi service',
  tennis_court: 'a tennis court',
  tv_cable: 'cable TV',
  valet_parking: 'valet parking',
  wheelchair_accessible: 'wheelchair access',
}

/**
 * Which amenities are worth naming in a description, best first. The wizard stores selections in
 * grid order, so without this the four that surface could be a refrigerator and a dryer while the
 * pool and the mountain views go unmentioned.
 */
const AMENITY_PRIORITY = [
  'mountain_view',
  'ocean_view',
  'lake_access',
  'beachfront',
  'forest_view',
  'pool',
  'restaurant',
  'spa',
  'breakfast',
  'hot_tub',
  'sauna',
  'golf_course',
  'tennis_court',
  'gym',
  'scenic_balcony',
  'fire_pit',
  'outdoor_dining',
  'bar_lounge',
  'coffee_shop',
  'kids_club',
  'live_music',
  'patio',
  'balcony',
  'city_view',
  'room_service',
  'front_desk_24h',
  'airport_shuttle',
  'wifi',
  'high_speed_internet',
  'free_parking',
  'valet_parking',
  'kitchen',
  'concierge',
  'family_rooms',
  'pet_friendly',
  'wheelchair_accessible',
]

const humanise = (key: string) =>
  key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .trim()

/** camelCase and kebab variants both appear across the wizard; normalise before lookup. */
export const amenityKey = (raw: string) =>
  String(raw)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()

const amenityPhrase = (raw: string) => {
  const key = amenityKey(raw)
  return AMENITY_PHRASES[key] ?? humanise(raw)
}

export function buildPropertyDetail(property: {
  starRating?: number
  city?: string
  amenities?: string[]
}): string {
  const sentences: string[] = []

  const stars = property.starRating && property.starRating > 0 ? property.starRating : 0
  const city = property.city?.trim()
  if (stars && city) sentences.push(`A ${stars}-star property in ${city}.`)
  else if (stars) sentences.push(`A ${stars}-star property.`)
  else if (city) sentences.push(`Located in ${city}.`)

  // Cap at four: past that it reads as an inventory rather than a description, and the partner's
  // own amenities grid already shows the full set. Ranked first so the four that survive are the
  // four worth mentioning.
  const rank = (raw: string) => {
    const i = AMENITY_PRIORITY.indexOf(amenityKey(raw))
    return i === -1 ? AMENITY_PRIORITY.length : i
  }
  const amenities = [...(property.amenities ?? [])]
    .sort((a, b) => rank(String(a)) - rank(String(b)))
    .map((a) => amenityPhrase(String(a)))
    .filter(Boolean)
    .slice(0, 4)

  if (amenities.length === 1) {
    sentences.push(`Guests have access to ${amenities[0]}.`)
  } else if (amenities.length > 1) {
    const list = `${amenities.slice(0, -1).join(', ')} and ${amenities[amenities.length - 1]}`
    sentences.push(`Guests have access to ${list}.`)
  }

  return sentences.join(' ')
}
