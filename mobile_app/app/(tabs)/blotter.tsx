import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../_layout'

type Section = 'menu' | 'blotter' | 'summons' | 'certificate' | 'business'

type BlotterRecord = { id: string; incident_type: string; blotter_status: string; date_recorded: string; incident_location?: string }
type Summon = { id: string; summon_date: string; summon_time: string; status: string; blotter_records?: { incident_type: string } }
type CertType = { id: string; name: string; price: number }
type PersonInvolved = { first_name: string; last_name: string; involvement_type: string }

const INCIDENT_TYPES = ['Physical Injury', 'Theft', 'Trespassing', 'Noise Complaint', 'Domestic Violence', 'Verbal Abuse', 'Property Damage', 'Others']
const INVOLVEMENT_TYPES = ['Complainant', 'Victim', 'Respondent', 'Witness']

const statusColor: Record<string, string> = {
  Pending: '#f59e0b', Settled: '#10b981', Dismissed: '#94a3b8', 'For Filing': '#ef4444',
  Upcoming: '#3b82f6', Completed: '#10b981', Cancelled: '#ef4444',
}

export default function BlotterTab() {
  const { resident, staffUser, hasStaffAccess, sessionType } = useAuth()
  const params = useLocalSearchParams<{ section?: string }>()
  const router = useRouter()
  const [section, setSection] = useState<Section>((params.section as Section) || 'menu')

  useEffect(() => {
    setSection((params.section as Section) || 'menu')
  }, [params.section])

  // Check staff access for blotter module
  if (sessionType === 'staff' && !hasStaffAccess('blotter')) {
    return (
      <SafeAreaView style={s.safe}><View style={s.container}><Text style={s.title}>Access denied</Text><Text style={s.note}>You do not have permission to view blotter records.</Text></View></SafeAreaView>
    )
  }

  function handleBack() {
    if (params.section) router.push('/(tabs)/home' as never)
    else setSection('menu')
  }
  const [blotters, setBlotters] = useState<BlotterRecord[]>([])
  const [summons, setSummons] = useState<Summon[]>([])
  const [certTypes, setCertTypes] = useState<CertType[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Blotter form
  const [blotterForm, setBlotterForm] = useState({ incident_type: '', incident_location: '', incident_narrative: '', incident_date: '' })
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [persons, setPersons] = useState<PersonInvolved[]>([])
  const [personForm, setPersonForm] = useState({ first_name: '', last_name: '', involvement_type: 'Respondent' })
  const [showInvolvementModal, setShowInvolvementModal] = useState(false)

  // Certificate form
  const [certForm, setCertForm] = useState({ certificate_type_id: '', purpose: '' })
  const [showCertModal, setShowCertModal] = useState(false)

  // Business form
  const [bizForm, setBizForm] = useState({ business_name: '', business_type: '', address: '' })

  const load = useCallback(async (sec: Section) => {
    if (!resident) return
    setLoading(true)
    if (sec === 'blotter') {
      const { data } = await supabase
        .from('blotter_people_involved')
        .select('blotter_id, blotter_records(id, incident_type, blotter_status, date_recorded, incident_location)')
        .eq('resident_id', resident.id)
      const records = (data ?? []).map((d: any) => d.blotter_records).filter(Boolean)
      setBlotters(records)
    }
    if (sec === 'summons') {
      const { data: involved } = await supabase
        .from('blotter_people_involved')
        .select('blotter_id')
        .eq('resident_id', resident.id)
      const ids = (involved ?? []).map((d: any) => d.blotter_id)
      if (ids.length > 0) {
        const { data } = await supabase
          .from('summon_schedules')
          .select('*, blotter_records(incident_type)')
          .in('blotter_id', ids)
          .order('summon_date', { ascending: true })
        setSummons(data ?? [])
      } else setSummons([])
    }
    if (sec === 'certificate') {
      const { data, error } = await supabase.from('certificate_types').select('*').order('name')
      if (!error) setCertTypes(data ?? [])
      else setCertTypes([])
    }
    setLoading(false)
  }, [resident])

  useEffect(() => { if (section !== 'menu') load(section) }, [section, load])

  function addPerson() {
    if (!personForm.first_name.trim() || !personForm.last_name.trim()) return Alert.alert('Required', 'Please enter first and last name.')
    setPersons(p => [...p, { ...personForm }])
    setPersonForm({ first_name: '', last_name: '', involvement_type: 'Respondent' })
  }

  async function submitBlotter() {
    if (!resident || !blotterForm.incident_type) return Alert.alert('Required', 'Please select an incident type.')
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const time = new Date().toTimeString().slice(0, 5)
    const { data: rec } = await supabase.from('blotter_records').insert({
      incident_type: blotterForm.incident_type,
      incident_location: blotterForm.incident_location,
      incident_narrative: blotterForm.incident_narrative,
      incident_date: blotterForm.incident_date || today,
      date_recorded: today, time_recorded: time, blotter_status: 'Pending',
    }).select().single()
    if (rec) {
      const inserts = [
        { blotter_id: rec.id, resident_id: resident.id, first_name: resident.first_name, last_name: resident.last_name, involvement_type: 'Complainant' },
        ...persons.map(p => ({ blotter_id: rec.id, first_name: p.first_name, last_name: p.last_name, involvement_type: p.involvement_type })),
      ]
      await supabase.from('blotter_people_involved').insert(inserts)
    }
    setSaving(false)
    setBlotterForm({ incident_type: '', incident_location: '', incident_narrative: '', incident_date: '' })
    setPersons([])
    Alert.alert('Submitted', 'Your blotter request has been submitted. The barangay will process it shortly.')
    load('blotter')
  }

  async function submitCertificate() {
    if (!resident || !certForm.certificate_type_id) return Alert.alert('Required', 'Please select a certificate type.')
    setSaving(true)
    await supabase.from('certificate_issuances').insert({
      resident_id: resident.id,
      certificate_type_id: certForm.certificate_type_id,
      purpose: certForm.purpose,
    })
    setSaving(false)
    setCertForm({ certificate_type_id: '', purpose: '' })
    Alert.alert('Requested', 'Your certificate request has been submitted. Please visit the barangay hall to claim it.')
  }

  async function submitBusiness() {
    if (!resident || !bizForm.business_name) return Alert.alert('Required', 'Please enter your business name.')
    setSaving(true)
    await supabase.from('business_permits').insert({
      business_name: bizForm.business_name,
      owner_name: `${resident.first_name} ${resident.last_name}`,
      owner_resident_id: resident.id,
      business_type: bizForm.business_type,
      address: bizForm.address,
      status: 'Pending',
    })
    setSaving(false)
    setBizForm({ business_name: '', business_type: '', address: '' })
    Alert.alert('Submitted', 'Your business permit request has been submitted for review.')
  }

  if (section === 'menu') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Blotter & Documents</Text>
          <Text style={s.pageSub}>Resident services for records & permits</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          <TouchableOpacity style={s.menuCard} onPress={() => setSection('blotter')}>
            <View style={[s.menuIcon, { backgroundColor: '#dc262618' }]}> 
              <Ionicons name="document-text" size={26} color="#dc2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Blotter</Text>
              <Text style={s.menuSub}>Raise a new blotter or view your records</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuCard} onPress={() => setSection('certificate')}>
            <View style={[s.menuIcon, { backgroundColor: '#05966918' }]}> 
              <Ionicons name="ribbon" size={26} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Request Certificate</Text>
              <Text style={s.menuSub}>Barangay clearance, residency & more</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuCard} onPress={() => setSection('business')}>
            <View style={[s.menuIcon, { backgroundColor: '#b4530918' }]}> 
              <Ionicons name="business" size={26} color="#b45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Business Permit</Text>
              <Text style={s.menuSub}>Apply for a barangay business permit</Text>
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
          {section === 'blotter' ? 'Blotter' : section === 'summons' ? 'My Summons' : section === 'certificate' ? 'Request Certificate' : 'Business Permit'}
        </Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 20 }}>
        {loading && <ActivityIndicator color="#1e40af" style={{ marginTop: 40 }} />}

        {/* BLOTTER */}
        {section === 'blotter' && !loading && (
          <>
            <Text style={s.sectionHead}>Raise New Blotter</Text>
            <View style={s.card}>
              <TouchableOpacity style={s.selectBtn} onPress={() => setShowTypeModal(true)}>
                <Text style={blotterForm.incident_type ? s.selectText : s.selectPlaceholder}>
                  {blotterForm.incident_type || 'Select Incident Type *'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#94a3b8" />
              </TouchableOpacity>
              <TextInput style={s.input} placeholder="Incident Date (YYYY-MM-DD)" value={blotterForm.incident_date} onChangeText={v => setBlotterForm(f => ({ ...f, incident_date: v }))} />
              <TextInput style={s.input} placeholder="Location" value={blotterForm.incident_location} onChangeText={v => setBlotterForm(f => ({ ...f, incident_location: v }))} />
              <TextInput style={[s.input, s.textarea]} placeholder="Describe what happened..." multiline numberOfLines={4} value={blotterForm.incident_narrative} onChangeText={v => setBlotterForm(f => ({ ...f, incident_narrative: v }))} />

              <Text style={s.personHead}>Persons Involved</Text>
              {persons.map((p, i) => (
                <View key={i} style={s.personRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.personName}>{p.first_name} {p.last_name}</Text>
                    <Text style={s.personRole}>{p.involvement_type}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPersons(prev => prev.filter((_, idx) => idx !== i))}>
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={s.personInputRow}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="First Name" value={personForm.first_name} onChangeText={v => setPersonForm(f => ({ ...f, first_name: v }))} />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Last Name" value={personForm.last_name} onChangeText={v => setPersonForm(f => ({ ...f, last_name: v }))} />
              </View>
              <TouchableOpacity style={s.selectBtn} onPress={() => setShowInvolvementModal(true)}>
                <Text style={s.selectText}>{personForm.involvement_type}</Text>
                <Ionicons name="chevron-down" size={16} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity style={s.addPersonBtn} onPress={addPerson}>
                <Ionicons name="person-add" size={15} color="#1e40af" />
                <Text style={s.addPersonText}>Add Person</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.submitBtn} onPress={submitBlotter} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Submit Blotter</Text>}
              </TouchableOpacity>
            </View>

            <Text style={[s.sectionHead, { marginTop: 24 }]}>My Blotter Records</Text>
            {blotters.length === 0
              ? <Text style={s.empty}>No blotter records found.</Text>
              : blotters.map(b => (
                <View key={b.id} style={s.listCard}>
                  <View style={s.listRow}>
                    <Text style={s.listTitle}>{b.incident_type}</Text>
                    <View style={[s.badge, { backgroundColor: (statusColor[b.blotter_status] ?? '#94a3b8') + '22' }]}>
                      <Text style={[s.badgeText, { color: statusColor[b.blotter_status] ?? '#94a3b8' }]}>{b.blotter_status}</Text>
                    </View>
                  </View>
                  <Text style={s.listSub}>📅 {b.date_recorded} {b.incident_location ? `· 📍 ${b.incident_location}` : ''}</Text>
                </View>
              ))
            }
          </>
        )}

        {/* SUMMONS */}
        {section === 'summons' && !loading && (
          summons.length === 0
            ? <Text style={s.empty}>No scheduled summons found.</Text>
            : summons.map(s2 => (
              <View key={s2.id} style={s.listCard}>
                <View style={s.listRow}>
                  <Text style={s.listTitle}>{s2.blotter_records?.incident_type ?? 'Summon'}</Text>
                  <View style={[s.badge, { backgroundColor: (statusColor[s2.status] ?? '#94a3b8') + '22' }]}>
                    <Text style={[s.badgeText, { color: statusColor[s2.status] ?? '#94a3b8' }]}>{s2.status}</Text>
                  </View>
                </View>
                <Text style={s.listSub}>📅 {s2.summon_date} at {s2.summon_time}</Text>
              </View>
            ))
        )}

        {/* CERTIFICATE */}
        {section === 'certificate' && !loading && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Request a Certificate</Text>
            <TouchableOpacity style={s.selectBtn} onPress={() => setShowCertModal(true)}>
              <Text style={certForm.certificate_type_id ? s.selectText : s.selectPlaceholder}>
                {certTypes.find(c => c.id === certForm.certificate_type_id)?.name || 'Select Certificate Type *'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#94a3b8" />
            </TouchableOpacity>
            <TextInput style={s.input} placeholder="Purpose (e.g. Employment, Loan)" value={certForm.purpose} onChangeText={v => setCertForm(f => ({ ...f, purpose: v }))} />
            <Text style={s.hint}>📌 Please visit the barangay hall to claim your certificate and pay any applicable fees.</Text>
            <TouchableOpacity style={s.submitBtn} onPress={submitCertificate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* BUSINESS PERMIT */}
        {section === 'business' && !loading && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Request Business Permit</Text>
            <TextInput style={s.input} placeholder="Business Name *" value={bizForm.business_name} onChangeText={v => setBizForm(f => ({ ...f, business_name: v }))} />
            <TextInput style={s.input} placeholder="Business Type (e.g. Sari-sari Store)" value={bizForm.business_type} onChangeText={v => setBizForm(f => ({ ...f, business_type: v }))} />
            <TextInput style={s.input} placeholder="Business Address" value={bizForm.address} onChangeText={v => setBizForm(f => ({ ...f, address: v }))} />
            <Text style={s.hint}>📌 Your request will be reviewed by the barangay. You will be notified once approved.</Text>
            <TouchableOpacity style={s.submitBtn} onPress={submitBusiness} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Incident Type Picker */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Incident Type</Text>
            <FlatList
              data={INCIDENT_TYPES}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.modalItem} onPress={() => { setBlotterForm(f => ({ ...f, incident_type: item })); setShowTypeModal(false) }}>
                  <Text style={s.modalItemText}>{item}</Text>
                  {blotterForm.incident_type === item && <Ionicons name="checkmark" size={18} color="#1e40af" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowTypeModal(false)}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Involvement Type Picker */}
      <Modal visible={showInvolvementModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Involvement Type</Text>
            <FlatList
              data={INVOLVEMENT_TYPES}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.modalItem} onPress={() => { setPersonForm(f => ({ ...f, involvement_type: item })); setShowInvolvementModal(false) }}>
                  <Text style={s.modalItemText}>{item}</Text>
                  {personForm.involvement_type === item && <Ionicons name="checkmark" size={18} color="#1e40af" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowInvolvementModal(false)}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Certificate Type Picker */}
      <Modal visible={showCertModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Certificate Type</Text>
            <FlatList
              data={certTypes}
              keyExtractor={c => c.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.modalItem} onPress={() => { setCertForm(f => ({ ...f, certificate_type_id: item.id })); setShowCertModal(false) }}>
                  <Text style={s.modalItemText}>{item.name}</Text>
                  <Text style={{ color: '#059669', fontWeight: '700', fontSize: 13 }}>{item.price > 0 ? `₱${item.price}` : 'Free'}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowCertModal(false)}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function MenuScreen({ onSelect }: { onSelect: (s: Section) => void }) {
  const items = [
    { id: 'blotter' as Section, icon: 'document-text' as const, label: 'Blotter', sub: 'Raise a new blotter or view your records', color: '#dc2626' },
    { id: 'summons' as Section, icon: 'calendar' as const, label: 'View Summons', sub: 'Check your scheduled summon hearings', color: '#7c3aed' },
    { id: 'certificate' as Section, icon: 'ribbon' as const, label: 'Request Certificate', sub: 'Barangay clearance, residency & more', color: '#059669' },
    { id: 'business' as Section, icon: 'business' as const, label: 'Business Permit', sub: 'Apply for a barangay business permit', color: '#b45309' },
  ]
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Blotter & Documents</Text>
        <Text style={s.pageSub}>Resident services for records & permits</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  note: { marginTop: 8, color: '#64748b' },
  pageHeader: { backgroundColor: '#b91c1c', paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  pageSub: { fontSize: 13, color: '#fecaca', marginTop: 4 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 4 },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  scroll: { flex: 1 },
  sectionHead: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc' },
  textarea: { height: 100, textAlignVertical: 'top' },
  selectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#f8fafc' },
  selectText: { fontSize: 14, color: '#1e293b' },
  selectPlaceholder: { fontSize: 14, color: '#94a3b8' },
  submitBtn: { backgroundColor: '#1e40af', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { fontSize: 12, color: '#64748b', lineHeight: 18, backgroundColor: '#f0f9ff', padding: 10, borderRadius: 8 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  listTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1 },
  listSub: { fontSize: 12, color: '#64748b' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
  personHead: { fontSize: 13, fontWeight: '700', color: '#475569', marginTop: 4, marginBottom: 6 },
  personRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, marginBottom: 6 },
  personName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  personRole: { fontSize: 11, color: '#64748b', marginTop: 1 },
  personInputRow: { flexDirection: 'row', gap: 8 },
  addPersonBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#1e40af', borderRadius: 10, paddingVertical: 10, justifyContent: 'center', backgroundColor: '#eff6ff' },
  addPersonText: { color: '#1e40af', fontWeight: '600', fontSize: 14 },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  menuIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  menuSub: { fontSize: 12, color: '#64748b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  modalItemText: { fontSize: 15, color: '#1e293b' },
  modalCancel: { marginTop: 12, alignItems: 'center', paddingVertical: 14 },
  modalCancelText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
})
