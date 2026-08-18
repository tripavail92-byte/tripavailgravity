import { isSurfaceEnabled } from '@tripavail/shared'
import { useQuery } from '@tanstack/react-query'
import { Redirect } from 'expo-router'
import { FlatList, View } from 'react-native'

import { AppHeader, EmptyState, Screen, TourCardSkeleton } from '@/components/ui'
import { PackageCard } from '@/components/ui/PackageCard'
import { fetchPackages } from '@/lib/packageDiscovery'

// Launch scope: hotel packages are hidden AND deep-link-redirected until Phase 3.
export default function PackagesScreen() {
  if (!isSurfaceEnabled('hotels')) return <Redirect href="/(tabs)/tours" />
  return <PackagesScreenInner />
}

function PackagesScreenInner() {
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
