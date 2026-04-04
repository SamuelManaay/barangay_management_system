'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: users } = await supabase
      .from('app_users')
      .select('id, username, password_hash, full_name, role, is_active, permissions')
      .eq('username', username.trim().toLowerCase())
      .limit(1)

    const user = users?.[0]

    if (!user || !user.is_active) {
      setError('Invalid username or password.')
      setLoading(false)
      return
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      setError('Invalid username or password.')
      setLoading(false)
      return
    }

    // Update last login
    await supabase.from('app_users').update({ last_login: new Date().toISOString() }).eq('id', user.id)

    const sessionUser = { id: user.id, username: user.username, full_name: user.full_name, role: user.role, permissions: user.permissions ?? { residents: true, blotter: true, certificates: true, settlements: true, officials: true, business: true } }
    sessionStorage.setItem('bms_user', JSON.stringify(sessionUser))
    sessionStorage.setItem('bms_auth', 'true')
    router.push(user.role === 'Admin' ? '/dashboard' : '/staff-home')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #f1f5f9 100%)' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', height: '3.5rem', width: '3.5rem', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem', boxShadow: '0 4px 14px rgb(79 70 229 / 0.4)' }}>
            BMS
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Barangay Management</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ borderRadius: '0.5rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#991b1b' }}>
              {error}
            </div>
          )}
          <div>
            <label className="label">Username</label>
            <input className="input" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '0.625rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
