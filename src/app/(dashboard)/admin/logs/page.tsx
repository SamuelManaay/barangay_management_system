'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'

type AuditLog = {
  id: string
  performed_by: string
  action: string
  module: string
  target: string
  changes: Record<string, { from: unknown; to: unknown }> | null
  created_at: string
}

const actionColors: Record<string, { bg: string; color: string }> = {
  Created:     { bg: '#d1fae5', color: '#065f46' },
  Updated:     { bg: '#dbeafe', color: '#1e40af' },
  Deleted:     { bg: '#fee2e2', color: '#991b1b' },
  Activated:   { bg: '#d1fae5', color: '#065f46' },
  Deactivated: { bg: '#fef3c7', color: '#92400e' },
}

export default function AuditLogsPage() {
  const { can, loading: authLoading } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterModule, setFilterModule] = useState('')
  const [filterAction, setFilterAction] = useState('')

  useEffect(() => {
    if (!authLoading && !can('view:admin')) router.replace('/dashboard')
  }, [authLoading, can, router])

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('id,performed_by,action,module,target,changes,created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    setLogs(data ?? [])
    setLoading(false)
  }

  const modules = [...new Set(logs.map(l => l.module))]
  const actions = [...new Set(logs.map(l => l.action))]

  const filtered = logs.filter(l =>
    (!filterModule || l.module === filterModule) &&
    (!filterAction || l.action === filterAction)
  )

  return (
    <div>

      {/* Header */}
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#1e1b4b,#312e81)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ClipboardList size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Audit Logs</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#a5b4fc' }}>Track all changes made by users across the system.</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto', minWidth: '10rem' }} value={filterModule} onChange={e => setFilterModule(e.target.value)}>
          <option value="">All Modules</option>
          {modules.map(m => <option key={m}>{m}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: '10rem' }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">All Actions</option>
          {actions.map(a => <option key={a}>{a}</option>)}
        </select>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', alignSelf: 'center' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Logs table */}
      <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa' }}>
                {['Date & Time', 'Performed By', 'Action', 'Module', 'Target', 'Changes', ''].map((h, i) => (
                  <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>No logs found.</td></tr>
              ) : filtered.map(log => {
                const ac = actionColors[log.action] ?? { bg: '#f1f5f9', color: '#475569' }
                const hasChanges = log.changes && Object.keys(log.changes).length > 0
                const isExpanded = expanded === log.id
                return (
                  <React.Fragment key={log.id}>
                    <tr style={{ borderTop: '1px solid #f8fafc' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <br />
                        <span style={{ color: '#94a3b8' }}>{new Date(log.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {log.performed_by.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{log.performed_by}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: ac.bg, color: ac.color }}>{log.action}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#64748b' }}>{log.module}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{log.target}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        {hasChanges ? `${Object.keys(log.changes!).length} field(s) changed` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {hasChanges && (
                          <button onClick={() => setExpanded(isExpanded ? null : log.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', backgroundColor: '#fafafa', cursor: 'pointer', fontSize: '0.75rem', color: '#475569' }}>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {isExpanded ? 'Hide' : 'View'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && hasChanges && (
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td colSpan={7} style={{ padding: '0.75rem 1rem 1rem 3rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {Object.entries(log.changes!).map(([field, { from, to }]) => (
                              <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: 600, color: '#475569', minWidth: '8rem', textTransform: 'capitalize' }}>{field.replace(/_/g, ' ')}</span>
                                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '0.375rem', backgroundColor: '#fee2e2', color: '#991b1b', fontFamily: 'monospace' }}>{JSON.stringify(from)}</span>
                                <span style={{ color: '#94a3b8' }}>→</span>
                                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '0.375rem', backgroundColor: '#d1fae5', color: '#065f46', fontFamily: 'monospace' }}>{JSON.stringify(to)}</span>
                              </div>
                            ))}
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
