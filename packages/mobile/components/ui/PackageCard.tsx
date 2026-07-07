import { router, type Href } from 'expo-router'
import { Image, Pressable, Text, View } from 'react-native'

import { MapPin, Star } from '@/components/icons/lucide'
import { Badge } from './Badge'
import { Card } from './Card'
import type { DiscoveryPackage } from '@/lib/packageDiscovery'
import { resolvePackageType } from '@/lib/packageOptions'

const FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'

/** Full-width package card (Hotels tab / browse lists). */
export function PackageCard({ pkg }: { pkg: DiscoveryPackage }) {
  return (
    <Pressable className="mb-4" onPress={() => router.push(`/packages/${pkg.slug ?? pkg.id}` as Href)}>
      <Card className="overflow-hidden">
        <Image source={{ uri: pkg.image ?? FALLBACK }} style={{ height: 176 }} className="w-full" resizeMode="cover" />
        <View className="p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-ink" numberOfLines={2}>
                {pkg.name}
              </Text>
              <View className="mt-1 flex-row items-center">
                <MapPin size={12} color="#94a3b8" />
                <Text className="ml-1 flex-1 text-xs text-ink-muted" numberOfLines={1}>
                  {pkg.hotelName}
                  {pkg.location ? ` · ${pkg.location}` : ''}
                </Text>
              </View>
              {pkg.starRating && pkg.starRating > 0 ? (
                <View className="mt-1 flex-row items-center">
                  {Array.from({ length: pkg.starRating }).map((_, i) => (
                    <Star key={i} size={10} color="#f59e0b" fill="#f59e0b" />
                  ))}
                  {pkg.propertyType ? (
                    <Text className="ml-1.5 text-[10px] uppercase tracking-wide text-ink-soft">{pkg.propertyType}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
            {pkg.rating > 0 ? (
              <View className="flex-row items-center">
                <Star size={12} color="#f59e0b" fill="#f59e0b" />
                <Text className="ml-1 text-xs font-semibold text-ink">{pkg.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {pkg.packageType ? <Badge label={resolvePackageType(pkg.packageType).name} tone="primary" /> : null}
              {pkg.minimumNights ? <Badge label={`${pkg.minimumNights}+ nights`} tone="neutral" /> : null}
            </View>
            {pkg.pricePerNight != null ? (
              <Text className="text-base font-black text-primary-700">
                {pkg.currency} {pkg.pricePerNight.toLocaleString()}
                <Text className="text-xs font-normal text-ink-soft"> /night</Text>
              </Text>
            ) : (
              <Text className="text-sm font-semibold text-ink-muted">Contact</Text>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  )
}

/** Compact horizontal-rail package card (Home "Featured packages"). */
export function PackageRailCard({ pkg }: { pkg: DiscoveryPackage }) {
  return (
    <Pressable
      className="mr-4 w-60"
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.97 }] } : undefined)}
      onPress={() => router.push(`/packages/${pkg.slug ?? pkg.id}` as Href)}
    >
      <Card className="overflow-hidden">
        <Image source={{ uri: pkg.image ?? FALLBACK }} style={{ height: 132 }} className="w-full" resizeMode="cover" />
        <View className="p-3">
          <Text className="font-bold text-ink" numberOfLines={1}>
            {pkg.name}
          </Text>
          <Text className="mt-0.5 text-xs text-ink-soft" numberOfLines={1}>
            {pkg.hotelName}
            {pkg.location ? ` · ${pkg.location}` : ''}
          </Text>
          <View className="mt-2 flex-row items-center justify-between">
            {pkg.pricePerNight != null ? (
              <Text className="text-sm font-black text-primary-700">
                {pkg.currency} {pkg.pricePerNight.toLocaleString()}
                <Text className="text-[10px] font-normal text-ink-soft"> /night</Text>
              </Text>
            ) : (
              <Text className="text-xs font-semibold text-ink-muted">Contact</Text>
            )}
            {pkg.rating > 0 ? (
              <View className="flex-row items-center">
                <Star size={11} color="#f59e0b" fill="#f59e0b" />
                <Text className="ml-0.5 text-xs font-semibold text-ink">{pkg.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  )
}
