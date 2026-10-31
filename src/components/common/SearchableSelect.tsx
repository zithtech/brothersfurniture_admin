import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  initials?: string
  badgeColor?: string
  group?: string
  description?: string
  icon?: React.ReactNode
}

export interface SearchableSelectProps {
  value?: string
  onChange?: (value: string) => void
  isMulti?: boolean
  multiValue?: string[]
  onMultiChange?: (values: string[]) => void
  options: (string | SelectOption)[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  clearable?: boolean
  allowCustom?: boolean
  customOptionLabel?: string
  onCustomSelect?: (customValue?: string) => void
  onClear?: () => void
  className?: string
  dropdownClassName?: string
  accentColor?: 'blue' | 'orange'
  renderCustomOption?: (option: SelectOption) => React.ReactNode
  showBadge?: boolean
  footerCountLabel?: string
  id?: string
  size?: 'sm' | 'md'
  prefixIcon?: React.ReactNode
}

// Deterministic vibrant badge colors matching modern UI standards
const BADGE_COLOR_PALETTE = [
  'bg-teal-500 text-white',
  'bg-blue-600 text-white',
  'bg-purple-600 text-white',
  'bg-lime-600 text-white',
  'bg-indigo-600 text-white',
  'bg-rose-500 text-white',
  'bg-amber-500 text-white',
  'bg-cyan-600 text-white',
  'bg-emerald-600 text-white',
  'bg-violet-600 text-white',
]

export function getInitialsForLabel(label: string): string {
  if (!label) return '•'
  const cleaned = label.replace(/[^\w\s-]/g, '').trim()
  const words = cleaned.split(/[\s-]+/).filter(Boolean)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return label.slice(0, 2).toUpperCase()
}

export function getBadgeColorForLabel(label: string): string {
  if (!label) return BADGE_COLOR_PALETTE[0]
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash)
  }
  return BADGE_COLOR_PALETTE[Math.abs(hash) % BADGE_COLOR_PALETTE.length]
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value = '',
  onChange,
  isMulti = false,
  multiValue = [],
  onMultiChange,
  options,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  clearable = true,
  allowCustom = false,
  customOptionLabel = '+ Enter Custom Option...',
  onCustomSelect,
  onClear,
  className = '',
  dropdownClassName = '',
  accentColor = 'blue',
  showBadge = true,
  footerCountLabel = 'items',
  id,
  size = 'md',
  prefixIcon,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [openUpwards, setOpenUpwards] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return {
          value: opt,
          label: opt,
          initials: getInitialsForLabel(opt),
          badgeColor: getBadgeColorForLabel(opt),
        }
      }
      return {
        ...opt,
        initials: opt.initials || getInitialsForLabel(opt.label),
        badgeColor: opt.badgeColor || getBadgeColorForLabel(opt.label),
      }
    })
  }, [options])

  // Current selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value)
  }, [normalizedOptions, value])

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions
    const query = searchQuery.toLowerCase().trim()
    return normalizedOptions.filter((opt) => {
      return (
        opt.label.toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query)) ||
        (opt.group && opt.group.toLowerCase().includes(query))
      )
    })
  }, [normalizedOptions, searchQuery])

  // Multi-select master toggle items
  const itemIds = useMemo(() => {
    return normalizedOptions.filter((o) => o.value !== '__all__').map((o) => o.value)
  }, [normalizedOptions])

  const isAllItemsSelected = Boolean(
    isMulti &&
    itemIds.length > 0 &&
    itemIds.every((id) => (multiValue || []).includes(id))
  )

  // Is exact match found in current options
  const isExactMatch = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return normalizedOptions.some((opt) => opt.label.toLowerCase() === query)
  }, [normalizedOptions, searchQuery])

  // Check positioning when opening (detect if opening upwards is better)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      // If less than 280px below and more space above, open upwards
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setOpenUpwards(true)
      } else {
        setOpenUpwards(false)
      }
    }
  }, [isOpen])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('touchstart', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [isOpen])

  // Handle auto-focus and reset search query when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setHighlightedIndex(-1)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Reset highlighted index when search results change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      ) as HTMLElement
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  const handleSelect = (val: string) => {
    if (isMulti) {
      if (val === '__all__') {
        const itemIds = normalizedOptions.filter((o) => o.value !== '__all__').map((o) => o.value)
        const cur = multiValue || []
        const isAllSelected = itemIds.length > 0 && itemIds.every((id) => cur.includes(id))
        if (isAllSelected) {
          onMultiChange?.([])
        } else {
          onMultiChange?.(itemIds)
        }
        return
      }
      const cur = multiValue || []
      const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val]
      onMultiChange?.(next)
    } else {
      onChange?.(val)
      setIsOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClear) {
      onClear()
    } else if (isMulti) {
      onMultiChange?.([])
    } else {
      onChange?.('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => {
        const max = filteredOptions.length - 1
        return prev < max ? prev + 1 : prev
      })
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredOptions.length > 0 && highlightedIndex >= 0) {
        const target = filteredOptions[highlightedIndex]
        if (target) {
          handleSelect(target.value)
          return
        }
      }
      if (allowCustom && searchQuery.trim() && !isExactMatch) {
        if (onCustomSelect) {
          onCustomSelect(searchQuery.trim())
        } else {
          onChange?.(searchQuery.trim())
        }
        setIsOpen(false)
      }
    }
  }

  // Accent styles
  const isBlue = accentColor === 'blue'
  const ringFocusClass = isBlue
    ? 'border-blue-500 ring-2 ring-blue-500/15'
    : 'border-orange-500 ring-2 ring-orange-500/15'
  const searchRingFocusClass = isBlue
    ? 'border-blue-400 ring-2 ring-blue-500/15 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
    : 'border-orange-400 ring-2 ring-orange-500/15 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20'
  const selectedBgClass = isBlue ? 'bg-blue-50/80 text-blue-900' : 'bg-orange-50/80 text-orange-950'
  const checkColorClass = isBlue ? 'text-blue-600' : 'text-orange-600'
  const chevronActiveColor = isBlue ? 'text-blue-500' : 'text-orange-500'

  const sizeClass =
    size === 'sm'
      ? 'min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs'
      : 'min-h-[38px] px-3 py-2 rounded-xl text-xs'

  return (
    <div
      ref={containerRef}
      id={id}
      className={`relative w-full ${isOpen ? 'z-50' : 'z-0'} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Box */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white border flex items-center justify-between gap-2 transition-all cursor-pointer select-none shadow-2xs ${sizeClass} ${
          disabled
            ? 'opacity-60 bg-slate-100 cursor-not-allowed border-slate-200'
            : isOpen
            ? `${ringFocusClass} bg-white shadow-xs`
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {prefixIcon && <span className="shrink-0 text-slate-400">{prefixIcon}</span>}
          {isMulti ? (
            multiValue && multiValue.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-nowrap min-w-0 flex-1 overflow-hidden">
                {isAllItemsSelected ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold text-xs border shadow-2xs whitespace-nowrap truncate ${
                      isBlue
                        ? 'bg-blue-100 text-blue-950 border-blue-300'
                        : 'bg-orange-100 text-orange-950 border-orange-300'
                    }`}
                  >
                    ★ All {multiValue.length} Selected
                  </span>
                ) : (
                  <>
                    <span className="font-bold text-slate-900 text-xs shrink-0 whitespace-nowrap">
                      {multiValue.length} selected:
                    </span>
                    {multiValue.slice(0, 1).map((val) => {
                      const opt = normalizedOptions.find((o) => o.value === val)
                      return (
                        <span
                          key={val}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border truncate max-w-[160px] whitespace-nowrap ${
                            isBlue
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : 'bg-orange-100 text-orange-900 border-orange-300'
                          }`}
                        >
                          {opt?.label || val}
                        </span>
                      )
                    })}
                    {multiValue.length > 1 && (
                      <span
                        className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ${
                          isBlue ? 'text-blue-700 bg-blue-100' : 'text-orange-700 bg-orange-100'
                        }`}
                      >
                        +{multiValue.length - 1} more
                      </span>
                    )}
                  </>
                )}
              </div>
            ) : (
              <span className="text-slate-400 font-medium truncate text-xs">{placeholder}</span>
            )
          ) : selectedOption ? (
            <>
              {showBadge && (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9.5px] shrink-0 ${
                    selectedOption.badgeColor || 'bg-slate-500 text-white'
                  }`}
                >
                  {selectedOption.initials || '•'}
                </span>
              )}
              <span className="font-semibold text-slate-800 truncate text-xs">
                {selectedOption.label}
              </span>
            </>
          ) : value ? (
            <>
              {showBadge && (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9.5px] shrink-0 ${getBadgeColorForLabel(
                    value
                  )}`}
                >
                  {getInitialsForLabel(value)}
                </span>
              )}
              <span className="font-semibold text-slate-800 truncate text-xs">{value}</span>
            </>
          ) : (
            <span className="text-slate-400 font-medium truncate text-xs">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1.5 pl-1.5 border-l border-slate-100">
          {/* Clear button when value is present */}
          {clearable && !disabled && (isMulti ? (multiValue && multiValue.length > 0) : (value || selectedOption)) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
              title="Clear selection"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Chevron indicator */}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? `rotate-180 ${chevronActiveColor}` : ''
            }`}
          />
        </div>
      </div>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 ${
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } z-50 bg-white rounded-xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 min-w-[240px] ${dropdownClassName}`}
        >
          {/* Top Search Section (Matching Reference Design) */}
          <div className="p-2.5 pb-2 border-b border-slate-100 bg-white">
            <div
              className={`relative flex items-center rounded-lg border bg-white px-2.5 py-1.5 transition ${searchRingFocusClass}`}
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Multi-Select Select All / Clear Bar */}
          {isMulti && (
            <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  const allFiltered = filteredOptions.filter((o) => o.value !== '__all__').map((o) => o.value)
                  const union = Array.from(new Set([...(multiValue || []), ...allFiltered]))
                  onMultiChange?.(union)
                }}
                className="text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
              >
                Select All ({filteredOptions.filter((o) => o.value !== '__all__').length})
              </button>
              {(multiValue || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => onMultiChange?.([])}
                  className="text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
                >
                  Clear Selection ({(multiValue || []).length})
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div ref={listRef} className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = isMulti
                  ? opt.value === '__all__'
                    ? isAllItemsSelected
                    : (multiValue || []).includes(opt.value)
                  : opt.value === value
                const isHighlighted = idx === highlightedIndex

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    data-index={idx}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? selectedBgClass
                        : isHighlighted
                        ? 'bg-slate-50 text-slate-900'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {isMulti && (
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                            isSelected
                              ? 'bg-orange-600 border-orange-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                      )}
                      {showBadge && (
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            opt.badgeColor || 'bg-slate-500 text-white'
                          }`}
                        >
                          {opt.initials || '•'}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-800 truncate">
                          {opt.label}
                        </div>
                        {opt.description && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isMulti && isSelected && (
                      <Check className={`w-4 h-4 shrink-0 ml-2 ${checkColorClass}`} strokeWidth={2.5} />
                    )}
                  </div>
                )
              })
            ) : (
              <div className="py-4 px-3 text-center">
                <p className="text-xs text-slate-500 font-medium">No options match "{searchQuery}"</p>
                {allowCustom && searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onCustomSelect) {
                        onCustomSelect(searchQuery.trim())
                      } else {
                        onChange?.(searchQuery.trim())
                      }
                      setIsOpen(false)
                    }}
                    className={`mt-2 text-xs font-bold px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1 cursor-pointer transition ${
                      isBlue
                        ? 'text-blue-600 hover:text-blue-700 bg-blue-50 border-blue-200/60 hover:bg-blue-100'
                        : 'text-orange-600 hover:text-orange-700 bg-orange-50 border-orange-200/60 hover:bg-orange-100'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Use "{searchQuery.trim()}"</span>
                  </button>
                )}
              </div>
            )}

            {/* Custom option button at bottom if enabled */}
            {allowCustom && (
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (onCustomSelect) {
                      onCustomSelect()
                    }
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 cursor-pointer ${
                    isBlue
                      ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/70'
                      : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50/70'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{customOptionLabel}</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Bar Showing Item Count */}
          <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-1.5 text-[11px] text-slate-400 font-medium flex items-center justify-between select-none">
            <span>
              {isMulti
                ? `${(multiValue || []).length} of ${normalizedOptions.length} ${footerCountLabel} selected`
                : searchQuery.trim()
                ? `Showing ${filteredOptions.length} of ${normalizedOptions.length} ${footerCountLabel}`
                : `${normalizedOptions.length} ${footerCountLabel}`}
            </span>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`text-[10.5px] hover:underline cursor-pointer font-medium ${
                  isBlue ? 'text-blue-600' : 'text-orange-600'
                }`}
              >
                Reset search
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
