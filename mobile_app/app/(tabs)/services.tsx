import { useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'
import { shadows } from '@/theme/shadows'

const HUBS = [
  {
    title: 'Documents & Records',
    description: 'File blotters, request certificates, and manage business permits.',
    icon: 'document-text',
    color: colors.primary,
    actions: [
      { label: 'Blotter', icon: 'document-text', route: '/(tabs)/blotter?section=blotter' },
      { label: 'Certificates', icon: 'ribbon', route: '/(tabs)/blotter?section=certificate' },
      { label: 'Business Permit', icon: 'business', route: '/(tabs)/blotter?section=business' },
    ],
  },
  {
    title: 'Emergency & Relief',
    description: 'Request help, report power issues, and access relief support.',
    icon: 'warning',
    color: colors.danger,
    actions: [
      { label: 'Emergency', icon: 'alert-circle', route: '/(tabs)/calamity?section=emergency' },
      { label: 'Electricity', icon: 'flash', route: '/(tabs)/calamity?section=electricity' },
      { label: 'Relief', icon: 'gift', route: '/(tabs)/calamity?section=relief' },
    ],
  },
  {
    title: 'Youth & SK',
    description: 'Browse SK events, projects, and scholarship opportunities.',
    icon: 'school',
    color: colors.success,
    actions: [
      { label: 'Events', icon: 'calendar', route: '/(tabs)/sk?section=events' },
      { label: 'Projects', icon: 'construct', route: '/(tabs)/sk?section=projects' },
      { label: 'Scholarships', icon: 'book', route: '/(tabs)/sk?section=scholarships' },
    ],
  },
  {
    title: 'Administration',
    description: 'Manage barangay settings, staff accounts, user access, and view audit logs.',
    icon: 'settings',
    color: colors.text,
    actions: [
      { label: 'Brgy Settings', icon: 'cog', route: '/(tabs)/settings' },
      { label: 'Brgy Management', icon: 'people', route: '/(tabs)/management' },
      { label: 'User Management', icon: 'shield', route: '/(tabs)/user-management' },
      { label: 'Audit Logs', icon: 'list', route: '/(tabs)/admin-logs' },
    ],
  },
]

export default function ServicesDashboard() {
  const router = useRouter()
  useEffect(() => {
    // Keep the screen focused on the services dashboard.
  }, [])

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Services</Text>
          <Text style={s.subtitle}>Three quick service categories for resident requests and support.</Text>
        </View>

        {HUBS.map(hub => (
          <View key={hub.title} style={[s.hubCard, { borderColor: hub.color + '22' }]}>
            <View style={s.hubHeader}>
              <View style={[s.hubBadge, { backgroundColor: hub.color + '16' }]}>
                <Ionicons name={hub.icon as any} size={18} color={hub.color} />
              </View>
              <View style={s.hubTitleWrap}>
                <Text style={[s.hubTitle, { color: colors.text }]}>{hub.title}</Text>
                <Text style={s.hubDescription}>{hub.description}</Text>
              </View>
            </View>
            <View style={s.actionGrid}>
              {hub.actions.map(action => (
                <TouchableOpacity
                  key={action.label}
                  style={s.actionCard}
                  onPress={() => router.push(action.route as never)}
                  activeOpacity={0.8}
                >
                  <View style={[s.actionIcon, { backgroundColor: hub.color + '14' }]}>
                    <Ionicons name={action.icon as any} size={18} color={hub.color} />
                  </View>
                  <Text style={s.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  hubCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg, gap: spacing.md, ...shadows.card },
  hubHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  hubBadge: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  hubTitleWrap: { flex: 1 },
  hubTitle: { fontSize: 16, fontWeight: '800', marginBottom: spacing.xs },
  hubDescription: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  actionCard: { width: '48%', backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  actionIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
})
