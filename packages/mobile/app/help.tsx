import { router, type Href } from 'expo-router'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'

import {
  Briefcase,
  ChevronRight,
  CircleHelp,
  FileText,
  type LucideIcon,
  MessageSquare,
  Send,
  Shield,
} from '@/components/icons/lucide'
import { AppHeader, Card, Screen } from '@/components/ui'
import { useRoleTheme, useThemeColors } from '@/theme'

const SUPPORT_EMAIL = 'tripavail92@gmail.com'

function HelpRow({
  Icon,
  title,
  desc,
  onPress,
  last,
}: {
  Icon: LucideIcon
  title: string
  desc: string
  onPress: () => void
  last?: boolean
}) {
  const theme = useRoleTheme()
  const c = useThemeColors()
  return (
    <Pressable onPress={onPress}>
      <View className={`flex-row items-center py-3.5 ${last ? '' : 'border-b border-line'}`}>
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary-100">
          <Icon size={18} color={theme.primary} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-ink">{title}</Text>
          <Text className="mt-0.5 text-xs leading-4 text-ink-soft">{desc}</Text>
        </View>
        <ChevronRight size={18} color={c.inkSoft} />
      </View>
    </Pressable>
  )
}

export default function HelpScreen() {
  const theme = useRoleTheme()

  return (
    <Screen>
      <AppHeader showBack title="Help & Support" subtitle="We usually reply within a day" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Card className="items-center p-6">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-100">
            <CircleHelp size={26} color={theme.primary} />
          </View>
          <Text className="mt-3 text-lg font-bold text-ink">How can we help?</Text>
          <Text className="mt-1 text-center text-sm leading-5 text-ink-muted">
            Reach our support team or browse the essentials below.
          </Text>
        </Card>

        <Card className="mt-4 px-4">
          <HelpRow
            Icon={Send}
            title="Email support"
            desc={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
          <HelpRow
            Icon={MessageSquare}
            title="Message your operator or host"
            desc="Booking questions go fastest through the booking thread."
            onPress={() => router.push('/messages' as Href)}
          />
          <HelpRow
            Icon={Shield}
            title="Refunds & cancellations"
            desc="Manage a booking from My Trips → Manage booking."
            onPress={() => router.push('/(tabs)/trips' as Href)}
          />
          <HelpRow
            Icon={Briefcase}
            title="Partner with TripAvail"
            desc="List tours, hotels, and packages."
            onPress={() => router.push('/become-partner' as Href)}
          />
          <HelpRow
            Icon={FileText}
            title="Terms, privacy & policies"
            desc="Read the full legal documents on tripavail.com."
            onPress={() => Linking.openURL('https://tripavail.com/legal')}
            last
          />
        </Card>

        <Text className="mt-5 text-center text-xs text-ink-soft">
          TripAvail · support hours 9:00–21:00 PKT, 7 days a week
        </Text>
      </ScrollView>
    </Screen>
  )
}
