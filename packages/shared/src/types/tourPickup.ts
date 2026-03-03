export interface TourPickupLocation {
  id: string
  tour_id: string
  title: string
  formatted_address: string
  city: string | null
  country: string | null
  latitude: number
  longitude: number
  google_place_id: string | null
  pickup_time: string | null
  notes: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export type TourPickupLocationInsert = Omit<
  TourPickupLocation,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface NearestPickupSearchResult {
  tour_id: string
  pickup_id: string
  pickup_title: string
  formatted_address: string
  city: string | null
  country: string | null
  latitude: number
  longitude: number
  google_place_id: string | null
  pickup_time: string | null
  notes: string | null
  nearest_distance_km: number
}

export type PickupLocationDraft = Omit<
  TourPickupLocationInsert,
  'tour_id' | 'created_at' | 'updated_at'
> & {
  tour_id?: string
  created_at?: string
  updated_at?: string
}
