'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SKProject } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { auditLog, diffChanges } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react'

const STATUSES = ['Planned', 'Ongoing', 'Completed']

const statusStyle: Record<string, { bg: string; color: string }> = {
  Planned:   { bg: '#fef3c7', color: '#92400e' },
  Ongoing:   { bg: '#d1fae5', color: '#065f46' },
  Completed: { bg: '#f1f5f9', color: '#475569' },
}

const empty = { project_name: '', description: '', budget_allocation: '', amount_spent: '', status: 'Planned', start_date: '', end_date: '' }

export default function SKProjectsPage() {
  const { user, canDo } = useAuth()
  const [projects, setProjects] = useState<SKProject[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SKProject | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data } = await supabase.from('sk_projects').select('*').order('created_at', { ascending: false })
    setProjects(data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(p: SKProject) {
    setEditing(p)
    setForm({ project_name: p.project_name, description: p.description ?? '', budget_allocation: String(p.budget_allocation), amount_spent: String(p.amount_spent), status: p.status, start_date: p.start_date ?? '', end_date: p.end_date ?? '' })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, budget_allocation: parseFloat(form.budget_allocation) || 0, amount_spent: parseFloat(form.amount_spent) || 0 }
    const by = user?.full_name ?? 'Unknown'
    if (editing) {
      await supabase.from('sk_projects').update(payload).eq('id', editing.id)
      const changes = diffChanges(
        editing as unknown as Record<string, unknown>,
        payload as unknown as Record<string, unknown>,
        ['project_name', 'description', 'budget_allocation', 'amount_spent', 'status', 'start_date', 'end_date']
      )
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: by, action: 'Updated', module: 'SK Projects', target: editing.project_name, changes })
    } else {
      await supabase.from('sk_projects').insert(payload)
      await auditLog({ performedBy: by, action: 'Created', module: 'SK Projects', target: form.project_name })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project?')) return
    const target = projects.find(p => p.id === id)
    await supabase.from('sk_projects').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'SK Projects', target: target?.project_name ?? id })
    fetchAll()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const filtered = projects.filter(p => p.project_name.toLowerCase().includes(search.toLowerCase()))

  const totalBudget = projects.reduce((s, p) => s + p.budget_allocation, 0)
  const totalSpent = projects.reduce((s, p) => s + p.amount_spent, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#065f46,#059669,#10b981)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <FolderKanban size={20} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>SK Projects</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>Track project status and budget</p>
          </div>
          {canDo('sk_projects', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Add Project
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[
            { icon: '📋', label: `${projects.filter(p => p.status === 'Ongoing').length} ongoing` },
            { icon: '💰', label: `₱${totalBudget.toLocaleString()} allocated` },
            { icon: '💸', label: `₱${totalSpent.toLocaleString()} spent` },
          ].map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
              <span>{b.icon}</span><span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Project Name', 'Description', 'Budget', 'Spent', 'Progress', 'Status', 'Timeline', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No projects found</td></tr>
              ) : filtered.map(p => {
                const s = statusStyle[p.status] ?? { bg: '#f1f5f9', color: '#475569' }
                const pct = p.budget_allocation > 0 ? Math.min(100, Math.round((p.amount_spent / p.budget_allocation) * 100)) : 0
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td className="table-cell" style={{ fontWeight: 600 }}>{p.project_name}</td>
                    <td className="table-cell" style={{ color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description ?? '—'}</td>
                    <td className="table-cell">₱{Number(p.budget_allocation).toLocaleString()}</td>
                    <td className="table-cell">₱{Number(p.amount_spent).toLocaleString()}</td>
                    <td className="table-cell" style={{ minWidth: '100px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '9999px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: '9999px', background: pct > 90 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#10b981,#059669)' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>{pct}%</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: s.bg, color: s.color }}>{p.status}</span>
                    </td>
                    <td className="table-cell" style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {p.start_date && p.end_date ? `${p.start_date} – ${p.end_date}` : p.start_date ?? '—'}
                    </td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canDo('sk_projects', 'can_update') && <button onClick={() => openEdit(p)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                        {canDo('sk_projects', 'can_delete') && <button onClick={() => handleDelete(p.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Project' : 'Add Project'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Project Name *</label>
            <input className="input" value={form.project_name} onChange={e => set('project_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Budget Allocation (₱)</label>
            <input type="number" className="input" value={form.budget_allocation} onChange={e => set('budget_allocation', e.target.value)} min="0" />
          </div>
          <div>
            <label className="label">Amount Spent (₱)</label>
            <input type="number" className="input" value={form.amount_spent} onChange={e => set('amount_spent', e.target.value)} min="0" />
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
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.project_name}>{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  )
}
