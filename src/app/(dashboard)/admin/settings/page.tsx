'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Upload, Save } from 'lucide-react'

type Settings = {
  id: string
  barangay_name: string
  municipality: string
  province: string
  region: string
  captain_name: string
  captain_position: string
  logo_url: string
  seal_url: string
  contact_number: string
  email: string
  address: string
}

const empty: Omit<Settings, 'id'> = {
  barangay_name: '', municipality: '', province: '', region: '',
  captain_name: '', captain_position: 'Barangay Captain',
  logo_url: '', seal_url: '', contact_number: '', email: '', address: '',
}

export default function SettingsPage() {
  const { can, loading: authLoading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState(empty)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSeal, setUploadingSeal] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const sealRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !can('view:admin')) router.replace('/dashboard')
  }, [authLoading, can, router])

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    const [{ data }, { data: captainData }] = await Promise.all([
      supabase.from('barangay_settings').select('*').limit(1).single(),
      supabase.from('barangay_officials')
        .select('residents(first_name, last_name), position')
        .eq('position', 'Barangay Captain')
        .eq('status', 'Active')
        .limit(1)
        .single(),
    ])
    if (data) {
      setSettingsId(data.id)
      setForm({
        barangay_name:    data.barangay_name    ?? '',
        municipality:     data.municipality     ?? '',
        province:         data.province         ?? '',
        region:           data.region           ?? '',
        captain_name:     captainData?.residents
          ? `${(captainData.residents as { first_name: string; last_name: string }).first_name} ${(captainData.residents as { first_name: string; last_name: string }).last_name}`
          : (data.captain_name ?? ''),
        captain_position: captainData?.position ?? data.captain_position ?? 'Barangay Captain',
        logo_url:         data.logo_url         ?? '',
        seal_url:         data.seal_url         ?? '',
        contact_number:   data.contact_number   ?? '',
        email:            data.email            ?? '',
        address:          data.address          ?? '',
      })
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, updated_at: new Date().toISOString() }
    if (settingsId) {
      await supabase.from('barangay_settings').update(payload).eq('id', settingsId)
    } else {
      const { data } = await supabase.from('barangay_settings').insert(payload).select().single()
      if (data) setSettingsId(data.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleImageUpload(file: File, field: 'logo_url' | 'seal_url') {
    const setter = field === 'logo_url' ? setUploadingLogo : setUploadingSeal
    setter(true)
    const ext = file.name.split('.').pop()
    const path = `${field}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('barangay-assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('barangay-assets').getPublicUrl(path)
      setForm(f => ({ ...f, [field]: data.publicUrl }))
    }
    setter(false)
  }

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Loading settings...</div>

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Barangay Settings</h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>Configure barangay information used across the system and certificates.</p>
      </div>

      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Logo & Seal */}
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>Logo & Seal</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Logo */}
            <div>
              <label className="label">Barangay Logo</label>
              <div
                onClick={() => logoRef.current?.click()}
                style={{ border: '2px dashed #cbd5e1', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
              >
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" style={{ height: '5rem', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    <Upload size={24} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                    Click to upload logo
                  </div>
                )}
                {uploadingLogo && <p style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.5rem' }}>Uploading...</p>}
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo_url')} />
              {form.logo_url && (
                <input className="input" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }} value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="Or paste image URL" />
              )}
            </div>

            {/* Seal */}
            <div>
              <label className="label">City / Municipal Seal</label>
              <div
                onClick={() => sealRef.current?.click()}
                style={{ border: '2px dashed #cbd5e1', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
              >
                {form.seal_url ? (
                  <img src={form.seal_url} alt="Seal" style={{ height: '5rem', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    <Upload size={24} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                    Click to upload seal
                  </div>
                )}
                {uploadingSeal && <p style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.5rem' }}>Uploading...</p>}
              </div>
              <input ref={sealRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'seal_url')} />
              {form.seal_url && (
                <input className="input" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }} value={form.seal_url} onChange={e => set('seal_url', e.target.value)} placeholder="Or paste image URL" />
              )}
            </div>
          </div>
        </div>

        {/* Barangay Info */}
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>Barangay Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Barangay Name *</label>
              <input className="input" value={form.barangay_name} onChange={e => set('barangay_name', e.target.value)} placeholder="e.g. Barangay Mansilingan" />
            </div>
            <div>
              <label className="label">Municipality / City</label>
              <input className="input" value={form.municipality} onChange={e => set('municipality', e.target.value)} placeholder="e.g. Bacolod City" />
            </div>
            <div>
              <label className="label">Province</label>
              <input className="input" value={form.province} onChange={e => set('province', e.target.value)} placeholder="e.g. Negros Occidental" />
            </div>
            <div>
              <label className="label">Region</label>
              <input className="input" value={form.region} onChange={e => set('region', e.target.value)} placeholder="e.g. Region VI" />
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input className="input" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} placeholder="e.g. 034-123-4567" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="brgy@example.gov.ph" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Full Address</label>
              <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. Purok 1, Barangay Mansilingan, Bacolod City" />
            </div>
          </div>
        </div>

        {/* Captain Info */}
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>Signatory</h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>Auto-synced from Barangay Officials. To change, update the active Barangay Captain in the Officials page.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Captain / Signatory Name</label>
              <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: form.captain_name ? '#1e293b' : '#94a3b8', minHeight: '2.375rem' }}>
                {form.captain_name || 'Not set — add a Barangay Captain in Officials'}
              </div>
            </div>
            <div>
              <label className="label">Position</label>
              <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: form.captain_position ? '#1e293b' : '#94a3b8', minHeight: '2.375rem' }}>
                {form.captain_position || 'Barangay Captain'}
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !can('manage:admin')}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 500 }}>✓ Settings saved successfully</span>}
          {!can('manage:admin') && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>You have read-only access to settings.</span>}
        </div>
      </div>
    </div>
  )
}
