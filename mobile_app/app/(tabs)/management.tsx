import React, { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../_layout'
import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'
import { shadows } from '@/theme/shadows'

type Staff = {
  id: string
  full_name: string
  position: string | null
  contact: string | null
  email: string | null
  status: string
  created_at: string
}

type Resident = { id: string; first_name: string; last_name: string; primary_contact: string | null; primary_email: string | null }

const emptyForm = { full_name: '', position: '', contact: '', email: '', status: 'Active' }

export default function ManagementScreen() {
  const { hasStaffAccess, canStaffAccess, staffUser } = useAuth()
  const [staff, setStaff] = useState<Staff[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [nameSearch, setNameSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasStaffAccess('staff')) return
    fetchStaff()
    fetchResidents()
  }, [hasStaffAccess])

  async function fetchStaff() {
    setLoading(true)
    const { data } = await supabase
      .from('barangay_staff')
      .select('id,full_name,position,contact,email,status,created_at')
      .order('full_name', { ascending: true })
    setStaff(data ?? [])
    setLoading(false)
  }

  async function fetchResidents() {
    const { data } = await supabase.from('residents').select('id,first_name,last_name,primary_contact,primary_email').order('last_name')
    setResidents(data ?? [])
  }

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setNameSearch('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(s: Staff) {
    setEditing(s)
    setForm({ full_name: s.full_name, position: s.position ?? '', contact: s.contact ?? '', email: s.email ?? '', status: s.status })
    setNameSearch(s.full_name)
    setError('')
    setModalOpen(true)
  }

  async function handleSave() {
    setError('')
    if (!form.full_name.trim()) { setError('Full name is required.'); return }
    setSaving(true)
    const payload = { full_name: form.full_name.trim(), position: form.position || null, contact: form.contact || null, email: form.email || null, status: form.status }
    if (editing) {
      const { error: err } = await supabase.from('barangay_staff').update(payload).eq('id', editing.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('barangay_staff').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setModalOpen(false)
    fetchStaff()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const suggestions = nameSearch.length > 1
    ? residents.filter(r => `${r.first_name} ${r.last_name}`.toLowerCase().includes(nameSearch.toLowerCase())).slice(0, 6)
    : []
  const active = staff.filter(s => s.status === 'Active').length
  const inactive = staff.filter(s => s.status !== 'Active').length

  if (!hasStaffAccess('staff')) {
    return (
      <SafeAreaView style={s.safe}><View style={s.container}><Text style={s.title}>Access denied</Text><Text style={s.note}>Only authorized staff can access staff management.</Text></View></SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Staff Directory</Text>
        <Text style={s.subtitle}>All barangay staff employees</Text>
        {canStaffAccess('staff', 'can_add') && (
          <TouchableOpacity style={s.addBtn} onPress={openAdd}>
            <Text style={s.addBtnText}>+ Add Staff</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={s.statsRow}>
        <View style={s.statCard}><Text style={s.statValue}>{loading ? '—' : staff.length}</Text><Text style={s.statLabel}>Total Staff</Text></View>
        <View style={s.statCard}><Text style={[s.statValue, { color: colors.success }]}>{loading ? '—' : active}</Text><Text style={s.statLabel}>Active</Text></View>
        <View style={s.statCard}><Text style={[s.statValue, { color: colors.danger }]}>{loading ? '—' : inactive}</Text><Text style={s.statLabel}>Inactive</Text></View>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color="#1e40af" /> : (
        <FlatList
          data={staff}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.avatar}><Text style={s.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text></View>
                <View style={s.cardInfo}>
                  <Text style={s.name}>{item.full_name}</Text>
                  <Text style={s.meta}>{item.position ?? '—'}</Text>
                </View>
                {canStaffAccess('staff', 'can_update') && (
                  <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)}>
                    <Text style={s.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={s.cardDetails}>
                <Text style={s.detailLabel}>Contact: <Text style={s.detailValue}>{item.contact ?? '—'}</Text></Text>
                <Text style={s.detailLabel}>Email: <Text style={s.detailValue}>{item.email ?? '—'}</Text></Text>
                <Text style={s.detailLabel}>Status: <Text style={[s.detailValue, { color: item.status === 'Active' ? colors.success : colors.danger }]}>{item.status}</Text></Text>
                <Text style={s.detailLabel}>Added: <Text style={s.detailValue}>{new Date(item.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</Text></Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={s.emptyText}>No staff found. Click "Add Staff" to get started.</Text>}
        />
      )}

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{editing ? 'Edit Staff' : 'Add Staff'}</Text>
            {error && <Text style={s.errorText}>{error}</Text>}
            <ScrollView style={s.modalScroll}>
              <View style={s.inputGroup}>
                <Text style={s.label}>Full Name *</Text>
                <TextInput
                  style={s.input}
                  value={nameSearch}
                  onChangeText={v => { setNameSearch(v); set('full_name', v); setShowSuggestions(true) }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Type to search residents..."
                />
                {showSuggestions && suggestions.length > 0 && (
                  <View style={s.suggestions}>
                    {suggestions.map(r => (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => {
                          const name = `${r.first_name} ${r.last_name}`
                          setNameSearch(name)
                          set('full_name', name)
                          if (r.primary_contact) set('contact', r.primary_contact)
                          if (r.primary_email) set('email', r.primary_email)
                          setShowSuggestions(false)
                        }}
                        style={s.suggestionItem}
                      >
                        <View style={s.suggestionAvatar}><Text style={s.suggestionAvatarText}>{r.first_name.charAt(0)}</Text></View>
                        <Text style={s.suggestionText}>{r.first_name} {r.last_name}</Text>
                        <Text style={s.suggestionMeta}>Resident</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={s.inputGroup}>
                <Text style={s.label}>Position</Text>
                <TextInput style={s.input} value={form.position} onChangeText={v => set('position', v)} placeholder="e.g. Barangay Secretary" />
              </View>
              <View style={s.inputGroup}>
                <Text style={s.label}>Contact Number</Text>
                <TextInput style={s.input} value={form.contact} onChangeText={v => set('contact', v)} placeholder="e.g. 09XX XXX XXXX" />
              </View>
              <View style={s.inputGroup}>
                <Text style={s.label}>Email</Text>
                <TextInput style={s.input} value={form.email} onChangeText={v => set('email', v)} placeholder="e.g. staff@barangay.gov.ph" keyboardType="email-address" />
              </View>
              <View style={s.inputGroup}>
                <Text style={s.label}>Status</Text>
                <View style={s.statusOptions}>
                  <TouchableOpacity style={[s.statusOption, form.status === 'Active' && s.statusOptionActive]} onPress={() => set('status', 'Active')}>
                    <Text style={[s.statusOptionText, form.status === 'Active' && s.statusOptionTextActive]}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.statusOption, form.status === 'Inactive' && s.statusOptionActive]} onPress={() => set('status', 'Inactive')}>
                    <Text style={[s.statusOptionText, form.status === 'Inactive' && s.statusOptionTextActive]}>Inactive</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={s.saveBtnText}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Staff'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  subtitle: { marginTop: 4, color: '#64748b', fontSize: 13 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  note: { marginTop: 8, color: '#64748b' },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'linear-gradient(135deg,#059669,#047857)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardInfo: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  meta: { marginTop: 2, color: '#64748b', fontSize: 13 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 6 },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  cardDetails: { gap: 6 },
  detailLabel: { fontSize: 12, color: '#64748b' },
  detailValue: { fontSize: 12, color: '#1e293b', fontWeight: '500' },
  emptyText: { color: '#94a3b8', textAlign: 'center', paddingVertical: 48, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  errorText: { backgroundColor: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 12 },
  modalScroll: { maxHeight: '70%' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  suggestions: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 4, maxHeight: 150, overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  suggestionAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'linear-gradient(135deg,#059669,#047857)', alignItems: 'center', justifyContent: 'center' },
  suggestionAvatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  suggestionText: { fontSize: 14, color: '#1e293b', marginLeft: 10 },
  suggestionMeta: { fontSize: 11, color: '#94a3b8', marginLeft: 'auto' },
  statusOptions: { flexDirection: 'row', gap: 8 },
  statusOption: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  statusOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusOptionText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  statusOptionTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
})
