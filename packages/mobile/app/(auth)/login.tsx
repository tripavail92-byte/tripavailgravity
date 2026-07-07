import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useThemeColors } from '@/theme'

export default function LoginScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const c = useThemeColors()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!email.trim() || !password) return
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password, fullName.trim())
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed.')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surfacePage }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-center px-6">
          {/* Brand */}
          <View className="mb-10">
            <Text className="text-4xl font-black tracking-tight text-primary-700">TripAvail</Text>
            <Text className="mt-1 text-base text-ink-muted">
              {mode === 'login' ? 'Sign in to continue' : 'Create your free account'}
            </Text>
          </View>

          {mode === 'signup' ? (
            <TextInput
              className="mb-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-base text-ink"
              placeholder="Full name"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoComplete="name"
            />
          ) : null}

          <TextInput
            className="mb-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-base text-ink"
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            className="mb-4 rounded-2xl border border-line bg-surface px-4 py-3.5 text-base text-ink"
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />

          {error ? <Text className="mb-3 text-center text-sm text-danger">{error}</Text> : null}

          <Button
            label={mode === 'login' ? 'Sign In' : 'Create Account'}
            size="lg"
            loading={loading}
            onPress={handleSubmit}
          />

          <Pressable
            className="mt-3 flex-row items-center justify-center rounded-2xl border border-line bg-surface py-4"
            onPress={handleGoogle}
          >
            <Ionicons name="logo-google" size={18} color={c.ink} />
            <Text className="ml-2 font-semibold text-ink">Continue with Google</Text>
          </Pressable>

          <Pressable
            className="mt-6 items-center"
            onPress={() => {
              setError(null)
              setMode(mode === 'login' ? 'signup' : 'login')
            }}
          >
            <Text className="text-ink-muted">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text className="font-semibold text-primary-700">
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
