'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Printer, PhilippinePeso } from 'lucide-react'

type LogRow = {
  certificate_type_name: string
  price: number
  printed_at: string
}

type Summary = {
  name: string
  price: number
  count: number
  total: number
}

export default function LiquidationPage() {
  const { can, hasModule, loading: authLoading } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    if (!authLoading && !can('view:admin') && !hasModule('cert_liquidation')) router.replace('/dashboard')
  }, [authLoading, can, hasModule, router])

  useEffect(() => { fetchLogs() }, [from, to])

  async function fetchLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('certificate_print_logs')
      .select('certificate_type_name, price, printed_at')
      .gte('printed_at', `${from}T00:00:00`)
      .lte('printed_at', `${to}T23:59:59`)
      .order('printed_at', { ascending: false })
    setLogs(data ?? [])
    setLoading(false)
  }

  const summary: Summary[] = Object.values(
    (logs ?? []).reduce<Record<string, Summary>>((acc, row) => {
      const key = row.certificate_type_name
      if (!acc[key]) acc[key] = { name: key, price: row.price, count: 0, total: 0 }
      acc[key].count++
      acc[key].total += Number(row.price)
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  const grandTotal = summary.reduce((s, r) => s + r.total, 0)
  const grandCount = summary.reduce((s, r) => s + r.count, 0)

  return (
    <div style={{ maxWidth: '52rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#047857 0%,#10b981 50%,#34d399 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Certificate Liquidation</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>Total cash collected from printed certificates</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem', backdropFilter: 'blur(8px)' }}>
              <Printer size={13} /> {loading ? '—' : grandCount} prints
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem', backdropFilter: 'blur(8px)', fontWeight: 700 }}>
              <PhilippinePeso size={13} /> {loading ? '—' : `₱${grandTotal.toFixed(2)}`} total
            </div>
          </div>
        </div>
      </div>

      {/* Date filter */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Date Range:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>to</span>
          <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      {/* Summary table */}
      <div className="card">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Summary by Certificate Type</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Certificate Type</th>
                <th className="table-header" style={{ textAlign: 'right' }}>Price</th>
                <th className="table-header" style={{ textAlign: 'right' }}>Prints</th>
                <th className="table-header" style={{ textAlign: 'right' }}>Total Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={4} className="table-cell text-center py-10 text-slate-400">Loading...</td></tr>
              ) : summary.length === 0 ? (
                <tr><td colSpan={4} className="table-cell text-center py-10 text-slate-400">No prints recorded in this period</td></tr>
              ) : summary.map(row => (
                <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-medium">{row.name}</td>
                  <td className="table-cell" style={{ textAlign: 'right', color: '#64748b' }}>
                    {row.price === 0 ? <span style={{ color: '#10b981', fontWeight: 600 }}>Free</span> : `₱${Number(row.price).toFixed(2)}`}
                  </td>
                  <td className="table-cell" style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                      <Printer size={11} /> {row.count}
                    </span>
                  </td>
                  <td className="table-cell" style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                    ₱{row.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            {!loading && summary.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                  <td className="table-cell" style={{ fontWeight: 700, color: '#1e293b' }}>TOTAL</td>
                  <td className="table-cell" />
                  <td className="table-cell" style={{ textAlign: 'right', fontWeight: 700 }}>{grandCount}</td>
                  <td className="table-cell" style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: '#047857' }}>₱{grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Print log */}
      <div className="card">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Print Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Certificate Type</th>
                <th className="table-header" style={{ textAlign: 'right' }}>Amount</th>
                <th className="table-header">Printed At</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={3} className="table-cell text-center py-10 text-slate-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={3} className="table-cell text-center py-10 text-slate-400">No records</td></tr>
              ) : logs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell"><span className="badge-blue">{log.certificate_type_name}</span></td>
                  <td className="table-cell" style={{ textAlign: 'right', fontWeight: 600, color: log.price === 0 ? '#10b981' : '#1e293b' }}>
                    {log.price === 0 ? 'Free' : `₱${Number(log.price).toFixed(2)}`}
                  </td>
                  <td className="table-cell" style={{ color: '#64748b' }}>
                    {new Date(log.printed_at).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
