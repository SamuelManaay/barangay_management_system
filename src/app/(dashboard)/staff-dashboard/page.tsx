'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Modal from '@/components/ui/Modal'
import { auditLog, diffChanges } from '@/lib/audit'
import { Users, CheckCircle2, XCircle, Clock, Plus, Pencil } from 'lucide-react'

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

export default function StaffDashboardPage() {
  const { can, user } = useAuth()
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

  useEffect(() => { fetchStaff(); fetchResidents() }, [])

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
      const changes = diffChanges(
        { full_name: editing.full_name, position: editing.position, contact: editing.contact, email: editing.email, status: editing.status },
        payload as Record<string, unknown>,
        ['full_name', 'position', 'contact', 'email', 'status']
      )
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Updated', module: 'Staff', target: editing.full_name, changes })
    } else {
      const { error: err } = await supabase.from('barangay_staff').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
      await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Created', module: 'Staff', target: payload.full_name })
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#065f46 0%,#047857 50%,#059669 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Staff Directory</h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>All barangay staff employees</p>
            </div>
            {can('manage:admin') && (
              <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                <Plus size={15} /> Add Staff
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              <Users size={14} /><span>{loading ? '—' : staff.length} total staff</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              <CheckCircle2 size={14} style={{ color: '#34d399' }} /><span>{loading ? '—' : active} active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              <XCircle size={14} style={{ color: '#fca5a5' }} /><span>{loading ? '—' : inactive} inactive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa' }}>
                {['Name', 'Position', 'Contact', 'Email', 'Status', 'Date Added', ...(can('manage:admin') ? [''] : [])].map((h, i) => (
                  <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>Loading...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>No staff found. Click "Add Staff" to get started.</td></tr>
              ) : staff.map(s => (
                <tr key={s.id} style={{ borderTop: '1px solid #f8fafc' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {s.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{s.full_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#64748b' }}>{s.position ?? '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#64748b' }}>{s.contact ?? '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#64748b' }}>{s.email ?? '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: s.status === 'Active' ? '#d1fae5' : '#fee2e2', color: s.status === 'Active' ? '#065f46' : '#991b1b' }}>
                      {s.status === 'Active' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(s.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  {can('manage:admin') && (
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <button onClick={() => openEdit(s)} style={{ padding: '0.3rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer', color: '#475569', display: 'flex' }} title="Edit">
                        <Pencil size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal title={editing ? 'Edit Staff' : 'Add Staff'} open={modalOpen} onClose={() => setModalOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div style={{ borderRadius: '0.5rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '0.625rem 0.875rem', fontSize: '0.875rem', color: '#991b1b' }}>{error}</div>}
          <div style={{ position: 'relative' }}>
            <label className="label">Full Name *</label>
            <input
              className="input"
              value={nameSearch}
              onChange={e => { setNameSearch(e.target.value); set('full_name', e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Type to search residents..."
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: '0.25rem', overflow: 'hidden' }}>
                {suggestions.map(r => (
                  <button key={r.id} type="button"
                    onMouseDown={() => {
                      const name = `${r.first_name} ${r.last_name}`
                      setNameSearch(name)
                      set('full_name', name)
                      if (r.primary_contact) set('contact', r.primary_contact)
                      if (r.primary_email) set('email', r.primary_email)
                      setShowSuggestions(false)
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%', padding: '0.625rem 0.875rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', color: '#1e293b', borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {r.first_name.charAt(0)}
                    </div>
                    {r.first_name} {r.last_name}
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#94a3b8' }}>Resident</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Position</label>
            <input className="input" value={form.position} onChange={e => set('position', e.target.value)} placeholder="e.g. Barangay Secretary" />
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input className="input" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="e.g. 09XX XXX XXXX" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. staff@barangay.gov.ph" />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Add Staff'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
