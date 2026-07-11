'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { BarangayOfficial, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { auditLog, diffChanges } from '@/lib/audit'

const POSITIONS = ['Barangay Captain', 'Barangay Kagawad', 'SK Chairman', 'Barangay Secretary', 'Barangay Treasurer', 'Barangay Tanod']
const STATUSES = ['Active', 'Inactive', 'Resigned']

const emptyForm = { resident_id: '', position: '', committee: '', term_of_service: '', status: 'Active', rank: 0 }

export default function OfficialsPage() {
  const { user, canDo } = useAuth()
  const [officials, setOfficials] = useState<BarangayOfficial[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BarangayOfficial | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [off, res] = await Promise.all([
      supabase.from('barangay_officials').select('*, residents(first_name, last_name)').order('rank'),
      supabase.from('residents').select('id, first_name, last_name').order('last_name'),
    ])
    setOfficials(off.data ?? [])
    setResidents(res.data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  function openEdit(o: BarangayOfficial) {
    setEditing(o)
    setForm({ resident_id: o.resident_id ?? '', position: o.position, committee: o.committee ?? '', term_of_service: o.term_of_service ?? '', status: o.status, rank: o.rank ?? 0 })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const res = residents.find(r => r.id === form.resident_id)
    const name = res ? `${res.first_name} ${res.last_name}` : form.resident_id
    if (editing) {
      await supabase.from('barangay_officials').update(form).eq('id', editing.id)
      const changes = diffChanges(
        editing as unknown as Record<string, unknown>,
        form as unknown as Record<string, unknown>,
        ['position','committee','term_of_service','status','rank']
      )
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Updated', module: 'Officials', target: `${editing.residents?.first_name ?? ''} ${editing.residents?.last_name ?? ''}`.trim() || name, changes })
    } else {
      await supabase.from('barangay_officials').insert(form)
      await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Created', module: 'Officials', target: `${name} — ${form.position}` })
    }
    // Sync Barangay Captain to barangay_settings
    if (form.position === 'Barangay Captain' && form.status === 'Active' && res) {
      await supabase.from('barangay_settings').update({
        captain_name: name,
        captain_position: 'Barangay Captain',
        updated_at: new Date().toISOString(),
      }).neq('id', '00000000-0000-0000-0000-000000000000') // update all rows (single-row table)
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this official?')) return
    const o = officials.find(x => x.id === id)
    await supabase.from('barangay_officials').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Officials', target: o ? `${o.residents?.first_name ?? ''} ${o.residents?.last_name ?? ''} — ${o.position}`.trim() : id })
    fetchAll()
  }

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const active = officials.filter(o => o.status === 'Active').length

  return (
    <div className="space-y-5">
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 50%,#60a5fa 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Barangay Officials</h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#bfdbfe' }}>Elected and appointed officials</p>
            </div>
            {canDo('officials', 'can_add') && (
              <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                <Plus size={15} /> Add Official
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[{ label: `${officials.length} total` }, { label: `${active} active` }].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Rank</th>
                <th className="table-header">Name</th>
                <th className="table-header">Position</th>
                <th className="table-header">Committee</th>
                <th className="table-header">Term of Service</th>
                <th className="table-header">Status</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="table-cell text-center py-10 text-slate-400">Loading...</td></tr>
              ) : officials.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center py-10 text-slate-400">No officials found</td></tr>
              ) : officials.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell text-slate-500">{o.rank ?? '—'}</td>
                  <td className="table-cell font-medium">{o.residents?.last_name}, {o.residents?.first_name}</td>
                  <td className="table-cell"><span className="badge-blue">{o.position}</span></td>
                  <td className="table-cell">{o.committee ?? '—'}</td>
                  <td className="table-cell">{o.term_of_service ?? '—'}</td>
                  <td className="table-cell">
                    <span className={o.status === 'Active' ? 'badge-green' : 'badge-gray'}>{o.status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {canDo('officials', 'can_update') && <button onClick={() => openEdit(o)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                      {canDo('officials', 'can_delete') && <button onClick={() => handleDelete(o.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Official' : 'Add Official'} open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="label">Resident *</label>
            <select className="input" value={form.resident_id} onChange={e => set('resident_id', e.target.value)}>
              <option value="">Select resident</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Position *</label>
            <select className="input" value={form.position} onChange={e => set('position', e.target.value)}>
              <option value="">Select position</option>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Committee</label>
            <input className="input" value={form.committee} onChange={e => set('committee', e.target.value)} />
          </div>
          <div>
            <label className="label">Term of Service</label>
            <input className="input" placeholder="e.g. 2022–2025" value={form.term_of_service} onChange={e => set('term_of_service', e.target.value)} />
          </div>
          <div>
            <label className="label">Rank</label>
            <input type="number" className="input" value={form.rank} onChange={e => set('rank', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.resident_id || !form.position}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
