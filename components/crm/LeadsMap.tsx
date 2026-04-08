'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Lead } from '@/hooks/useLeads'

interface Props {
  leads: Lead[]
  selectedId: string | null
  onSelect: (lead: Lead) => void
}

export default function LeadsMap({ leads, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<import('leaflet').Map | null>(null)
  const markersRef   = useRef<Map<string, import('leaflet').Marker>>(new Map())

  const mappable = leads.filter(l => l.latitude != null && l.longitude != null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, { zoomControl: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)
      mapRef.current = map

      const bounds: [number, number][] = []

      leads.forEach(lead => {
        if (lead.latitude == null || lead.longitude == null) return
        const coords: [number, number] = [lead.latitude, lead.longitude]
        const marker = L.marker(coords)
          .addTo(map)
          .on('click', () => onSelect(lead))
        markersRef.current.set(lead.id, marker)
        bounds.push(coords)
      })

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] })
      } else {
        map.setView([46.6, 2.4], 6) // France
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add/remove markers when filtered leads change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const existingIds = new Set(markersRef.current.keys())
      const currentIds  = new Set<string>()

      leads.forEach(lead => {
        if (lead.latitude == null || lead.longitude == null) return
        currentIds.add(lead.id)
        if (!existingIds.has(lead.id)) {
          const coords: [number, number] = [lead.latitude, lead.longitude]
          const marker = L.marker(coords).addTo(map).on('click', () => onSelect(lead))
          markersRef.current.set(lead.id, marker)
        }
      })

      existingIds.forEach(id => {
        if (!currentIds.has(id)) {
          markersRef.current.get(id)?.remove()
          markersRef.current.delete(id)
        }
      })
    })
  }, [leads, onSelect])

  // Pan to selected marker
  useEffect(() => {
    if (!selectedId || !mapRef.current) return
    const marker = markersRef.current.get(selectedId)
    if (marker) mapRef.current.panTo(marker.getLatLng(), { animate: true })
  }, [selectedId])

  return (
    <div className="relative w-full h-full">
      {mappable.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none">
          <p className="text-sm text-gray-400">Aucun lead avec coordonnées GPS</p>
          <p className="text-xs text-gray-400 mt-1">Les leads avec latitude/longitude s'afficheront ici</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full rounded-xl" />
    </div>
  )
}
