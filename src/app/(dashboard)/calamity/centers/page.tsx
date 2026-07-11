'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CalEvacuationCenter, CalEvacuee, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import { auditLog } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, Tent, Users, LogOut } from 'lucide-react'

const STATUSES = ['Standby', 'Active', 'Full', 'Closed']
const statusStyle: Record<string, { bg: string; color: string }> = {
  Standby: { bg: '#f1f5f9', color: '#475569' },
  Active:  { bg: '#d1fae5', color: '#065f46' },
  Full:    { bg: '#fee2e2', color: '#991b1b' },
  Closed:  { bg: '#fef3c7', color: '#92400e' },
}

const emptyCenter = { name: '', location: '', capacity: '', assigned_staff: '', contact_person: '', contact_number: '', available_supplies: '', status: 'Standby' }
const emptyEvacuee = { resident_id: '', name: '', people_count: '1', notes: '' }

export default function CentersPage() {
  const { user, canDo } = useAuth()
  const [centers, setCenters] = useState<CalEvacuationCenter[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [centerModal, setCenterModal] = useState(false)
  const [editingCenter, setEditingCenter] = useState<CalEvacuationCenter | null>(null)
  const [centerForm, setCenterForm] = useState(emptyCenter)
  const [saving, setSaving] = useState(false)
  const [evacueeModal, setEvacueeModal] = useState<CalEvacuationCenter | null>(null)
  const [evacuees, setEvacuees] = useState<CalEvacuee[]>([])
  const [evacueeForm, setEvacueeForm] = useState(emptyEvacuee)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [c, r] = await Promise.all([
      supabase.from('cal_evacuation_centers').select('*').order('created_at', { ascending: false }),
      supabase.from('residents').select('id,first_name,last_name').order('last_name'),
    ])
    setCenters(c.data ?? [])
    setResidents(r.data ?? [])
    setLoading(false)
  }

  function openAddCenter() { setEditingCenter(null); setCenterForm(emptyCenter); setCenterModal(true) }
  function openEditCenter(c: CalEvacuationCenter) {
    setEditingCenter(c)
    setCenterForm({ name: c.name, location: c.location ?? '', capacity: String(c.capacity), assigned_staff: c.assigned_staff ?? '', contact_person: c.contact_person ?? '', contact_number: c.contact_number ?? '', available_supplies: c.available_supplies ?? '', status: c.status })
    setCenterModal(true)
  }

  async function handleSaveCenter() {
    setSaving(true)
    const payload = { ...centerForm, capacity: parseInt(centerForm.capacity) || 0 }
    const by = user?.full_name ?? 'Unknown'
    if (editingCenter) {
      await supabase.from('cal_evacuation_centers').update(payload).eq('id', editingCenter.id)
      await auditLog({ performedBy: by, action: 'Updated', module: 'Calamity Centers', target: centerForm.name })
    } else {
      await supabase.from('cal_evacuation_centers').insert({ ...payload, current_occupants: 0 })
      await auditLog({ performedBy: by, action: 'Created', module: 'Calamity Centers', target: centerForm.name })
    }
    setSaving(false); setCenterModal(false); fetchAll()
  }

  async function handleDeleteCenter(id: string) {
    if (!confirm('Delete this evacuation center?')) return
    const t = centers.find(c => c.id === id)
    await supabase.from('cal_evacuation_centers').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Calamity Centers', target: t?.name ?? id })
    fetchAll()
  }

  async function openEvacuees(c: CalEvacuationCenter) {
    setEvacueeModal(c)
    setEvacueeForm(emptyEvacuee)
    const { data } = await supabase.from('cal_evacuees').select('*, residents(first_name,last_name)').eq('center_id', c.id).is('check_out', null)
    setEvacuees(data ?? [])
  }

  async function addEvacuee() {
    if (!evacueeModal) return
    const payload = { center_id: evacueeModal.id, resident_id: evacueeForm.resident_id || null, name: evacueeForm.name || null, people_count: parseInt(evacueeForm.people_count) || 1, notes: evacueeForm.notes || null }
    await supabase.from('cal_evacuees').insert(payload)
    // update occupant count
    const newCount = evacueeModal.current_occupants + (parseInt(evacueeForm.people_count) || 1)
    await supabase.from('cal_evacuation_centers').update({ current_occupants: newCount }).eq('id', evacueeModal.id)
    setEvacueeForm(emptyEvacuee)
    const { data } = await supabase.from('cal_evacuees').select('*, residents(first_name,last_name)').eq('center_id', evacueeModal.id).is('check_out', null)
    setEvacuees(data ?? [])
    fetchAll()
  }

  async function checkOutEvacuee(evacuee: CalEvacuee) {
    if (!evacueeModal) return
    await supabase.from('cal_evacuees').update({ check_out: new Date().toISOString() }).eq('id', evacuee.id)
    const newCount = Math.max(0, evacueeModal.current_occupants - evacuee.people_count)
    await supabase.from('cal_evacuation_centers').update({ current_occupants: newCount }).eq('id', evacueeModal.id)
    const { data } = await supabase.from('cal_evacuees').select('*, residents(first_name,last_name)').eq('center_id', evacueeModal.id).is('check_out', null)
    setEvacuees(data ?? [])
    fetchAll()
  }

  const setC = (k: string, v: string) => setCenterForm(f => ({ ...f, [k]: v }))
  const setE = (k: string, v: string) => setEvacueeForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#0c4a6e,#0284c7,#0ea5e9)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Tent size={20} style={{ color: '#bae6fd' }} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Evacuation Centers</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#bae6fd' }}>Manage centers and track evacuees</p>
          </div>
          {canDo('cal_centers', 'can_add') && (
            <button onClick={openAddCenter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Add Center
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[
            { label: `${centers.filter(c => c.status === 'Active').length} active` },
            { label: `${centers.reduce((s, c) => s + c.current_occupants, 0)} total evacuees` },
            { label: `${centers.reduce((s, c) => s + c.capacity, 0)} total capacity` },
          ].map(b => (
            <div key={b.label} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>{b.label}</div>
          ))}
        </div>
      </div>

      {loading ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Loading...</p>
        : centers.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No evacuation centers yet</p>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {centers.map(c => {
              const pct = c.capacity > 0 ? Math.min(100, Math.round((c.current_occupants / c.capacity) * 100)) : 0
              const st = statusStyle[c.status] ?? { bg: '#f1f5f9', color: '#475569' }
              return (
                <div key={c.id} style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{c.name}</h3>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>{c.location ?? '—'}</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: st.bg, color: st.color, flexShrink: 0 }}>{c.status}</span>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Occupancy</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pct >= 90 ? '#dc2626' : '#1e293b' }}>{c.current_occupants} / {c.capacity}</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: '9999px', background: pct >= 90 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : pct >= 70 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#0ea5e9,#0284c7)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginBottom: '0.875rem', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>👤 {c.contact_person ?? '—'}</span>
                    <span>📞 {c.contact_number ?? '—'}</span>
                    <span>🧑‍💼 {c.assigned_staff ?? '—'}</span>
                    <span>📦 {c.available_supplies ?? '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEvacuees(c)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid #dbeafe', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                      <Users size={13} /> Evacuees
                    </button>
                    {canDo('cal_centers', 'can_update') && <button onClick={() => openEditCenter(c)} style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', color: '#475569' }}><Pencil size={14} /></button>}
                    {canDo('cal_centers', 'can_delete') && <button onClick={() => handleDeleteCenter(c.id)} style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #fee2e2', backgroundColor: '#fff5f5', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {/* Center Modal */}
      <Modal title={editingCenter ? 'Edit Center' : 'Add Evacuation Center'} open={centerModal} onClose={() => setCenterModal(false)} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Center Name *</label>
            <input className="input" value={centerForm.name} onChange={e => setC('name', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Location</label>
            <input className="input" value={centerForm.location} onChange={e => setC('location', e.target.value)} />
          </div>
          <div>
            <label className="label">Capacity</label>
            <input type="number" className="input" value={centerForm.capacity} onChange={e => setC('capacity', e.target.value)} min="0" />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={centerForm.status} onChange={e => setC('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assigned Staff</label>
            <input className="input" value={centerForm.assigned_staff} onChange={e => setC('assigned_staff', e.target.value)} />
          </div>
          <div>
            <label className="label">Contact Person</label>
            <input className="input" value={centerForm.contact_person} onChange={e => setC('contact_person', e.target.value)} />
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input className="input" value={centerForm.contact_number} onChange={e => setC('contact_number', e.target.value)} />
          </div>
          <div>
            <label className="label">Available Supplies</label>
            <input className="input" value={centerForm.available_supplies} onChange={e => setC('available_supplies', e.target.value)} placeholder="e.g. Food, Water, Blankets" />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setCenterModal(false)}>Cancel</button>
          <button className="btn-primary" style={{ backgroundColor: '#0284c7' }} onClick={handleSaveCenter} disabled={saving || !centerForm.name}>{saving ? 'Saving...' : editingCenter ? 'Update' : 'Save'}</button>
        </div>
      </Modal>

      {/* Evacuees Modal */}
      <Modal title={`Evacuees — ${evacueeModal?.name ?? ''}`} open={!!evacueeModal} onClose={() => setEvacueeModal(null)} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="label">Resident</label>
            <select className="input" value={evacueeForm.resident_id} onChange={e => setE('resident_id', e.target.value)}>
              <option value="">None / Walk-in</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Name (if not resident)</label>
            <input className="input" value={evacueeForm.name} onChange={e => setE('name', e.target.value)} placeholder="Household name" />
          </div>
          <div>
            <label className="label">People</label>
            <input type="number" className="input" value={evacueeForm.people_count} onChange={e => setE('people_count', e.target.value)} min="1" style={{ width: '5rem' }} />
          </div>
          <button className="btn-primary" style={{ backgroundColor: '#0284c7', marginTop: '1.25rem' }} onClick={addEvacuee} disabled={!evacueeForm.resident_id && !evacueeForm.name}>
            <Plus size={14} /> Add
          </button>
        </div>
        {evacuees.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', padding: '1rem 0' }}>No evacuees checked in</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '300px', overflowY: 'auto' }}>
            {evacuees.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                    {e.residents ? `${e.residents.first_name} ${e.residents.last_name}` : (e.name ?? '—')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>{e.people_count} person{e.people_count !== 1 ? 's' : ''}</span>
                  {e.residents && <span style={{ fontSize: '0.65rem', marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 600 }}>Resident</span>}
                </div>
                <button onClick={() => checkOutEvacuee(e)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  <LogOut size={12} /> Check Out
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={() => setEvacueeModal(null)}>Close</button>
        </div>
      </Modal>
    </div>
  )
}
