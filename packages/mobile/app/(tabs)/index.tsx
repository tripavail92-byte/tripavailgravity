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
  { label: 'Stays', Icon: Bed, route: '/(tabs)/hotels' as Href },
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
  const { data: homePackages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['packages', 'home-rail'],
    queryFn: () => fetchPackages(8),
    staleTime: 8 * 60 * 1000,
  })

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] ?? null
  const featured = tours[0]
  const popular = tours.slice(1, 8)

  return (
    <View className="flex-1 bg-surface-page">
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* Featured packages — hotel stays, like the web home rails */}
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

        {/* Popular */}
        <View className="mb-3 mt-7 flex-row items-center justify-between px-5">
          <Text className="text-lg font-bold text-ink">Popular right now</Text>
          <Pressable onPress={() => router.push('/(tabs)/tours')}>
            <Text className="text-sm font-semibold text-primary-700">See all</Text>
          </Pressable>
        </View>

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
