'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, Scale, Briefcase,
  UserCheck, Building2, LogOut, Menu, X, Settings, ShieldCheck, UsersRound, ClipboardList, Banknote, Star, CalendarDays, FolderKanban, Wallet, GraduationCap,
  AlertTriangle, Siren, Tent, Package, HardHat, Shield, MapPin, Zap
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { ModuleKey } from '@/context/AuthContext'

const navItems: { href: string; label: string; icon: React.ElementType; module: ModuleKey | null; adminOnly?: boolean }[] = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard, module: null,      adminOnly: true },
  { href: '/staff-home',      label: 'Dashboard',       icon: LayoutDashboard, module: null },
  { href: '/staff-dashboard', label: 'Staff Directory', icon: UsersRound,      module: 'staff' as ModuleKey },
  { href: '/residents',       label: 'Residents',       icon: Users,           module: 'residents' },
  { href: '/blotter',         label: 'Blotter',         icon: Scale,           module: 'blotter' },
  { href: '/certificates',    label: 'Certificates',    icon: FileText,        module: 'certificates' },
  { href: '/settlements',     label: 'Settlements',     icon: Briefcase,       module: 'settlements' },
  { href: '/officials',       label: 'Officials',       icon: UserCheck,       module: 'officials' },
  { href: '/business',        label: 'Business Permits',icon: Building2,       module: 'business' },
]

const skNavItems: { href: string; label: string; icon: React.ElementType; module: ModuleKey }[] = [
  { href: '/sk',              label: 'SK Dashboard',      icon: LayoutDashboard, module: 'sk_dashboard' },
  { href: '/sk/officials',    label: 'Officials',         icon: Star,            module: 'sk_officials' },
  { href: '/sk/youth',        label: 'Youth Registry',    icon: Users,           module: 'sk_youth' },
  { href: '/sk/events',       label: 'Programs & Events', icon: CalendarDays,    module: 'sk_events' },
  { href: '/sk/projects',     label: 'Projects',          icon: FolderKanban,    module: 'sk_projects' },
  { href: '/sk/finances',     label: 'Finances',          icon: Wallet,          module: 'sk_finance' },
  { href: '/sk/scholarships', label: 'Scholarships',      icon: GraduationCap,   module: 'sk_scholarships' },
]

const calamityNavItems: { href: string; label: string; icon: React.ElementType; module: ModuleKey }[] = [
  { href: '/calamity',           label: 'Dashboard',          icon: LayoutDashboard, module: 'cal_dashboard' },
  { href: '/calamity/incidents', label: 'Incidents',          icon: AlertTriangle,   module: 'cal_incidents' },
  { href: '/calamity/requests',  label: 'Emergency Requests', icon: Siren,           module: 'cal_requests' },
  { href: '/calamity/centers',   label: 'Evacuation Centers', icon: Tent,            module: 'cal_centers' },
  { href: '/calamity/relief',    label: 'Relief Distribution',icon: Package,         module: 'cal_relief' },
  { href: '/calamity/damage',    label: 'Damage Assessment',  icon: HardHat,         module: 'cal_damage' },
  { href: '/calamity/tanods',    label: 'Tanod Response',     icon: Shield,          module: 'cal_tanods' },
  { href: '/calamity/patrol',    label: 'Patrol Logs',        icon: MapPin,          module: 'cal_patrol' },
  { href: '/calamity/electricity', label: 'Electricity Issues', icon: Zap,           module: 'cal_electricity' },
]

const roleStyle: Record<string, { bg: string; color: string }> = {
  Admin:    { bg: 'rgba(99,102,241,0.25)', color: '#a5b4fc' },
  Staff:    { bg: 'rgba(16,185,129,0.2)',  color: '#6ee7b7' },
  Readonly: { bg: 'rgba(148,163,184,0.2)', color: '#94a3b8' },
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout, can, hasModule } = useAuth()
  const [open, setOpen] = useState(false)
  const rs = roleStyle[user?.role ?? ''] ?? roleStyle.Readonly

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(!open)} className="sidebar-mobile-toggle" style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#fff', boxShadow: '0 1px 3px rgb(0 0 0/0.1)', cursor: 'pointer' }}>
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && <div onClick={() => setOpen(false)} className="sidebar-overlay" style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.4)' }} />}

      <aside className={open ? 'sidebar-open' : 'sidebar-closed'} style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40, width: '16rem', display: 'flex', flexDirection: 'column', transition: 'transform 0.25s ease', background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)', boxShadow: '4px 0 24px rgba(0,0,0,0.25)' }}>

        {/* Logo */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
              BMS
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>Barangay System</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#a5b4fc' }}>Management Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(165,180,252,0.5)', padding: '0.5rem 0.75rem 0.25rem', margin: 0 }}>Main Menu</p>

          {navItems.map(({ href, label, icon: Icon, module, adminOnly }) => {
            if (adminOnly && user?.role !== 'Admin') return null
            // Hide /staff-home from Admin, hide /dashboard from non-Admin
            if (href === '/staff-home' && user?.role === 'Admin') return null
            if (module && !hasModule(module)) return null
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.625rem', padding: '0.625rem 0.75rem', fontSize: '0.875rem', fontWeight: active ? 600 : 400, textDecoration: 'none', transition: 'all 0.15s', background: active ? 'linear-gradient(135deg,rgba(99,102,241,0.5),rgba(139,92,246,0.3))' : 'transparent', color: active ? '#fff' : 'rgba(203,213,225,0.85)', boxShadow: active ? '0 2px 8px rgba(99,102,241,0.3)' : 'none', backdropFilter: active ? 'blur(8px)' : 'none', border: active ? '1px solid rgba(165,180,252,0.2)' : '1px solid transparent' }}>
                <Icon size={17} style={{ opacity: active ? 1 : 0.7 }} />
                {label}
                {active && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#a5b4fc' }} />}
              </Link>
            )
          })}

          {/* Calamity section */}
          {(user?.role === 'Admin' || calamityNavItems.some(i => hasModule(i.module))) && (
            <>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(252,165,165,0.7)', padding: '0.75rem 0.75rem 0.25rem', margin: 0 }}>Calamity & Emergency</p>
              {calamityNavItems.filter(i => user?.role === 'Admin' || hasModule(i.module)).map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/calamity' && pathname.startsWith(href))
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.625rem', padding: '0.625rem 0.75rem', fontSize: '0.875rem', fontWeight: active ? 600 : 400, textDecoration: 'none', transition: 'all 0.15s', background: active ? 'linear-gradient(135deg,rgba(220,38,38,0.4),rgba(185,28,28,0.25))' : 'transparent', color: active ? '#fff' : 'rgba(203,213,225,0.85)', boxShadow: active ? '0 2px 8px rgba(220,38,38,0.25)' : 'none', border: active ? '1px solid rgba(252,165,165,0.2)' : '1px solid transparent' }}>
                    <Icon size={17} style={{ opacity: active ? 1 : 0.7 }} />
                    {label}
                    {active && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fca5a5' }} />}
                  </Link>
                )
              })}
            </>
          )}

          {/* SK section */}
          {(user?.role === 'Admin' || skNavItems.some(i => hasModule(i.module))) && (
            <>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(52,211,153,0.6)', padding: '0.75rem 0.75rem 0.25rem', margin: 0 }}>Sangguniang Kabataan</p>
              {skNavItems.filter(i => user?.role === 'Admin' || hasModule(i.module)).map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/sk' && pathname.startsWith(href))
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.625rem', padding: '0.625rem 0.75rem', fontSize: '0.875rem', fontWeight: active ? 600 : 400, textDecoration: 'none', transition: 'all 0.15s', background: active ? 'linear-gradient(135deg,rgba(16,185,129,0.4),rgba(5,150,105,0.25))' : 'transparent', color: active ? '#fff' : 'rgba(203,213,225,0.85)', boxShadow: active ? '0 2px 8px rgba(16,185,129,0.25)' : 'none', border: active ? '1px solid rgba(52,211,153,0.2)' : '1px solid transparent' }}>
                    <Icon size={17} style={{ opacity: active ? 1 : 0.7 }} />
                    {label}
                    {active && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399' }} />}
                  </Link>
                )
              })}
            </>
          )}

          {/* Admin section */}
          {(can('view:admin') || hasModule('audit_logs') || hasModule('cert_liquidation')) && (
            <>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(165,180,252,0.5)', padding: '0.75rem 0.75rem 0.25rem', margin: 0 }}>Administration</p>
              {[
                { href: '/admin/settings',           label: 'Brgy. Settings',      icon: Settings,     show: can('view:admin') },
                { href: '/admin/users',              label: 'User Management',     icon: ShieldCheck,  show: can('view:admin') },
                { href: '/admin/logs',               label: 'Audit Logs',          icon: ClipboardList,show: can('view:admin') || hasModule('audit_logs') },
                { href: '/certificates/liquidation', label: 'Cert. Liquidation',   icon: Banknote,     show: can('view:admin') || hasModule('cert_liquidation') },
              ].filter(i => i.show).map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.625rem', padding: '0.625rem 0.75rem', fontSize: '0.875rem', fontWeight: active ? 600 : 400, textDecoration: 'none', transition: 'all 0.15s', background: active ? 'linear-gradient(135deg,rgba(99,102,241,0.5),rgba(139,92,246,0.3))' : 'transparent', color: active ? '#fff' : 'rgba(203,213,225,0.85)', border: active ? '1px solid rgba(165,180,252,0.2)' : '1px solid transparent' }}>
                    <Icon size={17} style={{ opacity: active ? 1 : 0.7 }} />
                    {label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* User + logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.875rem' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: '0.625rem', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</p>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: rs.bg, color: rs.color }}>{user.role}</span>
              </div>
            </div>
          )}
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', borderRadius: '0.625rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid transparent', color: 'rgba(203,213,225,0.7)', transition: 'all 0.15s' }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.backgroundColor = 'rgba(239,68,68,0.15)'; b.style.color = '#fca5a5'; b.style.borderColor = 'rgba(239,68,68,0.2)' }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.backgroundColor = 'transparent'; b.style.color = 'rgba(203,213,225,0.7)'; b.style.borderColor = 'transparent' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar-closed { transform: translateX(-100%); }
        .sidebar-open   { transform: translateX(0); }
        .sidebar-mobile-toggle { display: flex; }
        @media (min-width: 1024px) {
          .sidebar-closed { transform: translateX(0); }
          .sidebar-mobile-toggle { display: none !important; }
          .sidebar-overlay { display: none !important; }
        }
      `}</style>
    </>
  )
}
