'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export type UserRole = 'Admin' | 'Staff' | 'Readonly'

export type ModuleKey = 'residents' | 'blotter' | 'certificates' | 'settlements' | 'officials' | 'business' | 'staff'

export type AppUser = {
  id: string
  username: string
  full_name: string
  role: UserRole
  permissions: Record<ModuleKey, boolean>
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
}

const BASE_MANAGE: Record<UserRole, ModuleKey[]> = {
  Admin:    ['residents','blotter','certificates','settlements','officials','business','staff'],
  Staff:    ['residents','blotter','certificates','settlements','business','staff'],
  Readonly: [],
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  logout: () => {}, can: () => false, hasModule: () => false,
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
      setUser(parsed)
      // Redirect non-admins away from admin-only dashboard
      if (parsed.role !== 'Admin' && pathname === '/dashboard') {
        router.replace('/staff-home')
      }
      // Redirect admins away from staff home
      if (parsed.role === 'Admin' && pathname === '/staff-home') {
        router.replace('/dashboard')
      }
    } else if (pathname !== '/login') {
      router.replace('/login')
    }
    setLoading(false)
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
    return user.permissions?.[module] ?? false
  }

  function can(action: Permission): boolean {
    if (!user) return false
    const [type, module] = action.split(':') as ['view' | 'manage', string]
    if (module === 'admin') return user.role === 'Admin'
    const mod = module as ModuleKey
    if (!hasModule(mod)) return false
    if (type === 'view') return true
    return BASE_MANAGE[user.role].includes(mod)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, can, hasModule }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
