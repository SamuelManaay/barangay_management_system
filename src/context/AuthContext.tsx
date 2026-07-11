'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export type UserRole = 'Admin' | 'Staff' | 'Readonly'

export type ModuleKey =
  | 'residents' | 'blotter' | 'certificates' | 'settlements'
  | 'officials' | 'business' | 'staff' | 'audit_logs' | 'cert_liquidation'
  | 'sk_dashboard' | 'sk_officials' | 'sk_youth' | 'sk_events' | 'sk_projects' | 'sk_finance' | 'sk_scholarships'
  | 'cal_dashboard' | 'cal_incidents' | 'cal_requests' | 'cal_centers' | 'cal_relief' | 'cal_damage' | 'cal_tanods' | 'cal_patrol' | 'cal_electricity'

export type ModulePermission = {
  enabled: boolean
  can_add: boolean
  can_update: boolean
  can_delete: boolean
}

export type AppUser = {
  id: string
  username: string
  full_name: string
  role: UserRole
  permissions: Record<ModuleKey, ModulePermission>
}

export type Permission =
  | 'view:residents'    | 'manage:residents'
  | 'view:blotter'      | 'manage:blotter'
  | 'view:certificates' | 'manage:certificates'
  | 'view:settlements'  | 'manage:settlements'
  | 'view:officials'    | 'manage:officials'
  | 'view:business'     | 'manage:business'
  | 'view:admin'        | 'manage:admin'

type AuthContextType = {
  user: AppUser | null
  loading: boolean
  logout: () => void
  can: (action: Permission) => boolean
  hasModule: (module: ModuleKey) => boolean
  canDo: (module: ModuleKey, action: 'can_add' | 'can_update' | 'can_delete') => boolean
}

export const FULL_PERM: ModulePermission = { enabled: true, can_add: true, can_update: true, can_delete: true }
export const NO_PERM: ModulePermission   = { enabled: false, can_add: false, can_update: false, can_delete: false }

export const ALL_MODULE_KEYS: ModuleKey[] = [
  'residents','blotter','certificates','settlements','officials','business','staff','audit_logs','cert_liquidation',
  'sk_dashboard','sk_officials','sk_youth','sk_events','sk_projects','sk_finance','sk_scholarships',
  'cal_dashboard','cal_incidents','cal_requests','cal_centers','cal_relief','cal_damage','cal_tanods','cal_patrol','cal_electricity',
]

export function makeDefaultPerms(full = false): Record<ModuleKey, ModulePermission> {
  return Object.fromEntries(
    ALL_MODULE_KEYS.map(k => [k, full ? { ...FULL_PERM } : { ...NO_PERM }])
  ) as Record<ModuleKey, ModulePermission>
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  logout: () => {}, can: () => false, hasModule: () => false, canDo: () => false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const stored = sessionStorage.getItem('bms_user')
    if (stored) {
      const parsed: AppUser = JSON.parse(stored)
      // Always re-fetch fresh permissions from DB to pick up any admin changes
      supabase
        .from('app_users')
        .select('permissions, is_active')
        .eq('id', parsed.id)
        .single()
        .then(({ data }) => {
          if (!data || !data.is_active) {
            sessionStorage.removeItem('bms_user')
            sessionStorage.removeItem('bms_auth')
            router.replace('/login')
            return
          }
          const fresh: AppUser = { ...parsed, permissions: data.permissions ?? parsed.permissions }
          sessionStorage.setItem('bms_user', JSON.stringify(fresh))
          setUser(fresh)
          if (fresh.role !== 'Admin' && pathname === '/dashboard') router.replace('/staff-home')
          if (fresh.role === 'Admin' && pathname === '/staff-home') router.replace('/dashboard')
          setLoading(false)
        })
    } else if (pathname !== '/login') {
      router.replace('/login')
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [pathname, router])

  function logout() {
    sessionStorage.removeItem('bms_user')
    sessionStorage.removeItem('bms_auth')
    setUser(null)
    router.push('/login')
  }

  function hasModule(module: ModuleKey): boolean {
    if (!user) return false
    if (user.role === 'Admin') return true
    return user.permissions?.[module]?.enabled ?? false
  }

  function canDo(module: ModuleKey, action: 'can_add' | 'can_update' | 'can_delete'): boolean {
    if (!user) return false
    if (user.role === 'Admin') return true
    const p = user.permissions?.[module]
    return (p?.enabled && p?.[action]) ?? false
  }

  function can(action: Permission): boolean {
    if (!user) return false
    const [type, module] = action.split(':') as ['view' | 'manage', string]
    if (module === 'admin') return user.role === 'Admin'
    const mod = module as ModuleKey
    if (!hasModule(mod)) return false
    if (type === 'view') return true
    return user.role !== 'Readonly'
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, can, hasModule, canDo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
