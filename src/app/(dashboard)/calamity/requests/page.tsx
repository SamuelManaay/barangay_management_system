'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CalRequest, CalIncident, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { auditLog } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, Siren, MapPin, AlertOctagon } from 'lucide-react'

const REQUEST_TYPES = ['Rescue', 'Medical', 'Evacuation', 'Food', 'Water', 'Other', 'Police', 'Fire']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const STATUSES = ['Pending', 'Responding', 'Completed']
const SOS_TYPES = ['Police', 'Fire', 'Medical']

const priorityStyle: Record<string, { bg: string; color: string }> = {
  Low:      { bg: '#d1fae5', color: '#065f46' },
  Medium:   { bg: '#fef3c7', color: '#92400e' },
  High:     { bg: '#fee2e2', color: '#991b1b' },
  Critical: { bg: '#fce7f3', color: '#9d174d' },
}
const statusStyle: Record<string, { bg: string; color: string }> = {
  Pending:    { bg: '#fef3c7', color: '#92400e' },
  Responding: { bg: '#dbeafe', color: '#1e40af' },
  Completed:  { bg: '#f1f5f9', color: '#475569' },
}

const empty = { incident_id: '', resident_id: '', requester_name: '', request_type: 'Rescue', sos_type: '', people_affected: '1', priority: 'High', status: 'Pending', assigned_responder: '', notes: '' }

export default function RequestsPage() {
  const { user, canDo } = useAuth()
  const [requests, setRequests] = useState<CalRequest[]>([])
  const [incidents, setIncidents] = useState<CalIncident[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CalRequest | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [req, inc, res] = await Promise.all([
      supabase.from('cal_requests').select('*, residents(first_name,last_name)').order('created_at', { ascending: false }),
      supabase.from('cal_incidents').select('id,incident_type,incident_date').neq('status', 'Resolved').order('incident_date', { ascending: false }),
      supabase.from('residents').select('id,first_name,last_name').order('last_name'),
    ])
    setRequests(req.data ?? [])
    setIncidents(inc.data ?? [])
    setResidents(res.data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(r: CalRequest) {
    setEditing(r)
    setForm({ incident_id: r.incident_id ?? '', resident_id: r.resident_id ?? '', requester_name: r.requester_name ?? '', request_type: r.request_type, sos_type: r.sos_type ?? '', people_affected: String(r.people_affected), priority: r.priority, status: r.status, assigned_responder: r.assigned_responder ?? '', notes: r.notes ?? '' })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, incident_id: form.incident_id || null, resident_id: form.resident_id || null, sos_type: form.sos_type || null, people_affected: parseInt(form.people_affected) || 1, updated_at: new Date().toISOString() }
    const by = user?.full_name ?? 'Unknown'
    const target = `${form.request_type} — ${form.requester_name || 'Unknown'}`
    if (editing) {
      await supabase.from('cal_requests').update(payload).eq('id', editing.id)
      await auditLog({ performedBy: by, action: 'Updated', module: 'Calamity Requests', target })
    } else {
      await supabase.from('cal_requests').insert(payload)
      await auditLog({ performedBy: by, action: 'Created', module: 'Calamity Requests', target })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this request?')) return
    const t = requests.find(r => r.id === id)
    await supabase.from('cal_requests').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Calamity Requests', target: t ? `${t.request_type} — ${t.requester_name ?? ''}` : id })
    fetchAll()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    return r.request_type.toLowerCase().includes(q) || (r.requester_name ?? '').toLowerCase().includes(q) || r.status.toLowerCase().includes(q)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#7c2d12,#c2410c,#ea580c)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Siren size={20} style={{ color: '#fed7aa' }} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Emergency Requests</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#fed7aa' }}>Rescue, medical, evacuation, and supply requests</p>
          </div>
          {canDo('cal_requests', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> New Request
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              {requests.filter(r => r.status === s).length} {s}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by type, requester, or status..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Requester', 'Type', 'People Affected', 'Priority', 'Status', 'Assigned To', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No requests found</td></tr>
              ) : filtered.map(r => {
                const pr = priorityStyle[r.priority] ?? { bg: '#f1f5f9', color: '#475569' }
                const st = statusStyle[r.status] ?? { bg: '#f1f5f9', color: '#475569' }
                const isSOS = !!r.sos_type
                const hasGPS = r.latitude != null && r.longitude != null
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid #f8fafc', backgroundColor: isSOS ? '#fff5f5' : undefined }}>
                    <td className="table-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isSOS && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: '#fce7f3', color: '#9d174d', border: '1px solid #fbcfe8' }}><AlertOctagon size={10} /> SOS</span>}
                        <span style={{ fontWeight: 600 }}>{r.residents ? `${r.residents.first_name} ${r.residents.last_name}` : (r.requester_name ?? '—')}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span className="badge-blue">{r.request_type}</span>
                        {isSOS && <span style={{ fontSize: '0.7rem', color: '#9d174d', fontWeight: 600 }}>{r.sos_type} Response</span>}
                      </div>
                    </td>
                    <td className="table-cell">{r.people_affected}</td>
                    <td className="table-cell"><span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: pr.bg, color: pr.color }}>{r.priority}</span></td>
                    <td className="table-cell"><span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: st.bg, color: st.color }}>{r.status}</span></td>
                    <td className="table-cell" style={{ color: '#64748b' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span>{r.assigned_responder ?? '—'}</span>
                        {hasGPS && (
                          <a href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: '#059669', fontWeight: 600, textDecoration: 'none' }}>
                            <MapPin size={10} /> GPS Location
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canDo('cal_requests', 'can_update') && <button onClick={() => openEdit(r)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                        {canDo('cal_requests', 'can_delete') && <button onClick={() => handleDelete(r.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Request' : 'New Emergency Request'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="label">Linked Resident</label>
            <select className="input" value={form.resident_id} onChange={e => set('resident_id', e.target.value)}>
              <option value="">None / Walk-in</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Requester Name</label>
            <input className="input" value={form.requester_name} onChange={e => set('requester_name', e.target.value)} placeholder="If not a registered resident" />
          </div>
          <div>
            <label className="label">Request Type *</label>
            <select className="input" value={form.request_type} onChange={e => set('request_type', e.target.value)}>
              {REQUEST_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">People Affected</label>
            <input type="number" className="input" value={form.people_affected} onChange={e => set('people_affected', e.target.value)} min="1" />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Linked Incident</label>
            <select className="input" value={form.incident_id} onChange={e => set('incident_id', e.target.value)}>
              <option value="">None</option>
              {incidents.map(i => <option key={i.id} value={i.id}>{i.incident_type} — {i.incident_date}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assigned Responder</label>
            <input className="input" value={form.assigned_responder} onChange={e => set('assigned_responder', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" style={{ backgroundColor: '#ea580c' }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Submit'}</button>
        </div>
      </Modal>
    </div>
  )
}
