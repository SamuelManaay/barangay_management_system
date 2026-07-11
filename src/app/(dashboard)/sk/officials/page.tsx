'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SKOfficial, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import { auditLog, diffChanges } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'

const POSITIONS = ['Chairperson', 'Kagawad', 'Secretary', 'Treasurer']
const empty = { resident_id: '', position: 'Kagawad', term_start: '', term_end: '', contact: '', status: 'Active' }

export default function SKOfficialsPage() {
  const { user, canDo } = useAuth()
  const [officials, setOfficials] = useState<SKOfficial[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SKOfficial | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [off, res] = await Promise.all([
      supabase.from('sk_officials').select('*, residents(first_name, last_name)').order('created_at'),
      supabase.from('residents').select('id, first_name, last_name').order('last_name'),
    ])
    setOfficials(off.data ?? [])
    setResidents(res.data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(o: SKOfficial) {
    setEditing(o)
    setForm({ resident_id: o.resident_id ?? '', position: o.position, term_start: o.term_start ?? '', term_end: o.term_end ?? '', contact: o.contact ?? '', status: o.status })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, resident_id: form.resident_id || null }
    const by = user?.full_name ?? 'Unknown'
    if (editing) {
      await supabase.from('sk_officials').update(payload).eq('id', editing.id)
      const changes = diffChanges(
        editing as unknown as Record<string, unknown>,
        payload as unknown as Record<string, unknown>,
        ['position', 'status', 'term_start', 'term_end', 'contact']
      )
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: by, action: 'Updated', module: 'SK Officials', target: form.position, changes })
    } else {
      await supabase.from('sk_officials').insert(payload)
      await auditLog({ performedBy: by, action: 'Created', module: 'SK Officials', target: form.position })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this official?')) return
    const target = officials.find(o => o.id === id)
    await supabase.from('sk_officials').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'SK Officials', target: target?.position ?? id })
    fetchAll()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const posOrder = ['Chairperson', 'Secretary', 'Treasurer', 'Kagawad']
  const sorted = [...officials].sort((a, b) => posOrder.indexOf(a.position) - posOrder.indexOf(b.position))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#065f46,#059669,#10b981)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Star size={20} style={{ color: '#fbbf24' }} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>SK Officials</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>Manage Sangguniang Kabataan officers</p>
          </div>
          {canDo('sk_officials', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Add Official
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Name', 'Position', 'Term', 'Contact', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={6} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No officials yet</td></tr>
              ) : sorted.map(o => (
                <tr key={o.id} style={{ borderTop: '1px solid #f8fafc' }}>
                  <td className="table-cell" style={{ fontWeight: 600 }}>
                    {o.residents ? `${o.residents.last_name}, ${o.residents.first_name}` : '—'}
                  </td>
                  <td className="table-cell">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: o.position === 'Chairperson' ? '#fef3c7' : '#dbeafe', color: o.position === 'Chairperson' ? '#92400e' : '#1e40af' }}>
                      {o.position === 'Chairperson' && <Star size={10} />}{o.position}
                    </span>
                  </td>
                  <td className="table-cell" style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {o.term_start && o.term_end ? `${o.term_start} – ${o.term_end}` : o.term_start ?? '—'}
                  </td>
                  <td className="table-cell">{o.contact ?? '—'}</td>
                  <td className="table-cell"><span className={o.status === 'Active' ? 'badge-green' : 'badge-gray'}>{o.status}</span></td>
                  <td className="table-cell">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {canDo('sk_officials', 'can_update') && <button onClick={() => openEdit(o)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                      {canDo('sk_officials', 'can_delete') && <button onClick={() => handleDelete(o.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit SK Official' : 'Add SK Official'} open={modalOpen} onClose={() => setModalOpen(false)} size="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Resident</label>
            <select className="input" value={form.resident_id} onChange={e => set('resident_id', e.target.value)}>
              <option value="">Select resident</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Position *</label>
            <select className="input" value={form.position} onChange={e => set('position', e.target.value)}>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
          <div>
            <label className="label">Term Start</label>
            <input type="date" className="input" value={form.term_start} onChange={e => set('term_start', e.target.value)} />
          </div>
          <div>
            <label className="label">Term End</label>
            <input type="date" className="input" value={form.term_end} onChange={e => set('term_end', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Contact</label>
            <input className="input" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Phone number" />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.position}>{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  )
}
