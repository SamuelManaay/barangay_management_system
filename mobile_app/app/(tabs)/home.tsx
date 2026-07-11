import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Modal, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useAuth } from '../_layout'
import { supabase } from '@/lib/supabase'
import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'
import { shadows } from '@/theme/shadows'

const SERVICE_HUBS = [
  {
    id: 'barangay',
    title: 'Barangay Services',
    subtitle: 'File blotters, request certificates, and manage business permits.',
    icon: 'document-text' as const,
    color: colors.primary,
    route: '/(tabs)/services',
  },
  {
    id: 'emergency',
    title: 'Emergency & Relief',
    subtitle: 'Report emergencies, power issues, and evacuation needs.',
    icon: 'warning' as const,
    color: colors.danger,
    route: '/(tabs)/services',
  },
  {
    id: 'youth',
    title: 'Youth & SK',
    subtitle: 'View SK activities, events, and scholarships.',
    icon: 'school' as const,
    color: colors.success,
    route: '/(tabs)/services',
  },
]

const SOS_TYPES = [
  { type: 'Police', icon: 'shield' as const, color: colors.info, bg: colors.infoSoft },
  { type: 'Fire', icon: 'flame' as const, color: colors.danger, bg: colors.dangerSoft },
  { type: 'Medical', icon: 'medkit' as const, color: colors.success, bg: colors.successSoft },
]

export default function HomeScreen() {
  const { resident, logout } = useAuth()
  const router = useRouter()
  const [time, setTime] = useState(new Date())
  const [showSOS, setShowSOS] = useState(false)
  const [sosStep, setSosStep] = useState<'disclaimer' | 'choose' | 'sending' | 'sent'>('disclaimer')
  const [pendingSosType, setPendingSosType] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  function openSOS() { setSosStep('disclaimer'); setShowSOS(true) }

  function closeSOS() { setShowSOS(false); setSosStep('disclaimer'); setPendingSosType(null) }

  async function handleSOS(sosType: string) {
    if (!resident) return
    setSosStep('sending')
    let lat: number | null = null
    let lng: number | null = null
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      }
    } catch {}
    await supabase.from('cal_requests').insert({
      resident_id: resident.id,
      requester_name: `${resident.first_name} ${resident.last_name}`,
      request_type: sosType,
      sos_type: sosType,
      people_affected: 1,
      priority: 'Critical',
      status: 'Pending',
      latitude: lat,
      longitude: lng,
      notes: `🆘 SOS via mobile app${lat ? ` · GPS: ${lat.toFixed(5)}, ${lng?.toFixed(5)}` : ' · Location unavailable'}`,
    })
    setSosStep('sent')
  }

  const hour = time.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'
  const dateStr = time.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>

        {/* ── Top Bar ── */}
        <View style={s.topBar}>
          <View style={s.topLeft}>
            <View style={s.logoCircle}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </View>
            <View>
              <Text style={s.brgyName}>Barangay Portal</Text>
              <Text style={s.brgyMuni}>e-Gov Resident App</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={s.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#93c5fd" />
          </TouchableOpacity>
        </View>

        {/* ── Hero Banner ── */}
        <View style={s.hero}>
          <View style={s.heroOverlay} />
          <View style={s.heroContent}>
            <Text style={s.heroGreeting}>{greeting},</Text>
            <Text style={s.heroName}>{resident?.first_name} {resident?.last_name}</Text>
            {resident?.purok && (
              <View style={s.heroPurok}>
                <Ionicons name="location" size={12} color="#93c5fd" />
                <Text style={s.heroPurokText}>Purok {resident.purok}</Text>
              </View>
            )}
            <Text style={s.heroDate}>{dateStr}</Text>
          </View>
          <View style={s.heroCard}>
            <View style={s.heroCardRow}>
              <Ionicons name="shield-checkmark" size={16} color="#10b981" />
              <Text style={s.heroCardText}>Verified Resident</Text>
            </View>
            <Text style={s.heroCardId}>ID: {resident?.id?.slice(0, 8).toUpperCase() ?? '—'}</Text>
          </View>
        </View>

        {/* ── SOS + Emergency Row ── */}
        <View style={s.emergencySection}>
          {/* SOS Button */}
          <TouchableOpacity style={s.sosBtn} onPress={openSOS} activeOpacity={0.8}>
            <Ionicons name="alert-circle" size={28} color="#fff" />
            <Text style={s.sosBtnText}>SOS</Text>
          </TouchableOpacity>

          {/* Emergency Assistance */}
          <TouchableOpacity style={s.emergCard} onPress={() => router.push('/(tabs)/calamity?section=emergency' as never)} activeOpacity={0.85}>
            <View style={s.emergCardTop}>
              <Ionicons name="warning" size={18} color="#dc2626" />
              <Text style={s.emergCardTitle}>Emergency Assistance</Text>
            </View>
            <Text style={s.emergCardSub}>File a detailed emergency request for barangay response</Text>
            <View style={s.emergCardLink}>
              <Text style={s.emergCardLinkText}>Open form</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Info Cards ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Barangay Info</Text>
          <View style={s.infoGrid}>
            <View style={[s.infoCard, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="time" size={20} color="#1e40af" />
              <Text style={s.infoCardTitle}>Office Hours</Text>
              <Text style={s.infoCardVal}>Mon – Fri</Text>
              <Text style={s.infoCardSub}>8:00 AM – 5:00 PM</Text>
            </View>
            <View style={[s.infoCard, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="call" size={20} color="#059669" />
              <Text style={s.infoCardTitle}>Hotline</Text>
              <Text style={s.infoCardVal}>143</Text>
              <Text style={s.infoCardSub}>Emergency Line</Text>
            </View>
            <View style={[s.infoCard, { backgroundColor: '#fff7ed' }]}>
              <Ionicons name="people" size={20} color="#ea580c" />
              <Text style={s.infoCardTitle}>Officials</Text>
              <Text style={s.infoCardVal}>Punong</Text>
              <Text style={s.infoCardSub}>Barangay</Text>
            </View>
            <View style={[s.infoCard, { backgroundColor: '#faf5ff' }]}>
              <Ionicons name="document" size={20} color="#7c3aed" />
              <Text style={s.infoCardTitle}>Certificates</Text>
              <Text style={s.infoCardVal}>3–5 Days</Text>
              <Text style={s.infoCardSub}>Processing</Text>
            </View>
          </View>
        </View>

        {/* ── Notice ── */}
        <View style={s.notice}>
          <Ionicons name="information-circle" size={16} color="#1e40af" />
          <Text style={s.noticeText}>Admin, officials, tanods & staff can now access their modules from the mobile app.</Text>
        </View>

      </ScrollView>

      {/* ── SOS Modal ── */}
      <Modal visible={showSOS} transparent animationType="fade">
        <View style={s.sosOverlay}>
          <View style={s.sosSheet}>

            {/* STEP 1 — Disclaimer */}
            {sosStep === 'disclaimer' && (
              <>
                <View style={s.sosDisclaimerIcon}>
                  <Ionicons name="warning" size={36} color="#dc2626" />
                </View>
                <Text style={s.sosModalTitle}>Before You Continue</Text>
                <View style={s.sosDisclaimerBox}>
                  <Text style={s.sosDisclaimerText}>
                    {'This SOS feature is for '}
                    <Text style={{ fontWeight: '900' }}>{'REAL EMERGENCIES ONLY'}</Text>
                    {'. By proceeding, you acknowledge that:'}
                  </Text>
                  <Text style={[s.sosDisclaimerText, { marginTop: 8 }]}>
                    {'- False or prank SOS alerts are a '}
                    <Text style={{ fontWeight: '800' }}>{'punishable offense'}</Text>
                    {' under Philippine law (R.A. 10175 & local ordinances).'}
                  </Text>
                  <Text style={[s.sosDisclaimerText, { marginTop: 6 }]}>
                    {'- Your identity, GPS location, and timestamp are recorded.'}
                  </Text>
                  <Text style={[s.sosDisclaimerText, { marginTop: 6 }]}>
                    {'- Misuse may result in '}
                    <Text style={{ fontWeight: '800' }}>{'fines, community service, or criminal liability'}</Text>
                    {'.'}
                  </Text>
                  <Text style={[s.sosDisclaimerText, { marginTop: 10, fontStyle: 'italic' }]}>
                    {'Only press SOS if you or someone near you is in immediate danger.'}
                  </Text>
                </View>
                <TouchableOpacity style={s.sosAgreeBtn} onPress={() => setSosStep('choose')}>
                  <Text style={s.sosAgreeBtnText}>I Understand — Proceed</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.sosCancelBtn} onPress={closeSOS}>
                  <Text style={s.sosCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2 — Choose type */}
            {sosStep === 'choose' && (
              <>
                <View style={s.sosModalHeader}>
                  <Ionicons name="alert-circle" size={32} color="#dc2626" />
                  <Text style={s.sosModalTitle}>Select Emergency Type</Text>
                  <Text style={s.sosModalSub}>Your live GPS location will be sent automatically to responders.</Text>
                </View>
                <View style={s.sosTypeRow}>
                  {SOS_TYPES.map(item => (
                    <TouchableOpacity key={item.type} style={[s.sosTypeCard, { backgroundColor: item.bg, borderColor: item.color + '44' }]} onPress={() => handleSOS(item.type)}>
                      <View style={[s.sosTypeBigIcon, { backgroundColor: item.bg, borderColor: item.color + '44' }]}>
                        <Ionicons name={item.icon} size={32} color={item.color} />
                      </View>
                      <Text style={[s.sosTypeLabel, { color: item.color }]}>{item.type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={s.sosCancelBtn} onPress={closeSOS}>
                  <Text style={s.sosCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3 — Sending */}
            {sosStep === 'sending' && (
              <View style={s.sosSendingBox}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={s.sosSendingText}>Getting your location & sending SOS...</Text>
              </View>
            )}

            {/* STEP 4 — Sent */}
            {sosStep === 'sent' && (
              <View style={s.sosSentBox}>
                <Ionicons name="checkmark-circle" size={60} color="#10b981" />
                <Text style={s.sosSentTitle}>SOS Sent!</Text>
                <Text style={s.sosSentSub}>Your location has been shared with emergency responders. Stay calm and stay where you are.</Text>
                <TouchableOpacity style={s.sosDoneBtn} onPress={closeSOS}>
                  <Text style={s.sosDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, zIndex: 10 },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  brgyName: { color: colors.surface, fontSize: 14, fontWeight: '800' },
  brgyMuni: { color: '#bfdbfe', fontSize: 11 },
  logoutBtn: { padding: spacing.xs },
  hero: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  heroOverlay: { position: 'absolute', top: 0, right: 0, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroContent: { marginBottom: spacing.lg },
  heroGreeting: { color: '#c7d2fe', fontSize: 13 },
  heroName: { color: colors.surface, fontSize: 24, fontWeight: '900', marginTop: 2, letterSpacing: 0.3 },
  heroPurok: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  heroPurokText: { color: '#bfdbfe', fontSize: 12 },
  heroDate: { color: '#bfdbfe', fontSize: 11, marginTop: 6 },
  heroCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  heroCardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroCardText: { color: colors.success, fontSize: 13, fontWeight: '700' },
  heroCardId: { color: '#bfdbfe', fontSize: 11, fontFamily: 'monospace' },
  emergencySection: { flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.lg, alignItems: 'stretch' },
  sosBtn: { width: 84, borderRadius: radius.lg, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.md, ...shadows.button },
  sosBtnText: { color: colors.surface, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  emergCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-between', ...shadows.card },
  emergCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  emergCardTitle: { fontSize: 13, fontWeight: '800', color: colors.danger },
  emergCardSub: { fontSize: 11, color: colors.textMuted, lineHeight: 16, marginBottom: spacing.sm },
  emergCardLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  emergCardLinkText: { fontSize: 12, color: colors.danger, fontWeight: '700' },
  sosOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  sosSheet: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, width: '100%', alignItems: 'center' },
  sosDisclaimerIcon: { marginBottom: spacing.sm },
  sosModalHeader: { alignItems: 'center', marginBottom: spacing.lg, gap: 6 },
  sosModalTitle: { fontSize: 20, fontWeight: '900', color: colors.danger, marginBottom: 4 },
  sosModalSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  sosDisclaimerBox: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: '#fecaca', marginBottom: spacing.lg, width: '100%' },
  sosDisclaimerText: { fontSize: 12, color: '#7f1d1d', lineHeight: 20 },
  sosAgreeBtn: { backgroundColor: colors.danger, borderRadius: radius.md, paddingVertical: spacing.md, width: '100%', alignItems: 'center', marginBottom: 4 },
  sosAgreeBtnText: { color: colors.surface, fontWeight: '800', fontSize: 14 },
  sosTypeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, width: '100%' },
  sosTypeCard: { flex: 1, alignItems: 'center', borderRadius: radius.md, padding: spacing.md, gap: 8, borderWidth: 1 },
  sosTypeBigIcon: { width: 58, height: 58, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 4 },
  sosTypeLabel: { fontSize: 12, fontWeight: '800' },
  sosSendingBox: { alignItems: 'center', gap: 14, paddingVertical: spacing.xl },
  sosSendingText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  sosCancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  sosCancelText: { fontSize: 14, color: colors.textSoft, fontWeight: '600' },
  sosSentBox: { alignItems: 'center', gap: 10 },
  sosSentTitle: { fontSize: 24, fontWeight: '900', color: colors.success },
  sosSentSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  sosDoneBtn: { marginTop: spacing.sm, backgroundColor: colors.success, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  sosDoneText: { color: colors.surface, fontWeight: '800', fontSize: 15 },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  seeAll: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  groupCard: { flex: 1, minWidth: '48%', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, gap: spacing.xs, overflow: 'hidden' },
  groupIcon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  groupTitle: { fontSize: 15, fontWeight: '800', marginBottom: spacing.xs },
  groupSubtitle: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.sm },
  groupBadge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  groupBadgeText: { fontSize: 11, fontWeight: '700' },
  quickCard: { width: '22%', aspectRatio: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(15,23,42,0.05)' },
  quickIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoCard: { width: '47%', borderRadius: radius.md, padding: spacing.md, gap: 3, borderWidth: 1, borderColor: colors.border },
  infoCardTitle: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 6 },
  infoCardVal: { fontSize: 15, fontWeight: '800', color: colors.text },
  infoCardSub: { fontSize: 11, color: colors.textSoft },
  notice: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', margin: spacing.lg, marginTop: spacing.xl, backgroundColor: colors.infoSoft, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 30 },
  noticeText: { flex: 1, fontSize: 11, color: colors.info, lineHeight: 17 },
})
