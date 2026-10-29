import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react'
import type { AlertOptions } from '../../types/admin'

interface AlertDialogProps {
  isOpen: boolean
  options: AlertOptions | null
  onClose: () => void
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  options,
  onClose,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        closeBtnRef.current?.focus()
      }, 50)

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault()
          onClose()
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !options) return null

  const variant = options.variant || 'warning'

  const renderIcon = () => {
    const iconType = options.icon || (variant === 'error' ? 'alert' : variant === 'warning' ? 'alert' : variant === 'success' ? 'check' : 'info')
    const iconClass = "w-6 h-6 stroke-[2.2]"

    switch (iconType) {
      case 'shield':
        return <ShieldAlert className={iconClass} />
      case 'x-circle':
        return <XCircle className={iconClass} />
      case 'check':
        return <CheckCircle2 className={iconClass} />
      case 'info':
        return <Info className={iconClass} />
      case 'alert':
      default:
        return variant === 'error' ? <AlertCircle className={iconClass} /> : <AlertTriangle className={iconClass} />
    }
  }

  const variantStyles = {
    error: {
      iconBg: 'bg-rose-50 text-rose-600 ring-8 ring-rose-500/10 border border-rose-200/60',
      actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-rose-600/25 active:bg-rose-800',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 ring-8 ring-amber-500/10 border border-amber-200/60',
      actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:shadow-amber-600/25 active:bg-amber-800',
    },
    info: {
      iconBg: 'bg-sky-50 text-sky-600 ring-8 ring-sky-500/10 border border-sky-200/60',
      actionBtn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm hover:shadow-sky-600/25 active:bg-sky-800',
    },
    success: {
      iconBg: 'bg-emerald-50 text-emerald-600 ring-8 ring-emerald-500/10 border border-emerald-200/60',
      actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-emerald-600/25 active:bg-emerald-800',
    },
  }[variant]

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-desc"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 my-auto transform transition-all duration-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}
            >
              {renderIcon()}
            </div>

            <div className="flex-1 min-w-0 pr-3">
              <h3
                id="alert-dialog-title"
                className="text-lg font-bold text-slate-900 tracking-tight leading-snug"
              >
                {options.title}
              </h3>
              <p
                id="alert-dialog-desc"
                className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line"
              >
                {options.message}
              </p>

              {options.details && (
                <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                  {Array.isArray(options.details) ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {options.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{options.details}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer text-center active:scale-98 ${variantStyles.actionBtn}`}
          >
            {options.confirmText || 'Got it'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
