'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CalTanod, CalDispatch, CalIncident } from '@/types'
import Modal from '@/components/ui/Modal'
import { auditLog } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, Shield, Send } from 'lucide-react'

const STATUSES = ['Available', 'On Duty', 'Responding', 'Off Duty']
const statusStyle: Record<string, { bg: string; color: string }> = {
  Available:  { bg: '#d1fae5', color: '#065f46' },
  'On Duty':  { bg: '#dbeafe', color: '#1e40af' },
  Responding: { bg: '#fee2e2', color: '#991b1b' },
  'Off Duty': { bg: '#f1f5f9', color: '#475569' },
}

const emptyTanod = { name: '', contact: '', assigned_area: '', shift_schedule: '', status: 'Available' }
const emptyDispatch = { incident_id: '', tanod_id: '', notes: '' }

type DispatchRow = CalDispatch & { cal_tanods: CalTanod; cal_incidents: CalIncident }

export default function TanodsPage() {
  const { user, canDo } = useAuth()
  const [tanods, setTanods] = useState<CalTanod[]>([])
  const [incidents, setIncidents] = useState<CalIncident[]>([])
  const [dispatches, setDispatches] = useState<DispatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tanodModal, setTanodModal] = useState(false)
  const [editingTanod, setEditingTanod] = useState<CalTanod | null>(null)
  const [tanodForm, setTanodForm] = useState(emptyTanod)
  const [dispatchModal, setDispatchModal] = useState(false)
  const [dispatchForm, setDispatchForm] = useState(emptyDispatch)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'tanods' | 'dispatch'>('tanods')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [t, i, d] = await Promise.all([
      supabase.from('cal_tanods').select('*').order('name'),
      supabase.from('cal_incidents').select('id,incident_type,incident_date,status').neq('status', 'Resolved').order('incident_date', { ascending: false }),
      supabase.from('cal_dispatch').select('*, cal_tanods(*), cal_incidents(incident_type,incident_date,location)').order('dispatched_at', { ascending: false }),
    ])
    setTanods(t.data ?? [])
    setIncidents(i.data ?? [])
    setDispatches(d.data ?? [])
    setLoading(false)
  }

  function openAddTanod() { setEditingTanod(null); setTanodForm(emptyTanod); setTanodModal(true) }
  function openEditTanod(t: CalTanod) { setEditingTanod(t); setTanodForm({ name: t.name, contact: t.contact ?? '', assigned_area: t.assigned_area ?? '', shift_schedule: t.shift_schedule ?? '', status: t.status }); setTanodModal(true) }

  async function handleSaveTanod() {
    setSaving(true)
    const by = user?.full_name ?? 'Unknown'
    if (editingTanod) {
      await supabase.from('cal_tanods').update(tanodForm).eq('id', editingTanod.id)
      await auditLog({ performedBy: by, action: 'Updated', module: 'Calamity Tanods', target: tanodForm.name })
    } else {
      await supabase.from('cal_tanods').insert(tanodForm)
      await auditLog({ performedBy: by, action: 'Created', module: 'Calamity Tanods', target: tanodForm.name })
    }
    setSaving(false); setTanodModal(false); fetchAll()
  }

  async function handleDeleteTanod(id: string) {
    if (!confirm('Delete this tanod?')) return
    const t = tanods.find(x => x.id === id)
    await supabase.from('cal_tanods').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Calamity Tanods', target: t?.name ?? id })
    fetchAll()
  }

  async function handleDispatch() {
    if (!dispatchForm.incident_id || !dispatchForm.tanod_id) return
    setSaving(true)
    await supabase.from('cal_dispatch').insert({ incident_id: dispatchForm.incident_id, tanod_id: dispatchForm.tanod_id, notes: dispatchForm.notes || null, dispatched_at: new Date().toISOString() })
    await supabase.from('cal_tanods').update({ status: 'Responding' }).eq('id', dispatchForm.tanod_id)
    const tanod = tanods.find(t => t.id === dispatchForm.tanod_id)
    const incident = incidents.find(i => i.id === dispatchForm.incident_id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Created', module: 'Calamity Dispatch', target: `${tanod?.name ?? ''} → ${incident?.incident_type ?? ''}` })
    setSaving(false); setDispatchModal(false); fetchAll()
  }

  async function markResponded(id: string) {
    await supabase.from('cal_dispatch').update({ responded_at: new Date().toISOString() }).eq('id', id)
    fetchAll()
  }

  const setT = (k: string, v: string) => setTanodForm(f => ({ ...f, [k]: v }))
  const setD = (k: string, v: string) => setDispatchForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#134e4a,#0f766e,#14b8a6)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Shield size={20} style={{ color: '#99f6e4' }} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Tanod Response Team</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#99f6e4' }}>Manage tanods and emergency dispatch</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {canDo('cal_tanods', 'can_add') && (
              <button onClick={() => { setDispatchForm(emptyDispatch); setDispatchModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <Send size={14} /> Dispatch
              </button>
            )}
            {canDo('cal_tanods', 'can_add') && (
              <button onClick={openAddTanod} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <Plus size={15} /> Add Tanod
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <div key={s} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              {tanods.filter(t => t.status === s).length} {s}
            </div>
          ))}
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem', backgroundColor: '#f8fafc', borderRadius: '0.625rem', border: '1px solid #f1f5f9', width: 'fit-content' }}>
        {(['tanods', 'dispatch'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', backgroundColor: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f766e' : '#94a3b8', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
            {t === 'tanods' ? '🛡️ Tanod List' : '📡 Dispatch Log'}
          </button>
        ))}
      </div>

      {tab === 'tanods' && (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>{['Name', 'Contact', 'Assigned Area', 'Shift', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
                ) : tanods.length === 0 ? (
                  <tr><td colSpan={6} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No tanods registered</td></tr>
                ) : tanods.map(t => {
                  const st = statusStyle[t.status] ?? { bg: '#f1f5f9', color: '#475569' }
                  return (
                    <tr key={t.id} style={{ borderTop: '1px solid #f8fafc' }}>
                      <td className="table-cell" style={{ fontWeight: 600 }}>{t.name}</td>
                      <td className="table-cell">{t.contact ?? '—'}</td>
                      <td className="table-cell">{t.assigned_area ?? '—'}</td>
                      <td className="table-cell" style={{ color: '#64748b' }}>{t.shift_schedule ?? '—'}</td>
                      <td className="table-cell"><span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: st.bg, color: st.color }}>{t.status}</span></td>
                      <td className="table-cell">
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {canDo('cal_tanods', 'can_update') && <button onClick={() => openEditTanod(t)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                          {canDo('cal_tanods', 'can_delete') && <button onClick={() => handleDeleteTanod(t.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'dispatch' && (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>{['Tanod', 'Incident', 'Dispatched At', 'Responded At', 'Notes', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
                ) : dispatches.length === 0 ? (
                  <tr><td colSpan={6} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No dispatches yet</td></tr>
                ) : dispatches.map(d => (
                  <tr key={d.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td className="table-cell" style={{ fontWeight: 600 }}>{d.cal_tanods?.name ?? '—'}</td>
                    <td className="table-cell">{d.cal_incidents ? `${d.cal_incidents.incident_type} — ${d.cal_incidents.incident_date}` : '—'}</td>
                    <td className="table-cell" style={{ color: '#64748b', fontSize: '0.8rem' }}>{d.dispatched_at ? new Date(d.dispatched_at).toLocaleString('en-PH') : '—'}</td>
                    <td className="table-cell">
                      {d.responded_at
                        ? <span className="badge-green" style={{ fontSize: '0.75rem' }}>{new Date(d.responded_at).toLocaleString('en-PH')}</span>
                        : <button onClick={() => markResponded(d.id)} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '0.375rem', border: '1px solid #d1fae5', backgroundColor: '#f0fdf4', color: '#059669', cursor: 'pointer', fontWeight: 600 }}>Mark Responded</button>}
                    </td>
                    <td className="table-cell" style={{ color: '#64748b' }}>{d.notes ?? '—'}</td>
                    <td className="table-cell" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tanod Modal */}
      <Modal title={editingTanod ? 'Edit Tanod' : 'Add Tanod'} open={tanodModal} onClose={() => setTanodModal(false)} size="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Name *</label>
            <input className="input" value={tanodForm.name} onChange={e => setT('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Contact</label>
            <input className="input" value={tanodForm.contact} onChange={e => setT('contact', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={tanodForm.status} onChange={e => setT('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assigned Area</label>
            <input className="input" value={tanodForm.assigned_area} onChange={e => setT('assigned_area', e.target.value)} />
          </div>
          <div>
            <label className="label">Shift Schedule</label>
            <input className="input" value={tanodForm.shift_schedule} onChange={e => setT('shift_schedule', e.target.value)} placeholder="e.g. 6PM–6AM" />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setTanodModal(false)}>Cancel</button>
          <button className="btn-primary" style={{ backgroundColor: '#0f766e' }} onClick={handleSaveTanod} disabled={saving || !tanodForm.name}>{saving ? 'Saving...' : editingTanod ? 'Update' : 'Save'}</button>
        </div>
      </Modal>

      {/* Dispatch Modal */}
      <Modal title="Dispatch Tanod" open={dispatchModal} onClose={() => setDispatchModal(false)} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Tanod *</label>
            <select className="input" value={dispatchForm.tanod_id} onChange={e => setD('tanod_id', e.target.value)}>
              <option value="">Select tanod</option>
              {tanods.filter(t => t.status !== 'Off Duty').map(t => <option key={t.id} value={t.id}>{t.name} ({t.status})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Incident *</label>
            <select className="input" value={dispatchForm.incident_id} onChange={e => setD('incident_id', e.target.value)}>
              <option value="">Select incident</option>
              {incidents.map(i => <option key={i.id} value={i.id}>{i.incident_type} — {i.incident_date}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={dispatchForm.notes} onChange={e => setD('notes', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setDispatchModal(false)}>Cancel</button>
          <button className="btn-primary" style={{ backgroundColor: '#0f766e' }} onClick={handleDispatch} disabled={saving || !dispatchForm.tanod_id || !dispatchForm.incident_id}>{saving ? 'Dispatching...' : 'Dispatch'}</button>
        </div>
      </Modal>
    </div>
  )
}
