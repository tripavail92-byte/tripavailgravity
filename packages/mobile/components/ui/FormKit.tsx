import { Pressable, Switch, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native'

import { Minus, Plus } from '@/components/icons/lucide'
import { useRoleTheme, useThemeColors } from '@/theme'

/** Shared wizard form primitives (used by the operator/manager listing wizards). */

export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  keyboardType?: KeyboardTypeOptions
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</Text>
      <View className="rounded-2xl border border-line bg-surface px-4">
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          multiline={multiline}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          className="py-3 text-base text-ink"
          style={multiline ? { minHeight: 90, textAlignVertical: 'top' } : undefined}
        />
      </View>
    </View>
  )
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 mr-2 rounded-full border px-4 py-2 ${active ? 'border-primary-700 bg-primary-700' : 'border-line bg-surface'}`}
    >
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  )
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 9999,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  const c = useThemeColors()
  return (
    <View className="flex-row items-center gap-3">
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
        <Minus size={18} color={c.ink} />
      </Pressable>
      <Text className="min-w-[44px] text-center text-lg font-bold text-ink">{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
        <Plus size={18} color={c.ink} />
      </Pressable>
    </View>
  )
}

export function SectionLabel({ children }: { children: string }) {
  return <Text className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">{children}</Text>
}

export function ReviewRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between py-2.5 ${last ? '' : 'border-b border-line'}`}>
      <Text className="text-sm text-ink-muted">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-ink" numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  last,
}: {
  label: string
  hint?: string
  value: boolean
  onChange: (v: boolean) => void
  last?: boolean
}) {
  const theme = useRoleTheme()
  const c = useThemeColors()
  return (
    <View className={`flex-row items-center py-3 ${last ? '' : 'border-b border-line'}`}>
      <View className="flex-1 pr-3">
        <Text className="text-[15px] font-medium text-ink">{label}</Text>
        {hint ? <Text className="mt-0.5 text-xs leading-4 text-ink-soft">{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.surfaceSunken, true: theme.primary }}
        thumbColor="#ffffff"
      />
    </View>
  )
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: Array<{ v: string; label: string }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <View className="mb-3 flex-row rounded-2xl border border-line bg-surface p-1">
      {options.map((o) => {
        const active = value === o.v
        return (
          <Pressable
            key={o.v}
            onPress={() => onChange(o.v)}
            className={`flex-1 items-center rounded-xl py-2 ${active ? 'bg-primary-700' : ''}`}
          >
            <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink-muted'}`}>{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function WizardProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View className="mx-5 mb-3 mt-1 flex-row gap-1">
      {steps.map((t, i) => (
        <View key={t + i} className={`h-1.5 flex-1 rounded-full ${i <= current ? 'bg-primary-700' : 'bg-surface-sunken'}`} />
      ))}
    </View>
  )
}
