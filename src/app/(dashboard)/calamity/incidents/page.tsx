'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CalIncident, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { auditLog } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'

const TYPES = ['Flood', 'Fire', 'Earthquake', 'Landslide', 'Typhoon', 'Medical Emergency', 'Other']
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
const STATUSES = ['Reported', 'Responding', 'Resolved']

const severityStyle: Record<string, { bg: string; color: string }> = {
  Low:      { bg: '#d1fae5', color: '#065f46' },
  Medium:   { bg: '#fef3c7', color: '#92400e' },
  High:     { bg: '#fee2e2', color: '#991b1b' },
  Critical: { bg: '#fce7f3', color: '#9d174d' },
}
const statusStyle: Record<string, { bg: string; color: string }> = {
  Reported:   { bg: '#fef3c7', color: '#92400e' },
  Responding: { bg: '#dbeafe', color: '#1e40af' },
  Resolved:   { bg: '#f1f5f9', color: '#475569' },
}

const empty = { incident_type: 'Flood', incident_date: new Date().toISOString().split('T')[0], incident_time: new Date().toTimeString().slice(0,5), location: '', description: '', reported_by: '', resident_id: '', status: 'Reported', severity: 'Medium' }

export default function IncidentsPage() {
  const { user, canDo } = useAuth()
  const [incidents, setIncidents] = useState<CalIncident[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CalIncident | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [inc, res] = await Promise.all([
      supabase.from('cal_incidents').select('*, residents(first_name,last_name)').order('incident_date', { ascending: false }),
      supabase.from('residents').select('id,first_name,last_name').order('last_name'),
    ])
    setIncidents(inc.data ?? [])
    setResidents(res.data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(i: CalIncident) {
    setEditing(i)
    setForm({ incident_type: i.incident_type, incident_date: i.incident_date, incident_time: i.incident_time, location: i.location ?? '', description: i.description ?? '', reported_by: i.reported_by ?? '', resident_id: i.resident_id ?? '', status: i.status, severity: i.severity })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, resident_id: form.resident_id || null, updated_at: new Date().toISOString() }
    const by = user?.full_name ?? 'Unknown'
    if (editing) {
      await supabase.from('cal_incidents').update(payload).eq('id', editing.id)
      await auditLog({ performedBy: by, action: 'Updated', module: 'Calamity Incidents', target: `${form.incident_type} — ${form.location || form.incident_date}` })
    } else {
      await supabase.from('cal_incidents').insert(payload)
      await auditLog({ performedBy: by, action: 'Created', module: 'Calamity Incidents', target: `${form.incident_type} — ${form.location || form.incident_date}` })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this incident?')) return
    const t = incidents.find(i => i.id === id)
    await supabase.from('cal_incidents').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Calamity Incidents', target: t ? `${t.incident_type} — ${t.location ?? t.incident_date}` : id })
    fetchAll()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const filtered = incidents.filter(i => {
    const q = search.toLowerCase()
    return i.incident_type.toLowerCase().includes(q) || (i.location ?? '').toLowerCase().includes(q) || i.status.toLowerCase().includes(q)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#7f1d1d,#991b1b,#dc2626)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <AlertTriangle size={20} style={{ color: '#fca5a5' }} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Incident Reports</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#fecaca' }}>Log and track disaster incidents</p>
          </div>
          {canDo('cal_incidents', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Report Incident
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              <span>{incidents.filter(i => i.status === s).length} {s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by type, location, or status..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Type', 'Date & Time', 'Location', 'Reported By', 'Severity', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No incidents found</td></tr>
              ) : filtered.map(i => {
                const sv = severityStyle[i.severity] ?? { bg: '#f1f5f9', color: '#475569' }
                const st = statusStyle[i.status] ?? { bg: '#f1f5f9', color: '#475569' }
                return (
                  <tr key={i.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td className="table-cell" style={{ fontWeight: 600 }}>{i.incident_type}</td>
                    <td className="table-cell" style={{ color: '#64748b', fontSize: '0.8rem' }}>{i.incident_date}<br />{i.incident_time}</td>
                    <td className="table-cell">{i.location ?? '—'}</td>
                    <td className="table-cell">{i.residents ? `${i.residents.first_name} ${i.residents.last_name}` : (i.reported_by ?? '—')}</td>
                    <td className="table-cell"><span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: sv.bg, color: sv.color }}>{i.severity}</span></td>
                    <td className="table-cell"><span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: st.bg, color: st.color }}>{i.status}</span></td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canDo('cal_incidents', 'can_update') && <button onClick={() => openEdit(i)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                        {canDo('cal_incidents', 'can_delete') && <button onClick={() => handleDelete(i.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Incident' : 'Report Incident'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="label">Incident Type *</label>
            <select className="input" value={form.incident_type} onChange={e => set('incident_type', e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Severity</label>
            <select className="input" value={form.severity} onChange={e => set('severity', e.target.value)}>
              {SEVERITIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={form.incident_date} onChange={e => set('incident_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Time *</label>
            <input type="time" className="input" value={form.incident_time} onChange={e => set('incident_time', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Purok, street, or landmark" />
          </div>
          <div>
            <label className="label">Reported By (name)</label>
            <input className="input" value={form.reported_by} onChange={e => set('reported_by', e.target.value)} />
          </div>
          <div>
            <label className="label">Linked Resident</label>
            <select className="input" value={form.resident_id} onChange={e => set('resident_id', e.target.value)}>
              <option value="">None</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" style={{ backgroundColor: '#dc2626' }} onClick={handleSave} disabled={saving || !form.incident_type}>{saving ? 'Saving...' : editing ? 'Update' : 'Report'}</button>
        </div>
      </Modal>
    </div>
  )
}
