'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { BlotterRecord, BlotterPersonInvolved, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { Plus, Eye, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { auditLog, diffChanges } from '@/lib/audit'

const INCIDENT_TYPES = ['Physical Injury', 'Theft', 'Trespassing', 'Noise Complaint', 'Domestic Violence', 'Verbal Abuse', 'Property Damage', 'Others']
const STATUSES = ['Pending', 'Settled', 'Dismissed', 'For Filing']
const INVOLVEMENT = ['Complainant', 'Victim', 'Respondent'] as const

const statusClass: Record<string, string> = {
  Pending: 'badge-yellow', Settled: 'badge-green',
  Dismissed: 'badge-gray', 'For Filing': 'badge-red',
}

const emptyBlotter = {
  incident_type: '', date_recorded: new Date().toISOString().split('T')[0],
  time_recorded: new Date().toTimeString().slice(0, 5),
  incident_date: '', incident_time: '', incident_location: '',
  incident_narrative: '', blotter_status: 'Pending',
}

const emptyPerson: Omit<BlotterPersonInvolved, 'id' | 'blotter_id' | 'created_at'> = {
  involvement_type: 'Complainant', resident_id: undefined,
  first_name: '', middle_name: '', last_name: '', alias: '',
  gender: '', civil_status: '', birth_date: '', birth_place: '',
  address: '', primary_contact: '', primary_email: '',
}

export default function BlotterPage() {
  const { user, canDo } = useAuth()
  const [records, setRecords] = useState<BlotterRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [personModalOpen, setPersonModalOpen] = useState(false)
  const [editing, setEditing] = useState<BlotterRecord | null>(null)
  const [selected, setSelected] = useState<BlotterRecord | null>(null)
  const [involved, setInvolved] = useState<BlotterPersonInvolved[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [form, setForm] = useState(emptyBlotter)
  const [personForm, setPersonForm] = useState(emptyPerson)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchRecords(); fetchResidents() }, [])

  async function fetchRecords() {
    setLoading(true)
    const { data } = await supabase.from('blotter_records').select('*').order('created_at', { ascending: false })
    setRecords(data ?? [])
    setLoading(false)
  }

  async function fetchResidents() {
    const { data } = await supabase.from('residents').select('id, first_name, middle_name, last_name, purok, primary_contact, primary_email').order('last_name')
    setResidents(data ?? [])
  }

  async function openDetail(r: BlotterRecord) {
    setSelected(r)
    const { data } = await supabase.from('blotter_people_involved').select('*').eq('blotter_id', r.id)
    setInvolved(data ?? [])
    setDetailOpen(true)
  }

  function openAdd() { setEditing(null); setForm(emptyBlotter); setModalOpen(true) }
  function openEdit(r: BlotterRecord) { setEditing(r); setForm({ ...r } as typeof emptyBlotter); setModalOpen(true) }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      await supabase.from('blotter_records').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
      const changes = diffChanges(
        editing as unknown as Record<string, unknown>,
        form as unknown as Record<string, unknown>,
        ['incident_type','incident_date','incident_location','incident_narrative','blotter_status']
      )
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Updated', module: 'Blotter', target: editing.incident_type ?? editing.id, changes })
    } else {
      await supabase.from('blotter_records').insert(form)
      await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Created', module: 'Blotter', target: form.incident_type || 'New Record' })
    }
    setSaving(false); setModalOpen(false); fetchRecords()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this blotter record?')) return
    const rec = records.find(r => r.id === id)
    await supabase.from('blotter_records').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Blotter', target: rec?.incident_type ?? id })
    fetchRecords()
  }

  async function handleAddPerson() {
    if (!selected) return
    setSaving(true)
    // Strip empty strings to null for date fields to avoid DB errors
    const payload = {
      ...personForm,
      blotter_id: selected.id,
      birth_date: personForm.birth_date || null,
      resident_id: personForm.resident_id || null,
    }
    const { error } = await supabase.from('blotter_people_involved').insert(payload)
    if (error) { alert(error.message); setSaving(false); return }
    const { data } = await supabase.from('blotter_people_involved').select('*').eq('blotter_id', selected.id)
    setInvolved(data ?? [])
    setPersonForm(emptyPerson); setPersonModalOpen(false); setSaving(false)
  }

  async function handleRemovePerson(id: string) {
    await supabase.from('blotter_people_involved').delete().eq('id', id)
    setInvolved(p => p.filter(x => x.id !== id))
  }

  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    return (r.incident_type ?? '').toLowerCase().includes(q) ||
      (r.incident_location ?? '').toLowerCase().includes(q) ||
      r.blotter_status.toLowerCase().includes(q)
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setPerson = (k: string, v: string) => setPersonForm(f => ({ ...f, [k]: v }))

  const pending = records.filter(r => r.blotter_status === 'Pending').length
  const settled = records.filter(r => r.blotter_status === 'Settled').length

  return (
    <div className="space-y-5">
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#b91c1c 0%,#ef4444 50%,#f97316 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Blotter Records</h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#fecaca' }}>Incident and blotter management</p>
            </div>
            {canDo('blotter', 'can_add') && (
              <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                <Plus size={15} /> New Blotter
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[{ label: `${records.length} total` }, { label: `${pending} pending` }, { label: `${settled} settled` }].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b px-5 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search incident type, location..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Incident Type</th>
                <th className="table-header">Date Recorded</th>
                <th className="table-header">Incident Date</th>
                <th className="table-header">Location</th>
                <th className="table-header">Status</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="table-cell text-center py-10 text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center py-10 text-slate-400">No records found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-medium">{r.incident_type ?? '—'}</td>
                  <td className="table-cell">{r.date_recorded} {r.time_recorded}</td>
                  <td className="table-cell">{r.incident_date ?? '—'}</td>
                  <td className="table-cell">{r.incident_location ?? '—'}</td>
                  <td className="table-cell">
                    <span className={statusClass[r.blotter_status] ?? 'badge-gray'}>{r.blotter_status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openDetail(r)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Eye size={15} /></button>
                      {canDo('blotter', 'can_update') && <button onClick={() => openEdit(r)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                      {canDo('blotter', 'can_delete') && <button onClick={() => handleDelete(r.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Blotter Modal */}
      <Modal title={editing ? 'Edit Blotter Record' : 'New Blotter Record'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Incident Type</label>
            <select className="input" value={form.incident_type} onChange={e => set('incident_type', e.target.value)}>
              <option value="">Select</option>
              {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.blotter_status} onChange={e => set('blotter_status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date Recorded</label>
            <input type="date" className="input" value={form.date_recorded} onChange={e => set('date_recorded', e.target.value)} />
          </div>
          <div>
            <label className="label">Time Recorded</label>
            <input type="time" className="input" value={form.time_recorded} onChange={e => set('time_recorded', e.target.value)} />
          </div>
          <div>
            <label className="label">Incident Date</label>
            <input type="date" className="input" value={form.incident_date} onChange={e => set('incident_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Incident Time</label>
            <input type="time" className="input" value={form.incident_time} onChange={e => set('incident_time', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Incident Location</label>
            <input className="input" value={form.incident_location} onChange={e => set('incident_location', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Narrative</label>
            <textarea rows={4} className="input resize-none" value={form.incident_narrative} onChange={e => set('incident_narrative', e.target.value)} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal title="Blotter Details" open={detailOpen} onClose={() => setDetailOpen(false)} size="xl">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Incident Type:</span> <span className="font-medium ml-1">{selected.incident_type}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className={`ml-1 ${statusClass[selected.blotter_status] ?? 'badge-gray'}`}>{selected.blotter_status}</span></div>
              <div><span className="text-slate-500">Date Recorded:</span> <span className="font-medium ml-1">{selected.date_recorded} {selected.time_recorded}</span></div>
              <div><span className="text-slate-500">Incident Date:</span> <span className="font-medium ml-1">{selected.incident_date} {selected.incident_time}</span></div>
              <div className="col-span-2"><span className="text-slate-500">Location:</span> <span className="font-medium ml-1">{selected.incident_location}</span></div>
              {selected.incident_narrative && (
                <div className="col-span-2"><span className="text-slate-500">Narrative:</span><p className="mt-1 text-slate-700 bg-slate-50 rounded-lg p-3">{selected.incident_narrative}</p></div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">People Involved</h3>
                <button className="btn-secondary text-xs py-1.5" onClick={() => setPersonModalOpen(true)}><UserPlus size={14} /> Add Person</button>
              </div>
              {involved.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No persons added yet</p>
              ) : (
                <div className="space-y-2">
                  {involved.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm">
                      <div>
                        <span className="font-medium">{p.last_name}, {p.first_name} {p.middle_name}</span>
                        <span className={`ml-2 ${p.involvement_type === 'Complainant' ? 'badge-blue' : p.involvement_type === 'Victim' ? 'badge-yellow' : 'badge-red'}`}>{p.involvement_type}</span>
                      </div>
                      <button onClick={() => handleRemovePerson(p.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Person Modal */}
      <Modal title="Add Person Involved" open={personModalOpen} onClose={() => setPersonModalOpen(false)} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Involvement Type</label>
            <select className="input" value={personForm.involvement_type} onChange={e => setPerson('involvement_type', e.target.value)}>
              {INVOLVEMENT.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Link to Resident (optional)</label>
            <select className="input" value={personForm.resident_id ?? ''} onChange={e => {
              const res = residents.find(r => r.id === e.target.value)
              if (res) {
                setPersonForm(f => ({
                  ...f,
                  resident_id: res.id,
                  first_name: res.first_name,
                  middle_name: res.middle_name ?? '',
                  last_name: res.last_name,
                  address: res.purok ?? '',
                  primary_contact: res.primary_contact ?? '',
                  primary_email: res.primary_email ?? '',
                }))
              } else {
                setPersonForm(f => ({ ...f, resident_id: undefined }))
              }
            }}>
              <option value="">— Not a registered resident —</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">First Name</label>
            <input className="input" value={personForm.first_name ?? ''} onChange={e => setPerson('first_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Middle Name</label>
            <input className="input" value={personForm.middle_name ?? ''} onChange={e => setPerson('middle_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input className="input" value={personForm.last_name ?? ''} onChange={e => setPerson('last_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={personForm.address ?? ''} onChange={e => setPerson('address', e.target.value)} />
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input className="input" value={personForm.primary_contact ?? ''} onChange={e => setPerson('primary_contact', e.target.value)} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setPersonModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleAddPerson} disabled={saving}>{saving ? 'Saving...' : 'Add'}</button>
        </div>
      </Modal>
    </div>
  )
}
