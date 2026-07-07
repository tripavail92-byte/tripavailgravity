import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native'
import MapView, { Marker, type MapPressEvent, type Region } from 'react-native-maps'
import * as Location from 'expo-location'

import { MapPin, X } from '@/components/icons/lucide'
import { useRoleTheme, useThemeColors } from '@/theme'
import { Button } from './Button'

export interface PickedLocation {
  lat: number
  lng: number
}

const DEFAULT_REGION: Region = {
  // Pakistan-centric default (matches the marketplace's home market).
  latitude: 30.3753,
  longitude: 69.3451,
  latitudeDelta: 12,
  longitudeDelta: 12,
}

/**
 * Full-screen map location picker. Tap to drop the pin, drag to refine,
 * or jump to the device's GPS position. Returns plain {lat, lng} — callers
 * write it into their own wizard state (hotel location / tour pickup).
 */
export function LocationPickerModal({
  visible,
  title = 'Pick a location',
  initial,
  onClose,
  onConfirm,
}: {
  visible: boolean
  title?: string
  initial?: PickedLocation | null
  onClose: () => void
  onConfirm: (loc: PickedLocation) => void
}) {
  const theme = useRoleTheme()
  const c = useThemeColors()
  const mapRef = useRef<MapView>(null)
  const [pin, setPin] = useState<PickedLocation | null>(initial ?? null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (visible) setPin(initial ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const place = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    setPin({ lat: latitude, lng: longitude })
  }

  const useMyLocation = async () => {
    setLocating(true)
    try {
      const perm = await Location.requestForegroundPermissionsAsync()
      if (!perm.granted) return
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setPin(loc)
      mapRef.current?.animateToRegion(
        { latitude: loc.lat, longitude: loc.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        400,
      )
    } catch {
      // GPS unavailable — user can still tap the map
    } finally {
      setLocating(false)
    }
  }

  const initialRegion: Region = initial
    ? { latitude: initial.lat, longitude: initial.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : DEFAULT_REGION

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.surfacePage }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-5 pb-3"
          style={{ paddingTop: 52, backgroundColor: c.surfaceCard }}
        >
          <View>
            <Text className="text-lg font-bold text-ink">{title}</Text>
            <Text className="text-xs text-ink-soft">Tap the map to drop a pin, drag to refine.</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-sunken"
          >
            <X size={18} color={c.inkMuted} />
          </Pressable>
        </View>

        {/* Map */}
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            onPress={place}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {pin ? (
              <Marker
                coordinate={{ latitude: pin.lat, longitude: pin.lng }}
                draggable
                onDragEnd={(e) =>
                  setPin({
                    lat: e.nativeEvent.coordinate.latitude,
                    lng: e.nativeEvent.coordinate.longitude,
                  })
                }
                pinColor={theme.primary}
              />
            ) : null}
          </MapView>

          {/* GPS button */}
          <Pressable
            onPress={useMyLocation}
            className="absolute bottom-5 right-5 h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: c.surfaceCard,
              shadowColor: '#0f172a',
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 6,
            }}
          >
            {locating ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <MapPin size={20} color={theme.primary} />
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <View className="px-5 pb-10 pt-3" style={{ backgroundColor: c.surfaceCard }}>
          {pin ? (
            <Text className="mb-2 text-center text-xs font-semibold text-ink-muted">
              {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
            </Text>
          ) : (
            <Text className="mb-2 text-center text-xs text-ink-soft">No pin yet — tap the map.</Text>
          )}
          <Button
            label="Use this location"
            gradient
            disabled={!pin}
            onPress={() => {
              if (pin) {
                onConfirm(pin)
                onClose()
              }
            }}
          />
        </View>
      </View>
    </Modal>
  )
}
