import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { MaterialIcons, Feather } from '@expo/vector-icons'
import { AppCard } from '@/components/ui/AppCard'
import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'
import { shadows } from '@/theme/shadows'
import { useRouter } from 'expo-router'
import { useAuth } from '../_layout'

type Stats = { residents: number; blotters: number; certificates: number; businesses: number; officials: number; pending: number; settled: number }
type RecentBlotter = { id: string; incident_type?: string | null; blotter_status: string; date_recorded: string; incident_location?: string | null }

export default function DashboardScreen() {
  const router = useRouter()
  const { staffUser: authStaffUser, hasStaffAccess } = useAuth()
  const [stats, setStats] = useState<Stats>({ residents: 0, blotters: 0, certificates: 0, businesses: 0, officials: 0, pending: 0, settled: 0 })
  const [recent, setRecent] = useState<RecentBlotter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [res, blot, cert, biz, off, pend, sett, rec] = await Promise.all([
        supabase.from('residents').select('id', { count: 'exact', head: true }),
        supabase.from('blotter_records').select('id', { count: 'exact', head: true }),
        supabase.from('certificate_issuances').select('id', { count: 'exact', head: true }),
        supabase.from('business_permits').select('id', { count: 'exact', head: true }),
        supabase.from('barangay_officials').select('id', { count: 'exact', head: true }),
        supabase.from('blotter_records').select('id', { count: 'exact', head: true }).eq('blotter_status', 'Pending'),
        supabase.from('blotter_records').select('id', { count: 'exact', head: true }).eq('blotter_status', 'Settled'),
        supabase.from('blotter_records').select('id,incident_type,blotter_status,date_recorded,incident_location').order('created_at', { ascending: false }).limit(6),
      ])
      setStats({ residents: res.count ?? 0, blotters: blot.count ?? 0, certificates: cert.count ?? 0, businesses: biz.count ?? 0, officials: off.count ?? 0, pending: pend.count ?? 0, settled: sett.count ?? 0 })
      setRecent(rec.data ?? [])
      setLoading(false)
    }
    load()
  }, [authStaffUser])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const actions = [
    { label: 'Residents', icon: 'users', color: colors.primary, route: '/(tabs)/residents' as const, enabled: hasStaffAccess('residents') },
    { label: 'Blotter', icon: 'file-plus', color: colors.danger, route: '/(tabs)/blotter' as const, enabled: true },
    { label: 'Certificates', icon: 'file-text', color: colors.success, route: '/(tabs)/certificates' as const, enabled: hasStaffAccess('certificates') },
    { label: 'Business', icon: 'briefcase', color: colors.warning, route: '/(tabs)/business' as const, enabled: hasStaffAccess('business') },
    { label: 'Officials', icon: 'user-check', color: colors.info, route: '/(tabs)/officials' as const, enabled: hasStaffAccess('officials') },
    { label: 'Audit Logs', icon: 'clipboard', color: colors.info, route: '/(tabs)/admin-logs' as const, enabled: hasStaffAccess('audit_logs') },
    { label: 'Settings', icon: 'settings', color: colors.warning, route: '/(tabs)/settings' as const, enabled: hasStaffAccess('staff') },
    { label: 'Management', icon: 'shield', color: colors.primary, route: '/(tabs)/management' as const, enabled: hasStaffAccess('staff') },
  ]

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.headerContent}>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.name}>{authStaffUser?.full_name ?? 'Welcome'} 👋</Text>
            <Text style={s.date}>{new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            <View style={s.chipsRow}>
              <View style={s.chip}><Feather name="clock" size={12} color={colors.warning} /><Text style={s.chipText}>{loading ? '—' : `${stats.pending} pending`}</Text></View>
              <View style={s.chip}><Feather name="check-circle" size={12} color={colors.success} /><Text style={s.chipText}>{loading ? '—' : `${stats.settled} settled`}</Text></View>
              <View style={s.chip}><MaterialIcons name="how-to-reg" size={12} color={colors.primary} /><Text style={s.chipText}>{loading ? '—' : `${stats.residents} residents`}</Text></View>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
          <AppCard style={s.statCardBig}>
            <View style={[s.iconCircle, { backgroundColor: colors.primary }]}><MaterialIcons name="people" size={18} color={colors.surface} /></View>
            <Text style={s.statValueBig}>{loading ? '—' : stats.residents.toLocaleString()}</Text>
            <Text style={s.statLabelSmall}>Total Residents</Text>
          </AppCard>
          <AppCard style={s.statCardBig}>
            <View style={[s.iconCircle, { backgroundColor: colors.danger }]}><MaterialIcons name="scale" size={18} color={colors.surface} /></View>
            <Text style={s.statValueBig}>{loading ? '—' : stats.blotters.toLocaleString()}</Text>
            <Text style={s.statLabelSmall}>Blotter Records</Text>
          </AppCard>
          <AppCard style={s.statCardBig}>
            <View style={[s.iconCircle, { backgroundColor: colors.success }]}><Feather name="file-text" size={18} color={colors.surface} /></View>
            <Text style={s.statValueBig}>{loading ? '—' : stats.certificates.toLocaleString()}</Text>
            <Text style={s.statLabelSmall}>Certificates</Text>
          </AppCard>
        </ScrollView>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actionsGrid}>
            {actions.map(a => (
              <TouchableOpacity key={a.label} style={[s.actionItem, !a.enabled && s.actionItemDisabled]} activeOpacity={0.7} disabled={!a.enabled} onPress={() => a.enabled && router.push(a.route)}>
                <View style={[s.actionIcon, { backgroundColor: a.color }]}> 
                  <Feather name={a.icon as any} size={14} color={colors.surface} />
                </View>
                <Text style={s.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Blotter Records</Text>
          {loading ? <Text style={s.loadingText}>Loading...</Text> : recent.length === 0 ? <Text style={s.loadingText}>No blotter records yet</Text> : (
            <FlatList
              data={recent}
              keyExtractor={i => i.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={s.blotterItem}>
                  <View style={s.blotterLeft}>
                    <Text style={s.blotterType}>{item.incident_type ?? '—'}</Text>
                    <Text style={s.blotterLoc}>{item.incident_location ?? '—'}</Text>
                  </View>
                  <View style={s.blotterRight}>
                    <Text style={s.blotterDate}>{item.date_recorded}</Text>
                    <View style={[s.statusPill, item.blotter_status === 'Pending' ? s.statusPending : s.statusSettled]}>
                      <Text style={s.statusText}>{item.blotter_status}</Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xxl },
  header: { backgroundColor: colors.primary, paddingBottom: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  headerContent: { paddingTop: 28, paddingHorizontal: spacing.lg },
  greeting: { color: '#c7d2fe', fontSize: 14, fontWeight: '600' },
  name: { color: colors.surface, fontSize: 20, fontWeight: '800', marginTop: spacing.sm },
  date: { color: '#bfdbfe', fontSize: 12, marginTop: spacing.xs },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  chipText: { color: '#e6eefc', fontSize: 12, marginLeft: spacing.xs },
  statsRow: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md, gap: spacing.md },
  statCardBig: { width: 220, alignItems: 'flex-start', ...shadows.card },
  iconCircle: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValueBig: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabelSmall: { marginTop: spacing.xs, fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionItem: { width: '48%', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  actionItemDisabled: { opacity: 0.45 },
  actionIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '700', color: colors.text, flex: 1 },
  loadingText: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  blotterItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  blotterLeft: { flex: 1 },
  blotterType: { fontSize: 14, fontWeight: '700', color: colors.text },
  blotterLoc: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  blotterRight: { alignItems: 'flex-end', marginLeft: spacing.md },
  blotterDate: { fontSize: 12, color: colors.textMuted },
  statusPill: { marginTop: spacing.xs, paddingVertical: 4, paddingHorizontal: 8, borderRadius: radius.pill },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusSettled: { backgroundColor: '#d1fae5' },
})
