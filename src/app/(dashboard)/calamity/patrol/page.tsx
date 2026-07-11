'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CalPatrolLog, CalTanod } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { auditLog } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'

const empty = { tanod_id: '', patrol_date: new Date().toISOString().split('T')[0], patrol_time: new Date().toTimeString().slice(0, 5), area_covered: '', incident_observed: '', remarks: '' }

type PatrolRow = CalPatrolLog & { cal_tanods: CalTanod }

export default function PatrolPage() {
  const { user, canDo } = useAuth()
  const [logs, setLogs] = useState<PatrolRow[]>([])
  const [tanods, setTanods] = useState<CalTanod[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PatrolRow | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [l, t] = await Promise.all([
      supabase.from('cal_patrol_logs').select('*, cal_tanods(name,assigned_area)').order('patrol_date', { ascending: false }).order('patrol_time', { ascending: false }),
      supabase.from('cal_tanods').select('id,name').order('name'),
    ])
    setLogs(l.data ?? [])
    setTanods(t.data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(l: PatrolRow) {
    setEditing(l)
    setForm({ tanod_id: l.tanod_id, patrol_date: l.patrol_date, patrol_time: l.patrol_time, area_covered: l.area_covered ?? '', incident_observed: l.incident_observed ?? '', remarks: l.remarks ?? '' })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const by = user?.full_name ?? 'Unknown'
    const tanod = tanods.find(t => t.id === form.tanod_id)
    const target = `${tanod?.name ?? 'Unknown'} — ${form.patrol_date}`
    if (editing) {
      await supabase.from('cal_patrol_logs').update(form).eq('id', editing.id)
      await auditLog({ performedBy: by, action: 'Updated', module: 'Calamity Patrol', target })
    } else {
      await supabase.from('cal_patrol_logs').insert(form)
      await auditLog({ performedBy: by, action: 'Created', module: 'Calamity Patrol', target })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this patrol log?')) return
    const t = logs.find(l => l.id === id)
    await supabase.from('cal_patrol_logs').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Calamity Patrol', target: t ? `${t.cal_tanods?.name ?? ''} — ${t.patrol_date}` : id })
    fetchAll()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    return (l.cal_tanods?.name ?? '').toLowerCase().includes(q) || (l.area_covered ?? '').toLowerCase().includes(q) || (l.incident_observed ?? '').toLowerCase().includes(q)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#78350f,#b45309,#d97706)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <MapPin size={20} style={{ color: '#fde68a' }} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Patrol Logs</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#fde68a' }}>Record tanod patrol activities and observations</p>
          </div>
          {canDo('cal_patrol', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Log Patrol
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>{logs.length} total logs</div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>{logs.filter(l => l.incident_observed).length} with incidents observed</div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by tanod, area, or incident observed..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Tanod', 'Date & Time', 'Area Covered', 'Incident Observed', 'Remarks', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No patrol logs found</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} style={{ borderTop: '1px solid #f8fafc' }}>
                  <td className="table-cell" style={{ fontWeight: 600 }}>{l.cal_tanods?.name ?? '—'}</td>
                  <td className="table-cell" style={{ color: '#64748b', fontSize: '0.8rem' }}>{l.patrol_date}<br />{l.patrol_time}</td>
                  <td className="table-cell">{l.area_covered ?? '—'}</td>
                  <td className="table-cell">
                    {l.incident_observed
                      ? <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: '#fee2e2', color: '#991b1b' }}>{l.incident_observed}</span>
                      : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>}
                  </td>
                  <td className="table-cell" style={{ color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.remarks ?? '—'}</td>
                  <td className="table-cell">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {canDo('cal_patrol', 'can_update') && <button onClick={() => openEdit(l)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                      {canDo('cal_patrol', 'can_delete') && <button onClick={() => handleDelete(l.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Patrol Log' : 'Log Patrol'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Tanod *</label>
            <select className="input" value={form.tanod_id} onChange={e => set('tanod_id', e.target.value)}>
              <option value="">Select tanod</option>
              {tanods.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Patrol Date *</label>
            <input type="date" className="input" value={form.patrol_date} onChange={e => set('patrol_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Patrol Time *</label>
            <input type="time" className="input" value={form.patrol_time} onChange={e => set('patrol_time', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Area Covered</label>
            <input className="input" value={form.area_covered} onChange={e => set('area_covered', e.target.value)} placeholder="e.g. Purok 1 to Purok 3" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Incident Observed</label>
            <input className="input" value={form.incident_observed} onChange={e => set('incident_observed', e.target.value)} placeholder="Leave blank if none" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Remarks</label>
            <textarea className="input" rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" style={{ backgroundColor: '#b45309' }} onClick={handleSave} disabled={saving || !form.tanod_id}>{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  )
}
