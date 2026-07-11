'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CalDamage, CalIncident, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { auditLog } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, HardHat } from 'lucide-react'

const DAMAGE_LEVELS = ['Minor', 'Major', 'Total']
const levelStyle: Record<string, { bg: string; color: string }> = {
  Minor: { bg: '#fef3c7', color: '#92400e' },
  Major: { bg: '#fee2e2', color: '#991b1b' },
  Total: { bg: '#fce7f3', color: '#9d174d' },
}

const empty = { incident_id: '', resident_id: '', household_name: '', damage_level: 'Minor', estimated_cost: '', description: '', assessed_by: '', assessment_date: new Date().toISOString().split('T')[0] }

export default function DamagePage() {
  const { user, canDo } = useAuth()
  const [records, setRecords] = useState<CalDamage[]>([])
  const [incidents, setIncidents] = useState<CalIncident[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CalDamage | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [dmg, inc, res] = await Promise.all([
      supabase.from('cal_damage').select('*, residents(first_name,last_name)').order('assessment_date', { ascending: false }),
      supabase.from('cal_incidents').select('id,incident_type,incident_date').order('incident_date', { ascending: false }),
      supabase.from('residents').select('id,first_name,last_name').order('last_name'),
    ])
    setRecords(dmg.data ?? [])
    setIncidents(inc.data ?? [])
    setResidents(res.data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(d: CalDamage) {
    setEditing(d)
    setForm({ incident_id: d.incident_id ?? '', resident_id: d.resident_id ?? '', household_name: d.household_name ?? '', damage_level: d.damage_level, estimated_cost: String(d.estimated_cost), description: d.description ?? '', assessed_by: d.assessed_by ?? '', assessment_date: d.assessment_date ?? '' })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, incident_id: form.incident_id || null, resident_id: form.resident_id || null, estimated_cost: parseFloat(form.estimated_cost) || 0 }
    const by = user?.full_name ?? 'Unknown'
    const target = form.household_name || (residents.find(r => r.id === form.resident_id) ? `${residents.find(r => r.id === form.resident_id)!.first_name} ${residents.find(r => r.id === form.resident_id)!.last_name}` : 'Unknown')
    if (editing) {
      await supabase.from('cal_damage').update(payload).eq('id', editing.id)
      await auditLog({ performedBy: by, action: 'Updated', module: 'Calamity Damage', target })
    } else {
      await supabase.from('cal_damage').insert(payload)
      await auditLog({ performedBy: by, action: 'Created', module: 'Calamity Damage', target })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this damage record?')) return
    const t = records.find(r => r.id === id)
    await supabase.from('cal_damage').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Calamity Damage', target: t?.household_name ?? id })
    fetchAll()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    return (r.household_name ?? '').toLowerCase().includes(q) || r.damage_level.toLowerCase().includes(q) || (r.assessed_by ?? '').toLowerCase().includes(q)
  })

  const totalCost = records.reduce((s, r) => s + r.estimated_cost, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#4c1d95,#6d28d9,#7c3aed)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <HardHat size={20} style={{ color: '#ddd6fe' }} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Damage Assessment</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#ddd6fe' }}>Record property damage from disasters</p>
          </div>
          {canDo('cal_damage', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Add Assessment
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {DAMAGE_LEVELS.map(l => (
            <div key={l} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              {records.filter(r => r.damage_level === l).length} {l}
            </div>
          ))}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
            ₱{totalCost.toLocaleString()} total est. damage
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by household, damage level, or assessor..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Household / Resident', 'Damage Level', 'Est. Cost', 'Description', 'Assessed By', 'Date', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No damage records found</td></tr>
              ) : filtered.map(d => {
                const lv = levelStyle[d.damage_level] ?? { bg: '#f1f5f9', color: '#475569' }
                return (
                  <tr key={d.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td className="table-cell" style={{ fontWeight: 600 }}>{d.residents ? `${d.residents.first_name} ${d.residents.last_name}` : (d.household_name ?? '—')}</td>
                    <td className="table-cell"><span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: lv.bg, color: lv.color }}>{d.damage_level}</span></td>
                    <td className="table-cell" style={{ fontWeight: 700, color: '#7c3aed' }}>₱{Number(d.estimated_cost).toLocaleString()}</td>
                    <td className="table-cell" style={{ color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description ?? '—'}</td>
                    <td className="table-cell" style={{ color: '#64748b' }}>{d.assessed_by ?? '—'}</td>
                    <td className="table-cell" style={{ color: '#64748b' }}>{d.assessment_date ?? '—'}</td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canDo('cal_damage', 'can_update') && <button onClick={() => openEdit(d)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                        {canDo('cal_damage', 'can_delete') && <button onClick={() => handleDelete(d.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Assessment' : 'Add Damage Assessment'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="label">Resident</label>
            <select className="input" value={form.resident_id} onChange={e => set('resident_id', e.target.value)}>
              <option value="">None</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Household Name</label>
            <input className="input" value={form.household_name} onChange={e => set('household_name', e.target.value)} placeholder="If not a registered resident" />
          </div>
          <div>
            <label className="label">Damage Level *</label>
            <select className="input" value={form.damage_level} onChange={e => set('damage_level', e.target.value)}>
              {DAMAGE_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Estimated Cost (₱)</label>
            <input type="number" className="input" value={form.estimated_cost} onChange={e => set('estimated_cost', e.target.value)} min="0" />
          </div>
          <div>
            <label className="label">Linked Incident</label>
            <select className="input" value={form.incident_id} onChange={e => set('incident_id', e.target.value)}>
              <option value="">None</option>
              {incidents.map(i => <option key={i.id} value={i.id}>{i.incident_type} — {i.incident_date}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assessment Date</label>
            <input type="date" className="input" value={form.assessment_date} onChange={e => set('assessment_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Assessed By</label>
            <input className="input" value={form.assessed_by} onChange={e => set('assessed_by', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" style={{ backgroundColor: '#7c3aed' }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  )
}
