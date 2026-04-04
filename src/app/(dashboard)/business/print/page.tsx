'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type PermitData = {
  id: string
  business_name: string
  owner_name: string
  business_type: string | null
  address: string | null
  permit_date: string | null
  expiry_date: string | null
  status: string
  created_at: string
}

type Settings = {
  barangay_name: string
  municipality: string
  province: string
  captain_name: string | null
  captain_position: string | null
  logo_url: string | null
  seal_url: string | null
}

function getDaySuffix(d: number) {
  if (d >= 11 && d <= 13) return 'th'
  switch (d % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th' }
}

function BusinessPermitPrint() {
  const params = useSearchParams()
  const id = params.get('id')
  const [data, setData] = useState<PermitData | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [captain, setCaptain] = useState<{ name: string; position: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('business_permits')
      .update({ status: 'Expired' })
      .lt('expiry_date', today)
      .in('status', ['Active', 'Pending'])
      .then(() =>
        Promise.all([
          supabase.from('business_permits').select('*').eq('id', id).single(),
          supabase.from('barangay_settings').select('barangay_name,municipality,province,captain_name,captain_position,logo_url,seal_url').limit(1).single(),
          supabase.from('barangay_officials').select('residents(first_name,last_name),position').eq('position', 'Barangay Captain').eq('status', 'Active').limit(1).single(),
        ]).then(([permit, sett, cap]) => {
          setData(permit.data as PermitData)
          setSettings(sett.data as Settings)
          if (cap.data?.residents) {
            const r = cap.data.residents as { first_name: string; last_name: string }
            setCaptain({ name: `${r.first_name} ${r.last_name}`, position: cap.data.position })
          }
          setLoading(false)
        })
      )
  }, [id])

  useEffect(() => {
    if (!loading && data) setTimeout(() => window.print(), 300)
  }, [loading, data])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading permit...</div>
  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Permit not found.</div>

  const issuedDate = new Date(data.created_at)
  const permitDate = data.permit_date ? new Date(data.permit_date) : null
  const expiryDate = data.expiry_date ? new Date(data.expiry_date) : null
  const signatoryName = captain?.name ?? settings?.captain_name ?? 'HON. [NAME]'
  const signatoryPosition = captain?.position ?? settings?.captain_position ?? 'Barangay Captain'

  const fmt = (d: Date) => d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .permit-page { box-shadow: none !important; margin: 0 !important; }
        }
        body { background: #e5e7eb; font-family: 'Times New Roman', Times, serif; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#1e293b' }}>
        <button onClick={() => window.print()} style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
          Print Permit
        </button>
        <button onClick={() => window.close()} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', cursor: 'pointer', fontSize: '0.875rem', marginLeft: '0.75rem' }}>
          Close
        </button>
      </div>

      {/* Permit page */}
      <div className="permit-page" style={{ width: '8.5in', minHeight: '11in', margin: '1rem auto', backgroundColor: '#fff', padding: '0.6in', boxShadow: '0 4px 24px rgb(0 0 0/0.15)', position: 'relative', boxSizing: 'border-box' }}>

        {/* Borders */}
        <div style={{ position: 'absolute', inset: '0.3in', border: '3px double #92400e', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: '0.35in', border: '1px solid #92400e', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '0.25in' }}>
          <p style={{ margin: 0, fontSize: '11pt', color: '#374151' }}>Republic of the Philippines</p>
          <p style={{ margin: 0, fontSize: '11pt', color: '#374151' }}>{settings?.province ?? 'Province'}</p>
          <p style={{ margin: 0, fontSize: '11pt', color: '#374151' }}>{settings?.municipality ?? 'Municipality'}</p>

          <div style={{ margin: '0.15in 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25in' }}>
            {settings?.logo_url
              ? <img src={settings.logo_url} alt="Logo" style={{ width: '0.8in', height: '0.8in', objectFit: 'contain' }} />
              : <div style={{ width: '0.8in', height: '0.8in', borderRadius: '50%', border: '2px solid #92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt', textAlign: 'center', color: '#92400e', fontWeight: 700, lineHeight: 1.2 }}>BRGY<br />SEAL</div>
            }
            <div>
              <p style={{ margin: 0, fontSize: '16pt', fontWeight: 700, color: '#92400e', letterSpacing: '0.05em' }}>{(settings?.barangay_name ?? 'BARANGAY [NAME]').toUpperCase()}</p>
              <p style={{ margin: 0, fontSize: '10pt', color: '#374151' }}>{settings?.municipality}, {settings?.province}</p>
            </div>
            {settings?.seal_url
              ? <img src={settings.seal_url} alt="Seal" style={{ width: '0.8in', height: '0.8in', objectFit: 'contain' }} />
              : <div style={{ width: '0.8in', height: '0.8in', borderRadius: '50%', border: '2px solid #92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt', textAlign: 'center', color: '#92400e', fontWeight: 700, lineHeight: 1.2 }}>CITY<br />SEAL</div>
            }
          </div>

          <div style={{ borderTop: '2px solid #92400e', borderBottom: '2px solid #92400e', padding: '0.06in 0', margin: '0 0.1in' }}>
            <p style={{ margin: 0, fontSize: '18pt', fontWeight: 700, color: '#92400e', letterSpacing: '0.1em' }}>BUSINESS PERMIT</p>
          </div>
        </div>

        {/* Permit number / date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt', marginBottom: '0.2in', padding: '0 0.1in' }}>
          <p style={{ margin: 0 }}><strong>Permit No.:</strong> {data.id.slice(0, 8).toUpperCase()}</p>
          <p style={{ margin: 0 }}><strong>Date Issued:</strong> {fmt(issuedDate)}</p>
        </div>

        {/* Body */}
        <div style={{ fontSize: '12pt', lineHeight: 1.9, color: '#1f2937', padding: '0 0.1in' }}>
          <p style={{ textIndent: '0.5in', textAlign: 'justify' }}>
            This is to certify that <strong>{data.owner_name.toUpperCase()}</strong> is hereby granted permission to operate and maintain a <strong>{data.business_type ?? 'business'}</strong> establishment known as:
          </p>

          <div style={{ textAlign: 'center', margin: '0.2in 0', padding: '0.15in', border: '1px solid #d97706', borderRadius: '4px', backgroundColor: '#fffbeb' }}>
            <p style={{ margin: 0, fontSize: '16pt', fontWeight: 700, color: '#92400e' }}>{data.business_name.toUpperCase()}</p>
            {data.address && <p style={{ margin: '0.05in 0 0', fontSize: '11pt', color: '#374151' }}>{data.address}</p>}
          </div>

          <p style={{ textIndent: '0.5in', textAlign: 'justify' }}>
            located within the territorial jurisdiction of <strong>{settings?.barangay_name ?? 'this Barangay'}</strong>, {settings?.municipality ?? ''}, {settings?.province ?? ''}, Philippines.
          </p>

          <div style={{ margin: '0.2in 0.1in', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.1in', fontSize: '11pt' }}>
            <p style={{ margin: 0 }}><strong>Business Type:</strong> {data.business_type ?? '—'}</p>
            <p style={{ margin: 0 }}><strong>Status:</strong> {data.status}</p>
            <p style={{ margin: 0 }}><strong>Permit Date:</strong> {permitDate ? fmt(permitDate) : '—'}</p>
            <p style={{ margin: 0 }}><strong>Expiry Date:</strong> {expiryDate ? fmt(expiryDate) : '—'}</p>
          </div>

          <p style={{ textIndent: '0.5in', textAlign: 'justify' }}>
            This permit is issued subject to existing laws, ordinances, and regulations of the Barangay and is valid only for the period stated above.
          </p>

          <p style={{ textIndent: '0.5in', textAlign: 'justify', marginTop: '0.1in' }}>
            Issued this <strong>{issuedDate.getDate()}{getDaySuffix(issuedDate.getDate())}</strong> day of <strong>{issuedDate.toLocaleDateString('en-PH', { month: 'long' })}</strong>, <strong>{issuedDate.getFullYear()}</strong>.
          </p>
        </div>

        {/* Signature */}
        <div style={{ marginTop: '0.5in', padding: '0 0.1in', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', minWidth: '2.5in' }}>
            <div style={{ borderBottom: '1px solid #1f2937', marginBottom: '0.05in', height: '0.5in' }} />
            <p style={{ margin: 0, fontSize: '12pt', fontWeight: 700, color: '#92400e' }}>{signatoryName.toUpperCase()}</p>
            <p style={{ margin: 0, fontSize: '10pt', color: '#374151' }}>{signatoryPosition}</p>
          </div>
        </div>

        {/* Dry seal */}
        <div style={{ position: 'absolute', bottom: '0.5in', left: '0.6in', width: '1in', height: '1in', borderRadius: '50%', border: '1px dashed #9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt', color: '#9ca3af', textAlign: 'center' }}>
          DRY<br />SEAL
        </div>
      </div>
    </>
  )
}

export default function BusinessPermitPrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <BusinessPermitPrint />
    </Suspense>
  )
}
