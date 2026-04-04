'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SummonSchedule, SettlementReport, BlotterRecord } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { auditLog } from '@/lib/audit'

const SUMMON_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled']

export default function SettlementsPage() {
  const { user } = useAuth()
  const [summons, setSummons] = useState<(SummonSchedule & { blotter_records?: BlotterRecord })[]>([])
  const [blotters, setBlotters] = useState<Pick<BlotterRecord, 'id' | 'incident_type' | 'incident_location'>[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [summonModal, setSummonModal] = useState(false)
  const [settlementModal, setSettlementModal] = useState(false)
  const [selectedSummon, setSelectedSummon] = useState<SummonSchedule | null>(null)
  const [settlements, setSettlements] = useState<SettlementReport[]>([])
  const [saving, setSaving] = useState(false)
  const [summonForm, setSummonForm] = useState({ blotter_id: '', summon_date: '', summon_time: '', status: 'Scheduled' })
  const [settlementForm, setSettlementForm] = useState({ settlement_report: '', settlement_date: '' })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [s, b] = await Promise.all([
      supabase.from('summon_schedules').select('*, blotter_records(incident_type, blotter_status)').order('summon_date', { ascending: false }),
      supabase.from('blotter_records').select('id, incident_type, incident_location, date_recorded, time_recorded, blotter_status').order('created_at', { ascending: false }),
    ])
    setSummons(s.data ?? [])
    setBlotters(b.data ?? [])
    setLoading(false)
  }

  async function handleSaveSummon() {
    setSaving(true)
    await supabase.from('summon_schedules').insert(summonForm)
    const blotter = blotters.find(b => b.id === summonForm.blotter_id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Created', module: 'Settlements', target: `Summon for ${blotter?.incident_type ?? summonForm.blotter_id} on ${summonForm.summon_date}` })
    setSaving(false); setSummonModal(false); fetchAll()
  }

  async function openSettlements(s: SummonSchedule) {
    setSelectedSummon(s)
    const { data } = await supabase.from('settlement_reports').select('*').eq('summon_id', s.id)
    setSettlements(data ?? [])
    setSettlementModal(true)
  }

  async function handleSaveSettlement() {
    if (!selectedSummon) return
    setSaving(true)
    await supabase.from('settlement_reports').insert({ ...settlementForm, summon_id: selectedSummon.id })
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Created', module: 'Settlements', target: `Settlement report for summon on ${selectedSummon.summon_date}` })
    const { data } = await supabase.from('settlement_reports').select('*').eq('summon_id', selectedSummon.id)
    setSettlements(data ?? [])
    setSettlementForm({ settlement_report: '', settlement_date: '' })
    setSaving(false)
  }

  async function handleUpdateStatus(id: string, status: string) {
    const s = summons.find(x => x.id === id)
    await supabase.from('summon_schedules').update({ status }).eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Updated', module: 'Settlements', target: `Summon on ${s?.summon_date ?? id}`, changes: { status: { from: s?.status, to: status } } })
    fetchAll()
  }

  async function handleDeleteSummon(id: string) {
    if (!confirm('Delete this summon?')) return
    const s = summons.find(x => x.id === id)
    await supabase.from('summon_schedules').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'Settlements', target: `Summon on ${s?.summon_date ?? id}` })
    fetchAll()
  }

  const filtered = summons.filter(s => {
    const q = search.toLowerCase()
    return (s.blotter_records?.incident_type ?? '').toLowerCase().includes(q) || s.status.toLowerCase().includes(q)
  })

  const statusClass: Record<string, string> = {
    Scheduled: 'badge-blue', Completed: 'badge-green',
    Cancelled: 'badge-red', Rescheduled: 'badge-yellow',
  }

  const scheduled = summons.filter(s => s.status === 'Scheduled').length
  const completed = summons.filter(s => s.status === 'Completed').length

  return (
    <div className="space-y-5">
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#7c3aed 0%,#8b5cf6 50%,#a78bfa 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Settlements & Summons</h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#ede9fe' }}>Summon schedules and settlement reports</p>
            </div>
            <button onClick={() => { setSummonForm({ blotter_id: '', summon_date: '', summon_time: '', status: 'Scheduled' }); setSummonModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              <Plus size={15} /> Schedule Summon
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[{ label: `${summons.length} total` }, { label: `${scheduled} scheduled` }, { label: `${completed} completed` }].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b px-5 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by incident type or status..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Blotter / Incident</th>
                <th className="table-header">Summon Date</th>
                <th className="table-header">Time</th>
                <th className="table-header">Status</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="table-cell text-center py-10 text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="table-cell text-center py-10 text-slate-400">No summons found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-medium">{s.blotter_records?.incident_type ?? '—'}</td>
                  <td className="table-cell">{s.summon_date}</td>
                  <td className="table-cell">{s.summon_time}</td>
                  <td className="table-cell"><span className={statusClass[s.status] ?? 'badge-gray'}>{s.status}</span></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <select
                        value={s.status}
                        onChange={e => handleUpdateStatus(s.id, e.target.value)}
                        style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', backgroundColor: '#fafafa', cursor: 'pointer', color: '#374151' }}
                      >
                        {SUMMON_STATUSES.map(st => <option key={st}>{st}</option>)}
                      </select>
                      <button onClick={() => openSettlements(s)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Eye size={15} /></button>
                      <button onClick={() => handleDeleteSummon(s.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Summon Modal */}
      <Modal title="Schedule Summon" open={summonModal} onClose={() => setSummonModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="label">Blotter Record *</label>
            <select className="input" value={summonForm.blotter_id} onChange={e => setSummonForm(f => ({ ...f, blotter_id: e.target.value }))}>
              <option value="">Select blotter</option>
              {blotters.map(b => <option key={b.id} value={b.id}>{b.incident_type} — {b.incident_location}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Summon Date *</label>
            <input type="date" className="input" value={summonForm.summon_date} onChange={e => setSummonForm(f => ({ ...f, summon_date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Summon Time *</label>
            <input type="time" className="input" value={summonForm.summon_time} onChange={e => setSummonForm(f => ({ ...f, summon_time: e.target.value }))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={summonForm.status} onChange={e => setSummonForm(f => ({ ...f, status: e.target.value }))}>
              {SUMMON_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setSummonModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSaveSummon} disabled={saving || !summonForm.blotter_id || !summonForm.summon_date}>
            {saving ? 'Saving...' : 'Schedule'}
          </button>
        </div>
      </Modal>

      {/* Settlement Reports Modal */}
      <Modal title="Settlement Reports" open={settlementModal} onClose={() => setSettlementModal(false)} size="lg">
        <div className="space-y-5">
          <div className="space-y-3">
            {settlements.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No settlement reports yet</p>
            ) : settlements.map(s => (
              <div key={s.id} className="rounded-lg border p-4 text-sm">
                <p className="font-medium text-slate-700">{s.settlement_report}</p>
                {s.settlement_date && <p className="text-slate-500 mt-1 text-xs">{s.settlement_date}</p>}
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Add Settlement Report</h4>
            <div>
              <label className="label">Report</label>
              <textarea rows={3} className="input resize-none" value={settlementForm.settlement_report} onChange={e => setSettlementForm(f => ({ ...f, settlement_report: e.target.value }))} />
            </div>
            <div>
              <label className="label">Settlement Date</label>
              <input type="date" className="input" value={settlementForm.settlement_date} onChange={e => setSettlementForm(f => ({ ...f, settlement_date: e.target.value }))} />
            </div>
            <button className="btn-primary w-full" onClick={handleSaveSettlement} disabled={saving || !settlementForm.settlement_report}>
              {saving ? 'Saving...' : 'Add Report'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
