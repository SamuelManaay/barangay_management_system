'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CalRelief, CalIncident, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { auditLog } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'

const ITEM_TYPES = ['Food Pack', 'Water', 'Medicine', 'Clothes', 'Blanket', 'Hygiene Kit', 'Other']
const empty = { incident_id: '', resident_id: '', recipient_name: '', item_type: 'Food Pack', quantity: '1', distribution_date: new Date().toISOString().split('T')[0], distribution_location: '', distributed_by: '', notes: '' }

export default function ReliefPage() {
  const { user, canDo } = useAuth()
  const [records, setRecords] = useState<CalRelief[]>([])
  const [incidents, setIncidents] = useState<CalIncident[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CalRelief | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [rel, inc, res] = await Promise.all([
      supabase.from('cal_relief').select('*, residents(first_name,last_name)').order('distribution_date', { ascending: false }),
      supabase.from('cal_incidents').select('id,incident_type,incident_date').order('incident_date', { ascending: false }),
      supabase.from('residents').select('id,first_name,last_name').order('last_name'),
    ])
    setRecords(rel.data ?? [])
    setIncidents(inc.data ?? [])
    setResidents(res.data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(r: CalRelief) {
    setEditing(r)
    setForm({ incident_id: r.incident_id ?? '', resident_id: r.resident_id ?? '', recipient_name: r.recipient_name ?? '', item_type: r.item_type, quantity: String(r.quantity), distribution_date: r.distribution_date, distribution_location: r.distribution_location ?? '', distributed_by: r.distributed_by ?? '', notes: r.notes ?? '' })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, incident_id: form.incident_id || null, resident_id: form.resident_id || null, quantity: parseInt(form.quantity) || 1 }
    const by = user?.full_name ?? 'Unknown'
    const target = `${form.item_type} x${form.quantity} — ${form.recipient_name || 'Unknown'}`
    if (editing) {
      await supabase.from('cal_relief').update(payload).eq('id', editing.id)
      await auditLog({ performedBy: by, action: 'Updated', module: 'Calamity Relief', target })
    } else {
      await supabase.from('cal_relief').insert(payload)
      await auditLog({ performedBy: by, action: 'Created', module: 'Calamity Relief', target })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this relief record?')) return
    const t = records.find(r => r.id === id)
    await supabase.from('cal_relief').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Calamity Relief', target: t ? `${t.item_type} — ${t.recipient_name ?? ''}` : id })
    fetchAll()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    return r.item_type.toLowerCase().includes(q) || (r.recipient_name ?? '').toLowerCase().includes(q) || (r.distribution_location ?? '').toLowerCase().includes(q)
  })

  const totalByType: Record<string, number> = {}
  records.forEach(r => { totalByType[r.item_type] = (totalByType[r.item_type] ?? 0) + r.quantity })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#064e3b,#059669,#10b981)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Package size={20} style={{ color: '#a7f3d0' }} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Relief Distribution</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>Track relief goods distributed to affected residents</p>
          </div>
          {canDo('cal_relief', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Add Record
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {Object.entries(totalByType).map(([type, qty]) => (
            <div key={type} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.78rem' }}>{type}: {qty}</div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by item, recipient, or location..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Date', 'Item', 'Qty', 'Recipient', 'Location', 'Distributed By', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No records found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid #f8fafc' }}>
                  <td className="table-cell" style={{ color: '#64748b' }}>{r.distribution_date}</td>
                  <td className="table-cell"><span className="badge-green">{r.item_type}</span></td>
                  <td className="table-cell" style={{ fontWeight: 700 }}>{r.quantity}</td>
                  <td className="table-cell" style={{ fontWeight: 600 }}>{r.residents ? `${r.residents.first_name} ${r.residents.last_name}` : (r.recipient_name ?? '—')}</td>
                  <td className="table-cell" style={{ color: '#64748b' }}>{r.distribution_location ?? '—'}</td>
                  <td className="table-cell" style={{ color: '#64748b' }}>{r.distributed_by ?? '—'}</td>
                  <td className="table-cell">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {canDo('cal_relief', 'can_update') && <button onClick={() => openEdit(r)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                      {canDo('cal_relief', 'can_delete') && <button onClick={() => handleDelete(r.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Relief Record' : 'Add Relief Distribution'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="label">Item Type *</label>
            <select className="input" value={form.item_type} onChange={e => set('item_type', e.target.value)}>
              {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity *</label>
            <input type="number" className="input" value={form.quantity} onChange={e => set('quantity', e.target.value)} min="1" />
          </div>
          <div>
            <label className="label">Distribution Date *</label>
            <input type="date" className="input" value={form.distribution_date} onChange={e => set('distribution_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Linked Incident</label>
            <select className="input" value={form.incident_id} onChange={e => set('incident_id', e.target.value)}>
              <option value="">None</option>
              {incidents.map(i => <option key={i.id} value={i.id}>{i.incident_type} — {i.incident_date}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Recipient (Resident)</label>
            <select className="input" value={form.resident_id} onChange={e => set('resident_id', e.target.value)}>
              <option value="">None</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Recipient Name</label>
            <input className="input" value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)} placeholder="If not a registered resident" />
          </div>
          <div>
            <label className="label">Distribution Location</label>
            <input className="input" value={form.distribution_location} onChange={e => set('distribution_location', e.target.value)} />
          </div>
          <div>
            <label className="label">Distributed By</label>
            <input className="input" value={form.distributed_by} onChange={e => set('distributed_by', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" style={{ backgroundColor: '#059669' }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  )
}
