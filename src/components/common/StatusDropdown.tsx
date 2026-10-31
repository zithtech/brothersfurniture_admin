import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown,
  Check,
  FileEdit,
  Send,
  Clock,
  CheckCircle2,
  Receipt,
  XCircle,
} from 'lucide-react'
import type { ProposalStatus } from '../../types/admin'

export interface StatusConfigItem {
  value: ProposalStatus
  label: string
  description: string
  pillClass: string
  dotClass: string
  ringClass?: string
  icon: React.ComponentType<{ className?: string }>
}

export const PROPOSAL_STATUS_CONFIG: Record<ProposalStatus, StatusConfigItem> = {
  draft: {
    value: 'draft',
    label: 'Draft',
    description: 'Internal draft, not yet issued',
    pillClass: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80',
    dotClass: 'bg-slate-400',
    icon: FileEdit,
  },
  sent: {
    value: 'sent',
    label: 'Proposal Sent',
    description: 'Dispatched to client for review',
    pillClass: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/80',
    dotClass: 'bg-sky-500',
    ringClass: 'ring-sky-400/40',
    icon: Send,
  },
  under_review: {
    value: 'under_review',
    label: 'Under Review',
    description: 'Client is evaluating scope & terms',
    pillClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80',
    dotClass: 'bg-amber-500',
    ringClass: 'ring-amber-400/40',
    icon: Clock,
  },
  approved: {
    value: 'approved',
    label: 'Client Approved',
    description: 'Commercial quote accepted',
    pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80',
    dotClass: 'bg-emerald-500',
    ringClass: 'ring-emerald-400/40',
    icon: CheckCircle2,
  },
  converted: {
    value: 'converted',
    label: 'Converted to Invoice',
    description: 'Work order & billing generated',
    pillClass: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80',
    dotClass: 'bg-purple-500',
    ringClass: 'ring-purple-400/40',
    icon: Receipt,
  },
  rejected: {
    value: 'rejected',
    label: 'Declined',
    description: 'Proposal closed or declined',
    pillClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80',
    dotClass: 'bg-rose-500',
    icon: XCircle,
  },
}

export interface StatusDropdownProps {
  value: ProposalStatus
  onChange: (newStatus: ProposalStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  align?: 'left' | 'right'
  className?: string
  showDescription?: boolean
}

interface MenuCoords {
  top: number
  left: number
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'sm',
  align = 'left',
  className = '',
  showDescription = true,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<MenuCoords | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentConfig = PROPOSAL_STATUS_CONFIG[value] || PROPOSAL_STATUS_CONFIG.draft
  const IconComponent = currentConfig.icon

  // Calculate fixed viewport coordinates for portal
  const calculatePosition = useCallback((): MenuCoords | null => {
    if (!buttonRef.current) return null
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 264
    const estimatedHeight = 310

    // Vertical positioning: drop down if room, otherwise drop up
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight

    const top = openUpward
      ? Math.max(10, rect.top - estimatedHeight - 6)
      : Math.min(window.innerHeight - estimatedHeight - 10, rect.bottom + 6)

    // Horizontal positioning:
    // If explicitly aligned right, or if aligning left overflows viewport, align to right edge of button
    let left: number
    if (align === 'right' || rect.left + menuWidth > window.innerWidth - 24) {
      left = rect.right - menuWidth
    } else {
      left = rect.left
    }

    // Window boundaries check
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12
    }
    if (left < 12) {
      left = 12
    }

    return { top, left }
  }, [align])

  const updatePosition = useCallback(() => {
    const pos = calculatePosition()
    if (pos) {
      setCoords(pos)
    }
  }, [calculatePosition])

  // Recalculate position when opened
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, updatePosition])

  // Track scroll, resize, click outside, and Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleScrollOrResize = () => {
      updatePosition()
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedButton = buttonRef.current && buttonRef.current.contains(target)
      const clickedMenu = menuRef.current && menuRef.current.contains(target)

      if (!clickedButton && !clickedMenu) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    // Capture true so scrolling inside table elements triggers repositioning
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, updatePosition])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return

    if (!isOpen) {
      const pos = calculatePosition()
      if (pos) setCoords(pos)
    }
    setIsOpen((prev) => !prev)
  }

  const handleSelect = (status: ProposalStatus, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    if (status !== value) {
      onChange(status)
    }
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-xs gap-1.5 rounded-lg'
      : 'px-3 py-1.5 text-xs sm:text-sm gap-2 rounded-xl'

  const dotSizeClasses = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
  const iconSizeClasses = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <>
      {/* Trigger Button inside table / view */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`inline-flex items-center font-semibold border shadow-2xs transition-all duration-150 cursor-pointer outline-none select-none group focus:ring-2 focus:ring-orange-500/20 active:scale-[0.98] ${
          currentConfig.pillClass
        } ${sizeClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {/* Animated Status Dot */}
        <span className="relative flex items-center justify-center shrink-0">
          {(value === 'sent' || value === 'under_review') && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${currentConfig.dotClass}`}
            />
          )}
          <span
            className={`relative inline-block rounded-full ${currentConfig.dotClass} ${dotSizeClasses} ${
              currentConfig.ringClass ? `ring-2 ${currentConfig.ringClass}` : ''
            }`}
          />
        </span>

        {/* Status Label */}
        <span className="truncate tracking-tight">{currentConfig.label}</span>

        {/* Chevron Icon */}
        <ChevronDown
          className={`${iconSizeClasses} opacity-60 transition-transform duration-200 ease-out group-hover:opacity-100 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Menu via React Portal directly into document.body */}
      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: '264px',
              zIndex: 99999,
            }}
            className="bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 select-none"
            onClick={(e) => e.stopPropagation()}
            role="menu"
            aria-orientation="vertical"
          >
            {/* Header */}
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Update Status
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <IconComponent className="w-3 h-3 text-slate-400" />
                Current: <strong className="text-slate-700">{currentConfig.label}</strong>
              </span>
            </div>

            {/* Options List */}
            <div className="pt-1 space-y-0.5 max-h-72 overflow-y-auto">
              {(Object.keys(PROPOSAL_STATUS_CONFIG) as ProposalStatus[]).map((statusKey) => {
                const opt = PROPOSAL_STATUS_CONFIG[statusKey]
                const OptIcon = opt.icon
                const isSelected = statusKey === value

                return (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={(e) => handleSelect(statusKey, e)}
                    className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer group/opt ${
                      isSelected
                        ? 'bg-orange-50/80 text-orange-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                    }`}
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Status Icon badge */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover/opt:scale-105 ${opt.pillClass}`}
                      >
                        <OptIcon className="w-3.5 h-3.5" />
                      </div>

                      {/* Label & Description */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate leading-tight block">
                            {opt.label}
                          </span>
                        </div>
                        {showDescription && (
                          <span className="text-[10.5px] text-slate-400 truncate block mt-0.5 leading-tight">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected checkmark indicator */}
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div
                        className={`w-2 h-2 rounded-full ${opt.dotClass} opacity-0 group-hover/opt:opacity-100 transition-opacity shrink-0`}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default StatusDropdown
