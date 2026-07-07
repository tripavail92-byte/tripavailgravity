import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'

import { Pause } from '@/components/icons/lucide'
import { Field, Segmented, SectionLabel, Stepper, ToggleRow } from '@/components/ui/FormKit'
import { AppHeader, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme } from '@/theme'
import {
  fetchOperatorSettings,
  saveOperatorSettings,
  type OperatorSettings,
} from '@/lib/roleSettings'

export default function OperatorSettingsScreen() {
  const { user } = useAuth()
  const theme = useRoleTheme()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<OperatorSettings | null>(null)
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['operator', 'settings', user?.id],
    queryFn: () => fetchOperatorSettings(user!.id),
    enabled: !!user,
  })

  useEffect(() => {
    if (data && !form) setForm(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Business settings" />
        <EmptyState icon="person-circle-outline" title="Sign in" description="Sign in to manage your settings.">
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  if (isLoading || !form) {
    return (
      <Screen>
        <AppHeader showBack title="Business settings" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    )
  }

  const set = (patch: Partial<OperatorSettings>) => setForm((f) => (f ? { ...f, ...patch } : f))

  const save = async () => {
    setSaving(true)
    try {
      const { operator_id: _omit, ...updates } = form
      await saveOperatorSettings(user.id, updates)
      queryClient.invalidateQueries({ queryKey: ['operator', 'settings'] })
      Alert.alert('Saved', 'Your business settings have been updated.')
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen>
      <AppHeader showBack title="Business settings" subtitle="Tour operator" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Pause bookings — the high-signal control, pinned on top like web */}
        <Card className={`p-4 ${form.pause_bookings ? 'border-2 border-warning' : ''}`}>
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-warning-bg">
              <Pause size={18} color="#d97706" />
            </View>
            <View className="ml-3 flex-1">
              <ToggleRow
                label="Pause bookings"
                hint="Travellers can browse your tours but can't book until you resume."
                value={form.pause_bookings}
                onChange={(v) => set({ pause_bookings: v })}
                last
              />
            </View>
          </View>
        </Card>

        <SectionLabel>Business information</SectionLabel>
        <Card className="p-4">
          <Field label="Business name" value={form.business_name} onChange={(v) => set({ business_name: v })} placeholder="Your company name" />
          <Field label="Business email" value={form.business_email} onChange={(v) => set({ business_email: v })} placeholder="hello@yourtours.com" keyboardType="email-address" />
          <Field label="Business phone" value={form.business_phone} onChange={(v) => set({ business_phone: v })} placeholder="+92 …" keyboardType="phone-pad" />
          <Field label="Website (optional)" value={form.website_url} onChange={(v) => set({ website_url: v })} placeholder="https://…" />
          <Field label="Registration number (optional)" value={form.business_registration_number} onChange={(v) => set({ business_registration_number: v })} placeholder="Company registration #" />
          <Field label="Tax ID (optional)" value={form.tax_id} onChange={(v) => set({ tax_id: v })} placeholder="NTN / tax number" />
        </Card>

        <SectionLabel>Cancellation & refunds</SectionLabel>
        <Card className="p-4">
          <Segmented
            value={form.cancellation_policy}
            onChange={(v) => set({ cancellation_policy: v as OperatorSettings['cancellation_policy'] })}
            options={[
              { v: 'flexible', label: 'Flexible' },
              { v: 'moderate', label: 'Moderate' },
              { v: 'strict', label: 'Strict' },
            ]}
          />
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[15px] font-medium text-ink">Free cancellation up to</Text>
            <View className="flex-row items-center">
              <Stepper value={form.cancellation_days_before} onChange={(v) => set({ cancellation_days_before: v })} min={0} max={60} />
              <Text className="ml-2 text-sm text-ink-muted">days</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[15px] font-medium text-ink">Refund percentage</Text>
            <View className="flex-row items-center">
              <Stepper value={form.refund_percentage} onChange={(v) => set({ refund_percentage: v })} min={0} max={100} />
              <Text className="ml-2 text-sm text-ink-muted">%</Text>
            </View>
          </View>
        </Card>

        <SectionLabel>Tour management</SectionLabel>
        <Card className="p-4">
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[15px] font-medium text-ink">Max group size</Text>
            <Stepper value={form.max_group_size} onChange={(v) => set({ max_group_size: v })} min={1} max={500} />
          </View>
        </Card>

        <SectionLabel>Notifications</SectionLabel>
        <Card className="p-4">
          <ToggleRow label="New bookings" value={form.booking_notifications} onChange={(v) => set({ booking_notifications: v })} />
          <ToggleRow label="Tour reminders" value={form.tour_reminders} onChange={(v) => set({ tour_reminders: v })} />
          <ToggleRow label="Messages" value={form.messaging_notifications} onChange={(v) => set({ messaging_notifications: v })} />
          <ToggleRow label="New reviews" value={form.review_notifications} onChange={(v) => set({ review_notifications: v })} />
          <ToggleRow label="Payments" value={form.payment_notifications} onChange={(v) => set({ payment_notifications: v })} last />
        </Card>

        <View className="mt-6">
          <Button label="Save settings" gradient loading={saving} onPress={save} />
        </View>
        <Text className="mt-3 text-center text-xs text-ink-soft">
          Payout accounts and identity verification are managed on the web dashboard.
        </Text>
      </ScrollView>
    </Screen>
  )
}
