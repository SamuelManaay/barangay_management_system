'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { ClipboardList, ChevronDown, ChevronUp, Search, RefreshCw, Copy, Check, Download } from 'lucide-react'

type AuditLog = {
  id: string
  performed_by: string
  action: string
  module: string
  target: string
  changes: Record<string, { from: unknown; to: unknown }> | null
  created_at: string
}

const actionStyle: Record<string, { bg: string; color: string; dot: string }> = {
  Created:     { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  Updated:     { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  Deleted:     { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  Activated:   { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  Deactivated: { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
}

const moduleColor: Record<string, string> = {
  Residents: '#6366f1', Blotter: '#ef4444', Certificates: '#10b981',
  Settlements: '#f59e0b', Officials: '#3b82f6', Business: '#ec4899',
  'User Management': '#7c3aed', 'SK Officials': '#059669', 'SK Youth': '#059669',
  'SK Events': '#059669', 'SK Projects': '#059669', 'SK Finances': '#059669',
  'SK Scholarships': '#059669',
}

function fmt(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    relative: (() => {
      const diff = Date.now() - d.getTime()
      const m = Math.floor(diff / 60000)
      if (m < 1) return 'just now'
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      return `${Math.floor(h / 24)}d ago`
    })(),
  }
}

function shortId(id: string) { return id.slice(0, 8).toUpperCase() }

export default function AuditLogsPage() {
  const { can, hasModule, loading: authLoading } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterModule, setFilterModule] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [csvModal, setCsvModal] = useState(false)
  const [csvFrom, setCsvFrom] = useState('')
  const [csvTo, setCsvTo] = useState('')
  const [csvDownloading, setCsvDownloading] = useState(false)

  useEffect(() => {
    if (!authLoading && !can('view:admin') && !hasModule('audit_logs')) router.replace('/dashboard')
  }, [authLoading, can, hasModule, router])

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('id,performed_by,action,module,target,changes,created_at')
      .order('created_at', { ascending: false })
      .limit(500)
    setLogs(data ?? [])
    setLoading(false)
  }

  function escCsv(v: string) {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`
    return v
  }

  function buildCsv(rows: AuditLog[]) {
    const headers = ['Log ID', 'Date', 'Time', 'Performed By', 'Action', 'Module', 'Target', 'Fields Changed', 'Changes Detail']
    const lines = rows.map(l => {
      const d = new Date(l.created_at)
      const date = d.toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' })
      const time = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const changeCount = l.changes ? Object.keys(l.changes).length : 0
      const changeDetail = l.changes
        ? Object.entries(l.changes).map(([f, { from, to }]) => `${f}: ${JSON.stringify(from)} → ${JSON.stringify(to)}`).join(' | ')
        : ''
      return [l.id, date, time, l.performed_by, l.action, l.module, l.target, String(changeCount), changeDetail].map(escCsv).join(',')
    })
    return [headers.join(','), ...lines].join('\n')
  }

  function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  function handleDownloadFiltered() {
    const content = buildCsv(filtered)
    const label = filterModule || filterAction || search ? 'filtered' : 'all'
    downloadCsv(content, `audit-logs-${label}-${new Date().toISOString().slice(0,10)}.csv`)
  }

  async function handleDownloadDateRange() {
    if (!csvFrom || !csvTo) return
    setCsvDownloading(true)
    const from = new Date(csvFrom).toISOString()
    const to = new Date(csvTo + 'T23:59:59').toISOString()
    const { data } = await supabase
      .from('audit_logs')
      .select('id,performed_by,action,module,target,changes,created_at')
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false })
    setCsvDownloading(false)
    if (!data?.length) { alert('No records found for the selected date range.'); return }
    downloadCsv(buildCsv(data), `audit-logs-${csvFrom}-to-${csvTo}.csv`)
    setCsvModal(false)
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const modules = [...new Set(logs.map(l => l.module))].sort()
  const actions = [...new Set(logs.map(l => l.action))].sort()

  const filtered = logs.filter(l => {
    if (filterModule && l.module !== filterModule) return false
    if (filterAction && l.action !== filterAction) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        l.performed_by.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Summary counts
  const counts = { Created: 0, Updated: 0, Deleted: 0, Other: 0 }
  logs.forEach(l => {
    if (l.action in counts) counts[l.action as keyof typeof counts]++
    else counts.Other++
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#1e1b4b,#312e81)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardList size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Audit Logs</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#a5b4fc' }}>Full activity trail across all modules</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setCsvModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <Download size={14} /> Export CSV
            </button>
            <button onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Summary pills */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[
            { label: `${logs.length} total`, color: '#a5b4fc' },
            { label: `${counts.Created} created`, color: '#6ee7b7' },
            { label: `${counts.Updated} updated`, color: '#93c5fd' },
            { label: `${counts.Deleted} deleted`, color: '#fca5a5' },
          ].map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2rem', padding: '0.3rem 0.75rem', fontSize: '0.78rem', color: p.color, fontWeight: 600 }}>
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* Filters + search */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search by user, module, target, or log ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: '11rem' }} value={filterModule} onChange={e => setFilterModule(e.target.value)}>
          <option value="">All Modules</option>
          {modules.map(m => <option key={m}>{m}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: '9rem' }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">All Actions</option>
          {actions.map(a => <option key={a}>{a}</option>)}
        </select>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          {filtered.length} of {logs.length} record{logs.length !== 1 ? 's' : ''}
        </span>
        {filtered.length > 0 && (
          <button onClick={handleDownloadFiltered} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#059669', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Download size={13} /> Download {filtered.length < logs.length ? 'Filtered' : 'All'}
          </button>
        )}
      </div>

      {/* CSV Export Modal */}
      {csvModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setCsvModal(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '28rem', borderRadius: '1rem', backgroundColor: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Download size={16} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Export Audit Logs</h2>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Download as CSV by date range</p>
              </div>
            </div>
            {/* Modal body */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">From Date *</label>
                  <input type="date" className="input" value={csvFrom} onChange={e => setCsvFrom(e.target.value)} />
                </div>
                <div>
                  <label className="label">To Date *</label>
                  <input type="date" className="input" value={csvTo} onChange={e => setCsvTo(e.target.value)} />
                </div>
              </div>
              {csvFrom && csvTo && new Date(csvFrom) > new Date(csvTo) && (
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#ef4444' }}>From date must be before To date.</p>
              )}
              <div style={{ borderRadius: '0.625rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', fontSize: '0.78rem', color: '#065f46' }}>
                💡 The CSV will include: Log ID, Date, Time, Performed By, Action, Module, Target, Fields Changed, and Changes Detail.
              </div>
            </div>
            {/* Modal footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={() => setCsvModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                style={{ backgroundColor: '#059669' }}
                onClick={handleDownloadDateRange}
                disabled={!csvFrom || !csvTo || new Date(csvFrom) > new Date(csvTo) || csvDownloading}>
                {csvDownloading ? 'Fetching...' : <><Download size={14} /> Download CSV</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                {['Log ID', 'Date & Time', 'Performed By', 'Action', 'Module', 'Target', 'Details', ''].map((h, i) => (
                  <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>No logs found.</td></tr>
              ) : filtered.map(log => {
                const ac = actionStyle[log.action] ?? { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' }
                const mc = moduleColor[log.module] ?? '#64748b'
                const hasChanges = log.changes && Object.keys(log.changes).length > 0
                const isExpanded = expanded === log.id
                const t = fmt(log.created_at)
                const changeCount = hasChanges ? Object.keys(log.changes!).length : 0

                return (
                  <React.Fragment key={log.id}>
                    <tr style={{ borderTop: '1px solid #f8fafc', transition: 'background 0.1s', backgroundColor: isExpanded ? '#fafffe' : 'transparent' }}
                      onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fafafa' }}
                      onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent' }}>

                      {/* Log ID */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', backgroundColor: '#eef2ff', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', letterSpacing: '0.05em' }}>
                            #{shortId(log.id)}
                          </span>
                          <button
                            onClick={() => copyId(log.id)}
                            title="Copy full ID"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === log.id ? '#10b981' : '#cbd5e1', padding: '0.1rem', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                            onMouseEnter={e => { if (copied !== log.id) (e.currentTarget as HTMLButtonElement).style.color = '#6366f1' }}
                            onMouseLeave={e => { if (copied !== log.id) (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1' }}>
                            {copied === log.id ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{t.date}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>{t.time}</div>
                        <div style={{ fontSize: '0.7rem', color: '#c4b5fd', marginTop: '0.1rem', fontWeight: 500 }}>{t.relative}</div>
                      </td>

                      {/* Performed By */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '1.875rem', height: '1.875rem', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                            {log.performed_by.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{log.performed_by}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '9999px', backgroundColor: ac.bg, color: ac.color }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: ac.dot, flexShrink: 0 }} />
                          {log.action}
                        </span>
                      </td>

                      {/* Module */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '0.375rem', backgroundColor: `${mc}14`, color: mc, border: `1px solid ${mc}30` }}>
                          {log.module}
                        </span>
                      </td>

                      {/* Target */}
                      <td style={{ padding: '0.75rem 1rem', maxWidth: '200px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.target}>
                          {log.target}
                        </span>
                      </td>

                      {/* Details summary */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        {hasChanges ? (
                          <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, backgroundColor: '#eef2ff', padding: '0.2rem 0.5rem', borderRadius: '0.375rem' }}>
                            {changeCount} field{changeCount !== 1 ? 's' : ''} changed
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                      {/* Expand toggle */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : log.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem', borderRadius: '0.375rem', border: `1px solid ${isExpanded ? '#c7d2fe' : '#e2e8f0'}`, backgroundColor: isExpanded ? '#eef2ff' : '#fafafa', cursor: 'pointer', fontSize: '0.75rem', color: isExpanded ? '#6366f1' : '#64748b', fontWeight: 600, transition: 'all 0.15s' }}>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? 'Hide' : 'Info'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#f8faff' }}>
                        <td colSpan={8} style={{ padding: '0 1rem 1rem 1rem', borderBottom: '2px solid #e0e7ff' }}>
                          <div style={{ borderRadius: '0.75rem', border: '1px solid #e0e7ff', backgroundColor: '#fff', overflow: 'hidden' }}>

                            {/* Detail header */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 0, borderBottom: '1px solid #f1f5f9' }}>
                              {[
                                { label: 'Log ID', value: log.id, mono: true },
                                { label: 'Timestamp', value: `${t.date} ${t.time}`, mono: false },
                                { label: 'Performed By', value: log.performed_by, mono: false },
                                { label: 'Action', value: log.action, mono: false },
                                { label: 'Module', value: log.module, mono: false },
                                { label: 'Target', value: log.target, mono: false },
                              ].map((item, i) => (
                                <div key={i} style={{ padding: '0.75rem 1rem', borderRight: '1px solid #f1f5f9' }}>
                                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.25rem' }}>{item.label}</div>
                                  <div style={{ fontSize: item.mono ? '0.7rem' : '0.8rem', fontWeight: 600, color: '#1e293b', fontFamily: item.mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{item.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Changes diff */}
                            {hasChanges ? (
                              <div style={{ padding: '0.875rem 1rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.625rem' }}>
                                  Field Changes ({changeCount})
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                  {Object.entries(log.changes!).map(([field, { from, to }]) => (
                                    <div key={field} style={{ display: 'grid', gridTemplateColumns: '10rem 1fr auto 1fr', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                                      <span style={{ fontWeight: 700, color: '#475569', textTransform: 'capitalize' }}>{field.replace(/_/g, ' ')}</span>
                                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.375rem', backgroundColor: '#fee2e2', color: '#991b1b', fontFamily: 'monospace', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(from)}>
                                        {JSON.stringify(from) === 'null' || JSON.stringify(from) === '""' ? <em style={{ color: '#fca5a5' }}>empty</em> : JSON.stringify(from)}
                                      </span>
                                      <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.9rem' }}>→</span>
                                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.375rem', backgroundColor: '#d1fae5', color: '#065f46', fontFamily: 'monospace', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(to)}>
                                        {JSON.stringify(to) === 'null' || JSON.stringify(to) === '""' ? <em style={{ color: '#6ee7b7' }}>empty</em> : JSON.stringify(to)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                No field-level changes recorded for this action.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
