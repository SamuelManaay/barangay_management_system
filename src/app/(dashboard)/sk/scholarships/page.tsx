'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SKScholarship, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { auditLog, diffChanges } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react'

const STATUSES = ['Active', 'Completed', 'Revoked']

const statusStyle: Record<string, { bg: string; color: string }> = {
  Active:    { bg: '#d1fae5', color: '#065f46' },
  Completed: { bg: '#dbeafe', color: '#1e40af' },
  Revoked:   { bg: '#fee2e2', color: '#991b1b' },
}

const empty = { resident_id: '', scholarship_name: '', school: '', year_level: '', amount: '', status: 'Active', start_date: '', end_date: '' }

type ScholarRow = SKScholarship & { residents: Resident }

export default function SKScholarshipsPage() {
  const { user, canDo } = useAuth()
  const [scholars, setScholars] = useState<ScholarRow[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SKScholarship | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [sch, res] = await Promise.all([
      supabase.from('sk_scholarships').select('*, residents(first_name, last_name, birth_date, purok)').order('created_at', { ascending: false }),
      supabase.from('residents').select('id, first_name, last_name').order('last_name'),
    ])
    setScholars(sch.data ?? [])
    setResidents(res.data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(s: SKScholarship) {
    setEditing(s)
    setForm({ resident_id: s.resident_id, scholarship_name: s.scholarship_name, school: s.school ?? '', year_level: s.year_level ?? '', amount: String(s.amount), status: s.status, start_date: s.start_date ?? '', end_date: s.end_date ?? '' })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, amount: parseFloat(form.amount) || 0 }
    const by = user?.full_name ?? 'Unknown'
    if (editing) {
      await supabase.from('sk_scholarships').update(payload).eq('id', editing.id)
      const changes = diffChanges(
        editing as unknown as Record<string, unknown>,
        payload as unknown as Record<string, unknown>,
        ['scholarship_name', 'school', 'year_level', 'amount', 'status', 'start_date', 'end_date']
      )
      const scholar = scholars.find(s => s.id === editing.id)
      const name = scholar?.residents ? `${scholar.residents.first_name} ${scholar.residents.last_name}` : editing.scholarship_name
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: by, action: 'Updated', module: 'SK Scholarships', target: name, changes })
    } else {
      await supabase.from('sk_scholarships').insert(payload)
      const res = residents.find(r => r.id === form.resident_id)
      const name = res ? `${res.first_name} ${res.last_name} — ${form.scholarship_name}` : form.scholarship_name
      await auditLog({ performedBy: by, action: 'Created', module: 'SK Scholarships', target: name })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this scholarship record?')) return
    const target = scholars.find(s => s.id === id)
    const name = target?.residents
      ? `${target.residents.first_name} ${target.residents.last_name} — ${target.scholarship_name}`
      : target?.scholarship_name ?? id
    await supabase.from('sk_scholarships').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'SK Scholarships', target: name })
    fetchAll()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const filtered = scholars.filter(s => {
    const q = search.toLowerCase()
    const r = s.residents
    return (r ? `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) : false) ||
      s.scholarship_name.toLowerCase().includes(q) ||
      (s.school ?? '').toLowerCase().includes(q)
  })

  const active = scholars.filter(s => s.status === 'Active').length
  const totalAmount = scholars.filter(s => s.status === 'Active').reduce((sum, s) => sum + s.amount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#065f46,#059669,#10b981)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <GraduationCap size={20} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Scholarships</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>SK scholarship tracking and management</p>
          </div>
          {canDo('sk_scholarships', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Add Scholarship
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[{ icon: '🎓', label: `${active} active scholars` }, { icon: '💰', label: `₱${totalAmount.toLocaleString()} total grants` }].map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              <span>{b.icon}</span><span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, scholarship, or school..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Scholar', 'Scholarship', 'School', 'Year Level', 'Amount', 'Period', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No scholarships found</td></tr>
              ) : filtered.map(s => {
                const st = statusStyle[s.status] ?? { bg: '#f1f5f9', color: '#475569' }
                return (
                  <tr key={s.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td className="table-cell" style={{ fontWeight: 600 }}>
                      {s.residents ? `${s.residents.last_name}, ${s.residents.first_name}` : '—'}
                    </td>
                    <td className="table-cell">{s.scholarship_name}</td>
                    <td className="table-cell" style={{ color: '#64748b' }}>{s.school ?? '—'}</td>
                    <td className="table-cell" style={{ color: '#64748b' }}>{s.year_level ?? '—'}</td>
                    <td className="table-cell" style={{ fontWeight: 600, color: '#059669' }}>₱{Number(s.amount).toLocaleString()}</td>
                    <td className="table-cell" style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {s.start_date && s.end_date ? `${s.start_date} – ${s.end_date}` : s.start_date ?? '—'}
                    </td>
                    <td className="table-cell">
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: st.bg, color: st.color }}>{s.status}</span>
                    </td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canDo('sk_scholarships', 'can_update') && <button onClick={() => openEdit(s)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                        {canDo('sk_scholarships', 'can_delete') && <button onClick={() => handleDelete(s.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Scholarship' : 'Add Scholarship'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Resident *</label>
            <select className="input" value={form.resident_id} onChange={e => set('resident_id', e.target.value)}>
              <option value="">Select resident</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Scholarship Name *</label>
            <input className="input" value={form.scholarship_name} onChange={e => set('scholarship_name', e.target.value)} />
          </div>
          <div>
            <label className="label">School</label>
            <input className="input" value={form.school} onChange={e => set('school', e.target.value)} />
          </div>
          <div>
            <label className="label">Year Level</label>
            <input className="input" value={form.year_level} onChange={e => set('year_level', e.target.value)} placeholder="e.g. 2nd Year College" />
          </div>
          <div>
            <label className="label">Amount (₱)</label>
            <input type="number" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} min="0" />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
          </div>
          <div>
            <label className="label">End Date</label>
            <input type="date" className="input" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.resident_id || !form.scholarship_name}>{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  )
}
