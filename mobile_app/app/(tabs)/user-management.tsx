import React, { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Modal, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../_layout'
import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'
import { Feather } from '@expo/vector-icons'

type ModulePermission = {
  enabled: boolean
  can_add: boolean
  can_update: boolean
  can_delete: boolean
}

type AppUser = {
  id: string
  username: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string | null
  permissions: Record<string, ModulePermission>
}

type BrgyStaff = { id: string; full_name: string; position: string | null }

const ROLES = ['Admin', 'Staff', 'Readonly']
const ROLE_DESC: Record<string, string> = {
  Admin: 'Full access including admin settings and user management.',
  Staff: 'Can manage assigned modules. Cannot access admin panel.',
  Readonly: 'View-only access to assigned modules.',
}

const MODULES = [
  { key: 'residents', label: 'Residents', color: colors.primary },
  { key: 'blotter', label: 'Blotter', color: colors.danger },
  { key: 'certificates', label: 'Certificates', color: colors.success },
  { key: 'settlements', label: 'Settlements', color: colors.warning },
  { key: 'officials', label: 'Officials', color: colors.info },
  { key: 'business', label: 'Business Permits', color: '#ec4899' },
  { key: 'staff', label: 'Staff Dashboard', color: '#059669' },
  { key: 'audit_logs', label: 'Audit Logs', color: '#7c3aed' },
  { key: 'cert_liquidation', label: 'Cert. Liquidation', color: '#0891b2' },
]

const ENABLED_KEYS = ['residents', 'blotter', 'certificates', 'settlements', 'officials', 'business', 'staff']
const ALL_KEYS = ['residents', 'blotter', 'certificates', 'settlements', 'officials', 'business', 'staff', 'audit_logs', 'cert_liquidation']

function makeDefaultPerms(): Record<string, ModulePermission> {
  return Object.fromEntries(ALL_KEYS.map(k => [k, ENABLED_KEYS.includes(k) ? { enabled: true, can_add: true, can_update: true, can_delete: true } : { enabled: false, can_add: false, can_update: false, can_delete: false }]))
}

const emptyForm = { username: '', full_name: '', password: '', role: 'Staff', permissions: makeDefaultPerms() }

export default function UserManagementScreen() {
  const { hasStaffAccess, staffUser: currentUser } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [brgyStaff, setBrgyStaff] = useState<BrgyStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasStaffAccess('staff')) return
    fetchAll()
  }, [hasStaffAccess])

  async function fetchAll() {
    setLoading(true)
    const [u, s] = await Promise.all([
      supabase.from('app_users').select('id,username,full_name,role,is_active,created_at,last_login,permissions').order('created_at'),
      supabase.from('barangay_staff').select('id,full_name,position').eq('status', 'Active').order('full_name'),
    ])
    setUsers(u.data ?? [])
    setBrgyStaff(s.data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm({ ...emptyForm, permissions: makeDefaultPerms() })
    setError('')
    setModalOpen(true)
  }

  function openEdit(u: AppUser) {
    setEditing(u)
    const base = makeDefaultPerms()
    const saved = u.permissions ?? {}
    const merged = Object.fromEntries(ALL_KEYS.map(k => [k, { ...base[k], ...(saved[k] ?? {}) }]))
    setForm({ username: u.username, full_name: u.full_name, password: '', role: u.role, permissions: merged })
    setError('')
    setModalOpen(true)
  }

  async function handleSave() {
    setError('')
    if (!form.username || !form.full_name) { setError('Username and full name are required.'); return }
    if (!editing && !form.password) { setError('Password is required for new users.'); return }
    if (form.password && form.password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setSaving(true)
    const perms = form.role === 'Admin' ? makeDefaultPerms() : form.permissions

    if (editing) {
      const payload: Record<string, unknown> = { username: form.username.toLowerCase(), full_name: form.full_name, role: form.role, permissions: perms }
      if (form.password) payload.password_hash = form.password
      const { error: err } = await supabase.from('app_users').update(payload).eq('id', editing.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('app_users').insert({ username: form.username.toLowerCase(), full_name: form.full_name, role: form.role, password_hash: form.password, permissions: perms })
      if (err) { setError(err.message.includes('unique') ? 'Username already exists.' : err.message); setSaving(false); return }
    }
    setSaving(false)
    setModalOpen(false)
    fetchAll()
  }

  async function toggleActive(u: AppUser) {
    if (u.id === currentUser?.id) return
    await supabase.from('app_users').update({ is_active: !u.is_active }).eq('id', u.id)
    fetchAll()
  }

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  function toggleModule(key: string) {
    setForm(f => {
      const cur = f.permissions[key]
      const next: ModulePermission = cur.enabled
        ? { enabled: false, can_add: false, can_update: false, can_delete: false }
        : { enabled: true, can_add: true, can_update: true, can_delete: true }
      return { ...f, permissions: { ...f.permissions, [key]: next } }
    })
  }

  function toggleAction(key: string, action: 'can_add' | 'can_update' | 'can_delete') {
    setForm(f => {
      const cur = f.permissions[key]
      return { ...f, permissions: { ...f.permissions, [key]: { ...cur, [action]: !cur[action] } } }
    })
  }

  const availableStaff = editing
    ? brgyStaff
    : brgyStaff.filter(s => !users.some(u => u.full_name.toLowerCase() === s.full_name.toLowerCase()))

  if (!hasStaffAccess('staff')) {
    return (
      <SafeAreaView style={s.safe}><View style={s.container}><Text style={s.title}>Access denied</Text><Text style={s.note}>Only authorized staff can access user management.</Text></View></SafeAreaView>
    )
  }

  const roleColors: Record<string, { bg: string; color: string }> = {
    Admin: { bg: '#dbeafe', color: '#1e40af' },
    Staff: { bg: '#d1fae5', color: '#065f46' },
    Readonly: { bg: '#f1f5f9', color: '#475569' },
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>User Management</Text>
        <Text style={s.subtitle}>Manage system access and module permissions</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color="#1e40af" /> : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => {
            const perms = item.permissions ?? makeDefaultPerms()
            const activeModules = item.role === 'Admin' ? MODULES : MODULES.filter(m => perms[m.key]?.enabled)
            return (
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.avatar}><Text style={s.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text></View>
                  <View style={s.cardInfo}>
                    <Text style={s.name}>{item.full_name}</Text>
                    {item.id === currentUser?.id && <Text style={s.youTag}>● you</Text>}
                    <Text style={s.meta}>{item.username}</Text>
                  </View>
                  <View style={[s.roleBadge, { backgroundColor: roleColors[item.role]?.bg }]}>
                    <Text style={[s.roleText, { color: roleColors[item.role]?.color }]}>{item.role}</Text>
                  </View>
                </View>
                <View style={s.moduleRow}>
                  {activeModules.slice(0, 6).map(m => (
                    <View key={m.key} style={[s.moduleDot, { backgroundColor: `${m.color}20` }]}>
                      <View style={[s.moduleDotInner, { backgroundColor: m.color }]} />
                    </View>
                  ))}
                  {activeModules.length > 6 && <Text style={s.moreText}>+{activeModules.length - 6}</Text>}
                </View>
                <View style={s.cardFooter}>
                  <Text style={s.statusText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
                  <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)}>
                    <Feather name="edit-2" size={14} color="#475569" />
                  </TouchableOpacity>
                  {item.id !== currentUser?.id && (
                    <TouchableOpacity style={[s.toggleBtn, { backgroundColor: item.is_active ? '#fee2e2' : '#d1fae5' }]} onPress={() => toggleActive(item)}>
                      <Feather name={item.is_active ? 'shield-off' : 'shield'} size={14} color={item.is_active ? '#dc2626' : '#059669'} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          }}
          ListEmptyComponent={<Text style={s.emptyText}>No users found. Click "Add User" to get started.</Text>}
        />
      )}

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{editing ? 'Edit User' : 'Add New User'}</Text>
            {error && <Text style={s.errorText}>{error}</Text>}
            <ScrollView style={s.modalScroll}>
              <View style={s.inputGroup}>
                <Text style={s.label}>Staff Member *</Text>
                <View style={s.pickerContainer}>
                  <Text style={s.pickerLabel}>{form.full_name || '— Select staff —'}</Text>
                  <Feather name="chevron-down" size={16} color="#64748b" />
                </View>
              </View>
              <View style={s.inputGroup}>
                <Text style={s.label}>Username *</Text>
                <TextInput style={s.input} value={form.username} onChangeText={v => set('username', v)} placeholder="e.g. maria.santos" autoCapitalize="none" />
              </View>
              <View style={s.inputGroup}>
                <Text style={s.label}>{editing ? 'New Password (leave blank to keep current)' : 'Password *'}</Text>
                <TextInput style={s.input} value={form.password} onChangeText={v => set('password', v)} placeholder="Min. 6 characters" secureTextEntry />
              </View>
              <View style={s.inputGroup}>
                <Text style={s.label}>Role *</Text>
                <View style={s.roleOptions}>
                  {ROLES.map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[s.roleOption, form.role === role && s.roleOptionActive]}
                      onPress={() => set('role', role)}
                    >
                      <Text style={[s.roleOptionText, form.role === role && s.roleOptionTextActive]}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={s.roleDesc}>{ROLE_DESC[form.role]}</Text>
              </View>

              {form.role !== 'Admin' && (
                <View style={s.inputGroup}>
                  <Text style={s.label}>Module Access</Text>
                  {MODULES.map(m => {
                    const perm = form.permissions[m.key]
                    const enabled = perm.enabled
                    return (
                      <View key={m.key} style={[s.moduleCard, { borderColor: enabled ? m.color : '#e2e8f0', backgroundColor: enabled ? `${m.color}08` : '#fafafa' }]}>
                        <TouchableOpacity style={s.moduleToggle} onPress={() => toggleModule(m.key)}>
                          <View style={[s.moduleIcon, { backgroundColor: enabled ? m.color : '#e2e8f0' }]}>
                            <Feather name="grid" size={14} color={enabled ? '#fff' : '#94a3b8'} />
                          </View>
                          <Text style={[s.moduleLabel, { color: enabled ? '#1e293b' : '#94a3b8' }]}>{m.label}</Text>
                          <View style={[s.toggleDot, { borderColor: enabled ? m.color : '#cbd5e1', backgroundColor: enabled ? m.color : 'transparent' }]}>
                            {enabled && <View style={s.toggleDotInner} />}
                          </View>
                        </TouchableOpacity>
                        {enabled && (
                          <View style={s.actionRow}>
                            {(['can_add', 'can_update', 'can_delete'] as const).map(action => {
                              const checked = perm[action]
                              const labels = { can_add: 'Add', can_update: 'Update', can_delete: 'Delete' }
                              const actionColors = { can_add: colors.success, can_update: colors.warning, can_delete: colors.danger }
                              return (
                                <TouchableOpacity
                                  key={action}
                                  style={[s.actionBtn, { borderColor: checked ? actionColors[action] : '#e2e8f0', backgroundColor: checked ? `${actionColors[action]}15` : '#fff' }]}
                                  onPress={() => toggleAction(m.key, action)}
                                >
                                  <View style={[s.actionCheck, { borderColor: checked ? actionColors[action] : '#cbd5e1', backgroundColor: checked ? actionColors[action] : 'transparent' }]}>
                                    {checked && <View style={s.actionCheckInner} />}
                                  </View>
                                  <Text style={[s.actionBtnText, { color: checked ? actionColors[action] : '#94a3b8' }]}>{labels[action]}</Text>
                                </TouchableOpacity>
                              )
                            })}
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
              {form.role === 'Admin' && (
                <View style={s.adminNote}>
                  <Feather name="check-circle" size={14} color="#1e40af" />
                  <Text style={s.adminNoteText}>Admin role has access to all modules automatically.</Text>
                </View>
              )}
            </ScrollView>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={s.saveBtnText}>{saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  subtitle: { marginTop: 4, color: '#64748b', fontSize: 13 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardInfo: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  youTag: { fontSize: 11, color: '#6366f1', fontWeight: 600, marginTop: 2 },
  meta: { marginTop: 2, color: '#64748b', fontSize: 13 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginLeft: 8 },
  roleText: { fontSize: 11, fontWeight: 600 },
  moduleRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 12 },
  moduleDot: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  moduleDotInner: { width: 10, height: 10, borderRadius: 5 },
  moreText: { fontSize: 11, color: '#64748b', marginLeft: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusText: { fontSize: 12, color: '#64748b' },
  editBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 6 },
  toggleBtn: { padding: 8, borderRadius: 6 },
  emptyText: { color: '#94a3b8', textAlign: 'center', paddingVertical: 48, fontSize: 14 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  note: { marginTop: 8, color: '#64748b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  errorText: { backgroundColor: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 12 },
  modalScroll: { maxHeight: '70%' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  pickerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  pickerLabel: { fontSize: 14, color: '#0f172a' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  roleOptions: { flexDirection: 'row', gap: 8 },
  roleOption: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  roleOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleOptionText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  roleOptionTextActive: { color: '#fff' },
  roleDesc: { fontSize: 11, color: '#64748b', marginTop: 6 },
  moduleCard: { borderRadius: 10, borderWidth: 1.5, padding: 12, marginBottom: 8, overflow: 'hidden' },
  moduleToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  moduleIcon: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  moduleLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  toggleDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  toggleDotInner: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#fff' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8, paddingLeft: 40 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  actionCheck: { width: 12, height: 12, borderRadius: 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  actionCheckInner: { width: 5, height: 5, borderRadius: 1, backgroundColor: '#fff' },
  actionBtnText: { fontSize: 11, fontWeight: '600' },
  adminNote: { flexDirection: 'row', gap: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', padding: 12, borderRadius: 8, alignItems: 'center' },
  adminNoteText: { fontSize: 12, color: '#1e40af', flex: 1 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
})
