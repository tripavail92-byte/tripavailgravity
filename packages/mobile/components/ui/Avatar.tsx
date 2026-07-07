import { Image, Text, View } from 'react-native'

interface AvatarProps {
  uri?: string | null
  name?: string | null
  size?: number
}

function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const letters = parts.map((w) => w[0]?.toUpperCase() ?? '').join('')
  return letters || '?'
}

export function Avatar({ uri, name, size = 44 }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-surface-sunken"
      />
    )
  }
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-primary-100"
    >
      <Text className="font-bold text-primary-800" style={{ fontSize: size * 0.36 }}>
        {initials(name)}
      </Text>
    </View>
  )
}
