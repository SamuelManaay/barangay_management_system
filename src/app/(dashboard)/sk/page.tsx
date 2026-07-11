'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Users, Star, CalendarDays, FolderKanban, Wallet, GraduationCap, TrendingUp } from 'lucide-react'

type Stats = {
  youth: number
  members: number
  volunteers: number
  activeProjects: number
  upcomingEvents: number
  totalIncome: number
  totalExpense: number
  scholarships: number
}

export default function SKDashboard() {
  const [stats, setStats] = useState<Stats>({ youth: 0, members: 0, volunteers: 0, activeProjects: 0, upcomingEvents: 0, totalIncome: 0, totalExpense: 0, scholarships: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [youth, members, volunteers, projects, events, income, expense, scholarships] = await Promise.all([
        supabase.from('sk_youth').select('id', { count: 'exact', head: true }),
        supabase.from('sk_youth').select('id', { count: 'exact', head: true }).eq('is_sk_member', true),
        supabase.from('sk_youth').select('id', { count: 'exact', head: true }).eq('is_volunteer', true),
        supabase.from('sk_projects').select('id', { count: 'exact', head: true }).eq('status', 'Ongoing'),
        supabase.from('sk_events').select('id', { count: 'exact', head: true }).eq('status', 'Upcoming'),
        supabase.from('sk_finances').select('amount').eq('transaction_type', 'Income'),
        supabase.from('sk_finances').select('amount').eq('transaction_type', 'Expense'),
        supabase.from('sk_scholarships').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
      ])
      const totalIncome = (income.data ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0)
      const totalExpense = (expense.data ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0)
      setStats({
        youth: youth.count ?? 0,
        members: members.count ?? 0,
        volunteers: volunteers.count ?? 0,
        activeProjects: projects.count ?? 0,
        upcomingEvents: events.count ?? 0,
        totalIncome,
        totalExpense,
        scholarships: scholarships.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const balance = stats.totalIncome - stats.totalExpense
  const budgetPct = stats.totalIncome > 0 ? Math.min(100, Math.round((stats.totalExpense / stats.totalIncome) * 100)) : 0

  const cards = [
    { label: 'Registered Youth', value: stats.youth, icon: Users, gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: 'rgba(99,102,241,0.35)', href: '/sk/youth' },
    { label: 'SK Members', value: stats.members, icon: Star, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: 'rgba(245,158,11,0.35)', href: '/sk/youth' },
    { label: 'Volunteers', value: stats.volunteers, icon: Users, gradient: 'linear-gradient(135deg,#10b981,#059669)', shadow: 'rgba(16,185,129,0.35)', href: '/sk/youth' },
    { label: 'Active Projects', value: stats.activeProjects, icon: FolderKanban, gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', shadow: 'rgba(59,130,246,0.35)', href: '/sk/projects' },
    { label: 'Upcoming Events', value: stats.upcomingEvents, icon: CalendarDays, gradient: 'linear-gradient(135deg,#ec4899,#db2777)', shadow: 'rgba(236,72,153,0.35)', href: '/sk/events' },
    { label: 'Active Scholarships', value: stats.scholarships, icon: GraduationCap, gradient: 'linear-gradient(135deg,#14b8a6,#0d9488)', shadow: 'rgba(20,184,166,0.35)', href: '/sk/scholarships' },
  ]

  const quickLinks = [
    { label: 'SK Officials', href: '/sk/officials', icon: Star, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    { label: 'Youth Registry', href: '/sk/youth', icon: Users, gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { label: 'Programs & Events', href: '/sk/events', icon: CalendarDays, gradient: 'linear-gradient(135deg,#ec4899,#db2777)' },
    { label: 'Projects', href: '/sk/projects', icon: FolderKanban, gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
    { label: 'Financial Records', href: '/sk/finances', icon: Wallet, gradient: 'linear-gradient(135deg,#10b981,#059669)' },
    { label: 'Scholarships', href: '/sk/scholarships', icon: GraduationCap, gradient: 'linear-gradient(135deg,#14b8a6,#0d9488)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#065f46 0%,#059669 50%,#10b981 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Star size={24} style={{ color: '#fbbf24' }} />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Sangguniang Kabataan</h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>Youth governance and community programs</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[
              { icon: '👥', label: `${loading ? '—' : stats.youth} youth registered` },
              { icon: '📋', label: `${loading ? '—' : stats.activeProjects} active projects` },
              { icon: '💰', label: `₱${loading ? '—' : balance.toLocaleString()} balance` },
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
        {cards.map(card => {
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

      {/* Budget tracker + Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Budget */}
        <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={14} color="#fff" />
            </div>
            <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Budget Overview</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Total Income', value: stats.totalIncome, color: '#10b981' },
              { label: 'Total Expenses', value: stats.totalExpense, color: '#ef4444' },
              { label: 'Balance', value: balance, color: balance >= 0 ? '#6366f1' : '#ef4444' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{row.label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: row.color }}>₱{loading ? '—' : row.value.toLocaleString()}</span>
              </div>
            ))}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Budget Used</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: budgetPct > 80 ? '#ef4444' : '#10b981' }}>{budgetPct}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${budgetPct}%`, borderRadius: '9999px', background: budgetPct > 80 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#10b981,#059669)', transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '1.25rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Quick Access</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            {quickLinks.map(link => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem', borderRadius: '0.625rem', border: '1px solid #f1f5f9', backgroundColor: '#fafafa', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.backgroundColor = '#f0fdf4'; d.style.borderColor = '#bbf7d0' }}
                    onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.backgroundColor = '#fafafa'; d.style.borderColor = '#f1f5f9' }}>
                    <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem', background: link.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={13} color="#fff" />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>{link.label}</span>
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
