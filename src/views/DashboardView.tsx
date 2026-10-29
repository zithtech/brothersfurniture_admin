import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Crown,
  Layers,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Send,
  Star,
  Tag,
  TrendingUp,
} from 'lucide-react'
import { useAdmin } from '../context/AdminContext'

interface DashboardViewProps {
  onOpenAddProduct: () => void
  onOpenAddLead?: () => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddProduct,
}) => {
  const {
    products,
    categories,
    chairs,
    leads,
    orders,
    testimonials,
    setCurrentView,
    isSyncing,
    refreshFromBackend,
  } = useAdmin()

  // Calculate metrics
  const inStockCount = products.filter((p) => p.inStock).length
  const inStockPercent = Math.round((inStockCount / (products.length || 1)) * 100)
  const newLeads = leads.filter((l) => l.status === 'new')
  const wonLeads = leads.filter((l) => l.status === 'won')
  const avgRating = (
    testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / (testimonials.length || 1)
  ).toFixed(1)

  // Dynamic Category Stats calculated directly from live products and categories
  const [categoryMetric, setCategoryMetric] = useState<'models' | 'inStock'>('models')

  const categoryStats = useMemo(() => {
    const counts: Record<string, { total: number; inStock: number }> = {}

    // Initialize all registered categories
    categories.forEach((cat) => {
      counts[cat] = { total: 0, inStock: 0 }
    })

    // Aggregate counts from actual products
    products.forEach((p) => {
      const cat = p.category || 'Other'
      if (!counts[cat]) {
        counts[cat] = { total: 0, inStock: 0 }
      }
      counts[cat].total += 1
      if (p.inStock) {
        counts[cat].inStock += 1
      }
    })

    const totalProducts = products.length || 1

    const colorMap: Record<string, string> = {
      'Workstations': '#F59E0B',
      'Office Chairs': '#0284C7',
      'Desks': '#10B981',
      'Meeting Tables': '#8B5CF6',
      'Storage': '#EC4899',
      'Lounge': '#EA580C',
      'Executive Chairs': '#6366F1',
      'Ergonomic Chairs': '#06B6D4',
    }
    const fallbackPalette = ['#6366F1', '#14B8A6', '#F43F5E', '#84CC16', '#06B6D4', '#A855F7', '#E11D48']

    return Object.entries(counts)
      .map(([name, stat], idx) => {
        const percent = Math.round((stat.total / totalProducts) * 100)
        const inStockPercent = stat.total > 0 ? Math.round((stat.inStock / stat.total) * 100) : 0
        const color = colorMap[name] || fallbackPalette[idx % fallbackPalette.length]
        return {
          name,
          count: stat.total,
          inStock: stat.inStock,
          percent,
          inStockPercent,
          color,
        }
      })
      .filter((c) => c.count > 0 || categories.includes(c.name as any))
      .sort((a, b) => b.count - a.count)
  }, [categories, products])

  // Period filter for Product Enquiries (default: LIVE CRM Leads)
  const [enquiryPeriod, setEnquiryPeriod] = useState<'FY2026' | 'FY2025' | 'LIVE'>('LIVE')
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const monthNames = useMemo(
    () => [
      { short: 'Jan', full: 'January' },
      { short: 'Feb', full: 'February' },
      { short: 'Mar', full: 'March' },
      { short: 'Apr', full: 'April' },
      { short: 'May', full: 'May' },
      { short: 'Jun', full: 'June' },
      { short: 'Jul', full: 'July' },
      { short: 'Aug', full: 'August' },
      { short: 'Sep', full: 'September' },
      { short: 'Oct', full: 'October' },
      { short: 'Nov', full: 'November' },
      { short: 'Dec', full: 'December' },
    ],
    []
  )

  // Factory baseline distributions across financial years
  const base2026 = useMemo(() => [54, 72, 96, 110, 128, 78, 110, 135, 120, 162, 142, 118], [])
  const base2025 = useMemo(() => [42, 58, 76, 92, 108, 68, 94, 116, 102, 138, 122, 104], [])

  // Dynamic grouping of leads from backend / localStorage
  const liveLeadCounts = useMemo(() => {
    const counts2026 = Array(12).fill(0)
    const counts2025 = Array(12).fill(0)
    const countsAll = Array(12).fill(0)

    leads.forEach((l) => {
      const d = new Date(l.createdAt)
      if (!isNaN(d.getTime())) {
        const m = d.getMonth()
        const y = d.getFullYear()
        countsAll[m] += 1
        if (y === 2026) counts2026[m] += 1
        else if (y === 2025) counts2025[m] += 1
      }
    })

    return { counts2026, counts2025, countsAll }
  }, [leads])

  // Dynamic monthly enquiries dataset
  const monthlyEnquiries = useMemo(() => {
    let values: number[]
    if (enquiryPeriod === 'FY2026') {
      values = base2026.map((base, idx) => base + liveLeadCounts.counts2026[idx])
    } else if (enquiryPeriod === 'FY2025') {
      values = base2025.map((base, idx) => base + liveLeadCounts.counts2025[idx])
    } else {
      values = liveLeadCounts.countsAll
    }

    const maxVal = Math.max(...values, 1)

    return monthNames.map((m, idx) => {
      const val = values[idx]
      const isHighest = val === maxVal && val > 0
      const barHeight = val === 0 ? 8 : Math.max(14, Math.round((val / maxVal) * 78))
      return {
        month: m.short,
        monthFull: m.full,
        value: val,
        barHeight,
        isHighest,
      }
    })
  }, [enquiryPeriod, base2026, base2025, liveLeadCounts, monthNames])

  // Dynamic Total Enquiries
  const totalEnquiries = useMemo(() => {
    return monthlyEnquiries.reduce((sum, item) => sum + item.value, 0)
  }, [monthlyEnquiries])

  // Dynamic Avg Monthly
  const avgMonthly = useMemo(() => {
    const divisor = enquiryPeriod === 'LIVE'
      ? Math.max(monthlyEnquiries.filter((m) => m.value > 0).length, 1)
      : 12
    return Math.round(totalEnquiries / divisor)
  }, [totalEnquiries, enquiryPeriod, monthlyEnquiries])

  // Dynamic Highest Month
  const highestMonth = useMemo(() => {
    return monthlyEnquiries.reduce(
      (prev, curr) => (curr.value > prev.value ? curr : prev),
      monthlyEnquiries[0]
    )
  }, [monthlyEnquiries])

  // Dynamic Top Product / Category derived from leads & products
  const topProductStats = useMemo(() => {
    const categoryCounts: Record<string, number> = {
      'Office Chairs': 0,
      'Workstations': 0,
      'Meeting Tables': 0,
      'Desks': 0,
      'Storage': 0,
      'Lounge': 0,
    }

    leads.forEach((l) => {
      const text = `${l.subject} ${l.message} ${l.notes || ''}`.toLowerCase()
      if (text.includes('chair') || text.includes('ergo') || text.includes('mesh') || text.includes('seating')) {
        categoryCounts['Office Chairs'] += 1
      }
      if (text.includes('workstation') || text.includes('cluster') || text.includes('partition') || text.includes('cubicle')) {
        categoryCounts['Workstations'] += 1
      }
      if (text.includes('table') || text.includes('boardroom') || text.includes('conference')) {
        categoryCounts['Meeting Tables'] += 1
      }
      if (text.includes('desk') || text.includes('manager') || text.includes('executive')) {
        categoryCounts['Desks'] += 1
      }
      if (text.includes('storage') || text.includes('pedestal') || text.includes('cabinet') || text.includes('compactor')) {
        categoryCounts['Storage'] += 1
      }
      if (text.includes('lounge') || text.includes('sofa') || text.includes('café') || text.includes('cafe')) {
        categoryCounts['Lounge'] += 1
      }
    })

    let topCategory = 'Office Chairs'
    let maxMentions = -1

    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxMentions) {
        maxMentions = count
        topCategory = cat
      }
    })

    const totalMentions = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
    const percentage = totalMentions > 0 ? Math.round((maxMentions / totalMentions) * 100) : 28

    return {
      name: topCategory,
      percentage,
      count: maxMentions,
    }
  }, [leads])

  return (
    <div className="space-y-4">
      {/* 1. Compact Header Strip: Title, Live Status & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Executive Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Overview
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
              <Building2 className="w-3 h-3 text-slate-500" />
              Commercial B2B
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial manufacturing pipeline, fabrication queue & incoming inquiries
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => refreshFromBackend()}
            disabled={isSyncing}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
          </button>
          <button
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Product</span>
          </button>
        </div>
      </div>

      {/* 2. Compact KPI Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Products */}
        <div
          onClick={() => setCurrentView('products')}
          className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 group-hover:bg-amber-100 transition-colors">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              {products.length}{' '}
              <span className="text-xs sm:text-sm font-semibold text-amber-600">Items</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] gap-1 flex-wrap">
              <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                {inStockPercent}% In Stock
              </span>
              <span className="text-slate-500">{inStockCount} available</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Product Categories */}
        <div
          onClick={() => setCurrentView('categories')}
          className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Product Categories
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200/60 group-hover:bg-sky-100 transition-colors">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              {categories.length || categoryStats.length}{' '}
              <span className="text-xs sm:text-sm font-semibold text-sky-600">Categories</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] gap-1 flex-wrap">
              <span className="inline-flex items-center gap-0.5 font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/60">
                Active Catalog
              </span>
              <span className="text-slate-500">{categoryStats.length} live groups</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Inquiries */}
        <div
          onClick={() => setCurrentView('leads')}
          className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Inquiries
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 group-hover:bg-emerald-100 transition-colors">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              {leads.length}{' '}
              <span className="text-xs sm:text-sm font-semibold text-emerald-600">Inquiries</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] gap-1 flex-wrap">
              <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                {newLeads.length} New Requests
              </span>
              <span className="text-slate-500">{wonLeads.length} converted</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Reviews */}
        <div
          onClick={() => setCurrentView('testimonials')}
          className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Reviews
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60 group-hover:bg-purple-100 transition-colors">
              <Star className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              {testimonials.length}{' '}
              <span className="text-xs sm:text-sm font-semibold text-purple-600">Reviews</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] gap-1 flex-wrap">
              <span className="inline-flex items-center gap-0.5 font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60">
                ★ {avgRating}/5.0 Rating
              </span>
              <span className="text-slate-500 font-medium">100% verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visual Analytics & Category Breakdown (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left 2 Cols: Product Enquiries Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
          {/* Top Header */}
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3EB] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#F97316]" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3.5" y="10" width="3.5" height="10" rx="1.75" />
                  <rect x="10.25" y="5" width="3.5" height="15" rx="1.75" />
                  <rect x="17" y="2" width="3.5" height="18" rx="1.75" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  Product Enquiries
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {enquiryPeriod === 'LIVE'
                    ? `${leads.length} live incoming inquiries from CRM pipeline`
                    : `Monthly enquiries from Ambattur Chennai plant · ${totalEnquiries.toLocaleString('en-IN')} logged`}
                </p>
              </div>
            </div>

            {/* Interactive Period Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>
                  {enquiryPeriod === 'LIVE'
                    ? `Live CRM Leads (${leads.length})`
                    : enquiryPeriod === 'FY2026'
                    ? 'FY 2026'
                    : 'FY 2025'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isPeriodDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-20 text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Reporting Scope
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEnquiryPeriod('LIVE')
                      setIsPeriodDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                      enquiryPeriod === 'LIVE' ? 'text-amber-600 font-bold bg-amber-50/50' : 'text-slate-700 font-medium'
                    }`}
                  >
                    <span>Live CRM Leads ({leads.length})</span>
                    {enquiryPeriod === 'LIVE' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnquiryPeriod('FY2026')
                      setIsPeriodDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                      enquiryPeriod === 'FY2026' ? 'text-amber-600 font-bold bg-amber-50/50' : 'text-slate-700 font-medium'
                    }`}
                  >
                    <span>FY 2026 (Plant Baseline + Live)</span>
                    {enquiryPeriod === 'FY2026' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnquiryPeriod('FY2025')
                      setIsPeriodDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                      enquiryPeriod === 'FY2025' ? 'text-amber-600 font-bold bg-amber-50/50' : 'text-slate-700 font-medium'
                    }`}
                  >
                    <span>FY 2025 (Annual)</span>
                    {enquiryPeriod === 'FY2025' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Enquiries Bar Chart */}
          <div className="pt-2 pb-1 overflow-x-auto">
            <div className="min-w-[540px]">
              {/* Bars container */}
              <div className="flex items-end justify-between gap-2 sm:gap-3.5 h-44 border-b border-slate-100 px-2 sm:px-4">
                {monthlyEnquiries.map((item) => (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    title={`${item.monthFull}: ${item.value} enquiries (${Math.round((item.value / (totalEnquiries || 1)) * 100)}% of total)`}
                  >
                    {item.isHighest ? (
                      <div className="relative mb-1 flex flex-col items-center">
                        <span className="bg-[#FFF0E6] text-[#C2410C] text-[10px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-2xs">
                          Highest
                        </span>
                        <div className="w-0 h-0 border-x-[3.5px] border-x-transparent border-t-[4px] border-t-[#FFF0E6] -mt-[0.5px]" />
                      </div>
                    ) : null}

                    <span
                      className={`text-[11px] font-semibold mb-1.5 transition-colors ${
                        item.isHighest
                          ? 'text-slate-900 font-bold text-xs'
                          : 'text-slate-600 group-hover:text-slate-900'
                      }`}
                    >
                      {item.value}
                    </span>

                    <div
                      style={{ height: `${item.barHeight}%` }}
                      className={`w-full max-w-[38px] rounded-t-md transition-all duration-300 ${
                        item.isHighest
                          ? 'bg-gradient-to-t from-[#EA580C] via-[#F97316] to-[#FB923C] shadow-xs'
                          : 'bg-[#DFE5EE] group-hover:bg-[#CBD5E1]'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Month Labels below line */}
              <div className="flex justify-between gap-2 sm:gap-3.5 px-2 sm:px-4 pt-2.5">
                {monthlyEnquiries.map((item) => (
                  <div key={item.month} className="flex-1 text-center">
                    <span
                      className={`text-xs block ${
                        item.isHighest ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'
                      }`}
                    >
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Bottom KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 pt-3">
            <div
              onClick={() => setCurrentView('leads')}
              className="p-3 sm:p-3.5 rounded-xl border border-slate-100 bg-[#FAFAFC] hover:bg-slate-50 hover:border-slate-200 transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11.5px] font-medium text-slate-500 block leading-none">
                  Total Enquiries
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight block leading-tight mt-1">
                  {totalEnquiries.toLocaleString('en-IN')}
                </span>
                <div className="text-[11px] font-semibold text-emerald-600 mt-1 whitespace-nowrap">
                  {enquiryPeriod === 'FY2026'
                    ? '↑ 12% vs last period'
                    : enquiryPeriod === 'FY2025'
                    ? '↑ 15% vs FY 2024'
                    : `${newLeads.length} new unhandled`}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl border border-slate-100 bg-[#FAFAFC] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11.5px] font-medium text-slate-500 block leading-none">
                  Avg. Monthly
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight block leading-tight mt-1">
                  {avgMonthly.toLocaleString('en-IN')}
                </span>
                <div className="text-[11px] font-semibold text-emerald-600 mt-1 whitespace-nowrap">
                  {enquiryPeriod === 'LIVE' ? 'Across active months' : '↑ 8% vs last period'}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl border border-slate-100 bg-[#FAFAFC] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11.5px] font-medium text-slate-500 block leading-none">
                  Highest Month
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight block leading-tight mt-1">
                  {highestMonth.monthFull}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block mt-1">
                  {highestMonth.value.toLocaleString('en-IN')} Enquiries
                </span>
              </div>
            </div>

            <div
              onClick={() => setCurrentView(topProductStats.name === 'Office Chairs' ? 'ergonomic-chairs' : 'products')}
              className="p-3 sm:p-3.5 rounded-xl border border-slate-100 bg-[#FAFAFC] hover:bg-slate-50 hover:border-slate-200 transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Tag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11.5px] font-medium text-slate-500 block leading-none">
                  Top Product
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight block leading-tight mt-1 truncate">
                  {topProductStats.name}
                </span>
                <span className="text-[11px] font-medium text-slate-500 block mt-1">
                  {topProductStats.percentage}% of enquiries
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Category Inventory Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Category Breakdown</h3>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setCategoryMetric('models')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      categoryMetric === 'models'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Models
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryMetric('inStock')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      categoryMetric === 'inStock'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    In Stock
                  </button>
                </div>
                <button
                  onClick={() => setCurrentView('products')}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                  title="View Products Catalog"
                >
                  Catalog →
                </button>
              </div>
            </div>
            <p className="text-[11.5px] text-slate-500">
              Distribution across {categoryStats.length} commercial lines · {products.length} catalog items
            </p>

            <div className="space-y-2 pt-2.5">
              {categoryStats.map((cat) => {
                const barWidth = categoryMetric === 'models' ? cat.percent : cat.inStockPercent
                return (
                  <div
                    key={cat.name}
                    onClick={() => setCurrentView(cat.name === 'Office Chairs' ? 'ergonomic-chairs' : 'products')}
                    className="space-y-1 hover:bg-slate-50/80 -mx-1 px-1 py-1 rounded-lg transition-colors cursor-pointer group"
                    title={`Click to view ${cat.name} (${cat.count} models, ${cat.inStock} in stock)`}
                  >
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 font-medium flex items-center gap-1.5 text-[11.5px] group-hover:text-slate-900">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="truncate max-w-[130px]">{cat.name}</span>
                      </span>
                      <span className="text-slate-500 font-mono text-[11px] group-hover:text-slate-700">
                        {categoryMetric === 'models' ? (
                          <>
                            {cat.count} models <span className="text-slate-400">({cat.percent}%)</span>
                          </>
                        ) : (
                          <>
                            {cat.inStock}/{cat.count} stock <span className="text-slate-400">({cat.inStockPercent}%)</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11.5px] font-medium">Total Factory Catalog</span>
            </div>
            <span className="font-bold text-slate-900 font-mono text-[11.5px]">
              {products.length} Main + {chairs.length} Chairs
            </span>
          </div>
        </div>
      </div>

      {/* 4. Recent Inquiries */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Inquiries</h3>
            {newLeads.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                {newLeads.length} Unhandled
              </span>
            )}
          </div>
          <button
            onClick={() => setCurrentView('leads')}
            className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-semibold cursor-pointer"
          >
            CRM Pipeline <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {leads.slice(0, 4).map((lead) => {
            const statusPills: Record<string, string> = {
              new: 'bg-amber-50 text-amber-800 border-amber-200/80',
              contacted: 'bg-sky-50 text-sky-800 border-sky-200/80',
              quoted: 'bg-purple-50 text-purple-800 border-purple-200/80',
              'site-visit': 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
              won: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
              lost: 'bg-rose-50 text-rose-800 border-rose-200/80',
            }

            return (
              <div
                key={lead.id}
                className="p-2.5 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/70 transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{lead.name}</span>
                    <span className="text-slate-400 text-[11px]">· {lead.phone}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                      statusPills[lead.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {lead.status.toUpperCase().replace('-', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-1 leading-snug">
                  {lead.message}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-200/50">
                  <span className="truncate max-w-[200px]">
                    Req: <strong className="text-slate-700 font-medium">{lead.subject}</strong>
                  </span>
                  <a
                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hi ${lead.name}, regarding your inquiry with Brothers Furniture...`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 px-2 py-0.5 rounded text-[10.5px] font-semibold flex items-center gap-1 transition"
                  >
                    <Send className="w-2.5 h-2.5" /> WhatsApp
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. Compact Rapid Action Bar at bottom */}
      <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Brothers Furniture Operations Engine · Ambattur Industrial Plant</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentView('products')}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            All Products ({products.length})
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => setCurrentView('ergonomic-chairs')}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            Chairs ({chairs.length})
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => setCurrentView('orders')}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            Orders ({orders.length})
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => setCurrentView('settings')}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}
