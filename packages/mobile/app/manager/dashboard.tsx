import { useQuery } from '@tanstack/react-query'
import { type Href, router } from 'expo-router'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'

import { Menu } from '@/components/icons/lucide'
import { AppHeader, Badge, Button, Card, EmptyState, Screen } from '@/components/ui'
import { GlassBar, GlassPanel } from '@/components/ui/Glass'
import { useAuth } from '@/hooks/useAuth'
import { useDrawer } from '@/hooks/useDrawer'
import { useThemeColors } from '@/theme'
import { fetchManagerHotels, fetchManagerPackages } from '@/lib/manager'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80'

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel radius={16} intensity={35} style={{ minWidth: 150, flex: 1 }} contentStyle={{ padding: 16 }}>
      <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</Text>
      <Text className="mt-2 text-xl font-black text-ink">{value}</Text>
    </GlassPanel>
  )
}

export default function ManagerDashboard() {
  const { user } = useAuth()
  const openDrawer = useDrawer((s) => s.openDrawer)
  const c = useThemeColors()

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['manager', 'hotels', user?.id],
    queryFn: () => fetchManagerHotels(user!.id),
    enabled: !!user,
  })
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['manager', 'packages', user?.id],
    queryFn: () => fetchManagerPackages(user!.id),
    enabled: !!user,
  })

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Manager" />
        <EmptyState icon="person-circle-outline" title="Sign in" description="Sign in to manage your properties.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const published = hotels.filter((h) => h.is_published)
  const drafts = hotels.filter((h) => !h.is_published)
  const rated = published.filter((h) => (h.rating ?? 0) > 0)
  const avg = rated.length ? rated.reduce((s, h) => s + Number(h.rating), 0) / rated.length : null

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 86, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
        <View className="flex-row flex-wrap gap-3">
          <StatTile label="Published" value={String(published.length)} />
          <StatTile label="Drafts" value={String(drafts.length)} />
          <StatTile label="Avg rating" value={avg ? `${avg.toFixed(1)} ★` : 'New'} />
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button label="List a hotel" gradient onPress={() => router.push('/manager/list-hotel' as Href)} />
          </View>
          <View className="flex-1">
            <Button label="Create package" variant="secondary" onPress={() => router.push('/manager/create-package' as Href)} />
          </View>
        </View>

        <Text className="mb-3 mt-7 text-lg font-bold text-ink">Your properties</Text>
        {isLoading ? (
          <Text className="text-ink-soft">Loading…</Text>
        ) : hotels.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title="No properties yet"
            description="Tap 'List a hotel' above to publish your first property."
          />
        ) : (
          hotels.map((h) => (
            <Pressable
              key={h.id}
              className="mb-2"
              onPress={() => router.push(`/manager/list-hotel?id=${h.id}` as Href)}
            >
              <Card className="flex-row items-center p-3">
                <Image
                  source={{ uri: h.main_image_url ?? h.image_urls?.[0] ?? FALLBACK_IMAGE }}
                  style={{ width: 56, height: 56, borderRadius: 10 }}
                />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-ink" numberOfLines={1}>
                    {h.name || 'Untitled property'}
                  </Text>
                  <Text className="text-xs text-ink-soft" numberOfLines={1}>
                    {[h.city, h.country].filter(Boolean).join(', ')}
                    {h.base_price_per_night
                      ? ` · from ${Number(h.base_price_per_night).toLocaleString()}/night`
                      : ''}
                  </Text>
                </View>
                <Badge label={h.is_published ? 'live' : 'draft'} tone={h.is_published ? 'success' : 'neutral'} />
              </Card>
            </Pressable>
          ))
        )}

        <Text className="mb-3 mt-7 text-lg font-bold text-ink">Your packages</Text>
        {packagesLoading ? (
          <Text className="text-ink-soft">Loading…</Text>
        ) : packages.length === 0 ? (
          <EmptyState
            icon="gift-outline"
            title="No packages yet"
            description="Bundle a stay with perks — tap 'Create package' above."
          />
        ) : (
          packages.map((p) => (
            <Pressable
              key={p.id}
              className="mb-2"
              onPress={() => router.push(`/manager/create-package?id=${p.id}` as Href)}
            >
              <Card className="flex-row items-center p-3">
                <Image
                  source={{ uri: p.cover_image ?? FALLBACK_IMAGE }}
                  style={{ width: 56, height: 56, borderRadius: 10 }}
                />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-ink" numberOfLines={1}>
                    {p.name || 'Untitled package'}
                  </Text>
                  <Text className="text-xs text-ink-soft" numberOfLines={1}>
                    {(p.package_type ?? 'custom').replace(/_/g, ' ')}
                    {p.base_price_per_night
                      ? ` · ${p.currency ?? 'PKR'} ${Number(p.base_price_per_night).toLocaleString()}/night`
                      : ''}
                  </Text>
                </View>
                <Badge label={p.is_published ? 'live' : 'draft'} tone={p.is_published ? 'success' : 'neutral'} />
              </Card>
            </Pressable>
          ))
        )}
        </ScrollView>

        {/* Frosted header — content scrolls beneath the glass */}
        <GlassBar style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <AppHeader
            showBack
            title="Manager dashboard"
            subtitle="Your properties"
            right={
              <Pressable
                onPress={openDrawer}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full bg-surface-sunken"
              >
                <Menu size={20} color={c.ink} />
              </Pressable>
            }
          />
        </GlassBar>
      </View>
    </Screen>
  )
}
