import {
  Building2,
  FileText,
  Home,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import logoImg from '../../assets/logo.png'
import { useAdmin } from '../../context/AdminContext'
import { useAuth } from '../../context/AuthContext'
import type { AdminView } from '../../types/admin'

interface SidebarProps {
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

interface NavItem {
  id: AdminView
  label: string
  icon: React.ComponentType<{ className?: string }>
  matchViews?: AdminView[]
  badge?: string | number
  badgeColor?: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { currentView, setCurrentView, totalBinCount } = useAdmin()
  const { admins } = useAuth()
  const pendingAdminsCount = admins.filter((a) => a.status === 'pending_approval').length

  const sections: NavSection[] = [
    {
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          matchViews: ['dashboard'],
        },
      ],
    },
    {
      title: 'PRODUCT',
      items: [
        {
          id: 'products',
          label: 'Products',
          icon: Package,
          matchViews: ['products'],
        },
        {
          id: 'categories',
          label: 'Settings',
          icon: SlidersHorizontal,
          matchViews: ['categories', 'product-settings'],
        },
        {
          id: 'recycle-bin',
          label: 'Recycle Bin',
          icon: Trash2,
          matchViews: ['recycle-bin'],
          badge: totalBinCount > 0 ? totalBinCount : undefined,
          badgeColor: 'bg-rose-100 text-rose-700 font-bold',
        },
      ],
    },
    {
      title: 'ORDERS & INQUIRIES',
      items: [
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingCart,
          matchViews: ['orders'],
        },
        {
          id: 'leads',
          label: 'Inquiries',
          icon: MessageSquare,
          matchViews: ['leads'],
        },
        {
          id: 'testimonials',
          label: 'Reviews',
          icon: Star,
          matchViews: ['testimonials'],
        },
      ],
    },
    {
      title: 'BUSINESS',
      items: [
        {
          id: 'clients',
          label: 'Corporate Clients',
          icon: Building2,
          matchViews: ['clients'],
        },
        {
          id: 'quotations',
          label: 'Quotations',
          icon: FileText,
          matchViews: ['quotations'],
        },
      ],
    },
    {
      title: 'SETTINGS & TEAM',
      items: [
        {
          id: 'admins',
          label: 'Admin Team & Roles',
          icon: Users,
          matchViews: ['admins'],
          badge: pendingAdminsCount > 0 ? pendingAdminsCount : undefined,
          badgeColor: 'bg-amber-100 text-amber-800',
        },
        {
          id: 'settings',
          label: 'Store Settings',
          icon: Settings,
          matchViews: ['settings'],
        },
      ],
    },
  ]

  const handleNavClick = (viewId: AdminView) => {
    setCurrentView(viewId)
    setIsMobileOpen(false)
  }

  const renderNavContent = () => (
    <div className="flex flex-col h-full bg-white select-none overflow-hidden">
      {/* Brand Logo Header */}
      <div
        style={{
          padding: '24px 20px 20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => handleNavClick('dashboard')}
          className="focus:outline-none cursor-pointer flex items-center"
          title="Brothers Furniture"
        >
          <img
            src={logoImg}
            alt="Brother Furniture"
            style={{
              height: '36px',
              width: 'auto',
              maxWidth: '175px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections with clear center gap between logo & dashboard and between topics */}
      <nav
        className="flex-1 overflow-y-auto sidebar-scrollbar flex flex-col"
        style={{
          paddingLeft: '14px',
          paddingRight: '14px',
          paddingTop: '20px',
          paddingBottom: '32px',
          gap: '28px',
        }}
      >
        {sections.map((section, sIdx) => {
          return (
            <div key={sIdx} className="flex flex-col" style={{ gap: '6px' }}>
              {section.title && (
                <div
                  style={{
                    paddingLeft: '16px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#7C8BA1',
                  }}
                >
                  {section.title}
                </div>
              )}
              <div className="flex flex-col" style={{ gap: '3px' }}>
                {section.items.map((item) => {
                  const isActive = item.matchViews
                    ? item.matchViews.includes(currentView)
                    : currentView === item.id
                  const IconComponent = item.icon

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      style={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        paddingLeft: '16px',
                        paddingRight: '12px',
                        paddingTop: '9px',
                        paddingBottom: '9px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className={
                        isActive
                          ? 'bg-[#FFF7ED] text-[#EA580C] font-semibold border border-orange-200/60 shadow-[0_1px_2px_rgba(234,88,12,0.06)]'
                          : 'text-[#4B5563] font-medium hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }
                    >
                      {/* Orange Vertical Left Indicator on Active Item */}
                      {isActive && (
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '4px',
                            height: '22px',
                            backgroundColor: '#F97316',
                            borderTopRightRadius: '3px',
                            borderBottomRightRadius: '3px',
                          }}
                        />
                      )}

                      <IconComponent
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#EA580C] stroke-[2]'
                            : 'text-[#6B7280] group-hover:text-slate-800 stroke-[1.8]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`ml-auto px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                            item.badgeColor || 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar (Sticky full height on left with balanced width) */}
      <aside className="hidden lg:flex flex-col w-[235px] shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200/80 z-20 shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-[235px] max-w-[85vw] bg-white border-r border-slate-200 flex flex-col h-full shadow-2xl z-10 animate-fade-in">
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  )
}
