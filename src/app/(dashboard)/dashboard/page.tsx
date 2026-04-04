'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { Users, Scale, FileText, Building2, UserCheck, Briefcase, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

type Stats = { residents: number; blotters: number; certificates: number; businesses: number; officials: number; pending: number; settled: number }
type RecentBlotter = { id: string; incident_type: string | null; blotter_status: string; date_recorded: string; incident_location: string | null }

const statusStyle: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  Pending:    { bg: '#fef3c7', color: '#92400e', icon: Clock },
  Settled:    { bg: '#d1fae5', color: '#065f46', icon: CheckCircle2 },
  Dismissed:  { bg: '#f1f5f9', color: '#475569', icon: CheckCircle2 },
  'For Filing': { bg: '#fee2e2', color: '#991b1b', icon: AlertCircle },
}

export default function DashboardPage() {
  const { user, hasModule } = useAuth()
  const [stats, setStats] = useState<Stats>({ residents: 0, blotters: 0, certificates: 0, businesses: 0, officials: 0, pending: 0, settled: 0 })
  const [recent, setRecent] = useState<RecentBlotter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [res, blot, cert, biz, off, pend, sett, rec] = await Promise.all([
        supabase.from('residents').select('id', { count: 'exact', head: true }),
        supabase.from('blotter_records').select('id', { count: 'exact', head: true }),
        supabase.from('certificate_issuances').select('id', { count: 'exact', head: true }),
        supabase.from('business_permits').select('id', { count: 'exact', head: true }),
        supabase.from('barangay_officials').select('id', { count: 'exact', head: true }),
        supabase.from('blotter_records').select('id', { count: 'exact', head: true }).eq('blotter_status', 'Pending'),
        supabase.from('blotter_records').select('id', { count: 'exact', head: true }).eq('blotter_status', 'Settled'),
        supabase.from('blotter_records').select('id,incident_type,blotter_status,date_recorded,incident_location').order('created_at', { ascending: false }).limit(6),
      ])
      setStats({ residents: res.count ?? 0, blotters: blot.count ?? 0, certificates: cert.count ?? 0, businesses: biz.count ?? 0, officials: off.count ?? 0, pending: pend.count ?? 0, settled: sett.count ?? 0 })
      setRecent(rec.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    { label: 'Total Residents', value: stats.residents, icon: Users, gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: 'rgba(99,102,241,0.35)', href: '/residents', module: 'residents' as const },
    { label: 'Blotter Records', value: stats.blotters, icon: Scale, gradient: 'linear-gradient(135deg,#ef4444,#f97316)', shadow: 'rgba(239,68,68,0.35)', href: '/blotter', module: 'blotter' as const },
    { label: 'Certificates Issued', value: stats.certificates, icon: FileText, gradient: 'linear-gradient(135deg,#10b981,#059669)', shadow: 'rgba(16,185,129,0.35)', href: '/certificates', module: 'certificates' as const },
    { label: 'Business Permits', value: stats.businesses, icon: Building2, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: 'rgba(245,158,11,0.35)', href: '/business', module: 'business' as const },
    { label: 'Active Officials', value: stats.officials, icon: UserCheck, gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', shadow: 'rgba(59,130,246,0.35)', href: '/officials', module: 'officials' as const },
    { label: 'Pending Cases', value: stats.pending, icon: AlertCircle, gradient: 'linear-gradient(135deg,#ec4899,#db2777)', shadow: 'rgba(236,72,153,0.35)', href: '/blotter', module: 'blotter' as const },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header banner */}
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-3rem', right: '6rem', width: '14rem', height: '14rem', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#a5b4fc', fontWeight: 500 }}>{greeting},</p>
          <h1 style={{ margin: '0.25rem 0 0.5rem', fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{user?.full_name ?? 'Welcome'} 👋</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#c7d2fe' }}>
            {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem', backdropFilter: 'blur(8px)' }}>
              <AlertCircle size={14} style={{ color: '#fbbf24' }} />
              <span>{loading ? '—' : stats.pending} pending cases</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem', backdropFilter: 'blur(8px)' }}>
              <CheckCircle2 size={14} style={{ color: '#34d399' }} />
              <span>{loading ? '—' : stats.settled} settled cases</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem', backdropFilter: 'blur(8px)' }}>
              <TrendingUp size={14} style={{ color: '#a5b4fc' }} />
              <span>{loading ? '—' : stats.residents} total residents</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {statCards.filter(c => !c.module || hasModule(c.module)).map(card => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
              <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${card.shadow}` }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${card.shadow}` }}>
                    <Icon size={20} color="#fff" />
                  </div>
                  <TrendingUp size={14} style={{ color: '#10b981', marginTop: '0.25rem' }} />
                </div>
                <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{loading ? '—' : card.value.toLocaleString()}</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{card.label}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Recent blotters */}
        {hasModule('blotter') && (
          <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg,#ef4444,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Scale size={14} color="#fff" />
                </div>
                <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Recent Blotter Records</h2>
              </div>
              <Link href="/blotter" style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa' }}>
                    <th className="table-header">Incident Type</th>
                    <th className="table-header">Location</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>Loading...</td></tr>
                  ) : recent.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>No blotter records yet</td></tr>
                  ) : recent.map(b => {
                    const s = statusStyle[b.blotter_status] ?? { bg: '#f1f5f9', color: '#475569', icon: Clock }
                    const SIcon = s.icon
                    return (
                      <tr key={b.id} style={{ borderTop: '1px solid #f8fafc' }}>
                        <td className="table-cell" style={{ fontWeight: 600 }}>{b.incident_type ?? '—'}</td>
                        <td className="table-cell" style={{ color: '#64748b' }}>{b.incident_location ?? '—'}</td>
                        <td className="table-cell" style={{ color: '#64748b' }}>{b.date_recorded}</td>
                        <td className="table-cell">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: s.bg, color: s.color }}>
                            <SIcon size={11} />
                            {b.blotter_status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', gridColumn: '1 / -1' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f8fafc' }}>
            <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Quick Actions</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', padding: '1rem 1.25rem' }}>
            {[
              { label: 'Add Resident',      href: '/residents',    icon: Users,      gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', module: 'residents' as const },
              { label: 'File Blotter',       href: '/blotter',      icon: Scale,      gradient: 'linear-gradient(135deg,#ef4444,#f97316)', module: 'blotter' as const },
              { label: 'Issue Certificate',  href: '/certificates', icon: FileText,   gradient: 'linear-gradient(135deg,#10b981,#059669)', module: 'certificates' as const },
              { label: 'Schedule Summon',    href: '/settlements',  icon: Briefcase,  gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', module: 'settlements' as const },
              { label: 'Add Business',       href: '/business',     icon: Building2,  gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', module: 'business' as const },
              { label: 'View Officials',     href: '/officials',    icon: UserCheck,  gradient: 'linear-gradient(135deg,#ec4899,#db2777)', module: 'officials' as const },
            ].filter(a => hasModule(a.module)).map(action => {
              const Icon = action.icon
              return (
                <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.15s', backgroundColor: '#fafafa' }}
                    onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.backgroundColor = '#f0f0ff'; d.style.borderColor = '#c7d2fe'; d.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.backgroundColor = '#fafafa'; d.style.borderColor = '#f1f5f9'; d.style.transform = 'translateY(0)' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: action.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} color="#fff" />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{action.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
