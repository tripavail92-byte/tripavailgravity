import { useQuery } from '@tanstack/react-query'
import { FlatList, View } from 'react-native'

import { AppHeader, EmptyState, Screen, TourCard, TourCardSkeleton, type TourCardData } from '@/components/ui'
import { supabase } from '@/lib/supabase'

interface TourRow {
  id: string
  title: string
  price: number
  currency: string
  images: string[]
  location: Record<string, string>
  rating: number
}

async function fetchAllTours(): Promise<TourRow[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('id,title,price,currency,images,location,rating')
    .eq('is_active', true)
    .eq('is_published', true)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) throw error
  return (data ?? []) as TourRow[]
}

function toCardData(t: TourRow): TourCardData {
  const loc = t.location ?? {}
  return {
    id: t.id,
    title: t.title,
    price: t.price,
    currency: t.currency,
    images: t.images,
    rating: t.rating,
    locationLabel: loc.city || null,
  }
}

export default function ToursScreen() {
  const { data: tours = [], isLoading } = useQuery({
    queryKey: ['tours', 'all'],
    queryFn: fetchAllTours,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <Screen>
      <AppHeader title="All Tours" subtitle="Browse every live tour" />
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 110, gap: 14 }}
        columnWrapperStyle={{ gap: 14 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-3.5">
              <View className="flex-row gap-3.5">
                <TourCardSkeleton layout="grid" />
                <TourCardSkeleton layout="grid" />
              </View>
              <View className="flex-row gap-3.5">
                <TourCardSkeleton layout="grid" />
                <TourCardSkeleton layout="grid" />
              </View>
            </View>
          ) : (
            <EmptyState
              icon="map-outline"
              title="No tours yet"
              description="Check back soon — operators are adding new tours all the time."
            />
          )
        }
        renderItem={({ item }) => <TourCard tour={toCardData(item)} layout="grid" />}
      />
    </Screen>
  )
}
