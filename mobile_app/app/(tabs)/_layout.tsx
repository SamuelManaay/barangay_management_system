import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSoft,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="services" options={{ title: 'Services', tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
      <Tabs.Screen name="admin-logs" options={{ href: null }} />
      <Tabs.Screen name="blotter" options={{ href: null }} />
      <Tabs.Screen name="business" options={{ href: null }} />
      <Tabs.Screen name="calamity-centers" options={{ href: null }} />
      <Tabs.Screen name="calamity-damage" options={{ href: null }} />
      <Tabs.Screen name="calamity-electricity" options={{ href: null }} />
      <Tabs.Screen name="calamity-incidents" options={{ href: null }} />
      <Tabs.Screen name="calamity-patrol" options={{ href: null }} />
      <Tabs.Screen name="calamity-relief" options={{ href: null }} />
      <Tabs.Screen name="calamity-requests" options={{ href: null }} />
      <Tabs.Screen name="calamity" options={{ href: null }} />
      <Tabs.Screen name="certificates-liquidation" options={{ href: null }} />
      <Tabs.Screen name="certificates-print" options={{ href: null }} />
      <Tabs.Screen name="certificates" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="management" options={{ href: null }} />
      <Tabs.Screen name="officials" options={{ href: null }} />
      <Tabs.Screen name="residents" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="settlements" options={{ href: null }} />
      <Tabs.Screen name="sk-events" options={{ href: null }} />
      <Tabs.Screen name="sk-projects" options={{ href: null }} />
      <Tabs.Screen name="sk-scholarships" options={{ href: null }} />
      <Tabs.Screen name="sk-youth" options={{ href: null }} />
      <Tabs.Screen name="sk" options={{ href: null }} />
    </Tabs>
  )
}
