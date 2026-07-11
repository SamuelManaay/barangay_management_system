import { useEffect, createContext, useContext, useState, ReactNode } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Resident = {
  id: string
  first_name: string
  last_name: string
  purok?: string
  primary_contact?: string
}

type StaffPermission = {
  enabled: boolean
  can_add: boolean
  can_update: boolean
  can_delete: boolean
}

type StaffUser = {
  id: string
  username: string
  full_name: string
  role: string
  permissions?: Record<string, StaffPermission>
}

type AuthCtx = {
  resident: Resident | null
  staffUser: StaffUser | null
  sessionType: 'resident' | 'staff' | null
  loading: boolean
  login: (id: string) => Promise<boolean>
  enterStaffSession: (user?: StaffUser) => void
  logout: () => void
  hasStaffAccess: (module: string) => boolean
  canStaffAccess: (module: string, action: 'can_add' | 'can_update' | 'can_delete') => boolean
}

const AuthContext = createContext<AuthCtx>({
  resident: null,
  staffUser: null,
  sessionType: null,
  loading: true,
  login: async () => false,
  enterStaffSession: () => {},
  logout: () => {},
  hasStaffAccess: () => false,
  canStaffAccess: () => false,
})

export function useAuth() { return useContext(AuthContext) }

function AuthProvider({ children }: { children: ReactNode }) {
  const [resident, setResident] = useState<Resident | null>(null)
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null)
  const [sessionType, setSessionType] = useState<'resident' | 'staff' | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [residentSession, staffSession] = await Promise.all([
          AsyncStorage.getItem('resident_session'),
          AsyncStorage.getItem('bms_user'),
        ])

        if (residentSession) {
          setResident(JSON.parse(residentSession))
          setStaffUser(null)
          setSessionType('resident')
          setLoading(false)
        } else if (staffSession) {
          const parsed: StaffUser = JSON.parse(staffSession)
          // Fetch fresh permissions from database to pick up admin changes
          const { data } = await supabase
            .from('app_users')
            .select('permissions, is_active, role')
            .eq('id', parsed.id)
            .single()

          if (!data || !data.is_active) {
            AsyncStorage.removeItem('bms_user')
            AsyncStorage.removeItem('bms_auth')
            setResident(null)
            setStaffUser(null)
            setSessionType(null)
          } else {
            const fresh: StaffUser = { ...parsed, permissions: data.permissions ?? parsed.permissions, role: data.role }
            AsyncStorage.setItem('bms_user', JSON.stringify(fresh))
            setResident(null)
            setStaffUser(fresh)
            setSessionType('staff')
          }
          setLoading(false)
        } else {
          setResident(null)
          setStaffUser(null)
          setSessionType(null)
          setLoading(false)
        }
      } catch {
        setResident(null)
        setStaffUser(null)
        setSessionType(null)
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  useEffect(() => {
    if (loading) return

    const inAuth = segments[0] === '(tabs)'
    const hasResidentSession = !!resident
    const hasStaffSession = sessionType === 'staff'

    if (!hasResidentSession && !hasStaffSession && inAuth) {
      router.replace('/')
      return
    }

    if ((hasResidentSession || hasStaffSession) && !inAuth) {
      router.replace(hasStaffSession ? '/(tabs)/dashboard' : '/(tabs)/home')
    }
  }, [resident, sessionType, loading, segments, router])

  async function login(residentId: string): Promise<boolean> {
    const { data } = await supabase
      .from('residents')
      .select('id, first_name, last_name, purok, primary_contact')
      .eq('id', residentId)
      .single()
    if (!data) return false
    await AsyncStorage.setItem('resident_session', JSON.stringify(data))
    setResident(data)
    setStaffUser(null)
    setSessionType('resident')
    return true
  }

  function enterStaffSession(user?: StaffUser) {
    setResident(null)
    setStaffUser(user ?? null)
    setSessionType('staff')
  }

  function logout() {
    AsyncStorage.removeItem('resident_session')
    AsyncStorage.removeItem('bms_user')
    AsyncStorage.removeItem('bms_auth')
    setResident(null)
    setStaffUser(null)
    setSessionType(null)
  }

  function hasStaffAccess(module: string) {
    if (!staffUser) return false
    if (staffUser.role === 'Admin') return true
    return staffUser.permissions?.[module]?.enabled ?? false
  }

  function canStaffAccess(module: string, action: 'can_add' | 'can_update' | 'can_delete') {
    if (!staffUser) return false
    if (staffUser.role === 'Admin') return true
    const permission = staffUser.permissions?.[module]
    return (permission?.enabled && permission?.[action]) ?? false
  }

  return (
    <AuthContext.Provider value={{ resident, staffUser, sessionType, loading, login, enterStaffSession, logout, hasStaffAccess, canStaffAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
