import { supabase } from '@/lib/supabase'

export interface ManagerHotel {
  id: string
  name: string | null
  city: string | null
  country: string | null
  property_type: string | null
  star_rating: number | null
  rating: number | null
  main_image_url: string | null
  image_urls: string[] | null
  base_price_per_night: number | null
  is_published: boolean | null
  draft_data: any
}

export interface ManagerPackage {
  id: string
  name: string | null
  package_type: string | null
  cover_image: string | null
  base_price_per_night: number | null
  currency: string | null
  is_published: boolean | null
  status: string | null
}

export async function fetchManagerPackages(userId: string): Promise<ManagerPackage[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('id,name,package_type,cover_image,base_price_per_night,currency,is_published,status')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as ManagerPackage[]
}

export async function fetchManagerHotels(userId: string): Promise<ManagerHotel[]> {
  const { data, error } = await supabase
    .from('hotels')
    .select(
      'id,name,city,country,property_type,star_rating,rating,main_image_url,image_urls,base_price_per_night,is_published,draft_data',
    )
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as ManagerHotel[]
}
