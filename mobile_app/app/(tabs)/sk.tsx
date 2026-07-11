import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

type Section = 'menu' | 'events' | 'projects' | 'scholarships'

type SKEvent = { id: string; event_name: string; event_type: string; event_date?: string; location?: string; status: string; description?: string }
type SKProject = { id: string; project_name: string; description?: string; budget_allocation: number; amount_spent: number; status: string; start_date?: string; end_date?: string }
type SKScholarship = { id: string; scholarship_name: string; school?: string; year_level?: string; amount: number; status: string; start_date?: string; end_date?: string; residents?: { first_name: string; last_name: string } }

const statusColor: Record<string, string> = {
  Upcoming: '#3b82f6', Ongoing: '#10b981', Completed: '#94a3b8', Cancelled: '#ef4444',
  Planned: '#f59e0b', Active: '#10b981', Revoked: '#ef4444',
}

export default function SKTab() {
  const params = useLocalSearchParams<{ section?: string }>()
  const router = useRouter()
  const [section, setSection] = useState<Section>((params.section as Section) || 'menu')

  useEffect(() => {
    setSection((params.section as Section) || 'menu')
  }, [params.section])

  function handleBack() {
    if (params.section) router.push('/(tabs)/home' as never)
    else setSection('menu')
  }
  const [events, setEvents] = useState<SKEvent[]>([])
  const [projects, setProjects] = useState<SKProject[]>([])
  const [scholarships, setScholarships] = useState<SKScholarship[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (sec: Section) => {
    setLoading(true)
    if (sec === 'events') {
      const { data } = await supabase.from('sk_events').select('*').order('event_date', { ascending: false })
      setEvents(data ?? [])
    }
    if (sec === 'projects') {
      const { data } = await supabase.from('sk_projects').select('*').order('created_at', { ascending: false })
      setProjects(data ?? [])
    }
    if (sec === 'scholarships') {
      const { data } = await supabase.from('sk_scholarships').select('*, residents(first_name, last_name)').order('created_at', { ascending: false })
      setScholarships(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (section !== 'menu') load(section) }, [section, load])

  if (section === 'menu') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>SK Programs</Text>
          <Text style={s.pageSub}>Sangguniang Kabataan updates & scholarships</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          <View style={s.viewOnlyBanner}>
            <Ionicons name="eye" size={16} color="#7c3aed" />
            <Text style={s.viewOnlyText}>View-only access for residents. Contact the SK office for inquiries.</Text>
          </View>
          <TouchableOpacity style={s.menuCard} onPress={() => setSection('events')}>
            <View style={[s.menuIcon, { backgroundColor: '#05966918' }]}> 
              <Ionicons name="calendar" size={26} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Programs & Events</Text>
              <Text style={s.menuSub}>View upcoming SK activities and events</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuCard} onPress={() => setSection('projects')}>
            <View style={[s.menuIcon, { backgroundColor: '#0284c718' }]}> 
              <Ionicons name="construct" size={26} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Project Updates</Text>
              <Text style={s.menuSub}>Track SK community project progress</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuCard} onPress={() => setSection('scholarships')}>
            <View style={[s.menuIcon, { backgroundColor: '#7c3aed18' }]}> 
              <Ionicons name="school" size={26} color="#7c3aed" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Scholarships</Text>
              <Text style={s.menuSub}>View available SK scholarship grants</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={s.topTitle}>
          {section === 'events' ? 'SK Programs & Events' : section === 'projects' ? 'SK Projects' : 'Scholarships'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading && <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />}

        {/* EVENTS */}
        {section === 'events' && !loading && (
          events.length === 0
            ? <Text style={s.empty}>No events found.</Text>
            : events.map(e => (
              <View key={e.id} style={s.card}>
                <View style={s.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{e.event_name}</Text>
                    <View style={s.typeTag}>
                      <Text style={s.typeTagText}>{e.event_type}</Text>
                    </View>
                  </View>
                  <View style={[s.badge, { backgroundColor: (statusColor[e.status] ?? '#94a3b8') + '22' }]}>
                    <Text style={[s.badgeText, { color: statusColor[e.status] ?? '#94a3b8' }]}>{e.status}</Text>
                  </View>
                </View>
                {e.event_date && <Text style={s.meta}>📅 {e.event_date}</Text>}
                {e.location && <Text style={s.meta}>📍 {e.location}</Text>}
                {e.description && <Text style={s.desc}>{e.description}</Text>}
              </View>
            ))
        )}

        {/* PROJECTS */}
        {section === 'projects' && !loading && (
          projects.length === 0
            ? <Text style={s.empty}>No projects found.</Text>
            : projects.map(p => {
              const pct = p.budget_allocation > 0 ? Math.min(100, Math.round((p.amount_spent / p.budget_allocation) * 100)) : 0
              return (
                <View key={p.id} style={s.card}>
                  <View style={s.cardRow}>
                    <Text style={[s.cardTitle, { flex: 1 }]}>{p.project_name}</Text>
                    <View style={[s.badge, { backgroundColor: (statusColor[p.status] ?? '#94a3b8') + '22' }]}>
                      <Text style={[s.badgeText, { color: statusColor[p.status] ?? '#94a3b8' }]}>{p.status}</Text>
                    </View>
                  </View>
                  {p.description && <Text style={s.desc}>{p.description}</Text>}
                  <View style={s.budgetRow}>
                    <Text style={s.meta}>💰 ₱{Number(p.budget_allocation).toLocaleString()} allocated</Text>
                    <Text style={s.meta}>💸 ₱{Number(p.amount_spent).toLocaleString()} spent</Text>
                  </View>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: pct > 90 ? '#ef4444' : '#10b981' }]} />
                  </View>
                  <Text style={[s.meta, { marginTop: 4 }]}>{pct}% of budget used</Text>
                  {(p.start_date || p.end_date) && (
                    <Text style={s.meta}>📅 {p.start_date ?? '?'} – {p.end_date ?? 'ongoing'}</Text>
                  )}
                </View>
              )
            })
        )}

        {/* SCHOLARSHIPS */}
        {section === 'scholarships' && !loading && (
          scholarships.length === 0
            ? <Text style={s.empty}>No scholarships found.</Text>
            : scholarships.map(sch => (
              <View key={sch.id} style={s.card}>
                <View style={s.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{sch.scholarship_name}</Text>
                    {sch.residents && (
                      <Text style={s.scholarName}>🎓 {sch.residents.last_name}, {sch.residents.first_name}</Text>
                    )}
                  </View>
                  <View style={[s.badge, { backgroundColor: (statusColor[sch.status] ?? '#94a3b8') + '22' }]}>
                    <Text style={[s.badgeText, { color: statusColor[sch.status] ?? '#94a3b8' }]}>{sch.status}</Text>
                  </View>
                </View>
                {sch.school && <Text style={s.meta}>🏫 {sch.school}</Text>}
                {sch.year_level && <Text style={s.meta}>📚 {sch.year_level}</Text>}
                <Text style={s.amount}>₱{Number(sch.amount).toLocaleString()}</Text>
                {(sch.start_date || sch.end_date) && (
                  <Text style={s.meta}>📅 {sch.start_date ?? '?'} – {sch.end_date ?? 'ongoing'}</Text>
                )}
              </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function MenuScreen({ onSelect }: { onSelect: (s: Section) => void }) {
  const items = [
    { id: 'events' as Section, icon: 'calendar' as const, label: 'Programs & Events', sub: 'View upcoming SK activities and events', color: '#059669' },
    { id: 'projects' as Section, icon: 'construct' as const, label: 'Project Updates', sub: 'Track SK community project progress', color: '#0284c7' },
    { id: 'scholarships' as Section, icon: 'school' as const, label: 'Scholarships', sub: 'View available SK scholarship grants', color: '#7c3aed' },
  ]
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>SK Programs</Text>
        <Text style={s.pageSub}>Sangguniang Kabataan updates & scholarships</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <View style={s.viewOnlyBanner}>
          <Ionicons name="eye" size={16} color="#7c3aed" />
          <Text style={s.viewOnlyText}>View-only access for residents. Contact the SK office for inquiries.</Text>
        </View>
        {items.map(item => (
          <TouchableOpacity key={item.id} style={s.menuCard} onPress={() => onSelect(item.id)}>
            <View style={[s.menuIcon, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuSub}>{item.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  pageHeader: { backgroundColor: '#065f46', paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  pageSub: { fontSize: 13, color: '#a7f3d0', marginTop: 4 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 4 },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', gap: 6 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  typeTag: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, alignSelf: 'flex-start' },
  typeTagText: { fontSize: 11, fontWeight: '600', color: '#1e40af' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 12, color: '#64748b' },
  desc: { fontSize: 13, color: '#475569', lineHeight: 18, marginTop: 2 },
  budgetRow: { flexDirection: 'row', gap: 16 },
  progressBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 9999, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', borderRadius: 9999 },
  scholarName: { fontSize: 13, color: '#059669', fontWeight: '600', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '800', color: '#059669', marginTop: 2 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
  viewOnlyBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#f5f3ff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd6fe', marginBottom: 4 },
  viewOnlyText: { flex: 1, fontSize: 12, color: '#7c3aed', lineHeight: 17 },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  menuIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  menuSub: { fontSize: 12, color: '#64748b' },
})
