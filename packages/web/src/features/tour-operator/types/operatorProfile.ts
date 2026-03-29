export interface OperatorFleetAsset {
  id: string
  type: string
  name: string
  quantity: number
  capacity: number | null
  details: string
}

export interface OperatorGuideProfile {
  id: string
  name: string
  languages: string[]
  specialties: string[]
  certifications: string[]
  yearsExperience: number | null
  bio: string
}

export interface OperatorPublicPolicies {
  cancellation: string
  deposit: string
  pickup: string
  child: string
  refund: string
  weather: string
  emergency: string
  supportHours: string
}

export interface OperatorProfileDocumentLinks {
  businessRegistration: string
  insurance: string
  vehicleDocs: string
  guideLicense: string
}

export interface OperatorVerificationBadge {
  id: string
  label: string
  tone: 'verified' | 'submitted' | 'basic'
  description: string
}

export interface OperatorGalleryItem {
  id: string
  url: string
  title: string
  category: 'operator' | 'vehicle' | 'traveler' | 'accommodation' | 'food'
}

export interface OperatorAward {
  id: string
  award_code: string
  award_name: string
  awarded_at: string
  expires_at: string | null
  metadata: Record<string, unknown> | null
  award_source?: 'system' | 'admin'
  admin_note?: string | null
}
