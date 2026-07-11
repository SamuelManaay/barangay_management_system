'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { AlertTriangle, Siren, Tent, Package, HardHat, Shield, TrendingUp, MapPin, Zap } from 'lucide-react'

type Stats = {
  activeIncidents: number
  pendingRequests: number
  sosRequests: number
  affectedHouseholds: number
  totalEvacuees: number
  centerOccupancy: { name: string; current_occupants: number; capacity: number }[]
  reliefDistributed: number
  tanodsResponding: number
  electricityIssues: number
  recentIncidents: { id: string; incident_type: string; severity: string; status: string; location: string | null; incident_date: string }[]
}

const severityStyle: Record<string, { bg: string; color: string }> = {
  Low:      { bg: '#d1fae5', color: '#065f46' },
  Medium:   { bg: '#fef3c7', color: '#92400e' },
  High:     { bg: '#fee2e2', color: '#991b1b' },
  Critical: { bg: '#fce7f3', color: '#9d174d' },
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  Reported:   { bg: '#fef3c7', color: '#92400e' },
  Responding: { bg: '#dbeafe', color: '#1e40af' },
  Resolved:   { bg: '#f1f5f9', color: '#475569' },
}

export default function CalamityDashboard() {
  const [stats, setStats] = useState<Stats>({
    activeIncidents: 0, pendingRequests: 0, sosRequests: 0, affectedHouseholds: 0,
    totalEvacuees: 0, centerOccupancy: [], reliefDistributed: 0,
    tanodsResponding: 0, electricityIssues: 0, recentIncidents: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [active, pending, sos, evacuees, centers, relief, tanods, recent, damage, electricity] = await Promise.all([
        supabase.from('cal_incidents').select('id', { count: 'exact', head: true }).neq('status', 'Resolved'),
        supabase.from('cal_requests').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('cal_requests').select('id', { count: 'exact', head: true }).not('sos_type', 'is', null).eq('status', 'Pending'),
        supabase.from('cal_evacuees').select('people_count').is('check_out', null),
        supabase.from('cal_evacuation_centers').select('name, current_occupants, capacity').eq('status', 'Active'),
        supabase.from('cal_relief').select('quantity'),
        supabase.from('cal_tanods').select('id', { count: 'exact', head: true }).eq('status', 'Responding'),
        supabase.from('cal_incidents').select('id,incident_type,severity,status,location,incident_date').order('created_at', { ascending: false }).limit(6),
        supabase.from('cal_damage').select('id', { count: 'exact', head: true }),
        supabase.from('cal_electricity_issues').select('id', { count: 'exact', head: true }).neq('status', 'Resolved'),
      ])
      setStats({
        activeIncidents: active.count ?? 0,
        pendingRequests: pending.count ?? 0,
        sosRequests: sos.count ?? 0,
        totalEvacuees: (evacuees.data ?? []).reduce((s: number, r: { people_count: number }) => s + (r.people_count ?? 0), 0),
        centerOccupancy: (centers.data ?? []) as { name: string; current_occupants: number; capacity: number }[],
        reliefDistributed: (relief.data ?? []).reduce((s: number, r: { quantity: number }) => s + (r.quantity ?? 0), 0),
        tanodsResponding: tanods.count ?? 0,
        affectedHouseholds: damage.count ?? 0,
        electricityIssues: electricity.count ?? 0,
        recentIncidents: recent.data ?? [],
      })
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Active Incidents',     value: stats.activeIncidents,   icon: AlertTriangle, gradient: 'linear-gradient(135deg,#dc2626,#ef4444)', shadow: 'rgba(220,38,38,0.35)',  href: '/calamity/incidents' },
    { label: 'Pending Requests',     value: stats.pendingRequests,   icon: Siren,         gradient: 'linear-gradient(135deg,#ea580c,#f97316)', shadow: 'rgba(234,88,12,0.35)',  href: '/calamity/requests' },
    { label: 'Active SOS',           value: stats.sosRequests,       icon: Siren,         gradient: 'linear-gradient(135deg,#9d174d,#db2777)', shadow: 'rgba(157,23,77,0.35)',  href: '/calamity/requests' },
    { label: 'Total Evacuees',       value: stats.totalEvacuees,     icon: Tent,          gradient: 'linear-gradient(135deg,#0284c7,#0ea5e9)', shadow: 'rgba(2,132,199,0.35)',  href: '/calamity/centers' },
    { label: 'Relief Distributed',   value: stats.reliefDistributed, icon: Package,       gradient: 'linear-gradient(135deg,#059669,#10b981)', shadow: 'rgba(5,150,105,0.35)',  href: '/calamity/relief' },
    { label: 'Affected Households',  value: stats.affectedHouseholds,icon: HardHat,       gradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', shadow: 'rgba(124,58,237,0.35)', href: '/calamity/damage' },
    { label: 'Tanods Responding',    value: stats.tanodsResponding,  icon: Shield,        gradient: 'linear-gradient(135deg,#0f766e,#14b8a6)', shadow: 'rgba(15,118,110,0.35)', href: '/calamity/tanods' },
    { label: 'Electricity Issues',   value: stats.electricityIssues, icon: Zap,           gradient: 'linear-gradient(135deg,#1e40af,#3b82f6)', shadow: 'rgba(30,64,175,0.35)', href: '/calamity/electricity' },
  ]

  const quickLinks = [
    { label: 'Report Incident',      href: '/calamity/incidents', icon: AlertTriangle, gradient: 'linear-gradient(135deg,#dc2626,#ef4444)' },
    { label: 'Emergency Request',    href: '/calamity/requests',  icon: Siren,         gradient: 'linear-gradient(135deg,#ea580c,#f97316)' },
    { label: 'Evacuation Centers',   href: '/calamity/centers',   icon: Tent,          gradient: 'linear-gradient(135deg,#0284c7,#0ea5e9)' },
    { label: 'Relief Distribution',  href: '/calamity/relief',    icon: Package,       gradient: 'linear-gradient(135deg,#059669,#10b981)' },
    { label: 'Damage Assessment',    href: '/calamity/damage',    icon: HardHat,       gradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' },
    { label: 'Tanod Response',       href: '/calamity/tanods',    icon: Shield,        gradient: 'linear-gradient(135deg,#0f766e,#14b8a6)' },
    { label: 'Patrol Logs',          href: '/calamity/patrol',    icon: MapPin,        gradient: 'linear-gradient(135deg,#b45309,#d97706)' },
    { label: 'Electricity Issues',   href: '/calamity/electricity', icon: Zap,        gradient: 'linear-gradient(135deg,#1e40af,#3b82f6)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 50%,#dc2626 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-3rem', right: '8rem', width: '14rem', height: '14rem', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={24} style={{ color: '#fca5a5' }} />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Calamity & Emergency Response</h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#fecaca' }}>Real-time disaster management and emergency coordination</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[
              { icon: '🚨', label: `${loading ? '—' : stats.activeIncidents} active incidents` },
              { icon: '🆘', label: `${loading ? '—' : stats.sosRequests} active SOS` },
              { icon: '🏕️', label: `${loading ? '—' : stats.totalEvacuees} evacuees` },
              { icon: '🛡️', label: `${loading ? '—' : stats.tanodsResponding} tanods responding` },
              { icon: '⚡', label: `${loading ? '—' : stats.electricityIssues} power issues` },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
                <span>{b.icon}</span><span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
              <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = `0 8px 24px ${card.shadow}` }}
                onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Recent Incidents */}
        <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg,#dc2626,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={14} color="#fff" />
              </div>
              <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Recent Incidents</h2>
            </div>
            <Link href="/calamity/incidents" style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ backgroundColor: '#fafafa' }}>
                {['Type', 'Severity', 'Status', 'Date'].map(h => <th key={h} className="table-header">{h}</th>)}
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>Loading...</td></tr>
                ) : stats.recentIncidents.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>No incidents yet</td></tr>
                ) : stats.recentIncidents.map(i => {
                  const sv = severityStyle[i.severity] ?? { bg: '#f1f5f9', color: '#475569' }
                  const st = statusStyle[i.status] ?? { bg: '#f1f5f9', color: '#475569' }
                  return (
                    <tr key={i.id} style={{ borderTop: '1px solid #f8fafc' }}>
                      <td className="table-cell" style={{ fontWeight: 600 }}>{i.incident_type}</td>
                      <td className="table-cell"><span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: sv.bg, color: sv.color }}>{i.severity}</span></td>
                      <td className="table-cell"><span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: st.bg, color: st.color }}>{i.status}</span></td>
                      <td className="table-cell" style={{ color: '#64748b', fontSize: '0.8rem' }}>{i.incident_date}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evacuation Center Occupancy + Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Center occupancy */}
          <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg,#0284c7,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tent size={14} color="#fff" />
              </div>
              <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Active Evacuation Centers</h2>
            </div>
            {loading ? <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading...</p>
              : stats.centerOccupancy.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>No active centers</p>
              : stats.centerOccupancy.map(c => {
                const pct = c.capacity > 0 ? Math.min(100, Math.round((c.current_occupants / c.capacity) * 100)) : 0
                return (
                  <div key={c.name} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{c.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.current_occupants}/{c.capacity}</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: '9999px', background: pct >= 90 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : pct >= 70 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#0ea5e9,#0284c7)' }} />
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Quick links */}
          <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '1.25rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Quick Access</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {quickLinks.map(link => {
                const Icon = link.icon
                return (
                  <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.625rem', borderRadius: '0.625rem', border: '1px solid #f1f5f9', backgroundColor: '#fafafa', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.backgroundColor = '#fff5f5'; d.style.borderColor = '#fecaca' }}
                      onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.backgroundColor = '#fafafa'; d.style.borderColor = '#f1f5f9' }}>
                      <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem', background: link.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={13} color="#fff" />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>{link.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
