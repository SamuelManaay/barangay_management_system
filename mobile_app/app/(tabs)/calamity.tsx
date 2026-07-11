import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WebView } from 'react-native-webview'
import * as Location from 'expo-location'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../_layout'

type Section = 'menu' | 'emergency' | 'centers' | 'relief' | 'electricity'

type Center = { id: string; name: string; location?: string; capacity: number; current_occupants: number; status: string; contact_person?: string; contact_number?: string; available_supplies?: string }
type Relief = { id: string; item_type: string; quantity: number; distribution_date: string; distribution_location?: string; recipient_name?: string }
type ElecIssue = { id: string; issue_type: string; location: string; priority: string; status: string; affected_households: number; reported_at: string }

const REQUEST_TYPES = ['Rescue', 'Medical', 'Evacuation', 'Food', 'Water', 'Other']
const ELEC_TYPES = ['Power Outage', 'Damaged Lines', 'Transformer Issue', 'Street Light', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

const statusColor: Record<string, string> = {
  Active: '#10b981', Standby: '#94a3b8', Full: '#ef4444', Closed: '#f59e0b',
  Pending: '#f59e0b', Responding: '#3b82f6', Completed: '#10b981',
  Reported: '#f59e0b', Investigating: '#3b82f6', 'In Progress': '#7c3aed', Resolved: '#10b981',
}
const priorityColor: Record<string, string> = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444', Critical: '#9d174d' }

export default function CalamityTab() {
  const { resident } = useAuth()
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
  const [centers, setCenters] = useState<Center[]>([])
  const [relief, setRelief] = useState<Relief[]>([])
  const [elecIssues, setElecIssues] = useState<ElecIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Emergency form
  const [emergForm, setEmergForm] = useState({ request_type: 'Rescue', people_affected: '1', notes: '', requester_name: '' })
  const [showTypeModal, setShowTypeModal] = useState(false)

  // Electricity form
  const [elecForm, setElecForm] = useState({ issue_type: 'Power Outage', location: '', description: '', contact_number: '', affected_households: '1', priority: 'Medium' })
  const [elecCoords, setElecCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showElecTypeModal, setShowElecTypeModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 14.5995, lng: 120.9842 })
  const webviewRef = useRef<any>(null)

  const load = useCallback(async (sec: Section) => {
    setLoading(true)
    if (sec === 'centers') {
      const { data } = await supabase.from('cal_evacuation_centers').select('*').neq('status', 'Closed').order('status')
      setCenters(data ?? [])
    }
    if (sec === 'relief') {
      const { data } = await supabase.from('cal_relief').select('*').order('distribution_date', { ascending: false }).limit(30)
      setRelief(data ?? [])
    }
    if (sec === 'electricity') {
      const { data } = await supabase.from('cal_electricity_issues').select('*').neq('status', 'Resolved').order('reported_at', { ascending: false })
      setElecIssues(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (section !== 'menu' && section !== 'emergency') load(section) }, [section, load])

  async function submitEmergency() {
    if (!resident) return
    setSaving(true)
    await supabase.from('cal_requests').insert({
      resident_id: resident.id,
      requester_name: emergForm.requester_name || `${resident.first_name} ${resident.last_name}`,
      request_type: emergForm.request_type,
      people_affected: parseInt(emergForm.people_affected) || 1,
      priority: 'High',
      status: 'Pending',
      notes: emergForm.notes,
    })
    setSaving(false)
    setEmergForm({ request_type: 'Rescue', people_affected: '1', notes: '', requester_name: '' })
    Alert.alert('Request Sent', 'Your emergency request has been submitted. Responders will be notified immediately.')
  }

  async function openMapPicker() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({})
      setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    }
    setShowMapModal(true)
  }

  async function submitElecIssue() {
    if (!elecForm.location) return Alert.alert('Required', 'Please enter the location.')
    setSaving(true)
    await supabase.from('cal_electricity_issues').insert({
      issue_type: elecForm.issue_type,
      location: elecForm.location,
      latitude: elecCoords?.lat ?? null,
      longitude: elecCoords?.lng ?? null,
      description: elecForm.description,
      contact_number: elecForm.contact_number,
      affected_households: parseInt(elecForm.affected_households) || 1,
      priority: elecForm.priority,
      reported_by: resident ? `${resident.first_name} ${resident.last_name}` : 'Resident',
      status: 'Reported',
    })
    setSaving(false)
    setElecForm({ issue_type: 'Power Outage', location: '', description: '', contact_number: '', affected_households: '1', priority: 'Medium' })
    setElecCoords(null)
    Alert.alert('Reported', 'Electricity issue has been reported. The barangay will coordinate with the utility company.')
    load('electricity')
  }

  if (section === 'menu') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Calamity & Emergency</Text>
          <Text style={s.pageSub}>Emergency services and disaster response</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          <TouchableOpacity style={s.menuCard} onPress={() => setSection('emergency')}>
            <View style={[s.menuIcon, { backgroundColor: '#dc262618' }]}> 
              <Ionicons name="warning" size={26} color="#dc2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Request Emergency</Text>
              <Text style={s.menuSub}>Rescue, medical, evacuation & supply requests</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuCard} onPress={() => setSection('centers')}>
            <View style={[s.menuIcon, { backgroundColor: '#0284c718' }]}> 
              <Ionicons name="home" size={26} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Evacuation Centers</Text>
              <Text style={s.menuSub}>View nearest centers with available space & contacts</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuCard} onPress={() => setSection('relief')}>
            <View style={[s.menuIcon, { backgroundColor: '#05966918' }]}> 
              <Ionicons name="gift" size={26} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Relief Distribution</Text>
              <Text style={s.menuSub}>View relief goods distribution records</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuCard} onPress={() => setSection('electricity')}>
            <View style={[s.menuIcon, { backgroundColor: '#1e40af18' }]}> 
              <Ionicons name="flash" size={26} color="#1e40af" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>Electricity Issues</Text>
              <Text style={s.menuSub}>Report power outages & electrical problems</Text>
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
          {section === 'emergency' ? 'Emergency Request' : section === 'centers' ? 'Evacuation Centers' : section === 'relief' ? 'Relief Distribution' : 'Electricity Issues'}
        </Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 20 }}>
        {loading && <ActivityIndicator color="#ea580c" style={{ marginTop: 40 }} />}

        {/* EMERGENCY */}
        {section === 'emergency' && (
          <View style={s.card}>
            <View style={s.alertBanner}>
              <Ionicons name="warning" size={18} color="#dc2626" />
              <Text style={s.alertText}>For life-threatening emergencies, call 911 immediately.</Text>
            </View>
            <Text style={s.cardTitle}>Request Emergency Assistance</Text>

            <TouchableOpacity style={s.selectBtn} onPress={() => setShowTypeModal(true)}>
              <Text style={s.selectText}>{emergForm.request_type}</Text>
              <Ionicons name="chevron-down" size={16} color="#94a3b8" />
            </TouchableOpacity>
            <TextInput style={s.input} placeholder="Number of people affected" keyboardType="numeric" value={emergForm.people_affected} onChangeText={v => setEmergForm(f => ({ ...f, people_affected: v }))} />
            <TextInput style={[s.input, s.textarea]} placeholder="Describe the situation..." multiline numberOfLines={3} value={emergForm.notes} onChangeText={v => setEmergForm(f => ({ ...f, notes: v }))} />
            <TouchableOpacity style={[s.submitBtn, { backgroundColor: '#dc2626' }]} onPress={submitEmergency} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>🚨 Send Emergency Request</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* CENTERS */}
        {section === 'centers' && !loading && (
          centers.length === 0
            ? <Text style={s.empty}>No active evacuation centers at this time.</Text>
            : centers.map(c => {
              const pct = c.capacity > 0 ? Math.round((c.current_occupants / c.capacity) * 100) : 0
              const hasSpace = c.current_occupants < c.capacity && c.status !== 'Full'
              return (
                <View key={c.id} style={[s.listCard, !hasSpace && { opacity: 0.6 }]}>
                  <View style={s.listRow}>
                    <Text style={s.listTitle}>{c.name}</Text>
                    <View style={[s.badge, { backgroundColor: (statusColor[c.status] ?? '#94a3b8') + '22' }]}>
                      <Text style={[s.badgeText, { color: statusColor[c.status] ?? '#94a3b8' }]}>{c.status}</Text>
                    </View>
                  </View>
                  {c.location && <Text style={s.listSub}>📍 {c.location}</Text>}
                  <View style={s.occupancyRow}>
                    <Text style={s.occupancyText}>{c.current_occupants}/{c.capacity} occupants</Text>
                    <Text style={[s.occupancyText, { color: hasSpace ? '#10b981' : '#ef4444', fontWeight: '700' }]}>
                      {hasSpace ? `${c.capacity - c.current_occupants} slots available` : 'FULL'}
                    </Text>
                  </View>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981' }]} />
                  </View>
                  {(c.contact_person || c.contact_number) && (
                    <View style={s.contactRow}>
                      {c.contact_person && <Text style={s.contactText}>👤 {c.contact_person}</Text>}
                      {c.contact_number && <Text style={[s.contactText, { color: '#1e40af', fontWeight: '700' }]}>📞 {c.contact_number}</Text>}
                    </View>
                  )}
                  {c.available_supplies && <Text style={s.suppliesText}>📦 {c.available_supplies}</Text>}
                </View>
              )
            })
        )}

        {/* RELIEF */}
        {section === 'relief' && !loading && (
          <>
            <Text style={s.sectionHead}>Recent Relief Distributions</Text>
            {relief.length === 0
              ? <Text style={s.empty}>No relief distributions recorded.</Text>
              : relief.map(r => (
                <View key={r.id} style={s.listCard}>
                  <View style={s.listRow}>
                    <View style={s.reliefBadge}>
                      <Text style={s.reliefBadgeText}>{r.item_type}</Text>
                    </View>
                    <Text style={s.reliefQty}>x{r.quantity}</Text>
                  </View>
                  <Text style={s.listSub}>📅 {r.distribution_date}{r.distribution_location ? ` · 📍 ${r.distribution_location}` : ''}</Text>
                  {r.recipient_name && <Text style={s.listSub}>👤 {r.recipient_name}</Text>}
                </View>
              ))
            }
          </>
        )}

        {/* ELECTRICITY */}
        {section === 'electricity' && !loading && (
          <>
            <Text style={s.sectionHead}>Report Electricity Issue</Text>
            <View style={s.card}>
              <TouchableOpacity style={s.selectBtn} onPress={() => setShowElecTypeModal(true)}>
                <Text style={s.selectText}>{elecForm.issue_type}</Text>
                <Ionicons name="chevron-down" size={16} color="#94a3b8" />
              </TouchableOpacity>
              <TextInput style={s.input} placeholder="Location / Area *" value={elecForm.location} onChangeText={v => setElecForm(f => ({ ...f, location: v }))} />
              <TouchableOpacity style={s.mapPickerBtn} onPress={openMapPicker}>
                <Ionicons name="location" size={16} color={elecCoords ? '#10b981' : '#1e40af'} />
                <Text style={[s.mapPickerText, elecCoords && { color: '#10b981' }]}>
                  {elecCoords ? `📍 ${elecCoords.lat.toFixed(5)}, ${elecCoords.lng.toFixed(5)}` : 'Pin Location on Map'}
                </Text>
                {elecCoords && <TouchableOpacity onPress={() => setElecCoords(null)}><Ionicons name="close-circle" size={16} color="#ef4444" /></TouchableOpacity>}
              </TouchableOpacity>
              <TextInput style={[s.input, s.textarea]} placeholder="Describe the issue..." multiline numberOfLines={3} value={elecForm.description} onChangeText={v => setElecForm(f => ({ ...f, description: v }))} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Contact number" keyboardType="phone-pad" value={elecForm.contact_number} onChangeText={v => setElecForm(f => ({ ...f, contact_number: v }))} />
                <TextInput style={[s.input, { width: 80 }]} placeholder="HH #" keyboardType="numeric" value={elecForm.affected_households} onChangeText={v => setElecForm(f => ({ ...f, affected_households: v }))} />
              </View>
              <TouchableOpacity style={s.selectBtn} onPress={() => setShowPriorityModal(true)}>
                <Text style={s.selectText}>Priority: {elecForm.priority}</Text>
                <Ionicons name="chevron-down" size={16} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity style={[s.submitBtn, { backgroundColor: '#1e40af' }]} onPress={submitElecIssue} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>⚡ Report Issue</Text>}
              </TouchableOpacity>
            </View>

            <Text style={[s.sectionHead, { marginTop: 24 }]}>Active Issues</Text>
            {elecIssues.length === 0
              ? <Text style={s.empty}>No active electricity issues.</Text>
              : elecIssues.map(e => (
                <View key={e.id} style={s.listCard}>
                  <View style={s.listRow}>
                    <Text style={s.listTitle}>{e.issue_type}</Text>
                    <View style={[s.badge, { backgroundColor: (priorityColor[e.priority] ?? '#94a3b8') + '22' }]}>
                      <Text style={[s.badgeText, { color: priorityColor[e.priority] ?? '#94a3b8' }]}>{e.priority}</Text>
                    </View>
                  </View>
                  <Text style={s.listSub}>📍 {e.location} · 🏠 {e.affected_households} households</Text>
                  <View style={[s.badge, { backgroundColor: (statusColor[e.status] ?? '#94a3b8') + '22', alignSelf: 'flex-start', marginTop: 4 }]}>
                    <Text style={[s.badgeText, { color: statusColor[e.status] ?? '#94a3b8' }]}>{e.status}</Text>
                  </View>
                </View>
              ))
            }
          </>
        )}
      </ScrollView>

      {/* Map Picker Modal */}
      <Modal visible={showMapModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={s.topBar}>
            <TouchableOpacity onPress={() => setShowMapModal(false)} style={s.backBtn}>
              <Ionicons name="close" size={22} color="#1e293b" />
            </TouchableOpacity>
            <Text style={s.topTitle}>Pin Issue Location</Text>
          </View>
          <Text style={{ textAlign: 'center', fontSize: 12, color: '#64748b', paddingVertical: 8 }}>Tap on the map to mark the exact location</Text>
          <WebView
            ref={webviewRef}
            style={{ flex: 1 }}
            originWhitelist={['*']}
            onMessage={e => {
              const { lat, lng } = JSON.parse(e.nativeEvent.data)
              setElecCoords({ lat, lng })
              setShowMapModal(false)
            }}
            source={{ html: `<!DOCTYPE html><html><head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
              <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
              <style>html,body,#map{height:100%;margin:0;padding:0;}</style>
            </head><body><div id="map"></div><script>
              var marker;
              var map = L.map('map').setView([${mapCenter.lat},${mapCenter.lng}], 16);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
              ${elecCoords ? `marker = L.marker([${elecCoords.lat},${elecCoords.lng}]).addTo(map);` : ''}
              map.on('click', function(e){
                if(marker) map.removeLayer(marker);
                marker = L.marker(e.latlng).addTo(map);
                window.ReactNativeWebView.postMessage(JSON.stringify({lat:e.latlng.lat,lng:e.latlng.lng}));
              });
            </script></body></html>` }}
          />
        </SafeAreaView>
      </Modal>

      {/* Request Type Modal */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Request Type</Text>
            <FlatList data={REQUEST_TYPES} keyExtractor={i => i} renderItem={({ item }) => (
              <TouchableOpacity style={s.modalItem} onPress={() => { setEmergForm(f => ({ ...f, request_type: item })); setShowTypeModal(false) }}>
                <Text style={s.modalItemText}>{item}</Text>
                {emergForm.request_type === item && <Ionicons name="checkmark" size={18} color="#dc2626" />}
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowTypeModal(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Elec Type Modal */}
      <Modal visible={showElecTypeModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Issue Type</Text>
            <FlatList data={ELEC_TYPES} keyExtractor={i => i} renderItem={({ item }) => (
              <TouchableOpacity style={s.modalItem} onPress={() => { setElecForm(f => ({ ...f, issue_type: item })); setShowElecTypeModal(false) }}>
                <Text style={s.modalItemText}>{item}</Text>
                {elecForm.issue_type === item && <Ionicons name="checkmark" size={18} color="#1e40af" />}
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowElecTypeModal(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Priority Modal */}
      <Modal visible={showPriorityModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Priority Level</Text>
            <FlatList data={PRIORITIES} keyExtractor={i => i} renderItem={({ item }) => (
              <TouchableOpacity style={s.modalItem} onPress={() => { setElecForm(f => ({ ...f, priority: item })); setShowPriorityModal(false) }}>
                <Text style={[s.modalItemText, { color: priorityColor[item] }]}>{item}</Text>
                {elecForm.priority === item && <Ionicons name="checkmark" size={18} color={priorityColor[item]} />}
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowPriorityModal(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function MenuScreen({ onSelect }: { onSelect: (s: Section) => void }) {
  const items = [
    { id: 'emergency' as Section, icon: 'warning' as const, label: 'Request Emergency', sub: 'Rescue, medical, evacuation & supply requests', color: '#dc2626' },
    { id: 'centers' as Section, icon: 'home' as const, label: 'Evacuation Centers', sub: 'View nearest centers with available space & contacts', color: '#0284c7' },
    { id: 'relief' as Section, icon: 'gift' as const, label: 'Relief Distribution', sub: 'View relief goods distribution records', color: '#059669' },
    { id: 'electricity' as Section, icon: 'flash' as const, label: 'Electricity Issues', sub: 'Report power outages & electrical problems', color: '#1e40af' },
  ]
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Calamity & Emergency</Text>
        <Text style={s.pageSub}>Emergency services and disaster response</Text>
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
  pageHeader: { backgroundColor: '#c2410c', paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  pageSub: { fontSize: 13, color: '#fed7aa', marginTop: 4 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 4 },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  scroll: { flex: 1 },
  sectionHead: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  alertBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' },
  alertText: { flex: 1, fontSize: 12, color: '#dc2626', fontWeight: '600' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc' },
  textarea: { height: 90, textAlignVertical: 'top' },
  selectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#f8fafc' },
  selectText: { fontSize: 14, color: '#1e293b' },
  submitBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  listTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1 },
  listSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  occupancyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 4 },
  occupancyText: { fontSize: 12, color: '#64748b' },
  progressBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 9999 },
  contactRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  contactText: { fontSize: 12, color: '#64748b' },
  suppliesText: { fontSize: 12, color: '#64748b', marginTop: 4 },
  reliefBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  reliefBadgeText: { fontSize: 12, fontWeight: '700', color: '#065f46' },
  reliefQty: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
  mapPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#1e40af', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#eff6ff' },
  mapPickerText: { flex: 1, fontSize: 13, color: '#1e40af', fontWeight: '600' },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  menuIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  menuSub: { fontSize: 12, color: '#64748b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  modalItemText: { fontSize: 15, color: '#1e293b' },
  modalCancel: { marginTop: 12, alignItems: 'center', paddingVertical: 14 },
  modalCancelText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
})
