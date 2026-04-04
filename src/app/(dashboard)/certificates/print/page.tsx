'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

type IssuanceData = {
  id: string
  purpose: string | null
  cedula_number: string | null
  or_number: string | null
  signed_by_name: string | null
  signed_by_position: string | null
  issued_at: string | null
  residents: {
    first_name: string
    middle_name: string | null
    last_name: string
    birth_date: string | null
    birth_place: string | null
    purok: string | null
    civil_status: string | null
    gender: string | null
  } | null
  certificate_types: {
    name: string
  } | null
}

function CertificatePrint() {
  const params = useSearchParams()
  const id = params.get('id')
  const [data, setData] = useState<IssuanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<{ barangay_name: string; municipality: string; province: string; captain_name: string | null; captain_position: string | null; logo_url: string | null; seal_url: string | null } | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('certificate_issuances').select('*, residents(first_name, middle_name, last_name, birth_date, birth_place, purok, civil_status, gender), certificate_types(name)').eq('id', id).single(),
      supabase.from('barangay_settings').select('barangay_name, municipality, province, captain_name, captain_position, logo_url, seal_url').limit(1).single(),
    ]).then(([cert, sett]) => {
      setData(cert.data as IssuanceData | null)
      setSettings(sett.data)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => window.print(), 300)
    }
  }, [loading, data])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading certificate...</div>
  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Certificate not found.</div>

  const r = data.residents
  const fullName = r ? `${r.first_name} ${r.middle_name ? r.middle_name + ' ' : ''}${r.last_name}`.toUpperCase() : ''
  const certName = data.certificate_types?.name ?? ''
  const issuedDate = data.issued_at ? new Date(data.issued_at) : new Date()
  const dateStr = issuedDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  const age = r?.birth_date ? Math.floor((Date.now() - new Date(r.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .cert-page { box-shadow: none !important; margin: 0 !important; }
        }
        body { background: #e5e7eb; font-family: 'Times New Roman', Times, serif; }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#1e293b' }}>
        <button
          onClick={() => window.print()}
          style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
        >
          Print Certificate
        </button>
        <button
          onClick={() => window.close()}
          style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', cursor: 'pointer', fontSize: '0.875rem', marginLeft: '0.75rem' }}
        >
          Close
        </button>
      </div>

      {/* Certificate */}
      <div className="cert-page" style={{
        width: '8.5in', minHeight: '11in', margin: '1rem auto',
        backgroundColor: '#fff', padding: '0.6in',
        boxShadow: '0 4px 24px rgb(0 0 0 / 0.15)',
        position: 'relative', boxSizing: 'border-box',
      }}>
        {/* Outer border */}
        <div style={{ position: 'absolute', inset: '0.3in', border: '3px double #1e3a5f', pointerEvents: 'none' }} />
        {/* Inner border */}
        <div style={{ position: 'absolute', inset: '0.35in', border: '1px solid #1e3a5f', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '0.3in' }}>
          <p style={{ margin: 0, fontSize: '11pt', letterSpacing: '0.05em', color: '#374151' }}>Republic of the Philippines</p>
          <p style={{ margin: 0, fontSize: '11pt', color: '#374151' }}>{settings?.province ?? 'Province of Negros Occidental'}</p>
          <p style={{ margin: 0, fontSize: '11pt', color: '#374151' }}>{settings?.municipality ?? 'City of Bacolod'}</p>
          <div style={{ margin: '0.15in 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25in' }}>
            {/* Seal placeholder */}
            {settings?.logo_url
              ? <img src={settings.logo_url} alt="Logo" style={{ width: '0.8in', height: '0.8in', objectFit: 'contain' }} />
              : <div style={{ width: '0.8in', height: '0.8in', borderRadius: '50%', border: '2px solid #1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt', textAlign: 'center', color: '#1e3a5f', fontWeight: 700, lineHeight: 1.2 }}>BRGY<br/>SEAL</div>
            }
            <div>
              <p style={{ margin: 0, fontSize: '16pt', fontWeight: 700, color: '#1e3a5f', letterSpacing: '0.05em' }}>{(settings?.barangay_name ?? 'BARANGAY [NAME]').toUpperCase()}</p>
              <p style={{ margin: 0, fontSize: '10pt', color: '#374151' }}>{settings?.municipality ?? 'Bacolod City'}, {settings?.province ?? 'Negros Occidental'}</p>
            </div>
            {settings?.seal_url
              ? <img src={settings.seal_url} alt="Seal" style={{ width: '0.8in', height: '0.8in', objectFit: 'contain' }} />
              : <div style={{ width: '0.8in', height: '0.8in', borderRadius: '50%', border: '2px solid #1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt', textAlign: 'center', color: '#1e3a5f', fontWeight: 700, lineHeight: 1.2 }}>CITY<br/>SEAL</div>
            }
          </div>
          <div style={{ borderTop: '2px solid #1e3a5f', borderBottom: '2px solid #1e3a5f', padding: '0.06in 0', margin: '0 0.1in' }}>
            <p style={{ margin: 0, fontSize: '18pt', fontWeight: 700, color: '#1e3a5f', letterSpacing: '0.1em' }}>
              {certName.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ fontSize: '12pt', lineHeight: 1.8, color: '#1f2937', padding: '0 0.1in' }}>
          <p style={{ textAlign: 'right', marginBottom: '0.2in' }}>
            <strong>Date:</strong> {dateStr}
          </p>

          <p style={{ textIndent: '0.5in', marginBottom: '0.15in' }}>
            <strong>TO WHOM IT MAY CONCERN:</strong>
          </p>

          {certName === 'Barangay Clearance' && (
            <p style={{ textIndent: '0.5in', textAlign: 'justify' }}>
              This is to certify that <strong>{fullName}</strong>,{age ? ` ${age} years of age,` : ''} {r?.civil_status ? `${r.civil_status},` : ''} a resident of <strong>{r?.purok ?? 'this barangay'}</strong>, is known to be a person of good moral character and has no derogatory record on file in this office as of this date.
            </p>
          )}

          {certName === 'Certificate of Residency' && (
            <p style={{ textIndent: '0.5in', textAlign: 'justify' }}>
              This is to certify that <strong>{fullName}</strong>,{age ? ` ${age} years of age,` : ''} {r?.civil_status ? `${r.civil_status},` : ''} is a bonafide resident of <strong>{r?.purok ?? 'this barangay'}</strong>, Bacolod City, Negros Occidental, Philippines.
            </p>
          )}

          {certName === 'Certificate of Indigency' && (
            <p style={{ textIndent: '0.5in', textAlign: 'justify' }}>
              This is to certify that <strong>{fullName}</strong>,{age ? ` ${age} years of age,` : ''} {r?.civil_status ? `${r.civil_status},` : ''} a resident of <strong>{r?.purok ?? 'this barangay'}</strong>, belongs to an indigent family and is in need of financial assistance.
            </p>
          )}

          {certName === 'Certificate of Good Moral' && (
            <p style={{ textIndent: '0.5in', textAlign: 'justify' }}>
              This is to certify that <strong>{fullName}</strong>,{age ? ` ${age} years of age,` : ''} {r?.civil_status ? `${r.civil_status},` : ''} a resident of <strong>{r?.purok ?? 'this barangay'}</strong>, is known in this community to be a person of good moral character, law-abiding, and has no pending criminal case on file in this office.
            </p>
          )}

          {certName === 'Authority to Travel' && (
            <p style={{ textIndent: '0.5in', textAlign: 'justify' }}>
              This is to certify that <strong>{fullName}</strong>,{age ? ` ${age} years of age,` : ''} {r?.civil_status ? `${r.civil_status},` : ''} a resident of <strong>{r?.purok ?? 'this barangay'}</strong>, is hereby given authority to travel as requested.
            </p>
          )}

          {!['Barangay Clearance','Certificate of Residency','Certificate of Indigency','Certificate of Good Moral','Authority to Travel'].includes(certName) && (
            <p style={{ textIndent: '0.5in', textAlign: 'justify' }}>
              This is to certify that <strong>{fullName}</strong>,{age ? ` ${age} years of age,` : ''} {r?.civil_status ? `${r.civil_status},` : ''} a resident of <strong>{r?.purok ?? 'this barangay'}</strong>, is hereby certified as requested.
            </p>
          )}

          {data.purpose && (
            <p style={{ textIndent: '0.5in', textAlign: 'justify', marginTop: '0.1in' }}>
              This certification is issued upon the request of the above-named person for the purpose of <strong>{data.purpose}</strong> and for whatever legal purpose it may serve.
            </p>
          )}

          <p style={{ textIndent: '0.5in', textAlign: 'justify', marginTop: '0.1in' }}>
            Issued this <strong>{issuedDate.getDate()}{getDaySuffix(issuedDate.getDate())}</strong> day of <strong>{issuedDate.toLocaleDateString('en-PH', { month: 'long' })}</strong>, <strong>{issuedDate.getFullYear()}</strong> at {settings?.barangay_name ?? 'Barangay [Name]'}, {settings?.municipality ?? 'Bacolod City'}, {settings?.province ?? 'Negros Occidental'}, Philippines.
          </p>
        </div>

        {/* Signature block */}
        <div style={{ marginTop: '0.5in', padding: '0 0.1in', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Cedula / OR */}
          <div style={{ fontSize: '10pt', color: '#374151' }}>
            {data.cedula_number && <p style={{ margin: '0.05in 0' }}><strong>CTC No.:</strong> {data.cedula_number}</p>}
            {data.or_number && <p style={{ margin: '0.05in 0' }}><strong>O.R. No.:</strong> {data.or_number}</p>}
            <p style={{ margin: '0.05in 0' }}><strong>Doc. No.:</strong> ___________</p>
            <p style={{ margin: '0.05in 0' }}><strong>Page No.:</strong> ___________</p>
            <p style={{ margin: '0.05in 0' }}><strong>Book No.:</strong> ___________</p>
            <p style={{ margin: '0.05in 0' }}><strong>Series of:</strong> {issuedDate.getFullYear()}</p>
          </div>

          {/* Signature */}
          <div style={{ textAlign: 'center', minWidth: '2.5in' }}>
            <div style={{ borderBottom: '1px solid #1f2937', marginBottom: '0.05in', height: '0.5in' }} />
            <p style={{ margin: 0, fontSize: '12pt', fontWeight: 700, color: '#1e3a5f' }}>
              {data.signed_by_name ?? settings?.captain_name ?? 'HON. [NAME]'}
            </p>
            <p style={{ margin: 0, fontSize: '10pt', color: '#374151' }}>
              {data.signed_by_position ?? settings?.captain_position ?? 'Barangay Captain'}
            </p>
          </div>
        </div>

        {/* Dry seal area */}
        <div style={{ position: 'absolute', bottom: '0.5in', left: '0.6in', width: '1in', height: '1in', borderRadius: '50%', border: '1px dashed #9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt', color: '#9ca3af', textAlign: 'center' }}>
          DRY<br/>SEAL
        </div>
      </div>
    </>
  )
}

function getDaySuffix(d: number) {
  if (d >= 11 && d <= 13) return 'th'
  switch (d % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th' }
}

export default function CertificatePrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <CertificatePrint />
    </Suspense>
  )
}
