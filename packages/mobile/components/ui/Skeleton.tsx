import { useEffect, useRef } from 'react'
import { Animated, type DimensionValue, View } from 'react-native'

import { Card } from './Card'

/** Pulsing placeholder block. Use while content loads instead of a spinner. */
export function Skeleton({
  height,
  width = '100%',
  radius = 12,
}: {
  height: number
  width?: DimensionValue
  radius?: number
}) {
  const opacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <Animated.View
      style={{ width, height, borderRadius: radius, backgroundColor: '#e2e8f0', opacity }}
    />
  )
}

/** Skeleton matching TourCard's grid or list layout. */
export function TourCardSkeleton({ layout = 'list' }: { layout?: 'grid' | 'list' }) {
  if (layout === 'grid') {
    return (
      <View className="flex-1">
        <Card flat className="flex-1 overflow-hidden">
          <Skeleton height={128} radius={0} />
          <View className="gap-2 p-3">
            <Skeleton height={13} width="90%" />
            <Skeleton height={11} width="55%" />
            <Skeleton height={13} width="40%" />
          </View>
        </Card>
      </View>
    )
  }
  return (
    <Card flat className="overflow-hidden">
      <Skeleton height={176} radius={0} />
      <View className="gap-2 p-4">
        <Skeleton height={16} width="80%" />
        <Skeleton height={12} width="50%" />
        <Skeleton height={12} width="95%" />
      </View>
    </Card>
  )
}
