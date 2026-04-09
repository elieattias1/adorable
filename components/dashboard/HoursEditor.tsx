'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

const DAYS = [
  { key: 'lundi',     label: 'Lundi' },
  { key: 'mardi',     label: 'Mardi' },
  { key: 'mercredi',  label: 'Mercredi' },
  { key: 'jeudi',     label: 'Jeudi' },
  { key: 'vendredi',  label: 'Vendredi' },
  { key: 'samedi',    label: 'Samedi' },
  { key: 'dimanche',  label: 'Dimanche' },
]

const DEFAULT_HOURS: Record<string, DayHours> = {
  lundi:    { open: '07:00', close: '19:30', closed: false },
  mardi:    { open: '07:00', close: '19:30', closed: false },
  mercredi: { open: '07:00', close: '19:30', closed: false },
  jeudi:    { open: '07:00', close: '19:30', closed: false },
  vendredi: { open: '07:00', close: '19:30', closed: false },
  samedi:   { open: '07:30', close: '19:00', closed: false },
  dimanche: { open: '08:00', close: '13:00', closed: false },
}

interface DayHours { open: string; close: string; closed: boolean }

interface Props {
  siteId: string
  initialConfig?: Record<string, unknown>
  onSaved?: () => void
}

export default function HoursEditor({ siteId, initialConfig, onSaved }: Props) {
  const initHours = (initialConfig?.hours as Record<string, DayHours> | undefined) ?? DEFAULT_HOURS
  const [hours, setHours] = useState<Record<string, DayHours>>(initHours)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const update = (day: string, field: keyof DayHours, value: string | boolean) => {
    setHours(h => ({ ...h, [day]: { ...h[day], [field]: value } }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch(`/api/site/${siteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_config: { ...initialConfig, hours } }),
    })
    setSaving(false)
    setSaved(true)
    onSaved?.()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700 w-28">Jour</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Ouverture</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Fermeture</th>
              <th className="text-center px-4 py-2.5 font-semibold text-gray-700">Fermé</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map(({ key, label }, i) => {
              const day = hours[key] ?? DEFAULT_HOURS[key]
              return (
                <tr key={key} className={`border-b border-gray-100 last:border-0 ${day.closed ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-2 font-medium text-gray-800">{label}</td>
                  <td className="px-4 py-2">
                    <input
                      type="time"
                      value={day.open}
                      disabled={day.closed}
                      onChange={e => update(key, 'open', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="time"
                      value={day.close}
                      disabled={day.closed}
                      onChange={e => update(key, 'close', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={day.closed}
                      onChange={e => update(key, 'closed', e.target.checked)}
                      className="w-4 h-4 accent-violet-600 cursor-pointer"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Sauvegarde…' : saved ? '✓ Sauvegardé' : 'Enregistrer'}
        </button>
        <a
          href="https://business.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Gérer sur Google My Business
        </a>
      </div>
    </div>
  )
}
