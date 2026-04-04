'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CertificateIssuance, CertificateType, Resident } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { Plus, Printer, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { auditLog } from '@/lib/audit'

export default function CertificatesPage() {
  const { user } = useAuth()
  const [issuances, setIssuances] = useState<CertificateIssuance[]>([])
  const [certTypes, setCertTypes] = useState<CertificateType[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [captainName, setCaptainName] = useState('')
  const [captainPosition, setCaptainPosition] = useState('')
  const [form, setForm] = useState({
    resident_id: '', certificate_type_id: '', purpose: '',
    cedula_number: '', or_number: '', signed_by_name: '', signed_by_position: '',
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [iss, types, res, captain] = await Promise.all([
      supabase.from('certificate_issuances').select('*, residents(first_name, last_name), certificate_types(name)').order('issued_at', { ascending: false }),
      supabase.from('certificate_types').select('*').order('name'),
      supabase.from('residents').select('id, first_name, last_name').order('last_name'),
      supabase.from('barangay_officials')
        .select('residents(first_name, last_name), position')
        .eq('position', 'Barangay Captain')
        .eq('status', 'Active')
        .limit(1)
        .single(),
    ])
    setIssuances(iss.data ?? [])
    setCertTypes(types.data ?? [])
    setResidents(res.data ?? [])
    if (captain.data?.residents) {
      const r = captain.data.residents as { first_name: string; last_name: string }
      setCaptainName(`${r.first_name} ${r.last_name}`)
      setCaptainPosition(captain.data.position)
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('certificate_issuances').insert(form)
    const res = residents.find(r => r.id === form.resident_id)
    const type = certTypes.find(t => t.id === form.certificate_type_id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Created', module: 'Certificates', target: `${type?.name ?? 'Certificate'} for ${res ? `${res.first_name} ${res.last_name}` : 'Unknown'}` })
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this issuance record?')) return
    const iss = issuances.find(i => i.id === id)
    await supabase.from('certificate_issuances').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Certificates', target: `${iss?.certificate_types?.name ?? 'Certificate'} for ${iss?.residents ? `${iss.residents.first_name} ${iss.residents.last_name}` : 'Unknown'}` })
    fetchAll()
  }

  const filtered = issuances.filter(i => {
    const q = search.toLowerCase()
    const name = `${i.residents?.first_name} ${i.residents?.last_name}`.toLowerCase()
    return name.includes(q) || (i.certificate_types?.name ?? '').toLowerCase().includes(q)
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-5">
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#047857 0%,#10b981 50%,#34d399 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Certificates</h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>Certificate issuance records</p>
            </div>
            <button onClick={() => { setForm({ resident_id: '', certificate_type_id: '', purpose: '', cedula_number: '', or_number: '', signed_by_name: captainName, signed_by_position: captainPosition }); setModalOpen(true) }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              <Plus size={15} /> Issue Certificate
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              <span>{issuances.length} total issued</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b px-5 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by resident or certificate type..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Resident</th>
                <th className="table-header">Certificate Type</th>
                <th className="table-header">Purpose</th>
                <th className="table-header">OR Number</th>
                <th className="table-header">Issued At</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="table-cell text-center py-10 text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center py-10 text-slate-400">No records found</td></tr>
              ) : filtered.map(i => (
                <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-medium">{i.residents?.last_name}, {i.residents?.first_name}</td>
                  <td className="table-cell"><span className="badge-blue">{i.certificate_types?.name}</span></td>
                  <td className="table-cell">{i.purpose ?? '—'}</td>
                  <td className="table-cell">{i.or_number ?? '—'}</td>
                  <td className="table-cell">{i.issued_at ? new Date(i.issued_at).toLocaleDateString() : '—'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => window.open(`/certificates/print?id=${i.id}`, '_blank')} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Printer size={15} /></button>
                      <button onClick={() => handleDelete(i.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title="Issue Certificate" open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Resident *</label>
            <select className="input" value={form.resident_id} onChange={e => set('resident_id', e.target.value)}>
              <option value="">Select resident</option>
              {residents.map(r => <option key={r.id} value={r.id}>{r.last_name}, {r.first_name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Certificate Type *</label>
            <select className="input" value={form.certificate_type_id} onChange={e => set('certificate_type_id', e.target.value)}>
              <option value="">Select type</option>
              {certTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Purpose</label>
            <input className="input" value={form.purpose} onChange={e => set('purpose', e.target.value)} />
          </div>
          <div>
            <label className="label">Cedula Number</label>
            <input className="input" value={form.cedula_number} onChange={e => set('cedula_number', e.target.value)} />
          </div>
          <div>
            <label className="label">OR Number</label>
            <input className="input" value={form.or_number} onChange={e => set('or_number', e.target.value)} />
          </div>
          <div>
            <label className="label">Signed By (Name)</label>
            <input className="input" value={form.signed_by_name} onChange={e => set('signed_by_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Signed By (Position)</label>
            <input className="input" value={form.signed_by_position} onChange={e => set('signed_by_position', e.target.value)} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.resident_id || !form.certificate_type_id}>
            {saving ? 'Saving...' : 'Issue'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
