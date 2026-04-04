'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { auditLog, diffChanges } from '@/lib/audit'

const CIVIL_STATUS = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled']
const GENDERS = ['Male', 'Female']
const PUROKS = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6']

const empty: Omit<Resident, 'id' | 'created_at' | 'updated_at'> = {
  first_name: '', middle_name: '', last_name: '', alias: '',
  gender: '', birth_date: '', birth_place: '', civil_status: '',
  voter_status: false, purok: '', religion: '', primary_contact: '',
  secondary_contact: '', primary_email: '', secondary_email: '',
  resident_type: 'Permanent',
}

export default function ResidentsPage() {
  const { user } = useAuth()
  const [residents, setResidents] = useState<Resident[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Resident | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchResidents() }, [])

  async function fetchResidents() {
    setLoading(true)
    const { data } = await supabase
      .from('residents')
      .select('*')
      .order('last_name')
    setResidents(data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm(empty)
    setModalOpen(true)
  }

  function openEdit(r: Resident) {
    setEditing(r)
    setForm({ ...r })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      await supabase.from('residents').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
      const changes = diffChanges(
        editing as unknown as Record<string, unknown>,
        form as unknown as Record<string, unknown>,
        ['first_name','middle_name','last_name','gender','civil_status','birth_date','purok','primary_contact','primary_email','voter_status','resident_type']
      )
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Updated', module: 'Residents', target: `${editing.first_name} ${editing.last_name}`, changes })
    } else {
      await supabase.from('residents').insert(form)
      await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Created', module: 'Residents', target: `${form.first_name} ${form.last_name}` })
    }
    setSaving(false)
    setModalOpen(false)
    fetchResidents()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this resident?')) return
    const r = residents.find(x => x.id === id)
    await supabase.from('residents').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Residents', target: r ? `${r.first_name} ${r.last_name}` : id })
    fetchResidents()
  }

  const filtered = residents.filter(r => {
    const q = search.toLowerCase()
    return (
      r.first_name.toLowerCase().includes(q) ||
      r.last_name.toLowerCase().includes(q) ||
      (r.purok ?? '').toLowerCase().includes(q)
    )
  })

  const set = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const permanent = residents.filter(r => r.resident_type === 'Permanent').length
  const transient = residents.filter(r => r.resident_type === 'Transient').length

  return (
    <div className="space-y-5">
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#4338ca 0%,#6366f1 50%,#818cf8 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Residents</h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#c7d2fe' }}>Registered barangay residents</p>
            </div>
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              <Plus size={15} /> Add Resident
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[{ label: `${residents.length} total`, icon: '👥' }, { label: `${permanent} permanent`, icon: '🏠' }, { label: `${transient} transient`, icon: '🚶' }].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
                <span>{b.icon}</span><span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or purok..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Gender</th>
                <th className="table-header">Civil Status</th>
                <th className="table-header">Purok</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Voter</th>
                <th className="table-header">Type</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="table-cell text-center py-10 text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="table-cell text-center py-10 text-slate-400">No residents found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-medium">
                    {r.last_name}, {r.first_name} {r.middle_name}
                  </td>
                  <td className="table-cell">{r.gender ?? '—'}</td>
                  <td className="table-cell">{r.civil_status ?? '—'}</td>
                  <td className="table-cell">{r.purok ?? '—'}</td>
                  <td className="table-cell">{r.primary_contact ?? '—'}</td>
                  <td className="table-cell">
                    <span className={r.voter_status ? 'badge-green' : 'badge-gray'}>
                      {r.voter_status ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="badge-blue">{r.resident_type ?? '—'}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(r)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Resident' : 'Add Resident'} open={modalOpen} onClose={() => setModalOpen(false)} size="xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">First Name *</label>
            <input className="input" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Middle Name</label>
            <input className="input" value={form.middle_name ?? ''} onChange={e => set('middle_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input className="input" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Alias / Nickname</label>
            <input className="input" value={form.alias ?? ''} onChange={e => set('alias', e.target.value)} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender ?? ''} onChange={e => set('gender', e.target.value)}>
              <option value="">Select</option>
              {GENDERS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Civil Status</label>
            <select className="input" value={form.civil_status ?? ''} onChange={e => set('civil_status', e.target.value)}>
              <option value="">Select</option>
              {CIVIL_STATUS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Birth Date</label>
            <input type="date" className="input" value={form.birth_date ?? ''} onChange={e => set('birth_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Birth Place</label>
            <input className="input" value={form.birth_place ?? ''} onChange={e => set('birth_place', e.target.value)} />
          </div>
          <div>
            <label className="label">Purok</label>
            <select className="input" value={form.purok ?? ''} onChange={e => set('purok', e.target.value)}>
              <option value="">Select</option>
              {PUROKS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Religion</label>
            <input className="input" value={form.religion ?? ''} onChange={e => set('religion', e.target.value)} />
          </div>
          <div>
            <label className="label">Primary Contact</label>
            <input className="input" value={form.primary_contact ?? ''} onChange={e => set('primary_contact', e.target.value)} />
          </div>
          <div>
            <label className="label">Secondary Contact</label>
            <input className="input" value={form.secondary_contact ?? ''} onChange={e => set('secondary_contact', e.target.value)} />
          </div>
          <div>
            <label className="label">Primary Email</label>
            <input type="email" className="input" value={form.primary_email ?? ''} onChange={e => set('primary_email', e.target.value)} />
          </div>
          <div>
            <label className="label">Secondary Email</label>
            <input type="email" className="input" value={form.secondary_email ?? ''} onChange={e => set('secondary_email', e.target.value)} />
          </div>
          <div>
            <label className="label">Resident Type</label>
            <select className="input" value={form.resident_type ?? ''} onChange={e => set('resident_type', e.target.value)}>
              <option value="Permanent">Permanent</option>
              <option value="Transient">Transient</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="voter" checked={form.voter_status ?? false} onChange={e => set('voter_status', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
            <label htmlFor="voter" className="text-sm text-slate-700">Registered Voter</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.first_name || !form.last_name}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
