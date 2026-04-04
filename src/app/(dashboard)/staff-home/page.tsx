'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { Users, Scale, FileText, Briefcase, Building2, AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

type Stats = {
  residents: number
  pendingBlotters: number
  certToday: number
  pendingSettlements: number
  activeBusinesses: number
}

export default function StaffHomePage() {
  const { user, hasModule, can } = useAuth()
  const [stats, setStats] = useState<Stats>({ residents: 0, pendingBlotters: 0, certToday: 0, pendingSettlements: 0, activeBusinesses: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const [res, pend, cert, sett, biz] = await Promise.all([
        hasModule('residents') ? supabase.from('residents').select('id', { count: 'exact', head: true }) : Promise.resolve({ count: 0 }),
        hasModule('blotter')   ? supabase.from('blotter_records').select('id', { count: 'exact', head: true }).eq('blotter_status', 'Pending') : Promise.resolve({ count: 0 }),
        hasModule('certificates') ? supabase.from('certificate_issuances').select('id', { count: 'exact', head: true }).gte('issued_at', today) : Promise.resolve({ count: 0 }),
        hasModule('settlements')  ? supabase.from('summon_schedules').select('id', { count: 'exact', head: true }).eq('status', 'Scheduled') : Promise.resolve({ count: 0 }),
        hasModule('business')     ? supabase.from('business_permits').select('id', { count: 'exact', head: true }).eq('status', 'Active') : Promise.resolve({ count: 0 }),
      ])
      setStats({
        residents:         res.count ?? 0,
        pendingBlotters:   pend.count ?? 0,
        certToday:         cert.count ?? 0,
        pendingSettlements: sett.count ?? 0,
        activeBusinesses:  biz.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    { label: 'Total Residents',    value: stats.residents,          icon: Users,     gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: 'rgba(99,102,241,0.3)',  href: '/residents',    module: 'residents' as const },
    { label: 'Pending Blotters',   value: stats.pendingBlotters,    icon: Scale,     gradient: 'linear-gradient(135deg,#ef4444,#f97316)', shadow: 'rgba(239,68,68,0.3)',   href: '/blotter',      module: 'blotter' as const },
    { label: 'Certs Issued Today', value: stats.certToday,          icon: FileText,  gradient: 'linear-gradient(135deg,#10b981,#059669)', shadow: 'rgba(16,185,129,0.3)',  href: '/certificates', module: 'certificates' as const },
    { label: 'Pending Summons',    value: stats.pendingSettlements, icon: Briefcase, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: 'rgba(245,158,11,0.3)',  href: '/settlements',  module: 'settlements' as const },
    { label: 'Active Businesses',  value: stats.activeBusinesses,   icon: Building2, gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', shadow: 'rgba(59,130,246,0.3)',  href: '/business',     module: 'business' as const },
  ]

  const quickActions = [
    { label: 'Add Resident',      href: '/residents',    icon: Users,     gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', module: 'residents' as const,    action: 'manage:residents' as const },
    { label: 'File Blotter',      href: '/blotter',      icon: Scale,     gradient: 'linear-gradient(135deg,#ef4444,#f97316)', module: 'blotter' as const,      action: 'manage:blotter' as const },
    { label: 'Issue Certificate', href: '/certificates', icon: FileText,  gradient: 'linear-gradient(135deg,#10b981,#059669)', module: 'certificates' as const, action: 'manage:certificates' as const },
    { label: 'Schedule Summon',   href: '/settlements',  icon: Briefcase, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', module: 'settlements' as const,  action: 'manage:settlements' as const },
    { label: 'Add Business',      href: '/business',     icon: Building2, gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', module: 'business' as const,     action: 'manage:business' as const },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-3rem', right: '6rem', width: '14rem', height: '14rem', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#a5b4fc', fontWeight: 500 }}>{greeting},</p>
          <h1 style={{ margin: '0.25rem 0 0.5rem', fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{user?.full_name ?? 'Staff'} 👋</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#c7d2fe' }}>
            {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
              {user?.role ?? 'Staff'}
            </div>
            {hasModule('blotter') && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}>
                <AlertCircle size={12} style={{ color: '#fbbf24' }} />
                {loading ? '—' : stats.pendingBlotters} pending blotters
              </div>
            )}
            {hasModule('certificates') && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}>
                <CheckCircle2 size={12} style={{ color: '#34d399' }} />
                {loading ? '—' : stats.certToday} certs today
              </div>
            )}
            {hasModule('settlements') && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}>
                <Clock size={12} style={{ color: '#a5b4fc' }} />
                {loading ? '—' : stats.pendingSettlements} pending summons
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards — only show modules the user has access to */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {statCards.filter(c => hasModule(c.module)).map(card => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
              <div
                style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = `0 8px 24px ${card.shadow}` }}
                onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(0)'; d.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
              >
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

      {/* Quick actions — only show modules the user can manage */}
      <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Quick Actions</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', padding: '1rem 1.25rem' }}>
          {quickActions.filter(a => can(a.action)).map(action => {
            const Icon = action.icon
            return (
              <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.15s', backgroundColor: '#fafafa' }}
                  onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.backgroundColor = '#f0f0ff'; d.style.borderColor = '#c7d2fe'; d.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.backgroundColor = '#fafafa'; d.style.borderColor = '#f1f5f9'; d.style.transform = 'translateY(0)' }}
                >
                  <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: action.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color="#fff" />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{action.label}</span>
                </div>
              </Link>
            )
          })}
          {quickActions.filter(a => can(a.action)).length === 0 && (
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', gridColumn: '1 / -1', margin: 0 }}>No actions available for your role.</p>
          )}
        </div>
      </div>
    </div>
  )
}
