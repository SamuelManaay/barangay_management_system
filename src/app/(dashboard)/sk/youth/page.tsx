'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SKYouth, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { auditLog, diffChanges } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'

type YouthRow = SKYouth & { residents: Resident }

function calcAge(birthDate?: string) {
  if (!birthDate) return null
  const diff = Date.now() - new Date(birthDate).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

const empty = { resident_id: '', is_sk_member: false, is_volunteer: false, scholarship_status: 'None', notes: '' }

export default function SKYouthPage() {
  const { user, canDo } = useAuth()
  const [youth, setYouth] = useState<YouthRow[]>([])
  const [eligible, setEligible] = useState<Resident[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<YouthRow | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [youthRes, residentsRes] = await Promise.all([
      supabase.from('sk_youth').select('*, residents(*)').order('created_at', { ascending: false }),
      supabase.from('residents').select('*').order('last_name'),
    ])
    const youthData: YouthRow[] = youthRes.data ?? []
    setYouth(youthData)
    const registeredIds = new Set(youthData.map(y => y.resident_id))
    const allResidents: Resident[] = residentsRes.data ?? []
    // Filter residents aged 15-30 not yet registered
    const elig = allResidents.filter(r => {
      const age = calcAge(r.birth_date)
      return age !== null && age >= 15 && age <= 30 && !registeredIds.has(r.id)
    })
    setEligible(elig)
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(y: YouthRow) {
    setEditing(y)
    setForm({ resident_id: y.resident_id, is_sk_member: y.is_sk_member, is_volunteer: y.is_volunteer, scholarship_status: y.scholarship_status, notes: y.notes ?? '' })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const by = user?.full_name ?? 'Unknown'
    if (editing) {
      const payload = { is_sk_member: form.is_sk_member, is_volunteer: form.is_volunteer, scholarship_status: form.scholarship_status, notes: form.notes }
      await supabase.from('sk_youth').update(payload).eq('id', editing.id)
      const changes = diffChanges(
        editing as unknown as Record<string, unknown>,
        payload as unknown as Record<string, unknown>,
        ['is_sk_member', 'is_volunteer', 'scholarship_status', 'notes']
      )
      const name = editing.residents ? `${editing.residents.first_name} ${editing.residents.last_name}` : editing.id
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: by, action: 'Updated', module: 'SK Youth', target: name, changes })
    } else {
      await supabase.from('sk_youth').insert({ ...form })
      const res = eligible.find(r => r.id === form.resident_id)
      const name = res ? `${res.first_name} ${res.last_name}` : form.resident_id
      await auditLog({ performedBy: by, action: 'Created', module: 'SK Youth', target: name })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove from youth registry?')) return
    const target = youth.find(y => y.id === id)
    const name = target?.residents ? `${target.residents.first_name} ${target.residents.last_name}` : id
    await supabase.from('sk_youth').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'SK Youth', target: name })
    fetchAll()
  }

  const filtered = youth.filter(y => {
    const r = y.residents
    if (!r) return false
    const q = search.toLowerCase()
    return `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) || (r.purok ?? '').toLowerCase().includes(q)
  })

  const members = youth.filter(y => y.is_sk_member).length
  const volunteers = youth.filter(y => y.is_volunteer).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#065f46,#059669,#10b981)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Users size={20} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Youth Registry</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>Residents aged 15–30</p>
          </div>
          {canDo('sk_youth', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Register Youth
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[{ icon: '👥', label: `${youth.length} registered` }, { icon: '⭐', label: `${members} SK members` }, { icon: '🙋', label: `${volunteers} volunteers` }].map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              <span>{b.icon}</span><span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or purok..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Name', 'Age', 'Purok', 'Gender', 'SK Member', 'Volunteer', 'Scholarship', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No youth registered</td></tr>
              ) : filtered.map(y => {
                const r = y.residents
                const age = calcAge(r?.birth_date)
                return (
                  <tr key={y.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td className="table-cell" style={{ fontWeight: 600 }}>{r ? `${r.last_name}, ${r.first_name}` : '—'}</td>
                    <td className="table-cell">{age ?? '—'}</td>
                    <td className="table-cell">{r?.purok ?? '—'}</td>
                    <td className="table-cell">{r?.gender ?? '—'}</td>
                    <td className="table-cell"><span className={y.is_sk_member ? 'badge-green' : 'badge-gray'}>{y.is_sk_member ? 'Yes' : 'No'}</span></td>
                    <td className="table-cell"><span className={y.is_volunteer ? 'badge-blue' : 'badge-gray'}>{y.is_volunteer ? 'Yes' : 'No'}</span></td>
                    <td className="table-cell"><span className={y.scholarship_status === 'Active' ? 'badge-green' : 'badge-gray'}>{y.scholarship_status}</span></td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canDo('sk_youth', 'can_update') && <button onClick={() => openEdit(y)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                        {canDo('sk_youth', 'can_delete') && <button onClick={() => handleDelete(y.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Youth Record' : 'Register Youth'} open={modalOpen} onClose={() => setModalOpen(false)} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!editing && (
            <div>
              <label className="label">Resident (aged 15–30) *</label>
              <select className="input" value={form.resident_id} onChange={e => setForm(f => ({ ...f, resident_id: e.target.value }))}>
                <option value="">Select resident</option>
                {eligible.map(r => {
                  const age = calcAge(r.birth_date)
                  return <option key={r.id} value={r.id}>{r.last_name}, {r.first_name} {age ? `(${age} yrs)` : ''}</option>
                })}
              </select>
              {eligible.length === 0 && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>All eligible residents are already registered.</p>}
            </div>
          )}
          <div>
            <label className="label">Scholarship Status</label>
            <select className="input" value={form.scholarship_status} onChange={e => setForm(f => ({ ...f, scholarship_status: e.target.value }))}>
              <option>None</option><option>Active</option><option>Completed</option>
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_sk_member} onChange={e => setForm(f => ({ ...f, is_sk_member: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              SK Member
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_volunteer} onChange={e => setForm(f => ({ ...f, is_volunteer: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              Volunteer
            </label>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || (!editing && !form.resident_id)}>{saving ? 'Saving...' : editing ? 'Update' : 'Register'}</button>
        </div>
      </Modal>
    </div>
  )
}
