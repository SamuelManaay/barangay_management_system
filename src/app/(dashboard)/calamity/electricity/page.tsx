'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Zap, MapPin, Clock, Users, AlertTriangle, CheckCircle, Plus, Phone, Map } from 'lucide-react'
import MapComponent from '@/components/MapComponent'

type ElectricityIssue = {
  id: string
  issue_type: string
  location: string
  coordinates: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  reported_by: string | null
  contact_number: string | null
  priority: string
  status: string
  affected_households: number
  estimated_duration: string | null
  utility_company_notified: boolean
  reported_at: string
  resolved_at: string | null
}

type Stats = {
  activeIssues: number
  resolvedToday: number
  totalAffectedHouseholds: number
  avgResolutionTime: string
}

const priorityStyle: Record<string, { bg: string; color: string }> = {
  Low: { bg: '#d1fae5', color: '#065f46' },
  Medium: { bg: '#fef3c7', color: '#92400e' },
  High: { bg: '#fee2e2', color: '#991b1b' },
  Critical: { bg: '#fce7f3', color: '#9d174d' },
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  Reported: { bg: '#fef3c7', color: '#92400e' },
  Investigating: { bg: '#dbeafe', color: '#1e40af' },
  'In Progress': { bg: '#e0e7ff', color: '#3730a3' },
  Resolved: { bg: '#d1fae5', color: '#065f46' },
}

export default function ElectricityDashboard() {
  const [issues, setIssues] = useState<ElectricityIssue[]>([])
  const [stats, setStats] = useState<Stats>({ activeIssues: 0, resolvedToday: 0, totalAffectedHouseholds: 0, avgResolutionTime: '0h' })
  const [loading, setLoading] = useState(true)
  const [showReportForm, setShowReportForm] = useState(false)
  const [formData, setFormData] = useState({
    issue_type: 'Power Outage',
    location: '',
    coordinates: '',
    description: '',
    reported_by: '',
    contact_number: '',
    priority: 'Medium',
    affected_households: 1,
    estimated_duration: ''
  })
  const [showMap, setShowMap] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 10.374054, lng: 122.868825 }) // Your barangay location
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [viewingIssue, setViewingIssue] = useState<ElectricityIssue | null>(null)

  function getCoords(issue: ElectricityIssue): { lat: number; lng: number } | null {
    if (issue.latitude != null && issue.longitude != null) return { lat: issue.latitude, lng: issue.longitude }
    if (issue.coordinates) {
      const parts = issue.coordinates.split(',')
      if (parts.length === 2) return { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) }
    }
    return null
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [issuesRes, activeRes, resolvedRes, householdsRes] = await Promise.all([
      supabase.from('cal_electricity_issues').select('*').order('reported_at', { ascending: false }).limit(10),
      supabase.from('cal_electricity_issues').select('id', { count: 'exact', head: true }).neq('status', 'Resolved'),
      supabase.from('cal_electricity_issues').select('id', { count: 'exact', head: true }).eq('status', 'Resolved').gte('resolved_at', new Date().toISOString().split('T')[0]),
      supabase.from('cal_electricity_issues').select('affected_households').neq('status', 'Resolved')
    ])

    const totalHouseholds = (householdsRes.data ?? []).reduce((sum, item) => sum + (item.affected_households || 0), 0)

    setIssues(issuesRes.data ?? [])
    setStats({
      activeIssues: activeRes.count ?? 0,
      resolvedToday: resolvedRes.count ?? 0,
      totalAffectedHouseholds: totalHouseholds,
      avgResolutionTime: '2.5h' // Placeholder - would calculate from actual data
    })
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const submitData = {
      ...formData,
      coordinates: selectedLocation ? `${selectedLocation.lat},${selectedLocation.lng}` : formData.coordinates
    }
    const { error } = await supabase.from('cal_electricity_issues').insert([submitData])
    if (!error) {
      setShowReportForm(false)
      setFormData({ issue_type: 'Power Outage', location: '', coordinates: '', description: '', reported_by: '', contact_number: '', priority: 'Medium', affected_households: 1, estimated_duration: '' })
      setSelectedLocation(null)
      setShowMap(false)
      loadData()
    }
  }

  async function updateStatus(id: string, status: string) {
    const updates: any = { status, updated_at: new Date().toISOString() }
    if (status === 'Resolved') updates.resolved_at = new Date().toISOString()
    
    await supabase.from('cal_electricity_issues').update(updates).eq('id', id)
    loadData()
  }

  const statCards = [
    { label: 'Active Issues', value: stats.activeIssues, icon: Zap, color: '#dc2626' },
    { label: 'Resolved Today', value: stats.resolvedToday, icon: CheckCircle, color: '#059669' },
    { label: 'Affected Households', value: stats.totalAffectedHouseholds, icon: Users, color: '#ea580c' },
    { label: 'Avg Resolution', value: stats.avgResolutionTime, icon: Clock, color: '#7c3aed' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ borderRadius: '1rem', background: 'linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#60a5fa 100%)', padding: '1.5rem 2rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Zap size={24} style={{ color: '#fbbf24' }} />
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Electricity Issues Dashboard</h1>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#bfdbfe' }}>Track and manage power outages and electrical issues</p>
            </div>
            <button
              onClick={() => setShowReportForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
            >
              <Plus size={16} />
              Report Issue
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', backgroundColor: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{loading ? '—' : card.value}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{card.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Issues List */}
      <div style={{ borderRadius: '1rem', background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Recent Issues</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Type</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Location</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Priority</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Households</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Reported</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</td></tr>
              ) : issues.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No issues reported</td></tr>
              ) : issues.map(issue => {
                const priority = priorityStyle[issue.priority] ?? { bg: '#f1f5f9', color: '#475569' }
                const status = statusStyle[issue.status] ?? { bg: '#f1f5f9', color: '#475569' }
                return (
                  <tr key={issue.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>{issue.issue_type}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} style={{ color: getCoords(issue) ? '#059669' : '#64748b' }} />
                        <span>{issue.location}</span>
                        {getCoords(issue) && (
                          <a href={`https://maps.google.com/?q=${getCoords(issue)!.lat},${getCoords(issue)!.lng}`} target="_blank" rel="noreferrer"
                            style={{ fontSize: '0.7rem', backgroundColor: '#d1fae5', color: '#065f46', padding: '0.1rem 0.3rem', borderRadius: '0.25rem', marginLeft: '0.25rem', textDecoration: 'none', fontWeight: 600 }}>
                            GPS
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: priority.bg, color: priority.color }}>
                        {issue.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: status.bg, color: status.color }}>
                        {issue.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', textAlign: 'center' }}>{issue.affected_households}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(issue.reported_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setViewingIssue(issue)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #3b82f6', backgroundColor: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
                        >
                          <MapPin size={12} />
                          View
                        </button>
                        {issue.status !== 'Resolved' && (
                          <select
                            value={issue.status}
                            onChange={(e) => updateStatus(issue.id, e.target.value)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
                          >
                            <option value="Reported">Reported</option>
                            <option value="Investigating">Investigating</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Form Modal */}
      {showReportForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 700 }}>Report Electricity Issue</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Issue Type</label>
                <select
                  value={formData.issue_type}
                  onChange={(e) => setFormData({...formData, issue_type: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                >
                  <option value="Power Outage">Power Outage</option>
                  <option value="Damaged Lines">Damaged Lines</option>
                  <option value="Transformer Issue">Transformer Issue</option>
                  <option value="Street Light">Street Light</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Location *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Street, Zone, or specific area"
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: showMap ? '#3b82f6' : '#fff', color: showMap ? '#fff' : '#374151', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    <Map size={16} />
                    {showMap ? 'Hide Map' : 'Pin Location'}
                  </button>
                </div>
                {selectedLocation && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#059669' }}>
                    📍 Location pinned: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
              
              {/* Map Section */}
              {showMap && (
                <div style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>📍 Click on the map to pin the exact location</p>
                  </div>
                  <MapComponent
                    center={mapCenter}
                    zoom={16}
                    height="300px"
                    onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
                    markers={selectedLocation ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng, color: 'blue' }] : []}
                    clickable={true}
                    mapKey="report-map"
                  />
                  <div style={{ backgroundColor: '#f9fafb', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    💡 Tip: For mobile app, this will use GPS to automatically detect your location
                  </div>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Additional details about the issue"
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Reported By</label>
                  <input
                    type="text"
                    value={formData.reported_by}
                    onChange={(e) => setFormData({...formData, reported_by: e.target.value})}
                    placeholder="Your name"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Contact Number</label>
                  <input
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                    placeholder="Phone number"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Affected Households</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.affected_households}
                    onChange={(e) => setFormData({...formData, affected_households: parseInt(e.target.value) || 1})}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportForm(false)
                    setShowMap(false)
                    setSelectedLocation(null)
                  }}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Issue Modal */}
      {viewingIssue && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} style={{ color: '#3b82f6' }} />
                Issue Details
              </h3>
              <button
                onClick={() => setViewingIssue(null)}
                style={{ padding: '0.25rem', borderRadius: '0.25rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Issue Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Issue Type</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{viewingIssue.issue_type}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Priority</p>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: priorityStyle[viewingIssue.priority]?.bg || '#f1f5f9', color: priorityStyle[viewingIssue.priority]?.color || '#475569' }}>
                    {viewingIssue.priority}
                  </span>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</p>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: statusStyle[viewingIssue.status]?.bg || '#f1f5f9', color: statusStyle[viewingIssue.status]?.color || '#475569' }}>
                    {viewingIssue.status}
                  </span>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Affected Households</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{viewingIssue.affected_households}</p>
                </div>
              </div>
              
              {/* Location & Contact */}
              <div>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>📍 Location</p>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#374151' }}>{viewingIssue.location}</p>
                {getCoords(viewingIssue) && (
                  <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: '#059669' }}>GPS: {getCoords(viewingIssue)!.lat.toFixed(6)}, {getCoords(viewingIssue)!.lng.toFixed(6)}</p>
                )}
                {getCoords(viewingIssue) && (
                  <div style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ backgroundColor: '#f9fafb', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Issue Location on Map</p>
                    </div>
                    <MapComponent
                      center={getCoords(viewingIssue)!}
                      zoom={17}
                      height="200px"
                      markers={[{ lat: getCoords(viewingIssue)!.lat, lng: getCoords(viewingIssue)!.lng, popup: `${viewingIssue.issue_type} - ${viewingIssue.location}`, color: 'red' }]}
                      clickable={false}
                      mapKey={`view-map-${viewingIssue.id}`}
                    />
                  </div>
                )}
              </div>
              
              {/* Description */}
              {viewingIssue.description && (
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>📝 Description</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem' }}>{viewingIssue.description}</p>
                </div>
              )}
              
              {/* Reporter Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Reported By</p>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{viewingIssue.reported_by || 'Walk-in'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Contact</p>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{viewingIssue.contact_number || 'No contact provided'}</p>
                </div>
              </div>
              
              {/* Timestamps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Reported At</p>
                  <p style={{ margin: 0 }}>{new Date(viewingIssue.reported_at).toLocaleString()}</p>
                </div>
                {viewingIssue.resolved_at && (
                  <div>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Resolved At</p>
                    <p style={{ margin: 0 }}>{new Date(viewingIssue.resolved_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setViewingIssue(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for bounce animation and map styles */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translate(-50%, -100%) translateY(0); }
          40% { transform: translate(-50%, -100%) translateY(-10px); }
          60% { transform: translate(-50%, -100%) translateY(-5px); }
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  )
}