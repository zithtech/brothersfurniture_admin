import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  HelpCircle,
  Info,
  RotateCcw,
  Trash2,
  UserX,
  X,
} from 'lucide-react'
import type { ConfirmOptions } from '../../types/admin'

interface ConfirmDialogProps {
  isOpen: boolean
  options: ConfirmOptions | null
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  options,
  onConfirm,
  onCancel,
}) => {
  const [typedValue, setTypedValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  // Reset typed input and handle keyboard listeners
  useEffect(() => {
    if (isOpen) {
      setTypedValue('')
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        if (options?.requireTypedConfirmation) {
          inputRef.current?.focus()
        } else {
          cancelBtnRef.current?.focus()
        }
      }, 50)

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen, onCancel, options?.requireTypedConfirmation])

  if (!isOpen || !options) return null

  const variant = options.variant || options.type || 'danger'
  const isTypeRequired = Boolean(options.requireTypedConfirmation)
  const isMatch = !isTypeRequired || typedValue.trim().toUpperCase() === options.requireTypedConfirmation?.trim().toUpperCase()

  const handleConfirm = () => {
    if (!isMatch) return
    onConfirm()
  }

  // Icon mapping
  const renderIcon = () => {
    const iconType = options.icon || (variant === 'danger' ? 'trash' : variant === 'warning' ? 'alert' : variant === 'success' ? 'check' : 'help')
    const iconClass = "w-6 h-6 stroke-[2.2]"

    switch (iconType) {
      case 'trash':
        return <Trash2 className={iconClass} />
      case 'alert':
        return <AlertTriangle className={iconClass} />
      case 'archive':
        return <Archive className={iconClass} />
      case 'refresh':
        return <RotateCcw className={iconClass} />
      case 'user-minus':
        return <UserX className={iconClass} />
      case 'check':
        return <CheckCircle2 className={iconClass} />
      case 'info':
        return <Info className={iconClass} />
      case 'help':
      default:
        return <HelpCircle className={iconClass} />
    }
  }

  // Variant styles configuration
  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-50 text-rose-600 ring-8 ring-rose-500/10 border border-rose-200/60',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-rose-600/25 active:bg-rose-800',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      inputBorder: 'focus:border-rose-500 focus:ring-rose-500/20',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 ring-8 ring-amber-500/10 border border-amber-200/60',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:shadow-amber-600/25 active:bg-amber-800',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      inputBorder: 'focus:border-amber-500 focus:ring-amber-500/20',
    },
    primary: {
      iconBg: 'bg-orange-50 text-[#EA580C] ring-8 ring-orange-500/10 border border-orange-200/60',
      confirmBtn: 'bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-sm hover:shadow-orange-600/25 active:bg-orange-800',
      badge: 'bg-orange-50 text-orange-700 border-orange-200',
      inputBorder: 'focus:border-orange-500 focus:ring-orange-500/20',
    },
    info: {
      iconBg: 'bg-sky-50 text-sky-600 ring-8 ring-sky-500/10 border border-sky-200/60',
      confirmBtn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm hover:shadow-sky-600/25 active:bg-sky-800',
      badge: 'bg-sky-50 text-sky-700 border-sky-200',
      inputBorder: 'focus:border-sky-500 focus:ring-sky-500/20',
    },
    success: {
      iconBg: 'bg-emerald-50 text-emerald-600 ring-8 ring-emerald-500/10 border border-emerald-200/60',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-emerald-600/25 active:bg-emerald-800',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      inputBorder: 'focus:border-emerald-500 focus:ring-emerald-500/20',
    },
  }[variant]

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 my-auto transform transition-all duration-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            {/* Ambient Icon Badge */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}
            >
              {renderIcon()}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0 pr-4">
              {options.badge && (
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border mb-1.5 ${variantStyles.badge}`}
                >
                  {options.badge}
                </span>
              )}
              <h3
                id="confirm-dialog-title"
                className="text-lg font-bold text-slate-900 tracking-tight leading-snug"
              >
                {options.title}
              </h3>
              <p
                id="confirm-dialog-desc"
                className="text-sm text-slate-600 mt-2 leading-relaxed"
              >
                {options.message}
              </p>

              {/* Extra Details Box */}
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

              {/* Require Typed Confirmation Input */}
              {isTypeRequired && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                  <label className="block text-xs font-semibold text-amber-900 mb-1.5">
                    Type <strong className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-950">{options.requireTypedConfirmation}</strong> to confirm this action:
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={typedValue}
                    onChange={(e) => setTypedValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isMatch) {
                        e.preventDefault()
                        handleConfirm()
                      }
                    }}
                    placeholder={`Type "${options.requireTypedConfirmation}" here`}
                    className={`w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 font-mono ${variantStyles.inputBorder}`}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer text-center"
          >
            {options.cancelText || 'Cancel'}
          </button>
          <button
            type="button"
            disabled={!isMatch}
            onClick={handleConfirm}
            className={`w-full sm:w-auto px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer text-center active:scale-98 ${
              isMatch
                ? variantStyles.confirmBtn
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            {options.confirmText || options.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
