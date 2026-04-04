'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { BusinessPermit, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { Plus, Pencil, Trash2, Printer } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { auditLog, diffChanges } from '@/lib/audit'

const STATUSES = ['Active', 'Expired', 'Revoked', 'Pending']
const emptyForm = { business_name: '', owner_name: '', owner_resident_id: '', business_type: '', address: '', permit_date: '', expiry_date: '', status: 'Active' }

export default function BusinessPage() {
  const { user } = useAuth()
  const [permits, setPermits] = useState<BusinessPermit[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BusinessPermit | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    // Auto-expire permits where expiry_date < today and status is still Active/Pending
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('business_permits')
      .update({ status: 'Expired' })
      .lt('expiry_date', today)
      .in('status', ['Active', 'Pending'])
    const [p, r] = await Promise.all([
      supabase.from('business_permits').select('*').order('created_at', { ascending: false }),
      supabase.from('residents').select('id, first_name, last_name').order('last_name'),
    ])
    setPermits(p.data ?? [])
    setResidents(r.data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  function openEdit(p: BusinessPermit) {
    setEditing(p)
    setForm({ business_name: p.business_name, owner_name: p.owner_name, owner_resident_id: p.owner_resident_id ?? '', business_type: p.business_type ?? '', address: p.address ?? '', permit_date: p.permit_date ?? '', expiry_date: p.expiry_date ?? '', status: p.status })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, owner_resident_id: form.owner_resident_id || null }
    if (editing) {
      await supabase.from('business_permits').update(payload).eq('id', editing.id)
      const changes = diffChanges(
        editing as unknown as Record<string, unknown>,
        payload as unknown as Record<string, unknown>,
        ['business_name','owner_name','business_type','address','permit_date','expiry_date','status']
      )
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Updated', module: 'Business Permits', target: editing.business_name, changes })
    } else {
      await supabase.from('business_permits').insert(payload)
      await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Created', module: 'Business Permits', target: payload.business_name })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this permit?')) return
    const permit = permits.find(p => p.id === id)
    await supabase.from('business_permits').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Business Permits', target: permit?.business_name ?? id })
    fetchAll()
  }

  const filtered = permits.filter(p => {
    const q = search.toLowerCase()
    return p.business_name.toLowerCase().includes(q) || p.owner_name.toLowerCase().includes(q)
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const statusClass: Record<string, string> = {
    Active: 'badge-green', Expired: 'badge-red', Revoked: 'badge-gray', Pending: 'badge-yellow',
  }

  const activeCount = permits.filter(p => p.status === 'Active').length
  const expiredCount = permits.filter(p => p.status === 'Expired').length

  return (
    <div className="space-y-5">
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#b45309 0%,#f59e0b 50%,#fbbf24 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Business Permits</h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#fef3c7' }}>Registered business permits</p>
            </div>
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              <Plus size={15} /> Add Permit
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[{ label: `${permits.length} total` }, { label: `${activeCount} active` }, { label: `${expiredCount} expired` }].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b px-5 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by business or owner name..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Business Name</th>
                <th className="table-header">Owner</th>
                <th className="table-header">Type</th>
                <th className="table-header">Permit Date</th>
                <th className="table-header">Expiry Date</th>
                <th className="table-header">Status</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="table-cell text-center py-10 text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center py-10 text-slate-400">No permits found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-medium">{p.business_name}</td>
                  <td className="table-cell">{p.owner_name}</td>
                  <td className="table-cell">{p.business_type ?? '—'}</td>
                  <td className="table-cell">{p.permit_date ?? '—'}</td>
                  <td className="table-cell">{p.expiry_date ?? '—'}</td>
                  <td className="table-cell"><span className={statusClass[p.status] ?? 'badge-gray'}>{p.status}</span></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => window.open(`/business/print?id=${p.id}`, '_blank')} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors"><Printer size={15} /></button>
                      <button onClick={() => openEdit(p)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Permit' : 'Add Business Permit'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Business Name *</label>
            <input className="input" value={form.business_name} onChange={e => set('business_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Owner Name *</label>
            <input className="input" value={form.owner_name} onChange={e => set('owner_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Link to Resident (optional)</label>
            <select className="input" value={form.owner_resident_id} onChange={e => {
              const r = residents.find(x => x.id === e.target.value)
              setForm(f => ({ ...f, owner_resident_id: e.target.value, owner_name: r ? `${r.first_name} ${r.last_name}` : f.owner_name }))
            }}>
              <option value="">— None —</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Business Type</label>
            <input className="input" value={form.business_type} onChange={e => set('business_type', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <label className="label">Permit Date</label>
            <input type="date" className="input" value={form.permit_date} onChange={e => set('permit_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Expiry Date</label>
            <input type="date" className="input" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.business_name || !form.owner_name}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
