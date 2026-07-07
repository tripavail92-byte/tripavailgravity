import { Text, View } from 'react-native'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: 'bg-surface-sunken', fg: 'text-ink-muted' },
  primary: { bg: 'bg-primary-50', fg: 'text-primary-700' },
  success: { bg: 'bg-success-bg', fg: 'text-success-fg' },
  warning: { bg: 'bg-warning-bg', fg: 'text-warning-fg' },
  danger: { bg: 'bg-danger-bg', fg: 'text-danger-fg' },
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = TONES[tone]
  return (
    <View className={`rounded-full px-3 py-1 ${t.bg}`}>
      <Text className={`text-xs font-semibold capitalize ${t.fg}`}>{label}</Text>
    </View>
  )
}
