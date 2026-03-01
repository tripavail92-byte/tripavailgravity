import React from 'react'

export type RequirementCategory =
  | 'Physical & Health'
  | 'Gear & Equipment'
  | 'Documents & Eligibility'
  | 'Safety & Restrictions'
  | 'Special Conditions'

export interface RequirementOption {
  id: string
  label: string
  icon: () => React.ReactNode
}

export const TOUR_REQUIREMENTS: Record<RequirementCategory, RequirementOption[]> = {
  'Physical & Health': [
    {
      id: 'req_fitness_moderate',
      label: 'Moderate fitness level',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4z" />
        </svg>
      ), // Lightning bolt / active
    },
    {
      id: 'req_altitude',
      label: 'High-altitude tolerance',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M4 18l5-12 3 5 5-9 4 7" />
          <path d="M12 4v4" />
        </svg>
      ), // Peaks up
    },
    {
      id: 'req_no_heart',
      label: 'No heart/respiratory conditions',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      ), // Heart crossed out
    },
    {
      id: 'req_not_pregnant',
      label: 'Not recommended for pregnant travelers',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <circle cx="12" cy="7" r="3" />
          <path d="M8 10h8v5a4 4 0 0 1-8 0v-5z" />
          <path d="M12 15a4 4 0 0 0 4-4" />
        </svg>
      ), // Figure
    },
    {
      id: 'req_mobility',
      label: 'Not suitable for mobility impairments',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M19 8a3 3 0 1 0-6 0c0 1.23.75 2.29 1.8 2.76L16 22H8L6 11V6" />
          <circle cx="9" cy="4" r="2" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      ), // Wheelchair / stick crossed
    },
    {
      id: 'req_walk_5km',
      label: 'Able to walk 5+ km',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M13 4v16" />
          <path d="M13 4l-4 4" />
          <path d="M13 4l4 4" />
          <path d="M5 20h14" />
        </svg>
      ), // Walk forward
    },
  ],
  'Gear & Equipment': [
    {
      id: 'req_gear_boots',
      label: 'Hiking boots required',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M8 18V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10" />
          <path d="M6 18h12a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2Z" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
        </svg>
      ), // Boot
    },
    {
      id: 'req_gear_swimwear',
      label: 'Swimwear required',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M22 17c-2 0-2-2-4-2s-2 2-4 2-2-2-4-2-2 2-4 2" />
          <path d="M22 22c-2 0-2-2-4-2s-2 2-4 2-2-2-4-2-2 2-4 2" />
        </svg>
      ), // Waves
    },
    {
      id: 'req_gear_helmet',
      label: 'Helmet provided on-site',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M7 15a5 5 0 0 1 10 0" />
          <path d="M4 15h16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3z" />
          <path d="M12 6v4" />
        </svg>
      ), // Helmet
    },
    {
      id: 'req_gear_warm_clothing',
      label: 'Warm clothing required',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
          <path d="M9 18v3" />
          <path d="M15 18v3" />
          <path d="M7 21h10" />
          <rect x="5" y="7" width="14" height="11" rx="2" />
        </svg>
      ), // Sweater
    },
    {
      id: 'req_gear_rain',
      label: 'Rain protection required',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M22 12a10.06 10.06 1 0 0-20 0Z" />
          <path d="M12 12v9" />
          <path d="M9 21a3 3 0 0 0 6 0" />
        </svg>
      ), // Umbrella
    },
    {
      id: 'req_gear_medication',
      label: 'Personal medication required',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M8 5h8v3H8z" />
          <path d="M12 11v6" />
          <path d="M9 14h6" />
        </svg>
      ), // First aid / med kit
    },
  ],
  'Documents & Eligibility': [
    {
      id: 'req_doc_passport',
      label: 'Valid passport required',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <circle cx="12" cy="10" r="3" />
          <path d="M8 18h8" />
        </svg>
      ), // Passport book
    },
    {
      id: 'req_doc_visa',
      label: 'Visa required',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h10" />
          <path d="M7 12h10" />
          <path d="M7 16h5" />
        </svg>
      ), // Visa doc / Stamp
    },
    {
      id: 'req_doc_id',
      label: 'National ID required',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="8" cy="12" r="2" />
          <path d="M14 10h4" />
          <path d="M14 14h4" />
        </svg>
      ), // ID Card
    },
    {
      id: 'req_doc_insurance',
      label: 'Travel insurance mandatory',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v6" />
          <path d="M9 11h6" />
        </svg>
      ), // Shield with cross
    },
    {
      id: 'req_doc_age',
      label: 'Age verification required',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      ), // Check circle
    },
  ],
  'Safety & Restrictions': [
    {
      id: 'req_safe_no_pets',
      label: 'No pets allowed',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M2 2l20 20" />
          <path d="M10.13 4.14A3 3 0 0 1 15 5.5v1.2a3.86 3.86 0 0 1 1.63.48M6.5 6.5A3 3 0 0 0 7 12c1.7 0 3.2-1.3 3.6-2.9" />
          <path d="M21 16v-2.3a7.86 7.86 0 0 0-4-6.8" />
          <path d="M6 14v5h3v-3h6l1 3h3v-4.5" />
        </svg>
      ), // Cross dog footprint
    },
    {
      id: 'req_safe_no_bags',
      label: 'No large luggage',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <line x1="2" y1="2" x2="22" y2="22" />
          <rect x="6" y="8" width="12" height="14" rx="2" />
          <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ), // Crossed suitcase
    },
    {
      id: 'req_safe_no_alcohol',
      label: 'No alcohol consumption allowed',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M2 2l20 20" />
          <path d="M5 8l7 7 7-7C16 5 14 3 12 3S8 5 5 8z" />
          <path d="M12 15v6" />
          <path d="M9 21h6" />
        </svg>
      ), // Crossed glass
    },
    {
      id: 'req_safe_waiver',
      label: 'Safety waiver required',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      ), // Document
    },
    {
      id: 'req_safe_weather',
      label: 'Weather-dependent activity',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      ), // Cloud
    },
  ],
  'Special Conditions': [
    {
      id: 'req_cond_early',
      label: 'Early morning departure',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ), // Clock
    },
    {
      id: 'req_cond_overnight',
      label: 'Overnight stay included',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ), // Moon
    },
    {
      id: 'req_cond_shared',
      label: 'Shared accommodation',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M3 14h18" />
          <path d="M8 14v5" />
          <path d="M16 14v5" />
          <path d="M4 14V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5" />
          <path d="M12 7V3" />
          <path d="M9 4h6" />
        </svg>
      ), // Bunk bed abstract
    },
    {
      id: 'req_cond_boat',
      label: 'Boat transfer involved',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M22 17c-2 0-2-2-4-2s-2 2-4 2-2-2-4-2-2 2-4 2" />
          <path d="M2 12l2-4 8 2 8-2 2 4M12 10V4l6 4-6 2z" />
        </svg>
      ), // Boat on wave
    },
    {
      id: 'req_cond_offroad',
      label: 'Off-road travel involved',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <rect x="2" y="12" width="20" height="8" rx="2" />
          <path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
          <circle cx="7" cy="16" r="2" />
          <circle cx="17" cy="16" r="2" />
        </svg>
      ), // SUV/Jeep
    },
    {
      id: 'req_cond_remote',
      label: 'Remote area (limited signal)',
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M15.42 12l1.69-1.69a9.98 9.98 0 0 0-14.12 0" />
          <path d="M2 2l20 20" />
          <path d="M8.29 16.71a4 4 0 0 1 5.48-.12" />
        </svg>
      ), // Exed out wifi signal
    },
  ],
}
