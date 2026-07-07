import { useQuery } from '@tanstack/react-query'
import { FlatList, View } from 'react-native'

import { AppHeader, EmptyState, Screen, TourCardSkeleton } from '@/components/ui'
import { PackageCard } from '@/components/ui/PackageCard'
import { fetchPackages } from '@/lib/packageDiscovery'

export default function PackagesScreen() {
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['packages', 'all'],
    queryFn: () => fetchPackages(40),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <Screen>
      <AppHeader showBack title="Stays & Packages" subtitle="Curated hotel packages" />
      <FlatList
        data={packages}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-4">
              <TourCardSkeleton />
              <TourCardSkeleton />
            </View>
          ) : (
            <EmptyState
              icon="business-outline"
              title="No packages yet"
              description="Hotel partners are adding stay packages — check back soon."
            />
          )
        }
        renderItem={({ item }) => <PackageCard pkg={item} />}
      />
    </Screen>
  )
}
