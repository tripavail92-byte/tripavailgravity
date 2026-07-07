import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

import {
  Camera,
  Check,
  CircleAlert,
  Clock,
  type LucideIcon,
  Shield,
  ShieldCheck,
} from '@/components/icons/lucide'
import { AppHeader, Badge, Button, Card, EmptyState, Screen } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRoleTheme } from '@/theme'
import {
  createKycSession,
  fetchSessionByToken,
  getActiveKycSession,
  getLatestRejectedSession,
  type KycField,
  type KycRole,
  type KycSession,
  submitForReview,
  uploadKycImage,
} from '@/lib/kyc'

type Tone = 'success' | 'warning' | 'danger' | 'neutral'

interface StatusInfo {
  tone: Tone
  title: string
  desc: string
  icon: LucideIcon
  color: string
}

function getStatusInfo(status: string): StatusInfo {
  switch (status) {
    case 'approved':
    case 'verified':
      return {
        tone: 'success',
        title: 'Verified',
        desc: 'Your identity has been verified. You have full access.',
        icon: ShieldCheck,
        color: '#16a34a',
      }
    case 'pending':
    case 'in_review':
    case 'pending_admin_review':
    case 'processing':
      return {
        tone: 'warning',
        title: 'Under review',
        desc: 'We received your documents and are reviewing them. This usually takes 1–2 days.',
        icon: Clock,
        color: '#d97706',
      }
    case 'rejected':
      return {
        tone: 'danger',
        title: 'Action needed',
        desc: 'Your verification was not approved. Please re-submit clear photos of your ID.',
        icon: CircleAlert,
        color: '#dc2626',
      }
    default:
      return {
        tone: 'neutral',
        title: 'Not verified',
        desc: 'Verify your identity with two photos of your ID card (CNIC). Biometric scanning is not required.',
        icon: Shield,
        color: '#64748b',
      }
  }
}

function CaptureCard({
  label,
  hint,
  uri,
  uploading,
  uploaded,
  onCapture,
}: {
  label: string
  hint: string
  uri: string | null
  uploading: boolean
  uploaded: boolean
  onCapture: () => void
}) {
  const theme = useRoleTheme()
  return (
    <Card className="mb-3 p-4">
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="font-bold text-ink">{label}</Text>
          <Text className="mt-0.5 text-xs leading-4 text-ink-soft">{hint}</Text>
        </View>
        {uploaded ? (
          <View className="h-7 w-7 items-center justify-center rounded-full bg-success-bg">
            <Check size={15} color="#15803d" />
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={onCapture}
        disabled={uploading}
        className="mt-3 h-44 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-surface-sunken"
      >
        {uri ? (
          <>
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            {uploading ? (
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <ActivityIndicator color="#ffffff" />
                <Text className="mt-2 text-xs font-semibold text-white">Uploading…</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View className="items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
              <Camera size={22} color={theme.primary} />
            </View>
            <Text className="mt-2 text-sm font-semibold text-ink">Take photo</Text>
          </View>
        )}
      </Pressable>
    </Card>
  )
}

export default function VerificationScreen() {
  const { user, activeRole, partnerType } = useAuth()
  const theme = useRoleTheme()

  const kycRole: KycRole | null =
    partnerType === 'tour_operator' || partnerType === 'hotel_manager' ? partnerType : null
  const roleStatus =
    (activeRole as { verification_status?: string } | null)?.verification_status ?? 'unverified'

  const [session, setSession] = useState<KycSession | null>(null)
  const [rejection, setRejection] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!kycRole)
  const [capturing, setCapturing] = useState(false)
  const [shots, setShots] = useState<Record<KycField, string | null>>({ id_front: null, id_back: null })
  const [uploadingField, setUploadingField] = useState<KycField | null>(null)
  const [uploaded, setUploaded] = useState<Record<KycField, boolean>>({ id_front: false, id_back: false })
  const [submitting, setSubmitting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadSession = useCallback(async () => {
    if (!user || !kycRole) return
    setLoading(true)
    try {
      const active = await getActiveKycSession(user.id, kycRole)
      setSession(active)
      if (active) {
        setUploaded({ id_front: !!active.id_front_path, id_back: !!active.id_back_path })
      }
      if (!active || active.status === 'rejected') {
        const rejected = await getLatestRejectedSession(user.id, kycRole)
        setRejection(rejected?.review_notes || rejected?.failure_reason || null)
      }
    } catch {
      // status view still renders
    } finally {
      setLoading(false)
    }
  }, [user, kycRole])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current)
    },
    [],
  )

  // Once both sides are in, OCR runs server-side; poll until it settles, then file for review.
  const watchProcessing = useCallback(
    (token: string) => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        const fresh = await fetchSessionByToken(token)
        if (!fresh) return
        setSession(fresh)
        if (fresh.status === 'pending_admin_review') {
          if (pollRef.current) clearInterval(pollRef.current)
          setSubmitting(true)
          try {
            await submitForReview({
              partnerType: kycRole!,
              email: user?.email ?? null,
              fullName: user?.user_metadata?.full_name ?? null,
              phone: user?.phone ?? null,
              businessName: null,
              kycSessionToken: fresh.session_token,
              kycStatus: fresh.status,
            })
          } catch {
            // session already pending_admin_review — admins can still see it
          } finally {
            setSubmitting(false)
          }
        } else if (fresh.status === 'failed' || fresh.status === 'rejected' || fresh.status === 'expired') {
          if (pollRef.current) clearInterval(pollRef.current)
          setRejection(fresh.review_notes || fresh.failure_reason || 'Photo check failed — please retake.')
        }
      }, 3000)
    },
    [kycRole, user],
  )

  const capture = async (field: KycField) => {
    if (!user || !kycRole || capturing) return
    setCapturing(true)
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      let result: ImagePicker.ImagePickerResult
      if (perm.granted) {
        result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: false })
      } else {
        // Camera denied — fall back to the photo library so the flow isn't blocked.
        const lib = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!lib.granted) {
          Alert.alert('Permission needed', 'Allow camera or photo access to capture your ID.')
          return
        }
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 })
      }
      if (result.canceled || !result.assets?.[0]) return
      const uri = result.assets[0].uri
      setShots((s) => ({ ...s, [field]: uri }))

      // Lazy session creation on first capture (30-min token TTL).
      let current = session
      if (!current || !['pending', 'uploading'].includes(current.status)) {
        current = await createKycSession(user.id, kycRole)
        setSession(current)
        setUploaded({ id_front: false, id_back: false })
      }

      setUploadingField(field)
      await uploadKycImage(current.session_token, field, uri)
      setUploaded((u) => {
        const next = { ...u, [field]: true }
        if (next.id_front && next.id_back) watchProcessing(current!.session_token)
        return next
      })
      setRejection(null)
    } catch (e: any) {
      Alert.alert('Could not upload', e?.message ?? 'Please try again.')
    } finally {
      setUploadingField(null)
      setCapturing(false)
    }
  }

  if (!user) {
    return (
      <Screen>
        <AppHeader showBack title="Verification" />
        <EmptyState
          icon="shield-outline"
          title="Sign in required"
          description="Sign in to check your verification status."
        >
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    )
  }

  const sessionStatus = session?.status ?? null
  const effectiveStatus =
    roleStatus === 'approved'
      ? 'approved'
      : sessionStatus === 'processing' || sessionStatus === 'pending_admin_review'
        ? sessionStatus
        : roleStatus
  const info = getStatusInfo(effectiveStatus)
  const showCapture =
    !!kycRole &&
    effectiveStatus !== 'approved' &&
    effectiveStatus !== 'processing' &&
    effectiveStatus !== 'pending_admin_review' &&
    effectiveStatus !== 'pending' &&
    effectiveStatus !== 'in_review'

  return (
    <Screen>
      <AppHeader showBack title="Verification" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Card className="items-center p-6">
          <View
            className="h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${info.color}1A` }}
          >
            {loading ? <ActivityIndicator color={theme.primary} /> : <info.icon size={30} color={info.color} />}
          </View>
          <View className="mt-4">
            <Badge label={info.title} tone={info.tone} />
          </View>
          <Text className="mt-3 text-center text-sm leading-5 text-ink-muted">{info.desc}</Text>
          {submitting ? (
            <Text className="mt-2 text-xs font-semibold text-warning">Filing for admin review…</Text>
          ) : null}
        </Card>

        {rejection ? (
          <Card className="mt-3 border-2 border-danger p-4">
            <Text className="text-xs font-bold uppercase tracking-wide text-danger">Reviewer notes</Text>
            <Text className="mt-1 text-sm leading-5 text-ink">{rejection}</Text>
          </Card>
        ) : null}

        {!kycRole ? (
          <Text className="mt-5 text-center text-xs leading-5 text-ink-soft">
            Identity verification is required for partners (tour operators and hotel managers). As a
            traveller you're all set — become a partner from your profile to start.
          </Text>
        ) : null}

        {showCapture ? (
          <View className="mt-5">
            <Text className="mb-3 text-base font-bold text-ink">Photograph your ID card</Text>
            <CaptureCard
              label="ID card — front"
              hint="The side with your photo. Fill the frame, avoid glare."
              uri={shots.id_front}
              uploading={uploadingField === 'id_front'}
              uploaded={uploaded.id_front}
              onCapture={() => capture('id_front')}
            />
            <CaptureCard
              label="ID card — back"
              hint="The side with the address. Keep it flat and sharp."
              uri={shots.id_back}
              uploading={uploadingField === 'id_back'}
              uploaded={uploaded.id_back}
              onCapture={() => capture('id_back')}
            />
            <Text className="mt-1 text-center text-xs leading-5 text-ink-soft">
              Photos are checked automatically (sharpness, glare, expiry) and then reviewed by our
              team. Only document photos are needed — no face scanning.
            </Text>
          </View>
        ) : null}

        {sessionStatus === 'processing' ? (
          <Card className="mt-4 flex-row items-center p-4">
            <ActivityIndicator color={theme.primary} />
            <Text className="ml-3 flex-1 text-sm text-ink-muted">
              Reading your document… this takes under a minute.
            </Text>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
