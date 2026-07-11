import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../_layout'
import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'
import { shadows } from '@/theme/shadows'

export default function AccountScreen() {
  const { resident, staffUser, sessionType, logout } = useAuth()

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.avatar}>
            <Ionicons name="person" size={28} color={colors.surface} />
          </View>
          <Text style={s.title}>{resident ? `${resident.first_name} ${resident.last_name}` : (staffUser?.full_name ?? 'Staff Account')}</Text>
          <Text style={s.subtitle}>{resident?.purok ? `Purok ${resident.purok}` : (sessionType === 'staff' ? `${staffUser?.role ?? 'Staff'} account` : 'Verified resident')}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Account Details</Text>
          <View style={s.row}>
            <Text style={s.label}>{sessionType === 'staff' ? 'User ID' : 'Resident ID'}</Text>
            <Text style={s.value}>{(resident?.id ?? staffUser?.id)?.slice(0, 12).toUpperCase() ?? '—'}</Text>
          </View>
          {resident ? <View style={s.row}><Text style={s.label}>Primary Contact</Text><Text style={s.value}>{resident?.primary_contact ?? 'Not provided'}</Text></View> : null}
          <View style={s.row}>
            <Text style={s.label}>Status</Text>
            <Text style={s.value}>{sessionType === 'staff' ? 'Active staff account' : 'Verified'}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Quick Actions</Text>
          <TouchableOpacity style={s.action} activeOpacity={0.8} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={s.actionText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  value: { fontSize: 13, color: colors.text, fontWeight: '700', flex: 1, textAlign: 'right' },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  actionText: { fontSize: 14, fontWeight: '700', color: colors.danger },
})
