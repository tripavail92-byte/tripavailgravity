import { Tabs } from 'expo-router'
import { StyleSheet } from 'react-native'
import { Bed, GlobeHemisphereEast, Mountains, UserCircle } from 'phosphor-react-native'

import { GlassBar } from '@/components/ui/Glass'
import { useRoleTheme, useThemeColors } from '@/theme'

/**
 * Bottom navigation — mirrors the web portal (Home / Hotels / Trips / Profile)
 * with travel-flavoured Phosphor icons: the active tab fills in DUOTONE with
 * the role colour (wanderlust globe, hotel bed, northern mountains).
 */
export default function TabLayout() {
  const theme = useRoleTheme()
  const c = useThemeColors()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: c.inkSoft,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        // Liquid-glass tab bar: content scrolls beneath a blurred translucent bar.
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: 4,
        },
        tabBarBackground: () => <GlassBar style={StyleSheet.absoluteFill} intensity={60} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <GlobeHemisphereEast size={focused ? 27 : 24} color={color} weight={focused ? 'duotone' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="hotels"
        options={{
          title: 'Hotels',
          tabBarIcon: ({ color, focused }) => (
            <Bed size={focused ? 27 : 24} color={color} weight={focused ? 'duotone' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="tours"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, focused }) => (
            <Mountains size={focused ? 27 : 24} color={color} weight={focused ? 'duotone' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <UserCircle size={focused ? 27 : 24} color={color} weight={focused ? 'duotone' : 'regular'} />
          ),
        }}
      />
      {/* Routes kept out of the tab bar */}
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="trips" options={{ href: null }} />
    </Tabs>
  )
}
