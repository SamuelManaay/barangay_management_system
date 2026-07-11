'use client'

import { useEffect, useRef, useState } from 'react'

// Declare Leaflet types
declare global {
  interface Window {
    L: any
  }
}

type MapComponentProps = {
  center: { lat: number; lng: number }
  zoom?: number
  height?: string
  onLocationSelect?: (lat: number, lng: number) => void
  markers?: Array<{ lat: number; lng: number; popup?: string; color?: string }>
  clickable?: boolean
  mapKey?: string // Add unique key for each map instance
}

let mapCounter = 0

export default function MapComponent({ 
  center, 
  zoom = 15, 
  height = '300px', 
  onLocationSelect, 
  markers = [], 
  clickable = true,
  mapKey 
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [uniqueId] = useState(() => mapKey || `map-${++mapCounter}-${Date.now()}`)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    const loadLeaflet = async () => {
      try {
        // Load CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        // Load JS
        if (!window.L) {
          return new Promise((resolve) => {
            const script = document.createElement('script')
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
            script.onload = () => resolve(initializeMap())
            document.head.appendChild(script)
          })
        } else {
          return initializeMap()
        }
      } catch (error) {
        console.error('Error loading Leaflet:', error)
        setIsLoading(false)
      }
    }

    const initializeMap = () => {
      if (!mounted || !mapRef.current) return
      
      try {
        // Clean up any existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Clear the container completely
        const container = mapRef.current
        container.innerHTML = ''
        
        // Remove any Leaflet-specific properties
        delete (container as any)._leaflet_id
        
        // Create new map
        const map = window.L.map(container, {
          center: [center.lat, center.lng],
          zoom: zoom,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true
        })

        // Add tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map)

        // Add click handler
        if (clickable && onLocationSelect) {
          map.on('click', (e: any) => {
            if (mounted) {
              onLocationSelect(e.latlng.lat, e.latlng.lng)
            }
          })
        }

        // Add markers
        markers.forEach(marker => {
          const markerColor = marker.color === 'red' ? '#ef4444' : '#3b82f6'
          const icon = window.L.divIcon({
            html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            className: 'custom-marker'
          })

          const leafletMarker = window.L.marker([marker.lat, marker.lng], { icon }).addTo(map)
          
          if (marker.popup) {
            leafletMarker.bindPopup(marker.popup)
          }
        })

        mapInstanceRef.current = map
        setIsLoading(false)
        
      } catch (error) {
        console.error('Error initializing map:', error)
        setIsLoading(false)
      }
    }

    loadLeaflet()

    return () => {
      mounted = false
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.warn('Error cleaning up map:', e)
        }
        mapInstanceRef.current = null
      }
    }
  }, [center.lat, center.lng, zoom, markers, clickable, onLocationSelect, uniqueId])

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <div 
        ref={mapRef} 
        id={uniqueId}
        style={{ 
          height: '100%', 
          width: '100%', 
          borderRadius: '0.5rem',
          border: '1px solid #d1d5db',
          backgroundColor: '#f9fafb'
        }} 
      />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          border: '1px solid #d1d5db'
        }}>
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🗺️</div>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}