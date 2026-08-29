/**
 * Requirement id → human label.
 *
 * `tours.requirements` stores raw catalogue ids (`req_altitude`, `req_no_heart`, …). The web maps
 * them through src/config/tourRequirements.ts before rendering; mobile was printing the raw id, so
 * the tour page's "Before you go" section showed `req_altitude` to travellers.
 *
 * Mirrors the web catalogue (RequirementsData.tsx). Keep the two in sync when options are added —
 * unknown ids fall back to a humanised form rather than leaking the raw key.
 */
const REQUIREMENT_LABELS: Record<string, string> = {
  req_fitness_moderate: 'Moderate fitness level',
  req_altitude: 'High-altitude tolerance',
  req_no_heart: 'No heart/respiratory conditions',
  req_not_pregnant: 'Not recommended for pregnant travelers',
  req_mobility: 'Not suitable for mobility impairments',
  req_gear_boots: 'Hiking boots required',
  req_gear_swimwear: 'Swimwear required',
  req_gear_helmet: 'Helmet provided on-site',
  req_gear_warm_clothing: 'Warm clothing required',
  req_gear_rain: 'Rain protection required',
  req_gear_medication: 'Personal medication required',
  req_doc_passport: 'Valid passport required',
  req_doc_visa: 'Visa required',
  req_doc_id: 'National ID required',
  req_doc_insurance: 'Travel insurance mandatory',
  req_doc_age: 'Age verification required',
  req_safe_no_pets: 'No pets allowed',
  req_safe_no_bags: 'No large luggage',
  req_safe_no_alcohol: 'No alcohol consumption allowed',
  req_safe_waiver: 'Safety waiver required',
  req_safe_weather: 'Weather-dependent activity',
  req_cond_early: 'Early morning departure',
  req_cond_overnight: 'Overnight stay included',
  req_cond_shared: 'Shared accommodation',
  req_cond_boat: 'Boat transfer involved',
  req_cond_offroad: 'Off-road travel involved',
  req_cond_remote: 'Remote area (limited signal)',
}

/**
 * Label for a requirement id. Unknown/legacy ids are humanised (`req_no_heat` → "No heat") so a
 * traveller never sees a raw key; a value that is already a sentence is returned unchanged.
 */
export function requirementLabel(raw: string): string {
  const id = String(raw ?? '').trim()
  if (!id) return ''
  const known = REQUIREMENT_LABELS[id]
  if (known) return known
  // Not a catalogue id (free text an operator typed) — show it as-is.
  if (!/^req_[a-z0-9_]*$/i.test(id)) return id
  const words = id.replace(/^req_/i, '').replace(/_/g, ' ').trim()
  if (!words) return id
  return words.charAt(0).toUpperCase() + words.slice(1)
}
