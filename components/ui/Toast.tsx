'use client'

import { useEffect } from 'react'

interface ToastProps {
  msg:       string
  type:      'success' | 'error'
  onDismiss: () => void
  duration?: number
}

export function Toast({ msg, type, onDismiss, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [onDismiss, duration])

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-4 fade-in-0 max-w-sm ${
      type === 'success'
        ? 'bg-green-950 border-green-700 text-green-300'
        : 'bg-red-950 border-red-700 text-red-300'
    }`}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  )
}

export type ToastState = { msg: string; type: 'success' | 'error' } | null
