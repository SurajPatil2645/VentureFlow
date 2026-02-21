'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertCircle,
  }

    const colors = {
      success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800 shadow-lg',
      error: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-800 shadow-lg',
      info: 'bg-gradient-to-r from-aliceblue to-sky-50 border-blue-300 text-blue-800 shadow-lg',
      warning: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 text-yellow-800 shadow-lg',
    }

  const Icon = icons[toast.type]

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-top-5 ${colors[toast.type]}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast, idx) => (
        <div key={toast.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}

let toastIdCounter = 0
const toastListeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  const toast: Toast = {
    id: `toast-${++toastIdCounter}`,
    message,
    type,
    duration,
  }
  toastListeners.forEach((listener) => listener(toast))
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
    }
    toastListeners.push(listener)

    return () => {
      const index = toastListeners.indexOf(listener)
      if (index > -1) toastListeners.splice(index, 1)
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, removeToast }
}
