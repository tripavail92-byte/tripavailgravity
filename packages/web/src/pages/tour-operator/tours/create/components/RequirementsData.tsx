import type { TourIconKey } from '@/features/tour-operator/assets/TourIconRegistry'

export type RequirementCategory =
  | 'Physical & Health'
  | 'Gear & Equipment'
  | 'Documents & Eligibility'
  | 'Safety & Restrictions'
  | 'Special Conditions'

export interface RequirementOption {
  id: string
  label: string
  icon_key: TourIconKey
}

export const TOUR_REQUIREMENTS: Record<RequirementCategory, RequirementOption[]> = {
  'Physical & Health': [
    { id: 'req_fitness_moderate', label: 'Moderate fitness level', icon_key: 'requirement_fitness' },
    { id: 'req_altitude', label: 'High-altitude tolerance', icon_key: 'requirement_altitude' },
    { id: 'req_no_heart', label: 'No heart/respiratory conditions', icon_key: 'requirement_health' },
    { id: 'req_not_pregnant', label: 'Not recommended for pregnant travelers', icon_key: 'requirement_restriction' },
    { id: 'req_mobility', label: 'Not suitable for mobility impairments', icon_key: 'requirement_accessibility' },
    { id: 'req_walk_5km', label: 'Able to walk 5+ km', icon_key: 'hiking' },
  ],
  'Gear & Equipment': [
    { id: 'req_gear_boots', label: 'Hiking boots required', icon_key: 'requirement_boots' },
    { id: 'req_gear_swimwear', label: 'Swimwear required', icon_key: 'requirement_swim' },
    { id: 'req_gear_helmet', label: 'Helmet provided on-site', icon_key: 'insurance' },
    { id: 'req_gear_warm_clothing', label: 'Warm clothing required', icon_key: 'requirement_warm' },
    { id: 'req_gear_rain', label: 'Rain protection required', icon_key: 'requirement_restriction' },
    { id: 'req_gear_medication', label: 'Personal medication required', icon_key: 'requirement_health' },
  ],
  'Documents & Eligibility': [
    { id: 'req_doc_passport', label: 'Valid passport required', icon_key: 'visa' },
    { id: 'req_doc_visa', label: 'Visa required', icon_key: 'visa' },
    { id: 'req_doc_id', label: 'National ID required', icon_key: 'requirement_id' },
    { id: 'req_doc_insurance', label: 'Travel insurance mandatory', icon_key: 'insurance' },
    { id: 'req_doc_age', label: 'Age verification required', icon_key: 'requirement_age' },
  ],
  'Safety & Restrictions': [
    { id: 'req_safe_no_pets', label: 'No pets allowed', icon_key: 'requirement_restriction' },
    { id: 'req_safe_no_bags', label: 'No large luggage', icon_key: 'requirement_luggage' },
    { id: 'req_safe_no_alcohol', label: 'No alcohol consumption allowed', icon_key: 'alcohol' },
    { id: 'req_safe_waiver', label: 'Safety waiver required', icon_key: 'free_48h' },
    { id: 'req_safe_weather', label: 'Weather-dependent activity', icon_key: 'requirement_restriction' },
  ],
  'Special Conditions': [
    { id: 'req_cond_early', label: 'Early morning departure', icon_key: 'moderate_policy' },
    { id: 'req_cond_overnight', label: 'Overnight stay included', icon_key: 'hotel' },
    { id: 'req_cond_shared', label: 'Shared accommodation', icon_key: 'guide' },
    { id: 'req_cond_boat', label: 'Boat transfer involved', icon_key: 'requirement_swim' },
    { id: 'req_cond_offroad', label: 'Off-road travel involved', icon_key: 'bus' },
    { id: 'req_cond_remote', label: 'Remote area (limited signal)', icon_key: 'requirement_restriction' },
  ],
}
