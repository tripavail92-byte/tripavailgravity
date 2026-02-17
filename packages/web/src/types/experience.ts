export type ExperienceType = 'hotel' | 'tour'

export interface UnifiedExperience {
  id: string
  title: string
  price: number | null
  originalPrice?: number
  images: string[]
  rating?: number | null
  reviewCount?: number | null
  created_at: string
  type: ExperienceType
}
