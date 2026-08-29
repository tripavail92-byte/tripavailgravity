import { isSurfaceEnabled } from '@tripavail/shared'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router, type Href } from 'expo-router'
import { Bed, Compass, Landmark, type LucideIcon, MapPin, Mountain, Search, Star, TreePine } from '@/components/icons/lucide'
import { FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

import SparkleIcon from '@/assets/icons/sparkle.svg'
import { Avatar, Card, NotificationBell, Skeleton, TourCardSkeleton } from '@/components/ui'
import { OnboardingCoach } from '@/components/ui/OnboardingCoach'
import { PackageRailCard } from '@/components/ui/PackageCard'
import { fetchPackages } from '@/lib/packageDiscovery'
import { useAuth } from '@/hooks/useAuth'
import { useDrawer } from '@/hooks/useDrawer'
import { useRoleTheme } from '@/theme'
import { supabase } from '@/lib/supabase'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=800&q=80'

type CategoryNavItem = { label: string; Icon: LucideIcon; route: Href }

const CATEGORY_NAV: CategoryNavItem[] = [
  { label: 'All', Icon: Compass, route: '/(tabs)/tours' },
  {
    label: 'Adventure',
    Icon: Mountain,
    route: { pathname: '/explore/categories/[category]', params: { category: 'adventure' } },
  },
  {
    label: 'Nature',
    Icon: TreePine,
    route: { pathname: '/explore/categories/[category]', params: { category: 'nature' } },
  },
  {
    label: 'Cultural',
    Icon: Landmark,
    route: { pathname: '/explore/categories/[category]', params: { category: 'cultural' } },
  },
  {
    label: 'Northern',
    Icon: MapPin,
    route: { pathname: '/explore/collections/[collection]', params: { collection: 'pakistan-northern' } },
  },
  // Launch scope: the "Stays" chip (→ Hotels tab) appears only in Phase 3.
  ...(isSurfaceEnabled('hotels')
    ? [{ label: 'Stays', Icon: Bed, route: '/(tabs)/hotels' as Href }]
    : []),
]

interface Tour {
  id: string
  title: string
  price: number
  currency: string
  images: string[]
  location: Record<string, string>
  rating: number
}

async function fetchFeaturedTours(): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('id,title,price,currency,images,location,rating')
    .eq('is_active', true)
    .eq('is_published', true)
    .eq('status', 'live')
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })
    .limit(10)
  if (error) throw error
  return (data ?? []) as Tour[]
}

/** Newest live trips — mirrors the web homepage's leading "New on TripAvail" rail. */
async function fetchNewTours(): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('id,title,price,currency,images,location,rating,created_at')
    .eq('is_active', true)
    .eq('is_published', true)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) throw error
  return (data ?? []) as Tour[]
}

// Web homepage trust band, same three promises (HomeCategoryFeed -> TrustBand).
const TRUST_POINTS = [
  {
    title: 'Verified operators',
    body: 'Operators complete identity and business checks before their trips go live.',
  },
  {
    title: 'Secure checkout',
    body: 'You pay TripAvail — never a stranger’s personal account.',
  },
  {
    title: 'Clear terms upfront',
    body: 'Departure, price and cancellation policy shown before you pay.',
  },
]

function locationOf(t: Tour) {
  const loc = t.location ?? {}
  return [loc.city, loc.country].filter(Boolean).join(', ')
}

const pressScale = ({ pressed }: { pressed: boolean }) =>
  pressed ? { transform: [{ scale: 0.97 }] } : undefined

export default function ExploreScreen() {
  const { user } = useAuth()
  const theme = useRoleTheme()
  const openDrawer = useDrawer((s) => s.openDrawer)
  const { data: tours = [], isLoading } = useQuery({
    queryKey: ['tours', 'featured'],
    queryFn: fetchFeaturedTours,
    staleTime: 8 * 60 * 1000,
  })
  // Launch scope: hotel packages rail is disabled until Phase 3.
  const { data: homePackages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['packages', 'home-rail'],
    queryFn: () => fetchPackages(8),
    staleTime: 8 * 60 * 1000,
    enabled: isSurfaceEnabled('hotels'),
  })

  // "New on TripAvail" — the web homepage leads with this rail, so mobile does too.
  const { data: newTours = [], isLoading: newLoading } = useQuery({
    queryKey: ['tours', 'new-arrivals'],
    queryFn: fetchNewTours,
    staleTime: 8 * 60 * 1000,
  })

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] ?? null
  const featured = tours[0]
  const popular = tours.slice(1, 8)

  // "Where to next?" — destination chips with trip counts, derived from the loaded
  // catalogue (no extra query) to mirror the web's DestinationTiles rail.
  const destinations = (() => {
    const counts = new Map<string, number>()
    for (const t of [...newTours, ...tours]) {
      const city = (t.location ?? {}).city?.trim()
      if (!city) continue
      if (!counts.has(city)) counts.set(city, 0)
    }
    // Count each city once per distinct tour id.
    const seen = new Set<string>()
    for (const t of [...newTours, ...tours]) {
      const city = (t.location ?? {}).city?.trim()
      if (!city || seen.has(t.id)) continue
      seen.add(t.id)
      counts.set(city, (counts.get(city) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }))
  })()

  return (
    <View className="flex-1 bg-surface-page">
      <StatusBar style="light" />
      {/* The tab bar is absolutely positioned (liquid-glass, content scrolls beneath it), so the
          feed needs bottom padding — without it the last rail's cards sit under the bar and are
          clipped at the end of the scroll. */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Gradient hero */}
        <LinearGradient
          colors={[theme.primary, theme.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <SafeAreaView edges={['top']}>
            <View className="px-5 pb-8 pt-2">
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-white/70">
                    {displayName ? `Welcome back, ${displayName} 👋` : 'Discover Pakistan'}
                  </Text>
                  <Text className="mt-0.5 text-2xl font-black text-white">
                    Find your next adventure
                  </Text>
                </View>
                <View className="ml-3 flex-row items-center gap-2">
                  <NotificationBell />
                  <Pressable onPress={() => (user ? openDrawer() : router.push('/(auth)/login'))} hitSlop={8}>
                    <Avatar uri={user?.user_metadata?.avatar_url} name={displayName} size={42} />
                  </Pressable>
                </View>
              </View>

              <Pressable
                className="flex-row items-center rounded-2xl bg-white/20 px-4 py-3.5"
                onPress={() => router.push('/(tabs)/search')}
              >
                <Search size={18} color="rgba(255,255,255,0.85)" />
                <Text className="ml-2 flex-1 text-base text-white/75">Search destinations, tours…</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Category bar — custom SVG icons (Airbnb-style) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          className="mt-5"
        >
          {CATEGORY_NAV.map(({ label, Icon, route }) => (
            <Pressable
              key={label}
              style={pressScale}
              className="mr-7 items-center"
              onPress={() => router.push(route)}
            >
              <Icon size={26} color="#475569" strokeWidth={1.8} />
              <Text className="mt-1.5 text-xs font-medium text-ink-muted">{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Featured packages — hotel stays. Launch scope: hidden until Phase 3. */}
        {isSurfaceEnabled('hotels') && (
          <>
            <View className="mb-3 mt-7 flex-row items-center justify-between px-5">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-lg font-bold text-ink">Featured packages</Text>
                <SparkleIcon width={16} height={16} color={theme.primary} />
              </View>
              <Pressable onPress={() => router.push('/(tabs)/hotels' as Href)}>
                <Text className="text-sm font-semibold text-primary-700">View all</Text>
              </Pressable>
            </View>
            {packagesLoading ? (
              <View className="px-5">
                <Skeleton height={196} radius={20} />
              </View>
            ) : homePackages.length > 0 ? (
              <FlatList
                data={homePackages}
                horizontal
                keyExtractor={(p) => p.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                renderItem={({ item }) => <PackageRailCard pkg={item} />}
              />
            ) : null}
          </>
        )}

        {/* New on TripAvail — leads the feed, matching the web homepage's first rail. */}
        <View className="mb-1 mt-7 flex-row items-center justify-between px-5">
          <Text className="text-lg font-bold text-ink">New on TripAvail</Text>
          <Pressable onPress={() => router.push('/(tabs)/tours')}>
            <Text className="text-sm font-semibold text-primary-700">See all</Text>
          </Pressable>
        </View>
        <Text className="mb-3 px-5 text-sm text-ink-soft">Freshly added by verified operators</Text>
        {newLoading ? (
          <View className="flex-row gap-4 px-5">
            <View className="w-52">
              <TourCardSkeleton layout="grid" />
            </View>
            <View className="w-52">
              <TourCardSkeleton layout="grid" />
            </View>
          </View>
        ) : (
          <FlatList
            data={newTours}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `new-${item.id}`}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
            renderItem={({ item }) => (
              <Pressable className="mr-4 w-52" style={pressScale} onPress={() => router.push(`/tours/${item.id}`)}>
                <Card className="w-52 overflow-hidden">
                  <View>
                    <Image
                      source={{ uri: item.images?.[0] ?? FALLBACK_IMAGE }}
                      style={{ height: 132 }}
                      className="w-full"
                      resizeMode="cover"
                    />
                    <View className="absolute left-2 top-2 rounded-full bg-primary-600 px-2 py-0.5">
                      <Text className="text-xs font-bold text-white">New</Text>
                    </View>
                  </View>
                  <View className="p-3">
                    <Text className="text-sm font-bold text-ink" numberOfLines={1}>
                      {item.title}
                    </Text>
                    {locationOf(item) ? (
                      <Text className="mt-0.5 text-xs text-ink-soft" numberOfLines={1}>
                        {locationOf(item)}
                      </Text>
                    ) : null}
                    <Text className="mt-1.5 text-sm font-black text-primary-700">
                      {item.currency} {Number(item.price).toLocaleString()}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            )}
          />
        )}

        {/* Where to next? — destination entry points, mirroring the web rail. */}
        {destinations.length > 0 ? (
          <>
            <View className="mb-1 mt-7 flex-row items-center justify-between px-5">
              <Text className="text-lg font-bold text-ink">Where to next?</Text>
              <Pressable onPress={() => router.push('/(tabs)/tours')}>
                <Text className="text-sm font-semibold text-primary-700">See all</Text>
              </Pressable>
            </View>
            <Text className="mb-3 px-5 text-sm text-ink-soft">
              Pick a place — we’ll show you the trips running there.
            </Text>
            <FlatList
              data={destinations}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(d) => d.city}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
              renderItem={({ item }) => (
                <Pressable
                  className="mr-3"
                  style={pressScale}
                  onPress={() => router.push(`/(tabs)/search?q=${encodeURIComponent(item.city)}` as Href)}
                >
                  <Card className="px-4 py-3">
                    <Text className="text-sm font-bold text-ink">{item.city}</Text>
                    <Text className="mt-0.5 text-xs text-ink-soft">
                      {item.count} {item.count === 1 ? 'trip' : 'trips'}
                    </Text>
                  </Card>
                </Pressable>
              )}
            />
          </>
        ) : null}

        {/* Trust band — the same three promises as the web homepage. */}
        <View className="mt-7 gap-3 px-5">
          {TRUST_POINTS.map((p) => (
            <Card key={p.title} className="p-4">
              <Text className="text-sm font-bold text-ink">{p.title}</Text>
              <Text className="mt-1 text-xs leading-5 text-ink-soft">{p.body}</Text>
            </Card>
          ))}
        </View>

        {/* Featured */}
        <View className="mb-3 mt-7 flex-row items-center gap-1.5 px-5">
          <Text className="text-lg font-bold text-ink">Featured tour</Text>
          <SparkleIcon width={16} height={16} color={theme.primary} />
        </View>
        <View className="px-5">
          {isLoading ? (
            <Skeleton height={210} radius={24} />
          ) : featured ? (
            <Pressable style={pressScale} onPress={() => router.push(`/tours/${featured.id}`)}>
              <Card className="overflow-hidden">
                <Image
                  source={{ uri: featured.images?.[0] ?? FALLBACK_IMAGE }}
                  style={{ height: 210 }}
                  className="w-full"
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.82)']}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140 }}
                />
                <View className="absolute bottom-0 left-0 right-0 p-4">
                  <Text className="text-xl font-black text-white" numberOfLines={1}>
                    {featured.title}
                  </Text>
                  {locationOf(featured) ? (
                    <Text className="mt-0.5 text-sm text-white/85" numberOfLines={1}>
                      {locationOf(featured)}
                    </Text>
                  ) : null}
                  <View className="mt-2 flex-row items-center justify-between">
                    <View className="rounded-full bg-white/95 px-3 py-1">
                      <Text className="text-sm font-bold text-ink">
                        {featured.currency} {Number(featured.price).toLocaleString()}
                      </Text>
                    </View>
                    {Number(featured.rating) > 0 ? (
                      <View className="flex-row items-center">
                        <Star size={14} color="#fbbf24" fill="#fbbf24" />
                        <Text className="ml-1 text-sm font-semibold text-white">
                          {Number(featured.rating).toFixed(1)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Card>
            </Pressable>
          ) : null}
        </View>

        {/* Handpicked — same title/subtitle as the web homepage rail. */}
        <View className="mb-1 mt-7 flex-row items-center justify-between px-5">
          <Text className="text-lg font-bold text-ink">Handpicked by TripAvail</Text>
          <Pressable onPress={() => router.push('/(tabs)/tours')}>
            <Text className="text-sm font-semibold text-primary-700">See all</Text>
          </Pressable>
        </View>
        <Text className="mb-3 px-5 text-sm text-ink-soft">Real photos, transparent pricing</Text>

        {isLoading ? (
          <View className="flex-row gap-4 px-5">
            <View className="w-52">
              <TourCardSkeleton layout="grid" />
            </View>
            <View className="w-52">
              <TourCardSkeleton layout="grid" />
            </View>
          </View>
        ) : (
          <FlatList
            data={popular}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
            renderItem={({ item }) => (
              <Pressable className="mr-4 w-52" style={pressScale} onPress={() => router.push(`/tours/${item.id}`)}>
                <Card className="w-52 overflow-hidden">
                  <View>
                    <Image
                      source={{ uri: item.images?.[0] ?? FALLBACK_IMAGE }}
                      style={{ height: 132 }}
                      className="w-full"
                      resizeMode="cover"
                    />
                    {Number(item.rating) > 0 ? (
                      <View className="absolute right-2 top-2 flex-row items-center rounded-full bg-white/95 px-2 py-0.5">
                        <Star size={11} color="#f59e0b" fill="#f59e0b" />
                        <Text className="ml-1 text-xs font-bold text-ink">
                          {Number(item.rating).toFixed(1)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View className="p-3">
                    <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                      {item.title}
                    </Text>
                    {locationOf(item) ? (
                      <Text className="mt-0.5 text-xs text-ink-soft" numberOfLines={1}>
                        {locationOf(item)}
                      </Text>
                    ) : null}
                    <Text className="mt-1 text-sm font-bold text-primary-700">
                      {item.currency} {Number(item.price).toLocaleString()}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            )}
          />
        )}

        <View className="h-28" />
      </ScrollView>

      <OnboardingCoach />
    </View>
  )
}
