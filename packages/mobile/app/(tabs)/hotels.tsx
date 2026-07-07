import { useQuery } from '@tanstack/react-query'
import { FlatList, ScrollView, Text, View } from 'react-native'

import { AppHeader, EmptyState, Screen, Skeleton } from '@/components/ui'
import { PackageRailCard } from '@/components/ui/PackageCard'
import {
  type CuratedKind,
  type DiscoveryPackage,
  fetchCuratedPackages,
  fetchPackages,
} from '@/lib/packageDiscovery'

/**
 * Hotels tab — mirror of the web /hotels page: curated package rails
 * (Featured, Top rated, New arrivals, Couples, Family, Weekend getaways).
 */

function Rail({ title, subtitle, packages }: { title: string; subtitle: string; packages: DiscoveryPackage[] }) {
  if (!packages.length) return null
  return (
    <View className="mt-6">
      <View className="mb-3 px-5">
        <Text className="text-lg font-bold text-ink">{title}</Text>
        <Text className="text-xs text-ink-soft">{subtitle}</Text>
      </View>
      <FlatList
        data={packages}
        horizontal
        keyExtractor={(p) => p.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={({ item }) => <PackageRailCard pkg={item} />}
      />
    </View>
  )
}

function useCurated(kind: CuratedKind) {
  return useQuery({
    queryKey: ['packages', 'curated', kind],
    queryFn: () => fetchCuratedPackages(kind, 8),
    staleTime: 6 * 60 * 1000,
  })
}

export default function HotelsTab() {
  const featured = useQuery({
    queryKey: ['packages', 'all'],
    queryFn: () => fetchPackages(8),
    staleTime: 5 * 60 * 1000,
  })
  const topRated = useCurated('top_rated')
  const newArrivals = useCurated('new_arrivals')
  const couples = useCurated('best_for_couples')
  const family = useCurated('family_friendly')
  const weekend = useCurated('weekend_getaways')

  const isLoading = featured.isLoading || topRated.isLoading || newArrivals.isLoading
  const nothing =
    !isLoading &&
    !(featured.data?.length || topRated.data?.length || newArrivals.data?.length ||
      couples.data?.length || family.data?.length || weekend.data?.length)

  return (
    <Screen>
      <AppHeader title="Hotels" subtitle="Stays & packages with perks" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {isLoading ? (
          <View className="px-5 pt-2">
            <Skeleton height={196} radius={20} />
            <View className="mt-4"><Skeleton height={196} radius={20} /></View>
          </View>
        ) : nothing ? (
          <View className="pt-10">
            <EmptyState
              icon="business-outline"
              title="No packages yet"
              description="Hotel partners are adding stay packages — check back soon."
            />
          </View>
        ) : (
          <>
            <Rail title="Featured packages" subtitle="Curated from live listings" packages={featured.data ?? []} />
            <Rail title="Top rated stays" subtitle="Loved by recent guests" packages={topRated.data ?? []} />
            <Rail title="New arrivals" subtitle="Fresh from our hotel partners" packages={newArrivals.data ?? []} />
            <Rail title="Best for couples" subtitle="Romantic escapes" packages={couples.data ?? []} />
            <Rail title="Family friendly" subtitle="Room for everyone" packages={family.data ?? []} />
            <Rail title="Weekend getaways" subtitle="Short stays, big memories" packages={weekend.data ?? []} />
          </>
        )}
      </ScrollView>
    </Screen>
  )
}
