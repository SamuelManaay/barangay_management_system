'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SKEvent } from '@/types'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import { auditLog, diffChanges } from '@/lib/audit'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, CalendarDays, Users } from 'lucide-react'

const EVENT_TYPES = ['Program', 'Sports', 'Community', 'Other']
const STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled']

const statusStyle: Record<string, { bg: string; color: string }> = {
  Upcoming:  { bg: '#dbeafe', color: '#1e40af' },
  Ongoing:   { bg: '#d1fae5', color: '#065f46' },
  Completed: { bg: '#f1f5f9', color: '#475569' },
  Cancelled: { bg: '#fee2e2', color: '#991b1b' },
}

const empty = { event_name: '', event_type: 'Program', event_date: '', location: '', budget: '', status: 'Upcoming', description: '' }

type EventWithCount = SKEvent & { participant_count?: number }

export default function SKEventsPage() {
  const { user, canDo } = useAuth()
  const [events, setEvents] = useState<EventWithCount[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SKEvent | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [participantsModal, setParticipantsModal] = useState<SKEvent | null>(null)
  const [participants, setParticipants] = useState<{ id: string; name: string; attended: boolean; resident_id: string | null }[]>([])
  const [allResidents, setAllResidents] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [participantSearch, setParticipantSearch] = useState('')
  const [manualName, setManualName] = useState('')
  const [addMode, setAddMode] = useState<'search' | 'manual'>('search')
  const [residentDropdown, setResidentDropdown] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data } = await supabase.from('sk_events').select('*, sk_event_participants(id)').order('event_date', { ascending: false })
    setEvents((data ?? []).map((e: SKEvent & { sk_event_participants: { id: string }[] }) => ({ ...e, participant_count: e.sk_event_participants?.length ?? 0 })))
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(empty); setModalOpen(true) }
  function openEdit(e: SKEvent) {
    setEditing(e)
    setForm({ event_name: e.event_name, event_type: e.event_type, event_date: e.event_date ?? '', location: e.location ?? '', budget: String(e.budget), status: e.status, description: e.description ?? '' })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, budget: parseFloat(form.budget) || 0 }
    const by = user?.full_name ?? 'Unknown'
    if (editing) {
      await supabase.from('sk_events').update(payload).eq('id', editing.id)
      const changes = diffChanges(
        editing as unknown as Record<string, unknown>,
        payload as unknown as Record<string, unknown>,
        ['event_name', 'event_type', 'event_date', 'location', 'budget', 'status', 'description']
      )
      if (Object.keys(changes).length > 0)
        await auditLog({ performedBy: by, action: 'Updated', module: 'SK Events', target: editing.event_name, changes })
    } else {
      await supabase.from('sk_events').insert(payload)
      await auditLog({ performedBy: by, action: 'Created', module: 'SK Events', target: form.event_name })
    }
    setSaving(false); setModalOpen(false); fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return
    const target = events.find(e => e.id === id)
    await supabase.from('sk_events').delete().eq('id', id)
    await auditLog({ performedBy: user?.full_name ?? 'Unknown', action: 'Deleted', module: 'SK Events', target: target?.event_name ?? id })
    fetchAll()
  }

  async function openParticipants(e: SKEvent) {
    setParticipantsModal(e)
    setParticipantSearch('')
    setManualName('')
    setAddMode('search')
    setResidentDropdown(false)
    const [pRes, rRes] = await Promise.all([
      supabase.from('sk_event_participants').select('id, name, attended, resident_id').eq('event_id', e.id),
      supabase.from('residents').select('id, first_name, last_name').order('last_name'),
    ])
    setParticipants(pRes.data ?? [])
    setAllResidents(rRes.data ?? [])
  }

  async function addResidentParticipant(resident: { id: string; first_name: string; last_name: string }) {
    if (!participantsModal) return
    const alreadyAdded = participants.some(p => p.resident_id === resident.id)
    if (alreadyAdded) return
    const name = `${resident.first_name} ${resident.last_name}`
    await supabase.from('sk_event_participants').insert({ event_id: participantsModal.id, name, resident_id: resident.id })
    setParticipantSearch('')
    setResidentDropdown(false)
    const { data } = await supabase.from('sk_event_participants').select('id, name, attended, resident_id').eq('event_id', participantsModal.id)
    setParticipants(data ?? [])
    fetchAll()
  }

  async function addManualParticipant() {
    if (!manualName.trim() || !participantsModal) return
    await supabase.from('sk_event_participants').insert({ event_id: participantsModal.id, name: manualName.trim(), resident_id: null })
    setManualName('')
    const { data } = await supabase.from('sk_event_participants').select('id, name, attended, resident_id').eq('event_id', participantsModal.id)
    setParticipants(data ?? [])
    fetchAll()
  }

  async function toggleAttendance(id: string, attended: boolean) {
    await supabase.from('sk_event_participants').update({ attended: !attended }).eq('id', id)
    setParticipants(p => p.map(x => x.id === id ? { ...x, attended: !attended } : x))
  }

  async function removeParticipant(id: string) {
    await supabase.from('sk_event_participants').delete().eq('id', id)
    setParticipants(p => p.filter(x => x.id !== id))
    fetchAll()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const filtered = events.filter(e => e.event_name.toLowerCase().includes(search.toLowerCase()) || (e.location ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#065f46,#059669,#10b981)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <CalendarDays size={20} />
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Programs & Events</h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>SK activities, sports tournaments, and community programs</p>
          </div>
          {canDo('sk_events', 'can_add') && (
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={15} /> Add Event
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search events..." />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>{['Event Name', 'Type', 'Date', 'Location', 'Budget', 'Participants', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="table-cell" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No events found</td></tr>
              ) : filtered.map(e => {
                const s = statusStyle[e.status] ?? { bg: '#f1f5f9', color: '#475569' }
                return (
                  <tr key={e.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td className="table-cell" style={{ fontWeight: 600 }}>{e.event_name}</td>
                    <td className="table-cell"><span className="badge-blue">{e.event_type}</span></td>
                    <td className="table-cell" style={{ color: '#64748b' }}>{e.event_date ?? '—'}</td>
                    <td className="table-cell" style={{ color: '#64748b' }}>{e.location ?? '—'}</td>
                    <td className="table-cell">₱{Number(e.budget).toLocaleString()}</td>
                    <td className="table-cell">
                      <button onClick={() => openParticipants(e)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Users size={13} />{e.participant_count ?? 0}
                      </button>
                    </td>
                    <td className="table-cell">
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: s.bg, color: s.color }}>{e.status}</span>
                    </td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canDo('sk_events', 'can_update') && <button onClick={() => openEdit(e)} className="rounded p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>}
                        {canDo('sk_events', 'can_delete') && <button onClick={() => handleDelete(e.id)} className="rounded p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      <Modal title={editing ? 'Edit Event' : 'Add Event'} open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Event Name *</label>
            <input className="input" value={form.event_name} onChange={e => set('event_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.event_type} onChange={e => set('event_type', e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Budget (₱)</label>
            <input type="number" className="input" value={form.budget} onChange={e => set('budget', e.target.value)} min="0" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={e => set('location', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.event_name}>{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
        </div>
      </Modal>

      {/* Participants Modal */}
      <Modal title={`Participants — ${participantsModal?.event_name ?? ''}`} open={!!participantsModal} onClose={() => setParticipantsModal(null)} size="lg">
        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '0.25rem', backgroundColor: '#f8fafc', borderRadius: '0.625rem', border: '1px solid #f1f5f9' }}>
          {(['search', 'manual'] as const).map(mode => (
            <button key={mode} onClick={() => setAddMode(mode)} style={{ flex: 1, padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', backgroundColor: addMode === mode ? '#fff' : 'transparent', color: addMode === mode ? '#059669' : '#94a3b8', boxShadow: addMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
              {mode === 'search' ? '🔍 Search Residents' : '✏️ Add Non-Resident'}
            </button>
          ))}
        </div>

        {/* Search residents */}
        {addMode === 'search' && (
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
              className="input"
              value={participantSearch}
              onChange={e => { setParticipantSearch(e.target.value); setResidentDropdown(true) }}
              onFocus={() => setResidentDropdown(true)}
              placeholder="Type name to search residents..."
              autoComplete="off"
            />
            {residentDropdown && participantSearch.trim().length > 0 && (() => {
              const q = participantSearch.toLowerCase()
              const results = allResidents.filter(r =>
                `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) &&
                !participants.some(p => p.resident_id === r.id)
              ).slice(0, 8)
              return (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.625rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', marginTop: '0.25rem', overflow: 'hidden' }}>
                  {results.length === 0 ? (
                    <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>No matching residents found</div>
                  ) : results.map(r => (
                    <button key={r.id} onClick={() => addResidentParticipant(r)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%', padding: '0.625rem 1rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {r.first_name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500, color: '#1e293b' }}>{r.last_name}, {r.first_name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#94a3b8' }}>Resident</span>
                    </button>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* Manual add */}
        {addMode === 'manual' && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input className="input" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Enter full name" onKeyDown={e => e.key === 'Enter' && addManualParticipant()} />
            <button className="btn-primary" onClick={addManualParticipant} disabled={!manualName.trim()} style={{ whiteSpace: 'nowrap' }}><Plus size={14} /> Add</button>
          </div>
        )}

        {/* Participant count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
            {participants.length} participant{participants.length !== 1 ? 's' : ''} &nbsp;·&nbsp; {participants.filter(p => p.attended).length} attended
          </span>
        </div>

        {/* Participant list */}
        {participants.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', padding: '1.5rem 0' }}>No participants yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '280px', overflowY: 'auto' }}>
            {participants.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', backgroundColor: p.attended ? '#f0fdf4' : '#f8fafc', border: `1px solid ${p.attended ? '#bbf7d0' : '#f1f5f9'}` }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', flex: 1 }}>
                  <input type="checkbox" checked={p.attended} onChange={() => toggleAttendance(p.id, p.attended)} className="h-4 w-4 rounded border-slate-300" />
                  <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: p.resident_id ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#94a3b8,#64748b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>{p.name}</span>
                    {p.resident_id
                      ? <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: '#d1fae5', color: '#065f46' }}>Resident</span>
                      : <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#64748b' }}>Guest</span>
                    }
                    {p.attended && <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: '#d1fae5', color: '#065f46' }}>✓ Attended</span>}
                  </div>
                </label>
                <button onClick={() => removeParticipant(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '0.25rem', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={() => { setParticipantsModal(null); setResidentDropdown(false) }}>Close</button>
        </div>
      </Modal>
    </div>
  )
}
