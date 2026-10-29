import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle,
  ChevronDown,
  Clock,
  LogOut,
  Maximize,
  Menu,
  MessageSquare,
  Minimize,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShoppingCart,
  User,
  Users,
  X,
} from 'lucide-react'
import logoImg from '../../assets/logo.png'
import { LogoutModal } from '../auth/LogoutModal'
import { ProfileEditModal } from '../auth/ProfileEditModal'
import { useAdmin } from '../../context/AdminContext'
import { useAuth } from '../../context/AuthContext'
import type { AdminView } from '../../types/admin'

interface HeaderProps {
  onToggleMobileMenu: () => void
  onOpenAddProduct: () => void
  onOpenAddLead?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenAddProduct,
}) => {
  const {
    currentView,
    searchQuery,
    setSearchQuery,
    leads,
    products,
    orders,
    setCurrentView,
  } = useAdmin()

  const { user, hasRole, admins } = useAuth()
  const isSuperAdmin = hasRole(['super_admin'])

  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Context-aware search placeholder text
  const getSearchPlaceholder = () => {
    switch (currentView) {
      case 'products':
        return 'Search products by name, category, SKU...'
      case 'orders':
        return 'Search orders by ID, client, customer...'
      case 'leads':
        return 'Search inquiries, customer leads, phone...'
      case 'quotations':
        return 'Search quotations by ref #, client, company...'
      case 'categories':
      case 'ergonomic-chairs':
        return 'Search chairs category, ergonomic models & series...'
      case 'clients':
        return 'Search corporate clients & industry...'
      case 'testimonials':
        return 'Search customer reviews & quotes...'
      case 'settings':
        return 'Search store settings, factory address, contact info...'
      default:
        return 'Search products, orders, customers...'
    }
  }

  // Dynamic Notifications & Alerts State
  const [readAlertIds, setReadAlertIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bf_read_alert_ids') || '[]')
    } catch {
      return []
    }
  })
  const [alertFilter, setAlertFilter] = useState<'all' | 'leads' | 'orders' | 'stock'>('all')

  const markAlertAsRead = (id: string) => {
    setReadAlertIds((prev) => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      try {
        localStorage.setItem('bf_read_alert_ids', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const markAllAlertsAsRead = (ids: string[]) => {
    setReadAlertIds((prev) => {
      const updated = Array.from(new Set([...prev, ...ids]))
      try {
        localStorage.setItem('bf_read_alert_ids', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Recent'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Recent'
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  // Generate dynamic system alerts from live data
  const allAlerts = useMemo(() => {
    const list: Array<{
      id: string
      type: 'lead' | 'order' | 'stock' | 'admin'
      title: string
      message: string
      timestamp: number
      timeAgo: string
      badge: string
      badgeClass: string
      iconBg: string
      iconColor: string
      icon: any
      targetView: AdminView
    }> = []

    // 1. Pending & Incoming CRM Leads
    leads
      .filter((l) => l.status === 'new')
      .forEach((lead) => {
        const time = new Date(lead.createdAt).getTime() || Date.now()
        list.push({
          id: `lead-${lead.id}`,
          type: 'lead',
          title: `New Inquiry · ${lead.name}`,
          message: `${lead.subject}: "${lead.message.slice(0, 65)}${lead.message.length > 65 ? '...' : ''}"`,
          timestamp: time,
          timeAgo: getRelativeTime(lead.createdAt),
          badge: lead.priority === 'urgent' ? 'URGENT CRM' : 'NEW INQUIRY',
          badgeClass: lead.priority === 'urgent' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          icon: MessageSquare,
          targetView: 'leads',
        })
      })

    // 2. Pending Factory Orders
    orders
      .filter((o) => o.status === 'pending' || o.paymentStatus === 'pending')
      .forEach((order) => {
        const time = new Date(order.createdAt).getTime() || Date.now()
        const totalItems = order.items.reduce((s, i) => s + i.quantity, 0)
        list.push({
          id: `order-${order.id}`,
          type: 'order',
          title: `Order Awaiting Action · #${order.orderNumber}`,
          message: `${order.customerName} · ₹${order.total.toLocaleString('en-IN')} (${totalItems} units)`,
          timestamp: time,
          timeAgo: getRelativeTime(order.createdAt),
          badge: order.status === 'pending' ? 'PENDING ORDER' : 'UNPAID ORDER',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
          iconBg: 'bg-sky-50',
          iconColor: 'text-sky-600',
          icon: ShoppingCart,
          targetView: 'orders',
        })
      })

    // 3. Low stock / Depleted Products
    products
      .filter((p) => !p.inStock || (p.stockCount !== undefined && p.stockCount <= 2))
      .forEach((prod) => {
        const time = new Date(prod.updatedAt || '').getTime() || Date.now()
        const isDepleted = !prod.inStock || prod.stockCount === 0
        list.push({
          id: `stock-${prod.id}`,
          type: 'stock',
          title: `Inventory Alert · ${prod.name}`,
          message: `${prod.category} · ${isDepleted ? '0 units in stock (Depleted)' : `Low stock: ${prod.stockCount} units remaining`}`,
          timestamp: time,
          timeAgo: getRelativeTime(prod.updatedAt),
          badge: isDepleted ? 'OUT OF STOCK' : 'LOW STOCK',
          badgeClass: isDepleted ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-orange-100 text-orange-800 border-orange-200',
          iconBg: 'bg-rose-50',
          iconColor: 'text-rose-600',
          icon: AlertTriangle,
          targetView: 'products',
        })
      })

    // 4. Pending Admin Approvals (if any)
    admins
      .filter((a) => a.status === 'pending_approval')
      .forEach((adm) => {
        const time = new Date(adm.createdAt || '').getTime() || Date.now()
        list.push({
          id: `admin-${adm.id}`,
          type: 'admin',
          title: `Access Request · ${adm.name}`,
          message: `${adm.email} registered for admin access (awaiting review)`,
          timestamp: time,
          timeAgo: getRelativeTime(adm.createdAt),
          badge: 'TEAM APPROVAL',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          iconBg: 'bg-purple-50',
          iconColor: 'text-purple-600',
          icon: ShieldAlert,
          targetView: 'admins',
        })
      })

    return list.sort((a, b) => b.timestamp - a.timestamp)
  }, [leads, orders, products, admins])

  const unreadAlerts = useMemo(() => {
    return allAlerts.filter((a) => !readAlertIds.includes(a.id))
  }, [allAlerts, readAlertIds])

  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'leads') return allAlerts.filter((a) => a.type === 'lead')
    if (alertFilter === 'orders') return allAlerts.filter((a) => a.type === 'order')
    if (alertFilter === 'stock') return allAlerts.filter((a) => a.type === 'stock')
    return allAlerts
  }, [allAlerts, alertFilter])

  // Keyboard shortcut listener: Cmd+K / Ctrl+K focuses the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/90 sticky top-0 z-30 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] select-none w-full px-4 sm:px-6">
        {/* Left Section: Mobile Menu and Brand Logo */}
        <div className="flex items-center shrink-0">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 -ml-1 mr-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo on Mobile */}
          <div className="flex items-center gap-2 lg:hidden mr-3">
            <img src={logoImg} alt="Brother Furniture" className="h-7 w-auto object-contain" />
          </div>
        </div>

        {/* Center-Left Section: Reference Pill Search Bar */}
        <div className="flex-1 flex items-center min-w-0 pr-4">
          <div className="relative w-full max-w-[460px] hidden md:block ml-2 sm:ml-4 lg:ml-5">
            <Search className="w-4 h-4 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getSearchPlaceholder()}
              style={{ paddingLeft: '38px', paddingRight: '56px' }}
              className="w-full h-10 bg-[#F1F3F7] hover:bg-[#EBEEF5] focus:bg-white border border-transparent focus:border-slate-300 rounded-full text-[13px] leading-normal text-slate-800 placeholder:text-slate-400 placeholder:font-normal placeholder:truncate focus:outline-none focus:ring-2 focus:ring-slate-200/80 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            ) : (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-sans font-medium text-slate-600 bg-[#E2E6EC] rounded-full">
                  <span>⌘</span>
                  <span>K</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Only '+ New Product' added, Bell with red 1, Fullscreen & Admin Avatar */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* The ONE extra requested element: '+ New Product' button */}
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xs hover:shadow transition-all cursor-pointer"
            title="Create new furniture product"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New Product</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* Notification Bell with dynamic unread count badge */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowProfileMenu(false)
              }}
              className="relative p-1.5 text-slate-800 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center justify-center"
              aria-label="View notifications"
              title={unreadAlerts.length > 0 ? `${unreadAlerts.length} unread alerts` : 'Notifications & Alerts'}
            >
              <Bell className="w-5 h-5 stroke-[1.85]" />
              {/* Dynamic red badge showing real unread count */}
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs pointer-events-none animate-in zoom-in-75">
                  {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-3.5 sm:p-4 overflow-hidden animate-in fade-in slide-in-from-top-2 text-slate-800">
                  {/* Top Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          Notifications & Alerts
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Live manufacturing & inquiry alerts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {unreadAlerts.length > 0 ? (
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold border border-rose-200/60">
                          {unreadAlerts.length} new
                        </span>
                      ) : (
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-200/60">
                          All caught up
                        </span>
                      )}
                      {unreadAlerts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllAlertsAsRead(allAlerts.map((a) => a.id))}
                          className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-slate-100"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span className="hidden sm:inline">Read all</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 pt-2 pb-1 border-b border-slate-100 overflow-x-auto text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAlertFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                        alertFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      All ({allAlerts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertFilter('leads')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                        alertFilter === 'leads'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      Inquiries ({allAlerts.filter((a) => a.type === 'lead').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertFilter('orders')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                        alertFilter === 'orders'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      Orders ({allAlerts.filter((a) => a.type === 'order').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertFilter('stock')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                        alertFilter === 'stock'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      Stock ({allAlerts.filter((a) => a.type === 'stock').length})
                    </button>
                  </div>

                  {/* Scrollable Alerts List */}
                  <div className="mt-2 space-y-2 max-h-80 overflow-y-auto pr-1">
                    {filteredAlerts.length > 0 ? (
                      filteredAlerts.map((alert) => {
                        const isRead = readAlertIds.includes(alert.id)
                        const IconComponent = alert.icon

                        return (
                          <div
                            key={alert.id}
                            onClick={() => {
                              markAlertAsRead(alert.id)
                              setCurrentView(alert.targetView)
                              setShowNotifications(false)
                            }}
                            className={`p-2.5 rounded-xl border transition cursor-pointer relative group flex items-start gap-2.5 ${
                              isRead
                                ? 'bg-white hover:bg-slate-50 border-slate-200/70 text-slate-600'
                                : 'bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-900 shadow-2xs'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${alert.iconBg} ${alert.iconColor}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-xs truncate ${isRead ? 'text-slate-700 font-medium' : 'text-slate-900 font-bold'}`}>
                                  {alert.title}
                                </span>
                                <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${alert.badgeClass} shrink-0`}>
                                  {alert.badge}
                                </span>
                              </div>
                              <p className="text-[11.5px] text-slate-500 mt-0.5 line-clamp-1 leading-snug">
                                {alert.message}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 mt-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{alert.timeAgo}</span>
                                {!isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Unread alert" />
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAlertAsRead(alert.id)
                              }}
                              className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-600 rounded-md transition opacity-0 group-hover:opacity-100"
                              title="Dismiss alert"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                        <CheckCircle className="w-9 h-9 text-emerald-500/80" />
                        <span className="font-semibold text-slate-700">No active alerts</span>
                        <span className="text-[11px] text-slate-400">All factory queues and inquiries are up to date!</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Footer Shortcuts */}
                  <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('leads')
                        setShowNotifications(false)
                      }}
                      className="text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                    >
                      Inquiries →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('orders')
                        setShowNotifications(false)
                      }}
                      className="text-sky-700 hover:text-sky-800 font-semibold cursor-pointer"
                    >
                      Orders →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('products')
                        setShowNotifications(false)
                      }}
                      className="text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      Inventory →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Fullscreen Expand Icon Button (using Maximize 4 corners matching reference) */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1 text-slate-800 hover:text-slate-950 transition-colors hidden sm:flex items-center justify-center cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 stroke-[1.85]" />
            ) : (
              <Maximize className="w-5 h-5 stroke-[1.85]" />
            )}
          </button>

          {/* Admin Profile Section (Matching reference with circular avatar, Admin, Administrator & Chevron) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu)
                setShowNotifications(false)
              }}
              className="flex items-center gap-2.5 py-1 px-1 rounded-xl hover:bg-slate-50 transition cursor-pointer text-left"
              aria-label="User Profile Menu"
            >
              {/* Circular Avatar Photo */}
              <img
                src={
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80'
                }
                alt={user?.name || 'Admin'}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200/90 shadow-xs shrink-0"
              />

              {/* Name & Subtitle */}
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[13px] font-bold text-slate-950 font-sans truncate max-w-[120px]">
                  {user?.name || 'Admin'}
                </span>
                <span className="text-[11px] text-slate-500 font-normal capitalize">
                  {user?.role ? user.role.replace('_', ' ') : 'Administrator'}
                </span>
              </div>

              {/* Chevron Down */}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-0.5" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 text-slate-700 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Admin'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@brothersfurniture.co.in'}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {user?.role ? user.role.replace('_', ' ') : 'SUPER ADMIN'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        setIsProfileModalOpen(true)
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/80 rounded-lg transition cursor-pointer shrink-0"
                      title="Edit Profile"
                    >
                      Edit
                    </button>
                  </div>

                  {/* My Profile & Photo button */}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      setIsProfileModalOpen(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg bg-orange-50/60 hover:bg-orange-100/80 text-orange-950 transition cursor-pointer mt-1"
                  >
                    <User className="w-3.5 h-3.5 text-orange-600" />
                    <span>My Profile & Photo</span>
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setCurrentView('admins')
                        setShowProfileMenu(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 transition text-slate-700 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Admin Team & Roles</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setCurrentView('settings')
                      setShowProfileMenu(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 transition text-slate-700 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Store & Factory Settings</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      setIsLogoutModalOpen(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Profile Edit & Photo Upload Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />

      {/* Mobile Search Overlay Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 animate-fade-in sticky top-16 z-20 shadow-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getSearchPlaceholder()}
              style={{ paddingLeft: '38px', paddingRight: '38px' }}
              className="w-full h-10 bg-[#F1F3F7] focus:bg-white border border-transparent focus:border-slate-300 rounded-full text-xs leading-normal text-slate-800 placeholder:text-slate-400 placeholder:font-normal placeholder:truncate focus:outline-none focus:ring-2 focus:ring-slate-200/80 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 font-medium"
          >
            Cancel
          </button>
        </div>
      )}
    </>
  )
}
