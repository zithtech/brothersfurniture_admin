import React, { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import type { ToastMessage } from '../../types/admin'

interface ToastItemProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 4500
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(100)
  const startTimeRef = useRef<number>(Date.now())
  const remainingTimeRef = useRef<number>(duration)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      return
    }

    startTimeRef.current = Date.now()

    timerRef.current = setTimeout(() => {
      onDismiss(toast.id)
    }, remainingTimeRef.current)

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current
      const currentRemaining = Math.max(0, remainingTimeRef.current - elapsed)
      const pct = (currentRemaining / duration) * 100
      setProgress(pct)

      if (currentRemaining > 0 && !isPaused) {
        animFrameRef.current = requestAnimationFrame(updateProgress)
      }
    }

    animFrameRef.current = requestAnimationFrame(updateProgress)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      const elapsed = Date.now() - startTimeRef.current
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
    }
  }, [isPaused, duration, onDismiss, toast.id])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />,
  }

  const badgeBorders = {
    success: 'border-emerald-500/30 bg-[#0c1f18]/95 shadow-emerald-950/40 text-emerald-100',
    error: 'border-rose-500/30 bg-[#240e15]/95 shadow-rose-950/40 text-rose-100',
    warning: 'border-amber-500/30 bg-[#241708]/95 shadow-amber-950/40 text-amber-100',
    info: 'border-sky-500/30 bg-[#0b1b2d]/95 shadow-sky-950/40 text-sky-100',
  }

  const progressBarColors = {
    success: 'bg-emerald-400',
    error: 'bg-rose-400',
    warning: 'bg-amber-400',
    info: 'bg-sky-400',
  }

  return (
    <div
      role="status"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden flex flex-col rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-up group ${badgeBorders[toast.type]}`}
    >
      <div className="flex items-start gap-3 p-4">
        {icons[toast.type]}
        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-sm font-bold tracking-tight text-white leading-snug">{toast.title}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-line">{toast.message}</p>

          {/* Action button if provided (e.g. Undo) */}
          {toast.action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toast.action?.onClick()
                  onDismiss(toast.id)
                }}
                className="px-3 py-1 bg-white/15 hover:bg-white/25 active:bg-white/35 text-white text-xs font-bold rounded-lg border border-white/20 transition-all cursor-pointer shadow-xs"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown progress bar line */}
      <div className="w-full h-1 bg-white/10 overflow-hidden">
        <div
          className={`h-full transition-all ease-linear ${progressBarColors[toast.type]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAdmin()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  )
}
