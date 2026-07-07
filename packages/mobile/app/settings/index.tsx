import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { AppHeader, Avatar, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useThemeModeStore } from '@/theme'

export default function AccountSettingsScreen() {
  const { user } = useAuth()
  const mode = useThemeModeStore((s) => s.mode)
  const setMode = useThemeModeStore((s) => s.setMode)
  const [fullName, setFullName] = useState<string>(user?.user_metadata?.full_name ?? '')
  const [saving, setSaving] = useState(false)

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Account Settings" />
        <EmptyState
          icon="person-outline"
          title="Sign in required"
          description="Sign in to view and edit your account."
        >
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } })
      if (error) throw error
      Alert.alert('Saved', 'Your profile has been updated.')
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen>
      <AppHeader showBack title="Account Settings" />
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="items-center">
          <Avatar uri={user.user_metadata?.avatar_url} name={fullName || user.email} size={88} />
          <Pressable
            className="mt-3"
            onPress={() => Alert.alert('Coming soon', 'Photo upload is on the way.')}
          >
            <Text className="text-sm font-semibold text-primary-700">Change photo</Text>
          </Pressable>
        </View>

        <Card className="mt-6 p-4">
          <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Full name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor="#94a3b8"
            className="mt-1 text-base text-ink"
            autoCapitalize="words"
          />
        </Card>

        <Card flat className="mt-3 bg-surface-sunken p-4">
          <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Email</Text>
          <Text className="mt-1 text-base text-ink-muted">{user.email}</Text>
        </Card>

        <Card className="mt-3 p-4">
          <Text className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Appearance</Text>
          <View className="mt-3 flex-row gap-2">
            {(['light', 'dark', 'system'] as const).map((m) => {
              const active = mode === m
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  className={`flex-1 items-center rounded-xl py-2.5 ${
                    active ? 'bg-primary-700' : 'bg-surface-sunken'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold capitalize ${
                      active ? 'text-white' : 'text-ink-muted'
                    }`}
                  >
                    {m}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Card>

        <View className="mt-6">
          <Button label="Save changes" loading={saving} onPress={save} />
        </View>
      </ScrollView>
    </Screen>
  )
}
