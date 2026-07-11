'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SKFinance } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { auditLog, diffChanges } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown } from 'lucide-react'

const CATEGORIES = ['BSYF', 'BSEF', 'Donation', 'LGU Allocation', 'Sports', 'Scholarship', 'Community Program', 'Administrative', 'Other']
const TYPES = ['Income', 'Expense']

const empty = { transaction_type: 'Income', fund_source: '', category: '', amount: '', transaction_date: new Date().toISOString().split('T')[0], remarks: '' }

export default function SKFinancesPage() {
  const { user, canDo } = useAuth()
  const [records, setRecords] = useState<SKFinance[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SKFinance | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data } = await supabase.from('sk_finances').select('*').order('transaction_date', { ascending: false })
    setRecords(data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(r: SKFinance) {
    setEditing(r)
    setForm({ transaction_type: r.transaction_type, fund_source: r.fund_source ?? '', category: r.category ?? '', amount: String(r.amount), transaction_date: r.transaction_date, remarks: r.remarks ?? '' })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, amount: parseFloat(form.amount) || 0 }
    const by = user?.full_name ?? 'Unknown'
    const target = `${payload.transaction_type} — ${payload.fund_source || payload.category || '₱' + payload.amount}`
    if (editing) {
      await supabase.from('sk_finances').update(payload).eq('id', editing.id)
      const changes = diffChanges(
        editing as unknown as Record<string, unknown>,
        payload as unknown as Record<string, unknown>,
        ['transaction_type', 'fund_source', 'category', 'amount', 'transaction_date', 'remarks']
      )
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: by, action: 'Updated', module: 'SK Finances', target, changes })
    } else {
      await supabase.from('sk_finances').insert(payload)
      await auditLog({ performedBy: by, action: 'Created', module: 'SK Finances', target })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this record?')) return
    const target = records.find(r => r.id === id)
    const label = target ? `${target.transaction_type} — ₱${target.amount}` : id
    await supabase.from('sk_finances').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'SK Finances', target: label })
    fetchAll()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    return (r.fund_source ?? '').toLowerCase().includes(q) || (r.category ?? '').toLowerCase().includes(q) || (r.remarks ?? '').toLowerCase().includes(q)
  })

  const totalIncome = records.filter(r => r.transaction_type === 'Income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = records.filter(r => r.transaction_type === 'Expense').reduce((s, r) => s + r.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#065f46,#059669,#10b981)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Wallet size={20} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Financial Records</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>SK budget tracking and fund management</p>
          </div>
          {canDo('sk_finance', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Add Record
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Income', value: totalIncome, icon: TrendingUp, gradient: 'linear-gradient(135deg,#10b981,#059669)', shadow: 'rgba(16,185,129,0.3)' },
          { label: 'Total Expenses', value: totalExpense, icon: TrendingDown, gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', shadow: 'rgba(239,68,68,0.3)' },
          { label: 'Balance', value: balance, icon: Wallet, gradient: balance >= 0 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#ef4444,#dc2626)', shadow: 'rgba(99,102,241,0.3)' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${card.shadow}` }}>
                  <Icon size={18} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>₱{loading ? '—' : card.value.toLocaleString()}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{card.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by source, category, or remarks..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Date', 'Type', 'Fund Source', 'Category', 'Amount', 'Remarks', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No records found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid #f8fafc' }}>
                  <td className="table-cell" style={{ color: '#64748b' }}>{r.transaction_date}</td>
                  <td className="table-cell">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: r.transaction_type === 'Income' ? '#d1fae5' : '#fee2e2', color: r.transaction_type === 'Income' ? '#065f46' : '#991b1b' }}>
                      {r.transaction_type === 'Income' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {r.transaction_type}
                    </span>
                  </td>
                  <td className="table-cell">{r.fund_source ?? '—'}</td>
                  <td className="table-cell"><span className="badge-blue">{r.category ?? '—'}</span></td>
                  <td className="table-cell" style={{ fontWeight: 700, color: r.transaction_type === 'Income' ? '#059669' : '#dc2626' }}>
                    {r.transaction_type === 'Expense' ? '-' : '+'}₱{Number(r.amount).toLocaleString()}
                  </td>
                  <td className="table-cell" style={{ color: '#64748b' }}>{r.remarks ?? '—'}</td>
                  <td className="table-cell">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {canDo('sk_finance', 'can_update') && <button onClick={() => openEdit(r)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                      {canDo('sk_finance', 'can_delete') && <button onClick={() => handleDelete(r.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editing ? 'Edit Record' : 'Add Financial Record'} open={modalOpen} onClose={() => setModalOpen(false)} size="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.transaction_type} onChange={e => set('transaction_type', e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (₱) *</label>
            <input type="number" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} min="0" />
          </div>
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={form.transaction_date} onChange={e => set('transaction_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Fund Source</label>
            <input className="input" value={form.fund_source} onChange={e => set('fund_source', e.target.value)} placeholder="e.g. BSYF, LGU, Donation" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Remarks</label>
            <textarea className="input" rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.amount || !form.transaction_date}>{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  )
}
