'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Lead } from '@/hooks/useLeads'

export function getCoordsFromMapsUrl(url: string): [number, number] | null {
  const m = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/)
  if (m) return [parseFloat(m[1]), parseFloat(m[2])]
  const m2 = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m2) return [parseFloat(m2[1]), parseFloat(m2[2])]
  return null
}

export function getCoords(lead: Lead): [number, number] | null {
  if (lead.latitude != null && lead.longitude != null) return [lead.latitude, lead.longitude]
  if (lead.google_maps_url) return getCoordsFromMapsUrl(lead.google_maps_url)
  return null
}

const STATUS_COLORS: Record<string, string> = {
  new:       '#3b82f6', // blue
  contacted: '#f59e0b', // amber
  building:  '#8b5cf6', // violet
  built:     '#22c55e', // green
  closed:    '#9ca3af', // gray
}

function makeIcon(L: typeof import('leaflet'), status: string, selected = false) {
  const color = STATUS_COLORS[status] ?? '#8b5cf6'
  const size  = selected ? 34 : 26
  const fs    = selected ? 16 : 13
  const ring  = selected
    ? `0 0 0 3px ${color}50, 0 3px 10px rgba(0,0,0,0.3)`
    : '0 2px 6px rgba(0,0,0,0.22)'
  const html = `<div style="
    width:${size}px;height:${size}px;
    background:${color};
    border-radius:50%;
    border:2.5px solid white;
    box-shadow:${ring};
    display:flex;align-items:center;justify-content:center;
    font-size:${fs}px;line-height:1;
    transition:all 0.15s;
    cursor:pointer;
  ">🥐</div>`
  return L.divIcon({
    html,
    className: '',
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 8)],
  })
}

interface Props {
  leads:       Lead[]
  selectedId:  string | null
  selectedIds: Set<string>          // from table checkbox selection
  onSelect:    (lead: Lead) => void
}

export default function LeadsMap({ leads, selectedId, selectedIds, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<import('leaflet').Map | null>(null)
  const markersRef   = useRef<Map<string, import('leaflet').Marker>>(new Map())
  const LRef         = useRef<typeof import('leaflet') | null>(null)

  const mappable = leads.filter(l => getCoords(l) != null)

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      if (!containerRef.current || mapRef.current) return
      LRef.current = L

      const map = L.map(containerRef.current, { zoomControl: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)
      mapRef.current = map

      // Add initial markers
      const bounds: [number, number][] = []
      leads.forEach(lead => {
        const coords = getCoords(lead)
        if (!coords) return
        const marker = L.marker(coords, { icon: makeIcon(L, lead.status) })
          .addTo(map)
          .on('click', () => onSelect(lead))
        markersRef.current.set(lead.id, marker)
        bounds.push(coords)
      })

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 })
      } else {
        map.setView([48.86, 2.35], 12) // Paris
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sync markers + re-fit bounds when leads (filter) change ───────────────
  useEffect(() => {
    const map = mapRef.current
    const L   = LRef.current
    if (!map || !L) return

    const existingIds = new Set(markersRef.current.keys())
    const currentIds  = new Set<string>()
    const bounds: [number, number][] = []

    leads.forEach(lead => {
      const coords = getCoords(lead)
      if (!coords) return
      currentIds.add(lead.id)
      bounds.push(coords)

      if (existingIds.has(lead.id)) return
      const marker = L.marker(coords, { icon: makeIcon(L, lead.status) })
        .addTo(map)
        .on('click', () => onSelect(lead))
      markersRef.current.set(lead.id, marker)
    })

    // Remove stale markers
    existingIds.forEach(id => {
      if (!currentIds.has(id)) {
        markersRef.current.get(id)?.remove()
        markersRef.current.delete(id)
      }
    })

    // Re-fit to visible markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true })
    }
  }, [leads, onSelect])

  // ── Zoom to table-selected leads when selection changes ───────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (selectedIds.size === 0) return

    const bounds: [number, number][] = []
    leads.forEach(lead => {
      if (!selectedIds.has(lead.id)) return
      const coords = getCoords(lead)
      if (coords) bounds.push(coords)
    })

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true })
    }
  }, [selectedIds, leads])

  // ── Highlight selected pin / pan to clicked pin ───────────────────────────
  useEffect(() => {
    const L = LRef.current
    if (!L) return

    // Reset all icons, highlight the selected one
    leads.forEach(lead => {
      const marker = markersRef.current.get(lead.id)
      if (marker) marker.setIcon(makeIcon(L, lead.status, lead.id === selectedId))
    })

    if (selectedId) {
      const marker = markersRef.current.get(selectedId)
      if (marker) mapRef.current?.panTo(marker.getLatLng(), { animate: true })
    }
  }, [selectedId])

  return (
    <div className="relative w-full h-full">
      {mappable.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none">
          <p className="text-sm text-gray-400">Aucun lead avec coordonnées GPS</p>
          <p className="text-xs text-gray-400 mt-1">Les leads avec latitude/longitude s'afficheront ici</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
    </div>
  )
}
