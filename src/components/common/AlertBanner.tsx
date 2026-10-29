import React from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react'

export interface AlertBannerProps {
  variant?: 'info' | 'warning' | 'danger' | 'success'
  title?: string
  children: React.ReactNode
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
  className?: string
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  action,
  onDismiss,
  className = '',
}) => {
  const variantStyles = {
    info: {
      container: 'bg-sky-50/90 border-sky-200/80 text-sky-900',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
      actionBtn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-2xs',
      closeBtn: 'text-sky-600 hover:bg-sky-100',
    },
    warning: {
      container: 'bg-amber-50/90 border-amber-200/80 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs',
      closeBtn: 'text-amber-700 hover:bg-amber-100',
    },
    danger: {
      container: 'bg-rose-50/90 border-rose-200/80 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
      actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs',
      closeBtn: 'text-rose-700 hover:bg-rose-100',
    },
    success: {
      container: 'bg-emerald-50/90 border-emerald-200/80 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs',
      closeBtn: 'text-emerald-700 hover:bg-emerald-100',
    },
  }[variant]

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3.5 p-4 rounded-xl border transition-all ${variantStyles.container} ${className}`}
    >
      {icon || variantStyles.icon}
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-bold tracking-tight mb-1">{title}</h4>}
        <div className="text-xs sm:text-sm leading-relaxed opacity-95">{children}</div>
        {action && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={action.onClick}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${variantStyles.actionBtn}`}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${variantStyles.closeBtn}`}
          aria-label="Dismiss alert banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
