import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { Bell } from '@/components/icons/lucide'
import { useNotifications } from '@/hooks/useNotifications'

/** Bell with live unread badge. Taps to the notifications screen (or sign-in). */
export function NotificationBell({ color = '#ffffff' }: { color?: string }) {
  const { unread, isAuthed } = useNotifications()
  return (
    <Pressable
      onPress={() => router.push(isAuthed ? '/notifications' : '/(auth)/login')}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
    >
      <Bell size={20} color={color} />
      {unread > 0 ? (
        <View className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1">
          <Text className="text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}
