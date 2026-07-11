'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { Plus, Pencil, ShieldOff, ShieldCheck, Users, Scale, FileText, Briefcase, UserCheck, Building2, UsersRound, ClipboardList, Banknote, Star, AlertTriangle, LayoutDashboard, CalendarDays, FolderKanban, Wallet, GraduationCap, Siren, Tent, Package, HardHat, Shield, MapPin } from 'lucide-react'
import bcrypt from 'bcryptjs'
import { auditLog, diffChanges } from '@/lib/audit'
import type { ModuleKey, ModulePermission } from '@/context/AuthContext'
import { FULL_PERM, NO_PERM } from '@/context/AuthContext'

type AppUser = {
  id: string
  username: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string | null
  permissions: Record<ModuleKey, ModulePermission>
}

type BrgyStaff = { id: string; full_name: string; position: string | null }

const ROLES = ['Admin', 'Staff', 'Readonly']
const ROLE_DESC: Record<string, string> = {
  Admin:    'Full access including admin settings and user management.',
  Staff:    'Can manage assigned modules. Cannot access admin panel.',
  Readonly: 'View-only access to assigned modules.',
}

const MODULES: { key: ModuleKey; label: string; icon: React.ElementType; color: string; group?: string }[] = [
  { key: 'residents',        label: 'Residents',            icon: Users,           color: '#6366f1' },
  { key: 'blotter',          label: 'Blotter',              icon: Scale,           color: '#ef4444' },
  { key: 'certificates',     label: 'Certificates',         icon: FileText,        color: '#10b981' },
  { key: 'settlements',      label: 'Settlements',          icon: Briefcase,       color: '#f59e0b' },
  { key: 'officials',        label: 'Officials',            icon: UserCheck,       color: '#3b82f6' },
  { key: 'business',         label: 'Business Permits',     icon: Building2,       color: '#ec4899' },
  { key: 'staff',            label: 'Staff Dashboard',      icon: UsersRound,      color: '#059669' },
  { key: 'audit_logs',       label: 'Audit Logs',           icon: ClipboardList,   color: '#7c3aed' },
  { key: 'cert_liquidation', label: 'Cert. Liquidation',    icon: Banknote,        color: '#0891b2' },
  // SK
  { key: 'sk_dashboard',    label: 'SK Dashboard',         icon: LayoutDashboard, color: '#059669', group: 'SK' },
  { key: 'sk_officials',    label: 'SK Officials',          icon: Star,            color: '#059669', group: 'SK' },
  { key: 'sk_youth',        label: 'SK Youth Registry',     icon: Users,           color: '#059669', group: 'SK' },
  { key: 'sk_events',       label: 'SK Programs & Events',  icon: CalendarDays,    color: '#059669', group: 'SK' },
  { key: 'sk_projects',     label: 'SK Projects',           icon: FolderKanban,    color: '#059669', group: 'SK' },
  { key: 'sk_finance',      label: 'SK Finances',           icon: Wallet,          color: '#059669', group: 'SK' },
  { key: 'sk_scholarships', label: 'SK Scholarships',       icon: GraduationCap,   color: '#059669', group: 'SK' },
  // Calamity
  { key: 'cal_dashboard',   label: 'Calamity Dashboard',    icon: LayoutDashboard, color: '#dc2626', group: 'Calamity' },
  { key: 'cal_incidents',   label: 'Calamity Incidents',    icon: AlertTriangle,   color: '#dc2626', group: 'Calamity' },
  { key: 'cal_requests',    label: 'Emergency Requests',    icon: Siren,           color: '#dc2626', group: 'Calamity' },
  { key: 'cal_centers',     label: 'Evacuation Centers',    icon: Tent,            color: '#dc2626', group: 'Calamity' },
  { key: 'cal_relief',      label: 'Relief Distribution',   icon: Package,         color: '#dc2626', group: 'Calamity' },
  { key: 'cal_damage',      label: 'Damage Assessment',     icon: HardHat,         color: '#dc2626', group: 'Calamity' },
  { key: 'cal_tanods',      label: 'Tanod Response',        icon: Shield,          color: '#dc2626', group: 'Calamity' },
  { key: 'cal_patrol',      label: 'Patrol Logs',           icon: MapPin,          color: '#dc2626', group: 'Calamity' },
]

const ENABLED_KEYS: ModuleKey[] = ['residents','blotter','certificates','settlements','officials','business','staff']
const ALL_KEYS: ModuleKey[] = ['residents','blotter','certificates','settlements','officials','business','staff','audit_logs','cert_liquidation','sk_dashboard','sk_officials','sk_youth','sk_events','sk_projects','sk_finance','sk_scholarships','cal_dashboard','cal_incidents','cal_requests','cal_centers','cal_relief','cal_damage','cal_tanods','cal_patrol']

function makeDefaultPerms(): Record<ModuleKey, ModulePermission> {
  return Object.fromEntries(ALL_KEYS.map(k => [k, ENABLED_KEYS.includes(k) ? { ...FULL_PERM } : { ...NO_PERM }])) as Record<ModuleKey, ModulePermission>
}
const emptyForm = { username: '', full_name: '', password: '', role: 'Staff', permissions: makeDefaultPerms() }

const roleColors: Record<string, { bg: string; color: string }> = {
  Admin:    { bg: '#dbeafe', color: '#1e40af' },
  Staff:    { bg: '#d1fae5', color: '#065f46' },
  Readonly: { bg: '#f1f5f9', color: '#475569' },
}

export default function UsersPage() {
  const { can, loading: authLoading, user: currentUser } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AppUser[]>([])
  const [brgyStaff, setBrgyStaff] = useState<BrgyStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !can('view:admin')) router.replace('/dashboard')
  }, [authLoading, can, router])

  useEffect(() => { fetchAll() }, [])

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
    const merged = Object.fromEntries(ALL_KEYS.map(k => [k, { ...base[k as ModuleKey], ...(saved[k as ModuleKey] ?? {}) }])) as Record<ModuleKey, ModulePermission>
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
      if (form.password) payload.password_hash = await bcrypt.hash(form.password, 10)
      const { error: err } = await supabase.from('app_users').update(payload).eq('id', editing.id)
      if (err) { setError(err.message); setSaving(false); return }
      const changes = diffChanges(
        { username: editing.username, full_name: editing.full_name, role: editing.role, permissions: editing.permissions },
        { username: form.username.toLowerCase(), full_name: form.full_name, role: form.role, permissions: perms },
        ['username', 'full_name', 'role', 'permissions']
      )
      if (form.password) changes['password'] = { from: '(hidden)', to: '(changed)' }
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: currentUser?.full_name ?? 'Unknown', action: 'Updated', module: 'User Management', target: editing.full_name, changes })
    } else {
      const hash = await bcrypt.hash(form.password, 10)
      const { error: err } = await supabase.from('app_users').insert({ username: form.username.toLowerCase(), full_name: form.full_name, role: form.role, password_hash: hash, permissions: perms })
      if (err) { setError(err.message.includes('unique') ? 'Username already exists.' : err.message); setSaving(false); return }
      await auditLog({ performedBy: currentUser?.full_name ?? 'Unknown', action: 'Created', module: 'User Management', target: form.full_name })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function toggleActive(u: AppUser) {
    if (u.id === currentUser?.id) return
    await supabase.from('app_users').update({ is_active: !u.is_active }).eq('id', u.id)
    await auditLog({ performedBy: currentUser?.full_name ?? 'Unknown', action: u.is_active ? 'Deactivated' : 'Activated', module: 'User Management', target: u.full_name })
    fetchAll()
  }

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  function toggleModule(key: ModuleKey) {
    setForm(f => {
      const cur = f.permissions[key]
      const next: ModulePermission = cur.enabled
        ? { ...NO_PERM }
        : { ...FULL_PERM }
      return { ...f, permissions: { ...f.permissions, [key]: next } }
    })
  }

  function toggleAction(key: ModuleKey, action: 'can_add' | 'can_update' | 'can_delete') {
    setForm(f => {
      const cur = f.permissions[key]
      return { ...f, permissions: { ...f.permissions, [key]: { ...cur, [action]: !cur[action] } } }
    })
  }

  // Staff who don't have an account yet (exclude already-used names when adding)
  const availableStaff = editing
    ? brgyStaff
    : brgyStaff.filter(s => !users.some(u => u.full_name.toLowerCase() === s.full_name.toLowerCase()))

  return (
    <div>
      {/* Header */}
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#1e1b4b,#312e81)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>User Management</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#a5b4fc' }}>Manage system access and module permissions per user.</p>
        </div>
        {can('manage:admin') && (
          <button className="btn-primary" onClick={openAdd} style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
            <Plus size={16} /> Add User
          </button>
        )}
      </div>

      {/* Role cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {ROLES.map(role => (
          <div key={role} style={{ borderRadius: '0.75rem', border: '1px solid #f1f5f9', backgroundColor: '#fff', padding: '0.875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: roleColors[role].bg, color: roleColors[role].color }}>{role}</span>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 0', lineHeight: 1.5 }}>{ROLE_DESC[role]}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div style={{ borderRadius: '1rem', border: '1px solid #f1f5f9', backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#fafafa' }}>
              <tr>
                <th className="table-header">User</th>
                <th className="table-header">Username</th>
                <th className="table-header">Role</th>
                <th className="table-header">Modules</th>
                <th className="table-header">Status</th>
                <th className="table-header">Last Login</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>Loading...</td></tr>
              ) : users.map(u => {
                const perms = u.permissions ?? makeDefaultPerms()
                const activeModules = u.role === 'Admin' ? MODULES : MODULES.filter(m => perms[m.key]?.enabled)
                return (
                  <tr key={u.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td className="table-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{u.full_name}</p>
                          {u.id === currentUser?.id && <span style={{ fontSize: '0.65rem', color: '#6366f1', fontWeight: 600 }}>● you</span>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell" style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{u.username}</td>
                    <td className="table-cell">
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: roleColors[u.role]?.bg ?? '#f1f5f9', color: roleColors[u.role]?.color ?? '#475569' }}>{u.role}</span>
                    </td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {activeModules.map(m => {
                          const Icon = m.icon
                          return (
                            <span key={m.key} title={m.label} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem', backgroundColor: `${m.color}18`, color: m.color }}>
                              <Icon size={11} />
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: u.is_active ? '#d1fae5' : '#fee2e2', color: u.is_active ? '#065f46' : '#991b1b' }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                    </td>
                    <td className="table-cell">
                      {can('manage:admin') && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => openEdit(u)} style={{ padding: '0.3rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer', color: '#475569', display: 'flex' }} title="Edit"><Pencil size={14} /></button>
                          {u.id !== currentUser?.id && (
                            <button onClick={() => toggleActive(u)} style={{ padding: '0.3rem', borderRadius: '0.375rem', border: 'none', backgroundColor: u.is_active ? '#fee2e2' : '#d1fae5', cursor: 'pointer', color: u.is_active ? '#dc2626' : '#059669', display: 'flex' }} title={u.is_active ? 'Deactivate' : 'Activate'}>
                              {u.is_active ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal title={editing ? 'Edit User' : 'Add New User'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div style={{ borderRadius: '0.5rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '0.625rem 0.875rem', fontSize: '0.875rem', color: '#991b1b' }}>{error}</div>}

          <div>
            <label className="label">Staff Member *</label>
            <select className="input" value={form.full_name}
              onChange={e => {
                const name = e.target.value
                set('full_name', name)
                if (!form.username && name) set('username', name.toLowerCase().replace(/\s+/g, '.'))
              }}>
              <option value="">— Select staff —</option>
              {editing && <option value={form.full_name}>{form.full_name}</option>}
              {availableStaff.filter(s => editing ? s.full_name !== form.full_name : true).map(s => (
                <option key={s.id} value={s.full_name}>{s.full_name}{s.position ? ` (${s.position})` : ''}</option>
              ))}
            </select>
            {!editing && availableStaff.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.375rem' }}>All active staff already have accounts. Add more staff in the Staff Directory first.</p>
            )}
          </div>

          <div>
            <label className="label">Username *</label>
            <input className="input" value={form.username} onChange={e => set('username', e.target.value)} placeholder="e.g. maria.santos" />
          </div>
          <div>
            <label className="label">{editing ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
            <input type="password" className="input" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="label">Role *</label>
            <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem' }}>{ROLE_DESC[form.role]}</p>
          </div>

          {form.role !== 'Admin' && (
            <div>
              <label className="label">Module Access</label>
              {(['', 'SK', 'Calamity'] as const).map(group => {
                const items = MODULES.filter(m => (m.group ?? '') === group)
                return (
                  <div key={group} style={{ marginTop: '0.5rem' }}>
                    {group && <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: group === 'SK' ? '#059669' : '#dc2626', margin: '0.5rem 0 0.25rem' }}>{group === 'SK' ? 'Sangguniang Kabataan' : 'Calamity & Emergency'}</p>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {items.map(m => {
                        const Icon = m.icon
                        const perm = form.permissions[m.key]
                        const enabled = perm.enabled
                        return (
                          <div key={m.key} style={{ borderRadius: '0.625rem', border: `1.5px solid ${enabled ? m.color : '#e2e8f0'}`, backgroundColor: enabled ? `${m.color}08` : '#fafafa', overflow: 'hidden', transition: 'all 0.15s' }}>
                            {/* Module toggle row */}
                            <button type="button" onClick={() => toggleModule(m.key)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                              <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem', backgroundColor: enabled ? m.color : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                                <Icon size={13} color={enabled ? '#fff' : '#94a3b8'} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: enabled ? '#1e293b' : '#94a3b8', flex: 1 }}>{m.label}</span>
                              <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', border: `2px solid ${enabled ? m.color : '#cbd5e1'}`, backgroundColor: enabled ? m.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {enabled && <div style={{ width: '0.35rem', height: '0.35rem', borderRadius: '50%', backgroundColor: '#fff' }} />}
                              </div>
                            </button>
                            {/* Action checkboxes — only when enabled */}
                            {enabled && (
                              <div style={{ display: 'flex', gap: '0.5rem', padding: '0 0.75rem 0.625rem 0.75rem' }}>
                                {(['can_add','can_update','can_delete'] as const).map(action => {
                                  const checked = perm[action]
                                  const labels = { can_add: 'Add', can_update: 'Update', can_delete: 'Delete' }
                                  const colors = { can_add: '#10b981', can_update: '#f59e0b', can_delete: '#ef4444' }
                                  return (
                                    <button key={action} type="button" onClick={() => toggleAction(m.key, action)}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', border: `1px solid ${checked ? colors[action] : '#e2e8f0'}`, backgroundColor: checked ? `${colors[action]}15` : '#fff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, color: checked ? colors[action] : '#94a3b8', transition: 'all 0.15s' }}>
                                      <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '0.2rem', border: `1.5px solid ${checked ? colors[action] : '#cbd5e1'}`, backgroundColor: checked ? colors[action] : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {checked && <div style={{ width: '0.35rem', height: '0.35rem', borderRadius: '1px', backgroundColor: '#fff' }} />}
                                      </div>
                                      {labels[action]}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {form.role === 'Admin' && (
            <div style={{ borderRadius: '0.625rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem', fontSize: '0.8rem', color: '#1e40af' }}>
              ✓ Admin role has access to all modules automatically.
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
